"use client";

export default function ActionFlowSection({
  actions,
  setActions,
  fieldMappings,
  successIndicator,
  setSuccessIndicator,
  failureIndicator,
  setFailureIndicator,
}) {
  const addAction = () => {
    setActions([
      ...actions,
      {
        type: "fill",
        target: "",
        value: null,
        waitFor: null,
      },
    ]);
  };

  const updateAction = (idx, field, value) => {
    const next = [...actions];
    next[idx] = { ...next[idx], [field]: value };
    setActions(next);
  };

  const removeAction = (idx) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const getActionTargetOptions = (actionType) => {
    if (actionType === "fill") {
      return fieldMappings.map((fm) => ({
        value: fm.name,
        label: `${fm.name} (${fm.dataKey})`,
      }));
    }
    return [];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-800">Alur Aksi</h2>
        <button
          onClick={addAction}
          className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
        >
          + Aksi
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-2">
        Definisikan urutan aksi yang akan dieksekusi SETELAH sampai di halaman
        target. Aksi akan dijalankan secara berurutan. Untuk mode batch, alur
        ini akan di-loop untuk setiap baris data. Contoh: Klik tombol "Tambah
        Data" → Isi form → Handle popup → Kembali ke halaman awal.
      </p>

      <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Action Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Aksi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(idx, "type", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fill">Isi Field</option>
                    <option value="click">Klik Tombol/Elemen</option>
                    <option value="wait">Tunggu</option>
                    <option value="handleDialog">Tangani Dialog</option>
                    <option value="navigate">
                      Navigasi/Kembali ke Halaman
                    </option>
                  </select>
                </div>

                {/* Target */}
                {action.type !== "wait" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target <span className="text-red-500">*</span>
                    </label>
                    {action.type === "fill" ? (
                      <select
                        value={action.target}
                        onChange={(e) =>
                          updateAction(idx, "target", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Pilih Field</option>
                        {getActionTargetOptions(action.type).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : action.type === "navigate" ? (
                      <input
                        type="text"
                        value={action.target}
                        onChange={(e) =>
                          updateAction(idx, "target", e.target.value)
                        }
                        placeholder="URL atau kosongkan untuk kembali ke halaman target awal"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="text"
                        value={action.target}
                        onChange={(e) =>
                          updateAction(idx, "target", e.target.value)
                        }
                        placeholder={
                          action.type === "click"
                            ? "Label atau selector tombol/elemen (contoh: Tambah Data)"
                            : "Selector dialog"
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                )}

                {/* Value (for fill) */}
                {action.type === "fill" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nilai (Opsional)
                    </label>
                    <input
                      type="text"
                      value={action.value || ""}
                      onChange={(e) =>
                        updateAction(idx, "value", e.target.value || null)
                      }
                      placeholder="Kosongkan untuk menggunakan nilai dari data source"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Wait Duration (for wait) */}
                {action.type === "wait" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durasi (detik)
                    </label>
                    <input
                      type="number"
                      value={action.value || 1}
                      onChange={(e) =>
                        updateAction(idx, "value", Number(e.target.value))
                      }
                      min="1"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Wait For */}
                {action.type !== "wait" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tunggu Hingga (Opsional)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={action.waitFor?.type || "selector"}
                        onChange={(e) =>
                          updateAction(idx, "waitFor", {
                            ...action.waitFor,
                            type: e.target.value,
                            value: action.waitFor?.value || "",
                          })
                        }
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="selector">CSS Selector</option>
                        <option value="text">Teks</option>
                        <option value="url">URL Pattern</option>
                      </select>
                      <input
                        type="text"
                        value={action.waitFor?.value || ""}
                        onChange={(e) =>
                          updateAction(idx, "waitFor", {
                            ...action.waitFor,
                            type: action.waitFor?.type || "selector",
                            value: e.target.value,
                          })
                        }
                        placeholder="Indikator yang ditunggu setelah aksi"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => removeAction(idx)}
                className="ml-4 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}

        {actions.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Belum ada aksi yang didefinisikan. Klik tombol "+ Aksi" untuk
            menambahkan.
          </p>
        )}
      </div>

      {/* Success & Failure Indicators */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
        <h3 className="text-base font-semibold text-gray-800">
          Indikator Hasil Eksekusi
        </h3>

        {/* Success Indicator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Indikator Keberhasilan <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={successIndicator.type}
              onChange={(e) =>
                setSuccessIndicator({
                  ...successIndicator,
                  type: e.target.value,
                })
              }
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="selector">CSS Selector</option>
              <option value="text">Teks</option>
              <option value="url">URL Pattern</option>
            </select>
            <input
              type="text"
              value={successIndicator.value}
              onChange={(e) =>
                setSuccessIndicator({
                  ...successIndicator,
                  value: e.target.value,
                })
              }
              placeholder="Indikator yang menunjukkan eksekusi berhasil"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Failure Indicator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Indikator Kegagalan (Opsional)
          </label>
          <div className="flex gap-2">
            <select
              value={failureIndicator.type}
              onChange={(e) =>
                setFailureIndicator({
                  ...failureIndicator,
                  type: e.target.value,
                })
              }
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="selector">CSS Selector</option>
              <option value="text">Teks</option>
              <option value="url">URL Pattern</option>
            </select>
            <input
              type="text"
              value={failureIndicator.value}
              onChange={(e) =>
                setFailureIndicator({
                  ...failureIndicator,
                  value: e.target.value,
                })
              }
              placeholder="Indikator yang menunjukkan eksekusi gagal"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
