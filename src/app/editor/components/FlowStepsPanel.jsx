"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  GripVertical,
  Trash2,
  FolderPlus,
  ChevronsDown,
  ChevronsUp,
  Repeat,
  Database,
} from "lucide-react";

export default function FlowStepsPanel({
  groups,
  openGroups,
  selectedStep,
  draggedStepId,
  draggedGroupId,
  draggedGroupSectionId,
  lastAddedGroupId,
  showGroupToast,
  isStepInvalid,
  getRepeatConfig,
  onExpandAllGroups,
  onCollapseAllGroups,
  onAddGroup,
  onSelectStep,
  onAddStep,
  onDeleteStep,
  onToggleGroup,
  onDeleteGroup,
  onGroupNameChange,
  onGroupDragStart,
  onGroupDragEnd,
  onGroupDrop,
  onStepDragStart,
  onStepDragEnd,
  onStepDrop,
  onOpenRepeatModal,
}) {
  const [emptyDropGroupId, setEmptyDropGroupId] = useState("");
  const [hoveredGroupId, setHoveredGroupId] = useState("");
  const [stepDropTarget, setStepDropTarget] = useState({
    groupId: "",
    stepId: "",
    position: "after",
  });

  return (
    <section className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Flow Steps</h2>
          <p className="text-xs text-gray-500 mt-1">
            Kelola langkah dalam sub menu
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAllGroups}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50"
            title="Expand all"
            aria-label="Expand all"
          >
            <ChevronsDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCollapseAllGroups}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50"
            title="Collapse all"
            aria-label="Collapse all"
          >
            <ChevronsUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAddGroup}
            disabled={showGroupToast}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <FolderPlus className="w-4 h-4" />
            Add Group
          </button>
          {showGroupToast && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 px-2 backdrop-blur-sm">
              <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700 shadow-sm toast-pop">
                Group berhasil ditambahkan
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="divide-y divide-[#e5e5e5]">
        {groups.map((group) => (
          <div
            key={group.id}
            onDragOver={(event) => {
              event.preventDefault();
              setHoveredGroupId(group.id);
            }}
            onDragLeave={() => {
              setHoveredGroupId((current) =>
                current === group.id ? "" : current
              );
            }}
            onDrop={(event) => {
              onGroupDrop(event, group.id);
              setHoveredGroupId("");
            }}
            className="relative"
          >
            {draggedGroupSectionId && hoveredGroupId === group.id && (
              <div className="absolute left-0 right-0 top-0 h-0.5 bg-blue-400" />
            )}
                    <div
                      className={`px-6 py-4 bg-gray-50 flex items-center justify-between ${
                        draggedGroupSectionId === group.id || hoveredGroupId === group.id
                          ? "bg-blue-50"
                          : ""
                      } ${lastAddedGroupId === group.id ? "group-added" : ""} ${
                        draggedGroupSectionId === group.id ? "is-dragging" : ""
                      }`}
                    >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onDragStart={(event) => onGroupDragStart(event, group.id)}
                  onDragEnd={onGroupDragEnd}
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
                    onGroupNameChange(group.id, event.target.value)
                  }
                  className="bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenRepeatModal(group)}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
                    getRepeatConfig(group).enabled
                      ? "border-amber-200 bg-amber-100 text-amber-700"
                      : "border-[#e5e5e5] bg-white text-gray-400 hover:bg-gray-50"
                  }`}
                  title={
                    getRepeatConfig(group).enabled
                      ? "Repeat group enabled"
                      : "Repeat group disabled"
                  }
                  aria-label="Toggle repeat group"
                >
                  <span className="relative inline-flex">
                    <Repeat className="h-4 w-4" />
                    {getRepeatConfig(group).enabled &&
                      getRepeatConfig(group).useData && (
                        <span className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 text-blue-600 shadow-sm">
                          <Database className="h-3 w-3" />
                        </span>
                      )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleGroup(group.id)}
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
                  onClick={() => onDeleteGroup(group.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {openGroups[group.id] && (
              <div className="ml-6 border-l border-dashed border-[#e5e5e5]">
                <div className="px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Steps
                </div>
                <div className="divide-y divide-[#e5e5e5]">
                  {group.steps.length === 0 ? (
                    <div className="px-6 py-4">
                      <div
                        className={`rounded-lg border border-dashed px-4 py-4 text-sm transition ${
                          emptyDropGroupId === group.id
                            ? "border-blue-300 bg-blue-50 text-blue-600"
                            : "border-[#e5e5e5] bg-gray-50 text-gray-500"
                        }`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setEmptyDropGroupId(group.id);
                          setStepDropTarget({
                            groupId: group.id,
                            stepId: "",
                            position: "after",
                          });
                        }}
                        onDragLeave={() => {
                          setEmptyDropGroupId((current) =>
                            current === group.id ? "" : current
                          );
                          setStepDropTarget((current) =>
                            current.groupId === group.id
                              ? { groupId: "", stepId: "" }
                              : current
                          );
                        }}
                        onDrop={(event) => {
                          onStepDrop(event, group.id, "");
                          setEmptyDropGroupId("");
                          setStepDropTarget({
                            groupId: "",
                            stepId: "",
                            position: "after",
                          });
                        }}
                      >
                        Blank step — add a step to start editing.
                      </div>
                    </div>
                  ) : (
                    group.steps.map((step) => {
                      const isSelected =
                        selectedStep.groupId === group.id &&
                        selectedStep.stepId === step.id;
                      const isInvalid = isStepInvalid(step);
                      return (
                        <div
                          key={step.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectStep(group.id, step.id);
                        }}
                        onDragStart={(event) =>
                          onStepDragStart(event, group.id, step.id)
                        }
                        onDragOver={(event) => {
                          event.preventDefault();
                          const rect = event.currentTarget.getBoundingClientRect();
                          const offset = event.clientY - rect.top;
                          const position =
                            offset < rect.height / 2 ? "before" : "after";
                          setStepDropTarget({
                            groupId: group.id,
                            stepId: step.id,
                            position,
                          });
                        }}
                        onDragLeave={() => {
                          setStepDropTarget((current) =>
                            current.groupId === group.id &&
                            current.stepId === step.id
                              ? { groupId: "", stepId: "" }
                              : current
                          );
                        }}
                        onDrop={(event) => {
                          onStepDrop(
                            event,
                            group.id,
                            step.id,
                            stepDropTarget.position
                          );
                          setStepDropTarget({
                            groupId: "",
                            stepId: "",
                            position: "after",
                          });
                        }}
                        onDragEnd={onStepDragEnd}
                        draggable
                        role="button"
                        tabIndex={0}
                        data-step-row="true"
                        className={`relative w-full text-left pl-6 pr-6 py-4 transition-colors cursor-pointer rounded-md ${
                          isInvalid
                            ? "bg-red-50 ring-1 ring-red-200"
                            : isSelected
                            ? "bg-blue-50 ring-1 ring-blue-200"
                            : "hover:bg-gray-50"
                        } ${
                          draggedStepId === step.id && draggedGroupId === group.id
                            ? "is-dragging"
                            : ""
                        } ${
                          stepDropTarget.groupId === group.id &&
                          stepDropTarget.stepId === step.id
                            ? "drop-target"
                            : ""
                        }`}
                      >
                        {stepDropTarget.groupId === group.id &&
                          stepDropTarget.stepId === step.id && (
                            <div
                              className={`absolute left-6 right-6 h-0.5 bg-blue-400 ${
                                stepDropTarget.position === "before"
                                  ? "top-0"
                                  : "bottom-0"
                              }`}
                            />
                          )}
                          <span
                            className={`absolute left-0 top-3 bottom-3 w-1 rounded-r bg-blue-500 origin-center transition-transform duration-200 ease-out ${
                              isSelected
                                ? "scale-y-100 opacity-100"
                                : "scale-y-0 opacity-0"
                            }`}
                          />
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
                                onDeleteStep(group.id, step.id);
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div className="pl-6 pr-6 py-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => onAddStep(group.id)}
                    >
                      <FilePlus className="w-4 h-4" />
                      Add Step
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
