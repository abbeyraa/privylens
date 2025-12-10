"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE_URL = "http://localhost:8000";

export default function PlaywrightBrowser({
  url,
  onSelectorDetected,
  automationMode,
}) {
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [detectedSelector, setDetectedSelector] = useState("");

  useEffect(() => {
    initSession();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (sessionId) {
        fetch(`${API_BASE_URL}/browser/session/close?session_id=${sessionId}`, {
          method: "POST",
        }).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (sessionId && currentUrl) {
      navigate(currentUrl);
    }
  }, [sessionId, currentUrl]);

  const initSession = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/browser/session/create`, {
        method: "POST",
      });
      const data = await res.json();
      setSessionId(data.session_id);
      startStream(data.session_id);
    } catch (err) {
      setError("Failed to create browser session");
    }
  };

  const startStream = (sid) => {
    const ws = new WebSocket(`ws://localhost:8000/browser/stream/${sid}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError("");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "screenshot" && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = data.data;
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection error");
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };
  };

  const navigate = async (targetUrl) => {
    if (!sessionId || !targetUrl) return;
    setIsLoading(true);
    setError("");
    try {
      await fetch(`${API_BASE_URL}/browser/navigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, url: targetUrl }),
      });
    } catch (err) {
      setError("Failed to navigate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (currentUrl) {
      setCurrentUrl(currentUrl);
      navigate(currentUrl);
    }
  };

  const handleCanvasClick = async (e) => {
    if (!automationMode || !sessionId) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const actualX = x * scaleX;
    const actualY = y * scaleY;

    try {
      await fetch(`${API_BASE_URL}/browser/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          x: actualX,
          y: actualY,
          button: "left",
        }),
      });

      const element = await getElementAtPosition(actualX, actualY);
      if (element) {
        const selector = generateSelector(element);
        setDetectedSelector(selector);
        if (onSelectorDetected) {
          onSelectorDetected(selector, element);
        }
      }
    } catch (err) {
      console.error("Click error:", err);
    }
  };

  const getElementAtPosition = async (x, y) => {
    if (!sessionId) return null;
    try {
      const res = await fetch(
        `${API_BASE_URL}/browser/get-element-at-position?session_id=${sessionId}&x=${x}&y=${y}`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      return data.element;
    } catch {
      return null;
    }
  };

  const generateSelector = (element) => {
    if (!element) return "";
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    return element.tag || "";
  };

  return (
    <div className="flex flex-col h-full border border-[#e5e5e5] rounded-lg bg-white">
      <div className="flex items-center gap-2 p-3 border-b border-[#e5e5e5]">
        <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded border border-[#e5e5e5] px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-[#3b82f6] px-4 py-1.5 text-sm font-medium text-white"
            disabled={!sessionId || isLoading}
          >
            Go
          </button>
        </form>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded">
              Connected
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded">
              Disconnected
            </span>
          )}
          {automationMode && (
            <span className="px-2 py-1 text-xs font-medium text-[#3b82f6] bg-[#eef2ff] rounded">
              Automation Mode
            </span>
          )}
        </div>
      </div>
      {detectedSelector && automationMode && (
        <div className="px-3 py-2 bg-[#eef2ff] border-b border-[#e5e5e5] text-xs">
          <span className="font-medium">Detected:</span>{" "}
          <code className="text-[#3730a3]">{detectedSelector}</code>
        </div>
      )}
      {error && (
        <div className="px-3 py-2 bg-red-50 border-b border-[#e5e5e5] text-xs text-red-600">
          {error}
        </div>
      )}
      <div className="flex-1 relative bg-[#1a1a1a] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f9fafb] z-10">
            <p className="text-sm text-[#6b7280]">Loading...</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onClick={automationMode ? handleCanvasClick : undefined}
          className={`w-full h-full object-contain ${
            automationMode ? "cursor-crosshair" : ""
          }`}
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

