"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTemplateById, getTemplates } from "./templateStorage";

const TEMPLATE_OPEN_KEY = "otomate_template_open";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [openError, setOpenError] = useState("");
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      setTemplates(getTemplates());
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleDelete = () => {
    if (!templateToDelete?.id) return;
    deleteTemplateById(templateToDelete.id);
    setTemplates(getTemplates());
    setShowDeletePrompt(false);
    setTemplateToDelete(null);
  };

  const handleOpen = (template) => {
    if (!template || typeof template !== "object") {
      setOpenError("Template tidak valid.");
      return;
    }
    if (!Array.isArray(template.groups)) {
      setOpenError("Data template tidak lengkap.");
      return;
    }
    try {
      sessionStorage.setItem(TEMPLATE_OPEN_KEY, JSON.stringify(template));
    } catch {
      // Ignore storage failures.
    }
    setOpenError("");
    router.push(`/editor?templateId=${template.id}`);
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Template</h1>
          <span className="text-xs text-gray-500">
            {isHydrated ? `${templates.length} tersimpan` : "..."}
          </span>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-lg">
          {openError && (
            <div className="px-6 py-4 text-sm text-red-700 bg-red-50 border-b border-red-100">
              {openError}
            </div>
          )}
          {showLoadPrompt && (
            <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="border-b border-[#e5e5e5] px-5 py-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Load Template
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Template ini akan menggantikan data editor saat ini.
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="rounded-lg border border-[#e5e5e5] bg-gray-50 px-3 py-2 text-xs text-gray-700">
                    <div className="font-semibold text-gray-800">
                      {selectedTemplate?.name || "Template"}
                    </div>
                    <div className="mt-2 space-y-2">
                      {selectedTemplate?.groups?.length ? (
                        selectedTemplate.groups.map((group) => (
                          <div key={group.id}>
                            <div className="font-semibold text-gray-700">
                              {group.name || "Grup"}
                            </div>
                            <div className="mt-1 ml-4 space-y-1">
                              {group.steps && group.steps.length > 0 ? (
                                group.steps.map((step) => (
                                  <div key={step.id} className="text-gray-600">
                                    - {step.title || "Step"}
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-500">
                                  - Belum ada step.
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">Belum ada grup.</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoadPrompt(false);
                        setSelectedTemplate(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTemplate) {
                          handleOpen(selectedTemplate);
                        }
                        setShowLoadPrompt(false);
                        setSelectedTemplate(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Load
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showDeletePrompt && (
            <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="border-b border-[#e5e5e5] px-5 py-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Hapus Template
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Template ini akan dihapus permanen.
                  </p>
                </div>
                <div className="px-5 py-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeletePrompt(false);
                      setTemplateToDelete(null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}
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
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowLoadPrompt(true);
                      }}
                      className="text-xs font-medium text-white border border-blue-600 rounded-md px-3 py-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateToDelete(template);
                        setShowDeletePrompt(true);
                      }}
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
