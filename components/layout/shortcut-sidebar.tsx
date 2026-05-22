"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Keyboard, ChevronRight, ChevronLeft, Lightbulb, FileSpreadsheet, PlusCircle, Save, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortcutItem {
  key: string;
  label: string;
  description: string;
  route?: string;
  combo?: string;
}

export function ShortcutSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  // Listen to a custom event to toggle the sidebar from the TopBar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("erp:toggle-shortcuts-sidebar", handleToggle);
    return () => window.removeEventListener("erp:toggle-shortcuts-sidebar", handleToggle);
  }, []);

  const shortcuts: ShortcutItem[] = [
    { key: "F4", label: "Contra", description: "Bank/Cash transfers", route: "/vouchers/contra" },
    { key: "F5", label: "Payment", description: "Record outgoing cash", route: "/vouchers/payment" },
    { key: "F6", label: "Receipt", description: "Record incoming cash", route: "/vouchers/receipt" },
    { key: "F7", label: "Journal", description: "Adjustment bookings", route: "/vouchers/journal" },
    { key: "F8", label: "Sales", description: "Record credit/cash sales", route: "/vouchers/sales" },
    { key: "F9", label: "Purchase", description: "Record supplier bills", route: "/vouchers/purchase" },
    { key: "Alt+C", label: "Create Ledger", description: "Quick ledger setup", route: "/ledgers/new", combo: "⌥C" },
    { key: "Alt+G", label: "Go To / Search", description: "Global command center", combo: "⌥G" },
    { key: "Ctrl+S", label: "Save Form", description: "Save active transaction", combo: "⌘S" },
  ];

  const handleShortcutClick = (item: ShortcutItem) => {
    if (item.route) {
      router.push(item.route);
    } else if (item.key === "Alt+G") {
      window.dispatchEvent(new CustomEvent("erp:command-palette"));
    } else if (item.key === "Ctrl+S") {
      window.dispatchEvent(new CustomEvent("erp:save"));
    }
  };

  return (
    <div
      className={cn(
        "relative h-screen border-l border-border/80 bg-card/60 dark:bg-card/30 backdrop-blur-3xl shrink-0 transition-all duration-300 ease-in-out flex flex-col font-sans select-none z-40",
        isOpen ? "w-64" : "w-12"
      )}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-3 top-16 w-6 h-6 rounded-full border border-border/90 bg-background hover:bg-muted text-foreground flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-all duration-200 z-50"
        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header */}
      <div className={cn("h-14 flex items-center border-b border-border/80 px-3 overflow-hidden shrink-0 justify-between", !isOpen && "justify-center")}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
            <Keyboard className="w-4 h-4 text-accent animate-pulse" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground leading-none">ERP Shortcuts</span>
              <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wide">Tally Prime Command Desk</span>
            </div>
          )}
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scrollbar">
        {shortcuts.map((item) => {
          const isActive = item.route && pathname?.startsWith(item.route);
          return (
            <button
              key={item.key}
              onClick={() => handleShortcutClick(item)}
              className={cn(
                "w-full text-left rounded-xl p-2 border transition-all duration-250 cursor-pointer group flex items-start justify-between relative overflow-hidden",
                isActive
                  ? "bg-accent/15 border-accent/40 shadow-inner shadow-accent/5"
                  : "bg-background/40 hover:bg-muted/65 border-transparent hover:border-border/60",
                !isOpen && "justify-center px-1"
              )}
            >
              {/* Highlight bar for active button */}
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-md animate-pulse" />
              )}

              <div className={cn("flex flex-col gap-1", !isOpen && "items-center")}>
                <div className="flex items-center gap-2">
                  {/* Glowing 3D-effect key badge */}
                  <kbd
                    className={cn(
                      "inline-flex items-center justify-center h-5 min-w-[32px] px-1.5 rounded-md border-b-2 font-mono font-black text-[10px] tracking-tight uppercase shadow-sm select-none shrink-0 transition-all duration-200",
                      isActive
                        ? "bg-accent text-accent-foreground border-accent-foreground/30 shadow-accent/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700/80 group-hover:border-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/50"
                    )}
                  >
                    {item.combo || item.key}
                  </kbd>
                  {isOpen && (
                    <span
                      className={cn(
                        "text-[11px] font-black tracking-wide truncate transition-colors duration-250",
                        isActive ? "text-accent" : "text-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
                {isOpen && (
                  <span className="text-[9px] text-muted-foreground/75 font-medium leading-normal pl-1.5 transition-colors group-hover:text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </div>

              {/* Status orb when active */}
              {isOpen && isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent relative mt-1.5 mr-1">
                  <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      {isOpen && (
        <div className="p-3 border-t border-border/80 bg-muted/30 backdrop-blur-md">
          <div className="flex items-start gap-2 bg-background/50 border border-border/80 p-2.5 rounded-xl text-[9px] text-muted-foreground font-medium leading-relaxed shadow-sm">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-foreground">Pro-Tip for Tally Experts</span>
              <span>Press F-keys directly anywhere in the app to rapidly jump vouchers. Double click a ledger to drill-down instantly.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
