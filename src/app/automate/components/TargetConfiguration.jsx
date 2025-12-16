"use client";

export default function TargetConfiguration({
  targetUrl,
  setTargetUrl,
  sessionMethod,
  setSessionMethod,
  sessionId,
  setSessionId,
  pageReadyType,
  setPageReadyType,
  pageReadyValue,
  setPageReadyValue,
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Konfigurasi Target
      </h2>

      <div className="space-y-4">
        {/* Target URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com/form"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Session Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metode Sesi
          </label>
          <select
            value={sessionMethod}
            onChange={(e) => setSessionMethod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="new">Sesi Baru</option>
            <option value="reuse">Gunakan Sesi Login yang Ada</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {sessionMethod === "reuse"
              ? "Gunakan sesi browser yang sudah login untuk menghindari proses autentikasi ulang"
              : "Buat sesi browser baru untuk automasi ini"}
          </p>
        </div>

        {/* Session ID (if reuse) */}
        {sessionMethod === "reuse" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session ID (Opsional)
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="ID sesi yang akan digunakan kembali"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Kosongkan untuk menggunakan sesi aktif terakhir
            </p>
          </div>
        )}

        {/* Page Ready Indicator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Indikator Halaman Siap <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-2">
            <select
              value={pageReadyType}
              onChange={(e) => setPageReadyType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  ? "contoh: .form-container"
                  : pageReadyType === "text"
                  ? "contoh: Form Pengisian Data"
                  : "contoh: /form/create"
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-gray-500">
            Indikator yang menunjukkan bahwa halaman target sudah siap untuk diinteraksikan.
            Playwright akan menunggu hingga indikator ini muncul sebelum melanjutkan automasi.
          </p>
        </div>
      </div>
    </div>
  );
}
