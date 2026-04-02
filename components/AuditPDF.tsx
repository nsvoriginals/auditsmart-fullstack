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

export function AuditPDF({ 
  auditId, 
  contractName, 
  buttonText = "Download PDF", 
  className = "" 
}: AuditPDFProps) {
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
      const safeName = contractName.replace(/[^a-z0-9]/gi, "_");
      a.download = `Audit_Report_${safeName}_${auditId.slice(0, 8)}.pdf`;
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
        className={`flex items-center gap-2 px-4 py-2 rounded-md bg-card border border-border text-foreground hover:bg-accent transition-all disabled:opacity-50 ${className}`}
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {buttonText}
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}