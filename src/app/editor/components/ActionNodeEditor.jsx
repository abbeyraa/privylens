"use client";

// Helper functions
const getActionTargetOptions = (actionType, fieldMappings) => {
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

export default function ActionNodeEditor({
  node,
  setNode,
  fieldMappings,
  onDelete,
}) {
  if (!node) return null;

  const updateNodeData = (field, value) => {
    setNode({
      ...node,
      data: {
        ...node.data,
        [field]: value,
      },
    });
  };

  const actionType = node.data?.actionType || "click";
  const actionTarget = node.data?.actionTarget || "";
  const actionValue = node.data?.actionValue;
  const actionWaitFor = node.data?.actionWaitFor;

  return (
    <div className="bg-white rounded-lg shadow-md p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-800">Edit Aksi</h2>
        <button
          onClick={onDelete}
          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
        >
          Hapus Node
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-200px)] min-w-0">
        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipe Aksi <span className="text-red-500">*</span>
          </label>
          <select
            value={actionType}
            onChange={(e) => updateNodeData("actionType", e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {fieldMappings.length > 0 && (
              <option value="fill">Isi Field</option>
            )}
            <option value="click">Klik Tombol/Elemen</option>
            <option value="wait">Tunggu</option>
            <option value="handleDialog">Tangani Dialog</option>
            <option value="navigate">Navigasi/Kembali ke Halaman</option>
          </select>
        </div>

        {/* Target */}
        {actionType !== "wait" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target <span className="text-red-500">*</span>
            </label>
            {actionType === "fill" ? (
              <select
                value={actionTarget}
                onChange={(e) => updateNodeData("actionTarget", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Field</option>
                {getActionTargetOptions(actionType, fieldMappings).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : actionType === "navigate" ? (
              <input
                type="text"
                value={actionTarget}
                onChange={(e) => updateNodeData("actionTarget", e.target.value)}
                placeholder="URL atau kosongkan untuk kembali ke halaman target awal"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <input
                type="text"
                value={actionTarget}
                onChange={(e) => updateNodeData("actionTarget", e.target.value)}
                placeholder={getTargetPlaceholder(actionType)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        )}

        {/* Value (for fill) */}
        {actionType === "fill" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nilai (Opsional)
            </label>
            <input
              type="text"
              value={actionValue || ""}
              onChange={(e) =>
                updateNodeData("actionValue", e.target.value || null)
              }
              placeholder="Kosongkan untuk menggunakan nilai dari data source"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Wait Duration (for wait) */}
        {actionType === "wait" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durasi (detik)
            </label>
            <input
              type="number"
              value={actionValue || 1}
              onChange={(e) =>
                updateNodeData("actionValue", Number(e.target.value))
              }
              min="1"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Wait For */}
        {actionType !== "wait" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tunggu Hingga (Opsional)
            </label>
            <div className="flex gap-2">
              <select
                value={actionWaitFor?.type || "selector"}
                onChange={(e) =>
                  updateNodeData("actionWaitFor", {
                    ...actionWaitFor,
                    type: e.target.value,
                    value: actionWaitFor?.value || "",
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
                value={actionWaitFor?.value || ""}
                onChange={(e) =>
                  updateNodeData("actionWaitFor", {
                    ...actionWaitFor,
                    type: actionWaitFor?.type || "selector",
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
    </div>
  );
}
