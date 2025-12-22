"use client";

// Helper components untuk section preview
const SectionPreview = ({ title, borderColor, children }) => (
  <div className={`border-l-4 ${borderColor} pl-4`}>
    <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
    <div className="text-sm text-gray-600 space-y-1">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <p>
    <span className="font-medium">{label}:</span> {value}
  </p>
);

// Helper functions
const getDataSourceTypeLabel = (type) =>
  type === "upload" ? "Upload File" : "Input Manual";

const getDataModeLabel = (mode) =>
  mode === "single" ? "Satu Baris" : "Semua Baris";

const getStopWhenLabel = (stopWhen) =>
  stopWhen === "visible" ? "Terlihat/Ada" : "Hilang/Tidak ada";

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
          <SectionPreview title="Target" borderColor="border-blue-500">
            <InfoRow label="URL" value={plan.target.url} />
            <InfoRow label="Login" value={plan.target.login ? "Ya" : "Tidak"} />
            {plan.target.login?.url && (
              <InfoRow label="Login URL" value={plan.target.login.url} />
            )}
            {Array.isArray(plan.target.navigation) &&
              plan.target.navigation.length > 0 && (
                <InfoRow
                  label="Langkah Navigasi"
                  value={`${plan.target.navigation.length} langkah`}
                />
              )}
            <InfoRow
              label="Page Ready Indicator"
              value={`${plan.target.pageReadyIndicator.type} = ${plan.target.pageReadyIndicator.value}`}
            />
          </SectionPreview>

          {/* Data Source */}
          <SectionPreview title="Sumber Data" borderColor="border-green-500">
            <InfoRow
              label="Tipe"
              value={getDataSourceTypeLabel(plan.dataSource.type)}
            />
            <InfoRow
              label="Mode"
              value={getDataModeLabel(plan.dataSource.mode)}
            />
            <InfoRow label="Total Baris" value={effectiveRows.length} />
            {plan.dataSource.mode === "single" && (
              <InfoRow
                label="Baris Terpilih"
                value={plan.dataSource.selectedRowIndex + 1}
              />
            )}
          </SectionPreview>

          {/* Field Mappings */}
          <SectionPreview
            title={`Field Mappings (${plan.fieldMappings?.length || 0})`}
            borderColor="border-purple-500"
          >
            {plan.fieldMappings?.length > 0 ? (
              <div className="space-y-2">
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
          </SectionPreview>

          {/* Actions */}
          <SectionPreview
            title={`Alur Aksi (${plan.actions?.length || 0})`}
            borderColor="border-orange-500"
          >
            {plan.actions?.length > 0 ? (
              <div className="space-y-2">
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
          </SectionPreview>

          {/* Execution (Loop) */}
          {plan.execution?.mode === "loop" && plan.execution?.loop?.indicator && (
            <SectionPreview title="Eksekusi (Loop)" borderColor="border-slate-500">
              <InfoRow
                label="Max iterasi"
                value={plan.execution.loop.maxIterations ?? 50}
              />
              <InfoRow
                label="Delay"
                value={`${plan.execution.loop.delaySeconds ?? 0}s`}
              />
              <InfoRow
                label="Stop saat"
                value={getStopWhenLabel(plan.execution.loop.stopWhen)}
              />
              <InfoRow
                label="Indikator"
                value={`${plan.execution.loop.indicator.type} = ${plan.execution.loop.indicator.value}`}
              />
            </SectionPreview>
          )}

          {/* Indicators */}
          <SectionPreview title="Indikator Hasil" borderColor="border-red-500">
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
          </SectionPreview>

        {/* JSON Preview */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
            Tampilkan JSON Automation Plan
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg overflow-x-hidden overflow-y-auto text-xs break-words whitespace-pre-wrap">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </details>
      </div>
      </details>
    </div>
  );
}
