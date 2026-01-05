"use client";

// Komponen ini tidak lagi digunakan setelah migrasi ke drag & drop list
// Dibiarkan untuk referensi atau bisa dihapus jika tidak diperlukan
export default function CardNode({ data, selected }) {
  return (
    <div
      className={[
        "rounded-lg border bg-white px-3 py-2 shadow-sm",
        "min-w-[190px] max-w-[240px]",
        "cursor-pointer select-none",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200",
      ].join(" ")}
    >
      <div className="text-sm font-semibold text-gray-900">{data?.title}</div>
      {data?.subtitle ? (
        <div className="mt-0.5 text-xs text-gray-500">{data.subtitle}</div>
      ) : null}
    </div>
  );
}
