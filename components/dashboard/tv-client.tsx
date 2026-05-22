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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden p-6 relative">
      {/* Dynamic particles background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none" />

      {/* TOP HEADER STATUS PANEL */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-950/20 animate-pulse">
            <Tv className="w-5.5 h-5.5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
              Shree Saree House
            </h1>
            <p className="text-[10px] text-slate-400/85 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              Live Showroom Monitor Desk • Auto-Refreshing (5s)
            </p>
          </div>
        </div>

        {/* Live Digital Clock, Active Connection status & Fullscreen Button */}
        <div className="flex items-center gap-4.5">
          {/* Active indicator */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl shadow-inner font-bold text-[10px] uppercase text-emerald-400 tracking-wider">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Showroom TV Feed Active</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-4 py-1.5 rounded-2xl shadow-lg shadow-slate-950/50">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm md:text-base font-extrabold text-white tracking-widest leading-none">
              {time || "--:--:--"}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white transition-all shadow-md active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* THREE VALUE KANBANS DESK */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-10">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/5 backdrop-blur-2xl p-5 shadow-lg flex items-center justify-between group overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl transition-all group-hover:scale-125 pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Today's Sales Revenue</span>
            <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              ₹{data.todaySalesTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Calculated across {data.todaySalesCount} sales vouchers
            </p>
          </div>
          <TrendingUp className="w-10 h-10 text-emerald-400/20 shrink-0 transform group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/5 backdrop-blur-2xl p-5 shadow-lg flex items-center justify-between group overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl transition-all group-hover:scale-125 pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Dispatch Challans</span>
            <div className="text-2xl md:text-3xl font-black text-indigo-400 font-mono tracking-tight">
              {data.activeChallansCount} Bills
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Goods dispatched, transport in transit
            </p>
          </div>
          <Truck className="w-10 h-10 text-indigo-400/20 shrink-0 transform group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className={cn(
          "rounded-2xl border p-5 shadow-lg flex items-center justify-between group overflow-hidden transition-all duration-300",
          data.criticalStock.length > 0 
            ? "border-red-500/25 bg-red-950/5" 
            : "border-slate-800 bg-slate-900/40"
        )}>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-red-500/5 rounded-full filter blur-xl transition-all group-hover:scale-125 pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Critical Stock Alerts</span>
            <div className={cn(
              "text-2xl md:text-3xl font-black font-mono tracking-tight",
              data.criticalStock.length > 0 ? "text-red-400 animate-pulse" : "text-slate-300"
            )}>
              {data.criticalStock.length} Items
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Saree collections below minimum threshold
            </p>
          </div>
          <AlertTriangle className={cn(
            "w-10 h-10 shrink-0 transform group-hover:scale-110 transition-transform duration-300",
            data.criticalStock.length > 0 ? "text-red-400/20" : "text-slate-500/25"
          )} />
        </div>
      </section>

      {/* MAIN TWO PANEL CONTENT FEED */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 relative z-10">
        
        {/* LEFT COLUMN: Saree Category Sales charts (8 cols wide on lg) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur-2xl p-5 flex flex-col shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Saree Category Sales Performance</h2>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-5.5">
            {data.categorySales.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                No inventory sales captured during this period.
              </div>
            ) : (
              data.categorySales.map((item) => {
                const percent = totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-200 group-hover:text-emerald-400 transition-colors">
                        {item.category}
                      </span>
                      <span className="font-mono text-slate-400 font-bold">
                        ₹{item.amount.toLocaleString("en-IN")} (Qty: {item.quantity})
                      </span>
                    </div>

                    {/* Highly stylized glowing gauge */}
                    <div className="h-4.5 bg-slate-950 border border-slate-850/80 rounded-lg overflow-hidden relative shadow-inner flex">
                      <div
                        className="h-full rounded-lg bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all duration-1000 relative"
                        style={{ width: `${percent}%` }}
                      >
                        {/* Highlights & gridlines inside progress bar */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[size:10px_10px] animate-[shimmer_20s_linear_infinite]" />
                      </div>
                      <span className="absolute right-2 top-0.5 text-[8.5px] font-mono font-black text-slate-300 z-10 leading-none">
                        {percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-4.5 mt-5 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider shrink-0">
            <span>SHOWROOM SEGMENTS</span>
            <span className="text-slate-400">TOTAL: ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Dispatch Grid & Critical Stock Alerts (7 cols wide on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* UPPER RIGHT: Active Transport Dispatch Challans */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur-2xl p-5 flex flex-col shadow-xl flex-1">
            <div className="flex items-center justify-between mb-4.5">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Active Transport Dispatch Desk</h2>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-[9px] uppercase tracking-wide">
                Live Status
              </span>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[160px]">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-800/85 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="py-2.5 pr-2">Challan / Bill</th>
                    <th className="py-2.5 px-2">Party A/c Name</th>
                    <th className="py-2.5 px-2">LR / Bilty No.</th>
                    <th className="py-2.5 px-2">Carrier/Transport</th>
                    <th className="py-2.5 pl-2 text-right">Freight (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-slate-300 font-medium">
                  {data.dispatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 font-semibold text-xs">
                        No active transport dispatches found in standard records.
                      </td>
                    </tr>
                  ) : (
                    data.dispatches.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-all group">
                        <td className="py-3 pr-2 font-mono font-black text-emerald-400 text-[11px] group-hover:underline">
                          {item.number || "CHL-TEMP"}
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-200 truncate max-w-[130px]">
                          {item.partyName || "Walk-In Customer"}
                        </td>
                        <td className="py-3 px-2 font-mono font-extrabold text-slate-400">
                          {item.lrNumber || "Pending"}
                        </td>
                        <td className="py-3 px-2 text-indigo-400 font-bold">
                          {item.transportName || "Self Pick-Up"}
                        </td>
                        <td className="py-3 pl-2 text-right font-mono font-black text-slate-300">
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
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur-2xl p-5 flex flex-col shadow-xl min-h-[160px]">
            <div className="flex items-center gap-2 mb-3.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Saree Inventory Alerts (Low Stock)</h2>
            </div>

            <div className="flex-grow overflow-y-auto max-h-[140px] pr-1 space-y-2 custom-scrollbar">
              {data.criticalStock.length === 0 ? (
                <div className="text-center py-6 text-emerald-400/80 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  All saree collections are perfectly balanced above minimum threshold.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.criticalStock.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-red-500/15 bg-red-950/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col gap-0.5 max-w-[170px]">
                        <span className="font-extrabold text-slate-200 truncate">{item.name}</span>
                        <span className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                          Rack: {item.rackLocation || "Main Aisle"} • {item.category}
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-[9px] block text-red-500 font-extrabold uppercase animate-pulse">CRITICAL</span>
                        <span className="text-xs font-black text-rose-400">
                          {item.stockQuantity} {item.unit}
                        </span>
                        <span className="text-[8px] block text-slate-500">Min: {item.reorderLevel ?? 10}</span>
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
      <footer className="h-10 border border-slate-800 bg-slate-950 shrink-0 rounded-xl overflow-hidden relative z-10 flex items-center">
        <div className="h-full bg-slate-900 border-r border-slate-800 px-4 shrink-0 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-500">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          <span>BROADCAST DESK</span>
        </div>
        <div className="flex-grow relative h-full overflow-hidden flex items-center">
          <div className="absolute whitespace-nowrap animate-[marquee_30s_linear_infinite] flex items-center gap-10 text-[10.5px] font-extrabold tracking-wide text-slate-350">
            {data.criticalStock.length > 0 ? (
              data.criticalStock.map((item) => (
                <span key={item.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                  REORDER ALERT: <strong className="text-red-400">{item.name}</strong> IS AT CRITICAL STOCK OF <strong className="text-white">{item.stockQuantity} PCS</strong> (THRESHOLD: {item.reorderLevel ?? 10} PCS).
                </span>
              ))
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                SHREE SAREE HOUSE ERP OPERATING NORMALLY. ALL AUDITED DOUBLE-ENTRY VOUCHERS PERFECTLY SYNCED WITH CLOUD DATABASES.
              </span>
            )}
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
              TALLY PRIME INTEGRATION SCHEMAS READY. GSTR-1 TAX COMPLIANCE CONSOLE UPDATED.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
