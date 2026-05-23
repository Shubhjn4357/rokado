"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { 
  BookOpen, 
  CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  ArrowLeftRight, 
  Edit3, 
  TrendingUp, 
  Coins, 
  TrendingDown, 
  ArrowRightLeft
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/types";
import { getDailyComparisonData, saveManualBookEntry } from "@/app/(erp)/reports/actions";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";

export default function DualBookPage() {
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [comparison, setComparison] = useState<{
    software: { cashSales: number; creditSales: number; moneyReceived: number; moneyPaid: number };
    manual: { cashSales: number; creditSales: number; moneyReceived: number; moneyPaid: number; notes: string };
  }>({
    software: { cashSales: 0, creditSales: 0, moneyReceived: 0, moneyPaid: 0 },
    manual: { cashSales: 0, creditSales: 0, moneyReceived: 0, moneyPaid: 0, notes: "" },
  });

  const [formManual, setFormManual] = useState({
    cashSales: "0",
    creditSales: "0",
    moneyReceived: "0",
    moneyPaid: "0",
    notes: "",
  });

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setDate(todayStr);
    fetchData(todayStr);
  }, []);

  const fetchData = async (selectedDate = date) => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const data = await getDailyComparisonData(selectedDate);
      setComparison(data);
      setFormManual({
        cashSales: String(data.manual.cashSales),
        creditSales: String(data.manual.creditSales),
        moneyReceived: String(data.manual.moneyReceived),
        moneyPaid: String(data.manual.moneyPaid),
        notes: data.manual.notes || "",
      });
    } catch (err) {
      console.error("Failed to load comparison data:", err);
      toast({
        title: "Error",
        description: "Failed to load comparison data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (val: string) => {
    setDate(val);
    fetchData(val);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const manualData = {
        cashSales: parseFloat(formManual.cashSales) || 0,
        creditSales: parseFloat(formManual.creditSales) || 0,
        moneyReceived: parseFloat(formManual.moneyReceived) || 0,
        moneyPaid: parseFloat(formManual.moneyPaid) || 0,
        notes: formManual.notes,
      };

      const res = await saveManualBookEntry(date, manualData);
      if (res.success) {
        toast({
          title: "Saved Successfully",
          description: "Manual book totals updated and matched.",
        });
        setIsEditing(false);
        fetchData(date);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      toast({
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Failed to save manual entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDiff = (soft: number, man: number) => soft - man;

  const rows = [
    {
      title: "Cash Sales",
      icon: Coins,
      color: "text-emerald-500 bg-emerald-500/10",
      soft: comparison.software.cashSales,
      man: comparison.manual.cashSales,
    },
    {
      title: "Credit Sales",
      icon: TrendingUp,
      color: "text-blue-500 bg-blue-500/10",
      soft: comparison.software.creditSales,
      man: comparison.manual.creditSales,
    },
    {
      title: "Money Received (Receipts)",
      icon: ArrowRightLeft,
      color: "text-indigo-500 bg-indigo-500/10",
      soft: comparison.software.moneyReceived,
      man: comparison.manual.moneyReceived,
    },
    {
      title: "Money Paid (Payments)",
      icon: TrendingDown,
      color: "text-rose-500 bg-rose-500/10",
      soft: comparison.software.moneyPaid,
      man: comparison.manual.moneyPaid,
    },
  ];

  const totalDiscrepancies = rows.filter(r => Math.abs(calculateDiff(r.soft, r.man)) > 0).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Dual Book Mode <span className="text-xs bg-primary/20 text-primary font-normal px-2 py-0.5 rounded-full">Onboarding Coach</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compare daily totals from paper shop diaries side-by-side with software invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-[180px] bg-card border-border/60"
          />
        </div>
      </div>

      {totalDiscrepancies === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Perfect Match! Today&apos;s manual book entries are fully aligned with software invoices.
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Reconciliation Alert: {totalDiscrepancies} columns contain discrepancies between physical shop books and ERP totals.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60 rounded-2xl bg-card/60 backdrop-blur overflow-hidden" id="dual-book-report">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Side-by-Side Verification</CardTitle>
              <CardDescription>Comparison table for selected date.</CardDescription>
            </div>
            <ReportExportButtons
              tableId="dual-book-table"
              elementId="dual-book-report"
              filename={`dual-book-comparison_${date || "date"}`}
            />
          </CardHeader>
          <CardContent className="p-0">
            <Table id="dual-book-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">ERP Software Total</TableHead>
                  <TableHead className="text-right">Manual Book Diary</TableHead>
                  <TableHead className="text-right">Difference / Mismatch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => {
                  const Icon = row.icon;
                  const diff = calculateDiff(row.soft, row.man);
                  const isMatch = Math.abs(diff) === 0;

                  return (
                    <TableRow key={idx} className="hover:bg-muted/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${row.color} flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-sm">{row.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(row.soft)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.man)}</TableCell>
                      <TableCell className={`text-right font-mono text-sm font-bold ${
                        isMatch ? "text-emerald-500" : "text-rose-500"
                      }`}>
                        {isMatch ? "Matched" : formatCurrency(diff)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60 rounded-2xl bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Log Manual Entries
            </CardTitle>
            <CardDescription>Enter physical book totals for {date}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="cashSales" className="text-xs font-semibold">Manual Cash Sales</Label>
                <Input
                  id="cashSales"
                  type="number"
                  value={formManual.cashSales}
                  onChange={(e) => setFormManual({ ...formManual, cashSales: e.target.value })}
                  placeholder="0"
                  className="mt-1 bg-background"
                />
              </div>

              <div>
                <Label htmlFor="creditSales" className="text-xs font-semibold">Manual Credit Sales</Label>
                <Input
                  id="creditSales"
                  type="number"
                  value={formManual.creditSales}
                  onChange={(e) => setFormManual({ ...formManual, creditSales: e.target.value })}
                  placeholder="0"
                  className="mt-1 bg-background"
                />
              </div>

              <div>
                <Label htmlFor="moneyReceived" className="text-xs font-semibold">Manual Money Collected</Label>
                <Input
                  id="moneyReceived"
                  type="number"
                  value={formManual.moneyReceived}
                  onChange={(e) => setFormManual({ ...formManual, moneyReceived: e.target.value })}
                  placeholder="0"
                  className="mt-1 bg-background"
                />
              </div>

              <div>
                <Label htmlFor="moneyPaid" className="text-xs font-semibold">Manual Money Paid</Label>
                <Input
                  id="moneyPaid"
                  type="number"
                  value={formManual.moneyPaid}
                  onChange={(e) => setFormManual({ ...formManual, moneyPaid: e.target.value })}
                  placeholder="0"
                  className="mt-1 bg-background"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs font-semibold">Uncle Muneem Diary Notes</Label>
                <Textarea
                  id="notes"
                  value={formManual.notes}
                  onChange={(e) => setFormManual({ ...formManual, notes: e.target.value })}
                  placeholder="Write any comments regarding physical cash drawer or discrepancy notes..."
                  className="mt-1 bg-background resize-none h-20"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-2 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Save Manual Entries
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
