"use client";

import IntelligentExecutionReport from "./IntelligentExecutionReport";

// Constants untuk status styling
const STATUS_COLORS = {
  success: "bg-green-100 text-green-800 border-green-300",
  partial: "bg-yellow-100 text-yellow-800 border-yellow-300",
  error: "bg-red-100 text-red-800 border-red-300",
  failed: "bg-red-100 text-red-800 border-red-300",
  default: "bg-gray-100 text-gray-800 border-gray-300",
};

const STATUS_ICONS = {
  success: "✓",
  partial: "⚠",
  error: "✗",
  failed: "✗",
  default: "?",
};

// Helper functions
const getStatusColor = (status) =>
  STATUS_COLORS[status] || STATUS_COLORS.default;
const getStatusIcon = (status) => STATUS_ICONS[status] || STATUS_ICONS.default;

export default function ExecutionReport({ report }) {
  if (!report) return null;

  // Use intelligent report if available
  return <IntelligentExecutionReport report={report} />;

  return (
    <div className="bg-white rounded-lg shadow-md p-3">
      <h2 className="text-base font-semibold text-gray-800 mb-2">
        Laporan Eksekusi
      </h2>

      {/* Summary */}
      {report.summary && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm">
            Ringkasan
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-600">Total:</span>{" "}
              <span className="font-semibold">{report.summary.total || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Berhasil:</span>{" "}
              <span className="font-semibold text-green-600">
                {report.summary.success || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Gagal:</span>{" "}
              <span className="font-semibold text-red-600">
                {report.summary.failed || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {report.status === "error" && report.message && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium text-sm">Error:</p>
          {/* Full message, not truncated */}
          <pre
            className="text-red-600 text-xs mt-1 whitespace-pre-wrap break-all"
            style={{ wordBreak: "break-word" }}
          >
            {report.message}
          </pre>
        </div>
      )}

      {/* Results */}
      {report.results && report.results.length > 0 && (
        <details className="space-y-2">
          <summary className="cursor-pointer font-semibold text-gray-700 mb-2 text-sm hover:text-gray-900">
            Detail Hasil ({report.results.length} baris)
          </summary>
          <div className="space-y-2 mt-2">
            {report.results.map((result, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-lg p-3 ${getStatusColor(
                  result.status
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold">
                        {getStatusIcon(result.status)}
                      </span>
                      <span className="font-semibold">
                        Baris{" "}
                        {result.rowIndex !== undefined
                          ? result.rowIndex + 1
                          : idx + 1}
                      </span>
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        {result.status}
                      </span>
                    </div>

                    {/* Data Used */}
                    {result.data && (
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Data:</span>{" "}
                        {JSON.stringify(result.data).substring(0, 100)}
                        {JSON.stringify(result.data).length > 100 && "..."}
                      </div>
                    )}

                    {/* Actions Executed */}
                    {result.actions && result.actions.length > 0 && (
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Aksi:</span>{" "}
                        {result.actions.map((action, actIdx) => (
                          <span key={actIdx} className="mr-2">
                            {action.type}→{action.target}
                            {action.success !== undefined && (
                              <span
                                className={
                                  action.success
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {action.success ? "✓" : "✗"}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Error Details */}
                    {result.error && (
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Error:</span>{" "}
                        <span className="text-red-600">
                          {result.error.substring(0, 80)}
                        </span>
                        {result.error.length > 80 && "..."}
                      </div>
                    )}

                    {/* Warnings */}
                    {result.warnings && result.warnings.length > 0 && (
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Peringatan:</span>{" "}
                        {result.warnings.join(", ").substring(0, 80)}
                        {result.warnings.join(", ").length > 80 && "..."}
                      </div>
                    )}

                    {/* Duration */}
                    {result.duration && (
                      <div className="mt-1 text-xs text-gray-600">
                        Durasi: {result.duration}ms
                      </div>
                    )}
                  </div>
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
