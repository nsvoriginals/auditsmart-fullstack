// lib/pdf-generator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  infoCount: number;
  scanDuration: number;
  deploymentVerdict: string;
  thinkingChain?: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  agentsUsed?: string[];
}

export async function generatePDFReport(data: PDFData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Modern Color Palette
    const colors = {
      primary: [97, 45, 83],      // Deep Plum
      primaryLight: [133, 57, 83], // Light Plum
      secondary: [237, 100, 166],  // Rose
      accent: [255, 193, 7],       // Amber
      critical: [220, 38, 38],     // Red
      high: [249, 115, 22],        // Orange
      medium: [234, 179, 8],       // Yellow
      low: [59, 130, 246],         // Blue
      info: [107, 114, 128],       // Gray
      success: [34, 197, 94],      // Green
      dark: [31, 41, 55],          // Dark slate
      light: [243, 244, 246],      // Light gray
      white: [255, 255, 255],
    };
    
    // Helper: Add colored text
    const addColoredText = (text: string, x: number, y: number, color: number[], fontSize = 10, fontStyle = "normal") => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(text, x, y);
    };
    
    // Helper: Add horizontal line
    const addLine = (y: number, color: number[] = colors.primary, lineWidth = 0.5) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(lineWidth);
      doc.line(20, y, pageWidth - 20, y);
    };
    
    let yPos = 20;
    
    // ============================================
    // HEADER WITH GRADIENT EFFECT
    // ============================================
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 50, "F");
    
    // Decorative accent bar
    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
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
    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.roundedRect(pageWidth - 55, 15, 40, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("SECURITY REPORT", pageWidth - 35, 28, { align: "center" });
    
    yPos = 65;
    
    // ============================================
    // REPORT METADATA CARD
    // ============================================
    // Card background
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(20, yPos, pageWidth - 40, 35, 5, 5, "F");
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
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
    for (const [label, value] of metadata) {
      addColoredText(label + ":", metaX, metaY, colors.dark, 9, "bold");
      addColoredText(value, metaX + 30, metaY, colors.dark, 9, "normal");
      metaY += 8;
    }
    
    yPos += 45;
    
    // ============================================
    // CONTRACT INFO CARD
    // ============================================
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "F");
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "D");
    
    addColoredText("📄 CONTRACT INFORMATION", 30, yPos + 8, colors.primary, 11, "bold");
    addColoredText(data.contractName, 30, yPos + 18, colors.dark, 10, "bold");
    
    yPos += 35;
    
    // Contract code preview
    if (data.contractCode) {
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 50, 5, 5, "F");
      
      addColoredText("💻 CONTRACT CODE PREVIEW", 30, yPos + 8, colors.primary, 10, "bold");
      
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
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.roundedRect(20, yPos, pageWidth - 40, 45, 5, 5, "F");
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(20, yPos, pageWidth - 40, 45, 5, 5, "D");
    
    addColoredText("🎯 RISK ASSESSMENT", 30, yPos + 8, colors.primary, 11, "bold");
    
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
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${riskPercent}`, centerX, centerY + 3, { align: "center" });
    
    // Risk level badge
    const riskBadgeX = centerX + 20;
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
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
      { label: "Info", value: data.infoCount, color: colors.info },
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
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(20, yPos, pageWidth - 40, 8, 3, 3, "F");
    addColoredText("📋 EXECUTIVE SUMMARY", 30, yPos + 5.5, colors.white, 10, "bold");
    
    yPos += 15;
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
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
      let verdictBg = [220, 252, 231];
      if (data.deploymentVerdict.includes("CAUTION")) {
        verdictColor = colors.medium;
        verdictBg = [254, 252, 232];
      } else if (data.deploymentVerdict.includes("DO NOT")) {
        verdictColor = colors.critical;
        verdictBg = [254, 242, 242];
      }
      
      doc.setFillColor(verdictBg[0], verdictBg[1], verdictBg[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "F");
      doc.setDrawColor(verdictColor[0], verdictColor[1], verdictColor[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 25, 5, 5, "D");
      
      addColoredText("⚠️ DEPLOYMENT VERDICT", 30, yPos + 8, verdictColor, 10, "bold");
      addColoredText(data.deploymentVerdict, 30, yPos + 18, colors.dark, 11, "bold");
      
      yPos += 35;
    }
    
    // ============================================
    // FINDINGS TABLE
    // ============================================
    if (data.findings && data.findings.length > 0) {
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 8, 3, 3, "F");
      addColoredText(`🔍 SECURITY FINDINGS (${data.findings.length})`, 30, yPos + 5.5, colors.white, 10, "bold");
      
      yPos += 15;
      
      const tableData = data.findings.slice(0, 15).map((finding) => [
        finding.title || "Unknown Issue",
        finding.severity?.toUpperCase() || "INFO",
        finding.lineNumber || "N/A",
        (finding.description || "").slice(0, 120) + ((finding.description || "").length > 120 ? "..." : ""),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["Vulnerability", "Severity", "Line", "Description"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: colors.primary,
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
          1: { cellWidth: 25 },
          2: { cellWidth: 18 },
          3: { cellWidth: "auto" },
        },
        didParseCell: (cellData) => {
          // Color code severity cells
          if (cellData.column.index === 1 && cellData.cell.raw) {
            const severity = String(cellData.cell.raw).toLowerCase();
            if (severity === "critical") cellData.cell.styles.textColor = colors.critical;
            else if (severity === "high") cellData.cell.styles.textColor = colors.high;
            else if (severity === "medium") cellData.cell.styles.textColor = colors.medium;
            else if (severity === "low") cellData.cell.styles.textColor = colors.low;
          }
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // ============================================
    // AI THINKING CHAIN
    // ============================================
    if (data.thinkingChain) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 8, 3, 3, "F");
      addColoredText("🧠 AI EXTENDED THINKING (Claude Opus)", 30, yPos + 5.5, colors.white, 9, "bold");
      
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
      
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 20, 5, 5, "F");
      
      addColoredText("🤖 AI AGENTS DEPLOYED", 30, yPos + 8, colors.primary, 9, "bold");
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