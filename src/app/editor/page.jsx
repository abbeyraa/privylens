"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import { extractAllRows, getXlsxSheets } from "@/lib/api";
import { runAutomation } from "@/app/actions/runAutomation";

import TargetConfiguration from "@/app/automate/components/TargetConfiguration";
import DataSourceSection from "@/app/automate/components/DataSourceSection";
import FieldMappingSection from "@/app/automate/components/FieldMappingSection";
import ActionFlowSection from "@/app/automate/components/ActionFlowSection";
import AutomationPlanPreview from "@/app/automate/components/AutomationPlanPreview";
import ExecutionReport from "@/app/automate/components/ExecutionReport";

import CardNode from "./components/CardNode";

function getEditorNodes(mode) {
  if (mode === "actionOnly") {
    return [
      {
        id: "target",
        type: "card",
        position: { x: 60, y: 70 },
        data: {
          title: "Target",
          subtitle: "URL, login, navigasi, page-ready indicator",
          panel: "target",
        },
      },
      {
        id: "actions",
        type: "card",
        position: { x: 60, y: 210 },
        data: {
          title: "Alur Aksi (Action-only)",
          subtitle: "click/wait/navigate/handleDialog + loop trigger",
          panel: "actions",
        },
      },
      {
        id: "preview",
        type: "card",
        position: { x: 60, y: 350 },
        data: {
          title: "Preview & Report",
          subtitle: "Lihat plan dan hasil eksekusi",
          panel: "preview",
        },
      },
    ];
  }

  return [
    {
      id: "target",
      type: "card",
      position: { x: 60, y: 40 },
      data: {
        title: "Target",
        subtitle: "URL, login, navigasi, page-ready indicator",
        panel: "target",
      },
    },
    {
      id: "data",
      type: "card",
      position: { x: 60, y: 150 },
      data: {
        title: "Sumber Data",
        subtitle: "CSV/XLSX atau manual",
        panel: "data",
      },
    },
    {
      id: "mapping",
      type: "card",
      position: { x: 60, y: 260 },
      data: {
        title: "Field Mapping",
        subtitle: "Nama bisnis → label di halaman → dataKey",
        panel: "mapping",
      },
    },
    {
      id: "actions",
      type: "card",
      position: { x: 60, y: 370 },
      data: {
        title: "Alur Aksi",
        subtitle: "fill/click/wait/navigate + indikator hasil",
        panel: "actions",
      },
    },
    {
      id: "preview",
      type: "card",
      position: { x: 60, y: 480 },
      data: {
        title: "Preview & Report",
        subtitle: "Lihat plan dan hasil eksekusi",
        panel: "preview",
      },
    },
  ];
}

function getEditorEdges(mode) {
  if (mode === "actionOnly") {
    return [
      { id: "e1", source: "target", target: "actions", animated: true },
      { id: "e2", source: "actions", target: "preview", animated: true },
    ];
  }

  return [
    { id: "e1", source: "target", target: "data", animated: true },
    { id: "e2", source: "data", target: "mapping", animated: true },
    { id: "e3", source: "mapping", target: "actions", animated: true },
    { id: "e4", source: "actions", target: "preview", animated: true },
  ];
}

export default function EditorPage() {
  // ReactFlow state
  const nodeTypes = useMemo(() => ({ card: CardNode }), []);
  const [editorMode, setEditorMode] = useState("data"); // "data" | "actionOnly"
  const [nodes, setNodes, onNodesChange] = useNodesState(
    getEditorNodes("data")
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(getEditorEdges("data"));
  const [activePanel, setActivePanel] = useState("target");

  // Target Configuration (sama seperti AutomatePage)
  const [targetUrl, setTargetUrl] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loginUrl, setLoginUrl] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [pageReadyType, setPageReadyType] = useState("selector");
  const [pageReadyValue, setPageReadyValue] = useState("");

  // Data Source
  const [dataSourceType, setDataSourceType] = useState("upload");
  const [rows, setRows] = useState([]);
  const [manualRows, setManualRows] = useState([{}]);
  const [manualColumns, setManualColumns] = useState(["field1"]);
  const [dataMode, setDataMode] = useState("single");
  const [xlsxSheets, setXlsxSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  // Field Mappings
  const [fieldMappings, setFieldMappings] = useState([]);

  // Action Flow + Indicators
  const [actions, setActions] = useState([]);
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

  // Execution
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionReport, setExecutionReport] = useState(null);

  const effectiveRows = useMemo(() => {
    if (editorMode === "actionOnly") return [{}];
    return dataSourceType === "manual" ? manualRows : rows;
  }, [editorMode, dataSourceType, manualRows, rows]);

  const columns = useMemo(() => {
    if (editorMode === "actionOnly") return [];
    if (dataSourceType === "manual") return manualColumns;
    if (!effectiveRows.length) return [];
    return Object.keys(effectiveRows[0] || {});
  }, [editorMode, dataSourceType, manualColumns, effectiveRows]);

  useEffect(() => {
    setNodes(getEditorNodes(editorMode));
    setEdges(getEditorEdges(editorMode));
    setActivePanel("target");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode]);

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

  const handleSheetChange = async (sheetName, file) => {
    setSelectedSheet(sheetName);
    if (file) {
      const data = await extractAllRows(file, sheetName);
      setRows(data);
    }
  };

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
      ...(editorMode === "data"
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
            // Mode action-only: dataSource & mapping tidak diperlukan,
            // tapi tetap diset minimal agar runner aman.
            dataSource: {
              type: "manual",
              rows: [{}],
              mode: "single",
              selectedRowIndex: 0,
            },
            fieldMappings: [],
            execution,
          }),
      actions: actions.map((action) => ({
        type: action.type,
        target: action.target,
        ...(action.value !== undefined ? { value: action.value } : {}),
        ...(action.waitFor ? { waitFor: action.waitFor } : {}),
      })),
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

  const handleRun = async () => {
    if (!targetUrl.trim()) return alert("Target URL harus diisi");
    if (!pageReadyValue.trim()) return alert("Page Ready Indicator harus diisi");

    if (requiresLogin) {
      if (!loginUrl.trim()) return alert("Login URL harus diisi");
      if (!loginUsername.trim()) return alert("Username harus diisi");
      if (!loginPassword.trim()) return alert("Password harus diisi");
    }

    if (editorMode === "data") {
      if (!effectiveRows.length) return alert("Data source harus diisi");
      if (!fieldMappings.length)
        return alert("Minimal satu field mapping harus didefinisikan");
    }
    if (!actions.length) return alert("Minimal satu action harus didefinisikan");
    if (editorMode === "actionOnly") {
      const hasFill = actions.some((a) => a.type === "fill");
      if (hasFill) {
        return alert(
          "Mode Action-only tidak mendukung aksi 'fill' tanpa Field Mapping. Gunakan click/wait/navigate/handleDialog."
        );
      }
      if (execution?.mode === "loop") {
        const maxIt = Number(execution.loop?.maxIterations || 0);
        if (!maxIt || maxIt < 1) return alert("Max iterasi harus >= 1");
        const stopValue = execution.loop?.indicator?.value?.trim();
        if (!stopValue) return alert("Stop condition harus diisi untuk mode loop");
      }
    }

    setIsExecuting(true);
    setExecutionReport(null);

    try {
      const report = await runAutomation(generateAutomationPlan());
      setExecutionReport(report);
      setActivePanel("preview");
    } catch (error) {
      console.error("Execution error:", error);
      setExecutionReport({
        status: "error",
        message: error.message,
      });
      setActivePanel("preview");
    } finally {
      setIsExecuting(false);
    }
  };

  const onNodeClick = (_, node) => {
    const panel = node?.data?.panel;
    if (panel) setActivePanel(panel);
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-[#f7faff] via-[#ecf2ff] to-[#fafafb]">
      <div className="mx-auto max-w-[1800px] px-4 py-3">
        <div className="mb-3 text-center">
          <p className="text-xs font-medium text-[#3b82f6] uppercase tracking-wide">
            Node-based Editor
          </p>
          <h1 className="mt-1 text-xl font-bold text-[#1a1a1a] drop-shadow-sm">
            Rancang Automation Plan dengan Node
          </h1>
          <p className="mt-1 text-xs text-[#586581] max-w-2xl mx-auto">
            Klik node di canvas untuk membuka detail input di panel kanan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-800">
                  Canvas
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={editorMode === "data"}
                      onChange={() => setEditorMode("data")}
                    />
                    Data-driven
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={editorMode === "actionOnly"}
                      onChange={() => setEditorMode("actionOnly")}
                    />
                    Action-only (bulk)
                  </label>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Action-only: langsung dari Target ke Alur Aksi, bisa loop sampai
                trigger tertentu (contoh: data habis saat bulk delete).
              </p>
            </div>

            <div className="h-[calc(100vh-260px)] min-h-[520px]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-3 h-[calc(100vh-210px)] min-h-[520px] overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  Detail Node
                </h2>
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  {activePanel}
                </span>
              </div>

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
                <>
                  {editorMode === "data" ? (
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
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-700">
                        Mode <span className="font-semibold">Action-only</span>{" "}
                        tidak membutuhkan Sumber Data.
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Jika ingin mengisi field berdasarkan data, ganti ke mode
                        Data-driven.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activePanel === "mapping" && (
                <>
                  {editorMode === "data" ? (
                    <FieldMappingSection
                      fieldMappings={fieldMappings}
                      setFieldMappings={setFieldMappings}
                      columns={columns}
                    />
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-700">
                        Mode <span className="font-semibold">Action-only</span>{" "}
                        tidak membutuhkan Field Mapping.
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Untuk aksi <span className="font-mono">fill</span>, ganti
                        ke mode Data-driven.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activePanel === "actions" && (
                <ActionFlowSection
                  actions={actions}
                  setActions={setActions}
                  fieldMappings={fieldMappings}
                  successIndicator={successIndicator}
                  setSuccessIndicator={setSuccessIndicator}
                  failureIndicator={failureIndicator}
                  setFailureIndicator={setFailureIndicator}
                  execution={execution}
                  setExecution={setExecution}
                  allowFill={editorMode === "data"}
                />
              )}

              {activePanel === "preview" && (
                <div className="space-y-3">
                  <AutomationPlanPreview
                    plan={generateAutomationPlan()}
                    effectiveRows={effectiveRows}
                  />
                  {executionReport ? (
                    <ExecutionReport report={executionReport} />
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-3">
                      <p className="text-sm text-gray-500 text-center">
                        Belum ada hasil eksekusi.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xl"
          >
            {isExecuting ? "Menjalankan..." : "Jalankan Automation Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

