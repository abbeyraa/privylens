"use client";

// Komponen ini tidak lagi digunakan setelah migrasi ke drag & drop list
// Dibiarkan untuk referensi atau bisa dihapus jika tidak diperlukan
export default function AddDataSourceNode({ data, selected }) {
  return (
    <div
      className={[
        "rounded-lg border-2 border-dashed bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3 shadow-sm",
        "min-w-[200px] max-w-[250px]",
        "cursor-grab active:cursor-grabbing select-none",
        "hover:border-blue-400 hover:shadow-md transition-all",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-blue-300",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <div className="text-2xl">📊</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {data?.title || "Sumber Data"}
          </div>
          {data?.subtitle ? (
            <div className="mt-0.5 text-xs text-gray-600">{data.subtitle}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-2 text-xs text-blue-600 font-medium">
        Drag ke canvas untuk menambahkan
      </div>

      {/* Tidak ada Handle karena ini adalah node untuk drag, bukan untuk connect */}
    </div>
  );
}
