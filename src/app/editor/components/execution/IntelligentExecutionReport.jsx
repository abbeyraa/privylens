"use client";

import { useMemo } from "react";
import {
  formatFailureForReport,
  analyzeFailurePatterns,
  FAILURE_CATEGORIES,
} from "@/lib/failureIntelligence";
import { AlertCircle, Lightbulb, TrendingUp, XCircle, CheckCircle } from "lucide-react";

const STATUS_COLORS = {
  success: "bg-green-100 text-green-800 border-green-300",
  partial: "bg-yellow-100 text-yellow-800 border-yellow-300",
  error: "bg-red-100 text-red-800 border-red-300",
  failed: "bg-red-100 text-red-800 border-red-300",
  default: "bg-gray-100 text-gray-800 border-gray-300",
};

const SEVERITY_COLORS = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

export default function IntelligentExecutionReport({ report }) {
  if (!report) return null;

  // Analyze failures untuk intelligence
  const failureAnalysis = useMemo(() => {
    if (!report.results || report.results.length === 0) return null;

    const failures = report.results
      .filter((r) => r.status === "failed" && r.failureMetadata)
      .map((r) => r.failureMetadata);

    if (failures.length === 0) return null;

    return analyzeFailurePatterns(failures);
  }, [report.results]);

  // Format failures untuk display
  const formattedFailures = useMemo(() => {
    if (!report.results) return [];

    return report.results
      .filter((r) => r.status === "failed" && r.failureMetadata)
      .map((r) => formatFailureForReport(r.failureMetadata));
  }, [report.results]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Laporan Eksekusi dengan Intelligence
        </h2>
        {report.safeRun && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">
            SAFE RUN MODE
          </span>
        )}
      </div>

      {/* Summary dengan Intelligence */}
      {report.summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Ringkasan Eksekusi
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {report.summary.total || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {report.summary.success || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Berhasil</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {report.summary.failed || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Gagal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {report.summary.partial || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Partial</div>
            </div>
          </div>
          {report.duration && (
            <div className="mt-3 text-center text-sm text-gray-600">
              Durasi: {(report.duration / 1000).toFixed(2)} detik
            </div>
          )}
        </div>
      )}

      {/* Failure Pattern Analysis */}
      {failureAnalysis && failureAnalysis.totalFailures > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Analisis Pola Kegagalan
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-red-700">
              <strong>Total Kegagalan:</strong> {failureAnalysis.totalFailures}
            </div>
            {failureAnalysis.mostCommonCategory && (
              <div className="text-sm text-red-700">
                <strong>Kategori Paling Umum:</strong>{" "}
                {getCategoryName(failureAnalysis.mostCommonCategory)}
              </div>
            )}
            {Object.keys(failureAnalysis.frequency).length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-red-700 mb-1">
                  Distribusi Kegagalan:
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(failureAnalysis.frequency).map(([category, count]) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
                    >
                      {getCategoryName(category)}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {failureAnalysis.recommendations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="text-xs font-medium text-red-700 mb-2">
                  Rekomendasi Umum:
                </div>
                <ul className="space-y-1">
                  {failureAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{rec.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {report.status === "error" && report.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium text-sm mb-2">Error:</p>
          <pre className="text-red-600 text-xs mt-1 whitespace-pre-wrap break-all">
            {report.message}
          </pre>
        </div>
      )}

      {/* Detailed Failures dengan Intelligence */}
      {formattedFailures.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Detail Kegagalan dengan Rekomendasi ({formattedFailures.length})
          </h3>
          <div className="space-y-3">
            {formattedFailures.map((failure, idx) => (
              <FailureCard key={idx} failure={failure} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Success Results */}
      {report.results &&
        report.results.filter((r) => r.status === "success").length > 0 && (
          <details className="space-y-2">
            <summary className="cursor-pointer font-semibold text-gray-700 mb-2 text-sm hover:text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Hasil Berhasil (
              {report.results.filter((r) => r.status === "success").length} baris)
            </summary>
            <div className="space-y-2 mt-2">
              {report.results
                .filter((r) => r.status === "success")
                .map((result, idx) => (
                  <div
                    key={idx}
                    className="border-2 border-green-300 rounded-lg p-3 bg-green-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-green-800">
                          Baris{" "}
                          {result.rowIndex !== undefined
                            ? result.rowIndex + 1
                            : idx + 1}
                        </span>
                        {result.duration && (
                          <span className="text-xs text-green-600 ml-2">
                            ({result.duration}ms)
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-medium">
                        SUCCESS
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </details>
        )}

      {/* No Results */}
      {(!report.results || report.results.length === 0) && (
        <p className="text-gray-500 text-center py-4 text-sm">
          Belum ada hasil eksekusi
        </p>
      )}
    </div>
  );
}

function FailureCard({ failure, index }) {
  return (
    <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${SEVERITY_COLORS[failure.severity] || SEVERITY_COLORS.medium}`}
            >
              {failure.severity.toUpperCase()}
            </span>
            <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">
              {getCategoryName(failure.category)}
            </span>
          </div>
          <h4 className="font-semibold text-red-900 mb-1">
            {failure.context.row} - {failure.context.action}
          </h4>
          <p className="text-sm text-red-800 mb-2">{failure.userFriendlyMessage}</p>
          <div className="text-xs text-red-700 space-y-1">
            <div>
              <strong>Field:</strong> {failure.context.field}
            </div>
            {failure.technicalDetails.pageUrl && (
              <div>
                <strong>URL:</strong>{" "}
                <span className="font-mono text-xs">
                  {failure.technicalDetails.pageUrl}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {failure.recommendations && failure.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-red-800">
              Rekomendasi Perbaikan:
            </span>
          </div>
          <div className="space-y-2">
            {failure.recommendations.map((rec, recIdx) => (
              <div key={recIdx} className="bg-white rounded p-3 border border-red-100">
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === "critical" || rec.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {rec.message}
                  </span>
                </div>
                {rec.steps && rec.steps.length > 0 && (
                  <ol className="list-decimal list-inside space-y-1 text-xs text-gray-700 ml-2">
                    {rec.steps.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryName(category) {
  const names = {
    [FAILURE_CATEGORIES.SELECTOR_CHANGE]: "Perubahan Selector",
    [FAILURE_CATEGORIES.LABEL_CHANGE]: "Perubahan Label",
    [FAILURE_CATEGORIES.FORM_VALIDATION]: "Validasi Form",
    [FAILURE_CATEGORIES.SESSION_EXPIRED]: "Sesi Expired",
    [FAILURE_CATEGORIES.TIMING_ISSUE]: "Masalah Timing",
    [FAILURE_CATEGORIES.PAGE_LOADING]: "Loading Halaman",
    [FAILURE_CATEGORIES.UI_CHANGE]: "Perubahan UI",
    [FAILURE_CATEGORIES.NETWORK_ERROR]: "Error Jaringan",
    [FAILURE_CATEGORIES.ELEMENT_NOT_FOUND]: "Elemen Tidak Ditemukan",
    [FAILURE_CATEGORIES.ACTION_FAILED]: "Action Gagal",
    [FAILURE_CATEGORIES.UNKNOWN]: "Tidak Diketahui",
  };
  return names[category] || category;
}

