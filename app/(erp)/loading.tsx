import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-1">
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-52" />
          <SkeletonBlock className="h-3.5 w-72 opacity-60" />
        </div>
        <SkeletonBlock className="h-9 w-32 rounded-xl" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card/45 backdrop-blur-xl border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2 px-5 pb-5">
              <SkeletonBlock className="h-7 w-28" />
              <SkeletonBlock className="h-3 w-36 opacity-60" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content table skeleton */}
      <Card className="bg-card/45 backdrop-blur-xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="space-y-2 px-6 pt-5">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3.5 w-64 opacity-60" />
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-3">
          {/* Search/filter bar */}
          <div className="flex gap-3 pb-2">
            <SkeletonBlock className="h-9 flex-1 rounded-xl" />
            <SkeletonBlock className="h-9 w-24 rounded-xl" />
          </div>

          {/* Table header */}
          <div className="flex gap-4 border-b border-border/40 pb-3">
            <SkeletonBlock className="h-3.5 flex-1" />
            <SkeletonBlock className="h-3.5 w-20" />
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3.5 w-20" />
            <SkeletonBlock className="h-3.5 w-16" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 items-center py-2.5 border-b border-border/20 last:border-0"
              style={{ opacity: 1 - i * 0.12 }}
            >
              <SkeletonBlock className="h-3.5 flex-1" />
              <SkeletonBlock className="h-3.5 w-20" />
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-3.5 w-20" />
              <SkeletonBlock className="h-3.5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
