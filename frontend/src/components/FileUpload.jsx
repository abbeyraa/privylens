"use client";

import { useState, useRef } from "react";

export default function FileUpload({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const acceptedTypes = [
    ".pdf",
    ".docx",
    ".doc",
    ".png",
    ".jpg",
    ".jpeg",
    ".tiff",
    ".bmp",
    ".csv",
    ".xlsx",
  ];

  const validateFile = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      setError(
        "Unsupported file type. Please upload PDF, DOCX, image, CSV, or XLSX files."
      );
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB.");
      return false;
    }
    setError("");
    return true;
  };

  const handleFile = (file) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    console.log(file);
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-[#3b82f6] bg-[#eff6ff]"
            : "border-[#e5e5e5] bg-white hover:border-[#d1d5db]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center px-8 py-12">
          <svg
            className="mb-4 h-12 w-12 text-[#6b7280]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 text-sm font-medium text-[#1a1a1a]">
            Drag and drop your file here
          </p>
          <p className="mb-4 text-xs text-[#6b7280]">or click to browse</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2d2d2d]"
          >
            Select File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
