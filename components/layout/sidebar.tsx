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
  Database,
  Users,
  TrendingUp,
  FolderOpen,
  Tv
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
        title: "Enterprise Board",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Showroom TV Monitor",
        href: "/dashboard/tv",
        icon: Tv,
      }
    ]
  },
  {
    group: "Masters Info",
    items: [
      {
        title: "Accounts (Ledgers)",
        icon: BookOpen,
        children: [
          { title: "All Ledgers", href: "/ledgers", icon: BookOpen },
          { title: "Create Ledger", href: "/ledgers/new", icon: BookOpen },
        ],
      },
      {
        title: "Stock Registry",
        icon: Package,
        children: [
          { title: "Inventory items", href: "/inventory", icon: Package },
          { title: "Add Saree Stock", href: "/inventory/new", icon: Package },
        ],
      }
    ]
  },
  {
    group: "Transactions Entries",
    items: [
      {
        title: "Vouchers Journal",
        icon: FileText,
        children: [
          { title: "Sales Invoice (F8)", href: "/vouchers/sales", icon: Receipt },
          { title: "Purchase Bill (F9)", href: "/vouchers/purchase", icon: ShoppingCart },
          { title: "Receipt (F6)", href: "/vouchers/receipt", icon: CreditCard },
          { title: "Payment (F5)", href: "/vouchers/payment", icon: ArrowLeftRight },
          { title: "Journal Entry (F7)", href: "/vouchers/journal", icon: BookOpen },
          { title: "Contra Entry (F4)", href: "/vouchers/contra", icon: ArrowLeftRight },
          { title: "All Postings", href: "/vouchers", icon: FileText },
        ],
      },
      {
        title: "POS Billing Desk",
        href: "/pos",
        icon: Calculator,
      }
    ]
  },
  {
    group: "Reports & Audits",
    items: [
      {
        title: "Financial Statements",
        icon: BarChart3,
        children: [
          { title: "Trial Balance", href: "/reports/trial-balance", icon: TrendingUp },
          { title: "Profit & Loss A/c", href: "/reports/pl", icon: BarChart3 },
          { title: "Balance Sheet", href: "/reports/balance-sheet", icon: FileText },
          { title: "GST Auditing", href: "/reports/gst", icon: FileText },
          { title: "Outstanding Receivables", href: "/reports/outstanding", icon: Users },
          { title: "Bank Reconciliation", href: "/reports/bank-reconciliation", icon: ArrowLeftRight },
          { title: "Shadow Dual Book", href: "/reports/dual-book", icon: FolderOpen },
        ],
      }
    ]
  },
  {
    group: "Utilities & Admin",
    items: [
      {
        title: "Company Settings",
        href: "/settings",
        icon: Settings,
      }
    ]
  }
];

function NavItemComponent({ item, level = 0 }: { item: NavItem; level?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((child) => child.href && pathname?.startsWith(child.href));
    }
    return false;
  });

  const isActive = item.href ? pathname === item.href || (pathname && pathname.startsWith(item.href + "/")) : false;

  if (item.children) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-all duration-200 rounded-xl font-bold select-none cursor-pointer",
            open
              ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/10"
              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
          )}
        >
          <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", open ? "text-white" : "text-slate-400")} />
          <span className="flex-1 text-left">{item.title}</span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          )}
        </button>
        {open && (
          <div className="ml-3 pl-3.5 border-l border-slate-800 space-y-1 mt-1 transition-all duration-300">
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
        "flex items-center gap-2.5 px-3 py-2 text-xs transition-all duration-200 rounded-xl font-bold select-none",
        isActive
          ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/10"
          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
      )}
    >
      <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-400")} />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-sm">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on page change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("erp:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("erp:toggle-sidebar", handleToggle);
  }, []);

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden cursor-pointer animate-in fade-in duration-200"
        />
      )}

      <aside
        className={cn(
          "w-64 shrink-0 h-screen flex flex-col bg-[#090e18] border-r border-slate-900 overflow-hidden font-sans text-slate-200 transition-transform duration-300 lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-50",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        
        {/* Premium Business-Class App Header */}
        <div className="flex items-center gap-3 px-4 h-14 bg-[#05080f] border-b border-slate-900 shrink-0">
          <div className="w-8 h-8 bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/20">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-xs tracking-wider uppercase text-white leading-none">SHREE SAREE</div>
            <div className="text-[9px] text-slate-400 font-bold tracking-tight mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              Enterprise ERP Suite
            </div>
          </div>
        </div>

        {/* Nav groups grouped by classic accounting master layouts */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1.5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 select-none">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItemComponent key={item.title} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Modern Active System Footer */}
        <div className="px-4 py-3.5 border-t border-slate-900 bg-[#05080f] shrink-0 text-[10px] text-slate-400 font-semibold select-none flex justify-between items-center">
          <span className="flex items-center gap-1">
            Fiscal Year: <strong className="text-white font-bold">2026–27</strong>
          </span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            ● Secure
          </span>
        </div>
      </aside>
    </>
  );
}
