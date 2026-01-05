/**
 * Session persistence utilities using localStorage
 * Saves and loads editor state to prevent data loss on refresh/back
 */

const STORAGE_KEY = "privylens_editor_state";
const EXECUTION_LOGS_KEY = "privylens_execution_logs";

/**
 * Save editor state to localStorage
 */
export function saveEditorState(state) {
  try {
    const stateToSave = {
      // Target configuration
      targetUrl: state.targetUrl || "",
      requiresLogin: state.requiresLogin || false,
      loginUrl: state.loginUrl || "",
      loginUsername: state.loginUsername || "",
      loginPassword: state.loginPassword || "",
      navigationSteps: state.navigationSteps || [],
      pageReadyType: state.pageReadyType || "selector",
      pageReadyValue: state.pageReadyValue || "",

      // Data source
      dataSourceType: state.dataSourceType || "upload",
      rows: state.rows || [],
      manualRows: state.manualRows || [{}],
      manualColumns: state.manualColumns || ["field1"],
      dataMode: state.dataMode || "single",
      xlsxSheets: state.xlsxSheets || [],
      selectedSheet: state.selectedSheet || "",
      selectedRowIndex: state.selectedRowIndex || 0,

      // Field mappings
      fieldMappings: state.fieldMappings || [],

      // Actions (from nodes)
      nodes: state.nodes || [],
      edges: state.edges || [],

      // Execution settings
      successIndicator: state.successIndicator || { type: "selector", value: "" },
      failureIndicator: state.failureIndicator || { type: "selector", value: "" },
      execution: state.execution || {
        mode: "once",
        loop: {
          maxIterations: 50,
          delaySeconds: 0,
          stopWhen: "notVisible",
          indicator: { type: "selector", value: "" },
        },
      },

      // Timestamp
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    return true;
  } catch (error) {
    console.error("Failed to save editor state:", error);
    return false;
  }
}

/**
 * Load editor state from localStorage
 */
export function loadEditorState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved);
    return state;
  } catch (error) {
    console.error("Failed to load editor state:", error);
    return null;
  }
}

/**
 * Clear editor state from localStorage
 */
export function clearEditorState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear editor state:", error);
    return false;
  }
}

/**
 * Save execution log
 */
export function saveExecutionLog(report, plan, metadata = {}) {
  try {
    const logs = getExecutionLogs();
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      report: {
        ...report,
        endTime: report.endTime || new Date().toISOString(),
      },
      plan: {
        // Save minimal plan info (no sensitive data)
        target: {
          url: plan.target?.url || "",
        },
        templateName: metadata.templateName || plan.templateName || "Manual Execution",
        templateVersion: metadata.templateVersion || plan.templateVersion || "N/A",
        summary: report.summary,
      },
    };

    logs.unshift(newLog); // Add to beginning
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(50);
    }

    localStorage.setItem(EXECUTION_LOGS_KEY, JSON.stringify(logs));
    return newLog.id;
  } catch (error) {
    console.error("Failed to save execution log:", error);
    return null;
  }
}

/**
 * Get all execution logs
 */
export function getExecutionLogs() {
  try {
    const logs = localStorage.getItem(EXECUTION_LOGS_KEY);
    if (!logs) return [];
    return JSON.parse(logs);
  } catch (error) {
    console.error("Failed to get execution logs:", error);
    return [];
  }
}

/**
 * Get execution log by ID
 */
export function getExecutionLogById(id) {
  try {
    const logs = getExecutionLogs();
    return logs.find((log) => log.id === id) || null;
  } catch (error) {
    console.error("Failed to get execution log:", error);
    return null;
  }
}

/**
 * Clear all execution logs
 */
export function clearExecutionLogs() {
  try {
    localStorage.removeItem(EXECUTION_LOGS_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear execution logs:", error);
    return false;
  }
}

