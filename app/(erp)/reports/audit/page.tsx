"use client";

import { formatDate } from "@/lib/types";
import { useState, useEffect } from "react";
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
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

export default function AuditPage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditEntries, setAuditEntries] = useState<Array<any>>([]);

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

      <Card>
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
            <Table className="w-full">
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
                  <tr key={entry.id} className="hover:bg-muted">
                    <td className="px-6 py-4 text-left text-sm">
                      {formatDate(new Date(entry.timestamp))}
                    </td>
                    <td className="px-6 py-4 text-left text-sm capitalize">
                      {entry.entityType}
                    </td>
                    <td className="px-6 py-4 text-left text-sm capitalize">
                      {entry.action}
                    </td>
                    <td className="px-6 py-4 text-left text-sm font-mono">
                      {entry.entityId}
                    </td>
                    <td className="px-6 py-4 text-left text-sm">
                      {entry.performedBy || "System"}
                    </td>
                    <td className="px-6 py-4 text-left text-sm max-w-[200px] break-words">
                      {formatChangesSummary(entry.changes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/50 p-4">
          <Button
            variant="outline"
            onClick={() => {
              // In a real app, this would export to CSV/Excel
              alert("Audit log export functionality would be implemented here");
            }}
          >
            Export Audit Log
          </Button>
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
