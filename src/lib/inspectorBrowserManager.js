/**
 * Inspector Browser Manager
 * Manages Playwright browser instances for inspector sessions
 */

// Store active browser instances
const activeBrowsers = new Map();

/**
 * Store browser instance
 */
export function storeBrowserInstance(sessionId, browser, context, page) {
  activeBrowsers.set(sessionId, {
    browser,
    context,
    page,
    createdAt: Date.now(),
  });
}

/**
 * Get browser instance
 */
export function getBrowserInstance(sessionId) {
  return activeBrowsers.get(sessionId);
}

/**
 * Remove browser instance
 */
export async function removeBrowserInstance(sessionId) {
  const instance = activeBrowsers.get(sessionId);
  if (instance) {
    try {
      await instance.browser.close();
    } catch (error) {
      console.error("Error closing browser:", error);
    }
    activeBrowsers.delete(sessionId);
  }
}

/**
 * Get screenshot from browser instance
 */
export async function getScreenshot(sessionId) {
  const instance = activeBrowsers.get(sessionId);
  if (!instance || !instance.page) {
    return null;
  }

  try {
    const screenshot = await instance.page.screenshot({
      type: "png",
      fullPage: false,
    });
    return screenshot;
  } catch (error) {
    console.error("Error taking screenshot:", error);
    return null;
  }
}

/**
 * Get all active session IDs
 */
export function getActiveSessionIds() {
  return Array.from(activeBrowsers.keys());
}







