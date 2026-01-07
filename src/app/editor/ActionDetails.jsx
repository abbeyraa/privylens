"use client";

const actionTypes = ["Click", "Input", "Wait", "Navigate"];

export function ActionDetails({ selectedStepData, onChange }) {
  if (!selectedStepData) {
    return (
      <div className="rounded-lg border border-dashed border-[#e5e5e5] p-4 text-sm text-gray-500">
        Pilih step untuk melihat detail.
      </div>
    );
  }

  const targetType =
    selectedStepData.targetType ||
    (selectedStepData.selector?.trim() ? "selector" : "label");
  const targetValue =
    targetType === "selector"
      ? selectedStepData.selector
      : selectedStepData.label;
  const targetLabel =
    targetType === "selector" ? "Selector / Elemen" : "Label / Text";
  const targetPlaceholder = targetType === "selector" ? "#submit" : "Simpan";
  const handleTargetTypeChange = (event) => {
    const nextType = event.target.value;
    onChange("targetType", nextType);
    if (nextType === "label" && selectedStepData.selector) {
      onChange("selector", "");
    }
    if (nextType === "selector" && selectedStepData.label) {
      onChange("label", "");
    }
  };

  switch (selectedStepData.type) {
    case "Click":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Target
            </label>
            <select
              value={targetType}
              onChange={handleTargetTypeChange}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="label">Label / Text</option>
              <option value="selector">Selector / Elemen</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {targetLabel}
            </label>
            <input
              type="text"
              placeholder={targetPlaceholder}
              value={targetValue}
              onChange={(event) =>
                onChange(
                  targetType === "selector" ? "selector" : "label",
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              placeholder="5000"
              value={selectedStepData.timeoutMs}
              onChange={(event) => onChange("timeoutMs", event.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      );
    case "Input":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Target
            </label>
            <select
              value={targetType}
              onChange={handleTargetTypeChange}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="label">Label / Text</option>
              <option value="selector">Selector / Elemen</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {targetLabel}
            </label>
            <input
              type="text"
              placeholder={targetType === "selector" ? "#username" : "Email"}
              value={targetValue}
              onChange={(event) =>
                onChange(
                  targetType === "selector" ? "selector" : "label",
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Nilai Input
            </label>
            <input
              type="text"
              placeholder="Masukkan nilai"
              value={selectedStepData.value}
              onChange={(event) => onChange("value", event.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              placeholder="5000"
              value={selectedStepData.timeoutMs}
              onChange={(event) => onChange("timeoutMs", event.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      );
    case "Wait":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Durasi (ms)
          </label>
          <input
            type="number"
            placeholder="1000"
            value={selectedStepData.waitMs}
            onChange={(event) => onChange("waitMs", event.target.value)}
            className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    case "Navigate":
      return (
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            URL Tujuan
          </label>
          <input
            type="text"
            placeholder="https://contoh.app"
            value={selectedStepData.url}
            onChange={(event) => onChange("url", event.target.value)}
            className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              placeholder="5000"
              value={selectedStepData.timeoutMs}
              onChange={(event) => onChange("timeoutMs", event.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}

export { actionTypes };
