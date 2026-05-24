"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Settings,
  Calculator,
  CreditCard,
  Receipt,
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Database,
  Users,
  TrendingUp,
  FolderOpen,
  Tv,
  FlaskConical,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type NavItem = {
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
};

const NAV_GROUPS = [
  {
    group: "Dashboard",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Live Monitor Display",
        href: "/dashboard/tv",
        icon: Tv,
      }
    ]
  },
  {
    group: "Masters",
    items: [
      {
        title: "Accounts & Ledgers",
        icon: BookOpen,
        children: [
          { title: "All Ledgers", href: "/ledgers", icon: BookOpen },
          { title: "Create Ledger", href: "/ledgers/new", icon: BookOpen },
        ],
      },
      {
        title: "Items & Products",
        icon: Package,
        children: [
          { title: "All Items", href: "/inventory", icon: Package },
          { title: "Add New Item", href: "/inventory/new", icon: Package },
        ],
      }
    ]
  },
  {
    group: "Transactions",
    items: [
      {
        title: "Voucher Entry",
        icon: FileText,
        children: [
          { title: "Sales Invoice (F8)", href: "/vouchers/sales", icon: Receipt },
          { title: "Purchase Bill (F9)", href: "/vouchers/purchase", icon: ShoppingCart },
          { title: "Receipt (F6)", href: "/vouchers/receipt", icon: CreditCard },
          { title: "Payment (F5)", href: "/vouchers/payment", icon: ArrowLeftRight },
          { title: "Journal Entry (F7)", href: "/vouchers/journal", icon: BookOpen },
          { title: "Contra Entry (F4)", href: "/vouchers/contra", icon: ArrowLeftRight },
          { title: "All Vouchers", href: "/vouchers", icon: FileText },
        ],
      },
      {
        title: "Quick Billing (POS)",
        href: "/pos",
        icon: Calculator,
      }
    ]
  },
  {
    group: "Reports",
    items: [
      {
        title: "Financial Reports",
        icon: BarChart3,
        children: [
          { title: "Trial Balance", href: "/reports/trial-balance", icon: TrendingUp },
          { title: "Profit & Loss", href: "/reports/pl", icon: BarChart3 },
          { title: "Balance Sheet", href: "/reports/balance-sheet", icon: FileText },
          { title: "GST Summary", href: "/reports/gst", icon: FileText },
          { title: "Outstanding Dues", href: "/reports/outstanding", icon: Users },
          { title: "Bank Reconciliation", href: "/reports/bank-reconciliation", icon: ArrowLeftRight },
          { title: "Dual Book Report", href: "/reports/dual-book", icon: FolderOpen },
        ],
      }
    ]
  },
  {
    group: "Admin",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
      {
        title: "Print Settings",
        href: "/settings/print",
        icon: FileText,
      },
      {
        title: "Data Seeder",
        href: "/settings/seeder",
        icon: FlaskConical,
      }
    ]
  }
];

function NavItemComponent({
  item,
  level = 0,
  isCollapsed,
  isOpen,
  onExpandSidebar
}: {
  item: NavItem;
  level?: number;
  isCollapsed: boolean;
  isOpen: boolean;
  onExpandSidebar: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((child) => child.href && pathname?.startsWith(child.href));
    }
    return false;
  });

  const isActive = item.href ? pathname === item.href || (pathname && pathname.startsWith(item.href + "/")) : false;

  const handleClick = (e: React.MouseEvent) => {
    const isMobileClosed = !isOpen;
    if (isCollapsed || isMobileClosed) {
      e.preventDefault();
      onExpandSidebar();
      setOpen(true);
    } else {
      setOpen((o) => !o);
    }
  };

  if (item.children) {
    return (
      <div className="space-y-1">
        <button
          onClick={handleClick}
          className={cn(
            "flex items-center w-full px-2.5 py-2 text-xs transition-all duration-150 rounded-[var(--radius-sm)] font-semibold select-none cursor-pointer",
            open && !isCollapsed
              ? "bg-muted text-foreground border border-border shadow-[var(--shadow-card)]"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            // If collapsed, center the icon and hide paddings/gaps
            isCollapsed ? "justify-center px-0 gap-0" : "gap-2.5",
            !isOpen && "max-lg:justify-center max-lg:px-0 max-lg:gap-0"
          )}
          title={isCollapsed ? item.title : undefined}
        >
          <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", (open && !isCollapsed) ? "text-accent" : "text-muted-foreground")} />
          <span className={cn(
            "flex-1 text-left transition-all duration-200",
            isCollapsed ? "hidden" : "block",
            !isOpen && "max-lg:hidden"
          )}>
            {item.title}
          </span>
          {!(isCollapsed || !isOpen) && (
            <div className="shrink-0 transition-all duration-200">
              {open ? (
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-80" />
              )}
            </div>
          )}
        </button>
        {open && !isCollapsed && (
          <div className={cn(
            "ml-3 pl-3.5 border-l border-border space-y-1 mt-1 transition-all duration-200",
            !isOpen && "max-lg:hidden"
          )}>
            {item.children.map((child) => (
              <NavItemComponent
                key={child.title}
                item={child}
                level={level + 1}
                isCollapsed={isCollapsed}
                isOpen={isOpen}
                onExpandSidebar={onExpandSidebar}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      className={cn(
        "flex items-center px-2.5 py-2 text-xs transition-all duration-150 rounded-[var(--radius-sm)] font-semibold select-none",
        isActive
          ? "bg-muted text-foreground border border-border shadow-[var(--shadow-card)]"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        // Collapsed styling
        isCollapsed ? "justify-center px-0 gap-0" : "gap-2.5",
        !isOpen && "max-lg:justify-center max-lg:px-0 max-lg:gap-0",
      )}
      title={isCollapsed ? item.title : undefined}
    >
      <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-accent" : "text-muted-foreground")} />
      <span className={cn(
        "flex-1 transition-all duration-200",
        isCollapsed ? "hidden" : "block",
        !isOpen && "max-lg:hidden"
      )}>
        {item.title}
      </span>
      {item.badge && !(isCollapsed || !isOpen) && (
        <span className={cn(
          "text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded-[var(--radius-pill)] shadow-sm transition-all duration-150",
          isCollapsed ? "hidden" : "block",
          !isOpen && "max-lg:hidden"
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on page change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Sync state from localStorage on mount (safe hydration)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erp:sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }
  }, []);

  // Save state to localStorage when isCollapsed changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("erp:sidebar-collapsed", String(isCollapsed));
      window.dispatchEvent(new CustomEvent("erp:sidebar-collapse-change", { detail: isCollapsed }));
    }
  }, [isCollapsed, mounted]);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("erp:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("erp:toggle-sidebar", handleToggle);
  }, []);

  const handleExpandSidebar = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    if (!isOpen && typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-foreground/45 backdrop-blur-sm z-40 lg:hidden cursor-pointer animate-in fade-in duration-200"
        />
      )}

      <div
        className={cn(
          "shrink-0 flex flex-col relative transition-all duration-300 ease-in-out select-none",
          // Desktop styles
          "lg:static lg:h-[calc(100vh-2rem)] lg:my-4 lg:ml-4 lg:z-30",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          // Mobile styles
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 h-screen my-0 ml-0"
            : "max-lg:hidden fixed left-0 w-16 h-[calc(100vh-2rem)] my-4 ml-4 z-30"
        )}
      >
        {/* Sidebar collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 rounded-[var(--radius-sm)] border border-border bg-surface hover:bg-muted text-foreground items-center justify-center cursor-pointer shadow-[var(--shadow-card)] transition-all duration-150 z-50"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed
            ? <PanelLeftOpen className="w-3.5 h-3.5" />
            : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>

        <aside
          className={cn(
            "w-full h-full flex flex-col surface-card overflow-hidden font-sans text-foreground transition-all duration-300",
            isOpen ? "max-lg:rounded-none" : "rounded-[var(--radius-card)]"
          )}
        >
          {/* App header */}
          <div className={cn(
            "flex items-center h-14 bg-muted/35 border-b border-border shrink-0 select-none transition-all duration-300",
            isCollapsed ? "justify-center px-2 gap-0" : "px-4 gap-3",
            !isOpen && "max-lg:justify-center max-lg:px-2 max-lg:gap-0"
          )}>
            <div className="w-8 h-8 bg-accent flex items-center justify-center rounded-[var(--radius-sm)] shadow-[var(--shadow-glow-accent)] border border-accent/30 shrink-0">
              <Database className="w-4 h-4 text-accent-foreground" />
            </div>
            
            <div className={cn(
              "flex flex-col leading-none transition-all duration-200",
              isCollapsed ? "hidden" : "flex",
              !isOpen && "max-lg:hidden"
            )}>
              <div className="font-extrabold text-xs tracking-wider uppercase text-foreground leading-none">Rokado</div>
              <div className="text-[9px] text-muted-foreground font-bold tracking-tight mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-credit inline-block"></span>
                Accounting Workspace
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.group} className="space-y-1.5">
                <div className={cn(
                  "text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2.5 mb-2 select-none transition-all duration-150",
                  isCollapsed ? "opacity-0 h-0 my-0 overflow-hidden" : "opacity-100",
                  !isOpen && "max-lg:opacity-0 max-lg:h-0 max-lg:my-0 max-lg:overflow-hidden"
                )}>
                  {group.group}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavItemComponent
                      key={item.title}
                      item={item}
                      isCollapsed={isCollapsed}
                      isOpen={isOpen}
                      onExpandSidebar={handleExpandSidebar}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* System footer */}
          <div className={cn(
            "px-4 py-3 border-t border-border bg-muted/35 shrink-0 text-[10px] text-muted-foreground font-semibold select-none flex justify-between items-center transition-all duration-300",
            isCollapsed ? "flex-col gap-2 px-2 py-3" : "flex-row",
            !isOpen && "max-lg:flex-col max-lg:gap-2 max-lg:px-2 max-lg:py-3"
          )}>
            <span className={cn(
              "flex items-center gap-1",
              isCollapsed ? "hidden" : "flex",
              !isOpen && "max-lg:hidden"
            )}>
              Fiscal Year: <strong className="text-foreground font-bold">2026-27</strong>
            </span>
            <span className={cn(
              "text-credit font-bold uppercase tracking-wider text-[9px] bg-credit/10 px-2 py-0.5 rounded-[var(--radius-pill)] border border-credit/20 transition-all flex items-center gap-1.5",
              isCollapsed ? "px-1 py-1 w-6 h-6 justify-center" : "",
              !isOpen && "max-lg:px-1 max-lg:py-1 max-lg:w-6 max-lg:h-6 max-lg:flex max-lg:items-center max-lg:justify-center"
            )} title="Secure Session">
              <span className="w-1.5 h-1.5 rounded-full bg-credit inline-block shrink-0" />
              <span className={cn(isCollapsed ? "hidden" : "inline", !isOpen && "max-lg:hidden")}>Secure</span>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
