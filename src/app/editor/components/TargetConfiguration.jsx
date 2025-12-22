"use client";

import { useState } from "react";

export default function TargetConfiguration({
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
}) {
  const addNavigationStep = () => {
    setNavigationSteps([
      ...navigationSteps,
      {
        type: "click",
        target: "",
        waitFor: null,
      },
    ]);
  };

  const updateNavigationStep = (idx, field, value) => {
    const next = [...navigationSteps];
    next[idx] = { ...next[idx], [field]: value };
    setNavigationSteps(next);
  };

  const removeNavigationStep = (idx) => {
    setNavigationSteps(navigationSteps.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 h-full flex flex-col min-w-0">
      <h2 className="text-base font-semibold text-gray-800 mb-2">
        Konfigurasi Target
      </h2>

      <div className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-200px)] min-w-0">
        {/* Target URL */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Target URL (Halaman Form) <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="http://localhost/finance_management/transactions"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            URL halaman target dimana form akan diisi. Contoh: halaman transactions, form create, dll.
          </p>
        </div>

        {/* Requires Login */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requiresLogin}
              onChange={(e) => setRequiresLogin(e.target.checked)}
              className="mr-2"
            />
            <span className="text-xs font-medium text-gray-700">
              Memerlukan Login
            </span>
          </label>
        </div>

        {/* Login Configuration */}
        {requiresLogin && (
          <div className="space-y-2 pl-4 border-l-2 border-blue-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Login URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
                placeholder="http://localhost/login"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="username"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="password"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Navigation Steps */}
        {requiresLogin && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-700">
                Langkah Navigasi ke Halaman Target
              </label>
              <button
                onClick={addNavigationStep}
                className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
              >
                + Langkah
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Setelah login, langkah-langkah untuk sampai ke halaman target (misal: klik menu, navigasi, dll)
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {navigationSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded p-2 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      {idx + 1}.
                    </span>
                    <select
                      value={step.type}
                      onChange={(e) =>
                        updateNavigationStep(idx, "type", e.target.value)
                      }
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="click">Klik</option>
                      <option value="navigate">Navigasi URL</option>
                      <option value="wait">Tunggu</option>
                    </select>
                    <button
                      onClick={() => removeNavigationStep(idx)}
                      className="px-1.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                  {step.type !== "wait" && (
                    <input
                      type="text"
                      value={step.target || ""}
                      onChange={(e) =>
                        updateNavigationStep(idx, "target", e.target.value)
                      }
                      placeholder={
                        step.type === "click"
                          ? "Label atau selector elemen"
                          : "URL tujuan"
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  {step.type === "wait" && (
                    <input
                      type="number"
                      value={step.duration || 1}
                      onChange={(e) =>
                        updateNavigationStep(idx, "duration", Number(e.target.value))
                      }
                      placeholder="Durasi (detik)"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page Ready Indicator */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Indikator Halaman Target Siap <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-1">
            <select
              value={pageReadyType}
              onChange={(e) => setPageReadyType(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="selector">CSS Selector</option>
              <option value="text">Teks</option>
              <option value="url">URL Pattern</option>
            </select>
            <input
              type="text"
              value={pageReadyValue}
              onChange={(e) => setPageReadyValue(e.target.value)}
              placeholder={
                pageReadyType === "selector"
                  ? "contoh: .form-container, #transactions-table"
                  : pageReadyType === "text"
                  ? "contoh: Daftar Transaksi"
                  : "contoh: /transactions"
              }
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500">
            Indikator yang menunjukkan bahwa halaman target sudah siap. Setelah ini, Alur Aksi akan dieksekusi.
          </p>
        </div>
      </div>
    </div>
  );
}
