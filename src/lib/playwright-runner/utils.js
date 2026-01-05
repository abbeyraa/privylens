/**
 * Utility Functions Module
 *
 * Provides helper functions for string escaping used in CSS selectors and regex patterns.
 */

/**
 * Escapes a string for safe use in CSS selector strings.
 * Handles backslashes and double quotes that could break selector syntax.
 *
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string safe for CSS selector usage.
 */
export function escapeForCssString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Escapes a string for safe use in regular expressions.
 * Escapes all special regex characters to treat the string as literal text.
 *
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string safe for regex usage.
 */
export function escapeForRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
