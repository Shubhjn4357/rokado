"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Keyboard, ChevronRight, ChevronLeft, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { ERP_SHORTCUTS, type ERPShortcut } from "@/lib/erp-shortcuts";

export function ShortcutSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Listen to a custom event to toggle the sidebar from the TopBar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("erp:toggle-shortcuts-sidebar", handleToggle);
    return () => window.removeEventListener("erp:toggle-shortcuts-sidebar", handleToggle);
  }, []);

  const handleShortcutClick = (item: ERPShortcut) => {
    if (item.route) {
      router.push(item.route);
    } else if (item.eventName) {
      window.dispatchEvent(new CustomEvent(item.eventName));
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden cursor-pointer animate-in fade-in duration-200"
        />
      )}

      <div
        id="tour-shortcut-sidebar"
        className={cn(
          "relative h-screen border-l border-border bg-surface shrink-0 transition-all duration-300 ease-in-out flex flex-col font-sans select-none z-40",
          // Desktop
          "lg:flex",
          isOpen ? "lg:w-64" : "lg:w-12",
          // Mobile / Tablet touch screens
          isOpen
            ? "fixed inset-y-0 right-0 z-50 w-64 h-screen shadow-2xl border-l-0"
            : "max-lg:hidden w-0 border-l-0 overflow-hidden"
        )}
      >
      {/* Sidebar toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-3 top-16 w-6 h-6 rounded-[var(--radius-sm)] border border-border bg-surface hover:bg-muted text-foreground flex items-center justify-center cursor-pointer shadow-[var(--shadow-card)] transition-all duration-150 z-50"
        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header */}
      <div className={cn("h-14 flex items-center border-b border-border/80 px-3 overflow-hidden shrink-0 justify-between", !isOpen && "justify-center")}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
            <Keyboard className="w-4 h-4 text-accent" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground leading-none">ERP Shortcuts</span>
              <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wide">Tally Prime Command Desk</span>
            </div>
          )}
        </div>
      </div>

      {/* Shortcuts list */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scrollbar">
        {ERP_SHORTCUTS.map((item) => {
          const isActive = item.route && pathname?.startsWith(item.route);
          return (
            <button
              key={item.key}
              onClick={() => handleShortcutClick(item)}
              className={cn(
                "w-full text-left rounded-[var(--radius-sm)] p-2 border transition-all duration-150 cursor-pointer group flex items-start justify-between relative overflow-hidden",
                isActive
                  ? "bg-accent/15 border-accent/40 shadow-inner shadow-accent/5"
                  : "bg-background/40 hover:bg-muted/65 border-transparent hover:border-border/60",
                !isOpen && "justify-center px-1"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-md" />
              )}

              <div className={cn("flex flex-col gap-1", !isOpen && "items-center")}>
                <div className="flex items-center gap-2">
                  <kbd
                    className={cn(
                      "inline-flex items-center justify-center h-5 min-w-[32px] px-1.5 rounded-md border-b-2 font-mono font-black text-[10px] tracking-tight uppercase shadow-sm select-none shrink-0 transition-all duration-200",
                      isActive
                        ? "bg-accent text-accent-foreground border-accent-foreground/30 shadow-accent/20"
                        : "bg-muted text-foreground border-border group-hover:bg-secondary"
                    )}
                  >
                    {item.key}
                  </kbd>
                  {isOpen && (
                    <span
                      className={cn(
                        "text-[11px] font-black tracking-wide truncate transition-colors duration-150",
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

              {/* Active status */}
              {isOpen && isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent relative mt-1.5 mr-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      {isOpen && (
        <div className="p-3 border-t border-border bg-muted/35">
          <div className="flex items-start gap-2 surface-inset p-2.5 rounded-[var(--radius-card)] text-[9px] text-muted-foreground font-medium leading-relaxed">
            <Lightbulb className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-foreground">Pro-Tip for Tally Experts</span>
              <span>Press F-keys directly anywhere in the app to rapidly jump vouchers. Double click a ledger to drill-down instantly.</span>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
