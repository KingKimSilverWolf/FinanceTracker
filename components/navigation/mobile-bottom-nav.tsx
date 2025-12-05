'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BarChart3, Receipt, Clock, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Expenses',
    href: '/dashboard/expenses',
    icon: Receipt,
  },
  {
    name: 'Recurring',
    href: '/dashboard/recurring',
    icon: Clock,
  },
];

const moreItems = [
  { name: 'Groups', href: '/dashboard/groups' },
  { name: 'Settlements', href: '/dashboard/settlements' },
  { name: 'Profile', href: '/dashboard/profile' },
  { name: 'Settings', href: '/dashboard/settings' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t md:hidden supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'fill-primary/20')} />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          );
        })}

        {/* More Menu */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[50vh]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-2">
              {/* Notifications */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Notifications</span>
                  <NotificationBell />
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {moreItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push(item.href);
                      setMoreOpen(false);
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
