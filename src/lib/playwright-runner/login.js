import { humanType } from "./humanType";

/**
 * Performs user login by navigating to the login page, filling credentials,
 * and submitting the login form.
 *
 * @param {Page} page - Playwright page object.
 * @param {Object} loginConfig - Login configuration object.
 * @param {string} loginConfig.url - The login page URL.
 * @param {string} loginConfig.username - Username to login with.
 * @param {string} loginConfig.password - Password to login with.
 * @throws {Error} If username field, password field, or submit button cannot be found.
 */
export async function performLogin(page, loginConfig) {
  // === Navigate to login page ===
  await page.goto(loginConfig.url, { waitUntil: "networkidle" });

  // === Define common username field selectors ===
  const usernameSelectors = [
    'input[name="username"]',
    'input[name="email"]',
    'input[type="text"]',
    'input[type="email"]',
    "input#username",
    "input#email",
  ];

  // === Define common password field selectors ===
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    "input#password",
  ];

  // === Attempt to fill username field using multiple selector strategies ===
  let usernameFilled = false;
  for (const selector of usernameSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await humanType(element, loginConfig.username);
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

  // === Attempt to fill password field using multiple selector strategies ===
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await humanType(element, loginConfig.password);
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

  // === Define common submit button selectors ===
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Masuk")',
  ];

  // === Attempt to click submit button using multiple selector strategies ===
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

  // === Wait for navigation after login submission ===
  await page.waitForURL("**", { timeout: 10000 });
}
