"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportTableToExcel,
  exportElementToPDF,
  exportTableToJSON,
  exportTableToCSV,
  exportElementToPNG,
} from "@/lib/export-utils";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Image,
  FileCode,
  Braces,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleExportExcel = async () => {
    setIsLoading(true);
    try {
      await exportTableToExcel(tableId, filename);
      toast({
        title: "Excel Export Complete",
        description: `"${filename}.xlsx" saved successfully.`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Excel workbook creation encountered an error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      await exportElementToPDF(elementId, filename);
      toast({
        title: "PDF Export Complete",
        description: `"${filename}.pdf" saved successfully.`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "PDF compilation encountered an error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPNG = async () => {
    setIsLoading(true);
    try {
      await exportElementToPNG(elementId, filename);
      toast({
        title: "PNG Export Complete",
        description: `"${filename}.png" saved successfully.`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Image render capture encountered an error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      await exportTableToCSV(tableId, filename);
      toast({
        title: "CSV Export Complete",
        description: `"${filename}.csv" saved successfully.`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "CSV serialization encountered an error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setIsLoading(true);
    try {
      await exportTableToJSON(tableId, filename);
      toast({
        title: "JSON Export Complete",
        description: `"${filename}.json" saved successfully.`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "JSON data compiling encountered an error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="tour-export-dropdown"
          type="button"
          variant="outline"
          className={`h-9 px-4 rounded-xl border-border/60 text-xs font-black bg-surface hover:bg-muted/70 flex items-center gap-2 cursor-pointer shadow-sm select-none transition-all ${className}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
          ) : (
            <Download className="w-4 h-4 text-accent shrink-0" />
          )}
          <span>Export Data</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-2xl font-sans text-xs select-none z-50"
      >
        <DropdownMenuLabel className="px-3 py-2 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
          Compile &amp; Download
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />

        <DropdownMenuItem
          onClick={handleExportExcel}
          className="px-3 py-2 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex items-center gap-2.5 font-bold transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Excel Sheet (.xlsx)</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportPDF}
          className="px-3 py-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer flex items-center gap-2.5 font-bold transition-colors"
        >
          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
          <span>PDF Document (.pdf)</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportPNG}
          className="px-3 py-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center gap-2.5 font-bold transition-colors"
        >
          <Image className="w-4 h-4 text-blue-500 shrink-0" />
          <span>PNG Snapshot (.png)</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportCSV}
          className="px-3 py-2 rounded-xl hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer flex items-center gap-2.5 font-bold transition-colors"
        >
          <FileCode className="w-4 h-4 text-amber-500 shrink-0" />
          <span>CSV Text File (.csv)</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportJSON}
          className="px-3 py-2 rounded-xl hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer flex items-center gap-2.5 font-bold transition-colors"
        >
          <Braces className="w-4 h-4 text-violet-500 shrink-0" />
          <span>JSON Data Sheet (.json)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
