"use client";

export default function SavePromptModal({
  open,
  templateName,
  groups,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-[#e5e5e5] px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Simpan Template
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Pastikan struktur template sudah sesuai sebelum disimpan.
          </p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="rounded-lg border border-[#e5e5e5] bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <div className="font-semibold text-gray-800">
              {templateName?.trim() || "Template"}
            </div>
            <div className="mt-2 space-y-2">
              {groups.length === 0 ? (
                <div className="text-gray-500">Belum ada grup.</div>
              ) : (
                groups.map((group) => (
                  <div key={group.id}>
                    <div className="font-semibold text-gray-700">
                      {group.name || "Grup"}
                    </div>
                    <div className="mt-1 ml-4 space-y-1">
                      {group.steps && group.steps.length > 0 ? (
                        group.steps.map((step) => (
                          <div key={step.id} className="text-gray-600">
                            - {step.title || "Step"}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">- Belum ada step.</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
