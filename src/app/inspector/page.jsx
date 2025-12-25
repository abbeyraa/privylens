"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, RefreshCw, Download, Upload, Eye, EyeOff, CheckCircle, XCircle, Clock, Navigation, MousePointer, Type, AlertCircle, Save } from "lucide-react";
import Link from "next/link";
import { convertEventsToActionFlow } from "@/lib/inspectorRecorder";
import { useRouter } from "next/navigation";

// Event types
const EVENT_TYPES = {
  NAVIGATION: "navigation",
  LOADING: "loading",
  NETWORK_IDLE: "network_idle",
  ELEMENT_APPEAR: "element_appear",
  ELEMENT_DISAPPEAR: "element_disappear",
  CLICK: "click",
  INPUT: "input",
  SUBMIT: "submit",
  MODAL_OPEN: "modal_open",
  MODAL_CLOSE: "modal_close",
  TOAST: "toast",
  SPINNER: "spinner",
};

export default function InspectorPage() {
  const [targetUrl, setTargetUrl] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [showOnlyImportant, setShowOnlyImportant] = useState(false);
  const [browserUrl, setBrowserUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const eventIdCounter = useRef(0);
  const startTime = useRef(null);
  const router = useRouter();

  // Start inspection
  const handleStartInspection = async () => {
    if (!targetUrl.trim()) {
      alert("Masukkan URL target terlebih dahulu");
      return;
    }

    setIsInspecting(true);
    setEvents([]);
    setSelectedEvents(new Set());
    setBrowserUrl(targetUrl);
    startTime.current = Date.now();
    eventIdCounter.current = 0;

    // Simulate browser events (in real implementation, this would connect to Playwright)
    // For now, we'll simulate events
    simulateBrowserEvents();
  };

  // Stop inspection
  const handleStopInspection = () => {
    setIsInspecting(false);
  };

  // Reset inspection
  const handleReset = () => {
    setIsInspecting(false);
    setEvents([]);
    setSelectedEvents(new Set());
    setBrowserUrl("");
    startTime.current = null;
  };

  // Simulate browser events (placeholder - akan diganti dengan real Playwright integration)
  const simulateBrowserEvents = () => {
    const baseTime = Date.now();
    
    // Navigation event
    setTimeout(() => {
      addEvent({
        type: EVENT_TYPES.NAVIGATION,
        label: "Navigasi ke halaman",
        description: `Mengakses ${targetUrl}`,
        url: targetUrl,
        timestamp: Date.now() - baseTime,
      });
    }, 100);

    // Loading event
    setTimeout(() => {
      addEvent({
        type: EVENT_TYPES.LOADING,
        label: "Halaman sedang loading",
        description: "Menunggu halaman selesai dimuat",
        timestamp: Date.now() - baseTime,
      });
    }, 500);

    // Network idle
    setTimeout(() => {
      addEvent({
        type: EVENT_TYPES.NETWORK_IDLE,
        label: "Network idle",
        description: "Tidak ada request network aktif",
        timestamp: Date.now() - baseTime,
        important: true,
      });
    }, 1500);

    // Element appear
    setTimeout(() => {
      addEvent({
        type: EVENT_TYPES.ELEMENT_APPEAR,
        label: "Elemen muncul",
        description: "Form atau konten utama sudah terlihat",
        selector: "form, .main-content, [role='main']",
        timestamp: Date.now() - baseTime,
        important: true,
      });
    }, 2000);
  };

  // Add event to timeline
  const addEvent = (eventData) => {
    const event = {
      id: `event-${eventIdCounter.current++}`,
      ...eventData,
      timestamp: eventData.timestamp || (Date.now() - (startTime.current || Date.now())),
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, event]);
  };

  // Toggle event selection
  const toggleEventSelection = (eventId) => {
    setSelectedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Mark event as important
  const toggleEventImportant = (eventId) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, important: !e.important } : e
      )
    );
  };

  // Generate action flow from selected events
  const generateActionFlow = () => {
    const selected = events.filter((e) => selectedEvents.has(e.id));
    if (selected.length === 0) {
      alert("Pilih minimal satu event untuk dijadikan action flow");
      return;
    }

    const draft = convertEventsToActionFlow(events, {
      selectedIds: Array.from(selectedEvents),
    });

    // Save to localStorage for import to editor
    localStorage.setItem("inspector_draft_actions", JSON.stringify(draft));

    // Show options
    const action = confirm(
      `Action Flow draft telah dibuat (${draft.actions.length} actions).\n\nKlik OK untuk membuka di Editor, atau Cancel untuk copy ke clipboard.`
    );

    if (action) {
      // Navigate to editor with draft flag
      router.push("/editor?importDraft=true");
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
      alert("Draft telah disalin ke clipboard!");
    }
  };

  // Save draft to localStorage
  const saveDraft = () => {
    const draft = {
      name: `Inspector Draft - ${new Date().toLocaleString("id-ID")}`,
      description: `Dibuat dari ${events.length} events`,
      events,
      selectedEvents: Array.from(selectedEvents),
      targetUrl,
      createdAt: new Date().toISOString(),
    };

    const drafts = JSON.parse(localStorage.getItem("inspector_drafts") || "[]");
    drafts.push(draft);
    localStorage.setItem("inspector_drafts", JSON.stringify(drafts));
    alert("Draft telah disimpan!");
  };

  // Load draft
  const loadDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("inspector_drafts") || "[]");
    if (drafts.length === 0) {
      alert("Belum ada draft yang disimpan");
      return;
    }

    const draftNames = drafts.map((d, i) => `${i + 1}. ${d.name}`).join("\n");
    const index = prompt(
      `Pilih draft untuk dimuat:\n\n${draftNames}\n\nMasukkan nomor:`
    );

    if (index) {
      const selectedDraft = drafts[parseInt(index) - 1];
      if (selectedDraft) {
        setEvents(selectedDraft.events || []);
        setSelectedEvents(new Set(selectedDraft.selectedEvents || []));
        setTargetUrl(selectedDraft.targetUrl || "");
        alert("Draft telah dimuat!");
      }
    }
  };

  // Filtered events
  const filteredEvents = showOnlyImportant
    ? events.filter((e) => e.important)
    : events;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Interactive Automation Inspector
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Amati dan pahami proses interaksi halaman web sebelum menyusun Automation Plan
            </p>
          </div>
          <Link
            href="/templates"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Kembali ke Editor
          </Link>
        </div>

        {/* URL Input */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Masukkan URL target (contoh: https://example.com)"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={isInspecting}
            className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          {!isInspecting ? (
            <button
              onClick={handleStartInspection}
              disabled={!targetUrl.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Mulai Inspection
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStopInspection}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Browser Preview (Left) */}
        <div className="w-1/2 border-r border-[#e5e5e5] flex flex-col bg-gray-50">
          <div className="px-4 py-3 bg-white border-b border-[#e5e5e5] flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 mx-4">
              <input
                type="text"
                value={browserUrl}
                readOnly
                className="w-full px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm"
              />
            </div>
            {isInspecting && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Recording</span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-white p-4">
            {browserUrl ? (
              <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Browser Preview</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {isInspecting
                      ? "Mengamati interaksi dan perubahan halaman..."
                      : "Browser akan muncul di sini saat inspection dimulai"}
                  </p>
                  {browserUrl && (
                    <p className="text-xs text-gray-400 mt-4 font-mono break-all px-4">
                      {browserUrl}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <EyeOff className="w-16 h-16 mx-auto mb-4" />
                  <p>Masukkan URL dan klik "Mulai Inspection"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline (Right) */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Process Timeline</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyImportant}
                  onChange={(e) => setShowOnlyImportant(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Hanya penting</span>
              </label>
              <div className="flex items-center gap-2">
                {events.length > 0 && (
                  <button
                    onClick={saveDraft}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                    title="Simpan draft"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={loadDraft}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                  title="Muat draft"
                >
                  <Upload className="w-4 h-4" />
                </button>
                {selectedEvents.size > 0 && (
                  <button
                    onClick={generateActionFlow}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Generate Action Flow ({selectedEvents.size})
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredEvents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4" />
                  <p>
                    {isInspecting
                      ? "Menunggu events..."
                      : "Belum ada events. Mulai inspection untuk mulai merekam."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isSelected={selectedEvents.has(event.id)}
                    onSelect={() => toggleEventSelection(event.id)}
                    onToggleImportant={() => toggleEventImportant(event.id)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, isSelected, onSelect, onToggleImportant, index }) {
  const getEventIcon = (type) => {
    switch (type) {
      case EVENT_TYPES.NAVIGATION:
        return <Navigation className="w-5 h-5" />;
      case EVENT_TYPES.CLICK:
        return <MousePointer className="w-5 h-5" />;
      case EVENT_TYPES.INPUT:
        return <Type className="w-5 h-5" />;
      case EVENT_TYPES.LOADING:
      case EVENT_TYPES.NETWORK_IDLE:
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case EVENT_TYPES.NAVIGATION:
        return "bg-blue-100 text-blue-700 border-blue-300";
      case EVENT_TYPES.CLICK:
        return "bg-purple-100 text-purple-700 border-purple-300";
      case EVENT_TYPES.INPUT:
        return "bg-green-100 text-green-700 border-green-300";
      case EVENT_TYPES.LOADING:
      case EVENT_TYPES.NETWORK_IDLE:
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const formatTime = (ms) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div
      className={`
        border-2 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"}
        ${event.important ? "ring-2 ring-yellow-400" : ""}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Timeline Line */}
        <div className="flex flex-col items-center">
          <div
            className={`p-2 rounded-lg ${getEventColor(event.type)} border-2`}
          >
            {getEventIcon(event.type)}
          </div>
          {index < 10 && (
            <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
          )}
        </div>

        {/* Event Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{event.label}</h3>
              {event.important && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  Penting
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">
                +{formatTime(event.timestamp)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleImportant();
                }}
                className={`p-1 rounded ${
                  event.important
                    ? "text-yellow-600 hover:bg-yellow-100"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                {event.important ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          {event.selector && (
            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
              {event.selector}
            </div>
          )}
          {event.url && (
            <div className="text-xs text-gray-500 mt-1 break-all">
              {event.url}
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

