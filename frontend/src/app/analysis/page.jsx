"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import { sendChatMessage } from "@/lib/api";

export default function AnalysisPage() {
  const [documentText, setDocumentText] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const extractedText = localStorage.getItem("extractedText");
    if (extractedText) {
      setDocumentText(extractedText);
      setMessages([
        {
          role: "assistant",
          content: "Halo! Saya siap membantu Anda. Unggah dokumen atau gunakan dokumen yang sudah diekstrak untuk memulai percakapan.",
        },
      ]);
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Halo! Silakan unggah dokumen terlebih dahulu untuk memulai percakapan.",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (file) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload file");
      }

      if (data.success) {
        const text = data.extracted_text;
        setDocumentText(text);
        localStorage.setItem("extractedText", text);
        setMessages([
          {
            role: "assistant",
            content: `Dokumen "${data.filename}" berhasil diunggah dan diekstrak. Silakan ajukan pertanyaan tentang dokumen ini.`,
          },
        ]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setError("");

    const newMessages = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await sendChatMessage(userMessage, documentText);
      setMessages([
        ...newMessages,
        { role: "assistant", content: response.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setError(error.message || "Failed to send message");
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Pastikan Ollama berjalan dan model llama3 sudah terinstall.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-semibold text-[#1a1a1a]">
          Chat dengan Dokumen
        </h2>

        {!documentText && (
          <div className="mb-6 rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-[#1a1a1a]">
              Unggah Dokumen
            </h3>
            <p className="mb-4 text-sm text-[#6b7280]">
              Unggah dokumen untuk memulai percakapan dengan konteks dokumen.
            </p>
            {uploading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-[#6b7280]">Memproses...</div>
              </div>
            ) : (
              <>
                <FileUpload onFileSelect={handleFileSelect} />
                {error && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="rounded-lg border border-[#e5e5e5] bg-white shadow-sm">
          <div className="h-[600px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-[#3b82f6] text-white"
                      : "bg-[#f3f4f6] text-[#1a1a1a]"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-[#f3f4f6] px-4 py-2">
                  <p className="text-sm text-[#6b7280]">Mengetik...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="border-t border-[#e5e5e5] p-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  documentText
                    ? "Tanyakan sesuatu tentang dokumen..."
                    : "Unggah dokumen terlebih dahulu"
                }
                disabled={!documentText || loading}
                className="flex-1 rounded border border-[#e5e5e5] px-4 py-2 text-sm outline-none focus:border-[#3b82f6] disabled:bg-[#f3f4f6] disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!documentText || loading || !inputMessage.trim()}
                className="rounded-md bg-[#3b82f6] px-6 py-2 text-sm font-medium text-white disabled:bg-[#d1d5db] disabled:cursor-not-allowed cursor-pointer"
              >
                Kirim
              </button>
            </div>
            {error && (
              <div className="mt-2 text-xs text-red-600">{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
