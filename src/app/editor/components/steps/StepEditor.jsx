"use client";

import { X } from "lucide-react";
import TargetConfiguration from "../target/TargetConfiguration";
import DataSourceSection from "../data-source/DataSourceSection";
import FieldMappingSection from "../field-mapping/FieldMappingSection";
import ActionNodeEditor from "../actions/ActionNodeEditor";

export default function StepEditor({
  step,
  onClose,
  onSave,
  // Target props
  targetUrl,
  setTargetUrl,
  requiresLogin,
  setRequiresLogin,
  loginUrl,
  setLoginUrl,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  navigationSteps,
  setNavigationSteps,
  pageReadyType,
  setPageReadyType,
  pageReadyValue,
  setPageReadyValue,
  // Data source props
  dataSourceType,
  setDataSourceType,
  rows,
  setRows,
  manualRows,
  setManualRows,
  manualColumns,
  setManualColumns,
  dataMode,
  setDataMode,
  xlsxSheets,
  setXlsxSheets,
  selectedSheet,
  setSelectedSheet,
  selectedRowIndex,
  setSelectedRowIndex,
  // Field mapping props
  fieldMappings,
  setFieldMappings,
  // Action props
  actions,
  setActions,
  hasDataSourceNode,
  // Indicator & execution props
  successIndicator,
  setSuccessIndicator,
  failureIndicator,
  setFailureIndicator,
  execution,
  setExecution,
}) {
  if (!step) return null;

  const renderEditorContent = () => {
    switch (step.type) {
      case "target":
        return (
          <TargetConfiguration
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            requiresLogin={requiresLogin}
            setRequiresLogin={setRequiresLogin}
            loginUrl={loginUrl}
            setLoginUrl={setLoginUrl}
            loginUsername={loginUsername}
            setLoginUsername={setLoginUsername}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            navigationSteps={navigationSteps}
            setNavigationSteps={setNavigationSteps}
            pageReadyType={pageReadyType}
            setPageReadyType={setPageReadyType}
            pageReadyValue={pageReadyValue}
            setPageReadyValue={setPageReadyValue}
          />
        );

      case "dataSource":
        return (
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
            onFileSelect={async (file) => {
              // Handle file upload
              const fileType = file.name.split(".").pop().toLowerCase();
              if (fileType === "csv") {
                const text = await file.text();
                const { extractAllRows } = await import("@/lib/api");
                const parsed = extractAllRows(text);
                setRows(parsed);
              } else if (fileType === "xlsx" || fileType === "xls") {
                const { getXlsxSheets } = await import("@/lib/api");
                const sheets = await getXlsxSheets(file);
                setXlsxSheets(sheets);
                if (sheets.length > 0) {
                  setSelectedSheet(sheets[0].name);
                }
              }
            }}
            onSheetChange={async (sheetName) => {
              // Handle sheet change
              const input = document.getElementById("data-source-file-input");
              const file = input?.files?.[0];
              if (file) {
                const { extractAllRows } = await import("@/lib/api");
                const parsed = await extractAllRows(file, sheetName);
                setRows(parsed);
              }
            }}
            effectiveRows={dataSourceType === "upload" ? rows : manualRows}
            columns={
              dataSourceType === "upload" && rows.length > 0
                ? Object.keys(rows[0])
                : manualColumns
            }
          />
        );

      case "fieldMapping":
        return (
          <FieldMappingSection
            fieldMappings={fieldMappings}
            setFieldMappings={setFieldMappings}
            columns={
              dataSourceType === "upload" && rows.length > 0
                ? Object.keys(rows[0])
                : manualColumns || []
            }
          />
        );

      case "action":
        // Find the specific action node
        const actionNode = actions?.find((a) => a.id === step.id);
        if (!actionNode) {
          return (
            <div className="p-6 text-center text-gray-500">
              Action tidak ditemukan
            </div>
          );
        }
        // Convert to ActionNodeEditor format
        return (
          <div className="p-6">
            <ActionNodeEditor
              node={{
                id: actionNode.id,
                data: {
                  actionType: actionNode.data.actionType,
                  actionTarget: actionNode.data.actionTarget,
                  actionValue: actionNode.data.actionValue,
                  actionWaitFor: actionNode.data.actionWaitFor,
                },
              }}
              setNode={(updateFnOrNode) => {
                const updatedNode =
                  typeof updateFnOrNode === "function"
                    ? updateFnOrNode({
                        id: actionNode.id,
                        data: actionNode.data,
                      })
                    : updateFnOrNode;

                setActions((prev) =>
                  prev.map((a) =>
                    a.id === actionNode.id
                      ? {
                          ...a,
                          data: {
                            actionType: updatedNode.data.actionType || a.data.actionType,
                            actionTarget: updatedNode.data.actionTarget || a.data.actionTarget,
                            actionValue: updatedNode.data.actionValue,
                            actionWaitFor: updatedNode.data.actionWaitFor,
                          },
                        }
                      : a
                  )
                );
              }}
              fieldMappings={fieldMappings}
              onDelete={() => {
                setActions((prev) => prev.filter((a) => a.id !== actionNode.id));
                onClose();
              }}
            />
          </div>
        );

      case "successIndicator":
        return (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Indikator
              </label>
              <select
                value={successIndicator.type}
                onChange={(e) =>
                  setSuccessIndicator({
                    ...successIndicator,
                    type: e.target.value,
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="selector">CSS Selector</option>
                <option value="text">Teks</option>
                <option value="url">URL Pattern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nilai Indikator
              </label>
              <input
                type="text"
                value={successIndicator.value}
                onChange={(e) =>
                  setSuccessIndicator({
                    ...successIndicator,
                    value: e.target.value,
                  })
                }
                placeholder="Indikator yang menunjukkan eksekusi berhasil"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case "failureIndicator":
        return (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Indikator
              </label>
              <select
                value={failureIndicator.type}
                onChange={(e) =>
                  setFailureIndicator({
                    ...failureIndicator,
                    type: e.target.value,
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="selector">CSS Selector</option>
                <option value="text">Teks</option>
                <option value="url">URL Pattern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nilai Indikator
              </label>
              <input
                type="text"
                value={failureIndicator.value}
                onChange={(e) =>
                  setFailureIndicator({
                    ...failureIndicator,
                    value: e.target.value,
                  })
                }
                placeholder="Indikator yang menunjukkan eksekusi gagal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case "execution":
        return (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode Eksekusi
              </label>
              <select
                value={execution.mode}
                onChange={(e) =>
                  setExecution({
                    ...execution,
                    mode: e.target.value,
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="once">Sekali</option>
                <option value="loop">Loop</option>
              </select>
            </div>
            {execution.mode === "loop" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimal Iterasi
                  </label>
                  <input
                    type="number"
                    value={execution.loop.maxIterations}
                    onChange={(e) =>
                      setExecution({
                        ...execution,
                        loop: {
                          ...execution.loop,
                          maxIterations: Number(e.target.value),
                        },
                      })
                    }
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Antar Iterasi (detik)
                  </label>
                  <input
                    type="number"
                    value={execution.loop.delaySeconds}
                    onChange={(e) =>
                      setExecution({
                        ...execution,
                        loop: {
                          ...execution.loop,
                          delaySeconds: Number(e.target.value),
                        },
                      })
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Berhenti Ketika
                  </label>
                  <select
                    value={execution.loop.stopWhen}
                    onChange={(e) =>
                      setExecution({
                        ...execution,
                        loop: {
                          ...execution.loop,
                          stopWhen: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="visible">Elemen Terlihat</option>
                    <option value="notVisible">Elemen Tidak Terlihat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indikator Stop
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={execution.loop.indicator.type}
                      onChange={(e) =>
                        setExecution({
                          ...execution,
                          loop: {
                            ...execution.loop,
                            indicator: {
                              ...execution.loop.indicator,
                              type: e.target.value,
                            },
                          },
                        })
                      }
                      className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="selector">CSS Selector</option>
                      <option value="text">Teks</option>
                      <option value="url">URL Pattern</option>
                    </select>
                    <input
                      type="text"
                      value={execution.loop.indicator.value}
                      onChange={(e) =>
                        setExecution({
                          ...execution,
                          loop: {
                            ...execution.loop,
                            indicator: {
                              ...execution.loop.indicator,
                              value: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Indikator stop"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-gray-500">
            Editor untuk tipe langkah ini belum tersedia
          </div>
        );
    }
  };

  return (
    <div className="w-96 border-l border-[#e5e5e5] bg-white flex flex-col h-full">
      <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Edit Langkah
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderEditorContent()}
      </div>
      <div className="px-6 py-4 border-t border-[#e5e5e5]">
        <button
          onClick={onSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}

