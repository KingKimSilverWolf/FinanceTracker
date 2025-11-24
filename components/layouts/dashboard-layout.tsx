'use client';

import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
import { DesktopSidebar } from '@/components/navigation/desktop-sidebar';
import { SidebarProvider, useSidebar } from '@/lib/contexts/sidebar-context';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pb-20 md:pb-0 transition-all duration-300', // Add bottom padding on mobile for bottom nav
          isCollapsed ? 'md:ml-16' : 'md:ml-64' // Responsive left margin based on sidebar state
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
