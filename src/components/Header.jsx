"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Home, FilePlus, FolderOpen, Settings } from "lucide-react";

const menuItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Editor",
    href: "/editor",
    icon: FilePlus,
  },
  {
    name: "Template",
    href: "/templates",
    icon: FolderOpen,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-[#e5e5e5] bg-white">
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="OtoMate Logo"
            width={40}
            height={40}
            className="shrink-0"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">OtoMate</h1>
            <p className="text-xs text-gray-500 mt-1">Automation Builder</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
