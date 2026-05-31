"use client";

import { formatDate } from "@/lib/types";
import React, { useState, useEffect, Fragment } from "react";
import { fetchAuditLogsAction } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";

export default function AuditPage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditEntries, setAuditEntries] = useState<Array<any>>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Default to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDateFrom(thirtyDaysAgo.toISOString().split("T")[0] ?? null);
    setDateTo(today.toISOString().split("T")[0] ?? null);
    fetchAuditLog();
  }, []);

  const fetchAuditLog = async () => {
    setLoading(true);
    try {
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : undefined;
      const toDate = dateTo ? new Date(dateTo).getTime() : undefined;

      const result = await fetchAuditLogsAction({
        dateFrom: fromDate,
        dateTo: toDate,
        entityType: entityType ?? undefined,
        actionType: actionType ?? undefined,
      });

      if (!result.success || !result.data) {
        setAuditEntries([]);
        return;
      }

      const processedEntries = result.data.map(entry => ({
        ...entry,
        timestamp: Number(entry.createdAt),
        entityType: entry.entity,
        performedBy: entry.userId,
        changes: {
          before: entry.before ? JSON.parse(entry.before) : {},
          after: entry.after ? JSON.parse(entry.after) : {}
        }
      }));

      setAuditEntries(processedEntries);
    } catch (err) {
      console.error("Failed to fetch audit log:", err);
      setAuditEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Audit Trail Report</CardTitle>
          <CardDescription>
            View all system changes and user actions for compliance and debugging
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-4 sm:mt-0">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-4 h-4" />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Calendar
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={(value: any) => {
                  setDateFrom(value?.toISOString().split("T")[0] ?? null);
                  fetchAuditLog();
                }}
                className="w-48"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-4 h-4" />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Calendar
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={(value: any) => {
                  setDateTo(value?.toISOString().split("T")[0] ?? null);
                  fetchAuditLog();
                }}
                className="w-48"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Label className="block mb-2 font-medium">Entity Type</Label>
            <Select
              value={entityType ?? "all"}
              onValueChange={(value) => {
                setEntityType(value === "all" ? null : value);
                fetchAuditLog();
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All entity types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entity types</SelectItem>
                <SelectItem value="companies">Companies</SelectItem>
                <SelectItem value="ledgers">Ledgers</SelectItem>
                <SelectItem value="vouchers">Vouchers</SelectItem>
                <SelectItem value="inventory_items">Inventory Items</SelectItem>
                <SelectItem value="voucher_entries">Voucher Entries</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-3">
            <Label className="block mb-2 font-medium">Action Type</Label>
            <Select
              value={actionType ?? "all"}
              onValueChange={(value) => {
                setActionType(value === "all" ? null : value);
                fetchAuditLog();
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="CANCEL">Cancel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchAuditLog} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <Card id="audit-report">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : auditEntries.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No audit entries found for the selected criteria.
            </div>
          ) : (
            <Table id="audit-table" className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-6 py-3">Timestamp</th>
                  <th className="text-left px-6 py-3">Entity Type</th>
                  <th className="text-left px-6 py-3">Action</th>
                  <th className="text-left px-6 py-3">Entity ID</th>
                  <th className="text-left px-6 py-3">Performed By</th>
                  <th className="text-left px-6 py-3">Changes Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {auditEntries.map((entry, index) => (
                  <Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedRowId(expandedRowId === entry.id ? null : entry.id)}
                      className="hover:bg-muted/50 cursor-pointer select-none transition-colors border-b border-border/30"
                    >
                      <td className="px-6 py-4 text-left text-sm font-semibold">
                        {formatDate(new Date(entry.timestamp))}
                      </td>
                      <td className="px-6 py-4 text-left text-sm capitalize font-medium text-foreground/80">
                        {entry.entityType}
                      </td>
                      <td className="px-6 py-4 text-left text-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          entry.action === "CREATE"
                            ? "bg-credit/10 text-credit border border-credit/20"
                            : entry.action === "DELETE" || entry.action === "CANCEL"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-mono text-muted-foreground">
                        {entry.entityId}
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-semibold">
                        {entry.performedBy || "System"}
                      </td>
                      <td className="px-6 py-4 text-left text-sm max-w-[200px] break-words text-muted-foreground leading-normal">
                        {formatChangesSummary(entry.changes)}
                      </td>
                    </tr>
                    {expandedRowId === entry.id && (
                      <tr className="bg-muted/10 border-b border-border/40 animate-in fade-in slide-in-from-top-1 duration-150">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-4 text-xs font-sans">
                            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                              Visual Ledger Difference Comparison
                            </h4>
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                              
                              {/* Left Side: Preceding State */}
                              <div className="space-y-2 p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
                                <h5 className="font-extrabold text-[9px] text-destructive uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
                                  State Before Change
                                </h5>
                                <div className="font-mono p-3 rounded-xl bg-background/55 border border-border/30 max-h-48 overflow-y-auto text-[10.5px] leading-relaxed max-w-full break-words space-y-1 custom-scrollbar">
                                  {entry.changes.before && Object.keys(entry.changes.before).length > 0 ? (
                                    Object.entries(entry.changes.before).map(([key, val]) => {
                                      const isModified = entry.changes.after?.[key] !== val;
                                      return (
                                        <div key={key} className={isModified ? "bg-destructive/10 text-destructive line-through px-1.5 py-0.5 rounded border border-destructive/10" : "opacity-60 px-1"}>
                                          <strong className="font-bold">{key}</strong>: {JSON.stringify(val)}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <span className="text-muted-foreground italic">No preceding state (Initial Record Creation)</span>
                                  )}
                                </div>
                              </div>

                              {/* Right Side: Final State */}
                              <div className="space-y-2 p-4 rounded-2xl bg-credit/5 border border-credit/10">
                                <h5 className="font-extrabold text-[9px] text-credit uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-credit inline-block" />
                                  State After Change
                                </h5>
                                <div className="font-mono p-3 rounded-xl bg-background/55 border border-border/30 max-h-48 overflow-y-auto text-[10.5px] leading-relaxed max-w-full break-words space-y-1 custom-scrollbar">
                                  {entry.changes.after && Object.keys(entry.changes.after).length > 0 ? (
                                    Object.entries(entry.changes.after).map(([key, val]) => {
                                      const isModified = entry.changes.before?.[key] !== val;
                                      return (
                                        <div key={key} className={isModified ? "bg-credit/10 text-credit font-black px-1.5 py-0.5 rounded border border-credit/10" : "opacity-75 px-1"}>
                                          <strong className="font-bold">{key}</strong>: {JSON.stringify(val)}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <span className="text-muted-foreground italic">No final state (Complete Database Purge)</span>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t border-border/50 p-4">
          <ReportExportButtons
            tableId="audit-table"
            elementId="audit-report"
            filename={`audit-trail_${dateFrom}_to_${dateTo}`}
          />
          <div className="text-sm text-muted-foreground">
            Showing {auditEntries.length} entries
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function formatChangesSummary(changes: any): string {
  if (!changes || typeof changes !== 'object') {
    return "No changes";
  }

  const { before, after } = changes;
  if (!before && !after) return "No changes";

  const beforeKeys = before ? Object.keys(before) : [];
  const afterKeys = after ? Object.keys(after) : [];
  const allKeys = Array.from(new Set([...beforeKeys, ...afterKeys]));

  if (allKeys.length === 0) return "No changes";

  const shownChanges = allKeys.slice(0, 3).map(key => {
    const oldValue = before?.[key];
    const newValue = after?.[key];

    if (oldValue !== undefined && newValue !== undefined && oldValue !== newValue) {
      return `${key}: "${oldValue}" -> "${newValue}"`;
    } else if (newValue !== undefined && oldValue === undefined) {
      return `${key}: "${newValue}"`;
    } else if (oldValue !== undefined && newValue === undefined) {
      return `${key}: removed`;
    }
    return null;
  }).filter(Boolean);

  let summary = shownChanges.join(", ");
  if (allKeys.length > 3) {
    summary += `...and ${allKeys.length - 3} more`;
  }

  return summary || "No significant changes";
}
