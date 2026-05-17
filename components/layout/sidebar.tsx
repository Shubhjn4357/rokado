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
  Building2,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavItem = {
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Vouchers",
    icon: FileText,
    children: [
      { title: "Sales (F8)", href: "/vouchers/sales", icon: Receipt },
      { title: "Purchase (F9)", href: "/vouchers/purchase", icon: ShoppingCart },
      { title: "Receipt (F6)", href: "/vouchers/receipt", icon: CreditCard },
      { title: "Payment (F5)", href: "/vouchers/payment", icon: ArrowLeftRight },
      { title: "Journal (F7)", href: "/vouchers/journal", icon: BookOpen },
      { title: "Contra (F4)", href: "/vouchers/contra", icon: ArrowLeftRight },
      { title: "All Vouchers", href: "/vouchers", icon: FileText },
    ],
  },
  {
    title: "Ledgers",
    icon: BookOpen,
    children: [
      { title: "All Ledgers", href: "/ledgers", icon: BookOpen },
      { title: "Customers", href: "/ledgers/debtors", icon: Users },
      { title: "Suppliers", href: "/ledgers/creditors", icon: Building2 },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    badge: "LOW",
  },
  {
    title: "POS Billing",
    href: "/pos",
    icon: Calculator,
  },
  {
    title: "Reports",
    icon: BarChart3,
    children: [
      { title: "Trial Balance", href: "/reports/trial-balance", icon: TrendingUp },
      { title: "P&L Statement", href: "/reports/pl", icon: BarChart3 },
      { title: "Balance Sheet", href: "/reports/balance-sheet", icon: FileText },
      { title: "GST Reports", href: "/reports/gst", icon: FileText },
      { title: "Outstanding", href: "/reports/outstanding", icon: Users },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function NavItemComponent({ item, level = 0 }: { item: NavItem; level?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((child) => child.href && pathname.startsWith(child.href));
    }
    return false;
  });

  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all group",
            open
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left font-medium">{item.title}</span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          )}
        </button>
        {open && (
          <div className="mt-1 ml-3 pl-3 border-l border-border/50 space-y-0.5">
            {item.children.map((child) => (
              <NavItemComponent key={child.title} item={child} level={level + 1} />
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
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 font-medium">{item.title}</span>
      {item.badge && (
        <span className="text-[10px] font-bold bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 h-screen flex flex-col bg-card/80 backdrop-blur-xl border-r border-border/60 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border/50 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-sm">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm leading-none">Shree Saree</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">ERP System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItemComponent key={item.title} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/50 shrink-0">
        <div className="text-[11px] text-muted-foreground">
          FY 2025–26 · v1.0.0
        </div>
      </div>
    </aside>
  );
}
