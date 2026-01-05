/**
 * Waits for a page ready indicator to appear, indicating the page has finished loading.
 * Uses a longer timeout (30s) suitable for initial page load.
 *
 * @param {Page} page - Playwright page object.
 * @param {Object} indicator - Indicator configuration object.
 * @param {string} indicator.type - Type of indicator: "selector", "text", or "url".
 * @param {string} indicator.value - Value to match for the indicator.
 */
export async function waitForPageReady(page, indicator) {
  if (indicator.type === "selector") {
    await page.waitForSelector(indicator.value, { timeout: 30000 });
  } else if (indicator.type === "text") {
    await page.waitForSelector(`text=${indicator.value}`, { timeout: 30000 });
  } else if (indicator.type === "url") {
    await page.waitForURL(`**${indicator.value}**`, { timeout: 30000 });
  }
}

/**
 * Waits for an indicator to appear after an action.
 * Uses a shorter timeout (10s) suitable for post-action waits.
 *
 * @param {Page} page - Playwright page object.
 * @param {Object} indicator - Indicator configuration object.
 * @param {string} indicator.type - Type of indicator: "selector", "text", or "url".
 * @param {string} indicator.value - Value to match for the indicator.
 */
export async function waitForIndicator(page, indicator) {
  if (indicator.type === "selector") {
    await page.waitForSelector(indicator.value, { timeout: 10000 });
  } else if (indicator.type === "text") {
    await page.waitForSelector(`text=${indicator.value}`, { timeout: 10000 });
  } else if (indicator.type === "url") {
    await page.waitForURL(`**${indicator.value}**`, { timeout: 10000 });
  }
}

/**
 * Checks if an indicator currently exists on the page.
 * Returns immediately without waiting, useful for conditional logic.
 *
 * @param {Page} page - Playwright page object.
 * @param {Object} indicator - Indicator configuration object.
 * @param {string} indicator.type - Type of indicator: "selector", "text", or "url".
 * @param {string} indicator.value - Value to match for the indicator.
 * @returns {Promise<boolean>} True if indicator is found, false otherwise.
 */
export async function checkIndicator(page, indicator) {
  try {
    if (indicator.type === "selector") {
      // === Check selector-based indicator ===
      const element = await page.locator(indicator.value).first();
      return await element.isVisible({ timeout: 2000 });
    } else if (indicator.type === "text") {
      // === Check text-based indicator ===
      const element = await page.locator(`text=${indicator.value}`).first();
      return await element.isVisible({ timeout: 2000 });
    } else if (indicator.type === "url") {
      // === Check URL-based indicator ===
      const url = page.url();
      return url.includes(indicator.value);
    }
    return false;
  } catch (e) {
    return false;
  }
}
