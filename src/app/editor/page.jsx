"use client";

/* ==========================
   Import dependencies & komponen
========================== */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { extractAllRows, getXlsxSheets } from "@/lib/api";
import { runAutomation } from "@/app/actions/runAutomation";
import { saveEditorState, loadEditorState, clearEditorState, saveExecutionLog } from "@/lib/sessionStorage";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import TargetConfiguration from "@/app/editor/components/target/TargetConfiguration";
import DataSourceSection from "@/app/editor/components/data-source/DataSourceSection";
import FieldMappingSection from "@/app/editor/components/field-mapping/FieldMappingSection";
import ActionFlowSection from "@/app/editor/components/actions/ActionFlowSection";
import AutomationPlanPreview from "@/app/editor/components/execution/AutomationPlanPreview";
import ExecutionReport from "@/app/editor/components/execution/ExecutionReport";
import AssistedRepairDialog from "@/app/editor/components/execution/AssistedRepairDialog";
import CardNode from "./components/nodes/CardNode";
import AddDataSourceNode from "./components/data-source/AddDataSourceNode";
import PaletteNode from "./components/nodes/PaletteNode";
import ActionNode from "./components/actions/ActionNode";
import ActionNodeEditor from "./components/actions/ActionNodeEditor";
import { useEditor } from "./context/EditorContext";
import {
  NODE_IDS,
  NODE_SPACING,
  DEFAULT_POSITIONS,
  findNodeById,
  filterNodesByIds,
  getActionNodes,
  sortNodesByY,
  getLastNodeY,
  generateActionId,
  determineActionSource,
  isLastAction,
  calculateActionPosition,
} from "./utils/nodeHelpers";
import {
  createEdge,
  filterEdgesByNodes,
  filterEdgesByNode,
  findEdgeByTarget,
  findEdgeBySource,
  hasEdge,
  reconnectEdgesAfterNodeDeletion,
  reconnectEdgesAfterDataSourceDeletion,
  createDataSourceEdges,
} from "./utils/edgeHelpers";
import { validateAutomationPlan } from "./utils/validationHelpers";

/* ==========================
   Utility: Elemen node ReactFlow default
========================== */
function getDefaultNodes(hasDataSource = false) {
  const baseNodes = [
    {
      id: "target",
      type: "card",
      position: { x: 60, y: 40 },
      data: {
        title: "Target",
        subtitle: "URL, login, navigasi, page-ready indicator",
        panel: "target",
      },
      deletable: false, // Node tidak bisa dihapus
    },
    {
      id: "preview",
      type: "card",
      position: { x: 60, y: 200 },
      data: {
        title: "Preview & Report",
        subtitle: "Lihat plan dan hasil eksekusi",
        panel: "preview",
      },
      deletable: false, // Node tidak bisa dihapus
    },
  ];

  return baseNodes;
}

/* ==========================
   Utility: Edge/graf ReactFlow default
========================== */
function getDefaultEdges() {
  return [
    // Edges akan dibuat dinamis berdasarkan node action yang ada
  ];
}

/* =============================================================
   Komponen Utama: EditorPage
============================================================= */
export default function EditorPage() {
  const searchParams = useSearchParams();
  
  /* -----------------------------------
     ReactFlow state terkait canvas visual editor
  ----------------------------------- */
  const nodeTypes = useMemo(
    () => ({
      card: CardNode,
      addDataSource: AddDataSourceNode,
      action: ActionNode,
    }),
    []
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(
    getDefaultNodes(false)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(getDefaultEdges());
  const [activePanel, setActivePanel] = useState("target");
  const [selectedNode, setSelectedNode] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  /* -----------------------------------
     Effect: Handle ESC key untuk menutup context menu
  ----------------------------------- */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [contextMenu]);

  /* -----------------------------------
     Handler: Custom onNodesChange untuk mencegah penghapusan node target dan preview
     dan auto-hapus node data/mapping jika salah satunya dihapus
  ----------------------------------- */
  const handleNodesChange = (changes) => {
    // Deteksi penghapusan node data atau mapping
    const removeChanges = changes.filter((change) => change.type === "remove");
    const nodesToRemove = new Set();

    removeChanges.forEach((change) => {
      const nodeId = change.id;
      // Jika menghapus node data atau mapping, hapus keduanya
      if (nodeId === "data" || nodeId === "mapping") {
        nodesToRemove.add("data");
        nodesToRemove.add("mapping");
      } else {
        nodesToRemove.add(nodeId);
      }
    });

    // Filter out remove changes untuk node yang tidak boleh dihapus
    const filteredChanges = changes.filter((change) => {
      if (change.type === "remove") {
        const nodeId = change.id;
        // Mencegah penghapusan node target dan preview
        if (nodeId === "target" || nodeId === "preview") {
          return false;
        }

        // Jika node data atau mapping dihapus, handle secara khusus
        if (nodeId === NODE_IDS.DATA || nodeId === NODE_IDS.MAPPING) {
          // Hapus kedua node (data dan mapping) dan update edges
          setNodes((prev) => {
            const newNodes = filterNodesByIds(prev, [
              NODE_IDS.DATA,
              NODE_IDS.MAPPING,
            ]);

            // Update edges menggunakan helper function
            setEdges((prevEdges) =>
              reconnectEdgesAfterDataSourceDeletion(prevEdges, newNodes)
            );

            return newNodes;
          });

          // Reset data source state
          setRows([]);
          setManualRows([{}]);
          setManualColumns(["field1"]);
          setFieldMappings([]);

          return false; // Jangan proses change ini lagi
        }

        // Handle penghapusan action node: auto-reconnect node sebelum dan sesudah
        if (nodeId.startsWith("action-")) {
          setNodes((prev) => {
            const deletedNode = prev.find((n) => n.id === nodeId);
            if (!deletedNode) return prev;

            const newNodes = prev.filter((n) => n.id !== nodeId);
            const remainingActionNodes = newNodes.filter(
              (n) => n.type === "action"
            );

            // Update edges untuk reconnect
            setEdges((prevEdges) => {
              // Cari edge yang masuk ke node yang dihapus dan edge yang keluar
              const incomingEdge = prevEdges.find((e) => e.target === nodeId);
              const outgoingEdge = prevEdges.find((e) => e.source === nodeId);

              // Hapus edge yang terkait dengan node yang dihapus
              let newEdges = prevEdges.filter(
                (e) => e.source !== nodeId && e.target !== nodeId
              );

              // Tentukan node sebelum dan sesudah berdasarkan posisi Y
              const actionBefore = remainingActionNodes
                .filter((n) => n.position.y < deletedNode.position.y)
                .sort((a, b) => b.position.y - a.position.y)[0];

              const actionAfter = remainingActionNodes
                .filter((n) => n.position.y > deletedNode.position.y)
                .sort((a, b) => a.position.y - b.position.y)[0];

              // Reconnect logic
              if (incomingEdge && outgoingEdge) {
                // Node tengah: connect incoming source ke outgoing target
                const newEdgeId = `e-${incomingEdge.source}-${outgoingEdge.target}`;
                if (!newEdges.some((e) => e.id === newEdgeId)) {
                  newEdges.push({
                    id: newEdgeId,
                    source: incomingEdge.source,
                    target: outgoingEdge.target,
                    animated: true,
                  });
                }
              } else if (incomingEdge && !outgoingEdge) {
                // Node terakhir: connect incoming ke preview
                const newEdgeId = `e-${incomingEdge.source}-preview`;
                if (!newEdges.some((e) => e.id === newEdgeId)) {
                  newEdges.push({
                    id: newEdgeId,
                    source: incomingEdge.source,
                    target: "preview",
                    animated: true,
                  });
                }
              } else if (!incomingEdge && outgoingEdge) {
                // Node pertama: connect dari mapping/target ke outgoing target
                const mappingNode = newNodes.find((n) => n.id === "mapping");
                const sourceId = mappingNode ? "mapping" : "target";
                const newEdgeId = `e-${sourceId}-${outgoingEdge.target}`;
                if (!newEdges.some((e) => e.id === newEdgeId)) {
                  newEdges.push({
                    id: newEdgeId,
                    source: sourceId,
                    target: outgoingEdge.target,
                    animated: true,
                  });
                }
              }

              // Pastikan action node terakhir selalu connect ke preview
              if (remainingActionNodes.length > 0) {
                const sortedActions = [...remainingActionNodes].sort(
                  (a, b) => a.position.y - b.position.y
                );
                const lastAction = sortedActions[sortedActions.length - 1];
                const lastActionToPreviewId = `e-${lastAction.id}-preview`;

                if (!newEdges.some((e) => e.id === lastActionToPreviewId)) {
                  // Hapus edge lain dari lastAction jika ada
                  newEdges = newEdges.filter(
                    (e) =>
                      !(e.source === lastAction.id && e.target !== "preview")
                  );
                  newEdges.push({
                    id: lastActionToPreviewId,
                    source: lastAction.id,
                    target: "preview",
                    animated: true,
                  });
                }
              } else {
                // Tidak ada action node lagi, connect target/mapping langsung ke preview
                const mappingNode = newNodes.find((n) => n.id === "mapping");
                const sourceId = mappingNode ? "mapping" : "target";
                const directToPreviewId = `e-${sourceId}-preview`;

                if (!newEdges.some((e) => e.id === directToPreviewId)) {
                  newEdges.push({
                    id: directToPreviewId,
                    source: sourceId,
                    target: "preview",
                    animated: true,
                  });
                }
              }

              return newEdges;
            });

            return newNodes;
          });
        }
      }

      // Pastikan node target dan preview selalu memiliki deletable: false
      if (
        change.type === "select" ||
        change.type === "position" ||
        change.type === "dimensions"
      ) {
        const nodeId = change.id;
        if (nodeId === "target" || nodeId === "preview") {
          // Pastikan properti deletable tetap false
          setNodes((prev) =>
            prev.map((node) => {
              if (node.id === nodeId) {
                return { ...node, deletable: false };
              }
              return node;
            })
          );
        }
      }
      return true;
    });

    // Terapkan perubahan yang sudah difilter
    if (filteredChanges.length > 0) {
      onNodesChange(filteredChanges);
    }
  };

  /* -----------------------------------
     Effect: Pastikan node target dan preview selalu memiliki deletable: false saat mount
  ----------------------------------- */
  useEffect(() => {
    // Set deletable: false untuk node target dan preview saat pertama kali
    setNodes((prev) =>
      prev.map((node) => {
        if (
          (node.id === "target" || node.id === "preview") &&
          node.deletable !== false
        ) {
          return { ...node, deletable: false };
        }
        return node;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya sekali saat mount

  // Track apakah node sumber data sudah ada
  const hasDataSourceNode = useMemo(() => {
    return nodes.some((node) => node.id === NODE_IDS.DATA);
  }, [nodes]);

  /* -----------------------------------
     State: Target Configuration (target URL, login, navigasi, page-ready)
  ----------------------------------- */
  const [targetUrl, setTargetUrl] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loginUrl, setLoginUrl] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [pageReadyType, setPageReadyType] = useState("selector");
  const [pageReadyValue, setPageReadyValue] = useState("");

  /* -----------------------------------
     State: Data Source (jenis sumber data, data, sheet xlsx, dsb)
  ----------------------------------- */
  const [dataSourceType, setDataSourceType] = useState("upload");
  const [rows, setRows] = useState([]);
  const [manualRows, setManualRows] = useState([{}]);
  const [manualColumns, setManualColumns] = useState(["field1"]);
  const [dataMode, setDataMode] = useState("single");
  const [xlsxSheets, setXlsxSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  /* -----------------------------------
     State: Field Mapping
  ----------------------------------- */
  const [fieldMappings, setFieldMappings] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  /* -----------------------------------
     State: Action Flow & Indicator sukses/gagal
     Actions sekarang disimpan sebagai nodes, bukan array terpisah
  ----------------------------------- */
  const [successIndicator, setSuccessIndicator] = useState({
    type: "selector",
    value: "",
  });
  const [failureIndicator, setFailureIndicator] = useState({
    type: "selector",
    value: "",
  });

  const [execution, setExecution] = useState({
    mode: "once", // "once" | "loop"
    loop: {
      maxIterations: 50,
      delaySeconds: 0,
      stopWhen: "notVisible", // "visible" | "notVisible"
      indicator: { type: "selector", value: "" },
    },
  });

  // Safe run mode
  const [safeRun, setSafeRun] = useState(false);
  
  // Assisted repair mode
  const [assistedRepairMode, setAssistedRepairMode] = useState(false);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [currentFailureResult, setCurrentFailureResult] = useState(null);
  const [executionState, setExecutionState] = useState(null);

  /* -----------------------------------
     Effect: Load state from localStorage on mount
  ----------------------------------- */
  useEffect(() => {
    const savedState = loadEditorState();
    if (savedState) {
      // Restore state
      setTargetUrl(savedState.targetUrl || "");
      setRequiresLogin(savedState.requiresLogin || false);
      setLoginUrl(savedState.loginUrl || "");
      setLoginUsername(savedState.loginUsername || "");
      setLoginPassword(savedState.loginPassword || "");
      setNavigationSteps(savedState.navigationSteps || []);
      setPageReadyType(savedState.pageReadyType || "selector");
      setPageReadyValue(savedState.pageReadyValue || "");
      setDataSourceType(savedState.dataSourceType || "upload");
      setRows(savedState.rows || []);
      setManualRows(savedState.manualRows || [{}]);
      setManualColumns(savedState.manualColumns || ["field1"]);
      setDataMode(savedState.dataMode || "single");
      setXlsxSheets(savedState.xlsxSheets || []);
      setSelectedSheet(savedState.selectedSheet || "");
      setSelectedRowIndex(savedState.selectedRowIndex || 0);
      setFieldMappings(savedState.fieldMappings || []);
      setSuccessIndicator(savedState.successIndicator || { type: "selector", value: "" });
      setFailureIndicator(savedState.failureIndicator || { type: "selector", value: "" });
      setExecution(savedState.execution || {
        mode: "once",
        loop: {
          maxIterations: 50,
          delaySeconds: 0,
          stopWhen: "notVisible",
          indicator: { type: "selector", value: "" },
        },
      });
      
      // Restore nodes and edges
      if (savedState.nodes && savedState.nodes.length > 0) {
        setNodes(savedState.nodes);
      }
      if (savedState.edges && savedState.edges.length > 0) {
        setEdges(savedState.edges);
      }
    }
  }, []); // Only on mount

  /* -----------------------------------
     Effect: Auto-save state to localStorage
  ----------------------------------- */
  useEffect(() => {
    // Debounce save to avoid too frequent writes
    const timeoutId = setTimeout(() => {
      saveEditorState({
        targetUrl,
        requiresLogin,
        loginUrl,
        loginUsername,
        loginPassword,
        navigationSteps,
        pageReadyType,
        pageReadyValue,
        dataSourceType,
        rows,
        manualRows,
        manualColumns,
        dataMode,
        xlsxSheets,
        selectedSheet,
        selectedRowIndex,
        fieldMappings,
        nodes,
        edges,
        successIndicator,
        failureIndicator,
        execution,
      });
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [
    targetUrl,
    requiresLogin,
    loginUrl,
    loginUsername,
    loginPassword,
    navigationSteps,
    pageReadyType,
    pageReadyValue,
    dataSourceType,
    rows,
    manualRows,
    manualColumns,
    dataMode,
    xlsxSheets,
    selectedSheet,
    selectedRowIndex,
    fieldMappings,
    nodes,
    edges,
    successIndicator,
    failureIndicator,
    execution,
  ]);

  // Update context untuk header palette
  const { setHasDataSourceNode: setContextHasDataSourceNode } = useEditor();
  useEffect(() => {
    setContextHasDataSourceNode(hasDataSourceNode);
  }, [hasDataSourceNode, setContextHasDataSourceNode]);

  /* -----------------------------------
     Effect: Import draft actions from Inspector
  ----------------------------------- */
  useEffect(() => {
    const importDraft = searchParams?.get("importDraft");
    if (importDraft === "true") {
      const draftData = localStorage.getItem("inspector_draft_actions");
      if (draftData) {
        try {
          const draft = JSON.parse(draftData);
          if (draft.actions && draft.actions.length > 0) {
            // Set target URL if available
            if (draft.metadata?.url) {
              setTargetUrl(draft.metadata.url);
            }

            // Create action nodes from draft
            const newActionNodes = [];
            draft.actions.forEach((action, index) => {
              const actionId = `action-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
              
              // Calculate position
              const baseY = 200; // Below target node
              const actionY = baseY + (index * 110);

              let actionData = {
                actionType: action.type,
                actionTarget: action.target || "",
                actionValue: action.value,
                actionWaitFor: action.waitFor,
              };

              // Special handling for different action types
              if (action.type === "wait" && action.waitFor) {
                actionData.actionWaitFor = action.waitFor;
              }

              newActionNodes.push({
                id: actionId,
                type: "action",
                position: { x: 60, y: actionY },
                data: actionData,
              });
            });

            // Add nodes to canvas
            if (newActionNodes.length > 0) {
              setNodes((prev) => {
                const updated = [...prev, ...newActionNodes];
                return updated;
              });

              // Create edges
              setEdges((prev) => {
                const newEdges = [...prev];
                
                // Connect first action from target or mapping
                if (newActionNodes.length > 0) {
                  const mappingNode = prev.find((n) => n.id === "mapping");
                  const sourceId = mappingNode ? "mapping" : "target";
                  
                  newEdges.push({
                    id: `e-${sourceId}-${newActionNodes[0].id}`,
                    source: sourceId,
                    target: newActionNodes[0].id,
                    animated: true,
                  });

                  // Connect actions in sequence
                  for (let i = 0; i < newActionNodes.length - 1; i++) {
                    newEdges.push({
                      id: `e-${newActionNodes[i].id}-${newActionNodes[i + 1].id}`,
                      source: newActionNodes[i].id,
                      target: newActionNodes[i + 1].id,
                      animated: true,
                    });
                  }

                  // Connect last action to preview
                  const lastAction = newActionNodes[newActionNodes.length - 1];
                  newEdges.push({
                    id: `e-${lastAction.id}-preview`,
                    source: lastAction.id,
                    target: "preview",
                    animated: true,
                  });
                }

                return newEdges;
              });

              alert(
                `Berhasil mengimpor ${newActionNodes.length} action dari Inspector!`
              );
              
              // Clear draft from localStorage
              localStorage.removeItem("inspector_draft_actions");
              
              // Remove query param
              window.history.replaceState({}, "", "/editor");
            }
          }
        } catch (error) {
          console.error("Failed to import draft:", error);
          alert("Gagal mengimpor draft dari Inspector");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Helper: Get action nodes dari nodes
  const actionNodes = useMemo(() => {
    return nodes.filter((n) => n.type === "action");
  }, [nodes]);

  // Helper: Get action data dari node
  const getActionFromNode = (node) => {
    if (node.type !== "action") return null;
    return {
      type: node.data?.actionType || "click",
      target: node.data?.actionTarget || "",
      value: node.data?.actionValue,
      waitFor: node.data?.actionWaitFor,
    };
  };

  /* -----------------------------------
     State: Eksekusi automation plan
  ----------------------------------- */
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionReport, setExecutionReport] = useState(null);

  /* -----------------------------------
     Memo: data yang berlaku
  ----------------------------------- */
  const effectiveRows = useMemo(() => {
    if (!hasDataSourceNode) return [{}];
    return dataSourceType === "manual" ? manualRows : rows;
  }, [hasDataSourceNode, dataSourceType, manualRows, rows]);

  /* -----------------------------------
     Memo: kolom dari rows
  ----------------------------------- */
  const columns = useMemo(() => {
    if (!hasDataSourceNode) return [];
    if (dataSourceType === "manual") return manualColumns;
    if (!effectiveRows.length) return [];
    return Object.keys(effectiveRows[0] || {});
  }, [hasDataSourceNode, dataSourceType, manualColumns, effectiveRows]);

  /* -----------------------------------
     Handler: Saat file upload, ekstrak data
  ----------------------------------- */
  const handleFileSelect = async (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx"].includes(ext)) {
      throw new Error("Hanya file CSV atau XLSX yang didukung");
    }

    if (ext === "xlsx") {
      const sheets = await getXlsxSheets(file);
      setXlsxSheets(sheets);
      setSelectedSheet(sheets[0] || "");
      const data = await extractAllRows(file, sheets[0] || null);
      setRows(data);
    } else {
      setXlsxSheets([]);
      setSelectedSheet("");
      const data = await extractAllRows(file, null);
      setRows(data);
    }
  };

  /* -----------------------------------
     Handler: Saat sheet xlsx diganti, ekstrak data sheet tersebut
  ----------------------------------- */
  const handleSheetChange = async (sheetName, file) => {
    setSelectedSheet(sheetName);
    if (file) {
      const data = await extractAllRows(file, sheetName);
      setRows(data);
    }
  };

  /* -----------------------------------
     Membentuk automation plan yang siap dikirim untuk dieksekusi
  ----------------------------------- */
  const generateAutomationPlan = () => {
    const plan = {
      target: {
        url: targetUrl.trim(),
        pageReadyIndicator: {
          type: pageReadyType,
          value: pageReadyValue.trim(),
        },
        ...(requiresLogin && {
          login: {
            url: loginUrl.trim(),
            username: loginUsername.trim(),
            password: loginPassword.trim(),
          },
        }),
        ...(navigationSteps.length > 0 && {
          navigation: navigationSteps,
        }),
      },
      ...(hasDataSourceNode
        ? {
            dataSource: {
              type: dataSourceType,
              rows: effectiveRows,
              mode: dataMode,
              ...(dataMode === "single" && { selectedRowIndex }),
            },
            fieldMappings: fieldMappings.map((fm) => ({
              name: fm.name,
              type: fm.type,
              dataKey: fm.dataKey,
              required: fm.required || false,
              labels: fm.labels || [],
              ...(fm.fallbackLabels?.length
                ? { fallbackLabels: fm.fallbackLabels }
                : {}),
              ...(fm.conditional ? { conditional: fm.conditional } : {}),
            })),
          }
        : {
            /* Tanpa sumber data: dataSource & mapping tidak diperlukan,
               tapi tetap diset minimal agar runner aman. */
            dataSource: {
              type: "manual",
              rows: [{}],
              mode: "single",
              selectedRowIndex: 0,
            },
            fieldMappings: [],
            execution,
          }),
      actions: actionNodes
        .sort((a, b) => {
          // Sort berdasarkan posisi Y (dari atas ke bawah)
          return a.position.y - b.position.y;
        })
        .map((node) => {
          const action = getActionFromNode(node);
          if (!action) return null;
          return {
            type: action.type,
            target: action.target,
            ...(action.value !== undefined ? { value: action.value } : {}),
            ...(action.waitFor ? { waitFor: action.waitFor } : {}),
          };
        })
        .filter(Boolean),
      ...(successIndicator.value.trim()
        ? {
            successIndicator: {
              type: successIndicator.type,
              value: successIndicator.value.trim(),
            },
          }
        : {}),
      ...(failureIndicator.value.trim()
        ? {
            failureIndicator: {
              type: failureIndicator.type,
              value: failureIndicator.value.trim(),
            },
          }
        : {}),
    };

    return plan;
  };

  /* -----------------------------------
     Handler: Menjalankan automation plan
  ----------------------------------- */
  const handleRun = async () => {
    const errors = validateAutomationPlan({
      targetUrl,
      pageReadyValue,
      requiresLogin,
      loginUrl,
      loginUsername,
      loginPassword,
      hasDataSourceNode,
      effectiveRows,
      fieldMappings,
      actionNodes,
      getActionFromNode,
      execution,
    });

    if (errors.length > 0) {
      return alert(errors[0]);
    }

    setIsExecuting(true);
    setExecutionReport(null);

    let plan = null;
    try {
      plan = generateAutomationPlan();
      const report = await runAutomation(plan, safeRun);
      setExecutionReport(report);
      setActivePanel("preview");
      
      // Save execution log
      if (plan) {
        saveExecutionLog(report, plan);
      }
    } catch (error) {
      console.error("Execution error:", error);
      const errorReport = {
        status: "error",
        message: error.message,
        safeRun,
      };
      setExecutionReport(errorReport);
      setActivePanel("preview");
      
      // Save error log too (use plan if available, otherwise create minimal plan)
      if (plan) {
        saveExecutionLog(errorReport, plan);
      } else {
        // Create minimal plan for error log
        const minimalPlan = {
          target: { url: targetUrl || "" },
        };
        saveExecutionLog(errorReport, minimalPlan);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  /* -----------------------------------
     Handler: klik node di canvas
  ----------------------------------- */
  const onNodeClick = (_, node) => {
    // Tutup context menu jika ada
    setContextMenu(null);
    
    // Handle action node
    if (node.type === "action") {
      // Jika node yang sama diklik lagi, tutup panel (toggle)
      if (selectedNode?.id === node.id && isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedNode(null);
        return;
      }
      // Jika node berbeda atau panel belum terbuka, buka panel
      setSelectedNode(node);
      setActivePanel("action");
      setIsDetailOpen(true);
      return;
    }

    const panel = node?.data?.panel;
    if (panel) {
      // Jika panel yang sama diklik lagi, tutup panel (toggle)
      if (activePanel === panel && isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedNode(null);
        return;
      }
      // Jika panel berbeda atau belum terbuka, buka panel baru
      setSelectedNode(null);
      setActivePanel(panel);
      setIsDetailOpen(true);
    }
  };

  /* -----------------------------------
     Handler: klik kanan di node (prevent context menu)
  ----------------------------------- */
  const onNodeContextMenu = (event) => {
    // Prevent context menu saat klik kanan di node
    event.preventDefault();
    setContextMenu(null);
  };

  /* -----------------------------------
   Handler: klik di canvas (bukan di node)
----------------------------------- */
  const onPaneClick = () => {
    // Tutup panel dan context menu saat klik di area kosong canvas
    setIsDetailOpen(false);
    setSelectedNode(null);
    setContextMenu(null);
  };

  /* -----------------------------------
   Handler: klik kanan di canvas untuk context menu
----------------------------------- */
  const onPaneContextMenu = (event) => {
    event.preventDefault();
    
    // Dapatkan posisi klik kanan
    const position = reactFlowInstance?.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    }) || { x: 0, y: 0 };

    // Tampilkan context menu di posisi klik
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      flowPosition: position,
    });
  };

  /* -----------------------------------
     Handler: ketika node di-drag dan di-drop
  ----------------------------------- */
  const onNodeDragStop = () => {
    // Handler untuk drag stop node di canvas (jika diperlukan)
  };

  /* -----------------------------------
     Handler: ketika drag over canvas (untuk drop dari palette)
  ----------------------------------- */
  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  /* -----------------------------------
     Handler: ketika drop dari palette ke canvas
  ----------------------------------- */
  const onDrop = (event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData("application/reactflow");
    if (!type) return;

    const data = JSON.parse(type);
    const position = reactFlowInstance?.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    }) || { x: 0, y: 0 };

    // Cek apakah node sumber data sudah ada
    if (data.type === "dataSource") {
      if (hasDataSourceNode) {
        // Node sumber data sudah ada, tidak bisa ditambahkan lagi
        return;
      }
      handleAddDataSourceNodeAtPosition(position);
    } else if (data.type === "action") {
      handleAddActionNodeAtPosition(position);
    }
  };

  /* -----------------------------------
     Handler: Tambah node dari context menu
  ----------------------------------- */
  const handleAddNodeFromContextMenu = (nodeType) => {
    if (!contextMenu) return;

    const position = contextMenu.flowPosition;

    if (nodeType === "dataSource") {
      if (hasDataSourceNode) {
        // Node sumber data sudah ada, tidak bisa ditambahkan lagi
        setContextMenu(null);
        return;
      }
      handleAddDataSourceNodeAtPosition(position);
    } else if (nodeType === "action") {
      handleAddActionNodeAtPosition(position);
    }

    // Tutup context menu setelah menambahkan node
    setContextMenu(null);
  };

  /* -----------------------------------
     Handler: Tambah node Action di posisi tertentu
  ----------------------------------- */
  const handleAddActionNodeAtPosition = (dropPosition) => {
    // Gunakan timestamp + random untuk memastikan ID unik
    const actionId = `action-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Hitung posisi Y otomatis jika ada action nodes lain
    setNodes((prev) => {
      const existingActionNodes = prev.filter((n) => n.type === "action");
      let actionY = dropPosition.y;

      // Jika ada action nodes, posisikan di bawah action terakhir
      if (existingActionNodes.length > 0) {
        const lastActionY = Math.max(
          ...existingActionNodes.map((n) => n.position.y)
        );
        actionY = lastActionY + 110;
      } else {
        // Jika ini action pertama, posisikan di bawah mapping atau target
        const mappingNode = prev.find((n) => n.id === "mapping");
        const targetNode = prev.find((n) => n.id === "target");
        if (mappingNode) {
          actionY = mappingNode.position.y + 110;
        } else if (targetNode) {
          actionY = targetNode.position.y + 110;
        }
      }

      const newActionNode = {
        id: actionId,
        type: "action",
        position: { x: dropPosition.x || 60, y: actionY },
        data: {
          actionType: "click",
          actionTarget: "",
          actionValue: null,
          actionWaitFor: null,
        },
      };

      const updated = [...prev, newActionNode];
      // Update edges langsung
      updateEdgesForActionNode(actionId, updated, prev);
      return updated;
    });
  };

  /* -----------------------------------
     Helper: Update edges untuk action node baru
  ----------------------------------- */
  const updateEdgesForActionNode = (actionId, currentNodes, previousNodes) => {
    const targetNode = currentNodes.find((n) => n.id === "target");
    const mappingNode = currentNodes.find((n) => n.id === "mapping");
    const actionNodes = currentNodes.filter((n) => n.type === "action");
    const newActionNode = currentNodes.find((n) => n.id === actionId);

    // Tentukan source node untuk edge baru
    let sourceNodeId = "target";
    let isFirstAction = false;

    if (mappingNode) {
      // Jika ada mapping, action pertama connect dari mapping
      const otherActions = actionNodes.filter((n) => n.id !== actionId);
      if (otherActions.length === 0) {
        // Ini adalah action pertama
        sourceNodeId = "mapping";
        isFirstAction = true;
      } else {
        // Ini bukan action pertama, chain dari action sebelumnya
        // Sort berdasarkan posisi Y dan ambil yang terakhir (di atas action baru)
        const sorted = otherActions
          .filter((a) => a.position.y < newActionNode.position.y)
          .sort((a, b) => b.position.y - a.position.y);

        if (sorted.length > 0) {
          sourceNodeId = sorted[0].id;
        } else {
          // Jika tidak ada action di atas, berarti ini action pertama (di posisi lebih atas)
          // Connect dari mapping atau target
          sourceNodeId = mappingNode ? "mapping" : "target";
          isFirstAction = true;
        }
      }
    } else {
      // Tidak ada mapping, action pertama connect dari target
      const otherActions = actionNodes.filter((n) => n.id !== actionId);
      if (otherActions.length === 0) {
        // Ini adalah action pertama
        sourceNodeId = "target";
        isFirstAction = true;
      } else {
        // Ini bukan action pertama, chain dari action sebelumnya
        const sorted = otherActions
          .filter((a) => a.position.y < newActionNode.position.y)
          .sort((a, b) => b.position.y - a.position.y);

        if (sorted.length > 0) {
          sourceNodeId = sorted[0].id;
        } else {
          // Jika tidak ada action di atas, berarti ini action pertama
          sourceNodeId = "target";
          isFirstAction = true;
        }
      }
    }

    setEdges((prev) => {
      // Buat edge ID yang unik
      const sourceToActionId = `e-${sourceNodeId}-${actionId}`;
      const actionToPreviewId = `e-${actionId}-preview`;

      // Hapus edge yang akan diganti
      let filtered = prev.filter(
        (e) =>
          // Hapus edge dari source ke preview (jika ini action pertama)
          !(
            isFirstAction &&
            e.source === sourceNodeId &&
            e.target === "preview"
          ) &&
          // Hapus edge dari source ke action lain yang terhubung langsung ke preview
          // (jika source adalah action node dan action lain itu adalah action terakhir)
          !(
            sourceNodeId.startsWith("action-") &&
            e.source === sourceNodeId &&
            e.target !== actionId &&
            e.target.startsWith("action-") &&
            prev.some((e2) => e2.source === e.target && e2.target === "preview")
          ) &&
          // Hapus edge dengan ID yang sama (jika ada duplikasi)
          e.id !== sourceToActionId &&
          e.id !== actionToPreviewId
      );

      // Jika source adalah action node, hapus edge source->preview (karena akan diganti dengan chain)
      if (sourceNodeId.startsWith("action-")) {
        filtered = filtered.filter(
          (e) => !(e.source === sourceNodeId && e.target === "preview")
        );
      }

      // Pastikan edge dari source ke action baru belum ada
      const hasSourceToAction = filtered.some(
        (e) => e.source === sourceNodeId && e.target === actionId
      );
      if (!hasSourceToAction) {
        filtered.push({
          id: sourceToActionId,
          source: sourceNodeId,
          target: actionId,
          animated: true,
        });
      }

      // Tentukan apakah action baru adalah action terakhir
      const otherActions = actionNodes.filter((n) => n.id !== actionId);
      const isLastAction =
        otherActions.length === 0 ||
        !otherActions.some((a) => a.position.y > newActionNode.position.y);

      // Jika ini action terakhir, connect ke preview
      // Jika bukan action terakhir, tidak perlu connect ke preview (akan di-handle oleh action berikutnya)
      if (isLastAction) {
        // Pastikan edge dari action baru ke preview belum ada
        const hasActionToPreview = filtered.some(
          (e) => e.source === actionId && e.target === "preview"
        );
        if (!hasActionToPreview) {
          filtered.push({
            id: actionToPreviewId,
            source: actionId,
            target: "preview",
            animated: true,
          });
        }
      }

      return filtered;
    });
  };

  /* -----------------------------------
     Handler: Tambah node Sumber Data di posisi tertentu
  ----------------------------------- */
  const handleAddDataSourceNodeAtPosition = (dropPosition) => {
    // Double check: pastikan node sumber data belum ada
    if (hasDataSourceNode || nodes.some((n) => n.id === "data")) {
      return;
    }

    // Cari posisi node target
    const targetNode = nodes.find((n) => n.id === "target");

    if (!targetNode) return;

    // Gunakan posisi drop untuk node data, atau hitung otomatis
    let dataY = dropPosition.y;
    const targetY = targetNode.position.y;

    // Jika drop terlalu dekat dengan target, hitung posisi otomatis
    if (dropPosition.y < targetY + 50) {
      dataY = targetY + 110;
    }

    const mappingY = dataY + 110;

    // Tambahkan node sumber data
    const dataNode = {
      id: "data",
      type: "card",
      position: { x: dropPosition.x || 60, y: dataY },
      data: {
        title: "Sumber Data",
        subtitle: "CSV/XLSX atau manual",
        panel: "data",
      },
    };

    // Tambahkan node field mapping sebagai child
    const mappingNode = {
      id: "mapping",
      type: "card",
      position: { x: dropPosition.x || 60, y: mappingY },
      data: {
        title: "Field Mapping",
        subtitle: "Nama bisnis → label di halaman → dataKey",
        panel: "mapping",
      },
    };

    // Update posisi preview jika perlu
    const previewNode = nodes.find((n) => n.id === "preview");
    const actionNodes = nodes.filter((n) => n.type === "action");
    let previewY = mappingY + 110;

    // Jika ada action nodes, posisikan preview di bawah action terakhir
    if (actionNodes.length > 0) {
      const lastActionY = Math.max(...actionNodes.map((n) => n.position.y));
      previewY = lastActionY + 110;
    }

    const updatedPreviewNode = previewNode
      ? {
          ...previewNode,
          position: {
            x: previewNode.position.x,
            y: previewY,
          },
        }
      : null;

    // Update nodes - pertahankan semua node yang ada, update yang perlu diubah
    const otherNodes = nodes.filter(
      (n) => !["target", "preview"].includes(n.id)
    );
    const newNodes = [
      targetNode,
      dataNode,
      mappingNode,
      ...otherNodes,
      ...(updatedPreviewNode ? [updatedPreviewNode] : []),
    ].filter(Boolean);

    setNodes(newNodes);

    // Update edges: hapus edge lama target->preview atau target->action, tambahkan yang baru
    const newEdges = edges.filter(
      (e) =>
        !(
          (e.source === "target" && e.target === "preview") ||
          (e.source === "target" && e.target.startsWith("action-"))
        )
    );

    // Tambahkan edges baru: target -> data -> mapping
    newEdges.push(
      { id: "e-target-data", source: "target", target: "data", animated: true },
      {
        id: "e-data-mapping",
        source: "data",
        target: "mapping",
        animated: true,
      }
    );

    // Connect mapping ke action pertama atau preview
    if (actionNodes.length > 0) {
      // Sort action nodes by Y position
      const sortedActions = [...actionNodes].sort(
        (a, b) => a.position.y - b.position.y
      );
      const firstAction = sortedActions[0];
      newEdges.push({
        id: "e-mapping-action",
        source: "mapping",
        target: firstAction.id,
        animated: true,
      });
    } else {
      // Connect langsung ke preview jika tidak ada action
      newEdges.push({
        id: "e-mapping-preview",
        source: "mapping",
        target: "preview",
        animated: true,
      });
    }

    setEdges(newEdges);
  };

  /* -----------------------------------
     Handler: Hapus node Sumber Data (dipanggil dari node click atau context menu)
  ----------------------------------- */
  const handleRemoveDataSourceNode = () => {
    if (!hasDataSourceNode) return;

    // Hapus node data dan mapping
    const newNodes = nodes.filter((n) => n.id !== "data" && n.id !== "mapping");

    // Reset posisi preview ke default
    const targetNode = newNodes.find((n) => n.id === "target");
    if (targetNode) {
      const previewNodeToUpdate = newNodes.find((n) => n.id === "preview");

      if (previewNodeToUpdate) {
        previewNodeToUpdate.position = { x: 60, y: 200 };
      }
    }

    setNodes(newNodes);

    // Update edges: hapus semua edge yang terkait dengan node data/mapping
    const newEdges = edges
      .filter(
        (e) =>
          !["data", "mapping"].includes(e.source) &&
          !["data", "mapping"].includes(e.target)
      )
      .map((e) => {
        // Update edge target->actions jika perlu
        if (e.source === "target" && e.target === "actions") {
          return { ...e, id: "e-target-actions" };
        }
        return e;
      });

    // Pastikan edge target->actions ada
    if (
      !newEdges.some((e) => e.source === "target" && e.target === "actions")
    ) {
      newEdges.push({
        id: "e-target-actions",
        source: "target",
        target: "actions",
        animated: true,
      });
    }

    // Pastikan edge actions->preview ada
    if (
      !newEdges.some((e) => e.source === "actions" && e.target === "preview")
    ) {
      newEdges.push({
        id: "e-actions-preview",
        source: "actions",
        target: "preview",
        animated: true,
      });
    }

    setEdges(newEdges);

    // Reset data source state
    setRows([]);
    setManualRows([{}]);
    setManualColumns(["field1"]);
    setFieldMappings([]);
  };

  /* -----------------------------------
     Render UI utama
  ----------------------------------- */
  return (
    <div className="flex-1 relative w-full h-full bg-gradient-to-bl from-[#f7faff] via-[#ecf2ff] to-[#fafafb]">
      {/* ============== SECTION: CANVAS FULL SCREEN ============= */}
      <div className="absolute inset-0 w-full h-full">
        {/* Section: ReactFlow Canvas - Full screen */}
        <div className="absolute inset-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeDragStop={onNodeDragStop}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
          
          {/* Context Menu untuk klik kanan */}
          {contextMenu && (
            <>
              {/* Overlay untuk menutup context menu saat klik di luar */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setContextMenu(null)}
              />
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleAddNodeFromContextMenu("dataSource")}
                  disabled={hasDataSourceNode}
                  className={[
                    "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors",
                    hasDataSourceNode
                      ? "text-gray-400 cursor-not-allowed opacity-50"
                      : "text-gray-700 cursor-pointer",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <div>
                      <div className="font-medium">Sumber Data</div>
                      <div className="text-xs text-gray-500">CSV/XLSX/manual</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleAddNodeFromContextMenu("action")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <div className="font-medium">Alur Aksi</div>
                      <div className="text-xs text-gray-500">fill/click/wait/navigate</div>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* ============== END SECTION: CANVAS FULL SCREEN ============= */}

      {/* ============== SECTION: DETAIL PANEL - INSIDE CANVAS ============= */}
      {isDetailOpen && (
        <div
          className="
            absolute top-6 right-6 bottom-6 z-40 w-[460px] bg-white shadow-xl border border-gray-200 rounded-lg transition-all duration-300
            flex flex-col overflow-hidden
          "
          style={{
            willChange: "transform",
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-800 truncate">
              Detail {activePanel}
            </h2>
          </div>
          <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden space-y-3 min-w-0">
            {activePanel === "target" && (
              <TargetConfiguration
                targetUrl={targetUrl}
                setTargetUrl={setTargetUrl}
                requiresLogin={requiresLogin}
                setRequiresLogin={setRequiresLogin}
                loginUrl={loginUrl}
                setLoginUrl={setLoginUrl}
                loginUsername={loginUsername}
                setLoginUsername={setLoginUsername}
                loginPassword={loginPassword}
                setLoginPassword={setLoginPassword}
                navigationSteps={navigationSteps}
                setNavigationSteps={setNavigationSteps}
                pageReadyType={pageReadyType}
                setPageReadyType={setPageReadyType}
                pageReadyValue={pageReadyValue}
                setPageReadyValue={setPageReadyValue}
              />
            )}
            {activePanel === "data" && (
              <DataSourceSection
                dataSourceType={dataSourceType}
                setDataSourceType={setDataSourceType}
                rows={rows}
                setRows={setRows}
                manualRows={manualRows}
                setManualRows={setManualRows}
                manualColumns={manualColumns}
                setManualColumns={setManualColumns}
                dataMode={dataMode}
                setDataMode={setDataMode}
                xlsxSheets={xlsxSheets}
                setXlsxSheets={setXlsxSheets}
                selectedSheet={selectedSheet}
                setSelectedSheet={setSelectedSheet}
                selectedRowIndex={selectedRowIndex}
                setSelectedRowIndex={setSelectedRowIndex}
                onFileSelect={handleFileSelect}
                onSheetChange={handleSheetChange}
                effectiveRows={effectiveRows}
                columns={columns}
              />
            )}
            {activePanel === "mapping" && (
              <FieldMappingSection
                fieldMappings={fieldMappings}
                setFieldMappings={setFieldMappings}
                columns={columns}
              />
            )}
            {activePanel === "action" && selectedNode && (
              <ActionNodeEditor
                node={selectedNode}
                setNode={(updateFnOrNode) => {
                  setNodes((prev) => {
                    // Cari node yang sedang diedit dari array nodes (bukan dari selectedNode yang mungkin stale)
                    const currentNode = prev.find((n) => n.id === selectedNode.id);
                    if (!currentNode) return prev;

                    // Jika updateFnOrNode adalah function, gunakan untuk update
                    // Jika bukan, langsung gunakan sebagai node baru
                    const updatedNode = typeof updateFnOrNode === 'function' 
                      ? updateFnOrNode(currentNode)
                      : updateFnOrNode;

                    // Pastikan ID match dengan selectedNode
                    if (updatedNode.id !== selectedNode.id) {
                      console.warn('Node ID mismatch:', updatedNode.id, 'vs', selectedNode.id);
                      return prev;
                    }

                    // Update node di array
                    const updated = prev.map((n) => 
                      n.id === updatedNode.id ? updatedNode : n
                    );
                    
                    // Update selectedNode dengan node terbaru
                    const latestNode = updated.find((n) => n.id === updatedNode.id);
                    if (latestNode) {
                      setSelectedNode(latestNode);
                    }
                    return updated;
                  });
                }}
                fieldMappings={fieldMappings}
                onDelete={() => {
                  const nodeId = selectedNode.id;

                  // Hapus node dan reconnect edges
                  setNodes((prev) => {
                    const deletedNode = prev.find((n) => n.id === nodeId);
                    if (!deletedNode) return prev;

                    const newNodes = prev.filter((n) => n.id !== nodeId);
                    const remainingActionNodes = newNodes.filter(
                      (n) => n.type === "action"
                    );

                    // Update edges untuk reconnect
                    setEdges((prevEdges) => {
                      // Cari edge yang masuk ke node yang dihapus dan edge yang keluar
                      const incomingEdge = prevEdges.find(
                        (e) => e.target === nodeId
                      );
                      const outgoingEdge = prevEdges.find(
                        (e) => e.source === nodeId
                      );

                      // Hapus edge yang terkait dengan node yang dihapus
                      let newEdges = prevEdges.filter(
                        (e) => e.source !== nodeId && e.target !== nodeId
                      );

                      // Reconnect logic
                      if (incomingEdge && outgoingEdge) {
                        // Node tengah: connect incoming source ke outgoing target
                        const newEdgeId = `e-${incomingEdge.source}-${outgoingEdge.target}`;
                        if (!newEdges.some((e) => e.id === newEdgeId)) {
                          newEdges.push({
                            id: newEdgeId,
                            source: incomingEdge.source,
                            target: outgoingEdge.target,
                            animated: true,
                          });
                        }
                      } else if (incomingEdge && !outgoingEdge) {
                        // Node terakhir: connect incoming ke preview
                        const newEdgeId = `e-${incomingEdge.source}-preview`;
                        if (!newEdges.some((e) => e.id === newEdgeId)) {
                          newEdges.push({
                            id: newEdgeId,
                            source: incomingEdge.source,
                            target: "preview",
                            animated: true,
                          });
                        }
                      } else if (!incomingEdge && outgoingEdge) {
                        // Node pertama: connect dari mapping/target ke outgoing target
                        const mappingNode = newNodes.find(
                          (n) => n.id === "mapping"
                        );
                        const sourceId = mappingNode ? "mapping" : "target";
                        const newEdgeId = `e-${sourceId}-${outgoingEdge.target}`;
                        if (!newEdges.some((e) => e.id === newEdgeId)) {
                          newEdges.push({
                            id: newEdgeId,
                            source: sourceId,
                            target: outgoingEdge.target,
                            animated: true,
                          });
                        }
                      }

                      // Pastikan action node terakhir selalu connect ke preview
                      if (remainingActionNodes.length > 0) {
                        const sortedActions = [...remainingActionNodes].sort(
                          (a, b) => a.position.y - b.position.y
                        );
                        const lastAction =
                          sortedActions[sortedActions.length - 1];
                        const lastActionToPreviewId = `e-${lastAction.id}-preview`;

                        if (
                          !newEdges.some((e) => e.id === lastActionToPreviewId)
                        ) {
                          // Hapus edge lain dari lastAction jika ada
                          newEdges = newEdges.filter(
                            (e) =>
                              !(
                                e.source === lastAction.id &&
                                e.target !== "preview"
                              )
                          );
                          newEdges.push({
                            id: lastActionToPreviewId,
                            source: lastAction.id,
                            target: "preview",
                            animated: true,
                          });
                        }
                      } else {
                        // Tidak ada action node lagi, connect target/mapping langsung ke preview
                        const mappingNode = newNodes.find(
                          (n) => n.id === "mapping"
                        );
                        const sourceId = mappingNode ? "mapping" : "target";
                        const directToPreviewId = `e-${sourceId}-preview`;

                        if (!newEdges.some((e) => e.id === directToPreviewId)) {
                          newEdges.push({
                            id: directToPreviewId,
                            source: sourceId,
                            target: "preview",
                            animated: true,
                          });
                        }
                      }

                      return newEdges;
                    });

                    return newNodes;
                  });

                  setIsDetailOpen(false);
                  setSelectedNode(null);
                }}
              />
            )}
            {activePanel === "preview" && (
              <div className="space-y-3">
                <AutomationPlanPreview
                  plan={generateAutomationPlan()}
                  effectiveRows={effectiveRows}
                />
                <ExecutionReport report={executionReport} />
              </div>
            )}
          </div>
        </div>
      )}
      {/* ============== END SECTION: DETAIL PANEL - INSIDE CANVAS ============= */}

      {/* ============== SECTION: BUTTON JALANKAN (BOTTOM FIXED) ============= */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3">
        {/* Mode Toggles */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={safeRun}
              onChange={(e) => setSafeRun(e.target.checked)}
              disabled={isExecuting}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Safe Run Mode
            </span>
            <span className="text-xs text-gray-500">(Skip submit)</span>
          </label>
          <div className="w-px h-6 bg-gray-300"></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={assistedRepairMode}
              onChange={(e) => setAssistedRepairMode(e.target.checked)}
              disabled={isExecuting}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Assisted Repair
            </span>
            <span className="text-xs text-gray-500">(Pause on failure)</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Reset Button */}
          <button
            onClick={() => {
              if (confirm("Apakah Anda yakin ingin reset semua setup? Semua data akan dihapus.")) {
                // Reset all state
                setTargetUrl("");
                setRequiresLogin(false);
                setLoginUrl("");
                setLoginUsername("");
                setLoginPassword("");
                setNavigationSteps([]);
                setPageReadyType("selector");
                setPageReadyValue("");
                setDataSourceType("upload");
                setRows([]);
                setManualRows([{}]);
                setManualColumns(["field1"]);
                setDataMode("single");
                setXlsxSheets([]);
                setSelectedSheet("");
                setSelectedRowIndex(0);
                setFieldMappings([]);
                setSuccessIndicator({ type: "selector", value: "" });
                setFailureIndicator({ type: "selector", value: "" });
                setExecution({
                  mode: "once",
                  loop: {
                    maxIterations: 50,
                    delaySeconds: 0,
                    stopWhen: "notVisible",
                    indicator: { type: "selector", value: "" },
                  },
                });
                setNodes(getDefaultNodes(false));
                setEdges(getDefaultEdges());
                setExecutionReport(null);
                setSafeRun(false);
                clearEditorState();
                alert("Setup telah direset!");
              }
            }}
            disabled={isExecuting}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            Reset
          </button>

          {/* Export Buttons (only show if there's a report) */}
          {executionReport && (
            <>
              <button
                onClick={() => exportToCSV(executionReport, generateAutomationPlan())}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 cursor-pointer transition-colors shadow-lg"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportToPDF(executionReport, generateAutomationPlan())}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 cursor-pointer transition-colors shadow-lg"
              >
                Export PDF
              </button>
            </>
          )}

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xl"
          >
            {isExecuting ? "Menjalankan..." : safeRun ? "Jalankan (Safe Run)" : "Jalankan Automation Plan"}
          </button>
        </div>
      </div>
      {/* ============== END SECTION: BUTTON JALANKAN ============= */}

      {/* Assisted Repair Dialog */}
      {repairDialogOpen && currentFailureResult && executionState && (
        <AssistedRepairDialog
          failureResult={currentFailureResult}
          executionState={executionState}
          onRepairDecision={(decision) => {
            // Handle repair decision
            console.log("Repair decision:", decision);
            setRepairDialogOpen(false);
            // TODO: Implement resume logic based on decision
            alert(
              `Repair decision: ${decision.action}. Resume logic akan diimplementasikan untuk komunikasi dengan server-side runner.`
            );
          }}
          onClose={() => {
            setRepairDialogOpen(false);
            setCurrentFailureResult(null);
            setExecutionState(null);
          }}
        />
      )}
    </div>
  );
}
