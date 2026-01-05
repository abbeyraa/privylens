"use client";

import { useState } from "react";
import { FilePlus, PlayCircle, FileText, GripVertical } from "lucide-react";

const initialSteps = [
  {
    title: "Buka Halaman Login",
    description: "Arahkan browser ke https://contoh.app/login",
    type: "Navigation",
    selector: "",
    value: "",
  },
  {
    title: "Isi Kredensial",
    description: "Masukkan email dan password pengguna",
    type: "Form Input",
    selector: "#username",
    value: "",
  },
  {
    title: "Klik Masuk",
    description: "Tekan tombol Masuk dan tunggu halaman berikutnya",
    type: "Action",
    selector: "#submit",
    value: "",
  },
  {
    title: "Validasi Hasil",
    description: "Pastikan dashboard muncul tanpa error",
    type: "Verification",
    selector: ".dashboard",
    value: "",
  },
];

export default function EditorPage() {
  const [steps, setSteps] = useState(() =>
    initialSteps.map((step, index) => ({
      id: `step-${index + 1}`,
      ...step,
    }))
  );
  const [selectedStepId, setSelectedStepId] = useState("step-1");
  const [draggedStepId, setDraggedStepId] = useState(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [loginRequired, setLoginRequired] = useState("Ya");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const selectedStep = steps.find((step) => step.id === selectedStepId);

  const handleAddStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: "Step Baru",
      description: "Isi detail langkah ini",
      type: "Form Input",
      selector: "",
      value: "",
    };
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  };

  const handleStepChange = (id, key, value) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, [key]: value } : step))
    );
  };

  const handleDeleteStep = (id) => {
    setSteps((prev) => {
      const next = prev.filter((step) => step.id !== id);
      if (selectedStepId === id) {
        setSelectedStepId(next[0]?.id || null);
      }
      return next;
    });
  };

  const handleDragStart = (event, id) => {
    setDraggedStepId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = (event, targetId) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId) return;

    setSteps((prev) => {
      const draggedIndex = prev.findIndex((step) => step.id === draggedId);
      const targetIndex = prev.findIndex((step) => step.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

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
                    Flow Steps
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Atur urutan langkah dengan nomor
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                  onClick={handleAddStep}
                >
                  <FilePlus className="w-4 h-4" />
                  Tambah
                </button>
              </div>
              <div className="divide-y divide-[#e5e5e5]">
                <div className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 bg-gray-50">
                  Permanent
                </div>
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        Target URL & Login
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Langkah tetap untuk menentukan target dan autentikasi
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                      Fixed
                    </span>
                  </div>
                </div>
                <div className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Steps
                </div>
                {steps.map((step) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepId(step.id)}
                    onDragStart={(event) => handleDragStart(event, step.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, step.id)}
                    onDragEnd={() => setDraggedStepId(null)}
                    draggable
                    role="button"
                    tabIndex={0}
                    className={`w-full text-left px-6 py-4 transition-colors cursor-pointer ${
                      selectedStepId === step.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                          draggedStepId === step.id
                            ? "border-blue-200 bg-blue-100 text-blue-700"
                            : "border-[#e5e5e5] bg-white text-gray-400"
                        }`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {step.type}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteStep(step.id);
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Target & Login
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Informasi dasar yang selalu dibutuhkan
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Target URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://contoh.app"
                      value={targetUrl}
                      onChange={(event) => setTargetUrl(event.target.value)}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Login Dibutuhkan
                    </label>
                    <select
                      value={loginRequired}
                      onChange={(event) => setLoginRequired(event.target.value)}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Ya</option>
                      <option>Tidak</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Username / Email
                      </label>
                      <input
                        type="text"
                        placeholder="user@contoh.app"
                        value={loginUsername}
                        onChange={(event) =>
                          setLoginUsername(event.target.value)
                        }
                        className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(event) =>
                          setLoginPassword(event.target.value)
                        }
                        className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Step Details
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Input atau informasi yang dibutuhkan untuk langkah terpilih
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Nama Step
                    </label>
                    <input
                      type="text"
                      placeholder="Isi Kredensial"
                      value={selectedStep?.title || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStepId,
                          "title",
                          event.target.value
                        )
                      }
                      disabled={!selectedStep}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Deskripsi
                    </label>
                    <input
                      type="text"
                      placeholder="Jelaskan kebutuhan step ini"
                      value={selectedStep?.description || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStepId,
                          "description",
                          event.target.value
                        )
                      }
                      disabled={!selectedStep}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Tipe Aksi
                    </label>
                    <select
                      value={selectedStep?.type || "Form Input"}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStepId,
                          "type",
                          event.target.value
                        )
                      }
                      disabled={!selectedStep}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Form Input</option>
                      <option>Click</option>
                      <option>Wait</option>
                      <option>Navigate</option>
                      <option>Verify</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Selector / Elemen
                    </label>
                    <input
                      type="text"
                      placeholder="#username"
                      value={selectedStep?.selector || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStepId,
                          "selector",
                          event.target.value
                        )
                      }
                      disabled={!selectedStep}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Nilai Input
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nilai untuk step ini"
                      value={selectedStep?.value || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStepId,
                          "value",
                          event.target.value
                        )
                      }
                      disabled={!selectedStep}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
