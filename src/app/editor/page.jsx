"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  PlayCircle,
  FileText,
  GripVertical,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { ActionDetails, actionTypes } from "./ActionDetails";
import { initialGroups } from "./initialGroups";

export default function EditorPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [selectedStep, setSelectedStep] = useState({
    groupId: "group-access",
    stepId: "access-step-1",
  });
  const [openGroups, setOpenGroups] = useState(() =>
    initialGroups.reduce((acc, group) => {
      acc[group.id] = true;
      return acc;
    }, {})
  );
  const [draggedStepId, setDraggedStepId] = useState(null);
  const [draggedGroupId, setDraggedGroupId] = useState(null);
  const [draggedGroupSectionId, setDraggedGroupSectionId] = useState(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [hasInspected, setHasInspected] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsContent, setLogsContent] = useState("");
  const [inspectError, setInspectError] = useState("");

  const selectedGroup = groups.find(
    (group) => group.id === selectedStep.groupId
  );
  const selectedStepData = selectedGroup?.steps.find(
    (step) => step.id === selectedStep.stepId
  );

  const getFirstStep = (nextGroups) => {
    for (const group of nextGroups) {
      if (group.steps.length > 0) {
        return { groupId: group.id, stepId: group.steps[0].id };
      }
    }
    return null;
  };

  const handleAddGroup = () => {
    const newGroupId = `group-${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      name: "New Group",
      steps: [],
    };
    setGroups((prev) => [...prev, newGroup]);
    setOpenGroups((prev) => ({ ...prev, [newGroupId]: true }));
  };

  const handleDeleteGroup = (groupId) => {
    setGroups((prev) => {
      const next = prev.filter((group) => group.id !== groupId);
      if (selectedStep.groupId === groupId) {
        const first = getFirstStep(next);
        setSelectedStep(first || { groupId: "", stepId: "" });
      }
      return next;
    });
  };

  const handleToggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleAddStep = (groupId) => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: "Step Baru",
      description: "Isi detail langkah ini",
      type: "Click",
      selector: "",
      value: "",
      label: "",
      waitMs: "",
      url: "",
    };
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, steps: [...group.steps, newStep] }
          : group
      )
    );
    setSelectedStep({ groupId, stepId: newStep.id });
  };

  const handleDeleteStep = (groupId, stepId) => {
    setGroups((prev) => {
      const next = prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          steps: group.steps.filter((step) => step.id !== stepId),
        };
      });
      if (selectedStep.groupId === groupId && selectedStep.stepId === stepId) {
        const first = getFirstStep(next);
        setSelectedStep(first || { groupId: "", stepId: "" });
      }
      return next;
    });
  };

  const handleStepChange = (groupId, stepId, key, value) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          steps: group.steps.map((step) =>
            step.id === stepId ? { ...step, [key]: value } : step
          ),
        };
      })
    );
  };

  const handleDragStart = (event, groupId, stepId) => {
    setDraggedStepId(stepId);
    setDraggedGroupId(groupId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${groupId}:${stepId}`);
  };

  const handleDrop = (event, targetGroupId, targetStepId) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    const [dragGroupId, draggedStepId] = payload.split(":");
    if (!draggedStepId || draggedStepId === targetStepId) return;
    if (dragGroupId !== targetGroupId) return;

    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== targetGroupId) return group;
        const draggedIndex = group.steps.findIndex(
          (step) => step.id === draggedStepId
        );
        const targetIndex = group.steps.findIndex(
          (step) => step.id === targetStepId
        );
        if (draggedIndex === -1 || targetIndex === -1) return group;
        const nextSteps = [...group.steps];
        const [moved] = nextSteps.splice(draggedIndex, 1);
        nextSteps.splice(targetIndex, 0, moved);
        return { ...group, steps: nextSteps };
      })
    );
  };

  const handleGroupNameChange = (groupId, value) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, name: value } : group
      )
    );
  };

  const handleGroupDragStart = (event, groupId) => {
    setDraggedGroupSectionId(groupId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `group:${groupId}`);
  };

  const handleGroupDrop = (event, targetGroupId) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload.startsWith("group:")) return;
    const draggedGroupId = payload.split(":")[1];
    if (!draggedGroupId || draggedGroupId === targetGroupId) return;

    setGroups((prev) => {
      const draggedIndex = prev.findIndex(
        (group) => group.id === draggedGroupId
      );
      const targetIndex = prev.findIndex((group) => group.id === targetGroupId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const runInspect = async () => {
    setIsInspecting(true);
    setInspectError("");
    setLogsOpen(false);
    try {
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Inspect failed");
      }
      setHasInspected(true);
    } catch (error) {
      setInspectError(error.message || "Inspect failed");
    } finally {
      setIsInspecting(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch("/api/inspect");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Logs not available");
      }
      setLogsContent(JSON.stringify(data.data, null, 2));
      setLogsOpen(true);
    } catch (error) {
      setInspectError(error.message || "Failed to load logs");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-end gap-3">
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
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={runInspect}
              disabled={isInspecting}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg ${
                isInspecting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {isInspecting ? "Inspecting..." : "Inspect"}
            </button>
            <button
              type="button"
              disabled={!hasInspected || isInspecting}
              onClick={loadLogs}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg ${
                hasInspected && !isInspecting
                  ? "bg-white text-gray-700 hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Logs
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlayCircle className="w-4 h-4" />
              Jalankan
            </button>
          </div>
          {inspectError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {inspectError}
            </div>
          )}
          {logsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Inspect Logs
                  </h3>
                  <button
                    type="button"
                    onClick={() => setLogsOpen(false)}
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
                          onDragEnd={() => setDraggedGroupSectionId(null)}
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
                            onClick={() =>
                              setSelectedStep({
                                groupId: group.id,
                                stepId: step.id,
                              })
                            }
                            onDragStart={(event) =>
                              handleDragStart(event, group.id, step.id)
                            }
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) =>
                              handleDrop(event, group.id, step.id)
                            }
                            onDragEnd={() => {
                              setDraggedStepId(null);
                              setDraggedGroupId(null);
                            }}
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
