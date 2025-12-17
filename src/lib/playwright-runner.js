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

  const results = [];
  const startTime = Date.now();

  try {
    // Step 1: Login jika diperlukan
    if (plan.target.login) {
      await performLogin(page, plan.target.login);
    }

    // Step 2: Navigation ke halaman target
    if (plan.target.navigation && plan.target.navigation.length > 0) {
      await performNavigation(page, plan.target.navigation);
    }

    // Step 3: Navigate ke target URL dan tunggu page ready
    await page.goto(plan.target.url, { waitUntil: "networkidle" });
    await waitForPageReady(page, plan.target.pageReadyIndicator);

    // Step 4: Eksekusi berdasarkan mode
    if (plan.dataSource.mode === "batch") {
      // Batch mode: loop untuk setiap baris data
      for (let i = 0; i < plan.dataSource.rows.length; i++) {
        const rowData = plan.dataSource.rows[i];
        const result = await executeActionsForRow(
          page,
          plan,
          rowData,
          i,
          plan.target.url
        );
        results.push(result);

        // Jika gagal dan ada failure indicator, stop atau continue sesuai kebutuhan
        if (result.status === "failed" && plan.failureIndicator) {
          const failureDetected = await checkIndicator(
            page,
            plan.failureIndicator
          );
          if (failureDetected) {
            break; // Stop jika failure indicator terdeteksi
          }
        }
      }
    } else {
      // Single mode: hanya eksekusi untuk satu baris
      const rowIndex =
        plan.dataSource.selectedRowIndex !== undefined
          ? plan.dataSource.selectedRowIndex
          : 0;
      const rowData = plan.dataSource.rows[rowIndex];
      const result = await executeActionsForRow(
        page,
        plan,
        rowData,
        rowIndex,
        plan.target.url
      );
      results.push(result);
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
    const success = await checkIndicator(page, plan.successIndicator);
    const failure = plan.failureIndicator
      ? await checkIndicator(page, plan.failureIndicator)
      : false;

    const status = failure
      ? "failed"
      : success
      ? "success"
      : actionResults.every((ar) => ar.success)
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
        const element = await findElementByTextOrSelector(page, action.target);
        if (!element) {
          throw new Error(`Click target not found: ${action.target}`);
        }
        await element.click();
        return { type: action.type, target: action.target, success: true };
      }

      case "wait": {
        const duration = action.value || 1;
        await page.waitForTimeout(duration * 1000);
        return { type: action.type, success: true };
      }

      case "handleDialog": {
        page.on("dialog", async (dialog) => {
          await dialog.accept();
        });
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
  // Coba sebagai selector CSS dulu
  try {
    const element = page.locator(target).first();
    if (await element.isVisible({ timeout: 1000 })) {
      return element;
    }
  } catch (e) {
    // Bukan selector, lanjut ke text search
  }

  // Cari berdasarkan text
  const textSelectors = [
    `button:text-is("${target}")`,
    `a:has-text("${target}")`,
    `*:has-text("${target}")`,
  ];

  for (const selector of textSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        return element;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
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

// Export fungsi utama saja, helper functions tetap internal
export { executeAutomationPlan };
