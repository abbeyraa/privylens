/**
 * Playwright Sandbox Functions
 *
 * File terpisah untuk fungsi-fungsi Playwright yang digunakan di Sandbox.
 * Menggunakan syntax Playwright terbaru dan modern API.
 *
 * Note: File ini dijalankan server-side (Node.js) melalui API routes.
 */

/**
 * Load Playwright dynamically
 */
async function loadPlaywright() {
  try {
    const playwright = await import("playwright");
    return playwright;
  } catch (error) {
    throw new Error(`Failed to load Playwright: ${error.message}`);
  }
}

/**
 * Launch browser dengan konfigurasi modern
 * @param {Object} options - Browser options
 * @returns {Promise<Object>} Browser instance
 */
export async function launchBrowser(options = {}) {
  const { chromium } = await loadPlaywright();

  const browserOptions = {
    headless: options.headless ?? false,
    channel: options.channel ?? "chromium",
    args: options.args ?? [],
    ...options,
  };

  const browser = await chromium.launch(browserOptions);
  return browser;
}

/**
 * Create new browser context dengan konfigurasi modern
 * @param {Object} browser - Browser instance
 * @param {Object} contextOptions - Context options
 * @returns {Promise<Object>} Browser context
 */
export async function createContext(browser, contextOptions = {}) {
  const context = await browser.newContext({
    viewport: contextOptions.viewport ?? { width: 1280, height: 720 },
    userAgent: contextOptions.userAgent,
    locale: contextOptions.locale ?? "id-ID",
    timezoneId: contextOptions.timezoneId ?? "Asia/Jakarta",
    ...contextOptions,
  });

  return context;
}

/**
 * Navigate to URL dengan modern API
 * @param {Object} page - Page instance
 * @param {string} url - URL to navigate
 * @param {Object} options - Navigation options
 * @returns {Promise<Object>} Response object
 */
export async function navigateToUrl(page, url, options = {}) {
  const navigationOptions = {
    waitUntil: options.waitUntil ?? "domcontentloaded",
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const response = await page.goto(url, navigationOptions);
  return response;
}

/**
 * Wait for selector dengan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Wait options
 * @returns {Promise<Object>} Element locator
 */
export async function waitForSelector(page, selector, options = {}) {
  const waitOptions = {
    state: options.state ?? "visible",
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  await locator.waitFor({
    state: waitOptions.state,
    timeout: waitOptions.timeout,
  });
  return locator;
}

/**
 * Click element menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Click options
 * @returns {Promise<void>}
 */
export async function clickElement(page, selector, options = {}) {
  const clickOptions = {
    timeout: options.timeout ?? 30000,
    force: options.force ?? false,
    ...options,
  };

  const locator = page.locator(selector);
  await locator.click(clickOptions);
}

/**
 * Fill input field menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {string} value - Value to fill
 * @param {Object} options - Fill options
 * @returns {Promise<void>}
 */
export async function fillInput(page, selector, value, options = {}) {
  const fillOptions = {
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  await locator.fill(value, fillOptions);
}

/**
 * Type text dengan human-like typing menggunakan modern API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {string} text - Text to type
 * @param {Object} options - Type options
 * @returns {Promise<void>}
 */
export async function typeText(page, selector, text, options = {}) {
  const typeOptions = {
    delay: options.delay ?? 50,
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  await locator.type(text, typeOptions);
}

/**
 * Get text content menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Get options
 * @returns {Promise<string>} Text content
 */
export async function getTextContent(page, selector, options = {}) {
  const getOptions = {
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  const text = await locator.textContent(getOptions);
  return text ?? "";
}

/**
 * Get attribute value menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {string} attribute - Attribute name
 * @param {Object} options - Get options
 * @returns {Promise<string|null>} Attribute value
 */
export async function getAttribute(page, selector, attribute, options = {}) {
  const getOptions = {
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  const value = await locator.getAttribute(attribute, getOptions);
  return value;
}

/**
 * Check if element exists menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Check options
 * @returns {Promise<boolean>} True if element exists
 */
export async function elementExists(page, selector, options = {}) {
  const checkOptions = {
    timeout: options.timeout ?? 5000,
    ...options,
  };

  try {
    const locator = page.locator(selector);
    await locator.waitFor({ state: "attached", timeout: checkOptions.timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Take screenshot menggunakan modern API
 * @param {Object} page - Page instance
 * @param {Object} options - Screenshot options
 * @returns {Promise<Buffer>} Screenshot buffer
 */
export async function takeScreenshot(page, options = {}) {
  const screenshotOptions = {
    type: options.type ?? "png",
    fullPage: options.fullPage ?? false,
    path: options.path,
    ...options,
  };

  const buffer = await page.screenshot(screenshotOptions);
  return buffer;
}

/**
 * Evaluate JavaScript in page context
 * @param {Object} page - Page instance
 * @param {Function|string} script - JavaScript to evaluate
 * @param {any} arg - Argument to pass to script
 * @returns {Promise<any>} Evaluation result
 */
export async function evaluateScript(page, script, arg = null) {
  const result = await page.evaluate(script, arg);
  return result;
}

/**
 * Wait for navigation menggunakan modern API
 * @param {Object} page - Page instance
 * @param {Function} action - Action that triggers navigation
 * @param {Object} options - Wait options
 * @returns {Promise<Object>} Response object
 */
export async function waitForNavigation(page, action, options = {}) {
  const waitOptions = {
    waitUntil: options.waitUntil ?? "domcontentloaded",
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const [response] = await Promise.all([
    page.waitForNavigation(waitOptions),
    action(),
  ]);

  return response;
}

/**
 * Select option dari dropdown menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {string|Array} values - Option value(s) to select
 * @param {Object} options - Select options
 * @returns {Promise<void>}
 */
export async function selectOption(page, selector, values, options = {}) {
  const selectOptions = {
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  await locator.selectOption(values, selectOptions);
}

/**
 * Get all elements matching selector menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Get options
 * @returns {Promise<Array>} Array of element locators
 */
export async function getAllElements(page, selector, options = {}) {
  const getOptions = {
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  const count = await locator.count();
  const elements = [];

  for (let i = 0; i < count; i++) {
    elements.push(locator.nth(i));
  }

  return elements;
}

/**
 * Hover over element menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Hover options
 * @returns {Promise<void>}
 */
export async function hoverElement(page, selector, options = {}) {
  const hoverOptions = {
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  await locator.hover(hoverOptions);
}

/**
 * Scroll to element menggunakan modern Locator API
 * @param {Object} page - Page instance
 * @param {string} selector - CSS selector
 * @param {Object} options - Scroll options
 * @returns {Promise<void>}
 */
export async function scrollToElement(page, selector, options = {}) {
  const scrollOptions = {
    timeout: options.timeout ?? 30000,
    ...options,
  };

  const locator = page.locator(selector);
  await locator.scrollIntoViewIfNeeded(scrollOptions);
}

/**
 * Wait for network idle menggunakan modern API
 * @param {Object} page - Page instance
 * @param {Object} options - Wait options
 * @returns {Promise<void>}
 */
export async function waitForNetworkIdle(page, options = {}) {
  const waitOptions = {
    timeout: options.timeout ?? 30000,
    idleTime: options.idleTime ?? 500,
    ...options,
  };

  await page.waitForLoadState("networkidle", { timeout: waitOptions.timeout });
}

/**
 * Execute sandbox script - Main function untuk menjalankan script Playwright
 * @param {Object} config - Sandbox configuration
 * @returns {Promise<Object>} Execution result
 */
export async function executeSandboxScript(config) {
  const { url, headless = false, actions = [], timeout = 30000 } = config;

  let browser = null;
  let context = null;
  let page = null;

  try {
    // Launch browser
    browser = await launchBrowser({ headless });

    // Create context
    context = await createContext(browser);

    // Create page
    page = await context.newPage();

    // Set default timeout
    page.setDefaultTimeout(timeout);

    // Navigate to URL
    if (url) {
      await navigateToUrl(page, url);
    }

    // Execute actions
    const results = [];
    for (const action of actions) {
      try {
        let result = null;

        switch (action.type) {
          case "click":
            await clickElement(page, action.selector, action.options);
            result = {
              success: true,
              action: "click",
              selector: action.selector,
            };
            break;

          case "fill":
            await fillInput(
              page,
              action.selector,
              action.value,
              action.options
            );
            result = {
              success: true,
              action: "fill",
              selector: action.selector,
            };
            break;

          case "type":
            await typeText(page, action.selector, action.text, action.options);
            result = {
              success: true,
              action: "type",
              selector: action.selector,
            };
            break;

          case "getText":
            const text = await getTextContent(
              page,
              action.selector,
              action.options
            );
            result = {
              success: true,
              action: "getText",
              selector: action.selector,
              value: text,
            };
            break;

          case "getAttribute":
            const attr = await getAttribute(
              page,
              action.selector,
              action.attribute,
              action.options
            );
            result = {
              success: true,
              action: "getAttribute",
              selector: action.selector,
              value: attr,
            };
            break;

          case "screenshot":
            const screenshot = await takeScreenshot(page, action.options);
            result = {
              success: true,
              action: "screenshot",
              data: screenshot.toString("base64"),
            };
            break;

          case "evaluate":
            const evalResult = await evaluateScript(
              page,
              action.script,
              action.arg
            );
            result = { success: true, action: "evaluate", value: evalResult };
            break;

          case "wait":
            await page.waitForTimeout(action.duration ?? 1000);
            result = {
              success: true,
              action: "wait",
              duration: action.duration,
            };
            break;

          case "waitForSelector":
            await waitForSelector(page, action.selector, action.options);
            result = {
              success: true,
              action: "waitForSelector",
              selector: action.selector,
            };
            break;

          default:
            result = {
              success: false,
              error: `Unknown action type: ${action.type}`,
            };
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          action: action.type,
          error: error.message,
        });
      }
    }

    // Take final screenshot
    const finalScreenshot = await takeScreenshot(page, { fullPage: true });

    return {
      success: true,
      results,
      screenshot: finalScreenshot.toString("base64"),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    // Cleanup
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
}
