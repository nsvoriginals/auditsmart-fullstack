// H-01: LOW-confidence findings are filtered out before the PDF is built.
//       They remain in the DB and UI but are excluded from the printed report
//       to avoid credibility issues with paying customers.
// M-03: AI disclaimer box added on Page 1 (required legal notice).
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

// Type for RGB color values
type RGBColor = [number, number, number];

// Helper function to convert RGB color for jsPDF
const toColor = (color: RGBColor): RGBColor => [color[0], color[1], color[2]];

export async function generatePDFReport(data: PDFData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Modern Color Palette as RGB tuples
    const colors = {
      primary: [97, 45, 83] as RGBColor,
      primaryLight: [133, 57, 83] as RGBColor,
      secondary: [237, 100, 166] as RGBColor,
      accent: [255, 193, 7] as RGBColor,
      critical: [220, 38, 38] as RGBColor,
      high: [249, 115, 22] as RGBColor,
      medium: [234, 179, 8] as RGBColor,
      low: [59, 130, 246] as RGBColor,
      info: [107, 114, 128] as RGBColor,
      success: [34, 197, 94] as RGBColor,
      dark: [31, 41, 55] as RGBColor,
      light: [243, 244, 246] as RGBColor,
      white: [255, 255, 255] as RGBColor,
    };
    
    // Helper: Add colored text
    const addColoredText = (text: string, x: number, y: number, color: RGBColor, fontSize = 10, fontStyle = "normal") => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);
      const [r, g, b] = toColor(color);
      doc.setTextColor(r, g, b);
      doc.text(text, x, y);
    };
    
    // Helper: Add horizontal line
    const addLine = (y: number, color: RGBColor = colors.primary, lineWidth = 0.5) => {
      const [r, g, b] = toColor(color);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(lineWidth);
      doc.line(20, y, pageWidth - 20, y);
    };
    
    let yPos = 20;
    
    // ============================================
    // HEADER WITH GRADIENT EFFECT
    // ============================================
    const [pR, pG, pB] = toColor(colors.primary);
    doc.setFillColor(pR, pG, pB);
    doc.rect(0, 0, pageWidth, 50, "F");
    
    // Decorative accent bar
    const [sR, sG, sB] = toColor(colors.secondary);
    doc.setFillColor(sR, sG, sB);
    doc.rect(0, 45, pageWidth, 5, "F");
    
    // Logo and Title
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("AUDITSMART", 20, 28);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("AI-Powered Smart Contract Security Audit", 20, 38);
    
    // Report badge
    doc.setFillColor(sR, sG, sB);
    doc.roundedRect(pageWidth - 55, 15, 40, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("SECURITY REPORT", pageWidth - 35, 28, { align: "center" });
    
    yPos = 65;

    // ============================================
    // M-03: AI DISCLAIMER BOX — visible on Page 1
    // ============================================
    doc.setFillColor(255, 251, 230); // amber-tint background
    doc.setDrawColor(234, 179, 8);   // amber border
    doc.setLineWidth(0.8);
    doc.roundedRect(20, yPos, pageWidth - 40, 14, 3, 3, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 90, 0);
    doc.text("DISCLAIMER:", 25, yPos + 5.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      "AI-generated security assessment. Not a professional audit. For informational purposes only. © Xorion Network LLC",
      65, yPos + 5.5
    );
    yPos += 20;

    // H-01: Filter LOW-confidence findings from PDF
    // (they are still stored in DB and shown in the UI)
    const pdfFindings = filterForPDF(data.findings);
    data = { ...data, findings: pdfFindings };

    // ============================================
    // REPORT METADATA CARD
    // ============================================
    // Card background
    const [lR, lG, lB] = toColor(colors.light);
    doc.setFillColor(lR, lG, lB);
    doc.roundedRect(20, yPos, pageWidth - 40, 35, 5, 5, "F");
    doc.setDrawColor(pR, pG, pB);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, yPos, pageWidth - 40, 35, 5, 5, "D");
    
    // Metadata in table format
    const metadata = [
      ["Report ID", data.auditId.slice(0, 16) + "..."],
      ["Date", new Date(data.createdAt).toLocaleString()],
      ["Client", `${data.userName} (${data.userEmail})`],
    ];
    
    let metaX = 30;
    let metaY = yPos + 10;
    const [dR, dG, dB] = toColor(colors.dark);
    for (const [label, value] of metadata) {
      addColoredText(label + ":", metaX, metaY, colors.dark, 9, "bold");
      addColoredText(value, metaX + 30, metaY, colors.dark, 9, "normal");
      metaY += 8;
    }
    
    yPos += 45;
    
    // ============================================
    // CONTRACT INFO CARD
    // ============================================
    const [wR, wG, wB] = toColor(colors.white);
    doc.setFillColor(wR, wG, wB);
    doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "F");
    doc.setDrawColor(pR, pG, pB);
    doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "D");
    
    addColoredText("CONTRACT INFORMATION", 30, yPos + 8, colors.primary, 11, "bold");
    addColoredText(data.contractName, 30, yPos + 18, colors.dark, 10, "bold");
    
    yPos += 35;
    
    // Contract code preview (if available)
    if (data.contractCode) {
      doc.setFillColor(lR, lG, lB);
      doc.roundedRect(20, yPos, pageWidth - 40, 50, 5, 5, "F");
      
      addColoredText("CONTRACT CODE PREVIEW", 30, yPos + 8, colors.primary, 10, "bold");
      
      const codePreview = data.contractCode.slice(0, 500);
      const codeLines = codePreview.split("\n").slice(0, 8);
      let codeY = yPos + 18;
      for (const line of codeLines) {
        addColoredText(line.slice(0, 80), 30, codeY, [100, 100, 100], 7, "normal");
        codeY += 4.5;
      }
      
      yPos += 60;
    }
    
    // ============================================
    // RISK SCORE GAUGE SECTION
    // ============================================
    doc.setFillColor(wR, wG, wB);
    doc.roundedRect(20, yPos, pageWidth - 40, 45, 5, 5, "F");
    doc.setDrawColor(pR, pG, pB);
    doc.roundedRect(20, yPos, pageWidth - 40, 45, 5, 5, "D");
    
    addColoredText("RISK ASSESSMENT", 30, yPos + 8, colors.primary, 11, "bold");
    
    // Risk score circle
    const centerX = 55;
    const centerY = yPos + 28;
    const radius = 15;
    const riskPercent = data.riskScore;
    
    // Background circle
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.circle(centerX, centerY, radius, "FD");
    
    // Score text
    let scoreColor = colors.success;
    if (riskPercent >= 70) scoreColor = colors.critical;
    else if (riskPercent >= 50) scoreColor = colors.high;
    else if (riskPercent >= 30) scoreColor = colors.medium;
    else if (riskPercent >= 10) scoreColor = colors.low;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const [scR, scG, scB] = toColor(scoreColor);
    doc.setTextColor(scR, scG, scB);
    doc.text(`${riskPercent}`, centerX, centerY + 3, { align: "center" });
    
    // Risk level badge
    const riskBadgeX = centerX + 20;
    doc.setFillColor(scR, scG, scB);
    doc.roundedRect(riskBadgeX, centerY - 6, 40, 10, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(data.riskLevel, riskBadgeX + 20, centerY, { align: "center" });
    
    // Finding stats
    const stats = [
      { label: "Critical", value: data.criticalCount, color: colors.critical },
      { label: "High", value: data.highCount, color: colors.high },
      { label: "Medium", value: data.mediumCount, color: colors.medium },
      { label: "Low", value: data.lowCount, color: colors.low },
      { label: "Info", value: data.infoCount || 0, color: colors.info },
    ];
    
    let statsX = pageWidth - 100;
    let statsY = yPos + 12;
    for (const stat of stats) {
      addColoredText(`${stat.label}:`, statsX, statsY, stat.color, 9, "bold");
      addColoredText(`${stat.value}`, statsX + 25, statsY, colors.dark, 9, "bold");
      statsY += 7;
    }
    
    yPos += 55;
    
    // ============================================
    // EXECUTIVE SUMMARY
    // ============================================
    doc.setFillColor(pR, pG, pB);
    doc.roundedRect(20, yPos, pageWidth - 40, 8, 3, 3, "F");
    addColoredText("EXECUTIVE SUMMARY", 30, yPos + 5.5, colors.white, 10, "bold");
    
    yPos += 15;
    doc.setFillColor(wR, wG, wB);
    doc.roundedRect(20, yPos, pageWidth - 40, 45, 5, 5, "F");
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(20, yPos, pageWidth - 40, 45, 5, 5, "D");
    
    const summaryLines = doc.splitTextToSize(data.summary, pageWidth - 60);
    let summaryY = yPos + 10;
    for (const line of summaryLines.slice(0, 8)) {
      addColoredText(line, 30, summaryY, colors.dark, 9, "normal");
      summaryY += 5;
    }
    
    yPos += 55;
    
    // ============================================
    // DEPLOYMENT VERDICT
    // ============================================
    if (data.deploymentVerdict) {
      let verdictColor = colors.success;
      let verdictBg: RGBColor = [220, 252, 231];
      if (data.deploymentVerdict.includes("CAUTION")) {
        verdictColor = colors.medium;
        verdictBg = [254, 252, 232];
      } else if (data.deploymentVerdict.includes("DO NOT")) {
        verdictColor = colors.critical;
        verdictBg = [254, 242, 242];
      }
      
      const [vbR, vbG, vbB] = toColor(verdictBg);
      doc.setFillColor(vbR, vbG, vbB);
      doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "F");
      const [vcR, vcG, vcB] = toColor(verdictColor);
      doc.setDrawColor(vcR, vcG, vcB);
      doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "D");
      
      addColoredText("DEPLOYMENT VERDICT", 30, yPos + 8, verdictColor, 10, "bold");
      addColoredText(data.deploymentVerdict, 30, yPos + 18, colors.dark, 11, "bold");
      
      yPos += 35;
    }
    
    // ============================================
    // FINDINGS TABLE
    // ============================================
    if (data.findings && data.findings.length > 0) {
      doc.setFillColor(pR, pG, pB);
      doc.roundedRect(20, yPos, pageWidth - 40, 8, 3, 3, "F");
      addColoredText(`SECURITY FINDINGS (${data.findings.length})`, 30, yPos + 5.5, colors.white, 10, "bold");
      
      yPos += 15;
      
      const tableData = data.findings.slice(0, 15).map((finding) => [
        finding.type || "Unknown Issue",
        (finding.severity?.toUpperCase() || "INFO") + (finding.confidence ? ` [${finding.confidence}]` : ""),
        finding.line || "N/A",
        (finding.description || "").slice(0, 120) + ((finding.description || "").length > 120 ? "..." : ""),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["Vulnerability", "Severity", "Line", "Description"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [pR, pG, pB],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "left",
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineColor: [220, 220, 220],
          textColor: [50, 50, 50],
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 30 },
          2: { cellWidth: 18 },
          3: { cellWidth: "auto" },
        },
        didParseCell: (cellData) => {
          // Color code severity cells
          if (cellData.column.index === 1 && cellData.cell.raw) {
            const severityText = String(cellData.cell.raw).toLowerCase();
            const [cR, cG, cB] = toColor(
              severityText.includes("critical") ? colors.critical :
              severityText.includes("high") ? colors.high :
              severityText.includes("medium") ? colors.medium :
              severityText.includes("low") ? colors.low :
              colors.info
            );
            if (cellData.cell.styles) {
              cellData.cell.styles.textColor = [cR, cG, cB];
            }
          }
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // ============================================
    // AI THINKING CHAIN (Deep Audit only)
    // ============================================
    if (data.thinkingChain) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      const [sR2, sG2, sB2] = toColor(colors.secondary);
      doc.setFillColor(sR2, sG2, sB2);
      doc.roundedRect(20, yPos, pageWidth - 40, 8, 3, 3, "F");
      addColoredText("AI EXTENDED THINKING (Claude Opus)", 30, yPos + 5.5, colors.white, 9, "bold");
      
      yPos += 15;
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(20, yPos, pageWidth - 40, 45, 5, 5, "F");
      
      const thinkingPreview = data.thinkingChain.slice(0, 600);
      const thinkingLines = doc.splitTextToSize(thinkingPreview, pageWidth - 60);
      let thinkY = yPos + 10;
      for (const line of thinkingLines.slice(0, 12)) {
        addColoredText(line, 30, thinkY, [100, 100, 120], 7, "normal");
        thinkY += 4;
      }
      
      yPos += 55;
    }
    
    // ============================================
    // AGENTS USED
    // ============================================
    if (data.agentsUsed && data.agentsUsed.length > 0) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFillColor(lR, lG, lB);
      doc.roundedRect(20, yPos, pageWidth - 40, 20, 5, 5, "F");
      
      addColoredText("AI AGENTS DEPLOYED", 30, yPos + 8, colors.primary, 9, "bold");
      const agentsText = data.agentsUsed.slice(0, 8).join(" • ");
      addColoredText(agentsText, 30, yPos + 16, colors.dark, 7, "normal");
      
      yPos += 30;
    }
    
    // ============================================
    // FOOTER
    // ============================================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`AuditSmart Security Report - ${data.contractName}`, 20, pageHeight - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 8, { align: "right" });
    }
    
    // ============================================
    // Generate PDF
    // ============================================
    const pdfOutput = doc.output("arraybuffer");
    resolve(Buffer.from(pdfOutput));
  });
}