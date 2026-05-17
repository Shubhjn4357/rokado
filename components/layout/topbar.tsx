"use client";

import { Search, Bell, Moon, Sun, Keyboard, Zap } from "lucide-react";
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
    <header className="h-16 flex items-center gap-4 px-6 border-b border-border/60 bg-background/80 backdrop-blur-xl shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search ledgers, vouchers... (Ctrl+K)"
          className="pl-9 h-9 bg-muted/50 border-border/50 text-sm rounded-xl"
          readOnly
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-border/70 text-muted-foreground px-1.5 py-0.5 rounded-md">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Shortcuts hint */}
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground text-xs hidden lg:flex">
          <Keyboard className="w-3.5 h-3.5" />
          Shortcuts
        </Button>

        {/* Sync status */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-lg">
          <Zap className="w-3 h-3" />
          <span className="hidden sm:inline font-medium">Synced</span>
        </div>

        {/* Bell */}
        <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-xl">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </header>
  );
}
