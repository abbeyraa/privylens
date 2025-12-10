"use client";

import { useState, useRef, useEffect } from "react";

export default function EmbeddedBrowser({
  url,
  onSelectorDetected,
  automationMode,
}) {
  const [currentUrl, setCurrentUrl] = useState(url || "");
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);
  const [detectedSelector, setDetectedSelector] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (url && url !== currentUrl) {
      setCurrentUrl(url);
    }
  }, [url]);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (currentUrl && iframeRef.current) {
      setIsLoading(true);
      setBlocked(false);
      iframeRef.current.src = currentUrl;
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    try {
      // Will throw if X-Frame-Options blocks access
      void win.document.body;
    } catch (err) {
      setBlocked(true);
      return;
    }

    if (automationMode) {
      injectSelectorDetection(win);
    }
  };

  const injectSelectorDetection = (win) => {
    try {
      const script = `
        (function() {
          if (window.__privylens_selector_detected) return;
          window.__privylens_selector_detected = true;
          
          function generateSelector(element) {
            if (element.id) return '#' + element.id;
            if (element.name) return '[name="' + element.name + '"]';
            if (element.className && typeof element.className === 'string') {
              const classes = element.className.split(' ').filter(c => c).join('.');
              if (classes) return '.' + classes;
            }
            return element.tagName.toLowerCase() + (element.type ? '[type="' + element.type + '"]' : '');
          }
          
          function highlightElement(element) {
            const rect = element.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.id = '__privylens_highlight';
            highlight.style.position = 'fixed';
            highlight.style.left = rect.left + 'px';
            highlight.style.top = rect.top + 'px';
            highlight.style.width = rect.width + 'px';
            highlight.style.height = rect.height + 'px';
            highlight.style.border = '2px solid #3b82f6';
            highlight.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            highlight.style.pointerEvents = 'none';
            highlight.style.zIndex = '999999';
            document.body.appendChild(highlight);
          }
          
          function removeHighlight() {
            const highlight = document.getElementById('__privylens_highlight');
            if (highlight) highlight.remove();
          }
          
          document.addEventListener('click', function(e) {
            if (!window.__privylens_automation_mode) return;
            e.preventDefault();
            e.stopPropagation();
            
            const selector = generateSelector(e.target);
            highlightElement(e.target);
            
            setTimeout(() => {
              removeHighlight();
            }, 1000);
            
            window.parent.postMessage({
              type: 'SELECTOR_DETECTED',
              selector: selector,
              element: {
                tag: e.target.tagName.toLowerCase(),
                type: e.target.type || '',
                name: e.target.name || '',
                id: e.target.id || ''
              }
            }, '*');
          }, true);
          
          document.addEventListener('mouseover', function(e) {
            if (!window.__privylens_automation_mode) return;
            highlightElement(e.target);
          });
          
          document.addEventListener('mouseout', function(e) {
            if (!window.__privylens_automation_mode) return;
            removeHighlight();
          });
        })();
      `;

      const scriptEl = win.document.createElement("script");
      scriptEl.textContent = script;
      win.document.head.appendChild(scriptEl);

      win.__privylens_automation_mode = true;
    } catch (err) {
      console.error("Failed to inject selector detection:", err);
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "SELECTOR_DETECTED") {
        setDetectedSelector(event.data.selector);
        if (onSelectorDetected) {
          onSelectorDetected(event.data.selector, event.data.element);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectorDetected]);

  useEffect(() => {
    if (automationMode && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.__privylens_automation_mode = true;
      } catch (err) {
        console.error("Cannot access iframe:", err);
      }
    }
  }, [automationMode]);

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
          >
            Go
          </button>
        </form>
        {automationMode && (
          <span className="px-2 py-1 text-xs font-medium text-[#3b82f6] bg-[#eef2ff] rounded">
            Automation Mode
          </span>
        )}
      </div>
      {detectedSelector && automationMode && (
        <div className="px-3 py-2 bg-[#eef2ff] border-b border-[#e5e5e5] text-xs">
          <span className="font-medium">Detected:</span>{" "}
          <code className="text-[#3730a3]">{detectedSelector}</code>
        </div>
      )}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f9fafb]">
            <p className="text-sm text-[#6b7280]">Loading...</p>
          </div>
        )}
        {blocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 px-6 text-center">
            <p className="text-sm font-medium text-[#1f2937]">
              Situs menolak ditampilkan di iframe (X-Frame-Options: sameorigin).
            </p>
            <p className="mt-2 text-xs text-[#6b7280]">
              Buka di tab baru untuk login/manual, lalu jalankan automation via
              Playwright.
            </p>
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center rounded-md bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white"
            >
              Buka di tab baru
            </a>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={currentUrl || undefined}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
