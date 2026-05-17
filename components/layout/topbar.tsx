"use client";

import { Search, Moon, Sun, Keyboard, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between gap-4 px-6 border-b border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl text-foreground shrink-0 font-sans text-xs select-none shadow-sm">
      
      {/* Left Area: Company & F.Y. Status Indicators */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1 rounded-xl text-accent font-bold cursor-pointer hover:bg-accent/15 transition-all duration-200">
          <span>Active Co:</span>
          <span className="underline underline-offset-2 uppercase tracking-wide">Shree Saree House</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>

        <div className="hidden md:flex items-center gap-1.5 bg-muted border border-border/80 px-3 py-1 rounded-xl text-muted-foreground font-semibold">
          <span>Period:</span>
          <span className="font-extrabold text-foreground">01-Apr-2026 to 31-Mar-2027</span>
        </div>
      </div>

      {/* Middle Area: Global Search Box with hotkey badge */}
      <div 
        onClick={() => window.dispatchEvent(new CustomEvent("erp:command-palette"))}
        className="relative flex-1 max-w-xs md:max-w-sm hidden sm:block cursor-pointer group"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
        <Input
          placeholder="Search items, accounts (Alt+G)..."
          className="pl-9 h-9 bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground/60 text-xs rounded-xl font-medium cursor-pointer hover:bg-background/80 transition-all duration-200"
          readOnly
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono bg-muted border border-border text-muted-foreground px-1.5 py-0.5 rounded-md font-bold group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-all duration-200">
          Alt+G
        </kbd>
      </div>

      {/* Right Area: Status and Actions */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        
        {/* Sync Status Badge */}
        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-[10px] tracking-wide uppercase shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Synced</span>
        </div>

        {/* Shortcuts indicator */}
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl hover:bg-muted/70 transition-all duration-200">
          <Keyboard className="w-4 h-4" />
          <span>Hotkeys</span>
        </Button>

        {/* Dark Mode Switcher */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground border border-border/80 bg-background/40 hover:bg-muted/70 transition-all duration-200"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </header>
  );
}
