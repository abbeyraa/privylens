"use client";

import { useState, useMemo } from "react";
import { extractAllRows, getXlsxSheets } from "@/lib/api";
import TargetConfiguration from "./components/TargetConfiguration";
import DataSourceSection from "./components/DataSourceSection";
import FieldMappingSection from "./components/FieldMappingSection";
import ActionFlowSection from "./components/ActionFlowSection";
import AutomationPlanPreview from "./components/AutomationPlanPreview";
import ExecutionReport from "./components/ExecutionReport";

/**
 * Automation Plan Structure:
 * {
 *   target: {
 *     url: string,
 *     sessionMethod: "new" | "reuse",
 *     sessionId?: string,
 *     pageReadyIndicator: {
 *       type: "selector" | "text" | "url",
 *       value: string
 *     }
 *   },
 *   dataSource: {
 *     type: "upload" | "manual",
 *     rows: Array<Object>,
 *     mode: "single" | "batch"
 *   },
 *   fieldMappings: Array<{
 *     name: string,
 *     type: "text" | "select" | "checkbox" | "radio" | "textarea",
 *     dataKey: string,
 *     required: boolean,
 *     labels: Array<string>,
 *     fallbackLabels?: Array<string>,
 *     conditional?: {
 *       type: "dataExists" | "elementExists",
 *       value: string
 *     }
 *   }>,
 *   actions: Array<{
 *     type: "fill" | "click" | "wait" | "handleDialog",
 *     target: string, // field name atau selector
 *     value?: any,
 *     waitFor?: {
 *       type: "selector" | "text" | "url",
 *       value: string
 *     }
 *   }>,
 *   successIndicator: {
 *     type: "selector" | "text" | "url",
 *     value: string
 *   },
 *   failureIndicator?: {
 *     type: "selector" | "text" | "url",
 *     value: string
 *   }
 * }
 */

export default function AutomatePage() {
  // Target Configuration
  const [targetUrl, setTargetUrl] = useState("");
  const [sessionMethod, setSessionMethod] = useState("new");
  const [sessionId, setSessionId] = useState("");
  const [pageReadyType, setPageReadyType] = useState("selector");
  const [pageReadyValue, setPageReadyValue] = useState("");

  // Data Source
  const [dataSourceType, setDataSourceType] = useState("upload");
  const [rows, setRows] = useState([]);
  const [manualRows, setManualRows] = useState([{}]);
  const [manualColumns, setManualColumns] = useState(["field1"]);
  const [dataMode, setDataMode] = useState("single");
  const [xlsxSheets, setXlsxSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  // Field Mappings
  const [fieldMappings, setFieldMappings] = useState([]);

  // Action Flow
  const [actions, setActions] = useState([]);
  const [successIndicator, setSuccessIndicator] = useState({
    type: "selector",
    value: "",
  });
  const [failureIndicator, setFailureIndicator] = useState({
    type: "selector",
    value: "",
  });

  // Execution
  const [automationPlan, setAutomationPlan] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionReport, setExecutionReport] = useState(null);

  const effectiveRows = useMemo(() => {
    return dataSourceType === "manual" ? manualRows : rows;
  }, [dataSourceType, manualRows, rows]);

  const columns = useMemo(() => {
    if (dataSourceType === "manual") return manualColumns;
    if (!effectiveRows.length) return [];
    return Object.keys(effectiveRows[0] || {});
  }, [dataSourceType, manualColumns, effectiveRows]);

  const handleFileSelect = async (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx"].includes(ext)) {
      throw new Error("Hanya file CSV atau XLSX yang didukung");
    }

    if (ext === "xlsx") {
      const sheets = await getXlsxSheets(file);
      setXlsxSheets(sheets);
      setSelectedSheet(sheets[0] || "");
      const data = await extractAllRows(file, sheets[0] || null);
      setRows(data);
    } else {
      setXlsxSheets([]);
      setSelectedSheet("");
      const data = await extractAllRows(file, null);
      setRows(data);
    }
  };

  const handleSheetChange = async (sheetName, file) => {
    setSelectedSheet(sheetName);
    if (file) {
      const data = await extractAllRows(file, sheetName);
      setRows(data);
    }
  };

  const generateAutomationPlan = () => {
    const plan = {
      target: {
        url: targetUrl.trim(),
        sessionMethod: sessionMethod,
        ...(sessionMethod === "reuse" && sessionId
          ? { sessionId: sessionId.trim() }
          : {}),
        pageReadyIndicator: {
          type: pageReadyType,
          value: pageReadyValue.trim(),
        },
      },
      dataSource: {
        type: dataSourceType,
        rows: effectiveRows,
        mode: dataMode,
        ...(dataMode === "single" && { selectedRowIndex }),
      },
      fieldMappings: fieldMappings.map((fm) => ({
        name: fm.name,
        type: fm.type,
        dataKey: fm.dataKey,
        required: fm.required || false,
        labels: fm.labels || [],
        ...(fm.fallbackLabels?.length
          ? { fallbackLabels: fm.fallbackLabels }
          : {}),
        ...(fm.conditional ? { conditional: fm.conditional } : {}),
      })),
      actions: actions.map((action) => ({
        type: action.type,
        target: action.target,
        ...(action.value !== undefined ? { value: action.value } : {}),
        ...(action.waitFor ? { waitFor: action.waitFor } : {}),
      })),
      successIndicator: {
        type: successIndicator.type,
        value: successIndicator.value.trim(),
      },
      ...(failureIndicator.value.trim()
        ? {
            failureIndicator: {
              type: failureIndicator.type,
              value: failureIndicator.value.trim(),
            },
          }
        : {}),
    };

    return plan;
  };

  const handleRun = async () => {
    // Validate required fields
    if (!targetUrl.trim()) {
      alert("Target URL harus diisi");
      return;
    }

    if (!pageReadyValue.trim()) {
      alert("Page Ready Indicator harus diisi");
      return;
    }

    if (!effectiveRows.length) {
      alert("Data source harus diisi");
      return;
    }

    if (!fieldMappings.length) {
      alert("Minimal satu field mapping harus didefinisikan");
      return;
    }

    if (!actions.length) {
      alert("Minimal satu action harus didefinisikan");
      return;
    }

    if (!successIndicator.value.trim()) {
      alert("Success Indicator harus didefinisikan");
      return;
    }

    // Generate and lock Automation Plan
    const plan = generateAutomationPlan();
    setAutomationPlan(plan);
    setIsExecuting(true);
    setExecutionReport(null);

    try {
      // Send to Playwright Runner
      const response = await fetch("/api/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const report = await response.json();
      setExecutionReport(report);
    } catch (error) {
      console.error("Execution error:", error);
      setExecutionReport({
        status: "error",
        message: error.message,
        results: [],
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-[#f7faff] via-[#ecf2ff] to-[#fafafb]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-base font-medium text-[#3b82f6] uppercase tracking-wide">
            Automation Plan Builder
          </p>
          <h1 className="mt-1 text-4xl font-bold text-[#1a1a1a] drop-shadow-sm">
            Rancang Rencana Otomasi Form
          </h1>
          <p className="mt-3 text-lg text-[#586581] max-w-2xl mx-auto">
            Definisikan tujuan automasi, sumber data, dan aturan pengisian form
            secara konseptual. Eksekusi teknis ditangani oleh Playwright Runner
            secara terpisah.
          </p>
        </div>

        <div className="space-y-6">
          {/* Target Configuration */}
          <TargetConfiguration
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            sessionMethod={sessionMethod}
            setSessionMethod={setSessionMethod}
            sessionId={sessionId}
            setSessionId={setSessionId}
            pageReadyType={pageReadyType}
            setPageReadyType={setPageReadyType}
            pageReadyValue={pageReadyValue}
            setPageReadyValue={setPageReadyValue}
          />

          {/* Data Source */}
          <DataSourceSection
            dataSourceType={dataSourceType}
            setDataSourceType={setDataSourceType}
            rows={rows}
            setRows={setRows}
            manualRows={manualRows}
            setManualRows={setManualRows}
            manualColumns={manualColumns}
            setManualColumns={setManualColumns}
            dataMode={dataMode}
            setDataMode={setDataMode}
            xlsxSheets={xlsxSheets}
            setXlsxSheets={setXlsxSheets}
            selectedSheet={selectedSheet}
            setSelectedSheet={setSelectedSheet}
            selectedRowIndex={selectedRowIndex}
            setSelectedRowIndex={setSelectedRowIndex}
            onFileSelect={handleFileSelect}
            onSheetChange={handleSheetChange}
            effectiveRows={effectiveRows}
            columns={columns}
          />

          {/* Field Mappings */}
          <FieldMappingSection
            fieldMappings={fieldMappings}
            setFieldMappings={setFieldMappings}
            columns={columns}
          />

          {/* Action Flow */}
          <ActionFlowSection
            actions={actions}
            setActions={setActions}
            fieldMappings={fieldMappings}
            successIndicator={successIndicator}
            setSuccessIndicator={setSuccessIndicator}
            failureIndicator={failureIndicator}
            setFailureIndicator={setFailureIndicator}
          />

          {/* Automation Plan Preview */}
          <AutomationPlanPreview
            plan={generateAutomationPlan()}
            effectiveRows={effectiveRows}
          />

          {/* Run Button */}
          <div className="flex justify-center">
            <button
              onClick={handleRun}
              disabled={isExecuting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? "Menjalankan..." : "Jalankan Automation Plan"}
            </button>
          </div>

          {/* Execution Report */}
          {executionReport && <ExecutionReport report={executionReport} />}
        </div>
      </div>
    </div>
  );
}
