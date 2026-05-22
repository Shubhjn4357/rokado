"use client";

import { useEffect, useState, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Tv, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Truck, 
  Maximize2, 
  Minimize2, 
  Layers, 
  ShoppingBag, 
  CheckCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DispatchItem {
  id: string;
  number: string | null;
  date: number;
  grandTotal: number;
  transportName: string | null;
  lrNumber: string | null;
  dispatchDate: number | null;
  partyName: string | null;
}

interface CriticalStockItem {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  reorderLevel: number | null;
  unit: string;
  rackLocation: string | null;
}

interface TVClientProps {
  data: {
    categorySales: Array<{ category: string; amount: number; quantity: number }>;
    criticalStock: CriticalStockItem[];
    dispatches: DispatchItem[];
    todaySalesTotal: number;
    todaySalesCount: number;
    activeChallansCount: number;
  };
}

export function TVClient({ data }: TVClientProps) {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mountedRef = useRef(true);

  // Digital TV Clock
  useEffect(() => {
    mountedRef.current = true;
    const updateTime = () => {
      if (mountedRef.current) {
        const now = new Date();
        setTime(
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        );
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // Real-time server data refetch every 5 seconds
  useEffect(() => {
    const refetchInterval = setInterval(() => {
      if (mountedRef.current) {
        startTransition(() => {
          if (mountedRef.current) {
            router.refresh();
          }
        });
      }
    }, 5000);
    return () => clearInterval(refetchInterval);
  }, [router]);

  // Fullscreen trigger
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error enabling fullscreen mode:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen to escape or fullscreen exit events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const totalRevenue = data.categorySales.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col font-sans select-none overflow-x-hidden p-2 md:p-4 relative space-y-6 text-foreground">
      {/* Elegant low-contrast header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/5 pb-4 select-none gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground/90 flex items-center gap-2">
            <Tv className="w-5 h-5 text-accent animate-pulse" />
            Showroom TV Monitor
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Live Showroom Feed · Auto-Refreshing (5s)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Active indicator */}
          <div className="flex items-center gap-1.5 bg-credit/10 border border-credit/20 px-3.5 py-1.5 rounded-full shadow-sm font-bold text-[10px] uppercase text-credit tracking-wider">
            <Activity className="w-3.5 h-3.5 text-credit animate-pulse" />
            <span>Showroom TV Feed Active</span>
          </div>

          <div className="flex items-center gap-2 bg-muted border border-border px-4 py-1.5 rounded-full shadow-sm">
            <Clock className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs font-black text-foreground tracking-widest leading-none">
              {time || "--:--:--"}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-full bg-muted hover:bg-border border border-border flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* THREE VALUE KANBANS DESK */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        
        {/* Kanban 1: Today's Sales Revenue (Glowing Credit Green glass card) */}
        <div className="surface-card p-6 rounded-[var(--radius-card)] relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 group cursor-default border border-credit/20 bg-credit/5">
          <div className="absolute top-[-30px] right-[-20px] w-36 h-36 bg-credit/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Today's Sales Revenue</span>
            <div className="w-8 h-8 bg-credit/10 border border-credit/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-credit" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <div className="text-3xl font-black tracking-tight text-credit font-mono">
              ₹{data.todaySalesTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-bold mt-1 text-muted-foreground">
              Calculated across {data.todaySalesCount} sales vouchers
            </div>
          </div>
        </div>

        {/* Kanban 2: Active Dispatch Challans (Glowing Accent Indigo glass card) */}
        <div className="surface-card p-6 rounded-[var(--radius-card)] relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 group cursor-default border border-accent/20 bg-accent/5">
          <div className="absolute top-[-30px] right-[-20px] w-36 h-36 bg-accent/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Active Dispatch Challans</span>
            <div className="w-8 h-8 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 text-accent" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <div className="text-3xl font-black tracking-tight text-accent font-mono">
              {data.activeChallansCount} Bills
            </div>
            <div className="text-xs font-bold mt-1 text-muted-foreground">
              Goods dispatched, transport in transit
            </div>
          </div>
        </div>

        {/* Kanban 3: Critical Stock Alerts (Glowing Destructive Rose glass card) */}
        <div className={cn(
          "surface-card p-6 rounded-[var(--radius-card)] relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 group cursor-default border",
          data.criticalStock.length > 0 
            ? "border-destructive/25 bg-destructive/5" 
            : "border-border bg-muted/40"
        )}>
          <div className="absolute top-[-30px] right-[-20px] w-36 h-36 bg-destructive/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Critical Stock Alerts</span>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border",
              data.criticalStock.length > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted border-border"
            )}>
              <AlertTriangle className={cn(
                "w-4 h-4",
                data.criticalStock.length > 0 ? "text-destructive" : "text-muted-foreground"
              )} />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <div className={cn(
              "text-3xl font-black font-mono tracking-tight",
              data.criticalStock.length > 0 ? "text-destructive animate-pulse" : "text-foreground"
            )}>
              {data.criticalStock.length} Items
            </div>
            <div className="text-xs font-bold mt-1 text-muted-foreground">
              Saree collections below minimum threshold
            </div>
          </div>
        </div>
      </section>

      {/* MAIN TWO PANEL CONTENT FEED */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Saree Category Sales charts (5 cols wide on lg) */}
        <div className="lg:col-span-5 surface-card rounded-[var(--radius-xl)] p-5 flex flex-col border-none overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground/80">Saree Category Sales Performance</h2>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-5.5">
            {data.categorySales.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs font-semibold">
                No inventory sales captured during this period.
              </div>
            ) : (
              data.categorySales.map((item) => {
                const percent = totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-foreground/80 group-hover:text-accent transition-colors">
                        {item.category}
                      </span>
                      <span className="font-mono text-muted-foreground font-bold">
                        ₹{item.amount.toLocaleString("en-IN")} (Qty: {item.quantity})
                      </span>
                    </div>

                    {/* Highly stylized glowing gauge */}
                    <div className="h-4.5 bg-muted border border-border/80 rounded-lg overflow-hidden relative shadow-inner flex">
                      <div
                        className="h-full rounded-lg bg-gradient-to-r from-accent to-credit shadow-[0_0_15px_rgba(241,78,68,0.2)] transition-all duration-1000 relative"
                        style={{ width: `${percent}%` }}
                      >
                        {/* Highlights & gridlines inside progress bar */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[size:10px_10px] animate-[shimmer_20s_linear_infinite]" />
                      </div>
                      <span className="absolute right-2 top-0.5 text-[8.5px] font-mono font-black text-foreground z-10 leading-none">
                        {percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border pt-4.5 mt-5 flex items-center justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-wider shrink-0">
            <span>SHOWROOM SEGMENTS</span>
            <span className="text-foreground/80">TOTAL: ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Dispatch Grid & Critical Stock Alerts (7 cols wide on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* UPPER RIGHT: Active Transport Dispatch Challans */}
          <div className="rounded-[var(--radius-xl)] border-none surface-card p-5 flex flex-col overflow-hidden flex-1">
            <div className="flex items-center justify-between mb-4.5">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-accent" />
                <h2 className="text-xs font-black uppercase tracking-wider text-foreground/80">Active Transport Dispatch Desk</h2>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-black text-[9px] uppercase tracking-wide">
                Live Status
              </span>
            </div>

            <div className="flex-grow overflow-x-auto min-h-[160px]">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-border text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="py-2.5 pr-2">Challan / Bill</th>
                    <th className="py-2.5 px-2">Party A/c Name</th>
                    <th className="py-2.5 px-2">LR / Bilty No.</th>
                    <th className="py-2.5 px-2">Carrier/Transport</th>
                    <th className="py-2.5 pl-2 text-right">Freight (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground/80 font-medium">
                  {data.dispatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground font-semibold text-xs">
                        No active transport dispatches found in standard records.
                      </td>
                    </tr>
                  ) : (
                    data.dispatches.map((item) => (
                      <tr key={item.id} className="table-row-hover hover:bg-muted/30 transition-all group">
                        <td className="py-3 pr-2 font-mono font-black text-credit text-[11px] group-hover:underline">
                          {item.number || "CHL-TEMP"}
                        </td>
                        <td className="py-3 px-2 font-bold text-foreground/90 truncate max-w-[130px]">
                          {item.partyName || "Walk-In Customer"}
                        </td>
                        <td className="py-3 px-2 font-mono font-extrabold text-muted-foreground">
                          {item.lrNumber || "Pending"}
                        </td>
                        <td className="py-3 px-2 text-accent font-bold">
                          {item.transportName || "Self Pick-Up"}
                        </td>
                        <td className="py-3 pl-2 text-right font-mono font-black text-foreground/80">
                          {item.grandTotal > 0 ? `₹${item.grandTotal.toLocaleString()}` : "Free"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOWER RIGHT: Stock Warnings Desk */}
          <div className="rounded-[var(--radius-xl)] border-none surface-card p-5 flex flex-col overflow-hidden min-h-[160px]">
            <div className="flex items-center gap-2 mb-3.5">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground/80">Saree Inventory Alerts (Low Stock)</h2>
            </div>

            <div className="flex-grow overflow-y-auto max-h-[140px] pr-1 space-y-2 custom-scrollbar">
              {data.criticalStock.length === 0 ? (
                <div className="text-center py-6 text-credit text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-credit" />
                  All saree collections are perfectly balanced above minimum threshold.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.criticalStock.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-destructive/15 bg-destructive/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col gap-0.5 max-w-[170px]">
                        <span className="font-extrabold text-foreground/80 truncate">{item.name}</span>
                        <span className="text-[8.5px] font-black uppercase text-muted-foreground tracking-wider">
                          Rack: {item.rackLocation || "Main Aisle"} • {item.category}
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-[9px] block text-destructive font-extrabold uppercase animate-pulse">CRITICAL</span>
                        <span className="text-xs font-black text-destructive">
                          {item.stockQuantity} {item.unit}
                        </span>
                        <span className="text-[8px] block text-muted-foreground">Min: {item.reorderLevel ?? 10}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* RUNNING Horizontal NEWS TICKER BAR (Bottom Footer) */}
      <footer className="h-10 border border-border bg-muted/80 backdrop-blur-md shrink-0 rounded-xl overflow-hidden relative z-10 flex items-center">
        <div className="h-full bg-muted border-r border-border px-4 shrink-0 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-destructive">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-bounce" />
          <span>BROADCAST DESK</span>
        </div>
        <div className="flex-grow relative h-full overflow-hidden flex items-center">
          <div className="absolute whitespace-nowrap animate-[marquee_30s_linear_infinite] flex items-center gap-10 text-[10.5px] font-extrabold tracking-wide text-foreground/80">
            {data.criticalStock.length > 0 ? (
              data.criticalStock.map((item) => (
                <span key={item.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping inline-block" />
                  REORDER ALERT: <strong className="text-destructive">{item.name}</strong> IS AT CRITICAL STOCK OF <strong className="text-foreground">{item.stockQuantity} PCS</strong> (THRESHOLD: {item.reorderLevel ?? 10} PCS).
                </span>
              ))
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-credit inline-block" />
                SHREE SAREE HOUSE ERP OPERATING NORMALLY. ALL AUDITED DOUBLE-ENTRY VOUCHERS PERFECTLY SYNCED WITH CLOUD DATABASES.
              </span>
            )}
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              TALLY PRIME INTEGRATION SCHEMAS READY. GSTR-1 TAX COMPLIANCE CONSOLE UPDATED.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
