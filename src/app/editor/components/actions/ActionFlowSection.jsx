"use client";

export default function ActionFlowSection({
  actions,
  setActions,
  fieldMappings,
  successIndicator,
  setSuccessIndicator,
  failureIndicator,
  setFailureIndicator,
  execution,
  setExecution,
  allowFill = true,
}) {
  // Mode eksekusi (once/loop) hanya relevan untuk Action-only (tanpa fill/data-driven)
  const showExecutionOptions = allowFill === false;

  const addAction = () => {
    setActions([
      ...actions,
      {
        type: allowFill ? "fill" : "click",
        target: "",
        value: null,
        waitFor: null,
      },
    ]);
  };

  // Helper function untuk mendapatkan field yang harus di-reset berdasarkan action type
  const getFieldsToReset = (newType, oldType) => {
    const fieldsToReset = {};

    // Jika type berubah, reset field yang tidak relevan
    if (newType !== oldType) {
      switch (newType) {
        case "wait":
          // Wait tidak butuh target dan waitFor
          fieldsToReset.target = "";
          fieldsToReset.waitFor = null;
          // Value untuk wait adalah durasi (default 1)
          if (oldType !== "wait") {
            fieldsToReset.value = 1;
          }
          break;
        case "fill":
          // Fill butuh target (field mapping), tapi tidak perlu reset value
          // Hanya reset target jika sebelumnya bukan fill
          if (oldType !== "fill") {
            fieldsToReset.target = "";
          }
          // Reset waitFor jika ada
          fieldsToReset.waitFor = null;
          break;
        case "click":
        case "handleDialog":
        case "navigate":
          // Action ini butuh target, tapi tidak butuh value khusus
          // Reset value jika sebelumnya adalah fill atau wait
          if (oldType === "fill" || oldType === "wait") {
            fieldsToReset.value = null;
          }
          // Reset target jika sebelumnya adalah wait
          if (oldType === "wait") {
            fieldsToReset.target = "";
          }
          break;
        default:
          // Untuk type lain, reset semua field yang tidak relevan
          fieldsToReset.target = "";
          fieldsToReset.value = null;
          fieldsToReset.waitFor = null;
      }
    }

    return fieldsToReset;
  };

  const updateAction = (idx, field, value) => {
    const next = [...actions];
    
    // Jika field yang diubah adalah "type", reset field yang tidak relevan
    if (field === "type") {
      const oldType = next[idx].type || "click";
      const fieldsToReset = getFieldsToReset(value, oldType);
      next[idx] = { 
        ...next[idx], 
        [field]: value,
        ...fieldsToReset,
      };
    } else {
      next[idx] = { ...next[idx], [field]: value };
    }
    
    setActions(next);
  };

  const removeAction = (idx) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  // Helper functions
  const getActionTargetOptions = (actionType) => {
    if (actionType === "fill") {
      return fieldMappings.map((fm) => ({
        value: fm.name,
        label: `${fm.name} (${fm.dataKey})`,
      }));
    }
    return [];
  };

  const getTargetPlaceholder = (actionType) => {
    switch (actionType) {
      case "click":
        return "Label atau selector tombol/elemen (contoh: Tambah Data)";
      case "handleDialog":
        return "Selector dialog";
      default:
        return "";
    }
  };

  const effectiveExecution = showExecutionOptions
    ? execution || {
        mode: "once",
        loop: {
          maxIterations: 50,
          delaySeconds: 0,
          stopWhen: "notVisible",
          indicator: { type: "selector", value: "" },
        },
      }
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-800">Alur Aksi</h2>
        <button
          onClick={addAction}
          className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium cursor-pointer"
        >
          + Aksi
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-2">
        {allowFill ? (
          <>
            Definisikan urutan aksi yang akan dieksekusi SETELAH sampai di
            halaman target. Aksi akan dijalankan secara berurutan. Untuk mode
            batch, alur ini akan di-loop untuk setiap baris data. Contoh: Klik
            tombol &quot;Tambah Data&quot; → Isi form → Handle popup → Kembali
            ke halaman awal.
          </>
        ) : (
          <>
            Definisikan urutan aksi (click/wait/navigate/handleDialog) yang akan
            dieksekusi di halaman target. Mode Action-only mendukung eksekusi
            berulang (loop) sampai kondisi tertentu terpenuhi, misalnya berhenti
            saat data sudah habis.
          </>
        )}
      </p>

      {/* Execution Mode (khusus Action-only) */}
      {showExecutionOptions && effectiveExecution && (
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Mode Eksekusi
          </h3>
          <div className="flex gap-4">
            <label className="flex items-center text-sm">
              <input
                type="radio"
                className="mr-2"
                checked={effectiveExecution.mode === "once"}
                onChange={() => {
                  setExecution?.({
                    ...effectiveExecution,
                    mode: "once",
                  });
                }}
              />
              Sekali jalan
            </label>
            <label className="flex items-center text-sm">
              <input
                type="radio"
                className="mr-2"
                checked={effectiveExecution.mode === "loop"}
                onChange={() => {
                  setExecution?.({
                    ...effectiveExecution,
                    mode: "loop",
                  });
                }}
              />
              Loop sampai kondisi
            </label>
          </div>

          {effectiveExecution.mode === "loop" && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max iterasi
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={effectiveExecution.loop?.maxIterations ?? 50}
                    onChange={(e) =>
                      setExecution?.({
                        ...effectiveExecution,
                        loop: {
                          ...effectiveExecution.loop,
                          maxIterations: Number(e.target.value || 1),
                        },
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Delay per iterasi (detik)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={effectiveExecution.loop?.delaySeconds ?? 0}
                    onChange={(e) =>
                      setExecution?.({
                        ...effectiveExecution,
                        loop: {
                          ...effectiveExecution.loop,
                          delaySeconds: Number(e.target.value || 0),
                        },
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stop condition
                </label>
                <div className="flex gap-2">
                  <select
                    value={
                      effectiveExecution.loop?.indicator?.type || "selector"
                    }
                    onChange={(e) =>
                      setExecution?.({
                        ...effectiveExecution,
                        loop: {
                          ...effectiveExecution.loop,
                          indicator: {
                            ...(effectiveExecution.loop?.indicator || {
                              type: "selector",
                              value: "",
                            }),
                            type: e.target.value,
                          },
                        },
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
                        value={effectiveExecution.loop?.indicator?.value || ""}
                        onChange={(e) =>
                          setExecution?.({
                            ...effectiveExecution,
                            loop: {
                              ...effectiveExecution.loop,
                              indicator: {
                                ...(effectiveExecution.loop?.indicator || {
                                  type: "selector",
                                  value: "",
                                }),
                                value: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Contoh: .btn-delete atau teks 'Tidak ada data'"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="mr-2"
                      checked={effectiveExecution.loop?.stopWhen === "visible"}
                      onChange={() =>
                        setExecution?.({
                          ...effectiveExecution,
                          loop: {
                            ...effectiveExecution.loop,
                            stopWhen: "visible",
                          },
                        })
                      }
                    />
                    Stop saat terlihat/ada
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="mr-2"
                      checked={
                        effectiveExecution.loop?.stopWhen === "notVisible"
                      }
                      onChange={() =>
                        setExecution?.({
                          ...effectiveExecution,
                          loop: {
                            ...effectiveExecution.loop,
                            stopWhen: "notVisible",
                          },
                        })
                      }
                    />
                    Stop saat hilang/tidak ada
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Contoh bulk delete: set indikator ke selector tombol delete,
                  lalu pilih “Stop saat hilang/tidak ada” agar loop berhenti
                  ketika item habis.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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
                    {allowFill && <option value="fill">Isi Field</option>}
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
                        placeholder={getTargetPlaceholder(action.type)}
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
                className="ml-4 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}

        {actions.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Belum ada aksi yang didefinisikan. Klik tombol &quot;+ Aksi&quot;
            untuk menambahkan.
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
            Indikator Keberhasilan (Opsional)
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
