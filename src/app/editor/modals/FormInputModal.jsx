"use client";

import { useEffect, useState } from "react";
import { parseFormHtmlToSteps } from "../formInputParser";

export default function FormInputModal({ open, onClose, onCreate }) {
  const [formHtml, setFormHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setFormHtml("");
      setError("");
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  if (!open) return null;

  const handleCreate = () => {
    const { steps, error: parseError } = parseFormHtmlToSteps(formHtml);
    if (parseError) {
      setError(parseError);
      return;
    }
    if (!steps.length) {
      setError("No inputs or submit buttons found.");
      return;
    }
    const created = onCreate(steps);
    if (!created) {
      setError("Failed to create steps.");
      return;
    }
    setFormHtml("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Add Form Inputs
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Paste full form HTML to auto-create input and submit steps.
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
              Form HTML
            </label>
            <textarea
              rows={8}
              value={formHtml}
              onChange={(event) => {
                setFormHtml(event.target.value);
                if (error) setError("");
              }}
              placeholder="<form>...</form>"
              className="w-full rounded-lg border border-[#e5e5e5] px-4 py-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-600">
            Inputs will be added as Input steps, and submit buttons as Click
            steps.
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Steps
          </button>
        </div>
      </div>
    </div>
  );
}
