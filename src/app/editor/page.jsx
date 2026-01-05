import {
  FilePlus,
  PlayCircle,
  FileText,
  Settings,
  Search,
  Code,
} from "lucide-react";

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

const metrics = [
  { label: "Langkah", value: "4" },
  { label: "Perkiraan Durasi", value: "2-3 menit" },
  { label: "Status", value: "Draft" },
];

export default function EditorPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#e5e5e5] rounded-lg bg-white hover:bg-gray-50 text-gray-700"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-4 bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
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

            <section className="lg:col-span-5 space-y-6">
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

              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Ringkasan Eksekusi
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Estimasi durasi dan kondisi validasi
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-lg border border-[#e5e5e5] px-4 py-3"
                    >
                      <p className="text-xs text-gray-500">{metric.label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="lg:col-span-3 space-y-6">
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Properti Step
                  </h2>
                </div>
                <div className="mt-4 space-y-4 text-sm text-gray-700">
                  <div className="rounded-lg border border-[#e5e5e5] px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Step Aktif</p>
                    <p className="font-medium text-gray-900">Isi Kredensial</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pastikan selector input sudah terverifikasi
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e5e5e5] px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Aksi Tambahan</p>
                    <p className="text-sm text-gray-700">
                      Tampilkan indikator error jika login gagal
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <FilePlus className="w-4 h-4" />
                    Tambah Kondisi
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Script Helper
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Simpan snippet kecil untuk digunakan ulang.
                </p>
                <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-gray-50 px-4 py-3 text-xs text-gray-600 font-mono">
                  click('#submit')
                  <br />
                  waitForSelector('.dashboard')
                </div>
                <button
                  type="button"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#e5e5e5] text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4" />
                  Simpan Snippet
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
