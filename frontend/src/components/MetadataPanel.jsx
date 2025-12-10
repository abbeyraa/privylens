export default function MetadataPanel({ metadata }) {
  const items = [
    { label: "File Name", value: metadata?.fileName || "-" },
    { label: "File Size", value: metadata?.fileSize || "-" },
    { label: "Page Count", value: metadata?.pageCount || "-" },
    { label: "OCR Status", value: metadata?.ocrStatus || "-" },
  ];

  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
        Metadata
      </h3>
      <dl className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm text-[#1a1a1a]">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
