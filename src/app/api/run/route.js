import { NextResponse } from "next/server";
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { getPlaywrightContextOptions } from "../playwright-options.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_PATH = path.join(process.cwd(), "data", "inspect-log.json");

async function writeLog(data) {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function resolveLocator(page, step) {
  const label = step.label?.trim();
  const scopeSelector = step.scopeSelector?.trim();
  const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 5000;
  const inputKind = step.inputKind || "text";
  let scope = page;

  if (scopeSelector) {
    const scoped = page.locator(scopeSelector).first();
    await scoped.waitFor({ state: "visible", timeout: timeoutMs });
    scope = scoped;
  }

  const candidates = [];
  if (step.type === "Input" && inputKind === "radio" && step.value?.trim()) {
    const escaped = step.value.trim().replace(/["\\]/g, "\\$&");
    candidates.push(scope.locator(`input[type="radio"][value="${escaped}"]`));
  }

  if (label) {
    if (step.type === "Click") {
      candidates.push(scope.getByRole("button", { name: label }));
      candidates.push(scope.getByRole("link", { name: label }));
      candidates.push(scope.getByText(label, { exact: true }));
    }
    if (step.type === "Input") {
      switch (inputKind) {
        case "checkbox":
        case "toggle":
          candidates.push(scope.getByRole("checkbox", { name: label }));
          candidates.push(scope.getByRole("switch", { name: label }));
          candidates.push(scope.getByLabel(label));
          break;
        case "radio":
          candidates.push(scope.getByRole("radio", { name: label }));
          candidates.push(scope.getByLabel(label));
          break;
        case "select":
          candidates.push(scope.getByRole("combobox", { name: label }));
          candidates.push(scope.getByLabel(label));
          break;
        case "number":
          candidates.push(scope.getByRole("spinbutton", { name: label }));
          candidates.push(scope.getByLabel(label));
          candidates.push(scope.getByRole("textbox", { name: label }));
          break;
        default:
          candidates.push(scope.getByRole("textbox", { name: label }));
          candidates.push(scope.getByLabel(label));
          break;
      }
    }
  }

  for (const locator of candidates) {
    try {
      const resolved = locator.first();
      await resolved.waitFor({ state: "visible", timeout: timeoutMs });
      return resolved;
    } catch {
      // Try the next locator candidate.
    }
  }

  if (step.type === "Input" && inputKind === "radio") {
    throw new Error("Label or value is required");
  }
  throw new Error("Label is required");
}

function normalizeBooleanValue(value) {
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on", "checked"].includes(normalized)) return true;
  if (["false", "0", "no", "off", "unchecked"].includes(normalized))
    return false;
  return null;
}

function formatDateValue(raw, format) {
  if (!format) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  const yyyy = String(parsed.getFullYear());
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return format
    .replace(/YYYY/g, yyyy)
    .replace(/MM/g, mm)
    .replace(/DD/g, dd);
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const targetUrl = payload.targetUrl?.trim() || "";
  const groups = Array.isArray(payload.groups) ? payload.groups : [];

  const report = {
    type: "run",
    startedAt: new Date().toISOString(),
    endedAt: null,
    targetUrl,
    status: "running",
    error: null,
    steps: [],
  };

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(getPlaywrightContextOptions());
  await context.clearCookies();
  const page = await context.newPage();
  await page.addInitScript(() => {
    // Ensure a clean, incognito-like state for every run.
    window.localStorage?.clear();
    window.sessionStorage?.clear();
  });
  await page.bringToFront();

  try {
    if (targetUrl) {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
      await page.bringToFront();
      report.steps.push({
        group: "system",
        step: "Target URL",
        action: "Navigate",
        status: "success",
        ts: new Date().toISOString(),
      });
    }

    for (const group of groups) {
      const steps = Array.isArray(group.steps) ? group.steps : [];
      for (const step of steps) {
        const stepReport = {
          group: group.name || group.id || "Group",
          step: step.title || step.id || "Step",
          action: step.type || "Unknown",
          status: "pending",
          ts: new Date().toISOString(),
        };

        try {
          switch (step.type) {
            case "Click":
              {
                const locator = await resolveLocator(page, step);
                const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 5000;
                await locator.click({ timeout: timeoutMs });
              }
              break;
            case "Input":
              {
                const locator = await resolveLocator(page, step);
                const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 5000;
                await locator.waitFor({ state: "visible", timeout: timeoutMs });
                const inputKind = step.inputKind || "text";
                const rawValue = step.value || "";
                if (inputKind === "checkbox" || inputKind === "toggle") {
                  const desired = normalizeBooleanValue(rawValue);
                  if (desired === null) {
                    throw new Error("Checkbox value must be true or false");
                  }
                  if (desired) {
                    await locator.check({ timeout: timeoutMs });
                  } else {
                    await locator.uncheck({ timeout: timeoutMs });
                  }
                  break;
                }

                if (inputKind === "select") {
                  if (!rawValue) {
                    throw new Error("Option value is required");
                  }
                  await locator.selectOption({ value: rawValue });
                  break;
                }

                if (inputKind === "radio") {
                  await locator.check({ timeout: timeoutMs });
                  break;
                }

                const finalValue =
                  inputKind === "date"
                    ? formatDateValue(rawValue, step.dateFormat)
                    : rawValue;
                await locator.fill(finalValue);
              }
              break;
            case "Wait":
              {
                const ms = Number.parseInt(step.waitMs, 10) || 1000;
                await page.waitForTimeout(ms);
              }
              break;
            case "Navigate":
              if (!step.url) throw new Error("URL is required");
              {
                const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 5000;
                await page.goto(step.url, {
                  waitUntil: "domcontentloaded",
                  timeout: timeoutMs,
                });
              }
              break;
            default:
              throw new Error("Unsupported action type");
          }

          stepReport.status = "success";
        } catch (error) {
          stepReport.status = "failed";
          stepReport.error = error.message;
          report.steps.push(stepReport);
          report.status = "failed";
          report.error = {
            message: error.message,
            group: group.name || group.id || "Group",
            step: step.title || step.id || "Step",
          };
          throw error;
        }

        report.steps.push(stepReport);
      }
    }

    report.status = "success";
  } catch (error) {
    report.status = report.status === "failed" ? report.status : "failed";
  } finally {
    report.endedAt = new Date().toISOString();
    await writeLog(report);
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  if (report.status !== "success") {
    return NextResponse.json(
      { success: false, error: report.error?.message || "Run failed", report },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, report });
}
