"use client";

import { Settings as SettingsIcon, Database } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoSave: true,
    language: "id",
  });

  const handleToggle = (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
  };

  const handleChange = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
  };

  const settingSections = [
    {
      title: "General",
      icon: SettingsIcon,
      settings: [
        {
          key: "autoSave",
          label: "Auto Save",
          description: "Otomatis menyimpan perubahan secara berkala",
          type: "toggle",
        },
        {
          key: "language",
          label: "Language",
          description: "Pilih bahasa antarmuka",
          type: "select",
          options: [
            { value: "id", label: "Bahasa Indonesia" },
            { value: "en", label: "English" },
          ],
        },
      ],
    },
    {
      title: "Data",
      icon: Database,
      settings: [
        {
          key: "exportData",
          label: "Export Data",
          description: "Ekspor semua data dan template",
          type: "button",
          action: () => alert("Export data functionality coming soon"),
        },
        {
          key: "clearCache",
          label: "Clear Cache",
          description: "Hapus cache dan data sementara",
          type: "button",
          action: () => {
            if (confirm("Apakah Anda yakin ingin menghapus cache?")) {
              alert("Cache cleared");
            }
          },
        },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="bg-white border border-[#e5e5e5] rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {section.settings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between py-4 border-b border-[#e5e5e5] last:border-0"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {setting.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {setting.description}
                        </p>
                      </div>

                      <div className="ml-4">
                        {setting.type === "toggle" && (
                          <button
                            onClick={() => handleToggle(setting.key)}
                            disabled={setting.disabled}
                            className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                              ${
                                settings[setting.key]
                                  ? "bg-blue-600"
                                  : "bg-gray-300"
                              }
                              ${
                                setting.disabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            `}
                          >
                            <span
                              className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${
                                  settings[setting.key]
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }
                              `}
                            />
                          </button>
                        )}

                        {setting.type === "select" && (
                          <select
                            value={settings[setting.key]}
                            onChange={(e) =>
                              handleChange(setting.key, e.target.value)
                            }
                            className="px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {setting.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {setting.type === "button" && (
                          <button
                            onClick={setting.action}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {setting.label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
