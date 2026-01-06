"use client";

import { useEffect, useState } from "react";
import { deleteTemplateById, getTemplates } from "./templateStorage";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const handleDelete = (templateId) => {
    deleteTemplateById(templateId);
    setTemplates(getTemplates());
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Template</h1>
          <span className="text-xs text-gray-500">
            {templates.length} tersimpan
          </span>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-lg">
          {templates.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Belum ada template tersimpan.
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {template.name || "Template"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {template.createdAt
                        ? new Date(template.createdAt).toLocaleString("id-ID")
                        : "Tanpa tanggal"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {template.groups?.length || 0} grup
                    </span>
                    <button
                      type="button"
                      disabled
                      className="text-xs font-medium text-gray-300 border border-gray-200 rounded-md px-3 py-1 cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled
                      className="text-xs font-medium text-gray-300 border border-gray-200 rounded-md px-3 py-1 cursor-not-allowed"
                    >
                      Run
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
                      className="text-xs font-medium text-red-700 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
