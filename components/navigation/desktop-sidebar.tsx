'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, BarChart3, Receipt, Users, User, DollarSign, LogOut, ChevronLeft, Menu, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { useSidebar } from '@/lib/contexts/sidebar-context';

const navItems = [
  {
    name: 'Dashboard',
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
    name: 'Settlements',
    href: '/dashboard/settlements',
    icon: DollarSign,
  },
  {
    name: 'Groups',
    href: '/dashboard/groups',
    icon: Users,
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 h-screen bg-card border-r transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">DF</span>
            </div>
            <span className="font-bold text-lg">DuoFi</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn('shrink-0', isCollapsed && 'mx-auto')}
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all',
                'hover:bg-accent',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive && 'fill-current/20')} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full justify-start gap-3',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
