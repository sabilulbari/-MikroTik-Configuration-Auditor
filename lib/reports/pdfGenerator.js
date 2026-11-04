/**
 * PDF Audit Report Generator using jsPDF
 * 
 * Generates an enterprise-ready audit report for MikroTik RouterOS configurations.
 * Masks sensitive passwords/secrets in reports.
 * Includes page numbering, statistics summary, and rule failure diagnostic details.
 */

import { jsPDF } from "jspdf";

/**
 * Mask sensitive credentials such as password=..., secret=... in reported configuration snippets
 */
export function maskSensitiveCredentials(text) {
  if (!text) return "";
  return text
    .replace(/(password=["']?)([^"'\s]+)(["']?)/gi, '$1********$3')
    .replace(/(secret=["']?)([^"'\s]+)(["']?)/gi, '$1********$3')
    .replace(/(wpa2-pre-shared-key=["']?)([^"'\s]+)(["']?)/gi, '$1********$3');
}

export function generateAuditPdf({
  project = { name: "MikroTik Lab Project" },
  questions = [],
  generatedBy = "MikroTik Configuration Auditor",
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const total = questions.length;
  const completed = questions.filter((q) => q.status === "completed").length;
  const due = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const reportDate = new Date().toLocaleString();

  // Helper to check page break
  const ensureSpace = (requiredHeight) => {
    if (cursorY + requiredHeight > pageHeight - 18) {
      doc.addPage();
      cursorY = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("MikroTik Configuration Auditor — Lab Verification Report", margin, 9);
    doc.text(reportDate, pageWidth - margin, 9, { align: "right" });
    doc.setDrawColor(220, 225, 230);
    doc.line(margin, 11, pageWidth - margin, 11);
  };

  // --- Cover / Document Header ---
  // Top Banner
  doc.setFillColor(37, 99, 235); // Blue primary
  doc.roundedRect(margin, cursorY, contentWidth, 26, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("MikroTik Configuration Auditor", margin + 6, cursorY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(220, 235, 255);
  doc.text(`Project: ${project.name || "MikroTik Lab"}  •  Generated: ${reportDate}`, margin + 6, cursorY + 18);

  cursorY += 32;

  // --- Statistics Summary Grid ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, "FD");

  const statCols = [
    { label: "Total Tasks", val: String(total), color: [15, 23, 42] },
    { label: "Completed", val: String(completed), color: [16, 185, 129] },
    { label: "Pending", val: String(due), color: [245, 158, 11] },
    { label: "Compliance Rate", val: `${percentage}%`, color: [37, 99, 235] },
  ];

  const colWidth = contentWidth / 4;
  statCols.forEach((stat, i) => {
    const x = margin + i * colWidth + colWidth / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, x, cursorY + 7, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.val, x, cursorY + 16, { align: "center" });
  });

  cursorY += 28;

  // --- Section Title: Task Audit Details ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Detailed Task Audit Breakdown", margin, cursorY);
  cursorY += 6;

  // --- Questions List ---
  questions.forEach((q, idx) => {
    ensureSpace(30);

    const isDone = q.status === "completed";
    const statusColor = isDone ? [16, 185, 129] : [245, 158, 11];

    // Card boundary
    const startY = cursorY;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(isDone ? 180 : 220, isDone ? 230 : 220, isDone ? 200 : 220);
    doc.roundedRect(margin, startY, contentWidth, 18, 2, 2, "FD");

    // Left accent bar
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(margin, startY, 2.5, 18, "F");

    // Title & Number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`#${q.number}  ${q.title}`, margin + 6, startY + 7);

    // Category and RouterOS target
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Category: ${q.category}  |  RouterOS Target: ${q.routerOSVersion || "7.x"}`, margin + 6, startY + 13);

    // Status pill
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(isDone ? "COMPLETED" : "PENDING AUDIT", pageWidth - margin - 4, startY + 7, { align: "right" });

    cursorY += 21;

    // If configuration text exists, print masked snippet
    if (q.configText && q.configText.trim().length > 0) {
      ensureSpace(16);
      const masked = maskSensitiveCredentials(q.configText.trim());
      const firstLines = masked.split("\n").slice(0, 3).join("\n");

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin + 4, cursorY, contentWidth - 8, 12, 1, 1, "FD");

      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(firstLines, contentWidth - 14);
      doc.text(splitText.slice(0, 2), margin + 7, cursorY + 5);

      cursorY += 15;
    }

    // If verification rules results exist, render failed details & suggestions
    if (q.verificationResult && q.verificationResult.checks) {
      const failedChecks = q.verificationResult.checks.filter((c) => c.status !== "passed");
      if (failedChecks.length > 0) {
        ensureSpace(18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(225, 29, 72);
        doc.text("Identified Issues & Recommendations:", margin + 6, cursorY + 2);
        cursorY += 5;

        failedChecks.forEach((chk) => {
          ensureSpace(12);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          doc.text(`• ${chk.ruleTitle}: ${chk.explanation || "Requirement not met."}`, margin + 8, cursorY);
          cursorY += 4;

          if (chk.suggestedFix) {
            doc.setFont("courier", "bold");
            doc.setFontSize(7);
            doc.setTextColor(37, 99, 235);
            doc.text(`  Suggestion: ${chk.suggestedFix}`, margin + 8, cursorY);
            cursorY += 4.5;
          }
        });
      }
    }

    cursorY += 2;
  });

  // --- Add Page Numbers & Disclaimers to All Pages ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Bottom footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      "Static Configuration Audit Report — Verification evaluates syntax against defined lab criteria.",
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  // Save the PDF
  const filename = `MikroTik_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
