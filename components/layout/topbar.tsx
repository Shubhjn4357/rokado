"use client";

import {
  Search, Moon, Sun, Keyboard, ChevronDown, Menu,
  User, LogOut, ShieldAlert, RefreshCw, CloudOff, Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Notifications } from "./notifications";
import { useAuth } from "@/hooks/use-auth";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, logout, role, name } = useAuth();
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between gap-3 px-4 mt-3 mr-3 ml-2 surface-card text-foreground rounded-[var(--radius-card)] shrink-0 font-sans text-xs select-none">

      {/* Left: hamburger (mobile) + company name */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden w-8 h-8 rounded-xl hover:bg-muted cursor-pointer"
          onClick={() => window.dispatchEvent(new CustomEvent("erp:toggle-sidebar"))}
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div className="flex flex-col leading-none">
          <span className="font-black text-foreground text-xs tracking-tight">Shree Saree House</span>
          <span className="text-[9px] text-muted-foreground font-medium mt-0.5">FY 2026–27</span>
        </div>
      </div>

      {/* Centre: search trigger — slim pill */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("erp:command-palette"))}
        className="flex-1 max-w-64 hidden sm:flex items-center gap-2 h-8 px-3 bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all duration-200 cursor-pointer group"
      >
        <Search className="w-3.5 h-3.5 shrink-0 group-hover:text-accent transition-colors" />
        <span className="text-[11px] font-medium flex-1 text-left">Search…</span>
        <kbd className="text-[9px] font-mono bg-background border border-border px-1 py-0.5 rounded font-bold opacity-60">Alt+G</kbd>
      </button>

      {/* Right: icon-only actions */}
      <div className="flex items-center gap-1 ml-auto shrink-0">

        {/* Sync status — icon only, text on hover via title */}
        {isSyncing ? (
          <div title="Syncing with cloud…" className="w-8 h-8 flex items-center justify-center rounded-xl text-panel-yellow-fg dark:text-panel-yellow cursor-default">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          </div>
        ) : !isOnline ? (
          <button
            title={`Offline — ${pendingCount} pending`}
            onClick={() => syncNow()}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer animate-pulse"
          >
            <CloudOff className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            title="Synced — click to force sync"
            onClick={() => syncNow()}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-credit hover:bg-credit/10 transition-colors cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hotkeys — icon only */}
        <Button
          variant="ghost"
          size="icon"
          title="Keyboard shortcuts"
          onClick={() => window.dispatchEvent(new CustomEvent("erp:toggle-shortcuts-sidebar"))}
          className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </Button>

        {/* Notifications */}
        <Notifications />

        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>
        )}

        {/* Divider */}
        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* User avatar dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 gap-2 px-2 hover:bg-muted rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center"
              >
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] text-accent-foreground font-extrabold uppercase shrink-0">
                  {name ? name.substring(0, 2) : "US"}
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border bg-surface-elevated backdrop-blur-2xl shadow-(--shadow-elevated) p-1 font-sans text-xs">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Signed in as</div>
                <div className="text-foreground font-black text-xs mt-0.5 truncate">{name}</div>
                <div className="text-[9px] text-accent font-bold uppercase tracking-widest mt-0.5">{role}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-foreground">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-foreground">
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Security</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors flex items-center gap-2 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
