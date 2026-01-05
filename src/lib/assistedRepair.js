/**
 * Assisted Repair Mode System
 * Memungkinkan pause, manual repair, dan resume deterministik saat kegagalan
 */

/**
 * State eksekusi yang disimpan untuk recovery
 */
export function createExecutionState(context) {
  return {
    timestamp: new Date().toISOString(),
    rowIndex: context.rowIndex,
    actionIndex: context.actionIndex,
    totalRows: context.totalRows,
    totalActions: context.totalActions,
    currentAction: context.currentAction,
    dataRow: context.dataRow,
    pageUrl: context.pageUrl,
    pageState: {
      url: context.pageUrl,
      title: context.pageTitle,
    },
    failureMetadata: context.failureMetadata,
    browserState: {
      // Browser context info (untuk referensi)
      viewport: context.viewport,
    },
  };
}

/**
 * Simpan execution state untuk recovery
 */
export function saveExecutionState(state, storageKey = "privylens_repair_state") {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Failed to save execution state:", error);
    return false;
  }
}

/**
 * Load execution state untuk recovery
 */
export function loadExecutionState(storageKey = "privylens_repair_state") {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error("Failed to load execution state:", error);
    return null;
  }
}

/**
 * Clear execution state
 */
export function clearExecutionState(storageKey = "privylens_repair_state") {
  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error("Failed to clear execution state:", error);
    return false;
  }
}

/**
 * Repair action options
 */
export const REPAIR_ACTIONS = {
  CONTINUE: "continue", // Lanjutkan ke action/row berikutnya
  RETRY: "retry", // Ulangi action yang gagal
  SKIP_ROW: "skip_row", // Skip row saat ini
  ABORT: "abort", // Hentikan batch
  MANUAL_FIX: "manual_fix", // User akan perbaiki manual, lalu continue
};

/**
 * Repair decision dari user
 */
export function createRepairDecision(action, options = {}) {
  return {
    action,
    timestamp: new Date().toISOString(),
    options: {
      retryCount: options.retryCount || 0,
      skipRemaining: options.skipRemaining || false,
      notes: options.notes || "",
      ...options,
    },
  };
}

