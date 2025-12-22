"use client";

import { usePathname } from "next/navigation";
import { useContext } from "react";
import { EditorContext } from "@/app/editor/context/EditorContext";
import PaletteNode from "@/app/editor/components/PaletteNode";

export default function EditorHeaderPalette() {
  const pathname = usePathname();
  // Home page (/) juga menampilkan editor, jadi cek / atau /editor
  const isEditor = pathname === "/" || pathname?.startsWith("/editor");

  // Gunakan useContext langsung dengan optional check (tidak throw error jika context tidak ada)
  // Context mungkin null jika EditorProvider belum mount
  const editorContext = useContext(EditorContext);
  const hasDataSourceNode = editorContext?.hasDataSourceNode || false;

  // Jika bukan editor page, tidak tampilkan
  if (!isEditor) {
    return null;
  }

  // Render node palette - selalu tampilkan jika di editor page
  return (
    <div className="flex flex-row items-center gap-3 flex-shrink-0">
      {/* Node palette dengan ukuran kecil dan sama */}
      <div
        className={[
          "flex items-center justify-center w-32 h-20 border border-gray-200 rounded-md shadow-sm overflow-hidden transition-opacity",
          hasDataSourceNode
            ? "bg-gray-100 opacity-50 cursor-not-allowed"
            : "bg-[#f7f7fa]",
        ].join(" ")}
      >
        <PaletteNode
          orientation="landscape"
          nodeSize="small"
          data={{
            type: "dataSource",
            title: "Sumber Data",
            subtitle: "CSV/XLSX/manual",
            icon: "📊",
          }}
          disabled={hasDataSourceNode}
        />
      </div>
      <div className="flex items-center justify-center w-32 h-20 bg-[#f7f7fa] border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <PaletteNode
          orientation="landscape"
          nodeSize="small"
          data={{
            type: "action",
            title: "Alur Aksi",
            subtitle: "fill/click/wait/navigate",
            icon: "⚡",
          }}
        />
      </div>
    </div>
  );
}
