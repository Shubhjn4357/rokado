"use client";

import { Search, Moon, Sun, Keyboard, CheckCircle2, ChevronDown, Menu, User, LogOut, ShieldAlert, RefreshCw, CloudOff, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <header className="h-14 flex items-center justify-between gap-4 px-6 border-b border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl text-foreground shrink-0 font-sans text-xs select-none shadow-sm">
      
      {/* Left Area: Company & F.Y. Status Indicators */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Sidebar toggle hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden w-9 h-9 rounded-xl border border-border/80 bg-background/40 hover:bg-muted/70 cursor-pointer transition-all duration-200"
          onClick={() => window.dispatchEvent(new CustomEvent("erp:toggle-sidebar"))}
        >
          <Menu className="w-4 h-4" />
        </Button>

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
        
        {/* Dynamic Sync Status Badge */}
        {isSyncing ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-black text-[10px] tracking-wide uppercase shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)] select-none">
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>Syncing...</span>
          </div>
        ) : !isOnline ? (
          <div
            title={`${pendingCount} offline transaction(s) queued for sync.`}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-black text-[10px] tracking-wide uppercase shadow-[0_0_15px_-3px_rgba(244,63,94,0.25)] select-none animate-pulse"
          >
            <CloudOff className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
            <span>Offline ({pendingCount})</span>
          </div>
        ) : (
          <button
            onClick={() => syncNow()}
            title="Database synced with cloud storage. Click to force check sync."
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-[10px] tracking-wide uppercase shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)] cursor-pointer select-none transition-all duration-200 hover:scale-105 active:scale-95 flex"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cloud Synced</span>
          </button>
        )}

        {/* Shortcuts indicator */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent("erp:toggle-shortcuts-sidebar"))}
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl hover:bg-muted/70 transition-all duration-200"
        >
          <Keyboard className="w-4 h-4" />
          <span>Hotkeys</span>
        </Button>

        {/* Notifications Desk */}
        <Notifications />

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

        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-3 hover:bg-muted/70 rounded-xl border border-border/85 bg-background/40 font-bold transition-all duration-200 select-none cursor-pointer flex items-center"
              >
                <div className="w-5 h-5 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] text-white font-extrabold shadow-sm uppercase shrink-0">
                  {name ? name.substring(0, 2) : "US"}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none text-left shrink-0">
                  <span className="text-[10px] text-foreground font-black">{name}</span>
                  <span className="text-[8px] text-muted-foreground font-bold uppercase mt-0.5 tracking-wider">
                    {role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/80 bg-card/95 backdrop-blur-2xl shadow-xl p-1 font-sans text-xs">
              <DropdownMenuLabel className="px-3.5 py-2">
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Logged In As</div>
                <div className="text-foreground font-black text-xs mt-1 truncate">{name}</div>
                <div className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                  {role} Account
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem className="px-3.5 py-2 hover:bg-muted/80 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-slate-300">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>My Ledger Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3.5 py-2 hover:bg-muted/80 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-slate-300">
                <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                <span>Security Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="px-3.5 py-2 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg cursor-pointer transition-colors flex items-center gap-2 font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
