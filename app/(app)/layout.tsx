import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SearchPalette } from "@/components/layout/search-palette";
import { PageTransition } from "@/components/layout/page-transition";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { SessionWatcher } from "@/components/layout/session-watcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none"
        >
          Skip to content
        </a>
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+4rem)] md:px-6 md:pt-6 md:pb-20"
            tabIndex={-1}
          >
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <SearchPalette />
      </div>
      <SessionWatcher />
    </SidebarProvider>
  );
}
