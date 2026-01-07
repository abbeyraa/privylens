"use client";

import { useEffect, useState } from "react";

export default function LogsModal({ logsContent, onClose }) {
  const [selectedLogEvent, setSelectedLogEvent] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  useEffect(() => {
    if (!showCopyToast) return;
    const timer = setTimeout(() => setShowCopyToast(false), 1200);
    return () => clearTimeout(timer);
  }, [showCopyToast]);

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Inspect Logs</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="p-5">
          {logsContent && typeof logsContent === "object" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#e5e5e5] bg-gray-50 px-4 py-3 text-xs text-gray-700">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-gray-900">
                    Run: {logsContent.runId || "N/A"}
                  </span>
                  <span className="text-gray-500">
                    {logsContent.events?.length || 0} events
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  <span className="mr-3">
                    Started: {logsContent.startedAt || "-"}
                  </span>
                  <span>Ended: {logsContent.endedAt || "-"}</span>
                </div>
                <div className="mt-1 text-[11px] text-gray-500">
                  Target: {logsContent.targetUrl || "-"}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4">
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                  {(logsContent.events || []).map((event) => (
                    <button
                      key={event.id || event.ts}
                      type="button"
                      onClick={() => setSelectedLogEvent(event)}
                      className={`w-full text-left rounded-lg border px-4 py-3 text-xs hover:bg-gray-50 ${
                        selectedLogEvent?.id === event.id
                          ? "border-blue-200 bg-blue-50 text-blue-900"
                          : "border-[#e5e5e5] text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          {event.type || "event"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            event.level === "error"
                              ? "bg-red-50 text-red-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {event.level || "info"}
                        </span>
                      </div>
                    </button>
                  ))}
                  {(!logsContent.events || logsContent.events.length === 0) && (
                    <div className="rounded-lg border border-dashed border-[#e5e5e5] bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
                      Belum ada event.
                    </div>
                  )}
                </div>
                <div className="relative rounded-lg border border-[#e5e5e5] bg-white px-4 py-4 text-xs text-gray-700">
                  {selectedLogEvent ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-gray-400">
                          Type
                        </div>
                        <div className="font-medium text-gray-900">
                          {selectedLogEvent.type || "event"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-gray-400">
                          Timestamp
                        </div>
                        <div>{selectedLogEvent.ts || "-"}</div>
                      </div>
                      {selectedLogEvent.type === "navigation" && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-gray-400">
                            URL
                          </div>
                          <div>{selectedLogEvent.data?.url || "-"}</div>
                        </div>
                      )}
                      {selectedLogEvent.type === "interaction.click" && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-gray-400">
                            Clicked
                          </div>
                          <div>
                            {selectedLogEvent.data?.text ||
                              selectedLogEvent.data?.label ||
                              "-"}
                          </div>
                          {selectedLogEvent.data?.tag && (
                            <div className="mt-1 text-[11px] text-gray-500">
                              Tag: {selectedLogEvent.data.tag}
                            </div>
                          )}
                        </div>
                      )}
                      {selectedLogEvent.type === "navigation-error" && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-gray-400">
                            Error
                          </div>
                          <div>{selectedLogEvent.message || "-"}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-gray-400">
                          Data
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const selector =
                              selectedLogEvent.data?.selector || "";
                            if (!selector) return;
                            navigator.clipboard?.writeText(selector);
                            setShowCopyToast(true);
                          }}
                          className="mt-2 w-full text-left rounded-lg bg-gray-50 p-3 text-[11px] text-gray-700 wrap-break-word whitespace-pre-wrap hover:bg-gray-100"
                          title="Click to copy selector"
                        >
                          {selectedLogEvent.data?.selector
                            ? `Selector: ${selectedLogEvent.data.selector}`
                            : "-"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      Pilih event untuk melihat detail.
                    </div>
                  )}
                  {showCopyToast && (
                    <div className="absolute top-3 right-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-700 shadow-sm">
                      Copied
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <pre className="max-h-[60vh] overflow-y-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
              {logsContent || "No logs yet."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
