"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { UploadCloud, FileSpreadsheet, Trash2 } from "lucide-react";

const STORAGE_KEY = "otomate:data-source";
const DATA_API_URL = "/api/data";

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
  return Array.from({ length: maxColumns }, (_, index) =>
    toColumnLabel(index)
  );
};

const getSheetRows = (sheet, hasHeader) => {
  if (!sheet?.rows?.length) return [];
  return hasHeader ? sheet.rows.slice(1) : sheet.rows;
};

const normalizeSheets = (sheets) =>
  sheets.map((sheet) => {
    const rows = sheet.rows || [];
    const maxColumns = rows.reduce(
      (max, row) => Math.max(max, Array.isArray(row) ? row.length : 0),
      0
    );
    return {
      ...sheet,
      rows,
      maxColumns,
      columns: Array.from({ length: maxColumns }, (_, index) =>
        toColumnLabel(index)
      ),
    };
  });

const readXlsx = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    return { name, rows };
  });
  return {
    type: "xlsx",
    name: file.name,
    sheets: normalizeSheets(sheets),
    updatedAt: new Date().toISOString(),
  };
};

const readCsv = async (file, delimiter) => {
  const text = await file.text();
  const parsed = Papa.parse(text, {
    delimiter,
    skipEmptyLines: false,
  });
  if (parsed.errors?.length) {
    const firstError = parsed.errors[0];
    throw new Error(firstError.message || "Failed to parse CSV.");
  }
  const rows = parsed.data || [];
  return {
    type: "csv",
    name: file.name,
    delimiter,
    sheets: normalizeSheets([
      {
        name: file.name.replace(/\.[^/.]+$/, "") || "Sheet1",
        rows,
      },
    ]),
    updatedAt: new Date().toISOString(),
  };
};

export default function DataPage() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [activeSheet, setActiveSheet] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(false);
  const [error, setError] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const response = await fetch(DATA_API_URL, { cache: "no-store" });
        if (response.ok) {
          const payload = await response.json();
          if (payload?.data?.sheets) {
            if (!isMounted) return;
            setData(payload.data);
            setActiveSheet(payload.data.sheets[0]?.name || "");
            setHasHeader(Boolean(payload.data.hasHeader));
            return;
          }
        }
      } catch {
        // Fall back to local storage if API is unavailable.
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.sheets) {
          if (!isMounted) return;
          setData(parsed);
          setActiveSheet(parsed.sheets[0]?.name || "");
          setHasHeader(Boolean(parsed.hasHeader));
          try {
            await fetch(DATA_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: parsed }),
            });
          } catch {
            // Ignore migration failures.
          }
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveData = async (nextData) => {
    try {
      await fetch(DATA_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: nextData }),
      });
    } catch {
      // Ignore save errors to avoid blocking UI updates.
    }
  };

  const clearStoredData = async () => {
    try {
      await fetch(DATA_API_URL, { method: "DELETE" });
    } catch {
      // Ignore delete errors to avoid blocking UI updates.
    }
  };

  const handleFiles = async (incoming) => {
    const nextFile = incoming?.[0];
    if (!nextFile) return;
    setFile(nextFile);
    setError("");

    if (nextFile.name.toLowerCase().endsWith(".xlsx")) {
      setIsParsing(true);
      try {
        const parsed = await readXlsx(nextFile);
        const nextData = { ...parsed, hasHeader };
        setData(nextData);
        setActiveSheet(nextData.sheets[0]?.name || "");
        await saveData(nextData);
      } catch (err) {
        setError(err.message || "Failed to parse XLSX.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleParseCsv = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }
    if (!delimiter) {
      setError("Please provide a CSV delimiter.");
      return;
    }
    setIsParsing(true);
    setError("");
    try {
      const parsed = await readCsv(file, delimiter);
      const nextData = { ...parsed, hasHeader };
      setData(nextData);
      setActiveSheet(nextData.sheets[0]?.name || "");
      await saveData(nextData);
    } catch (err) {
      setError(err.message || "Failed to parse CSV.");
    } finally {
      setIsParsing(false);
    }
  };

  const activeData = useMemo(() => {
    if (!data?.sheets?.length) return null;
    return data.sheets.find((sheet) => sheet.name === activeSheet);
  }, [data, activeSheet]);

  const activeColumns = useMemo(
    () => getSheetColumns(activeData, hasHeader),
    [activeData, hasHeader]
  );
  const activeRows = useMemo(
    () => getSheetRows(activeData, hasHeader),
    [activeData, hasHeader]
  );

  const isCsv = file?.name?.toLowerCase().endsWith(".csv");

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Data Manager
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Import CSV / XLSX
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Data disimpan lokal dan bisa dipakai untuk input di Editor.
            </p>
          </div>
          {data && (
            <button
              type="button"
              onClick={() => {
                clearStoredData();
                setData(null);
                setFile(null);
                setActiveSheet("");
                setHasHeader(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Clear Data
            </button>
          )}
        </div>

        {data ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <section className="rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Saved data
              </h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p>
                  File: <span className="font-semibold">{data.name}</span>
                </p>
                <p>Type: {data.type?.toUpperCase()}</p>
                <p>
                  Sheets:{" "}
                  <span className="font-semibold">
                    {data.sheets?.length || 0}
                  </span>
                </p>
                <p>Has heading: {data.hasHeader ? "Yes" : "No"}</p>
                <p>
                  Updated:{" "}
                  {data.updatedAt
                    ? new Date(data.updatedAt).toLocaleString("id-ID")
                    : "-"}
                </p>
              </div>
            </section>
            <section className="rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Table settings
              </h2>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <label className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(event) => {
                      const nextValue = event.target.checked;
                      setHasHeader(nextValue);
                      const nextData = { ...data, hasHeader: nextValue };
                      setData(nextData);
                      saveData(nextData);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Has heading (use first row as table header)
                </label>
                <p className="text-xs text-gray-500">
                  Clear data to upload a different file.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <section className="rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Upload file
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Support `.xlsx` and `.csv`. Parsing dilakukan lokal.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  Local only
                </span>
              </div>

              <label
                htmlFor="data-file"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-10 text-center transition hover:border-blue-300"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFiles(event.dataTransfer.files);
                }}
              >
                <UploadCloud className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-blue-700">
                    Drop file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-blue-500">
                    CSV membutuhkan delimiter manual
                  </p>
                </div>
                <input
                  id="data-file"
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </label>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                  <span>
                    {file ? file.name : "Belum ada file dipilih"}
                  </span>
                </div>

                {isCsv && (
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-semibold text-gray-600">
                      CSV Delimiter
                    </label>
                    <input
                      type="text"
                      value={delimiter}
                      onChange={(event) => setDelimiter(event.target.value)}
                      className="w-20 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder=","
                    />
                    <button
                      type="button"
                      onClick={handleParseCsv}
                      disabled={isParsing}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                        isParsing
                          ? "bg-blue-100 text-blue-300 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isParsing ? "Parsing..." : "Parse CSV"}
                    </button>
                  </div>
                )}

                <label className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(event) =>
                      setHasHeader(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Has heading (use first row as table header)
                </label>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Saved data
              </h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p className="text-gray-400">
                  Import data untuk melihat ringkasan di sini.
                </p>
              </div>
            </section>
          </div>
        )}

        {data?.sheets?.length ? (
          <section className="rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#e5e5e5] px-6 py-3 overflow-x-auto">
              {data.sheets.map((sheet) => {
                const isActive = sheet.name === activeSheet;
                return (
                  <button
                    key={sheet.name}
                    type="button"
                    onClick={() => setActiveSheet(sheet.name)}
                    className={`rounded-t-md px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white border border-[#e5e5e5] border-b-white text-gray-900"
                        : "bg-gray-100 text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {sheet.name}
                  </button>
                );
              })}
            </div>
            <div className="max-h-[65vh] overflow-auto">
              {activeData ? (
                <table className="min-w-full border-collapse text-xs text-gray-700">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="sticky left-0 z-20 border border-[#e5e5e5] bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-500">
                        #
                      </th>
                      {activeColumns.map((col, index) => (
                        <th
                          key={`${col}-${index}`}
                          className="border border-[#e5e5e5] px-3 py-2 text-[11px] font-semibold text-gray-500"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((row, rowIndex) => {
                      const isEven = rowIndex % 2 === 0;
                      return (
                        <tr
                          key={`row-${rowIndex}`}
                          className={isEven ? "bg-white" : "bg-gray-50"}
                        >
                          <td
                            className={`sticky left-0 z-10 border border-[#e5e5e5] px-3 py-2 text-[11px] text-gray-500 ${
                              isEven ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            {rowIndex + 1}
                          </td>
                          {activeColumns.map((_, colIndex) => (
                            <td
                              key={`cell-${rowIndex}-${colIndex}`}
                              className="border border-[#e5e5e5] px-3 py-2"
                            >
                              {Array.isArray(row) ? row[colIndex] || "" : ""}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm text-gray-400">
                  Pilih sheet untuk melihat data.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
