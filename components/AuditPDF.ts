// components/AuditPDF.tsx
"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface AuditPDFProps {
  auditId: string;
  contractName: string;
  buttonText?: string;
  className?: string;
}

export function AuditPDF({ auditId, contractName, buttonText = "Download PDF", className = "" }: AuditPDFProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  const downloadPDF = async () => {
    setIsDownloading(true);
    setError("");

    try {
      const response = await fetch(`/api/audit/report/${auditId}/pdf`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit_Report_${contractName.replace(/[^a-z0-9]/gi, "_")}_${auditId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      setError(err instanceof Error ? err.message : "Download failed");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <button
        onClick={downloadPDF}
        disabled={isDownloading}
        className={`flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50 ${className}`}
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            {buttonText}
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}