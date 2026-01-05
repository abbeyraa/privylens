/**
 * Waits for page to be fully loaded and ready before proceeding.
 * Ensures all loading events (load, DOMContentLoaded, networkidle) are complete.
 *
 * @param {Page} page - Playwright page object.
 * @param {Object} options - Wait options.
 * @param {number} options.timeout - Maximum wait time in milliseconds (default: 30000).
 * @param {boolean} options.waitForNetworkIdle - Wait for network to be idle (default: true).
 */
export async function waitForPageLoad(page, options = {}) {
  const { timeout = 30000, waitForNetworkIdle = true } = options;

  try {
    // === Wait for load event ===
    await page.waitForLoadState("load", { timeout });

    // === Wait for DOMContentLoaded ===
    await page.waitForLoadState("domcontentloaded", { timeout });

    // === Wait for network to be idle if requested ===
    if (waitForNetworkIdle) {
      await page.waitForLoadState("networkidle", { timeout });
    }
  } catch (error) {
    // If timeout occurs, log but don't fail - page might still be usable
    console.warn("Page load wait timeout:", error.message);
  }
}

/**
 * Waits for an element to be ready (visible and stable) before proceeding.
 * Ensures element is not just present but actually ready for interaction.
 *
 * @param {Page} page - Playwright page object.
 * @param {string} selector - CSS selector or text to find element.
 * @param {Object} options - Wait options.
 * @param {number} options.timeout - Maximum wait time in milliseconds (default: 10000).
 * @param {boolean} options.visible - Wait for element to be visible (default: true).
 * @param {boolean} options.stable - Wait for element to be stable (not moving) (default: true).
 */
export async function waitForElementReady(page, selector, options = {}) {
  const { timeout = 10000, visible = true, stable = true } = options;

  try {
    // === Wait for element to be attached to DOM ===
    await page.waitForSelector(selector, { 
      state: visible ? "visible" : "attached",
      timeout 
    });

    if (stable) {
      // === Wait for element to be stable (not moving) ===
      // Check element position twice with small delay to ensure stability
      const element = page.locator(selector).first();
      const position1 = await element.boundingBox();
      await page.waitForTimeout(100);
      const position2 = await element.boundingBox();
      
      // If positions differ significantly, element is still moving
      if (position1 && position2) {
        const moved = 
          Math.abs(position1.x - position2.x) > 1 ||
          Math.abs(position1.y - position2.y) > 1;
        
        if (moved) {
          // Wait a bit more for element to stabilize
          await page.waitForTimeout(200);
        }
      }
    }
  } catch (error) {
    throw new Error(`Element not ready: ${selector} - ${error.message}`);
  }
}

/**
 * Waits for all critical page events to complete before proceeding.
 * This includes load events, network idle, and any pending async operations.
 *
 * @param {Page} page - Playwright page object.
 * @param {Object} options - Wait options.
 */
export async function waitForAllEvents(page, options = {}) {
  const { timeout = 30000 } = options;

  try {
    // === Wait for all load states ===
    await waitForPageLoad(page, { timeout, waitForNetworkIdle: true });

    // === Wait for any pending JavaScript to complete ===
    // Evaluate a simple script to ensure JS execution is complete
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === "complete") {
          resolve();
        } else {
          window.addEventListener("load", resolve, { once: true });
        }
      });
    });

    // === Additional wait for any async operations ===
    await page.waitForTimeout(500);
  } catch (error) {
    console.warn("Wait for all events timeout:", error.message);
  }
}

