import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { ShortcutSidebar } from "@/components/layout/shortcut-sidebar";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ERPShortcutsProvider } from "@/components/layout/erp-shortcuts-provider";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/providers/auth-provider";

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={session}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
        <ShortcutSidebar />
        {/* Global overlays */}
        <CommandPalette />
        <ERPShortcutsProvider />
      </div>
    </AuthProvider>
  );
}
