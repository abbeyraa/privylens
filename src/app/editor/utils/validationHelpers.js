// Helper functions untuk validasi automation plan
export const validateAutomationPlan = ({
  targetUrl,
  pageReadyValue,
  requiresLogin,
  loginUrl,
  loginUsername,
  loginPassword,
  hasDataSourceNode,
  effectiveRows,
  fieldMappings,
  actionNodes,
  getActionFromNode,
  execution,
}) => {
  const errors = [];

  if (!targetUrl.trim()) {
    errors.push("Target URL harus diisi");
  }

  if (!pageReadyValue.trim()) {
    errors.push("Page Ready Indicator harus diisi");
  }

  if (requiresLogin) {
    if (!loginUrl.trim()) {
      errors.push("Login URL harus diisi");
    }
    if (!loginUsername.trim()) {
      errors.push("Username harus diisi");
    }
    if (!loginPassword.trim()) {
      errors.push("Password harus diisi");
    }
  }

  if (hasDataSourceNode) {
    if (!effectiveRows.length) {
      errors.push("Data source harus diisi");
    }
    if (!fieldMappings.length) {
      errors.push("Minimal satu field mapping harus didefinisikan");
    }
  }

  if (actionNodes.length === 0) {
    errors.push("Minimal satu action node harus ditambahkan");
  }

  if (!hasDataSourceNode) {
    const hasFill = actionNodes.some((n) => {
      const action = getActionFromNode(n);
      return action?.type === "fill";
    });
    if (hasFill) {
      errors.push(
        "Aksi 'fill' memerlukan node Sumber Data dan Field Mapping. Tambahkan node Sumber Data terlebih dahulu atau gunakan click/wait/navigate/handleDialog."
      );
    }
    if (execution?.mode === "loop") {
      const maxIt = Number(execution.loop?.maxIterations || 0);
      if (!maxIt || maxIt < 1) {
        errors.push("Max iterasi harus >= 1");
      }
      const stopValue = execution.loop?.indicator?.value?.trim();
      if (!stopValue) {
        errors.push("Stop condition harus diisi untuk mode loop");
      }
    }
  }

  return errors;
};
