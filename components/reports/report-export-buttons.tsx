"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportTableToExcel, exportElementToPDF } from "@/lib/export-utils";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

interface ReportExportButtonsProps {
  tableId: string;
  elementId: string;
  filename: string;
  className?: string;
}

export function ReportExportButtons({
  tableId,
  elementId,
  filename,
  className = "",
}: ReportExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportExcel = async () => {
    await exportTableToExcel(tableId, filename);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportElementToPDF(elementId, filename);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 items-center select-none ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        className="h-9 px-3 rounded-lg border-border/80 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-all duration-150"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Export Excel
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isExportingPDF}
        onClick={handleExportPDF}
        className="h-9 px-3 rounded-lg border-border/80 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-all duration-150"
      >
        {isExportingPDF ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </>
        )}
      </Button>
    </div>
  );
}
