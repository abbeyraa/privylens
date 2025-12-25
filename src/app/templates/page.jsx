"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen,
  FileText,
  Calendar,
  Search,
  Plus,
  History,
  Info,
  RotateCcw,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Play,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

const TEMPLATES_STORAGE_KEY = "otomate_templates";

// Mock templates dengan versioning
const getTemplates = () => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load templates:", error);
  }
  return [];
};

const saveTemplates = (templates) => {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch (error) {
    console.error("Failed to save templates:", error);
    return false;
  }
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [activeSection, setActiveSection] = useState("history"); // history, metadata
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTemplates, setExpandedTemplates] = useState({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const loaded = getTemplates();
    setTemplates(loaded);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (timestamp) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      month: "short",
      day: "numeric",
    });
  };

  const toggleTemplateExpansion = (templateId) => {
    setExpandedTemplates((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  const handleSaveTemplate = (templateData) => {
    const newTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: templateData.name || "Untitled Template",
      description: templateData.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true,
      versions: [
        {
          version: "1.0.0",
          plan: templateData.plan,
          createdAt: new Date().toISOString(),
          createdBy: "System",
          isActive: true,
          notes: "Initial version",
        },
      ],
      metadata: {
        targetUrl: templateData.plan?.target?.url || "",
        actionCount: templateData.plan?.actions?.length || 0,
        fieldMappingCount: templateData.plan?.fieldMappings?.length || 0,
      },
    };

    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    setActiveSection("list");
    alert("Template berhasil dibuat!");
  };

  const handleCreateVersion = (templateId, planData, notes) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const currentVersion = template.versions.find((v) => v.isActive);
    const versionNumber = currentVersion
      ? incrementVersion(currentVersion.version)
      : "1.0.0";

    // Deactivate all versions
    template.versions.forEach((v) => {
      v.isActive = false;
    });

    // Add new version
    template.versions.push({
      version: versionNumber,
      plan: planData,
      createdAt: new Date().toISOString(),
      createdBy: "System",
      isActive: true,
      notes: notes || `Version ${versionNumber}`,
    });

    template.updatedAt = new Date().toISOString();

    const updated = templates.map((t) => (t.id === templateId ? template : t));
    saveTemplates(updated);
    setTemplates(updated);
    alert(`Version ${versionNumber} berhasil dibuat!`);
  };

  const incrementVersion = (version) => {
    const parts = version.split(".");
    const major = parseInt(parts[0]) || 0;
    const minor = parseInt(parts[1]) || 0;
    const patch = parseInt(parts[2]) || 0;
    return `${major}.${minor + 1}.0`;
  };

  const handleActivateVersion = (templateId, version) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mengaktifkan versi ${version.version}? Versi aktif saat ini akan dinonaktifkan.`
      )
    ) {
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Deactivate all versions
    template.versions.forEach((v) => {
      v.isActive = false;
    });

    // Activate selected version
    const targetVersion = template.versions.find(
      (v) => v.version === version.version
    );
    if (targetVersion) {
      targetVersion.isActive = true;
      template.updatedAt = new Date().toISOString();

      const updated = templates.map((t) => (t.id === templateId ? template : t));
      saveTemplates(updated);
      setTemplates(updated);
      alert(`Version ${version.version} telah diaktifkan!`);
    }
  };

  const handleRollbackVersion = (templateId, version) => {
    handleActivateVersion(templateId, version);
  };

  const handleDeleteTemplate = (templateId) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus template ini? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    const updated = templates.filter((t) => t.id !== templateId);
    saveTemplates(updated);
    setTemplates(updated);
    alert("Template telah dihapus!");
  };

  const handleUseTemplate = (template) => {
    const activeVersion = template.versions.find((v) => v.isActive);
    if (!activeVersion) {
      alert("Template tidak memiliki versi aktif!");
      return;
    }

    // Navigate to editor with template loaded
    router.push(`/editor?templateId=${template.id}`);
  };


  const handleCreateTemplate = () => {
    router.push("/editor?mode=new");
  };

  const handleEditTemplate = (template) => {
    router.push(`/editor?templateId=${template.id}&mode=edit`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
            <p className="text-sm text-gray-600 mt-1">
              Pusat pengelolaan Automation Plan dengan versioning dan rollback
            </p>
          </div>
          <button
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery
                ? "Tidak ada template ditemukan"
                : "Belum ada template"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {searchQuery
                ? "Coba gunakan kata kunci lain untuk mencari"
                : "Mulai dengan membuat template pertama Anda"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateTemplate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => {
              const activeVersion = template.versions?.find((v) => v.isActive);
              const isExpanded = expandedTemplates[template.id];

              return (
                <div
                  key={template.id}
                  className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden"
                >
                  {/* Template Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {template.name}
                              </h3>
                              {template.isActive && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Aktif
                                </span>
                              )}
                              {activeVersion && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  v{activeVersion.version}
                                </span>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600 ml-12">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Dibuat: {formatDateShort(template.createdAt)}
                            </span>
                          </div>
                          {template.lastUsed && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                Terakhir digunakan:{" "}
                                {formatDateShort(template.lastUsed)}
                              </span>
                            </div>
                          )}
                          {template.versions && (
                            <div>
                              <span>
                                {template.versions.length} versi tersedia
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Gunakan
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="px-3 py-2 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleTemplateExpansion(template.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[#e5e5e5] bg-gray-50">
                      {/* Tabs */}
                      <div className="flex border-b border-[#e5e5e5]">
                        <button
                          onClick={() => setActiveSection("history")}
                          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeSection === "history"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Version History
                          </div>
                        </button>
                        <button
                          onClick={() => setActiveSection("metadata")}
                          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeSection === "metadata"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Metadata
                          </div>
                        </button>
                      </div>

                      {/* Version History */}
                      {activeSection === "history" && (
                        <div className="p-6">
                          {template.versions && template.versions.length > 0 ? (
                            <div className="space-y-3">
                              {template.versions
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt) - new Date(a.createdAt)
                                )
                                .map((version) => (
                                <div
                                  key={version.version}
                                  className={`bg-white border-2 rounded-lg p-4 ${
                                    version.isActive
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-[#e5e5e5]"
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-gray-900">
                                          v{version.version}
                                        </span>
                                        {version.isActive && (
                                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                            Aktif
                                          </span>
                                        )}
                                        <span className="text-sm text-gray-500">
                                          {formatDate(version.createdAt)}
                                        </span>
                                      </div>
                                      {version.notes && (
                                        <p className="text-sm text-gray-600 mb-2">
                                          {version.notes}
                                        </p>
                                      )}
                                      <div className="text-xs text-gray-500">
                                        Dibuat oleh: {version.createdBy}
                                      </div>
                                    </div>
                                    {!version.isActive && (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() =>
                                            handleActivateVersion(
                                              template.id,
                                              version
                                            )
                                          }
                                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          Aktifkan
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRollbackVersion(
                                              template.id,
                                              version
                                            )
                                          }
                                          className="px-3 py-1.5 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          Rollback
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Belum ada versi tersimpan</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      {activeSection === "metadata" && (
                        <div className="p-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Informasi Template
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">ID:</span>{" "}
                                  <span className="font-mono text-xs">
                                    {template.id}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Status:
                                  </span>{" "}
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      template.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {template.isActive ? "Aktif" : "Tidak Aktif"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Dibuat:
                                  </span>{" "}
                                  <span>{formatDate(template.createdAt)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Diperbarui:
                                  </span>{" "}
                                  <span>{formatDate(template.updatedAt)}</span>
                                </div>
                              </div>
                            </div>

                            {template.metadata && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Detail Automation Plan
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {template.metadata.targetUrl && (
                                    <div className="col-span-2">
                                      <span className="text-gray-600">
                                        Target URL:
                                      </span>{" "}
                                      <span className="font-mono text-xs break-all">
                                        {template.metadata.targetUrl}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-600">
                                      Jumlah Action:
                                    </span>{" "}
                                    <span className="font-semibold">
                                      {template.metadata.actionCount || 0}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Field Mapping:
                                    </span>{" "}
                                    <span className="font-semibold">
                                      {template.metadata.fieldMappingCount || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="pt-4 border-t">
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Hapus Template
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
