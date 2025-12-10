export default function TextPanel({ title, text, className = "" }) {
  return (
    <div
      className={`rounded-lg border border-[#e5e5e5] bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-[#e5e5e5] px-6 py-4">
        <h3 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="max-h-[600px] overflow-y-auto px-6 py-4">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[#1a1a1a]">
          {text || "No content available"}
        </pre>
      </div>
    </div>
  );
}
