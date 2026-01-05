/**
 * Playwright Library Loader Module
 *
 * Note: This module must be executed server-side (Node.js only).
 * It cannot run in the browser environment.
 */

let playwrightLoaded = false;
let playwright = null;

/**
 * Loads the Playwright library using lazy loading pattern.
 * Ensures the library is only loaded once and cached for subsequent calls.
 *
 * @returns {Promise<Object>} The Playwright module object.
 * @throws {Error} If Playwright is not available or installation is missing.
 */
export async function loadPlaywright() {
  if (!playwrightLoaded) {
    try {
      // === Lazy load Playwright module ===
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
