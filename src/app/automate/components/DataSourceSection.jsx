"use client";

import { useState } from "react";

export default function DataSourceSection({
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
  onFileSelect,
  onSheetChange,
  effectiveRows,
  columns,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    try {
      await onFileSelect(file);
    } catch (err) {
      setError(err.message || "Gagal memproses file");
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = async (e) => {
    const sheetName = e.target.value;
    setSelectedSheet(sheetName);
    const input = document.getElementById("data-source-file-input");
    const file = input?.files?.[0];
    if (file) {
      setLoading(true);
      try {
        await onSheetChange(sheetName, file);
      } catch (err) {
        setError(err.message || "Gagal memuat sheet");
      } finally {
        setLoading(false);
      }
    }
  };

  const addManualColumn = () => {
    const nextName = `field${manualColumns.length + 1}`;
    setManualColumns([...manualColumns, nextName]);
    setManualRows(
      manualRows.map((row) => ({
        ...row,
        [nextName]: "",
      }))
    );
  };

  const removeManualColumn = (idx) => {
    if (manualColumns.length === 1) return;
    const target = manualColumns[idx];
    const nextColumns = manualColumns.filter((_, i) => i !== idx);
    const nextRows = manualRows.map((row) => {
      const { [target]: _, ...rest } = row;
      return rest;
    });
    setManualColumns(nextColumns);
    setManualRows(nextRows);
  };

  const renameManualColumn = (idx, name) => {
    const trimmed = name.trim();
    const current = manualColumns[idx];
    if (!trimmed || (manualColumns.includes(trimmed) && trimmed !== current)) {
      return;
    }
    const nextColumns = [...manualColumns];
    nextColumns[idx] = trimmed;
    const nextRows = manualRows.map((row) => {
      const { [current]: value, ...rest } = row;
      return { ...rest, [trimmed]: value ?? "" };
    });
    setManualColumns(nextColumns);
    setManualRows(nextRows);
  };

  const addManualRow = () => {
    const baseRow = manualColumns.reduce(
      (acc, col) => ({ ...acc, [col]: "" }),
      {}
    );
    setManualRows([...manualRows, baseRow]);
  };

  const removeManualRow = (rowIdx) => {
    if (manualRows.length === 1) return;
    setManualRows(manualRows.filter((_, idx) => idx !== rowIdx));
  };

  const handleManualCellChange = (rowIdx, col, value) => {
    const next = manualRows.map((row, idx) =>
      idx === rowIdx ? { ...row, [col]: value } : row
    );
    setManualRows(next);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Sumber Data
      </h2>

      <div className="space-y-4">
        {/* Data Source Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipe Sumber Data
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="upload"
                checked={dataSourceType === "upload"}
                onChange={(e) => setDataSourceType(e.target.value)}
                className="mr-2"
              />
              Upload CSV/XLSX
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="manual"
                checked={dataSourceType === "manual"}
                onChange={(e) => setDataSourceType(e.target.value)}
                className="mr-2"
              />
              Input Manual
            </label>
          </div>
        </div>

        {/* File Upload */}
        {dataSourceType === "upload" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <input
              id="data-source-file-input"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {loading && <p className="mt-1 text-sm text-blue-600">Memproses file...</p>}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

            {/* Sheet Selection (XLSX) */}
            {xlsxSheets.length > 0 && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Sheet
                </label>
                <select
                  value={selectedSheet}
                  onChange={handleSheetChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {xlsxSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Manual Input */}
        {dataSourceType === "manual" && (
          <div className="space-y-4">
            {/* Columns */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Kolom
                </label>
                <button
                  onClick={addManualColumn}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Kolom
                </button>
              </div>
              <div className="space-y-2">
                {manualColumns.map((col, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => renameManualColumn(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {manualColumns.length > 1 && (
                      <button
                        onClick={() => removeManualColumn(idx)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Baris Data
                </label>
                <button
                  onClick={addManualRow}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Baris
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      {manualColumns.map((col) => (
                        <th
                          key={col}
                          className="border border-gray-300 px-3 py-2 bg-gray-50 text-left text-sm font-medium"
                        >
                          {col}
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-left text-sm font-medium">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {manualColumns.map((col) => (
                          <td key={col} className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={row[col] || ""}
                              onChange={(e) =>
                                handleManualCellChange(rowIdx, col, e.target.value)
                              }
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        ))}
                        <td className="border border-gray-300 px-3 py-2">
                          {manualRows.length > 1 && (
                            <button
                              onClick={() => removeManualRow(rowIdx)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Data Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode Eksekusi
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="single"
                checked={dataMode === "single"}
                onChange={(e) => setDataMode(e.target.value)}
                className="mr-2"
              />
              Satu Baris (Single)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="batch"
                checked={dataMode === "batch"}
                onChange={(e) => setDataMode(e.target.value)}
                className="mr-2"
              />
              Semua Baris (Batch)
            </label>
          </div>
        </div>

        {/* Row Selection (Single Mode) */}
        {dataMode === "single" && effectiveRows.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Baris
            </label>
            <select
              value={selectedRowIndex}
              onChange={(e) => setSelectedRowIndex(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {effectiveRows.map((_, idx) => (
                <option key={idx} value={idx}>
                  Baris {idx + 1}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Data Preview */}
        {effectiveRows.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pratinjau Data ({effectiveRows.length} baris)
            </label>
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-3 py-2 text-left border-b">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {effectiveRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-2">
                          {String(row[col] || "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {effectiveRows.length > 5 && (
                <p className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                  ... dan {effectiveRows.length - 5} baris lainnya
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
