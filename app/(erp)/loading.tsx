import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top action block skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded-md" />
          <div className="h-4 w-64 bg-muted rounded-md opacity-60" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-md" />
      </div>

      {/* Grid for Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card/45 backdrop-blur-xl border-white/5 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="h-4 w-24 bg-muted rounded-md" />
              <div className="h-4 w-4 bg-muted rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-8 w-28 bg-muted rounded-md" />
              <div className="h-3 w-36 bg-muted rounded-md opacity-60" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton (e.g. Table / Charts) */}
      <Card className="bg-card/45 backdrop-blur-xl border-white/5 shadow-sm">
        <CardHeader className="space-y-2">
          <div className="h-5 w-36 bg-muted rounded-md" />
          <div className="h-4 w-64 bg-muted rounded-md opacity-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table header */}
          <div className="flex gap-4 border-b border-border/50 pb-3">
            <div className="h-4 flex-1 bg-muted rounded-md" />
            <div className="h-4 w-24 bg-muted rounded-md" />
            <div className="h-4 w-24 bg-muted rounded-md" />
            <div className="h-4 w-24 bg-muted rounded-md" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center py-2 border-b border-border/20 last:border-0">
              <div className="h-4 flex-1 bg-muted rounded-md" />
              <div className="h-4 w-24 bg-muted rounded-md" />
              <div className="h-4 w-24 bg-muted rounded-md" />
              <div className="h-4 w-24 bg-muted rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
