// Playwright runner untuk menjalankan automation plan
// Catatan: File ini harus dijalankan di server-side (Node.js), tidak bisa di browser

let playwrightLoaded = false;
let playwright = null;

async function loadPlaywright() {
  if (!playwrightLoaded) {
    try {
      playwright = await import("playwright");
      playwrightLoaded = true;
    } catch (error) {
      throw new Error(
        "Playwright tidak tersedia. Pastikan playwright sudah diinstall: npm install playwright"
      );
    }
  }
  return playwright;
}

/**
 * Eksekusi Automation Plan menggunakan Playwright
 * @param {Object} plan - Automation plan dari UI
 * @returns {Promise<Object>} Execution report
 */
export async function executeAutomationPlan(plan) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const normalizedPlan = normalizePlan(plan);
  const results = [];
  const startTime = Date.now();

  try {
    // Jika flow mengandung handleDialog, pasang handler dari awal agar dialog
    // yang muncul saat click tidak membuat aksi terlihat "tidak jalan".
    installDialogAutoAcceptIfNeeded(page, normalizedPlan);

    // Step 1: Login jika diperlukan
    if (normalizedPlan.target.login) {
      await performLogin(page, normalizedPlan.target.login);
    }

    // Step 2: Navigation ke halaman target
    if (
      normalizedPlan.target.navigation &&
      normalizedPlan.target.navigation.length > 0
    ) {
      await performNavigation(page, normalizedPlan.target.navigation);
    }

    // Step 3: Navigate ke target URL dan tunggu page ready
    await page.goto(normalizedPlan.target.url, { waitUntil: "networkidle" });
    await waitForPageReady(page, normalizedPlan.target.pageReadyIndicator);

    // Step 4: Eksekusi berdasarkan mode
    if (normalizedPlan.dataSource.mode === "batch") {
      // Batch mode: loop untuk setiap baris data
      for (let i = 0; i < normalizedPlan.dataSource.rows.length; i++) {
        const rowData = normalizedPlan.dataSource.rows[i];
        const result = await executeActionsForRow(
          page,
          normalizedPlan,
          rowData,
          i,
          normalizedPlan.target.url
        );
        results.push(result);

        // Jika gagal dan ada failure indicator, stop atau continue sesuai kebutuhan
        if (result.status === "failed" && normalizedPlan.failureIndicator) {
          const failureDetected = await checkIndicator(
            page,
            normalizedPlan.failureIndicator
          );
          if (failureDetected) {
            break; // Stop jika failure indicator terdeteksi
          }
        }
      }
    } else {
      // Single mode: hanya eksekusi untuk satu baris
      const rowIndex =
        normalizedPlan.dataSource.selectedRowIndex !== undefined
          ? normalizedPlan.dataSource.selectedRowIndex
          : 0;
      const rowData = normalizedPlan.dataSource.rows[rowIndex] || {};

      if (normalizedPlan.execution?.mode === "loop") {
        const loopResults = await executeActionsWithLoop(
          page,
          normalizedPlan,
          rowData,
          normalizedPlan.target.url
        );
        results.push(...loopResults);
      } else {
        const result = await executeActionsForRow(
          page,
          normalizedPlan,
          rowData,
          rowIndex,
          normalizedPlan.target.url
        );
        results.push(result);
      }
    }

    // Step 5: Generate summary
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
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      results,
      duration: Date.now() - startTime,
    };
  } finally {
    await browser.close();
  }
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== "object") {
    throw new Error("Automation plan tidak valid");
  }

  const target = plan.target || {};
  if (!target.url) {
    throw new Error("Target URL tidak ditemukan di plan");
  }
  if (!target.pageReadyIndicator?.type || !target.pageReadyIndicator?.value) {
    throw new Error("Page Ready Indicator tidak valid di plan");
  }

  const dataSource =
    plan.dataSource && typeof plan.dataSource === "object"
      ? plan.dataSource
      : {
          type: "manual",
          rows: [{}],
          mode: "single",
          selectedRowIndex: 0,
        };

  const rows = Array.isArray(dataSource.rows) ? dataSource.rows : [{}];
  const safeDataSource = {
    type: dataSource.type || "manual",
    rows: rows.length > 0 ? rows : [{}],
    mode: dataSource.mode === "batch" ? "batch" : "single",
    ...(dataSource.selectedRowIndex !== undefined
      ? { selectedRowIndex: dataSource.selectedRowIndex }
      : {}),
  };

  return {
    ...plan,
    target,
    dataSource: safeDataSource,
    fieldMappings: Array.isArray(plan.fieldMappings) ? plan.fieldMappings : [],
    actions: Array.isArray(plan.actions) ? plan.actions : [],
  };
}

async function executeActionsWithLoop(page, plan, rowData, targetUrl) {
  const loop = plan.execution?.loop || {};
  const maxIterations = Number(loop.maxIterations ?? 50);
  const delaySeconds = Number(loop.delaySeconds ?? 0);
  const stopWhen = loop.stopWhen === "visible" ? "visible" : "notVisible";
  const indicator = loop.indicator;

  if (!indicator?.type || !indicator?.value) {
    throw new Error(
      "Mode loop membutuhkan execution.loop.indicator (type & value)."
    );
  }

  const iterations = [];

  for (let i = 0; i < maxIterations; i++) {
    const indicatorState = await checkIndicator(page, indicator);
    const shouldStop =
      stopWhen === "visible"
        ? indicatorState === true
        : indicatorState === false;

    if (shouldStop) {
      if (i === 0) {
        iterations.push({
          rowIndex: 0,
          status: "success",
          data: rowData,
          actions: [],
          warnings: [
            "Loop berhenti sebelum iterasi pertama (kondisi stop sudah terpenuhi).",
          ],
          duration: 0,
        });
      }
      break;
    }

    const result = await executeActionsForRow(
      page,
      plan,
      rowData,
      i,
      targetUrl
    );
    iterations.push(result);

    // Jika ada failure indicator dan terdeteksi, stop segera
    if (plan.failureIndicator) {
      const failureDetected = await checkIndicator(page, plan.failureIndicator);
      if (failureDetected) break;
    }

    if (delaySeconds > 0) {
      await page.waitForTimeout(delaySeconds * 1000);
    }
  }

  return iterations;
}

/**
 * Perform login
 */
async function performLogin(page, loginConfig) {
  await page.goto(loginConfig.url, { waitUntil: "networkidle" });

  // Cari field username dan password berdasarkan label atau selector umum
  const usernameSelectors = [
    'input[name="username"]',
    'input[name="email"]',
    'input[type="text"]',
    'input[type="email"]',
    "input#username",
    "input#email",
  ];

  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    "input#password",
  ];

  // Coba isi username
  let usernameFilled = false;
  for (const selector of usernameSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await element.fill(loginConfig.username);
        usernameFilled = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!usernameFilled) {
    throw new Error("Username field not found");
  }

  // Coba isi password
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await element.fill(loginConfig.password);
        passwordFilled = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!passwordFilled) {
    throw new Error("Password field not found");
  }

  // Cari dan klik tombol submit/login
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Masuk")',
  ];

  let submitted = false;
  for (const selector of submitSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        submitted = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!submitted) {
    throw new Error("Submit button not found");
  }

  // Tunggu navigasi setelah login
  await page.waitForURL("**", { timeout: 10000 });
}

/**
 * Perform navigation steps
 */
async function performNavigation(page, navigationSteps) {
  for (const step of navigationSteps) {
    if (step.type === "click") {
      const element = await findElementByTextOrSelector(page, step.target);
      if (!element) {
        throw new Error(`Navigation click target not found: ${step.target}`);
      }
      await element.click();
      if (step.waitFor) {
        await waitForIndicator(page, step.waitFor);
      }
    } else if (step.type === "navigate") {
      await page.goto(step.target, { waitUntil: "networkidle" });
    } else if (step.type === "wait") {
      await page.waitForTimeout((step.duration || 1) * 1000);
    }
  }
}

/**
 * Execute actions for a single row of data
 */
async function executeActionsForRow(page, plan, rowData, rowIndex, targetUrl) {
  const actionResults = [];
  const startTime = Date.now();
  const warnings = [];

  try {
    // Pastikan kita di halaman target
    const currentUrl = page.url();
    if (!currentUrl.includes(new URL(targetUrl).pathname)) {
      await page.goto(targetUrl, { waitUntil: "networkidle" });
      await waitForPageReady(page, plan.target.pageReadyIndicator);
    }

    // Eksekusi setiap action
    for (const action of plan.actions) {
      const actionResult = await executeAction(page, action, plan, rowData);
      actionResults.push(actionResult);

      // Jika action gagal, bisa stop atau continue
      if (!actionResult.success && action.required !== false) {
        throw new Error(`Action failed: ${action.type} -> ${action.target}`);
      }

      // Wait for jika ada
      if (action.waitFor) {
        await waitForIndicator(page, action.waitFor);
      }
    }

    // Check success indicator
    const success =
      plan.successIndicator?.type && plan.successIndicator?.value
        ? await checkIndicator(page, plan.successIndicator)
        : null;
    const failure =
      plan.failureIndicator?.type && plan.failureIndicator?.value
        ? await checkIndicator(page, plan.failureIndicator)
        : false;

    const status = failure
      ? "failed"
      : success === true
      ? "success"
      : actionResults.every((ar) => ar.success) && success !== false
      ? "success"
      : "partial";

    return {
      rowIndex,
      status,
      data: rowData,
      actions: actionResults,
      warnings,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      rowIndex,
      status: "failed",
      data: rowData,
      actions: actionResults,
      error: error.message,
      warnings,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Execute a single action
 */
async function executeAction(page, action, plan, rowData) {
  try {
    switch (action.type) {
      case "fill": {
        const fieldMapping = plan.fieldMappings.find(
          (fm) => fm.name === action.target
        );
        if (!fieldMapping) {
          throw new Error(`Field mapping not found: ${action.target}`);
        }

        // Ambil nilai dari data atau value action
        const value =
          action.value !== undefined && action.value !== null
            ? action.value
            : rowData[fieldMapping.dataKey] || "";

        // Cari elemen berdasarkan label
        const element = await findElementByLabel(
          page,
          fieldMapping.labels,
          fieldMapping.fallbackLabels || [],
          fieldMapping.type
        );

        if (!element) {
          throw new Error(
            `Element not found for field: ${
              fieldMapping.name
            } with labels: ${fieldMapping.labels.join(", ")}`
          );
        }

        // Isi berdasarkan tipe
        if (fieldMapping.type === "checkbox" || fieldMapping.type === "radio") {
          if (value) {
            await element.check();
          } else {
            await element.uncheck();
          }
        } else if (fieldMapping.type === "select") {
          await element.selectOption(value);
        } else {
          await element.fill(String(value));
        }

        return { type: action.type, target: action.target, success: true };
      }

      case "click": {
        await clickByTextOrSelector(page, action.target);
        return { type: action.type, target: action.target, success: true };
      }

      case "wait": {
        const duration = action.value || 1;
        await page.waitForTimeout(duration * 1000);
        return { type: action.type, success: true };
      }

      case "handleDialog": {
        // Backward-compatible: action ini mengaktifkan auto-accept dialog.
        // Namun handler idealnya sudah dipasang dari awal sebelum click terjadi.
        installDialogAutoAcceptIfNeeded(page, plan, true);
        return { type: action.type, success: true };
      }

      case "navigate": {
        if (action.target) {
          await page.goto(action.target, { waitUntil: "networkidle" });
        } else {
          // Kembali ke halaman target awal
          await page.goto(plan.target.url, { waitUntil: "networkidle" });
          await waitForPageReady(page, plan.target.pageReadyIndicator);
        }
        return {
          type: action.type,
          target: action.target || plan.target.url,
          success: true,
        };
      }

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  } catch (error) {
    return {
      type: action.type,
      target: action.target,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Find element by label (text atau associated label)
 */
async function findElementByLabel(page, labels, fallbackLabels, fieldType) {
  // Coba label utama dulu
  for (const label of labels) {
    if (!label) continue;

    // Cari dengan berbagai strategi
    const strategies = [
      // Label element dengan for attribute
      `label:has-text("${label}")`,
      // Input dengan placeholder
      `input[placeholder*="${label}"]`,
      `textarea[placeholder*="${label}"]`,
      // Input dengan name/id yang mirip
      `input[name*="${label.toLowerCase().replace(/\s+/g, "_")}"]`,
      // Textarea dengan name/id yang mirip
      `textarea[name*="${label.toLowerCase().replace(/\s+/g, "_")}"]`,
      // Select dengan name/id yang mirip
      `select[name*="${label.toLowerCase().replace(/\s+/g, "_")}"]`,
    ];

    for (const strategy of strategies) {
      try {
        const element = page.locator(strategy).first();
        if (await element.isVisible({ timeout: 1000 })) {
          // Jika label, ambil input yang terkait
          if (strategy.startsWith("label:")) {
            const forAttr = await element.getAttribute("for");
            if (forAttr) {
              return page.locator(`#${forAttr}`).first();
            }
            // Jika tidak ada for, cari input berikutnya
            return element
              .locator("..")
              .locator("input, textarea, select")
              .first();
          }
          return element;
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Coba fallback labels
  for (const label of fallbackLabels) {
    if (!label) continue;
    const element = await findElementByTextOrSelector(page, label);
    if (element && (await element.isVisible({ timeout: 1000 }))) {
      return element;
    }
  }

  return null;
}

/**
 * Find element by text or selector
 */
async function findElementByTextOrSelector(page, target) {
  return await getClickableLocator(page, target);
}

function escapeForCssString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeForRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getClickableLocator(page, target) {
  if (!target) return null;
  const t = String(target).trim();
  if (!t) return null;
  const exactTextRe = new RegExp(`^\\s*${escapeForRegex(t)}\\s*$`, "i");

  // 1) Coba sebagai selector CSS (trial click)
  try {
    const css = page.locator(t).first();
    await css.click({ timeout: 5000, trial: true });
    return css;
  } catch (e) {
    // lanjut
  }

  // 2) Role-based (paling akurat untuk button/link)
  try {
    const btnExact = page.getByRole("button", { name: t, exact: true }).first();
    await btnExact.click({ timeout: 5000, trial: true });
    return btnExact;
  } catch (e) {
    // lanjut
  }

  // 2b) Role-based regex (tahan whitespace/icon, tapi tetap EXACT agar tidak tabrakan:
  // "Add" vs "Add Transaction")
  try {
    const btnRegex = page
      .getByRole("button", {
        name: exactTextRe,
      })
      .first();
    await btnRegex.click({ timeout: 5000, trial: true });
    return btnRegex;
  } catch (e) {
    // lanjut
  }

  // 2c) Filter berbasis textContent yang EXACT (untuk button submit dengan icon)
  try {
    const btnByTextExact = page
      .locator("button")
      .filter({ hasText: exactTextRe })
      .first();
    await btnByTextExact.click({ timeout: 5000, trial: true });
    return btnByTextExact;
  } catch (e) {
    // lanjut
  }

  try {
    const btn = page.getByRole("button", { name: t }).first();
    await btn.click({ timeout: 5000, trial: true });
    return btn;
  } catch (e) {
    // lanjut
  }

  try {
    const linkExact = page.getByRole("link", { name: t, exact: true }).first();
    await linkExact.click({ timeout: 5000, trial: true });
    return linkExact;
  } catch (e) {
    // lanjut
  }

  // Link exact regex (hindari collision label pendek)
  try {
    const linkRegex = page.getByRole("link", { name: exactTextRe }).first();
    await linkRegex.click({ timeout: 5000, trial: true });
    return linkRegex;
  } catch (e) {
    // lanjut
  }

  try {
    const link = page.getByRole("link", { name: t }).first();
    await link.click({ timeout: 5000, trial: true });
    return link;
  } catch (e) {
    // lanjut
  }

  // 3) Fallback CSS text selectors (lebih aman daripada *:has-text global)
  const esc = escapeForCssString(t);
  const candidates = [
    `button:has-text("${esc}")`,
    `a:has-text("${esc}")`,
    `[role="button"]:has-text("${esc}")`,
    `[role="menuitem"]:has-text("${esc}")`,
    `input[type="submit"][value="${esc}"]`,
  ];

  for (const sel of candidates) {
    try {
      const loc = page.locator(sel).first();
      await loc.click({ timeout: 5000, trial: true });
      return loc;
    } catch (e) {
      continue;
    }
  }

  // 4) Cari text lalu naik ke ancestor yang clickable
  try {
    const textLoc = page.getByText(t, { exact: true }).first();
    const ancestorButton = textLoc.locator("xpath=ancestor-or-self::button[1]");
    await ancestorButton.click({ timeout: 5000, trial: true });
    return ancestorButton;
  } catch (e) {
    // lanjut
  }

  try {
    const textLoc = page.getByText(t).first();
    const ancestorRoleButton = textLoc.locator(
      'xpath=ancestor-or-self::*[@role="button"][1]'
    );
    await ancestorRoleButton.click({ timeout: 5000, trial: true });
    return ancestorRoleButton;
  } catch (e) {
    // lanjut
  }

  try {
    const textLoc = page.getByText(t).first();
    const ancestorLink = textLoc.locator("xpath=ancestor-or-self::a[1]");
    await ancestorLink.click({ timeout: 5000, trial: true });
    return ancestorLink;
  } catch (e) {
    // lanjut
  }

  return null;
}

async function clickByTextOrSelector(page, target) {
  const locator = await getClickableLocator(page, target);
  if (!locator) {
    throw new Error(`Click target not found: ${target}`);
  }

  // Pastikan terlihat di viewport dulu
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 2000 });
  } catch (e) {
    // abaikan
  }

  // Coba click normal dulu (biarkan Playwright auto-wait)
  try {
    await locator.click({ timeout: 10000 });
    return;
  } catch (e) {
    // fallback: force click (untuk kasus overlay / pointer-events aneh)
  }

  await locator.click({ timeout: 10000, force: true });
}

function installDialogAutoAcceptIfNeeded(page, plan, force = false) {
  const shouldInstall =
    force ||
    (Array.isArray(plan?.actions) &&
      plan.actions.some((a) => a?.type === "handleDialog"));
  if (!shouldInstall) return;
  if (page.__privylensDialogAutoAcceptInstalled) return;
  page.__privylensDialogAutoAcceptInstalled = true;

  page.on("dialog", async (dialog) => {
    try {
      await dialog.accept();
    } catch (e) {
      // no-op
    }
  });
}

/**
 * Wait for page ready indicator
 */
async function waitForPageReady(page, indicator) {
  if (indicator.type === "selector") {
    await page.waitForSelector(indicator.value, { timeout: 30000 });
  } else if (indicator.type === "text") {
    await page.waitForSelector(`text=${indicator.value}`, { timeout: 30000 });
  } else if (indicator.type === "url") {
    await page.waitForURL(`**${indicator.value}**`, { timeout: 30000 });
  }
}

/**
 * Wait for indicator
 */
async function waitForIndicator(page, indicator) {
  if (indicator.type === "selector") {
    await page.waitForSelector(indicator.value, { timeout: 10000 });
  } else if (indicator.type === "text") {
    await page.waitForSelector(`text=${indicator.value}`, { timeout: 10000 });
  } else if (indicator.type === "url") {
    await page.waitForURL(`**${indicator.value}**`, { timeout: 10000 });
  }
}

/**
 * Check if indicator exists
 */
async function checkIndicator(page, indicator) {
  try {
    if (indicator.type === "selector") {
      const element = await page.locator(indicator.value).first();
      return await element.isVisible({ timeout: 2000 });
    } else if (indicator.type === "text") {
      const element = await page.locator(`text=${indicator.value}`).first();
      return await element.isVisible({ timeout: 2000 });
    } else if (indicator.type === "url") {
      const url = page.url();
      return url.includes(indicator.value);
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Catatan: executeAutomationPlan sudah diekspor via `export async function ...` di atas.
