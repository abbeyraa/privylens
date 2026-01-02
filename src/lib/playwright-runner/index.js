/**
 * Main entry point for the Playwright automation runner.
 *
 * Note: This file is intended to be executed server-side (Node.js only).
 * It cannot run in the browser environment.
 */

import { loadPlaywright } from "./loader";
import { normalizePlan } from "./normalize";
import { performLogin } from "./login";
import { performNavigation } from "./navigation";
import { executeActionsForRow, executeActionsWithLoop } from "./actions";
import { waitForPageReady, checkIndicator } from "./indicators";
import { installDialogAutoAcceptIfNeeded } from "./dialog";
import { setupAutoPermissions } from "./permissions";
import { waitForPageLoad, waitForAllEvents } from "./waitHelpers";

/**
 * Executes the automation plan using Playwright.
 *
 * @param {Object} plan - The automation plan as defined from the UI.
 * @param {boolean} safeRun - If true, skip submit actions (dry run mode).
 * @returns {Promise<Object>} - Detailed execution report.
 */
export async function executeAutomationPlan(plan, safeRun = false) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // === Setup automatic permission grants (geolocation, etc.) ===
  // This ensures permission prompts don't block automation
  setupAutoPermissions(context);

  const normalizedPlan = normalizePlan(plan);
  const results = [];
  const startTime = Date.now();

  try {
    // === Install dialog handler if "handleDialog" steps are present ===
    // Ensures modal dialogs encountered during automation are properly handled from the very beginning.
    installDialogAutoAcceptIfNeeded(page, normalizedPlan);

    // === STEP 1: Perform login if a login step is configured ===
    if (normalizedPlan.target.login) {
      await performLogin(page, normalizedPlan.target.login);
    }

    // === STEP 2: Perform navigation steps if configured ===
    if (
      normalizedPlan.target.navigation &&
      normalizedPlan.target.navigation.length > 0
    ) {
      await performNavigation(page, normalizedPlan.target.navigation);
    }

    // === STEP 3: Navigate to the main target URL and await page readiness ===
    await page.goto(normalizedPlan.target.url, { waitUntil: "networkidle" });
    
    // === Wait for all loading events to complete ===
    // This ensures page is fully loaded before proceeding
    await waitForAllEvents(page, { timeout: 30000 });
    
    // === Wait for page ready indicator ===
    await waitForPageReady(page, normalizedPlan.target.pageReadyIndicator);

    // === STEP 4: Execute actions according to execution mode (batch or single) ===
    if (normalizedPlan.dataSource.mode === "batch") {
      // === Batch Mode: Execute actions for each row in dataSource ===
      for (let i = 0; i < normalizedPlan.dataSource.rows.length; i++) {
        const rowData = normalizedPlan.dataSource.rows[i];
        const result = await executeActionsForRow(
          page,
          normalizedPlan,
          rowData,
          i,
          normalizedPlan.target.url,
          safeRun
        );
        results.push(result);

        // === Abort logic: Check for failure indicator if action failed ===
        if (result.status === "failed" && normalizedPlan.failureIndicator) {
          const failureDetected = await checkIndicator(
            page,
            normalizedPlan.failureIndicator
          );
          if (failureDetected) {
            break; // Abort batch if failure indicator is detected
          }
        }
      }
    } else {
      // === Single Mode: Execute actions for a selected data row (supports loop if configured) ===
      const rowIndex =
        normalizedPlan.dataSource.selectedRowIndex !== undefined
          ? normalizedPlan.dataSource.selectedRowIndex
          : 0;
      const rowData = normalizedPlan.dataSource.rows[rowIndex] || {};

      if (normalizedPlan.execution?.mode === "loop") {
        // === Loop Mode: Execute actions in a loop until exit condition met ===
        const loopResults = await executeActionsWithLoop(
          page,
          normalizedPlan,
          rowData,
          normalizedPlan.target.url,
          safeRun
        );
        results.push(...loopResults);
      } else {
        // === Default Single Run ===
        const result = await executeActionsForRow(
          page,
          normalizedPlan,
          rowData,
          rowIndex,
          normalizedPlan.target.url,
          safeRun
        );
        results.push(result);
      }
    }

    // === STEP 5: Compile summary statistics ===
    const summary = {
      total: results.length,
      success: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "failed").length,
      partial: results.filter((r) => r.status === "partial").length,
    };

    const duration = Date.now() - startTime;

    return {
      status:
        summary.failed === 0
          ? "success"
          : summary.success > 0
          ? "partial"
          : "failed",
      summary,
      results,
      duration,
      safeRun, // Include safeRun flag in report
    };
  } catch (error) {
    // === Error handling: Return error status and message in report ===
    return {
      status: "error",
      message: error.message,
      results,
      duration: Date.now() - startTime,
    };
  } finally {
    // === Ensure browser resources are freed after execution ===
    await browser.close();
  }
}
