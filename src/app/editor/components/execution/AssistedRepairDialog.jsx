"use client";

import { useState } from "react";
import { AlertCircle, Play, SkipForward, RotateCcw, X, Wrench } from "lucide-react";
import { REPAIR_ACTIONS, createRepairDecision } from "@/lib/assistedRepair";
import { formatFailureForReport } from "@/lib/failureIntelligence";

export default function AssistedRepairDialog({
  failureResult,
  executionState,
  onRepairDecision,
  onClose,
}) {
  const [selectedAction, setSelectedAction] = useState(REPAIR_ACTIONS.CONTINUE);
  const [notes, setNotes] = useState("");

  if (!failureResult || !executionState) return null;

  const formattedFailure = failureResult.failureMetadata
    ? formatFailureForReport(failureResult.failureMetadata)
    : null;

  const handleSubmit = () => {
    const decision = createRepairDecision(selectedAction, { notes });
    onRepairDecision(decision);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-red-900">
                Assisted Repair Mode
              </h2>
              <p className="text-sm text-red-700">
                Kegagalan terdeteksi - Browser tetap terbuka untuk perbaikan manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Failure Information */}
          {formattedFailure && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Informasi Kegagalan
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Baris Data:</strong> {formattedFailure.context.row}
                </div>
                <div>
                  <strong>Action:</strong> {formattedFailure.context.action}
                </div>
                <div>
                  <strong>Field:</strong> {formattedFailure.context.field}
                </div>
                <div className="mt-3">
                  <strong>Penyebab:</strong>
                  <p className="text-red-800 mt-1">{formattedFailure.userFriendlyMessage}</p>
                </div>
                {formattedFailure.recommendations &&
                  formattedFailure.recommendations.length > 0 && (
                    <div className="mt-3">
                      <strong>Rekomendasi:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-red-700">
                        {formattedFailure.recommendations
                          .slice(0, 3)
                          .map((rec, idx) => (
                            <li key={idx}>{rec.message}</li>
                          ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Execution State */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">State Eksekusi</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div>
                <strong>Progress:</strong> Baris {executionState.rowIndex + 1} dari{" "}
                {executionState.totalRows || "?"}
              </div>
              <div>
                <strong>Action:</strong> {executionState.actionIndex + 1} dari{" "}
                {executionState.totalActions || "?"}
              </div>
              {executionState.pageUrl && (
                <div>
                  <strong>URL:</strong>{" "}
                  <span className="font-mono text-xs break-all">
                    {executionState.pageUrl}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Repair Actions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Pilih Tindakan Perbaikan</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="repairAction"
                  value={REPAIR_ACTIONS.CONTINUE}
                  checked={selectedAction === REPAIR_ACTIONS.CONTINUE}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Play className="w-5 h-5 text-blue-600" />
                    <strong className="text-gray-900">Lanjutkan</strong>
                  </div>
                  <p className="text-sm text-gray-600">
                    Lanjutkan ke baris data berikutnya. Baris saat ini akan di-skip.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="repairAction"
                  value={REPAIR_ACTIONS.RETRY}
                  checked={selectedAction === REPAIR_ACTIONS.RETRY}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw className="w-5 h-5 text-yellow-600" />
                    <strong className="text-gray-900">Ulangi Action</strong>
                  </div>
                  <p className="text-sm text-gray-600">
                    Ulangi action yang gagal. Pastikan perbaikan manual sudah dilakukan di browser.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="repairAction"
                  value={REPAIR_ACTIONS.SKIP_ROW}
                  checked={selectedAction === REPAIR_ACTIONS.SKIP_ROW}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SkipForward className="w-5 h-5 text-orange-600" />
                    <strong className="text-gray-900">Skip Baris</strong>
                  </div>
                  <p className="text-sm text-gray-600">
                    Lewati baris data saat ini dan lanjutkan ke baris berikutnya.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                <input
                  type="radio"
                  name="repairAction"
                  value={REPAIR_ACTIONS.ABORT}
                  checked={selectedAction === REPAIR_ACTIONS.ABORT}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <X className="w-5 h-5 text-red-600" />
                    <strong className="text-gray-900">Hentikan Batch</strong>
                  </div>
                  <p className="text-sm text-gray-600">
                    Hentikan seluruh batch execution. Browser akan ditutup.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan tentang perbaikan yang dilakukan..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Instruksi:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>Browser Playwright tetap terbuka di state terakhir sebelum kegagalan</li>
              <li>Lakukan perbaikan manual yang diperlukan di browser</li>
              <li>Pilih tindakan perbaikan di atas</li>
              <li>Klik "Terapkan" untuk melanjutkan eksekusi</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}

