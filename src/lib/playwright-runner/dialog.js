/**
 * Installs an auto-accept handler for browser dialogs (alert, confirm, prompt) if needed.
 * Prevents dialogs from blocking automation execution by automatically accepting them.
 *
 * @param {Page} page - Playwright page object.
 * @param {Object} plan - Automation plan configuration.
 * @param {boolean} force - Force installation even if no handleDialog action exists (default: false).
 */
export function installDialogAutoAcceptIfNeeded(page, plan, force = false) {
  // === Determine if dialog handler should be installed ===
  const shouldInstall =
    force ||
    (Array.isArray(plan?.actions) &&
      plan.actions.some((a) => a?.type === "handleDialog"));
  if (!shouldInstall) return;
  
  // === Prevent duplicate installation ===
  if (page.__privylensDialogAutoAcceptInstalled) return;
  page.__privylensDialogAutoAcceptInstalled = true;

  // === Install dialog event handler to auto-accept all dialogs ===
  page.on("dialog", async (dialog) => {
    try {
      await dialog.accept();
    } catch (e) {
      // Ignore errors (dialog may have been closed already)
    }
  });
}
