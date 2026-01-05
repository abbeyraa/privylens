/**
 * Failure Intelligence System
 * Mengklasifikasikan dan menganalisis kegagalan automation untuk memberikan
 * insight yang dapat ditindaklanjuti dan rekomendasi perbaikan.
 */

/**
 * Kategori kegagalan yang dikenali sistem
 */
export const FAILURE_CATEGORIES = {
  SELECTOR_CHANGE: "selector_change",
  LABEL_CHANGE: "label_change",
  FORM_VALIDATION: "form_validation",
  SESSION_EXPIRED: "session_expired",
  TIMING_ISSUE: "timing_issue",
  PAGE_LOADING: "page_loading",
  UI_CHANGE: "ui_change",
  NETWORK_ERROR: "network_error",
  ELEMENT_NOT_FOUND: "element_not_found",
  ACTION_FAILED: "action_failed",
  UNKNOWN: "unknown",
};

/**
 * Severity level untuk kegagalan
 */
export const FAILURE_SEVERITY = {
  CRITICAL: "critical", // Menghentikan batch
  HIGH: "high", // Membutuhkan perbaikan segera
  MEDIUM: "medium", // Dapat diatasi dengan retry
  LOW: "low", // Informational
};

/**
 * Klasifikasi kegagalan berdasarkan error message dan context
 */
export function classifyFailure(error, context = {}) {
  const errorMessage = error?.message || error || "";
  const errorLower = errorMessage.toLowerCase();

  // Context information
  const { actionType, target, fieldName, pageUrl, elementType } = context;

  // Klasifikasi berdasarkan pola error
  if (
    errorLower.includes("not found") ||
    errorLower.includes("element not found") ||
    errorLower.includes("locator") ||
    errorLower.includes("selector")
  ) {
    // Cek apakah ini selector atau label
    if (fieldName || target?.includes("label") || target?.includes("text")) {
      return {
        category: FAILURE_CATEGORIES.LABEL_CHANGE,
        severity: FAILURE_SEVERITY.HIGH,
        reason: "Label atau teks field tidak ditemukan",
        confidence: 0.8,
      };
    }
    return {
      category: FAILURE_CATEGORIES.SELECTOR_CHANGE,
      severity: FAILURE_SEVERITY.HIGH,
      reason: "Selector element tidak ditemukan atau berubah",
      confidence: 0.8,
    };
  }

  if (
    errorLower.includes("timeout") ||
    errorLower.includes("waiting") ||
    errorLower.includes("time")
  ) {
    if (errorLower.includes("page") || errorLower.includes("load")) {
      return {
        category: FAILURE_CATEGORIES.PAGE_LOADING,
        severity: FAILURE_SEVERITY.MEDIUM,
        reason: "Halaman membutuhkan waktu loading lebih lama",
        confidence: 0.7,
      };
    }
    return {
      category: FAILURE_CATEGORIES.TIMING_ISSUE,
      severity: FAILURE_SEVERITY.MEDIUM,
      reason: "Masalah timing atau delay yang tidak cukup",
      confidence: 0.7,
    };
  }

  if (
    errorLower.includes("session") ||
    errorLower.includes("login") ||
    errorLower.includes("authenticate") ||
    errorLower.includes("unauthorized")
  ) {
    return {
      category: FAILURE_CATEGORIES.SESSION_EXPIRED,
      severity: FAILURE_SEVERITY.CRITICAL,
      reason: "Sesi login telah kadaluarsa atau tidak valid",
      confidence: 0.9,
    };
  }

  if (
    errorLower.includes("validation") ||
    errorLower.includes("invalid") ||
    errorLower.includes("required") ||
    errorLower.includes("format")
  ) {
    return {
      category: FAILURE_CATEGORIES.FORM_VALIDATION,
      severity: FAILURE_SEVERITY.HIGH,
      reason: "Validasi form gagal atau data tidak valid",
      confidence: 0.8,
    };
  }

  if (
    errorLower.includes("network") ||
    errorLower.includes("connection") ||
    errorLower.includes("fetch")
  ) {
    return {
      category: FAILURE_CATEGORIES.NETWORK_ERROR,
      severity: FAILURE_SEVERITY.HIGH,
      reason: "Masalah koneksi jaringan atau server",
      confidence: 0.8,
    };
  }

  if (
    errorLower.includes("visible") ||
    errorLower.includes("hidden") ||
    errorLower.includes("display")
  ) {
    return {
      category: FAILURE_CATEGORIES.UI_CHANGE,
      severity: FAILURE_SEVERITY.MEDIUM,
      reason: "Perubahan UI atau elemen tidak terlihat",
      confidence: 0.7,
    };
  }

  // Default classification
  return {
    category: FAILURE_CATEGORIES.UNKNOWN,
    severity: FAILURE_SEVERITY.MEDIUM,
    reason: "Kegagalan tidak dapat diklasifikasikan dengan pasti",
    confidence: 0.5,
  };
}

/**
 * Membuat metadata kegagalan yang terstruktur
 */
export function createFailureMetadata(error, context = {}) {
  const classification = classifyFailure(error, context);
  const timestamp = new Date().toISOString();

  return {
    id: `failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    error: {
      message: error?.message || String(error),
      stack: error?.stack,
      name: error?.name,
    },
    classification,
    context: {
      rowIndex: context.rowIndex,
      actionIndex: context.actionIndex,
      actionType: context.actionType,
      target: context.target,
      fieldName: context.fieldName,
      fieldMapping: context.fieldMapping,
      pageUrl: context.pageUrl,
      elementType: context.elementType,
      dataRow: context.dataRow,
      pageReadyIndicator: context.pageReadyIndicator,
    },
    metadata: {
      browser: context.browser,
      viewport: context.viewport,
      userAgent: context.userAgent,
    },
  };
}

/**
 * Menghasilkan rekomendasi perbaikan berdasarkan klasifikasi
 */
export function generateRepairRecommendations(failureMetadata) {
  const { classification, context } = failureMetadata;
  const recommendations = [];

  switch (classification.category) {
    case FAILURE_CATEGORIES.LABEL_CHANGE:
      recommendations.push({
        priority: "high",
        action: "check_label",
        message: `Periksa label field "${context.fieldName || context.target}" di halaman`,
        steps: [
          `Buka halaman: ${context.pageUrl || "target URL"}`,
          `Cari field dengan label yang mirip dengan "${context.target}"`,
          `Update field mapping dengan label baru yang ditemukan`,
        ],
      });
      if (context.fieldMapping?.fallbackLabels) {
        recommendations.push({
          priority: "medium",
          action: "add_fallback",
          message: "Pertimbangkan menambahkan fallback labels alternatif",
        });
      }
      break;

    case FAILURE_CATEGORIES.SELECTOR_CHANGE:
      recommendations.push({
        priority: "high",
        action: "check_selector",
        message: `Selector untuk "${context.target}" mungkin telah berubah`,
        steps: [
          `Inspect element di browser untuk mendapatkan selector baru`,
          `Update action target dengan selector yang valid`,
        ],
      });
      break;

    case FAILURE_CATEGORIES.FORM_VALIDATION:
      recommendations.push({
        priority: "high",
        action: "check_data",
        message: `Validasi form gagal untuk field "${context.fieldName}"`,
        steps: [
          `Periksa format data yang dikirim: ${JSON.stringify(context.dataRow?.[context.fieldMapping?.dataKey] || {})}`,
          `Pastikan data sesuai dengan requirement field`,
          `Cek apakah field required dan sudah terisi`,
        ],
      });
      break;

    case FAILURE_CATEGORIES.SESSION_EXPIRED:
      recommendations.push({
        priority: "critical",
        action: "re_login",
        message: "Sesi login telah kadaluarsa",
        steps: [
          "Periksa kredensial login",
          "Pastikan session timeout setting sesuai",
          "Pertimbangkan menambahkan auto-refresh session",
        ],
      });
      break;

    case FAILURE_CATEGORIES.TIMING_ISSUE:
      recommendations.push({
        priority: "medium",
        action: "increase_delay",
        message: "Tambahkan delay atau wait time yang lebih lama",
        steps: [
          "Tambahkan wait action sebelum action yang gagal",
          "Atau periksa page ready indicator",
        ],
      });
      break;

    case FAILURE_CATEGORIES.PAGE_LOADING:
      recommendations.push({
        priority: "medium",
        action: "check_loading",
        message: "Halaman membutuhkan waktu loading lebih lama",
        steps: [
          "Periksa page ready indicator",
          "Tambahkan wait untuk elemen loading selesai",
          "Pertimbangkan menambahkan timeout yang lebih lama",
        ],
      });
      break;

    case FAILURE_CATEGORIES.UI_CHANGE:
      recommendations.push({
        priority: "medium",
        action: "check_ui",
        message: "UI mungkin telah berubah atau elemen tersembunyi",
        steps: [
          "Periksa apakah ada modal atau overlay yang menutupi elemen",
          "Cek apakah elemen perlu di-scroll untuk terlihat",
          "Verifikasi bahwa elemen masih ada di halaman",
        ],
      });
      break;

    case FAILURE_CATEGORIES.NETWORK_ERROR:
      recommendations.push({
        priority: "high",
        action: "check_network",
        message: "Masalah koneksi jaringan",
        steps: [
          "Periksa koneksi internet",
          "Cek apakah server target dapat diakses",
          "Pertimbangkan retry dengan delay",
        ],
      });
      break;

    default:
      recommendations.push({
        priority: "medium",
        action: "review_error",
        message: "Periksa error message untuk detail lebih lanjut",
        steps: [
          "Baca error message dengan teliti",
          "Periksa context eksekusi saat kegagalan",
          "Cek log browser console untuk error tambahan",
        ],
      });
  }

  return recommendations;
}

/**
 * Menganalisis pola kegagalan dari multiple failures
 */
export function analyzeFailurePatterns(failures) {
  if (!failures || failures.length === 0) {
    return {
      mostCommonCategory: null,
      frequency: {},
      recommendations: [],
    };
  }

  // Hitung frekuensi setiap kategori
  const frequency = {};
  failures.forEach((failure) => {
    const category = failure.classification?.category || FAILURE_CATEGORIES.UNKNOWN;
    frequency[category] = (frequency[category] || 0) + 1;
  });

  // Temukan kategori paling umum
  const mostCommonCategory = Object.keys(frequency).reduce((a, b) =>
    frequency[a] > frequency[b] ? a : b
  );

  // Generate aggregate recommendations
  const recommendations = [];
  if (frequency[FAILURE_CATEGORIES.LABEL_CHANGE] > 0) {
    recommendations.push({
      priority: "high",
      message: `${frequency[FAILURE_CATEGORIES.LABEL_CHANGE]} kegagalan karena perubahan label. Pertimbangkan untuk update field mappings.`,
    });
  }
  if (frequency[FAILURE_CATEGORIES.SESSION_EXPIRED] > 0) {
    recommendations.push({
      priority: "critical",
      message: `${frequency[FAILURE_CATEGORIES.SESSION_EXPIRED]} kegagalan karena sesi expired. Periksa login configuration.`,
    });
  }

  return {
    mostCommonCategory,
    frequency,
    totalFailures: failures.length,
    recommendations,
  };
}

/**
 * Format failure untuk ditampilkan di report (user-friendly)
 */
export function formatFailureForReport(failureMetadata) {
  const { classification, context, error } = failureMetadata;
  const recommendations = generateRepairRecommendations(failureMetadata);

  return {
    category: classification.category,
    severity: classification.severity,
    reason: classification.reason,
    userFriendlyMessage: getUserFriendlyMessage(classification, context),
    recommendations,
    context: {
      row: context.rowIndex !== undefined ? `Baris ${context.rowIndex + 1}` : "Unknown",
      action: context.actionType || "Unknown action",
      field: context.fieldName || context.target || "Unknown field",
    },
    technicalDetails: {
      error: error.message,
      target: context.target,
      pageUrl: context.pageUrl,
    },
  };
}

/**
 * Generate user-friendly message
 */
function getUserFriendlyMessage(classification, context) {
  const { category } = classification;
  const fieldName = context.fieldName || context.target || "field";

  switch (category) {
    case FAILURE_CATEGORIES.LABEL_CHANGE:
      return `Field "${fieldName}" tidak ditemukan. Label mungkin telah berubah di halaman.`;
    case FAILURE_CATEGORIES.SELECTOR_CHANGE:
      return `Elemen "${fieldName}" tidak dapat ditemukan. Selector mungkin telah berubah.`;
    case FAILURE_CATEGORIES.FORM_VALIDATION:
      return `Validasi gagal untuk field "${fieldName}". Periksa format data yang dikirim.`;
    case FAILURE_CATEGORIES.SESSION_EXPIRED:
      return `Sesi login telah kadaluarsa. Perlu login ulang.`;
    case FAILURE_CATEGORIES.TIMING_ISSUE:
      return `Waktu tunggu tidak cukup untuk action "${fieldName}".`;
    case FAILURE_CATEGORIES.PAGE_LOADING:
      return `Halaman membutuhkan waktu loading lebih lama.`;
    case FAILURE_CATEGORIES.UI_CHANGE:
      return `Elemen "${fieldName}" tidak terlihat atau UI telah berubah.`;
    case FAILURE_CATEGORIES.NETWORK_ERROR:
      return `Masalah koneksi jaringan saat mengakses halaman.`;
    default:
      return `Terjadi kegagalan saat memproses "${fieldName}".`;
  }
}

