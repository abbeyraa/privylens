"use client";

import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="OtoMate Logo"
              width={40}
              height={40}
              className="flex-shrink-0"
            />
            <span className="text-2xl font-bold text-gray-900">OtoMate</span>
          </div>
        </div>
      </div>
    </header>
  );
}
