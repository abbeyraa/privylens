"use client";

import { useState } from "react";
import {
  Play,
  Code,
  FileText,
  Download,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function SandboxPage() {
  const [url, setUrl] = useState("");
  const [script, setScript] = useState(`// Sandbox Playwright Script
// Gunakan syntax Playwright modern untuk testing dan development

// Contoh script:
const actions = [
  {
    type: 'click',
    selector: 'button.submit',
    options: { timeout: 5000 }
  },
  {
    type: 'fill',
    selector: 'input[name="email"]',
    value: 'test@example.com'
  },
  {
    type: 'getText',
    selector: 'h1.title'
  }
];`);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    if (!url.trim()) {
      setError("URL harus diisi");
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      // Parse script untuk mendapatkan actions
      let actions = [];
      try {
        // Extract actions dari script (simple parsing)
        const actionsMatch = script.match(/const\s+actions\s*=\s*(\[[\s\S]*?\]);/);
        if (actionsMatch) {
          actions = eval(`(${actionsMatch[1]})`);
        } else {
          // Try to evaluate entire script
          const scriptResult = eval(script);
          if (Array.isArray(scriptResult)) {
            actions = scriptResult;
          }
        }
      } catch (parseError) {
        throw new Error(`Error parsing script: ${parseError.message}`);
      }

      // Call API to execute sandbox
      const response = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          headless: false,
          actions,
          timeout: 30000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute sandbox");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setScript(`// Sandbox Playwright Script
// Gunakan syntax Playwright modern untuk testing dan development

const actions = [];`);
    setUrl("");
    setResult(null);
    setError(null);
  };

  const handleSave = () => {
    const scriptData = {
      url,
      script,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(scriptData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sandbox-script-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (data.url) setUrl(data.url);
            if (data.script) setScript(data.script);
          } catch (err) {
            alert("Error loading file: " + err.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sandbox</h1>
            <p className="text-sm text-gray-600 mt-1">
              Testing dan development environment untuk Playwright dengan syntax modern
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoad}
              className="px-4 py-2 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Load
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || !url.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Script
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Script Editor */}
        <div className="flex-1 flex flex-col border-r border-[#e5e5e5]">
          <div className="px-6 py-4 border-b border-[#e5e5e5] bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-[#e5e5e5] bg-gray-50">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-600" />
                <h2 className="text-sm font-semibold text-gray-900">Script Editor</h2>
              </div>
            </div>
            <div className="flex-1 p-6">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-full font-mono text-sm border border-[#e5e5e5] rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="// Tulis script Playwright Anda di sini..."
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="w-96 flex flex-col bg-white">
          <div className="px-6 py-4 border-b border-[#e5e5e5] bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Execution Results</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isRunning ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-sm text-gray-600">Menjalankan script...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
                    <p className="text-sm text-red-700 font-mono">{error}</p>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Success Indicator */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-green-900 mb-1">
                        Execution Successful
                      </h3>
                      <p className="text-xs text-green-700">
                        {new Date(result.timestamp).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results */}
                {result.results && result.results.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Action Results ({result.results.length})
                    </h3>
                    <div className="space-y-2">
                      {result.results.map((actionResult, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 ${
                            actionResult.success
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {actionResult.success ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900 mb-1">
                                {actionResult.action}
                              </div>
                              {actionResult.selector && (
                                <div className="text-xs text-gray-600 font-mono mb-1">
                                  {actionResult.selector}
                                </div>
                              )}
                              {actionResult.value !== undefined && (
                                <div className="text-xs text-gray-700 bg-white p-2 rounded mt-1 font-mono">
                                  {typeof actionResult.value === "object"
                                    ? JSON.stringify(actionResult.value, null, 2)
                                    : String(actionResult.value)}
                                </div>
                              )}
                              {actionResult.error && (
                                <div className="text-xs text-red-700 mt-1">
                                  {actionResult.error}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screenshot */}
                {result.screenshot && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Screenshot</h3>
                    <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                      <img
                        src={`data:image/png;base64,${result.screenshot}`}
                        alt="Screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                    <a
                      href={`data:image/png;base64,${result.screenshot}`}
                      download={`sandbox-screenshot-${Date.now()}.png`}
                      className="mt-2 inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-3 h-3" />
                      Download Screenshot
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Code className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-sm text-gray-600 mb-1">Belum ada hasil eksekusi</p>
                <p className="text-xs text-gray-500">
                  Jalankan script untuk melihat hasilnya di sini
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

