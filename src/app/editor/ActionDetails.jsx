"use client";

const actionTypes = ["Click", "Input", "Read Text", "Wait", "Navigate"];

export function ActionDetails({ selectedStepData, onChange }) {
  if (!selectedStepData) {
    return (
      <div className="rounded-lg border border-dashed border-[#e5e5e5] p-4 text-sm text-gray-500">
        Pilih step untuk melihat detail.
      </div>
    );
  }

  switch (selectedStepData.type) {
    case "Click":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Selector / Elemen
          </label>
          <input
            type="text"
            placeholder="#submit"
            value={selectedStepData.selector}
            onChange={(event) => onChange("selector", event.target.value)}
            className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    case "Input":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Selector / Elemen
            </label>
            <input
              type="text"
              placeholder="#username"
              value={selectedStepData.selector}
              onChange={(event) => onChange("selector", event.target.value)}
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
        </div>
      );
    case "Read Text":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Selector / Elemen
            </label>
            <input
              type="text"
              placeholder=".title"
              value={selectedStepData.selector}
              onChange={(event) => onChange("selector", event.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Label Hasil
            </label>
            <input
              type="text"
              placeholder="Nama data yang disimpan"
              value={selectedStepData.label}
              onChange={(event) => onChange("label", event.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      );
    case "Wait":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Selector Opsional
            </label>
            <input
              type="text"
              placeholder=".loading"
              value={selectedStepData.selector}
              onChange={(event) => onChange("selector", event.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
        </div>
      );
    case "Navigate":
      return (
        <div>
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
        </div>
      );
    default:
      return null;
  }
}

export { actionTypes };
