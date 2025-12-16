"use client";

export default function ExecutionReport({ report }) {
  if (!report) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "error":
      case "failed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "✓";
      case "partial":
        return "⚠";
      case "error":
      case "failed":
        return "✗";
      default:
        return "?";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Laporan Eksekusi
      </h2>

      {/* Summary */}
      {report.summary && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Ringkasan</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-600 text-sm mt-1">{report.message}</p>
        </div>
      )}

      {/* Results */}
      {report.results && report.results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 mb-2">
            Detail Hasil ({report.results.length} baris)
          </h3>
          {report.results.map((result, idx) => (
            <div
              key={idx}
              className={`border-2 rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold">
                      {getStatusIcon(result.status)}
                    </span>
                    <span className="font-semibold">
                      Baris {result.rowIndex !== undefined ? result.rowIndex + 1 : idx + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-white rounded">
                      {result.status}
                    </span>
                  </div>

                  {/* Data Used */}
                  {result.data && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Data:</span>{" "}
                      {JSON.stringify(result.data)}
                    </div>
                  )}

                  {/* Actions Executed */}
                  {result.actions && result.actions.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Aksi yang Dieksekusi:</span>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {result.actions.map((action, actIdx) => (
                          <li key={actIdx}>
                            {action.type} → {action.target}
                            {action.success !== undefined && (
                              <span className={action.success ? "text-green-600" : "text-red-600"}>
                                {" "}
                                ({action.success ? "✓" : "✗"})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Error Details */}
                  {result.error && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Error:</span>{" "}
                      <span className="text-red-600">{result.error}</span>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Peringatan:</span>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {result.warnings.map((warning, warnIdx) => (
                          <li key={warnIdx} className="text-yellow-700">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Duration */}
                  {result.duration && (
                    <div className="mt-2 text-xs text-gray-600">
                      Durasi: {result.duration}ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {(!report.results || report.results.length === 0) && (
        <p className="text-gray-500 text-center py-8">
          Belum ada hasil eksekusi
        </p>
      )}
    </div>
  );
}
