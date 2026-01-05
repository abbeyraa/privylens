import { FilePlus, PlayCircle, FileText, Search } from "lucide-react";

const steps = [
  {
    title: "Buka Halaman Login",
    description: "Arahkan browser ke https://contoh.app/login",
    type: "Navigation",
  },
  {
    title: "Isi Kredensial",
    description: "Masukkan email dan password pengguna",
    type: "Form Input",
  },
  {
    title: "Klik Masuk",
    description: "Tekan tombol Masuk dan tunggu halaman berikutnya",
    type: "Action",
  },
  {
    title: "Validasi Hasil",
    description: "Pastikan dashboard muncul tanpa error",
    type: "Verification",
  },
];

export default function EditorPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              Simpan Draft
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlayCircle className="w-4 h-4" />
              Jalankan
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Langkah Automation
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Atur urutan dan prioritas aksi
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <FilePlus className="w-4 h-4" />
                  Tambah
                </button>
              </div>
              <div className="divide-y divide-[#e5e5e5]">
                {steps.map((step, index) => (
                  <div key={step.title} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {index + 1}. {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {step.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Peta Alur
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Visualisasi ringkas dari automation plan
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-[#e5e5e5] text-gray-600 hover:bg-gray-50"
                  >
                    <Search className="w-4 h-4" />
                    Preview
                  </button>
                </div>
                <div className="mt-6 space-y-3">
                  {steps.map((step, index) => (
                    <div
                      key={`${step.title}-flow`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 border border-dashed border-[#d6d6d6] rounded-lg px-4 py-2 text-sm text-gray-700">
                        {step.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
