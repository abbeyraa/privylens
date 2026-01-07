"use client";

import { useEffect, useState } from "react";
import { initialGroups } from "./initialGroups";
import { stepTemplates } from "./stepTemplates";

const STORAGE_KEY = "otomate_editor_session";

const buildOpenGroups = (groups) =>
  groups.reduce((acc, group) => {
    acc[group.id] = true;
    return acc;
  }, {});

export function useEditorHandlers() {
  const [groups, setGroups] = useState(initialGroups);
  const [selectedStep, setSelectedStep] = useState({
    groupId: "group-access",
    stepId: "access-step-1",
  });
  const [openGroups, setOpenGroups] = useState(buildOpenGroups(initialGroups));
  const [draggedStepId, setDraggedStepId] = useState(null);
  const [draggedGroupId, setDraggedGroupId] = useState(null);
  const [draggedGroupSectionId, setDraggedGroupSectionId] = useState(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [hasInspected, setHasInspected] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsContent, setLogsContent] = useState("");
  const [inspectError, setInspectError] = useState("");
  const [runError, setRunError] = useState("");
  const [lastAddedGroupId, setLastAddedGroupId] = useState(null);

  const selectedGroup = groups.find(
    (group) => group.id === selectedStep.groupId
  );
  const selectedStepData = selectedGroup?.steps.find(
    (step) => step.id === selectedStep.stepId
  );

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setGroups(parsed.groups || initialGroups);
      setSelectedStep(
        parsed.selectedStep || {
          groupId: "group-access",
          stepId: "access-step-1",
        }
      );
      setOpenGroups(parsed.openGroups || buildOpenGroups(initialGroups));
      setTargetUrl(parsed.targetUrl || "");
      setTemplateName(parsed.templateName || "");
      setLogsContent(parsed.logsContent || "");
      setLogsOpen(Boolean(parsed.logsOpen));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          groups,
          selectedStep,
          openGroups,
          targetUrl,
          templateName,
          logsContent,
          logsOpen,
        })
      );
    } catch {
      // Ignore storage failures.
    }
  }, [groups, selectedStep, openGroups, targetUrl]);

  useEffect(() => {
    if (!lastAddedGroupId) return;
    const timer = setTimeout(() => setLastAddedGroupId(null), 700);
    return () => clearTimeout(timer);
  }, [lastAddedGroupId]);

  const getFirstStep = (nextGroups) => {
    for (const group of nextGroups) {
      if (group.steps.length > 0) {
        return { groupId: group.id, stepId: group.steps[0].id };
      }
    }
    return null;
  };

  const handleSelectStep = (groupId, stepId) => {
    setSelectedStep({ groupId, stepId });
  };

  const handleClearSelection = () => {
    setSelectedStep({ groupId: "", stepId: "" });
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
    setLastAddedGroupId(newGroupId);
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

  const handleExpandAllGroups = () => {
    setOpenGroups(buildOpenGroups(groups));
  };

  const handleCollapseAllGroups = () => {
    const collapsed = groups.reduce((acc, group) => {
      acc[group.id] = false;
      return acc;
    }, {});
    setOpenGroups(collapsed);
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
      timeoutMs: "5000",
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

  const handleStepDragEnd = () => {
    setDraggedStepId(null);
    setDraggedGroupId(null);
  };

  const handleDrop = (event, targetGroupId, targetStepId) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (payload.startsWith("template:")) {
      const templateId = payload.split(":")[1];
      if (!templateId) return;
      const template = stepTemplates.find((item) => item.id === templateId);
      if (!template) return;
      const templateStep = {
        id: `step-${Date.now()}`,
        ...template.step,
      };
      setGroups((prev) =>
        prev.map((group) => {
          if (group.id !== targetGroupId) return group;
          const nextSteps = [...group.steps];
          const targetIndex = nextSteps.findIndex(
            (step) => step.id === targetStepId
          );
          if (targetIndex === -1) {
            nextSteps.push(templateStep);
          } else {
            nextSteps.splice(targetIndex, 0, templateStep);
          }
          return { ...group, steps: nextSteps };
        })
      );
      setSelectedStep({ groupId: targetGroupId, stepId: templateStep.id });
      return;
    }

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

  const handleGroupDragEnd = () => {
    setDraggedGroupSectionId(null);
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
    setRunError("");
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

  const closeLogs = () => setLogsOpen(false);

  const resetEditor = () => {
    setGroups(initialGroups);
    setSelectedStep({ groupId: "group-access", stepId: "access-step-1" });
    setOpenGroups(buildOpenGroups(initialGroups));
    setTargetUrl("");
    setTemplateName("");
    setLogsContent("");
    setLogsOpen(false);
    setInspectError("");
    setRunError("");
    setHasInspected(false);
  };

  const runSteps = async () => {
    setIsRunning(true);
    setRunError("");
    setInspectError("");
    setLogsOpen(false);
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl, groups }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Run failed");
      }
      setHasInspected(true);
    } catch (error) {
      setRunError(error.message || "Run failed");
    } finally {
      setIsRunning(false);
    }
  };

  return {
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
    handleGroupDragStart,
    handleGroupDragEnd,
    handleGroupDrop,
    runInspect,
    runSteps,
    loadLogs,
    closeLogs,
    resetEditor,
  };
}
