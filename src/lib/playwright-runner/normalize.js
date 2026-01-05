/**
 * Normalizes an automation plan to ensure valid data structure.
 * Validates required fields and provides safe defaults for optional fields.
 *
 * @param {Object} plan - The automation plan object from the UI.
 * @returns {Object} A normalized and validated automation plan.
 * @throws {Error} If the plan is invalid or missing required fields.
 */
export function normalizePlan(plan) {
  // === Validate plan object structure ===
  if (!plan || typeof plan !== "object") {
    throw new Error("Automation plan tidak valid");
  }

  // === Normalize and validate target configuration ===
  const target = plan.target || {};
  if (!target.url) {
    throw new Error("Target URL tidak ditemukan di plan");
  }
  if (!target.pageReadyIndicator?.type || !target.pageReadyIndicator?.value) {
    throw new Error("Page Ready Indicator tidak valid di plan");
  }

  // === Normalize data source configuration with safe defaults ===
  const dataSource =
    plan.dataSource && typeof plan.dataSource === "object"
      ? plan.dataSource
      : {
          type: "manual",
          rows: [{}],
          mode: "single",
          selectedRowIndex: 0,
        };

  const rows = Array.isArray(dataSource.rows) ? dataSource.rows : [{}];
  const safeDataSource = {
    type: dataSource.type || "manual",
    rows: rows.length > 0 ? rows : [{}],
    mode: dataSource.mode === "batch" ? "batch" : "single",
    ...(dataSource.selectedRowIndex !== undefined
      ? { selectedRowIndex: dataSource.selectedRowIndex }
      : {}),
  };

  // === Return normalized plan with validated arrays ===
  return {
    ...plan,
    target,
    dataSource: safeDataSource,
    fieldMappings: Array.isArray(plan.fieldMappings) ? plan.fieldMappings : [],
    actions: Array.isArray(plan.actions) ? plan.actions : [],
  };
}
