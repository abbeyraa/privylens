"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEditorHandlers } from "./useEditorHandlers";
import { saveTemplate } from "../template/templateStorage";
import LogsModal from "./modals/LogsModal";
import SavePromptModal from "./modals/SavePromptModal";
import SaveConfirmModal from "./modals/SaveConfirmModal";
import EditorDetailPanel from "./components/EditorDetailPanel";
import InputHelpModal from "./modals/InputHelpModal";
import RepeatModal from "./modals/RepeatModal";
import FormInputModal from "./modals/FormInputModal";
import FlowStepsPanel from "./components/FlowStepsPanel";
import EditorStyles from "./components/EditorStyles";
import { PlayCircle, FileText, User, Search } from "lucide-react";
import { stepTemplates } from "./stepTemplates";

const toColumnLabel = (index) => {
  let label = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
};

const getSheetColumns = (sheet, hasHeader) => {
  if (!sheet) return [];
  const maxColumns = sheet.maxColumns ?? sheet.columns?.length ?? 0;
  if (hasHeader && sheet.rows?.length) {
    const headerRow = Array.isArray(sheet.rows[0]) ? sheet.rows[0] : [];
    return Array.from({ length: maxColumns }, (_, index) => {
      const raw = headerRow[index];
      const cleaned =
        raw === null || raw === undefined ? "" : String(raw).trim();
      return cleaned || sheet.columns?.[index] || toColumnLabel(index);
    });
  }
  if (sheet.columns?.length) return sheet.columns;
  return Array.from({ length: maxColumns }, (_, index) => toColumnLabel(index));
};

export default function EditorPage() {
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showGroupToast, setShowGroupToast] = useState(false);
  const [showInputHelp, setShowInputHelp] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const resetMenuRef = useRef(null);
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") || "";
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
    lastAddedGroupId,
    handleSelectStep,
    handleClearSelection,
    handleAddGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleExpandAllGroups,
    handleCollapseAllGroups,
    handleAddStep,
    handleDeleteStep,
    handleStepChange,
    handleDragStart,
    handleStepDragEnd,
    handleDrop,
    handleGroupNameChange,
    handleUpdateGroupRepeat,
    handleDisableGroupRepeat,
    handleGroupDragStart,
    handleGroupDragEnd,
    handleGroupDrop,
    handleAddSteps,
    runInspect,
    runSteps,
    loadLogs,
    closeLogs,
    resetEditor,
    clearEditor,
    addLogStep,
  } = useEditorHandlers(templateId);

  const selectedGroup = groups.find(
    (group) => group.id === selectedStep.groupId
  );

  const isBlank = (value) => {
    if (value === 0) return false;
    return !value || !String(value).trim();
  };

  const isStepInvalid = (step) => {
    if (!step) return true;
    switch (step.type) {
      case "Click":
        return isBlank(step.label);
      case "Input": {
        const inputKind = step.inputKind || "text";
        const hasLabel = !isBlank(step.label);
        const hasValue = !isBlank(step.value);
        if (inputKind === "radio") {
          if (!hasLabel && !hasValue) return true;
          return false;
        }
        if (!hasLabel) return true;
        if (!hasValue) return true;
        return false;
      }
      case "Wait":
        return isBlank(step.waitMs);
      case "Navigate":
        return isBlank(step.url);
      default:
        return false;
    }
  };

  const hasInvalidStep = groups.some((group) =>
    group.steps.some((step) => isStepInvalid(step))
  );

  useEffect(() => {
    if (!showGroupToast) return;
    const timer = setTimeout(() => setShowGroupToast(false), 1200);
    return () => clearTimeout(timer);
  }, [showGroupToast]);

  useEffect(() => {
    if (!templateId) return;
    const cleaned = new URL(window.location.href);
    cleaned.searchParams.delete("templateId");
    window.history.replaceState({}, "", cleaned);
  }, [templateId]);

  useEffect(() => {
    if (!showResetMenu) return;
    const handleClick = (event) => {
      if (!resetMenuRef.current) return;
      if (resetMenuRef.current.contains(event.target)) return;
      setShowResetMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showResetMenu]);

  const detailKey = `${selectedStep.groupId}-${selectedStep.stepId}`;
  const [repeatModalGroupId, setRepeatModalGroupId] = useState("");
  const [formInputModalGroupId, setFormInputModalGroupId] = useState("");
  const [repeatDraftCount, setRepeatDraftCount] = useState("1");
  const [repeatDraftMode, setRepeatDraftMode] = useState("count");
  const [dataSummary, setDataSummary] = useState({
    rowsTotal: 0,
    hasHeader: false,
  });
  const [dataHeaders, setDataHeaders] = useState([]);

  const getRepeatConfig = (group) => {
    const repeat = group.repeat || {};
    return {
      enabled: Boolean(repeat.enabled),
      mode: repeat.mode || "count",
      count: repeat.count || 1,
      useData: repeat.useData ?? true,
    };
  };

 

  const selectedRepeat = selectedGroup ? getRepeatConfig(selectedGroup) : null;
  const isSelectedRepeatByData =
    selectedRepeat?.enabled && selectedRepeat?.mode === "data";

  const openRepeatModal = (group) => {
    const repeat = getRepeatConfig(group);
    setRepeatDraftCount(String(repeat.count || 1));
    setRepeatDraftMode(repeat.mode || "count");
    setRepeatModalGroupId(group.id);
  };

  const closeRepeatModal = () => {
    setRepeatModalGroupId("");
  };

  useEffect(() => {
    let isMounted = true;
    const loadDataSummary = async () => {
      try {
        const response = await fetch("/api/data", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        const stored = payload?.data;
        const firstSheet = stored?.sheets?.[0];
        const rawRows = Array.isArray(firstSheet?.rows)
          ? firstSheet.rows.length
          : 0;
        const hasHeader = Boolean(stored?.hasHeader);
        const rowsTotal = Math.max(0, rawRows - (hasHeader ? 1 : 0));
        if (!isMounted) return;
        setDataSummary({ rowsTotal, hasHeader });
        const headers = getSheetColumns(firstSheet, hasHeader)
          .map((item) => String(item || "").trim())
          .filter(Boolean);
        setDataHeaders(Array.from(new Set(headers)));
      } catch {
        // Ignore data load failures.
      }
    };

    loadDataSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 overflow-y-auto p-8"
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          handleClearSelection();
        }}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
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
              <button
                type="button"
                disabled={isInspecting || isRunning}
                onClick={() => {
                  setShowSavePrompt(true);
                }}
                className={`inline-flex h-9 w-9 items-center justify-center border rounded-lg ${
                  isInspecting || isRunning
                    ? "border-green-100 bg-green-50 text-green-300 cursor-not-allowed"
                    : "border-green-200 bg-green-100 text-green-700 hover:bg-green-200"
                }`}
                title="Simpan"
                aria-label="Simpan"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">
                  Inspect URL
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
                onClick={runInspect}
                disabled={isInspecting}
                className={`inline-flex h-9 w-9 items-center justify-center border border-[#e5e5e5] rounded-lg ${
                  isInspecting
                    ? "bg-amber-100 text-amber-400 cursor-not-allowed"
                    : "bg-amber-200 text-amber-900 hover:bg-amber-300"
                }`}
                title={isInspecting ? "Inspecting..." : "Inspect"}
                aria-label={isInspecting ? "Inspecting..." : "Inspect"}
              >
                <Search className="h-4 w-4" />
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
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={resetMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowResetMenu((open) => !open)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-red-200 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Reset
                </button>
                {showResetMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#e5e5e5] bg-white shadow-lg menu-pop z-50">
                    <button
                      type="button"
                      onClick={() => {
                        resetEditor();
                        setShowResetMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Reset to Initial
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearEditor();
                        setShowResetMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete All
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={runSteps}
                disabled={isRunning || isInspecting || hasInvalidStep}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                  isRunning || isInspecting || hasInvalidStep
                    ? "bg-blue-200 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={isRunning ? "Running..." : "Jalankan"}
                aria-label={isRunning ? "Running..." : "Jalankan"}
              >
                <PlayCircle className="w-4 h-4" />
              </button>
            </div>
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
            <LogsModal
              logsContent={logsContent}
              onClose={closeLogs}
              onCreateStep={addLogStep}
            />
          )}
          <SavePromptModal
            open={showSavePrompt}
            templateName={templateName}
            groups={groups}
            onCancel={() => setShowSavePrompt(false)}
            onConfirm={() => {
              const template = {
                id: `template-${Date.now()}`,
                name:
                  templateName?.trim() || new Date().toLocaleString("id-ID"),
                createdAt: new Date().toISOString(),
                targetUrl,
                groups,
              };
              const snapshot = JSON.parse(JSON.stringify(template));
              saveTemplate(snapshot);
              setShowSavePrompt(false);
              setShowSaveConfirm(true);
            }}
          />
          <SaveConfirmModal
            open={showSaveConfirm}
            onClose={() => setShowSaveConfirm(false)}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FlowStepsPanel
              groups={groups}
              openGroups={openGroups}
              selectedStep={selectedStep}
              draggedStepId={draggedStepId}
              draggedGroupId={draggedGroupId}
              draggedGroupSectionId={draggedGroupSectionId}
              lastAddedGroupId={lastAddedGroupId}
              showGroupToast={showGroupToast}
              isStepInvalid={isStepInvalid}
              getRepeatConfig={getRepeatConfig}
              onExpandAllGroups={handleExpandAllGroups}
              onCollapseAllGroups={handleCollapseAllGroups}
              onAddGroup={() => {
                handleAddGroup();
                setShowGroupToast(true);
              }}
              onSelectStep={handleSelectStep}
              onAddStep={handleAddStep}
              onDeleteStep={handleDeleteStep}
              onToggleGroup={handleToggleGroup}
              onDeleteGroup={handleDeleteGroup}
              onGroupNameChange={handleGroupNameChange}
              onGroupDragStart={handleGroupDragStart}
              onGroupDragEnd={handleGroupDragEnd}
              onGroupDrop={handleGroupDrop}
              onStepDragStart={handleDragStart}
              onStepDragEnd={handleStepDragEnd}
              onStepDrop={handleDrop}
              onOpenRepeatModal={openRepeatModal}
              onAddFormInput={(groupId) => setFormInputModalGroupId(groupId)}
            />
            <section className="space-y-6">
              <EditorDetailPanel
                key={detailKey}
                detailKey={detailKey}
                selectedStepData={selectedStepData}
                selectedStep={selectedStep}
                groupName={selectedGroup?.name || ""}
                stepName={selectedStepData?.title || ""}
                dataHeaders={dataHeaders}
                isRepeatByData={isSelectedRepeatByData}
                onOpenHelp={() => setShowInputHelp(true)}
                onStepChange={handleStepChange}
              />
            </section>
          </div>
          <InputHelpModal
            open={showInputHelp}
            onClose={() => setShowInputHelp(false)}
          />
          <RepeatModal
            open={Boolean(repeatModalGroupId)}
            mode={repeatDraftMode}
            count={repeatDraftCount}
            dataSummary={dataSummary}
            onModeChange={setRepeatDraftMode}
            onCountChange={setRepeatDraftCount}
            onDisable={() => {
              handleDisableGroupRepeat(repeatModalGroupId);
              closeRepeatModal();
            }}
            onClose={closeRepeatModal}
            onSave={() => {
              const countValue = Math.max(
                1,
                Number.parseInt(repeatDraftCount, 10) || 1
              );
              const modeValue = repeatDraftMode || "count";
              const nextCount =
                modeValue === "data" ? dataSummary.rowsTotal : countValue;
              handleUpdateGroupRepeat(repeatModalGroupId, {
                enabled: true,
                mode: modeValue,
                count: nextCount,
                useData: modeValue === "data",
              });
              closeRepeatModal();
            }}
          />
          <FormInputModal
            open={Boolean(formInputModalGroupId)}
            onClose={() => setFormInputModalGroupId("")}
            onCreate={(steps) => handleAddSteps(formInputModalGroupId, steps)}
          />
        </div>
      </div>
      <EditorStyles />
    </div>
  );
}
