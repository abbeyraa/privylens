"use client";

import { useMemo, useState } from "react";
import {
  extractAllRows,
  getXlsxSheets,
  runAutomation,
  extractInputsFromHtml,
} from "@/lib/api";
import PlaywrightBrowser from "@/components/PlaywrightBrowser";

const defaultTemplate = `Instruksi pengisian form:
- Isi email dengan {{email}}
- Username gunakan {{username}}
- Amount isi angka {{amount}}

Placeholder {{nama_kolom}} akan otomatis digantikan dengan nilai dari file.`;

export default function AutomateInputFormPage() {
  const [rows, setRows] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [xlsxSheets, setXlsxSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState(defaultTemplate);
  const [mappings, setMappings] = useState([{ selector: "", variable: "" }]);
  const [automationScript, setAutomationScript] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [targetHtml, setTargetHtml] = useState("");
  const [formInputs, setFormInputs] = useState([]);
  const [fileName, setFileName] = useState("");
  const [automationMode, setAutomationMode] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [automationResult, setAutomationResult] = useState(null);
  const [inputAllRows, setInputAllRows] = useState(false);
  const [postMode, setPostMode] = useState(false);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0] || {});
  }, [rows]);

  const selectedRow = rows[selectedRowIndex] || {};

  const templatePreview = useMemo(() => {
    if (!template) return "";
    return template.replace(/{{(\w+)}}/g, (_, key) => selectedRow[key] ?? "");
  }, [template, selectedRow]);

  const handleFileSelect = async (file) => {
    setError("");
    setLoading(true);
    setFileName(file.name);
    setRows([]);
    setSelectedRowIndex(0);
    setAutomationScript("");

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx"].includes(ext)) {
      setLoading(false);
      setError("Hanya file CSV atau XLSX yang didukung pada tahap ini.");
      return;
    }

    try {
      if (ext === "xlsx") {
        const sheets = await getXlsxSheets(file);
        setXlsxSheets(sheets);
        const firstSheet = sheets[0] || "";
        console.log("First sheet:", firstSheet);
        setSelectedSheet(firstSheet);
        await loadRows(file, firstSheet);
      } else {
        setXlsxSheets([]);
        setSelectedSheet("");
        await loadRows(file, null);
      }
    } catch (err) {
      setError(err.message || "Gagal memproses file.");
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async (file, sheetName) => {
    const data = await extractAllRows(file, sheetName || null);
    setRows(data);
    setSelectedRowIndex(0);
  };

  const handleSheetChange = async (sheetName) => {
    setSelectedSheet(sheetName);
    const input = document.getElementById("automate-file-input");
    const file = input?.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await loadRows(file, sheetName);
    } catch (err) {
      setError(err.message || "Gagal memuat sheet.");
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index) => {
    setSelectedRowIndex(index);
    setAutomationScript("");
  };

  const addMapping = () => {
    setMappings([...mappings, { selector: "", variable: "" }]);
  };

  const updateMapping = (idx, field, value) => {
    const next = [...mappings];
    next[idx][field] = value;
    setMappings(next);
  };

  const removeMapping = (idx) => {
    setMappings(mappings.filter((_, index) => index !== idx));
  };

  const handleExtractInputs = async () => {
    if (!targetHtml.trim()) {
      setError("Tempelkan HTML target terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const inputs = await extractInputsFromHtml(targetHtml);
      setFormInputs(inputs);

      if (inputs.length && mappings.length === 1 && !mappings[0].selector) {
        const first = inputs[0];
        setMappings([
          { selector: first.selector, variable: mappings[0].variable || "" },
        ]);
      }
    } catch (err) {
      setError(err.message || "Gagal mengekstrak input form dari HTML.");
    } finally {
      setLoading(false);
    }
  };

  const generateScript = () => {
    if (!rows.length) {
      setError("Unggah file CSV/XLSX terlebih dahulu.");
      return;
    }

    const activeMappings = mappings.filter(
      (m) => m.selector.trim() && m.variable.trim()
    );

    if (!activeMappings.length) {
      setError("Tambahkan minimal satu pemetaan variabel → selector.");
      return;
    }

    setError("");

    const activeRows = inputAllRows ? rows : [rows[selectedRowIndex] || {}];

    const scriptLines = [
      "// Script otomatisasi pengisian form (manual console)",
      "// Options di-generate dari UI:",
      `const options = { post: ${postMode}, inputAllRows: ${inputAllRows} };`,
      targetUrl
        ? `if (!location.href.includes("${targetUrl}")) { console.warn("Buka halaman target: ${targetUrl}"); }`
        : "",
      "",
      "if (options.post) {",
      "  try {",
      "    window.alert = () => {};",
      "    window.confirm = () => true;",
      '    window.prompt = () => "";',
      '    console.info("Popup (alert/confirm/prompt) dimatikan sementara.");',
      "    const closeDialogs = () => {",
      "      document.querySelectorAll('dialog[open]').forEach((d) => {",
      "        try { d.close(); } catch (_) {}",
      "      });",
      "      document.querySelectorAll(\"[role='dialog'], [aria-modal='true'], .modal, .modal-overlay, [class*='modal']\").forEach((el) => {",
      "        const btn = el.querySelector(",
      "          \"[data-dismiss], [data-bs-dismiss], .btn-close, .close, button[aria-label='Close'], button, [role='button']\"",
      "        );",
      "        if (btn) { try { btn.click(); } catch (_) {} }",
      "        el.style.display = 'none';",
      "      });",
      "      document.querySelectorAll(\"button, [role='button']\").forEach((btn) => {",
      "        const label = (btn.textContent || btn.innerText || '').toLowerCase();",
      "        if (label.includes('tutup') || label.includes('close') || label.includes('ok')) {",
      "          try { btn.click(); } catch (_) {}",
      "        }",
      "      });",
      "    };",
      "    closeDialogs();",
      "    const dialogCloser = setInterval(closeDialogs, 1000);",
      "    window.__pl_stop_close_dialogs = () => clearInterval(dialogCloser);",
      "  } catch (e) {",
      '    console.warn("Gagal meng-override popup:", e);',
      "  }",
      "}",
      "",
      `const mappings = ${JSON.stringify(activeMappings, null, 2)};`,
      `const template = ${JSON.stringify(template)};`,
      "const delayMs = 1000;",
      "",
      "function fillFromPayload(payload) {",
      '  const resolvedTemplate = template.replace(/{{(\\w+)}}/g, (_, key) => payload[key] ?? "");',
      '  console.info("Template terisi:", resolvedTemplate);',
      "",
      "  mappings.forEach(({ selector, variable }) => {",
      "    const el = document.querySelector(selector);",
      '    if (!el) { console.warn("Elemen tidak ditemukan:", selector); return; }',
      '    const value = payload[variable] ?? "";',
      '    if ("value" in el) {',
      "      el.value = value;",
      '      el.dispatchEvent(new Event("input", { bubbles: true }));',
      '      el.dispatchEvent(new Event("change", { bubbles: true }));',
      "    } else {",
      "      el.textContent = value;",
      "    }",
      "  });",
      '  console.info("Payload yang digunakan:", payload);',
      "}",
      "",
      "function postIfNeeded() {",
      "  if (!options.post) return;",
      "  const submit =",
      "    document.querySelector(\"button[type='submit'], input[type='submit'], button:not([type])\") || null;",
      "  if (submit) {",
      '    console.info("Mengklik tombol submit:", submit);',
      "    submit.click();",
      "  } else {",
      '    console.warn("Tombol submit tidak ditemukan.");',
      "  }",
      "}",
      "",
      "const wait = (ms) => new Promise((res) => setTimeout(res, ms));",
      "",
      `const rowsData = ${JSON.stringify(activeRows, null, 2)};`,
      "(async () => {",
      "  if (options.inputAllRows) {",
      "    for (let i = 0; i < rowsData.length; i += 1) {",
      "      const payload = rowsData[i] || {};",
      "      console.group(`Row ${i + 1}`);",
      "      fillFromPayload(payload);",
      "      console.groupEnd();",
      "      postIfNeeded();",
      "      if (i < rowsData.length - 1) {",
      "        console.info(`Menunggu ${delayMs} ms sebelum row berikutnya...`);",
      "        await wait(delayMs);",
      "      }",
      "    }",
      "  } else {",
      "    const payload = rowsData[0] || {};",
      "    fillFromPayload(payload);",
      "    postIfNeeded();",
      "  }",
      "  if (window.__pl_stop_close_dialogs) { window.__pl_stop_close_dialogs(); }",
      "})();",
    ].filter(Boolean);

    setAutomationScript(scriptLines.join("\n"));
  };

  const copyScript = async () => {
    if (!automationScript) return;
    try {
      await navigator.clipboard.writeText(automationScript);
      alert("Script tersalin. Tempel di console halaman target.");
    } catch (err) {
      console.error(err);
      setError("Gagal menyalin script. Salin manual dari kotak hasil.");
    }
  };

  const handleSelectorDetected = (selector, element) => {
    const emptyMapping = mappings.find((m) => !m.selector.trim());
    if (emptyMapping) {
      const idx = mappings.indexOf(emptyMapping);
      updateMapping(idx, "selector", selector);
    } else {
      addMapping();
      setTimeout(() => {
        const newIdx = mappings.length;
        updateMapping(newIdx, "selector", selector);
      }, 0);
    }
  };

  const handleRunAutomation = async () => {
    if (!targetUrl) {
      setError("Masukkan target URL terlebih dahulu.");
      return;
    }

    const activeMappings = mappings.filter(
      (m) => m.selector.trim() && m.variable.trim()
    );

    if (!activeMappings.length) {
      setError("Tambahkan minimal satu pemetaan variabel → selector.");
      return;
    }

    if (!rows.length) {
      setError("Unggah file CSV/XLSX terlebih dahulu.");
      return;
    }

    setRunningAutomation(true);
    setError("");
    setAutomationResult(null);

    try {
      if (!inputAllRows) {
        const payload = rows[selectedRowIndex] || {};
        const result = await runAutomation(targetUrl, activeMappings, payload, {
          post: postMode,
        });
        setAutomationResult(result);
        if (!result.success) {
          setError(result.errors?.join(", ") || "Automation gagal.");
        }
      } else {
        const allErrors = [];
        let totalFilled = 0;

        for (let i = 0; i < rows.length; i += 1) {
          const payload = rows[i] || {};
          try {
            const result = await runAutomation(
              targetUrl,
              activeMappings,
              payload,
              { post: postMode }
            );
            if (result.filled_count) {
              totalFilled += result.filled_count;
            }
            if (!result.success) {
              allErrors.push(
                ...(result.errors || [`Row ${i + 1} gagal diproses`])
              );
            }
          } catch (err) {
            allErrors.push(`Row ${i + 1}: ${err.message || "Unknown error"}`);
          }
        }

        setAutomationResult({
          success: allErrors.length === 0,
          filled_count: totalFilled,
          errors: allErrors,
        });

        if (allErrors.length) {
          setError(allErrors.join(", "));
        }
      }
    } catch (err) {
      setError(err.message || "Gagal menjalankan automation.");
      setAutomationResult({ success: false, error: err.message });
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleNextRow = () => {
    if (selectedRowIndex < rows.length - 1) {
      setSelectedRowIndex(selectedRowIndex + 1);
      setAutomationResult(null);
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#3b82f6]">
            Automate Input Form
          </p>
          <h1 className="text-3xl font-semibold text-[#1a1a1a]">
            Bangun template otomatisasi dari Excel/CSV
          </h1>
          <p className="mt-2 text-sm text-[#4b5563]">
            Unggah data terstruktur, pratinjau kolom/baris, dan petakan variabel
            ke elemen form target. Template dengan placeholder {"{{var}}"}
            akan otomatis terisi.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1a1a1a]">
                    Upload Excel/CSV
                  </h2>
                  <p className="text-sm text-[#6b7280]">
                    Sistem mengekstrak kolom sebagai variabel dan setiap baris
                    sebagai satu set input lengkap.
                  </p>
                </div>
                {fileName && (
                  <span className="rounded bg-[#f3f4f6] px-3 py-1 text-xs text-[#111827]">
                    {fileName}
                  </span>
                )}
              </div>

              <input
                id="automate-file-input"
                type="file"
                accept=".csv,.xlsx"
                className="mt-4 block w-full cursor-pointer rounded border border-dashed border-[#d1d5db] p-3 text-sm"
                onChange={(e) =>
                  e.target.files[0] && handleFileSelect(e.target.files[0])
                }
              />

              {xlsxSheets.length > 0 && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Sheet
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="w-full rounded border border-[#e5e5e5] p-2 text-sm"
                  >
                    {xlsxSheets.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {rows.length > 0 && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Pilih baris untuk dipakai sebagai sample input
                  </label>
                  <select
                    value={selectedRowIndex}
                    onChange={(e) =>
                      handleRowChange(parseInt(e.target.value, 10))
                    }
                    className="w-full rounded border border-[#e5e5e5] p-2 text-sm"
                  >
                    {rows.map((_, idx) => (
                      <option key={idx} value={idx}>
                        Row {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {loading && (
                <p className="mt-3 text-sm text-[#6b7280]">Memproses file...</p>
              )}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  Pratinjau data
                </h3>
                <span className="text-xs text-[#6b7280]">
                  Menampilkan {previewRows.length} dari {rows.length || 0} baris
                </span>
              </div>

              {rows.length === 0 ? (
                <p className="mt-3 text-sm text-[#6b7280]">
                  Unggah CSV/XLSX untuk melihat pratinjau.
                </p>
              ) : (
                <div className="mt-4 overflow-auto rounded border border-[#e5e5e5]">
                  <table className="min-w-full divide-y divide-[#e5e7eb] text-sm">
                    <thead className="bg-[#f9fafb]">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-semibold text-[#374151]"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb] bg-white">
                      {previewRows.map((row, idx) => (
                        <tr key={idx}>
                          {columns.map((col) => (
                            <td
                              key={`${idx}-${col}`}
                              className="whitespace-nowrap px-3 py-2 text-[#4b5563]"
                            >
                              {row[col] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">
                Variabel yang tersedia
              </h3>
              {columns.length === 0 ? (
                <p className="mt-2 text-sm text-[#6b7280]">
                  Kolom dari file akan muncul di sini sebagai variabel.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {columns.map((col) => (
                    <span
                      key={col}
                      className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#3730a3]"
                    >
                      {`{{${col}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">
                Pemetaan variabel → elemen form
              </h3>
              <p className="mt-1 text-sm text-[#6b7280]">
                Tambahkan selector elemen (CSS) dan pilih variabel dari kolom.
              </p>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-[#374151]">
                  HTML target (paste dari website)
                </label>
                <textarea
                  value={targetHtml}
                  onChange={(e) => setTargetHtml(e.target.value)}
                  rows={4}
                  className="w-full rounded border border-[#e5e5e5] p-2 text-sm"
                  placeholder="<form>...</form>"
                />
                <p className="mt-2 text-xs text-[#6b7280]">
                  Tempelkan HTML halaman target. Data ini dapat dipakai untuk
                  mendeteksi input form via AI lokal atau mapping manual.
                </p>
                <button
                  type="button"
                  onClick={handleExtractInputs}
                  className="mt-2 inline-flex items-center rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  Deteksi input dari HTML
                </button>
                {formInputs.length > 0 && (
                  <p className="mt-1 text-xs text-[#374151]">
                    Ditemukan {formInputs.length} field input dari HTML.
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {mappings.map((mapping, idx) => (
                  <div
                    key={idx}
                    className="rounded border border-[#e5e5e5] bg-[#f9fafb] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#374151]">
                      <span>Mapping #{idx + 1}</span>
                      <button
                        onClick={() => removeMapping(idx)}
                        className="text-xs text-red-600 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#374151]">
                          CSS selector
                        </label>
                        <select
                          className="w-full rounded border border-[#e5e5e5] p-2 text-sm"
                          value={mapping.selector}
                          onChange={(e) =>
                            updateMapping(idx, "selector", e.target.value)
                          }
                        >
                          <option value="">Pilih selector dari HTML</option>
                          {formInputs.map((input) => (
                            <option key={input.selector} value={input.selector}>
                              {input.label ||
                                input.name ||
                                input.placeholder ||
                                input.selector}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#374151]">
                          Variabel
                        </label>
                        <select
                          value={mapping.variable}
                          onChange={(e) =>
                            updateMapping(idx, "variable", e.target.value)
                          }
                          className="w-full rounded border border-[#e5e5e5] p-2 text-sm"
                        >
                          <option value="">Pilih variabel</option>
                          {columns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#374151]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={postMode}
                    onChange={(e) => {
                      setPostMode(e.target.checked);
                      setInputAllRows(false);
                    }}
                    className="rounded border-[#e5e5e5]"
                  />
                  <span>Post (auto klik submit & tidak menampilkan popup)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputAllRows}
                    onChange={(e) => {
                      setInputAllRows(e.target.checked);
                      setPostMode(true);
                    }}
                    className="rounded border-[#e5e5e5]"
                  />
                  <span>
                    Input semua row (loop). Jika tidak dicentang, hanya row
                    aktif (one time) dan tidak perlu klik submit.
                  </span>
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={addMapping}
                  className="rounded-md bg-[#1f2937] px-4 py-2 text-sm font-medium text-white cursor-pointer"
                >
                  Tambah mapping
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={generateScript}
                    className="rounded-md bg-[#6b7280] px-4 py-2 text-sm font-medium text-white cursor-pointer"
                  >
                    Generate script
                  </button>
                </div>
              </div>

              {automationResult && (
                <div
                  className={`mt-4 rounded-lg border p-4 ${
                    automationResult.success
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      {automationResult.success
                        ? "Automation Berhasil"
                        : "Automation Gagal"}
                    </h4>
                    {automationResult.success &&
                      selectedRowIndex < rows.length - 1 && (
                        <button
                          onClick={handleNextRow}
                          className="text-xs font-medium text-[#10b981] cursor-pointer"
                        >
                          Next Row →
                        </button>
                      )}
                  </div>
                  {automationResult.filled_count !== undefined && (
                    <p className="mt-1 text-xs text-[#374151]">
                      {automationResult.filled_count} field berhasil diisi
                    </p>
                  )}
                  {automationResult.errors?.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      {automationResult.errors.map((err, idx) => (
                        <div key={idx}>{err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  Hasil otomatisasi
                </h3>
                {automationScript && (
                  <button
                    onClick={copyScript}
                    className="text-xs font-medium text-[#2563eb] cursor-pointer"
                  >
                    Salin script
                  </button>
                )}
              </div>
              {automationScript ? (
                <pre className="mt-3 max-h-72 overflow-auto rounded border border-[#e5e5e5] bg-[#0b1221] p-3 text-xs text-[#d1d5db]">
                  {automationScript}
                </pre>
              ) : (
                <p className="mt-2 text-sm text-[#6b7280]">
                  Script akan muncul di sini setelah template dan pemetaan
                  dibuat.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
