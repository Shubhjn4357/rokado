import type { Tour } from "nextstepjs";

export const onboardingSteps: Tour[] = [
  {
    tour: "onboarding",
    steps: [
      {
        icon: "🏢",
        title: "Welcome to Rokado ERP",
        content: "Welcome to your premium, high-fidelity business ledger and inventory workspace. This quick interactive tour will introduce you to our Tally-style keyboard operations, fast reports, and premium utilities.",
        selector: "#tour-sidebar-logo",
        side: "right",
      },
      {
        icon: "📊",
        title: "Executive View Statistics",
        content: "Track live daily sales, inventory levels, and available liquid cash at a single glance. Hovering over cards triggers subtle premium card movements.",
        selector: "#tour-overview-stats",
        side: "bottom",
      },
      {
        icon: "🔍",
        title: "Universal Command Palette",
        content: "Press Alt+G anywhere in the app to open the Tally-style universal command palette. Search instantly for ledgers, items, or quickly jump to any report or settings page without touching your mouse.",
        selector: "#tour-topbar-search",
        side: "bottom",
      },
      {
        icon: "📝",
        title: "Voucher Entry Desk",
        content: "Welcome to the Transaction Desk. Swap voucher types instantly using standard function keys: Contra (F4), Payment (F5), Receipt (F6), Journal (F7), Sales (F8), and Purchase (F9). Supports dual Dr/Cr mode or itemized invoice mode.",
        selector: "#tour-voucher-card",
        side: "top",
        nextRoute: "/vouchers/sales",
      },
      {
        icon: "📚",
        title: "Accounting Ledgers Master",
        content: "Manage customers, suppliers, banks, and capital accounts in our master repository. Need to create a ledger on the fly during voucher entry? Simply hit Alt+C to open the creator dialog instantly!",
        selector: "#tour-new-ledger-btn",
        side: "left",
        prevRoute: "/dashboard",
        nextRoute: "/ledgers",
      },
      {
        icon: "⚖️",
        title: "Detailed Financial Reports",
        content: "View your Balance Sheet, Profit & Loss, or Trial Balance with absolute clarity. Press Alt+F1 to toggle the detailed ledger breakdowns instantly, just like Tally Prime!",
        selector: "#tour-detailed-btn",
        side: "bottom",
        prevRoute: "/ledgers",
        nextRoute: "/reports/balance-sheet",
      },
      {
        icon: "📤",
        title: "5-Format Unified Exporter",
        content: "Need your reports offline? Download the active sheet in high-fidelity Excel (.xlsx), professional PDF document, PNG screenshot, comma-separated values (.csv), or structured JSON file in a single click.",
        selector: "#tour-export-dropdown",
        side: "left",
        prevRoute: "/reports/balance-sheet",
      },
      {
        icon: "⚙️",
        title: "System Settings Desk",
        content: "Manage your business profiles, fiscal configurations, security credentials, taxation rules, andlow-stock alert levels dynamically in our visual settings control panel.",
        selector: "#tour-settings-tabs",
        side: "bottom",
        prevRoute: "/reports/balance-sheet",
        nextRoute: "/settings",
      },
      {
        icon: "⚡",
        title: "Dynamic Demo Data Seeder",
        content: "Want to seed mock invoices, sales registers, or low stock exception logs to test reports? Use our dynamically-controlled seeder tool to generate realistic double-entry accounting records in a single click!",
        selector: "#tour-seeder-card",
        side: "right",
        prevRoute: "/settings",
        nextRoute: "/settings/seeder",
      },
      {
        icon: "⌨️",
        title: "Tally Prime Shortcut Desk",
        content: "Press 'K' or click this button to open the quick reference sidebar for all spatial hotkeys and actions. Rokado ERP is fully mouse-free, giving you blistering data-entry speeds! Press Escape or click 'Finish' to complete the tour.",
        selector: "#tour-shortcut-sidebar",
        side: "left",
        prevRoute: "/settings/seeder",
      }
    ]
  }
];
