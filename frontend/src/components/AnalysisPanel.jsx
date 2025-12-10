export default function AnalysisPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#6b7280]">No analysis available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white shadow-sm">
      <div className="border-b border-[#e5e5e5] px-6 py-4">
        <h3 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
          AI Insights
        </h3>
      </div>
      <div className="max-h-[600px] overflow-y-auto px-6 py-4">
        {analysis.tags && analysis.tags.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-[#f3f4f6] px-3 py-1 text-xs font-medium text-[#1a1a1a]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {analysis.summary && (
          <div className="mb-6">
            <h4 className="mb-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
              Summary
            </h4>
            <p className="text-sm leading-relaxed text-[#1a1a1a]">
              {analysis.summary}
            </p>
          </div>
        )}

        {analysis.keyFindings && analysis.keyFindings.length > 0 && (
          <div>
            <h4 className="mb-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
              Key Findings
            </h4>
            <ul className="space-y-2">
              {analysis.keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#3b82f6]"></span>
                  <span className="text-sm leading-relaxed text-[#1a1a1a]">
                    {finding}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.result && (
          <div className="mt-6 rounded-md bg-[#f9fafb] p-4">
            <p className="text-sm leading-relaxed text-[#1a1a1a]">
              {analysis.result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
