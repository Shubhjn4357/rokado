"use client";

import React from "react";
import { cn } from "@/lib/utils";

type SkeletonItemProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

export function SkeletonItem({ className, children, ...props }: SkeletonItemProps) {
  return (
    <div
      className={cn("skeleton relative min-h-[20px] overflow-hidden rounded-[var(--radius-card)]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn("skeleton h-3.5 w-full rounded-[var(--radius-sm)]", className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 font-sans select-none animate-pulse">
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <SkeletonItem className="h-7 w-52" />
          <SkeletonItem className="h-4 w-80 max-w-full" />
        </div>
        <SkeletonItem className="h-8 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <SkeletonItem key={item} className="h-32 p-4">
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-2">
                <SkeletonText className="h-3 w-24" />
                <SkeletonText className="h-6 w-40" />
              </div>
              <SkeletonText className="h-2.5 w-32" />
            </div>
          </SkeletonItem>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <SkeletonItem className="min-h-[280px] p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonText className="h-4 w-36" />
              <SkeletonText className="h-4 w-16" />
            </div>
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <SkeletonText className="h-3 w-full" />
                <SkeletonText className="h-2 w-5/6" />
              </div>
            ))}
          </div>
        </SkeletonItem>

        <SkeletonItem className="min-h-[280px] p-4">
          <div className="space-y-3">
            <SkeletonText className="h-4 w-36" />
            {[1, 2, 3].map((item) => (
              <div key={item} className="surface-inset flex items-center justify-between rounded-[var(--radius-card)] p-3">
                <div className="space-y-1.5">
                  <SkeletonText className="h-3 w-28" />
                  <SkeletonText className="h-2 w-16" />
                </div>
                <SkeletonText className="h-4 w-10" />
              </div>
            ))}
          </div>
        </SkeletonItem>
      </div>
    </div>
  );
}

export function TVSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden p-6">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-5 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <SkeletonItem className="w-10 h-10" />
          <div className="space-y-2">
            <SkeletonText className="w-48 h-5" />
            <SkeletonText className="w-32 h-2.5" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonItem className="h-8 w-44" />
          <SkeletonItem className="h-9 w-24" />
          <SkeletonItem className="h-9 w-9" />
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((item) => (
          <SkeletonItem key={item} className="h-28 p-4" />
        ))}
      </section>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
        <SkeletonItem className="lg:col-span-5 p-4 min-h-[300px]" />
        <div className="lg:col-span-7 flex flex-col gap-3">
          <SkeletonItem className="p-4 min-h-[160px]" />
          <SkeletonItem className="p-4 min-h-[160px]" />
        </div>
      </div>

      <SkeletonItem className="h-10 w-full" />
    </div>
  );
}

export function TableSkeleton({ headers }: { headers: string[] }) {
  return (
    <div className="space-y-5 font-sans select-none animate-pulse">
      <div className="surface-card flex items-center justify-between gap-4 p-3 rounded-[var(--radius-card)]">
        <SkeletonItem className="h-8 w-60 max-w-full" />
        <SkeletonItem className="h-8 w-32" />
      </div>

      <SkeletonItem className="border border-border rounded-[var(--radius-card)] overflow-hidden p-1">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/35">
              {headers.map((header) => (
                <th key={header} className="p-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <tr key={row} className="border-b border-border">
                {headers.map((header, col) => (
                  <td key={`${row}-${header}`} className="p-3.5">
                    <SkeletonText className={cn(col === 0 ? "w-28" : col === 1 ? "w-24" : "w-16", "h-3")} />
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

export function FormSkeleton() {
  return (
    <div className="space-y-5 font-sans max-w-3xl mx-auto py-4 select-none animate-pulse">
      <div className="space-y-2 mb-4">
        <SkeletonItem className="h-6 w-44" />
        <SkeletonText className="w-72 max-w-full h-3" />
      </div>

      <SkeletonItem className="p-5 space-y-5">
        {[1, 2, 3].map((item) => (
          <div key={item} className="space-y-2">
            <SkeletonText className="w-20 h-3" />
            <SkeletonItem className="h-9 w-full" />
          </div>
        ))}
        <div className="flex gap-3 justify-end pt-3">
          <SkeletonItem className="h-9 w-24" />
          <SkeletonItem className="h-9 w-32" />
        </div>
      </SkeletonItem>
    </div>
  );
}
