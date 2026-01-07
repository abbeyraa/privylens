import { NextResponse } from "next/server";
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_PATH = path.join(process.cwd(), "data", "inspect-log.json");

async function writeLog(data) {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const content = await fs.readFile(LOG_PATH, "utf-8");
    const parsed = JSON.parse(content);
    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const status = error.code === "ENOENT" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: "Logs not found" },
      { status }
    );
  }
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const targetUrl = payload.url?.trim() || "about:blank";
  const runId = `inspect-${Date.now()}`;
  const events = [];
  const startedAt = new Date().toISOString();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let lastNavigationUrl = "";
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const url = frame.url();
    if (!url || url === "about:blank") return;
    if (url === lastNavigationUrl) return;
    lastNavigationUrl = url;
    events.push({
      id: `evt-${events.length + 1}`,
      ts: new Date().toISOString(),
      level: "info",
      type: "navigation",
      message: `Navigated to ${url}`,
      data: {
        url,
      },
    });
  });

  const pushEvent = (event) => {
    events.push({
      id: `evt-${events.length + 1}`,
      ts: new Date().toISOString(),
      level: "info",
      ...event,
    });
  };

  await page.exposeBinding("reportClick", (_source, payload) => {
    pushEvent({
      type: "interaction.click",
      message: `Click ${payload?.tag || "element"}`,
      data: payload,
    });
  });

  await page.addInitScript(() => {
    const textOf = (element) => {
      if (!element) return "";
      const raw = element.innerText || element.textContent || "";
      return raw.trim().slice(0, 120);
    };

    const labelOf = (element) => {
      if (!element) return "";
      if (element.labels && element.labels.length > 0) {
        const labelText = textOf(element.labels[0]);
        if (labelText) return labelText;
      }
      const aria = element.getAttribute && element.getAttribute("aria-label");
      if (aria) return aria.trim().slice(0, 120);
      const name = element.getAttribute && element.getAttribute("name");
      if (name) return name.trim().slice(0, 120);
      const placeholder =
        element.getAttribute && element.getAttribute("placeholder");
      if (placeholder) return placeholder.trim().slice(0, 120);
      const wrappedLabel = element.closest && element.closest("label");
      if (wrappedLabel) return textOf(wrappedLabel);
      return "";
    };

    const selectorFor = (element) => {
      if (!element || element.nodeType !== 1) return "";
      if (element.id) return `#${element.id}`;
      const parts = [];
      let current = element;
      while (current && current.nodeType === 1 && parts.length < 4) {
        let part = current.tagName.toLowerCase();
        const classList = current.className
          ? current.className.toString().trim().split(/\s+/).filter(Boolean)
          : [];
        if (classList.length) {
          part += `.${classList.slice(0, 2).join(".")}`;
        }
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            (child) => child.tagName === current.tagName
          );
          if (siblings.length > 1) {
            part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
          }
        }
        parts.unshift(part);
        current = parent;
      }
      return parts.join(" > ");
    };

    window.addEventListener(
      "click",
      (event) => {
        try {
          const element = event.target;
          window.reportClick({
            selector: selectorFor(element),
            text: textOf(element),
            label: labelOf(element),
            tag: element?.tagName?.toLowerCase?.() || "",
            url: window.location.href,
          });
        } catch (error) {
          // Ignore click serialization errors.
        }
      },
      true
    );
  });

  try {
    if (targetUrl) {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    }
  } catch (error) {
    events.push({
      id: `evt-${events.length + 1}`,
      ts: new Date().toISOString(),
      level: "error",
      type: "navigation-error",
      message: error.message,
      data: {
        url: targetUrl,
      },
    });
  }

  await page.waitForEvent("close");
  await context.close().catch(() => {});
  await browser.close().catch(() => {});

  const payloadToSave = {
    schemaVersion: 1,
    runId,
    startedAt,
    endedAt: new Date().toISOString(),
    targetUrl,
    events,
  };

  await writeLog(payloadToSave);

  return NextResponse.json({
    success: true,
    eventsCount: events.length,
    logPath: "data/inspect-log.json",
    runId,
  });
}
