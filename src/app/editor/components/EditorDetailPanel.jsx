"use client";

import { useEffect, useRef } from "react";
import { MousePointer2, Info } from "lucide-react";
import { ActionDetails, actionTypes } from "../ActionDetails";

export default function EditorDetailPanel({
  detailKey,
  selectedStepData,
  selectedStep,
  groupName,
  stepName,
  onOpenHelp,
  onStepChange,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    node.classList.remove("detail-flash");
    void node.offsetHeight;
    node.classList.add("detail-flash");
  }, [detailKey]);

  return (
    <div
      key={detailKey}
      ref={panelRef}
      className="bg-white border border-[#e5e5e5] rounded-lg p-6 transition-[box-shadow,border-color] duration-300 detail-flash"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            key={detailKey}
            className="text-base font-semibold text-gray-900 detail-title"
          >
            Detail
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {groupName ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {groupName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                No group
              </span>
            )}
            <span className="text-xs font-semibold text-gray-400">›</span>
            {stepName ? (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {stepName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                No step
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenHelp}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50"
          title="Input guide"
          aria-label="Input guide"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Input atau informasi yang dibutuhkan untuk langkah terpilih
      </p>
      {selectedStepData ? (
        <div key={detailKey} className="mt-5 space-y-4 detail-content">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Nama Step
            </label>
            <input
              type="text"
              placeholder="Isi Kredensial"
              value={selectedStepData?.title || ""}
              onChange={(event) =>
                onStepChange(
                  selectedStep.groupId,
                  selectedStep.stepId,
                  "title",
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Deskripsi
            </label>
            <input
              type="text"
              placeholder="Jelaskan kebutuhan step ini"
              value={selectedStepData?.description || ""}
              onChange={(event) =>
                onStepChange(
                  selectedStep.groupId,
                  selectedStep.stepId,
                  "description",
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Tipe Aksi
            </label>
            <select
              value={selectedStepData?.type || actionTypes[0]}
              onChange={(event) =>
                onStepChange(
                  selectedStep.groupId,
                  selectedStep.stepId,
                  "type",
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <ActionDetails
              selectedStepData={selectedStepData}
              onChange={(key, value) =>
                onStepChange(
                  selectedStep.groupId,
                  selectedStep.stepId,
                  key,
                  value
                )
              }
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-[#e5e5e5] bg-gray-50 px-5 py-6 text-center detail-content">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
            <MousePointer2 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Belum ada step yang dipilih
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Pilih step di panel kiri untuk mengedit detailnya.
          </p>
        </div>
      )}
    </div>
  );
}
