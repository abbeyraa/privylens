/**
 * Export execution report to CSV format
 */
export function exportToCSV(report, plan, filename = "execution-report") {
  if (!report || !report.results) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const rows = [];
  
  // Header
  rows.push([
    "Row Index",
    "Status",
    "Duration (ms)",
    "Data",
    "Actions",
    "Error",
    "Warnings",
  ]);

  // Data rows
  report.results.forEach((result, idx) => {
    const rowIndex = result.rowIndex !== undefined ? result.rowIndex + 1 : idx + 1;
    const dataStr = result.data ? JSON.stringify(result.data) : "";
    const actionsStr = result.actions
      ? result.actions
          .map((a) => `${a.type}(${a.target || ""})${a.skipped ? " [SKIPPED]" : ""}`)
          .join("; ")
      : "";
    const errorStr = result.error || "";
    const warningsStr = result.warnings ? result.warnings.join("; ") : "";

    rows.push([
      rowIndex,
      result.status || "",
      result.duration || 0,
      dataStr,
      actionsStr,
      errorStr,
      warningsStr,
    ]);
  });

  // Summary
  if (report.summary) {
    rows.push([]);
    rows.push(["SUMMARY"]);
    rows.push(["Total", report.summary.total || 0]);
    rows.push(["Success", report.summary.success || 0]);
    rows.push(["Failed", report.summary.failed || 0]);
    rows.push(["Partial", report.summary.partial || 0]);
    rows.push(["Duration (ms)", report.duration || 0]);
    rows.push(["Safe Run", report.safeRun ? "Yes" : "No"]);
  }

  // Convert to CSV
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell || "");
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    )
    .join("\n");

  // Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export execution report to PDF format
 */
export async function exportToPDF(report, plan, filename = "execution-report") {
  // For PDF, we'll use a simple HTML to PDF approach
  // In production, you might want to use a library like jsPDF or pdfkit
  
  const htmlContent = generatePDFHTML(report, plan);
  
  // Create a new window and print
  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Optionally close after print
      // printWindow.close();
    }, 250);
  };
}

function generatePDFHTML(report, plan) {
  const date = new Date().toLocaleString("id-ID");
  const safeRunBadge = report.safeRun
    ? '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px;">SAFE RUN MODE</span>'
    : "";

  let resultsHTML = "";
  if (report.results && report.results.length > 0) {
    resultsHTML = report.results
      .map((result, idx) => {
        const rowIndex = result.rowIndex !== undefined ? result.rowIndex + 1 : idx + 1;
        const statusColor =
          result.status === "success"
            ? "#10b981"
            : result.status === "failed"
            ? "#ef4444"
            : "#f59e0b";

        return `
        <div style="border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 8px; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${result.status?.toUpperCase() || "UNKNOWN"}
            </span>
            <strong>Row ${rowIndex}</strong>
            ${result.duration ? `<span style="color: #6b7280; font-size: 12px;">(${result.duration}ms)</span>` : ""}
          </div>
          ${result.data ? `<div style="font-size: 12px; color: #374151; margin-bottom: 4px;"><strong>Data:</strong> ${JSON.stringify(result.data)}</div>` : ""}
          ${result.actions && result.actions.length > 0
            ? `<div style="font-size: 12px; color: #374151; margin-bottom: 4px;"><strong>Actions:</strong> ${result.actions.map(a => `${a.type}(${a.target || ""})${a.skipped ? " [SKIPPED]" : ""}`).join(", ")}</div>`
            : ""}
          ${result.error ? `<div style="font-size: 12px; color: #ef4444; margin-bottom: 4px;"><strong>Error:</strong> ${result.error}</div>` : ""}
          ${result.warnings && result.warnings.length > 0
            ? `<div style="font-size: 12px; color: #f59e0b; margin-bottom: 4px;"><strong>Warnings:</strong> ${result.warnings.join(", ")}</div>`
            : ""}
        </div>
      `;
      })
      .join("");
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Execution Report - ${filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #1f2937;
        }
        .header {
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .summary {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
        }
        .summary-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; color: #1f2937;">Execution Report</h1>
        <p style="margin: 8px 0; color: #6b7280;">Generated: ${date}</p>
        ${safeRunBadge}
      </div>

      ${report.summary
        ? `
        <div class="summary">
          <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 18px;">Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${report.summary.total || 0}</div>
              <div class="summary-label">Total</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #10b981;">${report.summary.success || 0}</div>
              <div class="summary-label">Success</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #ef4444;">${report.summary.failed || 0}</div>
              <div class="summary-label">Failed</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #f59e0b;">${report.summary.partial || 0}</div>
              <div class="summary-label">Partial</div>
            </div>
          </div>
          ${report.duration ? `<p style="margin-top: 16px; margin-bottom: 0; color: #6b7280; font-size: 14px;">Total Duration: ${(report.duration / 1000).toFixed(2)}s</p>` : ""}
        </div>
      `
        : ""}

      <div>
        <h2 style="font-size: 18px; margin-bottom: 16px;">Results</h2>
        ${resultsHTML || "<p style='color: #6b7280;'>No results available</p>"}
      </div>
    </body>
    </html>
  `;
}

