"use client";

import { useState, useEffect } from "react";
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Square,
  RotateCw,
  Eye,
  Calendar,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import { getExecutionLogs } from "@/lib/sessionStorage";
import { useRouter } from "next/navigation";

export default function ExecutionsPage() {
  const router = useRouter();
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [runningExecutions, setRunningExecutions] = useState(new Set());

  useEffect(() => {
    loadExecutions();
    // Poll for running executions every 2 seconds
    const interval = setInterval(() => {
      checkRunningExecutions();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadExecutions = () => {
    const logs = getExecutionLogs();
    // Transform logs to executions format
    const transformed = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      status: getExecutionStatus(log),
      templateName: log.plan?.templateName || "Manual Execution",
      templateVersion: log.plan?.templateVersion || "N/A",
      targetUrl: log.plan?.target?.url || "N/A",
      startTime: log.timestamp,
      endTime: log.report?.endTime || null,
      duration: log.report?.duration || null,
      summary: log.report?.summary || null,
      report: log.report,
      plan: log.plan,
      isRunning: false,
    }));
    setExecutions(transformed);
  };

  const getExecutionStatus = (log) => {
    if (log.report?.status === "running") return "running";
    if (log.report?.status === "error") return "failed";
    if (log.report?.status === "failed") return "failed";
    if (log.report?.status === "partial") return "partial";
    if (log.report?.status === "success") return "completed";
    return "unknown";
  };

  const checkRunningExecutions = () => {
    // Check if there are any executions marked as running
    // This would typically come from a real-time system or state management
    // For now, we'll check localStorage for running flags
    const runningIds = new Set();
    // In a real implementation, this would check actual running processes
    setRunningExecutions(runningIds);
  };

  const filteredExecutions = executions.filter((exec) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !exec.templateName.toLowerCase().includes(query) &&
        !exec.targetUrl.toLowerCase().includes(query) &&
        !exec.id.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (statusFilter !== "all" && exec.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
        return <PlayCircle className="w-5 h-5 text-blue-600 animate-pulse" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "partial":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "cancelled":
        return <Square className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "failed":
        return "bg-red-100 text-red-800 border-red-300";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "running":
        return "Berjalan";
      case "completed":
        return "Selesai";
      case "failed":
        return "Gagal";
      case "partial":
        return "Sebagian";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Tidak Diketahui";
    }
  };

  const handleStopExecution = (executionId) => {
    if (confirm("Apakah Anda yakin ingin menghentikan eksekusi ini?")) {
      // In a real implementation, this would call an API to stop the execution
      setRunningExecutions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(executionId);
        return newSet;
      });
      setExecutions((prev) =>
        prev.map((exec) =>
          exec.id === executionId
            ? { ...exec, status: "cancelled", isRunning: false }
            : exec
        )
      );
      alert("Eksekusi telah dihentikan");
    }
  };

  const handleRetryExecution = (execution) => {
    if (confirm("Jalankan ulang eksekusi ini dengan template dan versi yang sama?")) {
      // Navigate to editor with the plan loaded
      // In a real implementation, this would load the template and version
      router.push(`/editor?retry=${execution.id}`);
    }
  };

  const handleViewDetails = (execution) => {
    setSelectedExecution(execution);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executions</h1>
            <p className="text-sm text-gray-600 mt-1">
              Pantau dan kelola semua proses automasi yang dijalankan
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan template, URL, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="running">Berjalan</option>
              <option value="completed">Selesai</option>
              <option value="failed">Gagal</option>
              <option value="partial">Sebagian</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Executions List */}
        <div className="flex-1 overflow-y-auto p-8">
          {filteredExecutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <PlayCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "Tidak ada eksekusi ditemukan"
                  : "Belum ada eksekusi"}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Coba ubah filter atau kata kunci pencarian"
                  : "Jalankan automation plan untuk membuat eksekusi pertama"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className={`bg-white border-2 rounded-lg p-6 hover:shadow-md transition-all ${
                    selectedExecution?.id === execution.id
                      ? "border-blue-500 shadow-md"
                      : "border-[#e5e5e5]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-3 mb-4">
                        {getStatusIcon(execution.status)}
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
                            execution.status
                          )}`}
                        >
                          {getStatusLabel(execution.status)}
                        </span>
                        {execution.report?.safeRun && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            SAFE RUN
                          </span>
                        )}
                      </div>

                      {/* Template Info */}
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {execution.templateName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>Versi: {execution.templateVersion}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(execution.startTime)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Target URL */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Target:</span>{" "}
                          <span className="text-gray-900">{execution.targetUrl}</span>
                        </p>
                      </div>

                      {/* Summary Stats */}
                      {execution.summary && (
                        <div className="flex items-center gap-6 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Total:</span>{" "}
                            <span className="font-semibold text-gray-900">
                              {execution.summary.total || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-green-600">Berhasil:</span>{" "}
                            <span className="font-semibold text-green-600">
                              {execution.summary.success || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-red-600">Gagal:</span>{" "}
                            <span className="font-semibold text-red-600">
                              {execution.summary.failed || 0}
                            </span>
                          </div>
                          {execution.summary.partial > 0 && (
                            <div>
                              <span className="text-yellow-600">Sebagian:</span>{" "}
                              <span className="font-semibold text-yellow-600">
                                {execution.summary.partial || 0}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(execution.duration)}</span>
                          </div>
                        </div>
                      )}

                      {/* Execution ID */}
                      <div className="text-xs text-gray-500 font-mono mt-2">
                        ID: {execution.id}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      {execution.status === "running" && (
                        <button
                          onClick={() => handleStopExecution(execution.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hentikan Eksekusi"
                        >
                          <Square className="w-5 h-5" />
                        </button>
                      )}
                      {execution.status !== "running" && (
                        <button
                          onClick={() => handleRetryExecution(execution)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Jalankan Ulang"
                        >
                          <RotateCw className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(execution)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution Detail Sidebar */}
        {selectedExecution && (
          <div className="w-96 border-l border-[#e5e5e5] bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Detail Eksekusi</h2>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Status */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(selectedExecution.status)}
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
                        selectedExecution.status
                      )}`}
                    >
                      {getStatusLabel(selectedExecution.status)}
                    </span>
                  </div>
                </div>

                {/* Template Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Template</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nama:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {selectedExecution.templateName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Versi:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {selectedExecution.templateVersion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timing */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Waktu</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Mulai:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {formatDate(selectedExecution.startTime)}
                      </span>
                    </div>
                    {selectedExecution.endTime && (
                      <div>
                        <span className="text-gray-600">Selesai:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {formatDate(selectedExecution.endTime)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Durasi:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {formatDuration(selectedExecution.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Target</h3>
                  <div className="text-sm text-gray-600 break-all">
                    {selectedExecution.targetUrl}
                  </div>
                </div>

                {/* Summary */}
                {selectedExecution.summary && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-600 mb-1">Total</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedExecution.summary.total || 0}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 mb-1">Berhasil</div>
                        <div className="text-2xl font-bold text-green-600">
                          {selectedExecution.summary.success || 0}
                        </div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-red-600 mb-1">Gagal</div>
                        <div className="text-2xl font-bold text-red-600">
                          {selectedExecution.summary.failed || 0}
                        </div>
                      </div>
                      {selectedExecution.summary.partial > 0 && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-yellow-600 mb-1">Sebagian</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {selectedExecution.summary.partial || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t">
                  <div className="flex flex-col gap-2">
                    {selectedExecution.status === "running" ? (
                      <button
                        onClick={() => {
                          handleStopExecution(selectedExecution.id);
                          setSelectedExecution(null);
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Square className="w-4 h-4" />
                        Hentikan Eksekusi
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleRetryExecution(selectedExecution);
                          setSelectedExecution(null);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <RotateCw className="w-4 h-4" />
                        Jalankan Ulang
                      </button>
                    )}
                  </div>
                </div>

                {/* Execution ID */}
                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    <div className="font-semibold mb-1">Execution ID:</div>
                    <div className="font-mono break-all">{selectedExecution.id}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

