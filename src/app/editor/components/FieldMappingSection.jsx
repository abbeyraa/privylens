"use client";

// Helper functions untuk field mapping operations
const createNewFieldMapping = (columns) => ({
  name: "",
  type: "text",
  dataKey: columns[0] || "",
  required: false,
  labels: [""],
  fallbackLabels: [],
  conditional: null,
});

const updateFieldMappingAtIndex = (fieldMappings, idx, updates) => {
  const next = [...fieldMappings];
  next[idx] = { ...next[idx], ...updates };
  return next;
};

export default function FieldMappingSection({
  fieldMappings,
  setFieldMappings,
  columns,
}) {
  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, createNewFieldMapping(columns)]);
  };

  const updateFieldMapping = (idx, field, value) => {
    setFieldMappings(updateFieldMappingAtIndex(fieldMappings, idx, { [field]: value }));
  };

  const removeFieldMapping = (idx) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== idx));
  };

  const addLabel = (idx) => {
    const next = updateFieldMappingAtIndex(fieldMappings, idx, {
      labels: [...(fieldMappings[idx].labels || []), ""],
    });
    setFieldMappings(next);
  };

  const updateLabel = (idx, labelIdx, value) => {
    const next = [...fieldMappings];
    next[idx].labels[labelIdx] = value;
    setFieldMappings(next);
  };

  const removeLabel = (idx, labelIdx) => {
    const next = [...fieldMappings];
    next[idx].labels = next[idx].labels.filter((_, i) => i !== labelIdx);
    setFieldMappings(next);
  };

  const addFallbackLabel = (idx) => {
    const next = [...fieldMappings];
    if (!next[idx].fallbackLabels) next[idx].fallbackLabels = [];
    next[idx].fallbackLabels = [...next[idx].fallbackLabels, ""];
    setFieldMappings(next);
  };

  const updateFallbackLabel = (idx, labelIdx, value) => {
    const next = [...fieldMappings];
    if (!next[idx].fallbackLabels) next[idx].fallbackLabels = [];
    next[idx].fallbackLabels[labelIdx] = value;
    setFieldMappings(next);
  };

  const removeFallbackLabel = (idx, labelIdx) => {
    const next = [...fieldMappings];
    next[idx].fallbackLabels = next[idx].fallbackLabels.filter(
      (_, i) => i !== labelIdx
    );
    setFieldMappings(next);
  };

  const setConditional = (idx, conditional) => {
    setFieldMappings(updateFieldMappingAtIndex(fieldMappings, idx, { conditional }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-800">
          Pemetaan Field Form
        </h2>
        <button
          onClick={addFieldMapping}
          className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium cursor-pointer"
        >
          + Field
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-2">
        Definisikan field form berdasarkan maksud bisnis, bukan selector DOM.
        Playwright akan mencari elemen berdasarkan label yang didefinisikan.
      </p>

      <div className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-200px)] min-w-0">
        {fieldMappings.map((fm, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Field Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Field <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fm.name}
                    onChange={(e) =>
                      updateFieldMapping(idx, "name", e.target.value)
                    }
                    placeholder="contoh: Nama Lengkap, Email, Status"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Field Type & Data Key */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipe Input
                    </label>
                    <select
                      value={fm.type}
                      onChange={(e) =>
                        updateFieldMapping(idx, "type", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="text">Text</option>
                      <option value="select">Select/Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="radio">Radio Button</option>
                      <option value="textarea">Textarea</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kunci Data <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fm.dataKey}
                      onChange={(e) =>
                        updateFieldMapping(idx, "dataKey", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Required */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={fm.required || false}
                      onChange={(e) =>
                        updateFieldMapping(idx, "required", e.target.checked)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Field Wajib</span>
                  </label>
                </div>

                {/* Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label Utama <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {fm.labels?.map((label, labelIdx) => (
                      <div key={labelIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={label}
                          onChange={(e) =>
                            updateLabel(idx, labelIdx, e.target.value)
                          }
                          placeholder="Label yang akan dicari di halaman"
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {fm.labels.length > 1 && (
                          <button
                            onClick={() => removeLabel(idx, labelIdx)}
                            className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addLabel(idx)}
                      className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      + Tambah Label Alternatif
                    </button>
                  </div>
                </div>

                {/* Fallback Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label Cadangan (Opsional)
                  </label>
                  <div className="space-y-2">
                    {fm.fallbackLabels?.map((label, labelIdx) => (
                      <div key={labelIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={label}
                          onChange={(e) =>
                            updateFallbackLabel(idx, labelIdx, e.target.value)
                          }
                          placeholder="Label cadangan jika label utama tidak ditemukan"
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => removeFallbackLabel(idx, labelIdx)}
                          className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addFallbackLabel(idx)}
                      className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      + Tambah Label Cadangan
                    </button>
                  </div>
                </div>

                {/* Conditional Logic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logika Kondisional (Opsional)
                  </label>
                  <select
                    value={fm.conditional?.type || ""}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        setConditional(idx, null);
                      } else {
                        setConditional(idx, {
                          type: e.target.value,
                          value: "",
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tidak Ada Kondisi</option>
                    <option value="dataExists">
                      Hanya Isi Jika Data Tersedia
                    </option>
                    <option value="elementExists">
                      Hanya Isi Jika Elemen Ada
                    </option>
                  </select>
                  {fm.conditional && (
                    <input
                      type="text"
                      value={fm.conditional.value || ""}
                      onChange={(e) =>
                        setConditional(idx, {
                          ...fm.conditional,
                          value: e.target.value,
                        })
                      }
                      placeholder={
                        fm.conditional.type === "elementExists"
                          ? "Selector elemen yang harus ada"
                          : "Nilai yang harus ada"
                      }
                      className="w-full mt-2 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={() => removeFieldMapping(idx)}
                className="ml-4 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}

        {fieldMappings.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Belum ada field mapping. Klik tombol &quot;+ Field&quot; untuk
            menambahkan.
          </p>
        )}
      </div>
    </div>
  );
}
