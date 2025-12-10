"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TextPanel from "@/components/TextPanel";
import MetadataPanel from "@/components/MetadataPanel";

export default function ExtractionPage() {
  const [text, setText] = useState("");
  const [metadata, setMetadata] = useState({});
  const router = useRouter();

  useEffect(() => {
    const extractedText = localStorage.getItem("extractedText");
    const fileName = localStorage.getItem("fileName");
    const fileSize = localStorage.getItem("fileSize");

    if (!extractedText) {
      router.push("/");
      return;
    }

    setText(extractedText);
    setMetadata({
      fileName: fileName || "-",
      fileSize: fileSize || "-",
      pageCount: "-",
      ocrStatus: "Completed",
    });
  }, [router]);

  const handleAnalyze = () => {
    router.push("/analysis");
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#1a1a1a]">
            Extraction Result
          </h2>
          <button
            onClick={handleAnalyze}
            className="cursor-pointer rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2d2d2d]"
          >
            Analyze with AI
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <TextPanel title="Extracted Text" text={text} />
          </div>
          <div>
            <MetadataPanel metadata={metadata} />
          </div>
        </div>
      </div>
    </div>
  );
}
