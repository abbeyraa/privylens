"use client";

import { useState } from "react";
import { useEditorHandlers } from "./useEditorHandlers";
import { saveTemplate } from "../template/templateStorage";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  PlayCircle,
  FileText,
  GripVertical,
  Trash2,
  FolderPlus,
  User,
} from "lucide-react";
import { ActionDetails, actionTypes } from "./ActionDetails";
import { stepTemplates } from "./stepTemplates";

export default function EditorPage() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const {
    groups,
    selectedStep,
    openGroups,
    draggedStepId,
    draggedGroupId,
    draggedGroupSectionId,
    targetUrl,
    setTargetUrl,
    templateName,
    setTemplateName,
    hasInspected,
    isInspecting,
    isRunning,
    logsOpen,
    logsContent,
    inspectError,
    runError,
    selectedStepData,
    handleSelectStep,
    handleAddGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleAddStep,
    handleDeleteStep,
    handleStepChange,
    handleDragStart,
    handleStepDragEnd,
    handleDrop,
    handleGroupNameChange,
    handleGroupDragStart,
    handleGroupDragEnd,
    handleGroupDrop,
    runInspect,
    runSteps,
    loadLogs,
    closeLogs,
    resetEditor,
  } = useEditorHandlers();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">
                Template Name
              </label>
              <input
                type="text"
                placeholder="Template Name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                className="w-56 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">
                Target URL
              </label>
              <input
                type="text"
                placeholder="https://contoh.app"
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                className="w-64 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              disabled={isInspecting || isRunning}
              onClick={() => {
                const template = {
                  id: `template-${Date.now()}`,
                  name:
                    templateName?.trim() || new Date().toLocaleString("id-ID"),
                  createdAt: new Date().toISOString(),
                  targetUrl,
                  groups,
                };
                saveTemplate(template);
                setShowSaveConfirm(true);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg ${
                isInspecting || isRunning
                  ? "border-green-100 bg-green-50 text-green-300 cursor-not-allowed"
                  : "border-green-200 bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-red-200 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={runInspect}
              disabled={isInspecting}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg ${
                isInspecting
                  ? "bg-amber-100 text-amber-400 cursor-not-allowed"
                  : "bg-amber-200 text-amber-900 hover:bg-amber-300"
              }`}
            >
              {isInspecting ? "Inspecting..." : "Inspect"}
            </button>
            <button
              type="button"
              disabled={!hasInspected || isInspecting || isRunning}
              onClick={loadLogs}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg ${
                hasInspected && !isInspecting && !isRunning
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "bg-blue-50 text-blue-300 cursor-not-allowed"
              }`}
            >
              Logs
            </button>
            <button
              type="button"
              onClick={runSteps}
              disabled={isRunning || isInspecting}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
                isRunning || isInspecting
                  ? "bg-blue-200 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              {isRunning ? "Running..." : "Jalankan"}
            </button>
          </div>
          {inspectError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {inspectError}
            </div>
          )}
          {runError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {runError}
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border border-[#e5e5e5] bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Step Templates
            </div>
            <div className="flex items-center gap-3">
              {stepTemplates.map((template) => {
                const Icon = template.icon === "User" ? User : User;
                return (
                  <div
                    key={template.id}
                    className="group relative inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50"
                    draggable
                    onDragStart={(event) =>
                      event.dataTransfer.setData(
                        "text/plain",
                        `template:${template.id}`
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="pointer-events-none absolute top-full mt-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                      {template.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {logsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Inspect Logs
                  </h3>
                  <button
                    type="button"
                    onClick={closeLogs}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
                <div className="p-5">
                  <pre className="max-h-[60vh] overflow-y-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
                    {logsContent || "No logs yet."}
                  </pre>
                </div>
              </div>
            </div>
          )}
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="border-b border-[#e5e5e5] px-5 py-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Reset Editor
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Semua perubahan akan dikembalikan ke default.
                  </p>
                </div>
                <div className="px-5 py-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetEditor();
                      setShowResetConfirm(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
          {showSaveConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="border-b border-[#e5e5e5] px-5 py-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Template Tersimpan
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Template sudah tersimpan di halaman Template.
                  </p>
                </div>
                <div className="px-5 py-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSaveConfirm(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Flow Steps
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Kelola langkah dalam sub menu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <FolderPlus className="w-4 h-4" />
                  Add Sub Menu
                </button>
              </div>
              <div className="divide-y divide-[#e5e5e5]">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleGroupDrop(event, group.id)}
                  >
                    <div
                      className={`px-6 py-4 bg-gray-50 flex items-center justify-between ${
                        draggedGroupSectionId === group.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onDragStart={(event) =>
                            handleGroupDragStart(event, group.id)
                          }
                          onDragEnd={handleGroupDragEnd}
                          draggable
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
                            draggedGroupSectionId === group.id
                              ? "border-blue-200 bg-blue-100 text-blue-700"
                              : "border-[#e5e5e5] bg-white text-gray-400"
                          }`}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(event) =>
                            handleGroupNameChange(group.id, event.target.value)
                          }
                          className="bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleGroup(group.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {openGroups[group.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {openGroups[group.id] && (
                      <div className="divide-y divide-[#e5e5e5]">
                        {group.steps.map((step) => (
                          <div
                            key={step.id}
                            onClick={() => handleSelectStep(group.id, step.id)}
                            onDragStart={(event) =>
                              handleDragStart(event, group.id, step.id)
                            }
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) =>
                              handleDrop(event, group.id, step.id)
                            }
                            onDragEnd={handleStepDragEnd}
                            draggable
                            role="button"
                            tabIndex={0}
                            className={`w-full text-left px-6 py-4 transition-colors cursor-pointer ${
                              selectedStep.groupId === group.id &&
                              selectedStep.stepId === step.id
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <span
                                className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                                  draggedStepId === step.id &&
                                  draggedGroupId === group.id
                                    ? "border-blue-200 bg-blue-100 text-blue-700"
                                    : "border-[#e5e5e5] bg-white text-gray-400"
                                }`}
                              >
                                <GripVertical className="h-4 w-4" />
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {step.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {step.description}
                                </p>
                              </div>
                              <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                {step.type}
                              </span>
                              <button
                                type="button"
                                aria-label="Delete step"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteStep(group.id, step.id);
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="px-6 py-4">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                            onClick={() => handleAddStep(group.id)}
                          >
                            <FilePlus className="w-4 h-4" />
                            Add Step
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Step Details
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Input atau informasi yang dibutuhkan untuk langkah terpilih
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Nama Step
                    </label>
                    <input
                      type="text"
                      placeholder="Isi Kredensial"
                      value={selectedStepData?.title || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStep.groupId,
                          selectedStep.stepId,
                          "title",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
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
                        handleStepChange(
                          selectedStep.groupId,
                          selectedStep.stepId,
                          "description",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
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
                        handleStepChange(
                          selectedStep.groupId,
                          selectedStep.stepId,
                          "type",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
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
                        handleStepChange(
                          selectedStep.groupId,
                          selectedStep.stepId,
                          key,
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
