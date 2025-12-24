"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Home, FilePlus, FolderOpen, Settings, FileText, Search } from "lucide-react";

const menuItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Create Template",
    href: "/create-template",
    icon: FilePlus,
  },
  {
    name: "Templates",
    href: "/templates",
    icon: FolderOpen,
  },
  {
    name: "Logs",
    href: "/logs",
    icon: FileText,
  },
  {
    name: "Inspector",
    href: "/inspector",
    icon: Search,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-[#e5e5e5] flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="px-6 py-5 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="OtoMate Logo"
            width={48}
            height={48}
            className="flex-shrink-0"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">OtoMate</h1>
            <p className="text-xs text-gray-500 mt-1">Automation Builder</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
              />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#e5e5e5]">
        <p className="text-xs text-gray-500">Version 0.1.0</p>
      </div>
    </aside>
  );
}

