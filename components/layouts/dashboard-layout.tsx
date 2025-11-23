'use client';

import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
import { DesktopSidebar } from '@/components/navigation/desktop-sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pb-20 md:pb-0', // Add bottom padding on mobile for bottom nav
          'md:ml-64' // Add left margin on desktop for sidebar
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
