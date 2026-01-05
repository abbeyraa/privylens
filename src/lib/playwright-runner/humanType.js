/**
 * Types text with human-like typing effect using random delays between characters.
 * Simulates natural typing behavior to avoid detection as automated input.
 *
 * @param {Locator} element - Playwright locator for the input element.
 * @param {string} text - Text to type into the element.
 * @param {Object} options - Configuration options.
 * @param {number} options.minDelay - Minimum delay per character in milliseconds (default: 50).
 * @param {number} options.maxDelay - Maximum delay per character in milliseconds (default: 150).
 */
export async function humanType(element, text, options = {}) {
  const { minDelay = 50, maxDelay = 150 } = options;
  const textStr = String(text || "");

  if (!textStr) return;

  // === Clear the field first ===
  await element.clear();

  // === Focus on the element ===
  await element.focus();

  // === Type each character with random delay to simulate human typing ===
  for (let i = 0; i < textStr.length; i++) {
    const char = textStr[i];
    // === Generate random delay between minDelay and maxDelay ===
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    await element.type(char, { delay: Math.round(delay) });
  }
}
