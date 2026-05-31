import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { ShortcutSidebar } from "@/components/layout/shortcut-sidebar";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ERPShortcutsProvider } from "@/components/layout/erp-shortcuts-provider";
import { PageTransitionProvider } from "@/components/providers/page-transition-provider";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/providers/auth-provider";
import { OnboardingProvider } from "@/components/providers/onboarding-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";



export default async function ERPLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.companyId) {
    redirect("/onboarding");
  }

  return (
    <AuthProvider initialUser={session}>
      <OnboardingProvider>
        <PWAProvider>
          <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
              <TopBar />
              <main className="flex-1 overflow-y-auto min-h-0 p-6 bg-background/25">
                <PageTransitionProvider>
                  {children}
                </PageTransitionProvider>
              </main>
            </div>
            <ShortcutSidebar />
            {/* Global overlays */}
            <CommandPalette />
            <ERPShortcutsProvider />
          </div>
        </PWAProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}
