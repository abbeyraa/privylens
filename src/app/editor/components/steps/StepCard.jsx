"use client";

import {
  GripVertical,
  MousePointer,
  Type,
  Clock,
  MessageSquare,
  Navigation,
  Globe,
  Database,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const STEP_ICONS = {
  target: Globe,
  dataSource: Database,
  fieldMapping: FileText,
  action: {
    fill: Type,
    click: MousePointer,
    wait: Clock,
    handleDialog: MessageSquare,
    navigate: Navigation,
  },
  successIndicator: CheckCircle2,
  failureIndicator: XCircle,
  execution: Clock,
};

const STEP_LABELS = {
  target: "Target Configuration",
  dataSource: "Data Source",
  fieldMapping: "Field Mapping",
  action: {
    fill: "Isi Field",
    click: "Klik Elemen",
    wait: "Tunggu",
    handleDialog: "Tangani Dialog",
    navigate: "Navigasi",
  },
  successIndicator: "Success Indicator",
  failureIndicator: "Failure Indicator",
  execution: "Execution Settings",
};

const getStepIcon = (stepType, actionType = null) => {
  if (stepType === "action" && actionType) {
    return STEP_ICONS.action[actionType] || MousePointer;
  }
  return STEP_ICONS[stepType] || FileText;
};

const getStepLabel = (stepType, actionType = null, data = {}) => {
  if (stepType === "target") {
    return data.targetUrl || "Target Configuration";
  }
  if (stepType === "dataSource") {
    return data.type === "upload" ? "Upload Data" : "Manual Data";
  }
  if (stepType === "fieldMapping") {
    return `Field Mapping (${data.count || 0} fields)`;
  }
  if (stepType === "action") {
    const label = STEP_LABELS.action[actionType] || "Action";
    return data.target ? `${label}: ${data.target}` : label;
  }
  if (stepType === "successIndicator") {
    return data.value ? `Success: ${data.value}` : "Success Indicator";
  }
  if (stepType === "failureIndicator") {
    return data.value ? `Failure: ${data.value}` : "Failure Indicator";
  }
  if (stepType === "execution") {
    return data.mode === "loop" ? "Loop Execution" : "Single Execution";
  }
  return STEP_LABELS[stepType] || "Step";
};

export default function StepCard({
  step,
  index,
  isDragging = false,
  isExpanded = false,
  isDisabled = false,
  onEdit,
  onDelete,
  onToggle,
  onToggleDisable,
  dragHandleProps,
}) {
  const Icon = getStepIcon(step.type, step.actionType);
  const label = getStepLabel(step.type, step.actionType, step.data);

  return (
    <div
      className={`
        bg-white border-2 rounded-lg transition-all duration-200
        ${isDragging ? "opacity-50 shadow-lg border-blue-400" : "border-[#e5e5e5]"}
        ${isDisabled ? "opacity-50" : ""}
        ${isExpanded ? "shadow-md" : "hover:shadow-sm"}
      `}
    >
      {/* Card Header */}
      <div
        className={`
          p-4 cursor-pointer
          ${isExpanded ? "bg-blue-50 border-b border-[#e5e5e5]" : ""}
        `}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Step Number */}
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
              ${isDisabled ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-blue-700"}
            `}
          >
            {index + 1}
          </div>

          {/* Icon */}
          <div
            className={`
              p-2 rounded-lg
              ${isDisabled ? "bg-gray-100" : "bg-blue-50"}
            `}
          >
            <Icon
              className={`
              w-5 h-5
              ${isDisabled ? "text-gray-400" : "text-blue-600"}
            `}
            />
          </div>

          {/* Label & Summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`
                font-medium
                ${isDisabled ? "text-gray-500" : "text-gray-900"}
              `}
              >
                {label}
              </h3>
              {isDisabled && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                  Nonaktif
                </span>
              )}
              {step.hasError && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              {step.isValid && !step.hasError && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            {step.summary && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {step.summary}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDisable();
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title={isDisabled ? "Aktifkan" : "Nonaktifkan"}
            >
              {isDisabled ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            {step.deletable !== false && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Hapus langkah ini?")) {
                    onDelete();
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-[#e5e5e5] bg-gray-50">
          <div className="text-sm text-gray-600 space-y-2">
            {step.summary && (
              <p>
                <span className="font-medium">Ringkasan:</span> {step.summary}
              </p>
            )}
            {step.data && Object.keys(step.data).length > 0 && (
              <div>
                <span className="font-medium">Detail:</span>
                <div className="mt-1 text-xs bg-white p-2 rounded border border-[#e5e5e5] overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

