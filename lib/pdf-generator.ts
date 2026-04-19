// lib/pdf-generator.ts
//
// H-01: LOW-confidence findings are filtered before the PDF is built.
//       They remain in DB and the UI but are excluded from the printed report.
// M-03: AI disclaimer on Page 1 (required legal notice).

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { filterForPDF } from "./agents/dedup-engine";

interface PDFData {
  auditId: string;
  contractName: string;
  contractCode?: string | null;
  summary: string;
  riskScore: number;
  riskLevel: string;
  findings: any[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount?: number;
  scanDuration: number;
  deploymentVerdict: string;
  thinkingChain?: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  agentsUsed?: string[];
}

type RGB = [number, number, number];

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  navy:     [15,  23,  42]  as RGB,  // slate-900
  navyMid:  [30,  41,  59]  as RGB,  // slate-800
  dark:     [51,  65,  85]  as RGB,  // slate-700
  muted:    [100, 116, 139] as RGB,  // slate-500
  border:   [226, 232, 240] as RGB,  // slate-200
  bg:       [248, 250, 252] as RGB,  // slate-50
  white:    [255, 255, 255] as RGB,
  blue:     [37,  99,  235] as RGB,  // blue-600
  blueLight:[59,  130, 246] as RGB,  // blue-500
  critical: [220, 38,  38]  as RGB,  // red-600
  high:     [234, 88,  12]  as RGB,  // orange-600
  medium:   [202, 138, 4]   as RGB,  // amber-600
  low:      [22,  163, 74]  as RGB,  // green-600
  info:     [100, 116, 139] as RGB,  // slate-500
  safe:     [22,  163, 74]  as RGB,  // green-600
  amberBg:  [255, 251, 235] as RGB,  // amber-50
  amber:    [217, 119, 6]   as RGB,  // amber-600
  greenBg:  [240, 253, 244] as RGB,  // green-50
  redBg:    [254, 242, 242] as RGB,  // red-50
  indigoFaint: [245, 247, 255] as RGB,
};

export async function generatePDFReport(data: PDFData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const W  = doc.internal.pageSize.getWidth();   // 210 mm
    const H  = doc.internal.pageSize.getHeight();  // 297 mm
    const M  = 15;         // side margin
    const CW = W - M * 2;  // content width = 180 mm

    // ── Low-level drawing helpers ──────────────────────────────
    const setFill  = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
    const setDraw  = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
    const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
    const setFont  = (size: number, style: "bold" | "normal" | "italic" = "normal") => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
    };

    // ── Page-break guard ──────────────────────────────────────
    function guardPage(y: number, needed: number): number {
      if (y + needed > H - 18) {
        doc.addPage();
        drawContinuationHeader();
        return 18;
      }
      return y;
    }

    function drawContinuationHeader(): void {
      setFill(C.navy);
      doc.rect(0, 0, W, 7, "F");
      setFill(C.blue);
      doc.rect(0, 7, W, 1, "F");
    }

    // ── Reusable widgets ──────────────────────────────────────
    /** Draws a left-accent section label and returns the new y below it. */
    function sectionHeader(y: number, title: string): number {
      setFill(C.blue);
      doc.rect(M, y, 3, 7, "F");
      setColor(C.navy);
      setFont(9.5, "bold");
      doc.text(title, M + 7, y + 5.2);
      return y + 13;
    }

    /** Draws a card box (filled + border). */
    function card(y: number, h: number, bg: RGB = C.white): void {
      setFill(bg);
      doc.roundedRect(M, y, CW, h, 2, 2, "F");
      setDraw(C.border);
      doc.setLineWidth(0.25);
      doc.roundedRect(M, y, CW, h, 2, 2, "D");
    }

    /** Returns the severity color. */
    function sevColor(sev: string): RGB {
      switch (sev.toLowerCase()) {
        case "critical": return C.critical;
        case "high":     return C.high;
        case "medium":   return C.medium;
        case "low":      return C.low;
        default:         return C.info;
      }
    }

    // H-01: strip LOW-confidence findings from the printed report
    const pdfFindings = filterForPDF(data.findings);
    data = { ...data, findings: pdfFindings };

    // ──────────────────────────────────────────────────────────
    // PAGE 1 HEADER
    // ──────────────────────────────────────────────────────────
    setFill(C.navy);
    doc.rect(0, 0, W, 50, "F");

    // Blue accent rule under header
    setFill(C.blue);
    doc.rect(0, 48, W, 2.5, "F");

    // Brand
    setColor(C.white);
    setFont(26, "bold");
    doc.text("AUDITSMART", M, 26);

    setColor(C.blueLight);
    setFont(8.5, "normal");
    doc.text("Smart Contract Security Audit Report", M, 36);

    // Top-right badge
    setFill(C.blue);
    doc.roundedRect(W - M - 44, 15, 44, 20, 3, 3, "F");
    setColor(C.white);
    setFont(7.5, "bold");
    doc.text("SECURITY REPORT", W - M - 22, 23, { align: "center" });
    setColor(C.blueLight);
    setFont(6.5, "normal");
    doc.text(
      new Date(data.createdAt).toLocaleDateString("en-IN"),
      W - M - 22,
      29,
      { align: "center" }
    );

    let y = 57;

    // ──────────────────────────────────────────────────────────
    // M-03: DISCLAIMER
    // ──────────────────────────────────────────────────────────
    setFill(C.amberBg);
    doc.roundedRect(M, y, CW, 12, 2, 2, "F");
    setDraw([217, 180, 60] as RGB);
    doc.setLineWidth(0.35);
    doc.roundedRect(M, y, CW, 12, 2, 2, "D");

    setColor(C.amber);
    setFont(7, "bold");
    doc.text("DISCLAIMER:", M + 4, y + 7.5);
    setColor([120, 80, 0] as RGB);
    setFont(6.5, "normal");
    doc.text(
      "AI-generated security assessment. Not a professional audit. For informational purposes only. © Xorion Network LLC",
      M + 33,
      y + 7.5
    );
    y += 18;

    // ──────────────────────────────────────────────────────────
    // REPORT INFORMATION
    // ──────────────────────────────────────────────────────────
    y = sectionHeader(y, "REPORT INFORMATION");
    card(y, 30, C.white);

    const meta: Array<[string, string]> = [
      ["Report ID",  data.auditId.slice(0, 22) + "…"],
      ["Generated",  new Date(data.createdAt).toLocaleString("en-IN")],
      ["Client",     `${data.userName}  ·  ${data.userEmail}`],
    ];

    let my = y + 8.5;
    for (const [label, value] of meta) {
      setColor(C.muted);
      setFont(7, "bold");
      doc.text(label.toUpperCase(), M + 5, my);
      setColor(C.navyMid);
      setFont(8, "normal");
      doc.text(value, M + 42, my);
      my += 8;
    }
    y += 36;

    // ──────────────────────────────────────────────────────────
    // CONTRACT
    // ──────────────────────────────────────────────────────────
    y = sectionHeader(y, "CONTRACT");

    // Card with left-colored accent strip
    setFill(C.blue);
    doc.rect(M, y, 3, 18, "F");
    setFill(C.white);
    doc.rect(M + 3, y, CW - 3, 18, "F");
    setDraw(C.border);
    doc.setLineWidth(0.25);
    doc.rect(M + 3, y, CW - 3, 18, "D");

    setColor(C.navy);
    setFont(11, "bold");
    doc.text(data.contractName, M + 9, y + 7.5);
    setColor(C.muted);
    setFont(7, "normal");
    doc.text(
      `${data.findings.length} findings  ·  Scan duration: ${(data.scanDuration / 1000).toFixed(1)}s`,
      M + 9,
      y + 14
    );
    y += 24;

    // ──────────────────────────────────────────────────────────
    // RISK ASSESSMENT
    // ──────────────────────────────────────────────────────────
    y = guardPage(y, 60);
    y = sectionHeader(y, "RISK ASSESSMENT");
    card(y, 52, C.white);

    // ── Score circle ─────────────────────────────────────────
    const cx = M + 30;
    const cy = y + 28;
    const radius = 19;

    const scoreColor =
      data.riskScore >= 70 ? C.critical :
      data.riskScore >= 40 ? C.high :
      data.riskScore >= 20 ? C.medium :
      data.riskScore >= 10 ? C.blueLight :
      C.safe;

    setFill([241, 245, 249] as RGB);
    setDraw(C.border);
    doc.setLineWidth(0.4);
    doc.circle(cx, cy, radius, "FD");

    setColor(scoreColor);
    setFont(19, "bold");
    doc.text(String(data.riskScore), cx, cy + 3.5, { align: "center" });
    setColor(C.muted);
    setFont(6, "normal");
    doc.text("/ 100", cx, cy + 9, { align: "center" });

    setFill(scoreColor);
    doc.roundedRect(cx - 17, cy + 12, 34, 7, 2, 2, "F");
    setColor(C.white);
    setFont(6.5, "bold");
    doc.text(data.riskLevel.toUpperCase(), cx, cy + 17, { align: "center" });

    // ── Severity counts with mini-bar ─────────────────────────
    const sevStats = [
      { label: "Critical", count: data.criticalCount,    color: C.critical },
      { label: "High",     count: data.highCount,        color: C.high     },
      { label: "Medium",   count: data.mediumCount,      color: C.medium   },
      { label: "Low",      count: data.lowCount,         color: C.low      },
      { label: "Info",     count: data.infoCount ?? 0,   color: C.info     },
    ];

    const BAR_START = M + 70;
    let sy = y + 9;
    for (const { label, count, color } of sevStats) {
      // Dot
      setFill(color);
      doc.circle(BAR_START, sy - 1.5, 1.8, "F");
      // Label
      setColor(C.dark);
      setFont(7.5, "normal");
      doc.text(label, BAR_START + 5, sy);
      // Count
      setColor(C.navy);
      setFont(8, "bold");
      doc.text(String(count), BAR_START + 34, sy, { align: "right" });
      // Bar track
      const BAR_X = BAR_START + 37;
      const BAR_MAX = 38;
      const barFill = Math.min(BAR_MAX, count * 5);
      setFill(C.border);
      doc.rect(BAR_X, sy - 4, BAR_MAX, 3, "F");
      if (barFill > 0) {
        setFill(color);
        doc.rect(BAR_X, sy - 4, barFill, 3, "F");
      }
      sy += 8;
    }

    // ── Total findings summary ────────────────────────────────
    const totalX = W - M - 22;
    setColor(C.muted);
    setFont(6.5, "normal");
    doc.text("TOTAL", totalX, y + 18, { align: "center" });
    setColor(C.navy);
    setFont(24, "bold");
    doc.text(String(data.findings.length), totalX, y + 33, { align: "center" });
    setColor(C.muted);
    setFont(6, "normal");
    doc.text("unique issues", totalX, y + 39, { align: "center" });

    y += 58;

    // ──────────────────────────────────────────────────────────
    // DEPLOYMENT VERDICT
    // ──────────────────────────────────────────────────────────
    if (data.deploymentVerdict) {
      y = guardPage(y, 22);

      const isUnsafe  = data.deploymentVerdict.includes("DO NOT");
      const isCaution = data.deploymentVerdict.includes("CAUTION");
      const vColor    = isUnsafe ? C.critical : isCaution ? C.amber : C.safe;
      const vBg       = isUnsafe ? C.redBg    : isCaution ? C.amberBg : C.greenBg;

      setFill(vBg);
      doc.roundedRect(M, y, CW, 18, 2, 2, "F");
      setFill(vColor);
      doc.rect(M, y, 3, 18, "F");
      setDraw(vColor);
      doc.setLineWidth(0.3);
      doc.roundedRect(M, y, CW, 18, 2, 2, "D");

      setColor(vColor);
      setFont(7, "bold");
      doc.text("DEPLOYMENT VERDICT", M + 7, y + 7);
      setColor(C.navyMid);
      setFont(10, "bold");
      doc.text(data.deploymentVerdict, M + 7, y + 14);
      y += 24;
    }

    // ──────────────────────────────────────────────────────────
    // EXECUTIVE SUMMARY
    // ──────────────────────────────────────────────────────────
    y = guardPage(y, 42);
    y = sectionHeader(y, "EXECUTIVE SUMMARY");
    // Grow card height to fit summary — estimate ~5mm per line, max 12 lines = 60mm + padding
    const summaryLineCount = Math.min(12, doc.splitTextToSize(data.summary, CW - 14).length);
    const summaryCardH = Math.max(38, summaryLineCount * 5 + 14);
    card(y, summaryCardH, C.white);

    const summaryLines = doc.splitTextToSize(data.summary, CW - 14);
    let summaryY = y + 8;
    for (const line of summaryLines.slice(0, 12)) {
      setColor(C.dark);
      setFont(8.5, "normal");
      doc.text(line, M + 6, summaryY);
      summaryY += 5;
    }
    y += summaryCardH + 6;

    // ──────────────────────────────────────────────────────────
    // SECURITY FINDINGS TABLE
    // ──────────────────────────────────────────────────────────
    if (data.findings.length > 0) {
      y = guardPage(y, 28);
      y = sectionHeader(y, `SECURITY FINDINGS  (${data.findings.length})`);

      const tableRows = data.findings.slice(0, 30).map((f) => [
        f.type ?? f.title ?? "Unknown Issue",
        (f.severity ?? "info").toUpperCase(),
        f.function ?? f.locations?.split(",")[0]?.split("@")[0]?.trim() ?? "—",
        f.line ?? f.lineNumber?.toString() ?? "—",
        // Show full description — autoTable wraps text automatically
        (f.description ?? "").toString().slice(0, 300) +
          ((f.description ?? "").toString().length > 300 ? "…" : ""),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Vulnerability", "Severity", "Function", "Line", "Description"]],
        body: tableRows,
        margin: { left: M, right: M },
        theme: "plain",
        headStyles: {
          fillColor: C.navy,
          textColor: [255, 255, 255] as [number, number, number],
          fontSize: 8,
          fontStyle: "bold",
          cellPadding: { top: 4, bottom: 4, left: 5, right: 4 },
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 4 },
          textColor: C.dark,
          lineColor: C.border,
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: C.bg,
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: "bold" },
          1: { cellWidth: 22 },
          2: { cellWidth: 28 },
          3: { cellWidth: 14 },
          4: { cellWidth: "auto" },
        },
        didParseCell: (cellData) => {
          if (cellData.column.index === 1 && cellData.cell.raw) {
            const sev = String(cellData.cell.raw).toLowerCase();
            const col = sevColor(sev);
            if (cellData.cell.styles) {
              cellData.cell.styles.textColor = col;
              cellData.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      const docAny = doc as jsPDF & { lastAutoTable: { finalY: number } };
      y = docAny.lastAutoTable.finalY + 12;
    }

    // ──────────────────────────────────────────────────────────
    // AI THINKING CHAIN  (deep audit only)
    // ──────────────────────────────────────────────────────────
    if (data.thinkingChain) {
      y = guardPage(y, 65);
      y = sectionHeader(y, "AI EXTENDED THINKING  (Claude Opus)");
      card(y, 60, C.indigoFaint);

      const thinkLines = doc.splitTextToSize(
        data.thinkingChain.slice(0, 1200),
        CW - 14
      );
      let ty = y + 8;
      for (const line of thinkLines.slice(0, 18)) {
        setColor([80, 90, 130] as RGB);
        setFont(7, "normal");
        doc.text(line, M + 6, ty);
        ty += 4.5;
      }
      y += 66;
    }

    // ──────────────────────────────────────────────────────────
    // AGENTS DEPLOYED
    // ──────────────────────────────────────────────────────────
    if (data.agentsUsed && data.agentsUsed.length > 0) {
      y = guardPage(y, 20);
      y = sectionHeader(y, "AI AGENTS DEPLOYED");
      card(y, 14, C.bg);
      setColor(C.muted);
      setFont(7.5, "normal");
      doc.text(data.agentsUsed.slice(0, 10).join("  ·  "), M + 6, y + 9);
      y += 20;
    }

    // ──────────────────────────────────────────────────────────
    // FOOTER  (every page) - UPDATED
    // ──────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    
    // Generate timestamp for footer
    const footerDate = new Date();
    const formattedDate = footerDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    const formattedTime = footerDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const timezone = "UTC";
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Separator line
      setDraw(C.border);
      doc.setLineWidth(0.25);
      doc.line(M, H - 42, W - M, H - 42);

      // Main footer text block
      setColor(C.muted);
      setFont(6.5, "normal");
      
      // First line of footer - disclaimer
      const footerText1 = "This report was generated by AuditSmart AI Security Platform. It is a pre-audit triage tool and does not replace a full manual security audit.";
      const footerLines1 = doc.splitTextToSize(footerText1, CW);
      let footerY = H - 37;
      for (const line of footerLines1) {
        doc.text(line, M, footerY);
        footerY += 4;
      }
      
      // Second line
      const footerText2 = "AuditSmart uses multi-agent AI analysis to identify potential vulnerabilities, but no automated tool can guarantee 100% coverage. For production contracts handling significant value, a professional manual audit is recommended.";
      const footerLines2 = doc.splitTextToSize(footerText2, CW);
      for (const line of footerLines2) {
        doc.text(line, M, footerY);
        footerY += 4;
      }
      
      // Third line - generation info
      footerY += 2;
      setFont(6, "normal");
      doc.text(`Generated on ${formattedDate} at ${formattedTime} ${timezone} — auditsmart.org`, M, footerY);
      
      // Page number on the right
      doc.text(`Page ${i} of ${totalPages}`, W - M, H - 12, { align: "right" });
      

    }

    resolve(Buffer.from(doc.output("arraybuffer")));
  });
}