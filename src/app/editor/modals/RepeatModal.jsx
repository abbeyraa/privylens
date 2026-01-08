"use client";

export default function RepeatModal({
  open,
  mode,
  count,
  dataSummary,
  onModeChange,
  onCountChange,
  onDisable,
  onClose,
  onSave,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Repetition Settings
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Atur pengulangan flow untuk group ini.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50"
            aria-label="Close"
          >
            ?
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Repeat mode
            </label>
            <select
              value={mode}
              onChange={(event) => onModeChange(event.target.value)}
              className="w-64 rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="count">Repeat by number</option>
              <option value="data">
                Repeat by total data rows ({dataSummary.rowsTotal})
              </option>
              <option
                value="until"
                disabled
                style={{ textDecoration: "line-through" }}
              >
                Repeat until condition (coming soon)
              </option>
            </select>
          </div>
          {mode === "count" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Repetition count
              </label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(event) => onCountChange(event.target.value)}
                className="w-40 rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {mode === "data" && (
            <div className="rounded-lg border border-[#e5e5e5] bg-gray-50 px-4 py-3 text-xs text-gray-600">
              Total rows from Menu Data:{" "}
              <span className="font-semibold">{dataSummary.rowsTotal}</span>{" "}
              {dataSummary.hasHeader ? "(heading excluded)" : ""}
            </div>
          )}
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-600">
            Mode &quot;Until ...&quot; will be added later.
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDisable}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Disable repetition
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
