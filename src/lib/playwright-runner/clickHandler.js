import { escapeForCssString, escapeForRegex } from "./utils";

/**
 * Gets a clickable element locator based on text content or CSS selector.
 * Uses multiple search strategies in order of specificity to find the element.
 *
 * @param {Page} page - Playwright page object.
 * @param {string} target - Text content or CSS selector to find.
 * @returns {Promise<Locator|null>} Element locator if found and valid, null otherwise.
 */
export async function getClickableLocator(page, target) {
  if (!target) return null;
  const t = String(target).trim();
  if (!t) return null;
  
  // === Prepare regex patterns for text matching ===
  const exactTextRe = new RegExp(`^\\s*${escapeForRegex(t)}\\s*$`, "i");
  const containsTextRe = new RegExp(escapeForRegex(t), "i");

  // === Helper function to validate element is clickable ===
  const validateElement = async (locator) => {
    try {
      // === First check if element exists in DOM (attached) ===
      // This allows reading from HTML even if not visible in viewport
      const isAttached = await locator.isAttached({ timeout: 2000 }).catch(() => false);
      if (!isAttached) return false;

      // === Scroll element into view if not visible ===
      // This ensures element is accessible even if below viewport
      try {
        const isVisible = await locator.isVisible({ timeout: 1000 }).catch(() => false);
        if (!isVisible) {
          // Element exists in DOM but not visible - scroll to it
          await locator.scrollIntoViewIfNeeded({ timeout: 2000 });
          // Wait a bit for scroll to complete
          await page.waitForTimeout(200);
        }
      } catch (e) {
        // If scroll fails, try to continue anyway
      }

      // === Check if element is enabled (not disabled) ===
      const isEnabled = await locator
        .isEnabled({ timeout: 1000 })
        .catch(() => true);
      if (!isEnabled) return false;

      // === Perform trial click to verify element is clickable ===
      await locator.click({ timeout: 3000, trial: true });
      return true;
    } catch (e) {
      return false;
    }
  };

  // === Strategy 1: Try as CSS selector first ===
  try {
    const css = page.locator(t).first();
    if (await validateElement(css)) {
      return css;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2: Role-based EXACT match (most accurate for buttons/links) ===
  try {
    const btnExact = page.getByRole("button", { name: t, exact: true }).first();
    if (await validateElement(btnExact)) {
      return btnExact;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2b: Role-based regex EXACT (handles whitespace/icons, still exact) ===
  try {
    const btnRegex = page
      .getByRole("button", {
        name: exactTextRe,
      })
      .first();
    if (await validateElement(btnRegex)) {
      return btnRegex;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2c: Filter by textContent EXACT (for submit buttons with icons) ===
  try {
    const btnByTextExact = page
      .locator("button")
      .filter({ hasText: exactTextRe })
      .first();
    if (await validateElement(btnByTextExact)) {
      return btnByTextExact;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2d: Role-based with contains (for cases with extra whitespace/icons) ===
  try {
    const btnContains = page
      .getByRole("button", { name: containsTextRe })
      .first();
    // === For contains, verify text content exact match to avoid false positives ===
    const textContent = await btnContains.textContent({ timeout: 2000 });
    if (textContent && exactTextRe.test(textContent.trim())) {
      if (await validateElement(btnContains)) {
        return btnContains;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2e: Button with contains text filter, then validate exact ===
  try {
    const btnByContains = page
      .locator("button")
      .filter({ hasText: containsTextRe })
      .first();
    const textContent = await btnByContains.textContent({ timeout: 2000 });
    if (textContent && exactTextRe.test(textContent.trim())) {
      if (await validateElement(btnByContains)) {
        return btnByContains;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2f: Fallback - Role-based without exact (if exact not found) ===
  try {
    const btn = page.getByRole("button", { name: t }).first();
    const textContent = await btn.textContent({ timeout: 2000 });
    if (textContent && exactTextRe.test(textContent.trim())) {
      if (await validateElement(btn)) {
        return btn;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2g: Button with title attribute (for icon buttons like Delete) ===
  try {
    const btnByTitle = page.locator(`button[title="${t}" i]`).first();
    if (await validateElement(btnByTitle)) {
      return btnByTitle;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2h: Button with aria-label ===
  try {
    const btnByAriaLabel = page.locator(`button[aria-label="${t}" i]`).first();
    if (await validateElement(btnByAriaLabel)) {
      return btnByAriaLabel;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2i: Button with title that contains (case-insensitive) ===
  try {
    const btnByTitleContains = page
      .locator("button")
      .filter({ has: page.locator(`[title*="${t}" i]`) })
      .first();
    if (await validateElement(btnByTitleContains)) {
      return btnByTitleContains;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2j: Button with aria-label that contains ===
  try {
    const btnByAriaLabelContains = page
      .locator("button")
      .filter({ has: page.locator(`[aria-label*="${t}" i]`) })
      .first();
    if (await validateElement(btnByAriaLabelContains)) {
      return btnByAriaLabelContains;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2k: Button with onclick containing text (for cases like deleteTransaction('ID')) ===
  try {
    const btnByOnclick = page.locator(`button[onclick*="${t}" i]`).first();
    if (await validateElement(btnByOnclick)) {
      return btnByOnclick;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2l: Button with icon that has title/aria-label in parent ===
  try {
    // === Search for icons with common classes, then find parent button ===
    const iconSelectors = [
      `i.bi-trash`,
      `i.bi-pencil`,
      `i.bi-x`,
      `i.bi-check`,
      `i.fa-trash`,
      `i.fa-pencil`,
      `svg[title="${t}" i]`,
      `svg[aria-label="${t}" i]`,
    ];

    for (const iconSel of iconSelectors) {
      try {
        const icon = page.locator(iconSel).first();
        if (await icon.isVisible({ timeout: 1000 })) {
          // === Check if parent button has matching title/aria-label ===
          const parentButton = icon.locator(
            "xpath=ancestor-or-self::button[1]"
          );
          const title = await parentButton
            .getAttribute("title")
            .catch(() => null);
          const ariaLabel = await parentButton
            .getAttribute("aria-label")
            .catch(() => null);

          if (
            (title && containsTextRe.test(title)) ||
            (ariaLabel && containsTextRe.test(ariaLabel))
          ) {
            if (await validateElement(parentButton)) {
              return parentButton;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2m: XPath for button with title attribute ===
  try {
    const xpathTitle = page
      .locator(
        `xpath=//button[@title="${t}" or contains(translate(@title, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${t.toLowerCase()}')]`
      )
      .first();
    if (await validateElement(xpathTitle)) {
      return xpathTitle;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2n: XPath for button with aria-label ===
  try {
    const xpathAriaLabel = page
      .locator(
        `xpath=//button[@aria-label="${t}" or contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${t.toLowerCase()}')]`
      )
      .first();
    if (await validateElement(xpathAriaLabel)) {
      return xpathAriaLabel;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2o: Button with class and title combination (for Bootstrap buttons) ===
  // Example: button.btn-outline-danger[title="Delete"]
  try {
    const btnByClassAndTitle = page.locator(`button[title="${t}" i]`).first();
    if (await validateElement(btnByClassAndTitle)) {
      return btnByClassAndTitle;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 2p: Button containing icon with matching title ===
  // === Search all buttons, then filter those with matching title/aria-label ===
  try {
    const allButtons = page.locator("button");
    const count = await allButtons.count();
    for (let i = 0; i < Math.min(count, 50); i++) {
      try {
        const btn = allButtons.nth(i);
        const title = await btn.getAttribute("title").catch(() => null);
        const ariaLabel = await btn
          .getAttribute("aria-label")
          .catch(() => null);
        const textContent = await btn
          .textContent({ timeout: 500 })
          .catch(() => "");

        // === Check if title/aria-label/textContent matches ===
        if (
          (title && containsTextRe.test(title)) ||
          (ariaLabel && containsTextRe.test(ariaLabel)) ||
          (textContent && exactTextRe.test(textContent.trim()))
        ) {
          if (await validateElement(btn)) {
            return btn;
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 3: Link exact match ===
  try {
    const linkExact = page.getByRole("link", { name: t, exact: true }).first();
    if (await validateElement(linkExact)) {
      return linkExact;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 3b: Link exact regex ===
  try {
    const linkRegex = page.getByRole("link", { name: exactTextRe }).first();
    if (await validateElement(linkRegex)) {
      return linkRegex;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 3c: Link contains with exact validation ===
  try {
    const link = page.getByRole("link", { name: t }).first();
    const textContent = await link.textContent({ timeout: 2000 });
    if (textContent && exactTextRe.test(textContent.trim())) {
      if (await validateElement(link)) {
        return link;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 4: Fallback CSS text selectors ===
  const esc = escapeForCssString(t);
  const candidates = [
    `button:text-is("${esc}")`,
    `button:has-text("${esc}")`,
    `a:has-text("${esc}")`,
    `[role="button"]:has-text("${esc}")`,
    `[role="menuitem"]:has-text("${esc}")`,
    `input[type="submit"][value="${esc}"]`,
    `input[type="button"][value="${esc}"]`,
  ];

  for (const sel of candidates) {
    try {
      const loc = page.locator(sel).first();
      const textContent = await loc
        .textContent({ timeout: 2000 })
        .catch(() => null);
      if (!textContent || exactTextRe.test(textContent.trim())) {
        if (await validateElement(loc)) {
          return loc;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // === Strategy 5: Find text then traverse to clickable ancestor ===
  try {
    const textLoc = page.getByText(t, { exact: true }).first();
    if (await textLoc.isVisible({ timeout: 2000 })) {
      const ancestorButton = textLoc.locator(
        "xpath=ancestor-or-self::button[1]"
      );
      if (await validateElement(ancestorButton)) {
        return ancestorButton;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  try {
    const textLoc = page.getByText(t).first();
    if (await textLoc.isVisible({ timeout: 2000 })) {
      const textContent = await textLoc.textContent({ timeout: 1000 });
      if (textContent && exactTextRe.test(textContent.trim())) {
        const ancestorRoleButton = textLoc.locator(
          'xpath=ancestor-or-self::*[@role="button"][1]'
        );
        if (await validateElement(ancestorRoleButton)) {
          return ancestorRoleButton;
        }
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  try {
    const textLoc = page.getByText(t).first();
    if (await textLoc.isVisible({ timeout: 2000 })) {
      const textContent = await textLoc.textContent({ timeout: 1000 });
      if (textContent && exactTextRe.test(textContent.trim())) {
        const ancestorLink = textLoc.locator("xpath=ancestor-or-self::a[1]");
        if (await validateElement(ancestorLink)) {
          return ancestorLink;
        }
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 6: XPath fallback for button with exact text ===
  try {
    const xpathButton = page
      .locator(
        `xpath=//button[normalize-space(text())="${t}" or normalize-space(.)="${t}"]`
      )
      .first();
    if (await validateElement(xpathButton)) {
      return xpathButton;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // === Strategy 7: XPath for element with role button ===
  try {
    const xpathRoleButton = page
      .locator(
        `xpath=//*[@role="button"][normalize-space(text())="${t}" or normalize-space(.)="${t}"]`
      )
      .first();
    if (await validateElement(xpathRoleButton)) {
      return xpathRoleButton;
    }
  } catch (e) {
    // Continue to next strategy
  }

  return null;
}

/**
 * Clicks an element identified by text content or CSS selector.
 * Uses multiple click strategies to ensure reliable interaction.
 *
 * @param {Page} page - Playwright page object.
 * @param {string} target - Text content or CSS selector to click.
 * @throws {Error} If the target cannot be found or all click strategies fail.
 */
export async function clickByTextOrSelector(page, target) {
  // === Locate the clickable element ===
  const locator = await getClickableLocator(page, target);
  if (!locator) {
    throw new Error(`Click target not found: ${target}`);
  }

  // === Ensure element is visible in viewport ===
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
  } catch (e) {
    // Ignore and continue
  }

  // === Wait for element to be ready (visible and enabled) ===
  try {
    await locator.waitFor({ state: "visible", timeout: 5000 });
  } catch (e) {
    // Ignore and continue
  }

  // === Try multiple click strategies for reliability ===
  const clickStrategies = [
    // === Strategy 1: Normal click with auto-wait ===
    async () => {
      await locator.click({ timeout: 10000 });
    },
    // === Strategy 2: Force click (for overlay/pointer-events issues) ===
    async () => {
      await locator.click({ timeout: 10000, force: true });
    },
    // === Strategy 3: JavaScript click (bypass event handlers) ===
    async () => {
      await locator.evaluate((el) => {
        if (el instanceof HTMLElement) {
          el.click();
        }
      });
    },
    // === Strategy 4: Manual click event dispatch ===
    async () => {
      await locator.dispatchEvent("click");
    },
  ];

  // === Attempt each strategy until one succeeds ===
  for (const strategy of clickStrategies) {
    try {
      await strategy();
      // === Wait briefly to ensure click is processed ===
      await page.waitForTimeout(500);
      return;
    } catch (e) {
      // === Try next strategy ===
      continue;
    }
  }

  // === All strategies failed, throw error ===
  throw new Error(`Failed to click target: ${target}`);
}
