"use client";

import { useEffect, useState, useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, AlertCircle, Info, Database, ArrowRight, Check } from "lucide-react";
import { getNotifications, ERPNotification } from "@/lib/notification-actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Notifications() {
  const [notifications, setNotifications] = useState<ERPNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchNotifications = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const data = await getNotifications();
      if (isMounted.current) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityStyles = (severity: ERPNotification["severity"]) => {
    switch (severity) {
      case "danger":
        return {
          bg: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/5 dark:border-rose-500/10",
          text: "text-rose-600 dark:text-rose-400",
          iconColor: "text-rose-500",
          icon: AlertCircle,
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/10",
          text: "text-amber-600 dark:text-amber-400",
          iconColor: "text-amber-500",
          icon: AlertTriangle,
        };
      case "info":
      default:
        return {
          bg: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/10",
          text: "text-blue-600 dark:text-blue-400",
          iconColor: "text-blue-500",
          icon: Info,
        };
    }
  };

  const getIconForType = (type: ERPNotification["type"]) => {
    switch (type) {
      case "backup_reminder":
        return Database;
      default:
        return null;
    }
  };

  const activeCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) fetchNotifications();
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground border border-border/80 bg-background/40 hover:bg-muted/70 transition-all duration-200 cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-background animate-pulse">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 md:w-96 p-0 border border-border/80 bg-card/95 dark:bg-card/85 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs tracking-wider uppercase text-foreground">
              Notification Desk
            </span>
            {activeCount > 0 && (
              <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                {activeCount} Active
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            className="h-7 text-[10px] font-bold text-accent cursor-pointer hover:bg-accent/10 px-2 rounded-lg"
          >
            Refresh
          </Button>
        </div>

        {/* Content list */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs font-semibold gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin"></span>
              <span>Scanning databases...</span>
            </div>
          ) : activeCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-muted-foreground gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-extrabold text-xs text-foreground uppercase tracking-wider mb-1">
                  Everything Secure
                </p>
                <p className="text-[10px] font-medium leading-relaxed max-w-[240px]">
                  Stock levels are healthy, all dues are clear, and backups are up-to-date.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 space-y-2">
              {notifications.map((item) => {
                const styles = getSeverityStyles(item.severity);
                const IconComponent = getIconForType(item.type) || styles.icon;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-2 p-3 border rounded-xl shadow-sm transition-all duration-200",
                      styles.bg
                    )}
                  >
                    <div className="flex gap-2">
                      <IconComponent className={cn("w-4 h-4 shrink-0 mt-0.5", styles.iconColor)} />
                      <div className="flex-1 space-y-0.5">
                        <p className="font-black text-xs text-foreground leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[10px] leading-relaxed text-muted-foreground font-semibold">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Link href={item.actionUrl} onClick={() => setOpen(false)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 text-[10px] font-black gap-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-lg px-2.5",
                            styles.text
                          )}
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/60 bg-muted/40 text-[9px] text-center text-muted-foreground font-bold tracking-tight select-none">
          Active Co: SHREE SAREE HOUSE ERP SUITE
        </div>
      </PopoverContent>
    </Popover>
  );
}
