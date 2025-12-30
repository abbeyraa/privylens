"use client";

import { useState, useEffect } from "react";
import {
  Home as HomeIcon,
  FileText,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search as SearchIcon,
  ArrowRight,
  FilePlus,
} from "lucide-react";
import Link from "next/link";
import { getExecutionLogs } from "@/lib/sessionStorage";
import { getTemplates, migrateToFileStorage } from "@/lib/templateStorage";

export default function HomePage() {
  const [executions, setExecutions] = useState([]);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalExecutions: 0,
    successRate: 0,
    recentFailures: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Migrate templates first (only runs once)
    await migrateToFileStorage();
    
    // Load templates
    const templates = await getTemplates();
    
    // Count active templates (isActive: true)
    const activeTemplates = templates.filter((t) => t.isActive !== false);
    const totalTemplates = activeTemplates.length;

    // Load execution logs
    const logs = getExecutionLogs();
    setExecutions(logs);

    // Calculate stats
    const totalExecutions = logs.length;
    const successful = logs.filter(
      (log) => log.report?.status === "success"
    ).length;
    const failed = logs.filter(
      (log) =>
        log.report?.status === "failed" || log.report?.status === "error"
    ).length;
    const successRate =
      totalExecutions > 0
        ? Math.round((successful / totalExecutions) * 100)
        : 0;

    // Get recent failures (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFailures = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return (
        logDate >= sevenDaysAgo &&
        (log.report?.status === "failed" || log.report?.status === "error")
      );
    }).length;

    setStats({
      totalTemplates,
      totalExecutions,
      successRate,
      recentFailures,
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "partial":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "success":
        return "Berhasil";
      case "failed":
      case "error":
        return "Gagal";
      case "partial":
        return "Sebagian";
      default:
        return "Tidak Diketahui";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50";
      case "failed":
      case "error":
        return "text-red-600 bg-red-50";
      case "partial":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Get recent executions (last 5)
  const recentExecutions = executions.slice(0, 5);

  // Get alerts (recent failures and warnings)
  const alerts = [];
  const recentFailures = executions
    .filter(
      (log) =>
        log.report?.status === "failed" || log.report?.status === "error"
    )
    .slice(0, 3);

  recentFailures.forEach((log) => {
    alerts.push({
      type: "error",
      title: "Eksekusi Gagal",
      message: `${log.plan?.templateName || "Manual Execution"} gagal dieksekusi`,
      timestamp: log.timestamp,
      id: log.id,
    });
  });

  // Add template update warnings (mock for now)
  if (stats.totalTemplates > 0) {
    alerts.push({
      type: "warning",
      title: "Template Perlu Diperbarui",
      message: "Beberapa template belum digunakan dalam 30 hari terakhir",
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <HomeIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gambaran umum kondisi automasi OtoMate
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Overview - Status Ringkas */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Templates */}
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Template Aktif</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalTemplates}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Template tersedia
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Total Executions */}
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Total Eksekusi
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalExecutions}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Semua waktu
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <PlayCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Tingkat Keberhasilan
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.successRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalExecutions > 0
                        ? "Dari semua eksekusi"
                        : "Belum ada data"}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Recent Failures */}
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Kegagalan Terbaru
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.recentFailures}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      7 hari terakhir
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Executions - Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Executions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Executions
                  </h2>
                  <Link
                    href="/executions"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Lihat Semua
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="bg-white border border-[#e5e5e5] rounded-lg">
                  {recentExecutions.length === 0 ? (
                    <div className="p-12 text-center">
                      <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Belum ada eksekusi
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Mulai dengan menjalankan automation plan pertama Anda
                      </p>
                      <Link
                        href="/templates"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Buat Template
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e5e5e5]">
                      {recentExecutions.map((execution) => (
                        <Link
                          key={execution.id}
                          href="/executions"
                          className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {getStatusIcon(execution.report?.status || "unknown")}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900 truncate">
                                    {execution.plan?.templateName ||
                                      execution.plan?.target?.url ||
                                      "Manual Execution"}
                                  </p>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                      execution.report?.status || "unknown"
                                    )}`}
                                  >
                                    {getStatusLabel(
                                      execution.report?.status || "unknown"
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{formatDate(execution.timestamp)}</span>
                                  {execution.report?.summary && (
                                    <>
                                      <span>
                                        {execution.report.summary.success || 0}{" "}
                                        berhasil
                                      </span>
                                      {execution.report.summary.failed > 0 && (
                                        <span className="text-red-600">
                                          {execution.report.summary.failed} gagal
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/create-template"
                    className="bg-white border border-[#e5e5e5] rounded-lg p-6 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <FilePlus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Buat Template Baru
                        </h3>
                        <p className="text-sm text-gray-600">
                          Rancang automation plan baru untuk proses yang berulang
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/inspector"
                    className="bg-white border border-[#e5e5e5] rounded-lg p-6 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                        <SearchIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Buka Inspector
                        </h3>
                        <p className="text-sm text-gray-600">
                          Amati dan pahami proses interaksi halaman web
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>
            </div>

            {/* Alerts & Warnings - Right Column (1/3) */}
            <div className="lg:col-span-1">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Alerts & Warnings
                </h2>
                <div className="bg-white border border-[#e5e5e5] rounded-lg">
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-1">
                        Tidak ada peringatan
                      </p>
                      <p className="text-xs text-gray-500">
                        Semua sistem berjalan dengan baik
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e5e5e5]">
                      {alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-4 ${
                            alert.type === "error"
                              ? "bg-red-50 border-l-4 border-red-500"
                              : "bg-yellow-50 border-l-4 border-yellow-500"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {alert.type === "error" ? (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-medium mb-1 ${
                                  alert.type === "error"
                                    ? "text-red-900"
                                    : "text-yellow-900"
                                }`}
                              >
                                {alert.title}
                              </h4>
                              <p
                                className={`text-sm mb-2 ${
                                  alert.type === "error"
                                    ? "text-red-700"
                                    : "text-yellow-700"
                                }`}
                              >
                                {alert.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
