/**
 * Sets up automatic permission grants for browser permissions like geolocation.
 * Ensures automation doesn't get blocked by permission prompts.
 *
 * @param {BrowserContext} context - Playwright browser context object.
 */
export function setupAutoPermissions(context) {
  // === Grant geolocation permission automatically ===
  // This prevents geolocation permission prompts from blocking automation
  context.grantPermissions(["geolocation"], { origin: "*" });
  
  // === Grant other common permissions that might be needed ===
  // Add more permissions as needed (camera, microphone, notifications, etc.)
  // context.grantPermissions(["camera", "microphone"], { origin: "*" });
}

