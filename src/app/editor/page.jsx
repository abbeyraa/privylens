"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { extractAllRows, getXlsxSheets } from "@/lib/api";
import { runAutomation } from "@/app/actions/runAutomation";
import {
  saveEditorState,
  loadEditorState,
  saveExecutionLog,
} from "@/lib/sessionStorage";
import { getSetting } from "@/lib/settingsStorage";
import { getTemplates, saveTemplates, migrateToFileStorage } from "@/lib/templateStorage";
import StepCard from "./components/steps/StepCard";
import StepEditor from "./components/steps/StepEditor";
import AutomationPlanPreview from "./components/execution/AutomationPlanPreview";
import ExecutionReport from "./components/execution/ExecutionReport";
import SaveTemplateDialog from "./components/SaveTemplateDialog";
import { validateAutomationPlan } from "./utils/validationHelpers";
import {
  Play,
  Save,
  Eye,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Helper untuk convert state ke steps
const convertStateToSteps = (state) => {
  const steps = [];

  // Step 1: Target (always first, not deletable)
  steps.push({
    id: "target",
    type: "target",
    deletable: false,
    disabled: false,
    data: {
      targetUrl: state.targetUrl || "",
      requiresLogin: state.requiresLogin || false,
      loginUrl: state.loginUrl || "",
      loginUsername: state.loginUsername || "",
      loginPassword: state.loginPassword || "",
      navigationSteps: state.navigationSteps || [],
      pageReadyType: state.pageReadyType || "selector",
      pageReadyValue: state.pageReadyValue || "",
    },
    summary: state.targetUrl || "Target belum dikonfigurasi",
    isValid: !!state.targetUrl && !!state.pageReadyValue,
    hasError: !state.targetUrl || !state.pageReadyValue,
  });

  // Step 2: Data Source (optional)
  if (state.hasDataSourceNode) {
    steps.push({
      id: "dataSource",
      type: "dataSource",
      deletable: true,
      disabled: false,
      data: {
        type: state.dataSourceType || "upload",
        rows: state.rows || [],
        manualRows: state.manualRows || [{}],
        manualColumns: state.manualColumns || ["field1"],
        mode: state.dataMode || "single",
        xlsxSheets: state.xlsxSheets || [],
        selectedSheet: state.selectedSheet || "",
        selectedRowIndex: state.selectedRowIndex || 0,
      },
      summary: `${state.dataSourceType === "upload" ? "Upload" : "Manual"} data (${state.rows?.length || 0} rows)`,
      isValid: (state.rows?.length || 0) > 0,
      hasError: false,
    });

    // Step 3: Field Mapping (if data source exists)
    steps.push({
      id: "fieldMapping",
      type: "fieldMapping",
      deletable: true,
      disabled: false,
      data: {
        mappings: state.fieldMappings || [],
      },
      summary: `${state.fieldMappings?.length || 0} field mappings`,
      isValid: (state.fieldMappings?.length || 0) > 0,
      hasError: false,
    });
  }

  // Step 4: Actions (from action nodes)
  const actionNodes = state.actionNodes || [];
  actionNodes.forEach((node, index) => {
    steps.push({
      id: node.id || `action-${index}`,
      type: "action",
      actionType: node.data?.actionType || "click",
      deletable: true,
      disabled: false,
      data: {
        type: node.data?.actionType || "click",
        target: node.data?.actionTarget || "",
        value: node.data?.actionValue,
        waitFor: node.data?.actionWaitFor,
      },
      summary: `${node.data?.actionType || "click"}: ${node.data?.actionTarget || "belum dikonfigurasi"}`,
      isValid: !!node.data?.actionTarget,
      hasError: !node.data?.actionTarget,
    });
  });

  // Step 5: Success Indicator (optional)
  if (state.successIndicator?.value) {
    steps.push({
      id: "successIndicator",
      type: "successIndicator",
      deletable: true,
      disabled: false,
      data: {
        type: state.successIndicator.type,
        value: state.successIndicator.value,
      },
      summary: `Success: ${state.successIndicator.value}`,
      isValid: true,
      hasError: false,
    });
  }

  // Step 6: Failure Indicator (optional)
  if (state.failureIndicator?.value) {
    steps.push({
      id: "failureIndicator",
      type: "failureIndicator",
      deletable: true,
      disabled: false,
      data: {
        type: state.failureIndicator.type,
        value: state.failureIndicator.value,
      },
      summary: `Failure: ${state.failureIndicator.value}`,
      isValid: true,
      hasError: false,
    });
  }

  // Step 7: Execution Settings (optional)
  if (state.execution?.mode === "loop") {
    steps.push({
      id: "execution",
      type: "execution",
      deletable: true,
      disabled: false,
      data: {
        mode: state.execution.mode,
        loop: state.execution.loop,
      },
      summary: `Loop execution (max ${state.execution.loop?.maxIterations || 50} iterations)`,
      isValid: true,
      hasError: false,
    });
  }

  return steps;
};

// Helper untuk convert steps ke state
const convertStepsToState = (steps, currentState) => {
  const state = { ...currentState };

  steps.forEach((step) => {
    if (step.type === "target") {
      state.targetUrl = step.data.targetUrl || "";
      state.requiresLogin = step.data.requiresLogin || false;
      state.loginUrl = step.data.loginUrl || "";
      state.loginUsername = step.data.loginUsername || "";
      state.loginPassword = step.data.loginPassword || "";
      state.navigationSteps = step.data.navigationSteps || [];
      state.pageReadyType = step.data.pageReadyType || "selector";
      state.pageReadyValue = step.data.pageReadyValue || "";
    } else if (step.type === "dataSource") {
      state.hasDataSourceNode = true;
      state.dataSourceType = step.data.type || "upload";
      state.rows = step.data.rows || [];
      state.manualRows = step.data.manualRows || [{}];
      state.manualColumns = step.data.manualColumns || ["field1"];
      state.dataMode = step.data.mode || "single";
      state.xlsxSheets = step.data.xlsxSheets || [];
      state.selectedSheet = step.data.selectedSheet || "";
      state.selectedRowIndex = step.data.selectedRowIndex || 0;
    } else if (step.type === "fieldMapping") {
      state.fieldMappings = step.data.mappings || [];
    } else if (step.type === "action") {
      // Convert actions back to nodes format
      if (!state.actionNodes) state.actionNodes = [];
      const existingIndex = state.actionNodes.findIndex(
        (n) => n.id === step.id
      );
      const actionNode = {
        id: step.id,
        type: "action",
        position: { x: 60, y: 200 + state.actionNodes.length * 100 },
        data: {
          actionType: step.actionType,
          actionTarget: step.data.target || "",
          actionValue: step.data.value,
          actionWaitFor: step.data.waitFor,
        },
      };
      if (existingIndex >= 0) {
        state.actionNodes[existingIndex] = actionNode;
      } else {
        state.actionNodes.push(actionNode);
      }
    } else if (step.type === "successIndicator") {
      state.successIndicator = {
        type: step.data.type,
        value: step.data.value,
      };
    } else if (step.type === "failureIndicator") {
      state.failureIndicator = {
        type: step.data.type,
        value: step.data.value,
      };
    } else if (step.type === "execution") {
      state.execution = {
        mode: step.data.mode,
        loop: step.data.loop,
      };
    }
  });

  // Remove data source if not in steps
  if (!steps.some((s) => s.type === "dataSource")) {
    state.hasDataSourceNode = false;
    state.fieldMappings = [];
  }

  return state;
};

// Sortable Item Component
function SortableStepCard({
  step,
  index,
  isExpanded,
  isDisabled,
  onEdit,
  onDelete,
  onToggle,
  onToggleDisable,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    disabled: step.deletable === false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <StepCard
        step={step}
        index={index}
        isDragging={isDragging}
        isExpanded={isExpanded}
        isDisabled={isDisabled}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onToggleDisable={onToggleDisable}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State management
  const [steps, setSteps] = useState([]);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [selectedStep, setSelectedStep] = useState(null);
  const [activePanel, setActivePanel] = useState("list"); // list, preview
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionReport, setExecutionReport] = useState(null);
  const [safeRun, setSafeRun] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("Automation Plan Editor");
  const [templateDescription, setTemplateDescription] = useState(
    "Susun langkah-langkah automasi dengan drag & drop"
  );
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Editor state (mirror dari state lama untuk kompatibilitas)
  const [targetUrl, setTargetUrl] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loginUrl, setLoginUrl] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [pageReadyType, setPageReadyType] = useState("selector");
  const [pageReadyValue, setPageReadyValue] = useState("");

  const [dataSourceType, setDataSourceType] = useState("upload");
  const [rows, setRows] = useState([]);
  const [manualRows, setManualRows] = useState([{}]);
  const [manualColumns, setManualColumns] = useState(["field1"]);
  const [dataMode, setDataMode] = useState("single");
  const [xlsxSheets, setXlsxSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  const [fieldMappings, setFieldMappings] = useState([]);
  const [actionNodes, setActionNodes] = useState([]);

  const [successIndicator, setSuccessIndicator] = useState({
    type: "selector",
    value: "",
  });
  const [failureIndicator, setFailureIndicator] = useState({
    type: "selector",
    value: "",
  });
  const [execution, setExecution] = useState({
    mode: "once",
    loop: {
      maxIterations: 50,
      delaySeconds: 0,
      stopWhen: "notVisible",
      indicator: { type: "selector", value: "" },
    },
  });

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Migrate and load template if templateId in URL
  useEffect(() => {
    // Migrate on mount (only runs once)
    migrateToFileStorage();
    
    const loadTemplate = async () => {
      const templateId = searchParams.get("templateId");
      if (templateId) {
        const templates = await getTemplates();
        const template = templates.find((t) => t.id === templateId);
        if (template) {
          setCurrentTemplateId(template.id);
          setTemplateName(template.name);
          setTemplateDescription(template.description || "");
          
          // Load template plan
          const activeVersion = template.versions?.find((v) => v.isActive);
          if (activeVersion?.plan) {
            const plan = activeVersion.plan;
            if (plan.target) {
              setTargetUrl(plan.target.url || "");
              setPageReadyType(plan.target.pageReadyIndicator?.type || "selector");
              setPageReadyValue(plan.target.pageReadyIndicator?.value || "");
              if (plan.target.login) {
                setRequiresLogin(true);
                setLoginUrl(plan.target.login.url || "");
                setLoginUsername(plan.target.login.username || "");
                setLoginPassword(plan.target.login.password || "");
              }
              if (plan.target.navigation) {
                setNavigationSteps(plan.target.navigation || []);
              }
            }
            if (plan.dataSource) {
              setDataSourceType(plan.dataSource.type || "upload");
              setRows(plan.dataSource.rows || []);
              setDataMode(plan.dataSource.mode || "single");
              setSelectedRowIndex(plan.dataSource.selectedRowIndex || 0);
            }
            if (plan.fieldMappings) {
              setFieldMappings(plan.fieldMappings || []);
            }
            if (plan.actions) {
              const actions = plan.actions.map((action, index) => ({
                id: `action-${Date.now()}-${index}`,
                type: "action",
                position: { x: 60, y: 200 + index * 100 },
                data: {
                  actionType: action.type,
                  actionTarget: action.target,
                  actionValue: action.value,
                  actionWaitFor: action.waitFor,
                },
              }));
              setActionNodes(actions);
            }
            if (plan.successIndicator) {
              setSuccessIndicator(plan.successIndicator);
            }
            if (plan.failureIndicator) {
              setFailureIndicator(plan.failureIndicator);
            }
            if (plan.execution) {
              setExecution(plan.execution);
            }
          }
          return; // Don't load editor state if template is loaded
        }
      }
    };
    
    loadTemplate();
  }, [searchParams]);

  // Load state on mount (only if no template loaded)
  useEffect(() => {
    if (currentTemplateId) return; // Skip if template is loaded
    
    const savedState = loadEditorState();
    if (savedState) {
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
      setSuccessIndicator(
        savedState.successIndicator || { type: "selector", value: "" }
      );
      setFailureIndicator(
        savedState.failureIndicator || { type: "selector", value: "" }
      );
      setExecution(
        savedState.execution || {
        mode: "once",
        loop: {
          maxIterations: 50,
          delaySeconds: 0,
          stopWhen: "notVisible",
          indicator: { type: "selector", value: "" },
        },
        }
      );

      // Convert nodes to actionNodes
      if (savedState.nodes) {
        const actions = savedState.nodes
          .filter((n) => n.type === "action")
          .map((n) => ({
            id: n.id,
            type: "action",
            position: n.position,
            data: {
              actionType: n.data?.actionType || "click",
              actionTarget: n.data?.actionTarget || "",
              actionValue: n.data?.actionValue,
              actionWaitFor: n.data?.actionWaitFor,
            },
          }));
        setActionNodes(actions);
      }
    }
  }, []);

  // Convert state to steps whenever state changes
  const hasDataSourceNode = useMemo(
    () => rows.length > 0 || manualRows.length > 0,
    [rows, manualRows]
  );

  useEffect(() => {
    const currentState = {
        targetUrl,
        requiresLogin,
        loginUrl,
        loginUsername,
        loginPassword,
        navigationSteps,
        pageReadyType,
        pageReadyValue,
      hasDataSourceNode,
        dataSourceType,
        rows,
        manualRows,
        manualColumns,
        dataMode,
        xlsxSheets,
        selectedSheet,
        selectedRowIndex,
        fieldMappings,
      actionNodes,
        successIndicator,
        failureIndicator,
        execution,
    };
    const newSteps = convertStateToSteps(currentState);
    setSteps(newSteps);
  }, [
    targetUrl,
    requiresLogin,
    loginUrl,
    loginUsername,
    loginPassword,
    navigationSteps,
    pageReadyType,
    pageReadyValue,
    hasDataSourceNode,
    dataSourceType,
    rows,
    manualRows,
    manualColumns,
    dataMode,
    xlsxSheets,
    selectedSheet,
    selectedRowIndex,
    fieldMappings,
    actionNodes,
    successIndicator,
    failureIndicator,
    execution,
  ]);

  // Auto-save state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentState = {
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
        nodes: actionNodes.map((a) => ({
          id: a.id,
          type: "action",
          position: a.position,
          data: {
            actionType: a.data.actionType,
            actionTarget: a.data.actionTarget,
            actionValue: a.data.actionValue,
            actionWaitFor: a.data.actionWaitFor,
          },
        })),
        edges: [],
        successIndicator,
        failureIndicator,
        execution,
      };
      saveEditorState(currentState);
    }, 1000);
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
    actionNodes,
    successIndicator,
    failureIndicator,
    execution,
  ]);

  // Auto-save template if autosave is enabled and template exists
  useEffect(() => {
    if (!currentTemplateId) return;
    
    const autoSaveEnabled = getSetting("autoSave");
    if (!autoSaveEnabled) return;

    const timeoutId = setTimeout(async () => {
      const plan = generateAutomationPlan();
      if (!plan.target?.url) return; // Don't save if invalid

      const templates = await getTemplates();
      const template = templates.find((t) => t.id === currentTemplateId);
      if (!template) return;

      // Update template name and description
      template.name = templateName;
      template.description = templateDescription;
      template.updatedAt = new Date().toISOString();

      // Update active version plan
      const activeVersion = template.versions.find((v) => v.isActive);
      if (activeVersion) {
        activeVersion.plan = plan;
        activeVersion.notes = `Auto-saved at ${new Date().toLocaleString("id-ID")}`;
      }

      // Update metadata
      template.metadata = {
        targetUrl: plan.target?.url || "",
        actionCount: plan.actions?.length || 0,
        fieldMappingCount: plan.fieldMappings?.length || 0,
      };

      const updated = templates.map((t) =>
        t.id === currentTemplateId ? template : t
      );
      await saveTemplates(updated).catch((error) => {
        console.error('Auto-save failed:', error);
      });
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timeoutId);
  }, [
    currentTemplateId,
    templateName,
    templateDescription,
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
    actionNodes,
    successIndicator,
    failureIndicator,
    execution,
  ]);

  const effectiveRows = useMemo(() => {
    if (dataSourceType === "upload") {
      return rows;
    }
    return manualRows;
  }, [dataSourceType, rows, manualRows]);

  const [activeId, setActiveId] = useState(null);

  // Drag handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Don't allow moving target step
        if (items[oldIndex].deletable === false) {
          return items;
        }

        const newSteps = arrayMove(items, oldIndex, newIndex);

        // Update action nodes positions based on new order
        const actionSteps = newSteps.filter((s) => s.type === "action");
        setActionNodes((prev) => {
          return actionSteps.map((step, index) => {
            const existing = prev.find((a) => a.id === step.id);
            if (existing) {
              return {
                ...existing,
                position: { x: 60, y: 200 + index * 100 },
              };
            }
            return existing;
          }).filter(Boolean);
        });

        return newSteps;
      });
    }
  };


  // Step handlers
  const toggleStepExpansion = (stepId) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleEditStep = (step) => {
    setSelectedStep(step);
  };

  const handleDeleteStep = (stepId) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step || step.deletable === false) return;

    if (step.type === "dataSource") {
      // Remove data source and field mapping
      setRows([]);
      setManualRows([{}]);
      setManualColumns(["field1"]);
      setFieldMappings([]);
    } else if (step.type === "fieldMapping") {
      setFieldMappings([]);
    } else if (step.type === "action") {
      setActionNodes((prev) => prev.filter((a) => a.id !== stepId));
    } else if (step.type === "successIndicator") {
      setSuccessIndicator({ type: "selector", value: "" });
    } else if (step.type === "failureIndicator") {
      setFailureIndicator({ type: "selector", value: "" });
    } else if (step.type === "execution") {
      setExecution({
        mode: "once",
        loop: {
          maxIterations: 50,
          delaySeconds: 0,
          stopWhen: "notVisible",
          indicator: { type: "selector", value: "" },
        },
      });
    }
  };

  const handleToggleDisableStep = (stepId) => {
    // For now, we'll just mark it visually
    // In future, we can add disabled state to steps
  };

  const handleAddStep = (stepType) => {
    if (stepType === "dataSource") {
      // Add data source step - set initial data
      setDataSourceType("upload");
      setRows([]);
      setManualRows([{}]);
      setManualColumns(["field1"]);
      setDataMode("single");
      setFieldMappings([]);
    } else if (stepType === "action") {
      const newAction = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "action",
        position: {
          x: 60,
          y: 200 + actionNodes.length * 100,
        },
        data: {
          actionType: "click",
          actionTarget: "",
        },
      };
      setActionNodes((prev) => [...prev, newAction]);
    } else if (stepType === "successIndicator") {
      setSuccessIndicator({ type: "selector", value: "" });
    } else if (stepType === "failureIndicator") {
      setFailureIndicator({ type: "selector", value: "" });
    } else if (stepType === "execution") {
      setExecution({
        mode: "loop",
        loop: {
          maxIterations: 50,
          delaySeconds: 0,
          stopWhen: "notVisible",
          indicator: { type: "selector", value: "" },
        },
      });
    }
  };

  // Generate automation plan
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
            })),
          }
        : {
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
          // Sort by position in steps array
          const aIndex = steps.findIndex((s) => s.id === a.id);
          const bIndex = steps.findIndex((s) => s.id === b.id);
          return aIndex - bIndex;
        })
        .map((node) => ({
          type: node.data.actionType,
          target: node.data.actionTarget,
          ...(node.data.actionValue !== undefined
            ? { value: node.data.actionValue }
            : {}),
          ...(node.data.actionWaitFor ? { waitFor: node.data.actionWaitFor } : {}),
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

  // Save template
  const handleSaveTemplate = async (templateData) => {
    const plan = generateAutomationPlan();
    
    // Validasi minimal
    if (!plan.target?.url) {
      alert("Target URL harus diisi sebelum menyimpan template");
      return;
    }

    const templates = await getTemplates();
    
    const templateId = currentTemplateId || `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const name = templateData.name || templateName || "Untitled Template";
    const description = templateData.description || templateDescription || "";

    if (currentTemplateId) {
      // Update existing template
      const template = templates.find((t) => t.id === currentTemplateId);
      if (template) {
        template.name = name;
        template.description = description;
        template.updatedAt = new Date().toISOString();

        // Update active version plan
        const activeVersion = template.versions.find((v) => v.isActive);
        if (activeVersion) {
          activeVersion.plan = plan;
        }

        // Update metadata
        template.metadata = {
          targetUrl: plan.target?.url || "",
          actionCount: plan.actions?.length || 0,
          fieldMappingCount: plan.fieldMappings?.length || 0,
        };

        const updated = templates.map((t) =>
          t.id === currentTemplateId ? template : t
        );
        const success = await saveTemplates(updated);
        if (success) {
          setTemplateName(name);
          setTemplateDescription(description);
          setSaveTemplateDialogOpen(false);
          alert("Template berhasil diperbarui!");
        } else {
          alert("Gagal menyimpan template. Silakan coba lagi.");
        }
        return;
      }
    }

    // Create new template
    const newTemplate = {
      id: templateId,
      name: name,
      description: description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true,
      versions: [
        {
          version: "1.0.0",
          plan: plan,
          createdAt: new Date().toISOString(),
          createdBy: "System",
          isActive: true,
          notes: "Initial version",
        },
      ],
      metadata: {
        targetUrl: plan.target?.url || "",
        actionCount: plan.actions?.length || 0,
        fieldMappingCount: plan.fieldMappings?.length || 0,
      },
    };

    const updated = [...templates, newTemplate];
    const success = await saveTemplates(updated);
    if (success) {
      setCurrentTemplateId(templateId);
      setTemplateName(name);
      setTemplateDescription(description);
      setSaveTemplateDialogOpen(false);
      alert("Template berhasil disimpan!");
    } else {
      alert("Gagal menyimpan template. Silakan coba lagi.");
    }
  };

  // Run automation
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
      actionNodes: actionNodes.map((a) => ({
        id: a.id,
        data: {
          actionType: a.data.actionType,
          actionTarget: a.data.actionTarget,
        },
      })),
      getActionFromNode: (node) => node.data,
      execution,
    });

    if (errors.length > 0) {
      return alert(errors[0]);
    }

    setIsExecuting(true);
    setExecutionReport(null);
    setActivePanel("preview");

    let plan = null;
    try {
      plan = generateAutomationPlan();
      const report = await runAutomation(plan, safeRun);
      setExecutionReport(report);
      
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
      
      if (plan) {
        saveExecutionLog(errorReport, plan);
      } else {
        const minimalPlan = {
          target: { url: targetUrl || "" },
        };
        saveExecutionLog(errorReport, minimalPlan);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-8 py-4 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4">
            {/* Back Button - Only show when editing existing template */}
            {(currentTemplateId || searchParams.get("mode") === "edit") && (
              <button
                onClick={() => router.push("/templates")}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                title="Kembali ke halaman templates"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
            {isEditingName ? (
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingName(false);
                  }
                  if (e.key === "Escape") {
                    setIsEditingName(false);
                  }
                }}
                className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setIsEditingName(true)}
                title="Klik untuk mengedit nama template"
              >
                {templateName}
              </h1>
            )}
            {isEditingDescription ? (
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                onBlur={() => setIsEditingDescription(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingDescription(false);
                  }
                  if (e.key === "Escape") {
                    setIsEditingDescription(false);
                  }
                }}
                className="text-sm text-gray-600 mt-1 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                autoFocus
              />
            ) : (
              <p
                className="text-sm text-gray-600 mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setIsEditingDescription(true)}
                title="Klik untuk mengedit deskripsi template"
              >
                {templateDescription || "Klik untuk menambahkan deskripsi"}
              </p>
            )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={safeRun}
                onChange={(e) => setSafeRun(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Safe Run</span>
            </label>
            <button
              onClick={() => setSaveTemplateDialogOpen(true)}
              className="px-4 py-2 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Simpan Template
            </button>
            <button
              onClick={() => setActivePanel(activePanel === "list" ? "preview" : "list")}
              className="px-4 py-2 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {activePanel === "list" ? "Preview" : "Daftar Langkah"}
            </button>
            <button
              onClick={handleRun}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isExecuting ? "Menjalankan..." : "Jalankan"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {activePanel === "list" ? (
          <>
            {/* Steps List */}
            <div className="flex-1 overflow-y-auto p-8">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={steps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="max-w-4xl mx-auto space-y-4">
                    {steps.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">
                          Belum ada langkah. Mulai dengan mengkonfigurasi Target.
                        </p>
                      </div>
                    ) : (
                      steps.map((step, index) => (
                        <SortableStepCard
                          key={step.id}
                          step={step}
                          index={index}
                          isExpanded={expandedSteps[step.id]}
                          isDisabled={step.disabled}
                          onEdit={() => handleEditStep(step)}
                          onDelete={() => handleDeleteStep(step.id)}
                          onToggle={() => toggleStepExpansion(step.id)}
                          onToggleDisable={() => handleToggleDisableStep(step.id)}
                        />
                      ))
                    )}

                    {/* Add Step Buttons */}
                    <div className="mt-8 p-6 bg-white border-2 border-dashed border-[#e5e5e5] rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Tambah Langkah
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {!hasDataSourceNode && (
                          <button
                            onClick={() => handleAddStep("dataSource")}
                            className="px-4 py-3 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Data Source
                          </button>
                        )}
                <button
                          onClick={() => handleAddStep("action")}
                          className="px-4 py-3 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Action
                </button>
                        {!steps.some((s) => s.type === "successIndicator") && (
                <button
                            onClick={() => handleAddStep("successIndicator")}
                            className="px-4 py-3 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Success Indicator
                          </button>
                        )}
                        {!steps.some((s) => s.type === "failureIndicator") && (
                          <button
                            onClick={() => handleAddStep("failureIndicator")}
                            className="px-4 py-3 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Failure Indicator
                          </button>
                        )}
                        {!steps.some((s) => s.type === "execution") && (
                          <button
                            onClick={() => handleAddStep("execution")}
                            className="px-4 py-3 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Execution Settings
                          </button>
                        )}
                    </div>
                  </div>
              </div>
                </SortableContext>
                <DragOverlay>
                  {activeId && (
                    <div className="opacity-90 rotate-2">
                      <StepCard
                        step={steps.find((s) => s.id === activeId)}
                        index={steps.findIndex((s) => s.id === activeId)}
                        isDragging={true}
                        isExpanded={false}
                        isDisabled={false}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onToggle={() => {}}
                        onToggleDisable={() => {}}
                        dragHandleProps={{}}
                      />
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
        </div>

            {/* Step Editor Sidebar */}
            {selectedStep && (
              <StepEditor
                step={selectedStep}
                onClose={() => setSelectedStep(null)}
                onSave={() => {
                  // State sudah ter-update secara real-time
                  setSelectedStep(null);
                }}
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
                fieldMappings={fieldMappings}
                setFieldMappings={setFieldMappings}
                actions={actionNodes}
                setActions={setActionNodes}
                hasDataSourceNode={hasDataSourceNode}
                successIndicator={successIndicator}
                setSuccessIndicator={setSuccessIndicator}
                failureIndicator={failureIndicator}
                setFailureIndicator={setFailureIndicator}
                execution={execution}
                setExecution={setExecution}
              />
            )}
          </>
        ) : (
          /* Preview Panel */
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              {executionReport ? (
                <ExecutionReport report={executionReport} />
              ) : (
                <AutomationPlanPreview
                  plan={generateAutomationPlan()}
                  isExecuting={isExecuting}
                />
            )}
          </div>
        </div>
      )}
        </div>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={saveTemplateDialogOpen}
        onClose={() => setSaveTemplateDialogOpen(false)}
        onSave={handleSaveTemplate}
        existingTemplateName={templateName}
      />
    </div>
  );
}

