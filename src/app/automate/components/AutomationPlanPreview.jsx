"use client";

export default function AutomationPlanPreview({ plan, effectiveRows }) {
  if (!plan || !plan.target?.url) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Pratinjau Automation Plan
        </h2>
        <p className="text-gray-500 text-center py-4 text-sm">
          Lengkapi konfigurasi di atas untuk melihat pratinjau Automation Plan
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-3">
      <details>
        <summary className="cursor-pointer text-base font-semibold text-gray-800 mb-2 hover:text-gray-900">
          Pratinjau Automation Plan
        </summary>
        <div className="space-y-2 mt-2 max-h-[400px] overflow-y-auto">
          {/* Target */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-700 mb-2">Target</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">URL:</span> {plan.target.url}
              </p>
              <p>
                <span className="font-medium">Login:</span>{" "}
                {plan.target.login ? "Ya" : "Tidak"}
              </p>
              {plan.target.login?.url && (
                <p>
                  <span className="font-medium">Login URL:</span>{" "}
                  {plan.target.login.url}
                </p>
              )}
              {Array.isArray(plan.target.navigation) &&
                plan.target.navigation.length > 0 && (
                  <p>
                    <span className="font-medium">Langkah Navigasi:</span>{" "}
                    {plan.target.navigation.length} langkah
                  </p>
                )}
              <p>
                <span className="font-medium">Page Ready Indicator:</span>{" "}
                {plan.target.pageReadyIndicator.type} ={" "}
                {plan.target.pageReadyIndicator.value}
              </p>
            </div>
          </div>

        {/* Data Source */}
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">Sumber Data</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Tipe:</span>{" "}
              {plan.dataSource.type === "upload" ? "Upload File" : "Input Manual"}
            </p>
            <p>
              <span className="font-medium">Mode:</span>{" "}
              {plan.dataSource.mode === "single" ? "Satu Baris" : "Semua Baris"}
            </p>
            <p>
              <span className="font-medium">Total Baris:</span> {effectiveRows.length}
            </p>
            {plan.dataSource.mode === "single" && (
              <p>
                <span className="font-medium">Baris Terpilih:</span>{" "}
                {plan.dataSource.selectedRowIndex + 1}
              </p>
            )}
          </div>
        </div>

        {/* Field Mappings */}
        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">
            Field Mappings ({plan.fieldMappings?.length || 0})
          </h3>
          {plan.fieldMappings?.length > 0 ? (
            <div className="text-sm text-gray-600 space-y-2">
              {plan.fieldMappings.map((fm, idx) => (
                <div key={idx} className="bg-gray-50 p-2 rounded">
                  <p>
                    <span className="font-medium">{fm.name}</span> ({fm.type}) →{" "}
                    {fm.dataKey}
                    {fm.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-gray-500 ml-4">
                    Labels: {fm.labels?.join(", ") || "Tidak ada"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Belum ada field mapping</p>
          )}
        </div>

        {/* Actions */}
        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">
            Alur Aksi ({plan.actions?.length || 0})
          </h3>
          {plan.actions?.length > 0 ? (
            <div className="text-sm text-gray-600 space-y-2">
              {plan.actions.map((action, idx) => (
                <div key={idx} className="bg-gray-50 p-2 rounded">
                  <p>
                    <span className="font-medium">{idx + 1}.</span> {action.type} →{" "}
                    {action.target}
                    {action.value && ` = ${action.value}`}
                  </p>
                  {action.waitFor && (
                    <p className="text-xs text-gray-500 ml-4">
                      Tunggu: {action.waitFor.type} = {action.waitFor.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Belum ada aksi yang didefinisikan</p>
          )}
        </div>

        {/* Execution (Loop) */}
        {plan.execution?.mode === "loop" && plan.execution?.loop?.indicator && (
          <div className="border-l-4 border-slate-500 pl-4">
            <h3 className="font-semibold text-gray-700 mb-2">Eksekusi (Loop)</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Max iterasi:</span>{" "}
                {plan.execution.loop.maxIterations ?? 50}
              </p>
              <p>
                <span className="font-medium">Delay:</span>{" "}
                {plan.execution.loop.delaySeconds ?? 0}s
              </p>
              <p>
                <span className="font-medium">Stop saat:</span>{" "}
                {plan.execution.loop.stopWhen === "visible"
                  ? "Terlihat/Ada"
                  : "Hilang/Tidak ada"}
              </p>
              <p>
                <span className="font-medium">Indikator:</span>{" "}
                {plan.execution.loop.indicator.type} ={" "}
                {plan.execution.loop.indicator.value}
              </p>
            </div>
          </div>
        )}

        {/* Indicators */}
        <div className="border-l-4 border-red-500 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">Indikator Hasil</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium text-green-600">Keberhasilan:</span>{" "}
              {plan.successIndicator?.type && plan.successIndicator?.value
                ? `${plan.successIndicator.type} = ${plan.successIndicator.value}`
                : "Tidak didefinisikan"}
            </p>
            {plan.failureIndicator?.type && plan.failureIndicator?.value && (
              <p>
                <span className="font-medium text-red-600">Kegagalan:</span>{" "}
                {plan.failureIndicator.type} = {plan.failureIndicator.value}
              </p>
            )}
          </div>
        </div>

        {/* JSON Preview */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
            Tampilkan JSON Automation Plan
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </details>
      </div>
      </details>
    </div>
  );
}
