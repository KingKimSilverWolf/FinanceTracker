'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, BarChart3, Receipt, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  {
    name: 'Groups',
    href: '/dashboard/groups',
    icon: Users,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

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
      </div>
    </nav>
  );
}
