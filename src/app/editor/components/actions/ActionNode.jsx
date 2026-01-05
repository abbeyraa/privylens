"use client";

// Komponen ini tidak lagi digunakan setelah migrasi ke drag & drop list
// Dibiarkan untuk referensi atau bisa dihapus jika tidak diperlukan

// Constants untuk action types
const ACTION_ICONS = {
  fill: "✏️",
  click: "👆",
  wait: "⏱️",
  handleDialog: "💬",
  navigate: "🧭",
  default: "⚡",
};

const ACTION_LABELS = {
  fill: "Isi Field",
  click: "Klik",
  wait: "Tunggu",
  handleDialog: "Dialog",
  navigate: "Navigasi",
  default: "Aksi",
};

// Helper functions
const getActionIcon = (type) => ACTION_ICONS[type] || ACTION_ICONS.default;
const getActionLabel = (type) => ACTION_LABELS[type] || ACTION_LABELS.default;

export default function ActionNode({ data, selected }) {
  const actionType = data?.actionType || "click";
  const actionTarget = data?.actionTarget || "";

  return (
    <div
      className={[
        "rounded-lg border bg-white px-3 py-2 shadow-sm",
        "min-w-[190px] max-w-[240px]",
        "cursor-pointer select-none",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <div className="text-lg">{getActionIcon(actionType)}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {getActionLabel(actionType)}
          </div>
          {actionTarget ? (
            <div className="mt-0.5 text-xs text-gray-500 truncate">
              {actionTarget}
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-gray-400 italic">
              Belum dikonfigurasi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
