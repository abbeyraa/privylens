"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFileSelect = async (file) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload file");
      }

      if (data.success) {
        localStorage.setItem("extractedText", data.extracted_text);
        localStorage.setItem("fileId", data.file_id);
        localStorage.setItem("fileName", data.filename || file.name);
        localStorage.setItem("fileSize", formatFileSize(file.size));
        router.push("/extraction");
      } else {
        throw new Error(data.detail || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const quickLinks = [
    {
      title: "Analysis",
      description: "Gunakan hasil ekstraksi untuk insight AI.",
      action: () => router.push("/analysis"),
    },
    {
      title: "Automate Input Form",
      description: "Bangun template pengisian form otomatis.",
      action: () => router.push("/automate"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-8 shadow-md">
              <p className="mb-2 text-sm font-semibold text-[#3b82f6]">
                Offline-first document intelligence
              </p>
              <h2 className="mb-4 text-3xl font-semibold text-[#1a1a1a]">
                PrivyLens
              </h2>
              <p className="text-base text-[#4b5563]">
                Ekstraksi dokumen, analisis AI lokal, dan otomatisasi input form
                dalam satu alur terpadu. Mulai dengan unggah dokumen, lanjutkan
                ke analisis, dan gunakan data terstruktur untuk otomatisasi.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-[#f3f4f6] px-3 py-2 text-sm text-[#111827]">
                  1. Upload & extract
                </div>
                <div className="rounded-md bg-[#f3f4f6] px-3 py-2 text-sm text-[#111827]">
                  2. Analysis
                </div>
                <div className="rounded-md bg-[#f3f4f6] px-3 py-2 text-sm text-[#111827]">
                  3. Automate Input Form
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="flex h-full flex-col rounded-lg border border-[#e5e5e5] bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    {item.title}
                  </span>
                  <span className="mt-2 text-sm text-[#6b7280]">
                    {item.description}
                  </span>
                  <span className="mt-3 text-xs font-medium text-[#3b82f6]">
                    Buka →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-8 shadow-md">
              <h3 className="mb-2 text-lg font-semibold text-[#1a1a1a]">
                Upload Document
              </h3>
              <p className="mb-4 text-sm text-[#6b7280]">
                Mendukung PDF, DOCX, dan gambar. Hasil ekstraksi akan langsung
                tersedia untuk analisis AI atau otomatisasi form.
              </p>

              {uploading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-[#6b7280]">Processing...</div>
                </div>
              ) : (
                <>
                  <FileUpload onFileSelect={handleFileSelect} />
                  {error && (
                    <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
              <h4 className="mb-2 text-sm font-semibold text-[#1a1a1a]">
                Alur singkat
              </h4>
              <ul className="space-y-2 text-sm text-[#4b5563]">
                <li>• Unggah dokumen untuk mengekstrak teks dan variabel.</li>
                <li>• Gunakan halaman Analysis untuk insight otomatis.</li>
                <li>
                  • Buka Automate Input Form untuk membuat template pengisian
                  form eksternal.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
