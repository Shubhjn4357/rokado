"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Generic shimmering glassmorphic box helper
export function SkeletonItem({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-slate-900/60 dark:bg-slate-900/40 border border-slate-800/65 overflow-hidden relative min-h-[20px]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/15 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite] pointer-events-none" />
      {children}
    </div>
  );
}

// Sleek text-line shimmer helper
export function SkeletonText({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-3.5 bg-slate-850 dark:bg-slate-800/65 rounded-lg w-full relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite] pointer-events-none" />
    </div>
  );
}

// 1. Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 font-sans select-none animate-pulse">
      {/* Header bar placeholder */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="space-y-2">
          <SkeletonItem className="h-7 w-52 bg-slate-900/80" />
          <SkeletonItem className="h-4 w-80 bg-slate-900/50" />
        </div>
        <SkeletonItem className="h-9 w-40 bg-slate-900/50" />
      </div>

      {/* Financial Kanbans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <SkeletonItem key={i} className="h-32 p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <SkeletonText className="w-24 h-3" />
              <SkeletonText className="w-40 h-6" />
            </div>
            <SkeletonText className="w-32 h-2.5" />
          </SkeletonItem>
        ))}
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Receivables List */}
        <SkeletonItem className="lg:col-span-2 p-5 min-h-[300px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonText className="w-36 h-4" />
              <SkeletonText className="w-16 h-4" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-900/30">
                  <div className="space-y-1">
                    <SkeletonText className="w-44 h-3.5" />
                    <SkeletonText className="w-24 h-2.5" />
                  </div>
                  <SkeletonText className="w-20 h-4" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonItem>

        {/* Right Column - Low Stock Alerts */}
        <SkeletonItem className="p-5 min-h-[300px] flex flex-col justify-between">
          <div className="space-y-4">
            <SkeletonText className="w-36 h-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border border-slate-900 rounded-xl flex items-center justify-between">
                  <div className="space-y-1.5 flex-1">
                    <SkeletonText className="w-28 h-3" />
                    <SkeletonText className="w-16 h-2" />
                  </div>
                  <SkeletonText className="w-10 h-4" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonItem>
      </div>
    </div>
  );
}

// 2. TV Dashboard Skeleton
export function TVSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden p-6 relative">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <SkeletonItem className="w-10 h-10 rounded-xl bg-slate-900/80" />
          <div className="space-y-2">
            <SkeletonText className="w-48 h-5" />
            <SkeletonText className="w-32 h-2.5" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonItem className="h-8 w-44 rounded-xl" />
          <SkeletonItem className="h-9 w-24 rounded-2xl" />
          <SkeletonItem className="h-9 w-9 rounded-xl" />
        </div>
      </header>

      {/* Kanbans */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <SkeletonItem key={i} className="h-28 p-5" />
        ))}
      </section>

      {/* Multi Columns Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <SkeletonItem className="lg:col-span-5 p-5 min-h-[300px]" />
        <div className="lg:col-span-7 flex flex-col gap-6">
          <SkeletonItem className="p-5 min-h-[160px]" />
          <SkeletonItem className="p-5 min-h-[160px]" />
        </div>
      </div>

      <SkeletonItem className="h-10 w-full" />
    </div>
  );
}

// 3. Table Skeleton (Vouchers, Ledgers, Stock)
export function TableSkeleton({ headers }: { headers: string[] }) {
  return (
    <div className="space-y-6 font-sans select-none animate-pulse">
      {/* Top action desk */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/10 border border-slate-900/30 p-3 rounded-2xl backdrop-blur-md">
        <SkeletonItem className="h-8.5 w-60 rounded-xl bg-slate-900/60" />
        <SkeletonItem className="h-8.5 w-32 rounded-xl bg-slate-900/60" />
      </div>

      {/* Data Table */}
      <SkeletonItem className="border border-slate-800/80 rounded-2xl overflow-hidden p-1">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/20">
              {headers.map((h, i) => (
                <th key={i} className="p-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <tr key={row} className="border-b border-slate-850/40 hover:bg-slate-900/5">
                {headers.map((_, col) => (
                  <td key={col} className="p-3.5">
                    <SkeletonText
                      className={cn(
                        col === 0 ? "w-28" : col === 1 ? "w-24" : "w-16",
                        "h-3"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </SkeletonItem>
    </div>
  );
}

// 4. Form / Setup Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6 font-sans max-w-3xl mx-auto py-4 select-none animate-pulse">
      <div className="space-y-2 mb-4">
        <SkeletonItem className="h-6 w-44 bg-slate-900/80" />
        <SkeletonText className="w-72 h-3" />
      </div>

      <SkeletonItem className="p-6 space-y-5 rounded-2xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonText className="w-20 h-3" />
            <SkeletonItem className="h-9 w-full rounded-xl bg-slate-900/40 border border-slate-850" />
          </div>
        ))}
        <div className="flex gap-3 justify-end pt-3">
          <SkeletonItem className="h-9.5 w-24 rounded-xl" />
          <SkeletonItem className="h-9.5 w-32 rounded-xl bg-blue-500/10 border-blue-500/20" />
        </div>
      </SkeletonItem>
    </div>
  );
}
