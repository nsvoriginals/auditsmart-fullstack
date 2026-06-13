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
  navy:     [15,  23,  42]  as RGB,
  navyMid:  [30,  41,  59]  as RGB,
  dark:     [51,  65,  85]  as RGB,
  muted:    [100, 116, 139] as RGB,
  border:   [226, 232, 240] as RGB,
  bg:       [248, 250, 252] as RGB,
  white:    [255, 255, 255] as RGB,
  blue:     [37,  99,  235] as RGB,
  blueLight:[59,  130, 246] as RGB,
  critical: [220, 38,  38]  as RGB,
  high:     [234, 88,  12]  as RGB,
  medium:   [202, 138, 4]   as RGB,
  low:      [22,  163, 74]  as RGB,
  info:     [100, 116, 139] as RGB,
  safe:     [22,  163, 74]  as RGB,
  amberBg:  [255, 251, 235] as RGB,
  amber:    [217, 119, 6]   as RGB,
  greenBg:  [240, 253, 244] as RGB,
  redBg:    [254, 242, 242] as RGB,
  indigoFaint: [245, 247, 255] as RGB,
};

// Page geometry — single source of truth for layout
const PAGE = {
  M:         15,   // side margin
  TOP_PG1:   57,   // start Y on page 1 (after big brand header)
  TOP_CONT:  18,   // start Y on continuation pages
  FOOTER:    20,   // reserved footer zone at bottom (line + 2 small text rows)
};

export async function generatePDFReport(data: PDFData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const W  = doc.internal.pageSize.getWidth();   // 210 mm
    const H  = doc.internal.pageSize.getHeight();  // 297 mm
    const M  = PAGE.M;
    const CW = W - M * 2;                          // content width = 180 mm
    const CONTENT_BOTTOM = H - PAGE.FOOTER;        // y at which content must stop

    // ── Low-level drawing helpers ──────────────────────────────
    const setFill  = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
    const setDraw  = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
    const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
    const setFont  = (size: number, style: "bold" | "normal" | "italic" = "normal") => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
    };

    // ── Page-break guard ──────────────────────────────────────
    // Returns the y at which to draw next. If `needed` mm of content won't fit
    // above the footer zone, starts a new page and returns the continuation-top y.
    function guardPage(y: number, needed: number): number {
      if (y + needed > CONTENT_BOTTOM) {
        doc.addPage();
        drawContinuationHeader();
        return PAGE.TOP_CONT;
      }
      return y;
    }

    function drawContinuationHeader(): void {
      setFill(C.navy);
      doc.rect(0, 0, W, 7, "F");
      setFill(C.blue);
      doc.rect(0, 7, W, 1, "F");
    }

    function sectionHeader(y: number, title: string): number {
      setFill(C.blue);
      doc.rect(M, y, 3, 7, "F");
      setColor(C.navy);
      setFont(9.5, "bold");
      doc.text(title, M + 7, y + 5.2);
      return y + 13;
    }

    function card(y: number, h: number, bg: RGB = C.white): void {
      setFill(bg);
      doc.roundedRect(M, y, CW, h, 2, 2, "F");
      setDraw(C.border);
      doc.setLineWidth(0.25);
      doc.roundedRect(M, y, CW, h, 2, 2, "D");
    }

    function sevColor(sev: string): RGB {
      switch (sev.toLowerCase()) {
        case "critical": return C.critical;
        case "high":     return C.high;
        case "medium":   return C.medium;
        case "low":      return C.low;
        default:         return C.info;
      }
    }

    // Renders text with automatic page-breaking. Returns the new y.
    function drawWrappedText(text: string, y: number, opts: {
      maxWidth: number;
      lineHeight: number;
      fontSize: number;
      color: RGB;
      bold?: boolean;
      xOffset?: number;
    }): number {
      const x = M + (opts.xOffset ?? 0);
      const lines = doc.splitTextToSize(text, opts.maxWidth);
      setColor(opts.color);
      setFont(opts.fontSize, opts.bold ? "bold" : "normal");
      for (const line of lines) {
        y = guardPage(y, opts.lineHeight);
        doc.text(line, x, y);
        y += opts.lineHeight;
      }
      return y;
    }

    // H-01: strip LOW-confidence findings from the printed report
    const pdfFindings = filterForPDF(data.findings);
    data = { ...data, findings: pdfFindings };

    // ──────────────────────────────────────────────────────────
    // PAGE 1 HEADER
    // ──────────────────────────────────────────────────────────
    setFill(C.navy);
    doc.rect(0, 0, W, 50, "F");
    setFill(C.blue);
    doc.rect(0, 48, W, 2.5, "F");

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
      new Date(data.createdAt).toLocaleDateString("en-US"),
      W - M - 22,
      29,
      { align: "center" }
    );

    let y = PAGE.TOP_PG1;

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
      "AI-generated security assessment. Not a professional audit. For informational purposes only.",
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
      ["Report ID",  data.auditId.length > 24 ? data.auditId.slice(0, 22) + "…" : data.auditId],
      ["Generated",  new Date(data.createdAt).toLocaleString("en-US")],
      ["Client",     `${data.userName}  ·  ${data.userEmail}`],
    ];

    let my = y + 8.5;
    for (const [label, value] of meta) {
      setColor(C.muted);
      setFont(7, "bold");
      doc.text(label.toUpperCase(), M + 5, my);
      setColor(C.navyMid);
      setFont(8, "normal");
      // Truncate value if it overflows
      const valueMaxWidth = CW - 42 - 5;
      const valueLines = doc.splitTextToSize(value, valueMaxWidth);
      doc.text(valueLines[0], M + 42, my);
      my += 8;
    }
    y += 36;

    // ──────────────────────────────────────────────────────────
    // CONTRACT
    // ──────────────────────────────────────────────────────────
    y = sectionHeader(y, "CONTRACT");

    setFill(C.blue);
    doc.rect(M, y, 3, 18, "F");
    setFill(C.white);
    doc.rect(M + 3, y, CW - 3, 18, "F");
    setDraw(C.border);
    doc.setLineWidth(0.25);
    doc.rect(M + 3, y, CW - 3, 18, "D");

    setColor(C.navy);
    setFont(11, "bold");
    // Truncate contract name if it would overflow
    const contractNameLines = doc.splitTextToSize(data.contractName, CW - 14);
    doc.text(contractNameLines[0], M + 9, y + 7.5);
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
    y = guardPage(y, 62);
    y = sectionHeader(y, "RISK ASSESSMENT");
    card(y, 52, C.white);

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
      setFill(color);
      doc.circle(BAR_START, sy - 1.5, 1.8, "F");
      setColor(C.dark);
      setFont(7.5, "normal");
      doc.text(label, BAR_START + 5, sy);
      setColor(C.navy);
      setFont(8, "bold");
      doc.text(String(count), BAR_START + 34, sy, { align: "right" });
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
      const verdictLines = doc.splitTextToSize(data.deploymentVerdict, CW - 14);
      doc.text(verdictLines[0], M + 7, y + 14);
      y += 24;
    }

    // ──────────────────────────────────────────────────────────
    // EXECUTIVE SUMMARY (no truncation — wraps across pages)
    // ──────────────────────────────────────────────────────────
    if (data.summary && data.summary.trim().length > 0) {
      y = guardPage(y, 20);
      y = sectionHeader(y, "EXECUTIVE SUMMARY");

      // Draw a left accent strip + light bg behind the summary text
      const summaryLines = doc.splitTextToSize(data.summary, CW - 14);
      const LINE_H = 5;
      const PADDING = 8;

      // Render summary lines with page-break support
      let summaryY = y + PADDING - 1;
      const initialY = y;
      let pageStartY = initialY;
      let linesOnThisPage = 0;

      for (let i = 0; i < summaryLines.length; i++) {
        if (summaryY + LINE_H > CONTENT_BOTTOM) {
          // Close current page's background card
          const cardH = (linesOnThisPage * LINE_H) + (PADDING * 2) - 2;
          setFill(C.white);
          doc.roundedRect(M, pageStartY, CW, cardH, 2, 2, "F");
          setDraw(C.border);
          doc.setLineWidth(0.25);
          doc.roundedRect(M, pageStartY, CW, cardH, 2, 2, "D");
          // Re-draw the lines on top (they were already drawn, but we need them above the bg)
          // Actually, we need to draw the bg FIRST. Let's switch strategy: draw text after card.
          break;
        }
        linesOnThisPage++;
        summaryY += LINE_H;
      }

      // Strategy: pre-compute how many lines fit on current page, draw card+text, then continue
      // Easier: render line by line, drawing card per page.
      let cursorY = y + PADDING;
      let pageCardStart = y;
      let pageCardLines = 0;

      const flushCard = () => {
        if (pageCardLines === 0) return;
        const cardH = pageCardLines * LINE_H + PADDING * 2 - 2;
        // Draw card BEHIND the text we already drew. jsPDF allows this — graphics state.
        // Actually we draw text first, then card on top — text will be hidden.
        // Simpler: draw card with white fill BEFORE text, by deferring text.
        // We'll skip the card here and rely on whitespace + section header.
      };

      // Render directly — no background card, just clean indented text.
      cursorY = y + 2;
      for (const line of summaryLines) {
        cursorY = guardPage(cursorY, LINE_H);
        setColor(C.dark);
        setFont(8.5, "normal");
        doc.text(line, M + 6, cursorY + 3);
        cursorY += LINE_H;
      }
      y = cursorY + 6;
    }

    // ──────────────────────────────────────────────────────────
    // SECURITY FINDINGS TABLE — full descriptions, no truncation
    // ──────────────────────────────────────────────────────────
    if (data.findings.length > 0) {
      y = guardPage(y, 28);
      y = sectionHeader(y, `SECURITY FINDINGS  (${data.findings.length})`);

      const tableRows = data.findings.map((f) => [
        f.type ?? f.title ?? "Unknown Issue",
        (f.severity ?? "info").toUpperCase(),
        f.function ?? f.locations?.split(",")[0]?.split("@")[0]?.trim() ?? "—",
        f.line ?? f.lineNumber?.toString() ?? "—",
        (f.description ?? "").toString().trim() || "—",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Vulnerability", "Severity", "Function", "Line", "Description"]],
        body: tableRows,
        margin: { left: M, right: M, bottom: PAGE.FOOTER + 4, top: PAGE.TOP_CONT },
        theme: "plain",
        styles: {
          overflow: "linebreak",
          cellWidth: "wrap",
          valign: "top",
        },
        headStyles: {
          fillColor: C.navy,
          textColor: [255, 255, 255] as [number, number, number],
          fontSize: 8,
          fontStyle: "bold",
          cellPadding: { top: 4, bottom: 4, left: 5, right: 4 },
          halign: "left",
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: { top: 4, bottom: 4, left: 5, right: 4 },
          textColor: C.dark,
          lineColor: C.border,
          lineWidth: 0.2,
          overflow: "linebreak",
        },
        alternateRowStyles: { fillColor: C.bg },
        columnStyles: {
          0: { cellWidth: 36, fontStyle: "bold", textColor: C.navy },
          1: { cellWidth: 18, halign: "left" },
          2: { cellWidth: 26, font: "courier", fontSize: 7 },
          3: { cellWidth: 12, halign: "right" },
          4: { cellWidth: "auto" }, // ~88mm — proper room for descriptions
        },
        rowPageBreak: "auto",  // allow a tall row to split across pages
        showHead: "everyPage", // repeat header on each page
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
        didDrawPage: () => {
          // Ensure continuation header on autoTable-created pages
          // (autoTable adds pages internally; we redraw the navy bar)
          if (doc.getCurrentPageInfo().pageNumber > 1) {
            drawContinuationHeader();
          }
        },
      });

      const docAny = doc as jsPDF & { lastAutoTable: { finalY: number } };
      y = docAny.lastAutoTable.finalY + 12;
    }

    // ──────────────────────────────────────────────────────────
    // AI EXTENDED THINKING — full content, paginated automatically
    // ──────────────────────────────────────────────────────────
    if (data.thinkingChain && data.thinkingChain.trim().length > 0) {
      y = guardPage(y, 24);
      y = sectionHeader(y, "AI EXTENDED THINKING  (Claude Opus)");

      const thinkLines = doc.splitTextToSize(data.thinkingChain.trim(), CW - 14);
      const LINE_H = 4.5;
      let ty = y + 2;
      for (const line of thinkLines) {
        ty = guardPage(ty, LINE_H);
        setColor([80, 90, 130] as RGB);
        setFont(7, "normal");
        doc.text(line, M + 6, ty + 3);
        ty += LINE_H;
      }
      y = ty + 8;
    }

    // ──────────────────────────────────────────────────────────
    // AGENTS DEPLOYED
    // ──────────────────────────────────────────────────────────
    if (data.agentsUsed && data.agentsUsed.length > 0) {
      y = guardPage(y, 22);
      y = sectionHeader(y, "AI AGENTS DEPLOYED");

      const agentsText = data.agentsUsed.join("  ·  ");
      const agentLines = doc.splitTextToSize(agentsText, CW - 14);
      const cardH = Math.max(14, agentLines.length * 4.5 + 8);
      card(y, cardH, C.bg);
      setColor(C.muted);
      setFont(7.5, "normal");
      let ay = y + 7;
      for (const line of agentLines) {
        doc.text(line, M + 6, ay);
        ay += 4.5;
      }
      y += cardH + 8;
    }

    // ──────────────────────────────────────────────────────────
    // FOOTER  (clean, compact, on every page)
    // ──────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    const footerDate = new Date(data.createdAt);
    const generatedAt = footerDate.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Hairline divider 14mm from bottom
      setDraw(C.border);
      doc.setLineWidth(0.25);
      doc.line(M, H - 14, W - M, H - 14);

      // Left: brand · domain · generation date (single compact line)
      setColor(C.muted);
      setFont(6.5, "normal");
      doc.text(`AuditSmart Security  ·  auditsmart.io  ·  Generated ${generatedAt}`, M, H - 9);

      // Center hairline accent (subtle brand mark)
      // (none — keeping it minimal)

      // Right: page number
      setColor(C.navyMid);
      setFont(6.5, "bold");
      doc.text(`${i} / ${totalPages}`, W - M, H - 9, { align: "right" });
    }

    resolve(Buffer.from(doc.output("arraybuffer")));
  });
}
