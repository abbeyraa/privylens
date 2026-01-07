"use client";

export default function ResetConfirmModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-[#e5e5e5] px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Reset Editor</h3>
          <p className="text-xs text-gray-500 mt-1">
            Semua perubahan akan dikembalikan ke default.
          </p>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-white text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
