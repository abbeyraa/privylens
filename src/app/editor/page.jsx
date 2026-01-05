"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FilePlus, PlayCircle, FileText, GripVertical } from "lucide-react";

const initialAccessSteps = [
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
];

const initialPostLoginSteps = [
  {
    title: "Validasi Hasil",
    description: "Pastikan dashboard muncul tanpa error",
    type: "Verification",
    selector: ".dashboard",
    value: "",
  },
];

export default function EditorPage() {
  const [accessSteps, setAccessSteps] = useState(() =>
    initialAccessSteps.map((step, index) => ({
      id: `access-step-${index + 1}`,
      ...step,
    }))
  );
  const [postLoginSteps, setPostLoginSteps] = useState(() =>
    initialPostLoginSteps.map((step, index) => ({
      id: `post-step-${index + 1}`,
      ...step,
    }))
  );
  const [selectedStep, setSelectedStep] = useState({
    group: "access",
    id: "access-step-1",
  });
  const [draggedStepId, setDraggedStepId] = useState(null);
  const [draggedGroup, setDraggedGroup] = useState(null);
  const [isAccessOpen, setIsAccessOpen] = useState(true);
  const [isPostLoginOpen, setIsPostLoginOpen] = useState(true);
  const [targetUrl, setTargetUrl] = useState("");
  const [loginRequired, setLoginRequired] = useState("Ya");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const selectedStepData =
    selectedStep.group === "access"
      ? accessSteps.find((step) => step.id === selectedStep.id)
      : postLoginSteps.find((step) => step.id === selectedStep.id);

  const handleAddStep = (group) => {
    const newStep = {
      id: `${group}-step-${Date.now()}`,
      title: "Step Baru",
      description: "Isi detail langkah ini",
      type: "Form Input",
      selector: "",
      value: "",
    };
    if (group === "access") {
      setAccessSteps((prev) => [...prev, newStep]);
    } else {
      setPostLoginSteps((prev) => [...prev, newStep]);
    }
    setSelectedStep({ group, id: newStep.id });
  };

  const handleStepChange = (group, id, key, value) => {
    const update = (steps) =>
      steps.map((step) => (step.id === id ? { ...step, [key]: value } : step));
    if (group === "access") {
      setAccessSteps((prev) => update(prev));
    } else {
      setPostLoginSteps((prev) => update(prev));
    }
  };

  const handleDeleteStep = (group, id) => {
    const update = (steps) => steps.filter((step) => step.id !== id);
    if (group === "access") {
      setAccessSteps((prev) => {
        const next = update(prev);
        if (selectedStep.group === group && selectedStep.id === id) {
          setSelectedStep({
            group,
            id: next[0]?.id || null,
          });
        }
        return next;
      });
    } else {
      setPostLoginSteps((prev) => {
        const next = update(prev);
        if (selectedStep.group === group && selectedStep.id === id) {
          setSelectedStep({
            group,
            id: next[0]?.id || null,
          });
        }
        return next;
      });
    }
  };

  const handleDragStart = (event, group, id) => {
    setDraggedStepId(id);
    setDraggedGroup(group);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${group}:${id}`);
  };

  const handleDrop = (event, targetGroup, targetId) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    const [dragGroup, draggedId] = payload.split(":");
    if (!draggedId || draggedId === targetId) return;
    if (dragGroup !== targetGroup) return;

    const reorder = (prev) => {
      const draggedIndex = prev.findIndex((step) => step.id === draggedId);
      const targetIndex = prev.findIndex((step) => step.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    };

    if (targetGroup === "access") {
      setAccessSteps((prev) => reorder(prev));
    } else {
      setPostLoginSteps((prev) => reorder(prev));
    }
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
                    Kelola langkah sebelum dan sesudah login
                  </p>
                </div>
              </div>
              <div className="divide-y divide-[#e5e5e5]">
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsAccessOpen((prev) => !prev)}
                    className="text-sm font-semibold text-gray-900"
                  >
                    Access
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAccessOpen((prev) => !prev)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isAccessOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isAccessOpen && (
                  <>
                    <div className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Steps hingga login
                    </div>
                    {accessSteps.map((step) => (
                      <div
                        key={step.id}
                        onClick={() =>
                          setSelectedStep({ group: "access", id: step.id })
                        }
                        onDragStart={(event) =>
                          handleDragStart(event, "access", step.id)
                        }
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDrop(event, "access", step.id)}
                        onDragEnd={() => {
                          setDraggedStepId(null);
                          setDraggedGroup(null);
                        }}
                        draggable
                        role="button"
                        tabIndex={0}
                        className={`w-full text-left px-6 py-4 transition-colors cursor-pointer ${
                          selectedStep.group === "access" &&
                          selectedStep.id === step.id
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span
                            className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                              draggedStepId === step.id &&
                              draggedGroup === "access"
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
                              handleDeleteStep("access", step.id);
                            }}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="px-6 py-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => handleAddStep("access")}
                      >
                        <FilePlus className="w-4 h-4" />
                        Tambah Step
                      </button>
                    </div>
                  </>
                )}

                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsPostLoginOpen((prev) => !prev)}
                    className="text-sm font-semibold text-gray-900"
                  >
                    Setelah Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPostLoginOpen((prev) => !prev)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isPostLoginOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isPostLoginOpen && (
                  <>
                    <div className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Apa yang dilakukan setelah login
                    </div>
                    {postLoginSteps.map((step) => (
                      <div
                        key={step.id}
                        onClick={() =>
                          setSelectedStep({ group: "post", id: step.id })
                        }
                        onDragStart={(event) =>
                          handleDragStart(event, "post", step.id)
                        }
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDrop(event, "post", step.id)}
                        onDragEnd={() => {
                          setDraggedStepId(null);
                          setDraggedGroup(null);
                        }}
                        draggable
                        role="button"
                        tabIndex={0}
                        className={`w-full text-left px-6 py-4 transition-colors cursor-pointer ${
                          selectedStep.group === "post" &&
                          selectedStep.id === step.id
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span
                            className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                              draggedStepId === step.id &&
                              draggedGroup === "post"
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
                              handleDeleteStep("post", step.id);
                            }}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="px-6 py-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => handleAddStep("post")}
                      >
                        <FilePlus className="w-4 h-4" />
                        Tambah Step
                      </button>
                    </div>
                  </>
                )}
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
                      value={selectedStepData?.title || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStep.group,
                          selectedStep.id,
                          "title",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
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
                      value={selectedStepData?.description || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStep.group,
                          selectedStep.id,
                          "description",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
                      className="w-full rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Tipe Aksi
                    </label>
                    <select
                      value={selectedStepData?.type || "Form Input"}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStep.group,
                          selectedStep.id,
                          "type",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
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
                      value={selectedStepData?.selector || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStep.group,
                          selectedStep.id,
                          "selector",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
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
                      value={selectedStepData?.value || ""}
                      onChange={(event) =>
                        handleStepChange(
                          selectedStep.group,
                          selectedStep.id,
                          "value",
                          event.target.value
                        )
                      }
                      disabled={!selectedStepData}
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
