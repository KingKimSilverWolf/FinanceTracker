'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { subscribeToUserGroups, Group } from '@/lib/firebase/groups';
import { subscribeToUserExpenses } from '@/lib/firebase/expenses';
import { getRecurringExpenseStats } from '@/lib/firebase/recurring';
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  Users, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Repeat
} from 'lucide-react';
import type { Expense } from '@/types';

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserGroups(user.uid, (updatedGroups) => {
      setGroups(updatedGroups);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
          {/* Header */}
          <header className="border-b border-border/50 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/80">
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">D</span>
              </div>
              <span className="font-bold text-xl">DuoFi</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.photoURL || undefined} alt={userProfile?.displayName} />
                    <AvatarFallback>
                      {getInitials(userProfile?.displayName || user?.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userProfile?.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3">
              Welcome back, {userProfile?.displayName?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your shared expenses and settle up with your groups.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Link href="/dashboard/groups">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">View Groups</CardTitle>
                      <CardDescription className="text-sm">Manage your groups</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/dashboard/expenses">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">View Expenses</CardTitle>
                      <CardDescription className="text-sm">All your expenses</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Add Expense</CardTitle>
                    <CardDescription className="text-sm">Track shared or personal</CardDescription>
                  </div>
                  <AddExpenseDialog />
                </div>
              </CardHeader>
            </Card>

            <Link href="/dashboard/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Analytics</CardTitle>
                      <CardDescription>Spending insights</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Groups Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Groups</CardTitle>
                  <CardDescription>Groups you&apos;re part of will appear here</CardDescription>
                </div>
                <Link href="/dashboard/groups">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading groups...</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Create your first group to start tracking shared expenses with friends, roommates,
                    or family.
                  </p>
                  <Link href="/dashboard/groups">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Group
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groups.slice(0, 6).map((group) => {
                    const isAdmin = group.createdBy === user?.uid;
                    return (
                      <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {group.name}
                                  {isAdmin && (
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                  )}
                                </CardTitle>
                                {group.description && (
                                  <CardDescription className="mt-1 line-clamp-2">
                                    {group.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
