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

async function resolveLocator(page, step) {
  const selector = step.selector?.trim();
  const label = step.label?.trim();
  const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 10000;

  if (selector) {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: "visible", timeout: timeoutMs });
    return locator;
  }

  const candidates = [];
  if (label) {
    if (step.type === "Click") {
      candidates.push(page.getByRole("button", { name: label }));
    }
    if (step.type === "Input") {
      candidates.push(page.getByLabel(label));
      candidates.push(page.getByRole("textbox", { name: label }));
    }
    candidates.push(page.getByText(label, { exact: true }));
    candidates.push(page.getByLabel(label));
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

  throw new Error("Selector or label is required");
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
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    if (targetUrl) {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
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
          selector: step.selector || "",
          status: "pending",
          ts: new Date().toISOString(),
        };

        try {
          switch (step.type) {
            case "Click":
              {
                const locator = await resolveLocator(page, step);
                const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 10000;
                await locator.click({ timeout: timeoutMs });
              }
              break;
            case "Input":
              {
                const locator = await resolveLocator(page, step);
                const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 10000;
                await locator.waitFor({ state: "visible", timeout: timeoutMs });
                await locator.pressSequentially(step.value || "", {
                  delay: 100,
                });
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
                const timeoutMs = Number.parseInt(step.timeoutMs, 10) || 10000;
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
