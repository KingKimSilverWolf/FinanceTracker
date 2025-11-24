'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { subscribeToUserGroups, type Group } from '@/lib/firebase/groups';
import { subscribeToUserExpenses } from '@/lib/firebase/expenses';
import { getRecurringExpenseStats, type RecurringExpenseStats } from '@/lib/firebase/recurring';
import { calculatePersonBalances, calculateOptimalSettlements } from '@/lib/settlement/calculations';
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { getCardDesign } from '@/lib/constants/card-designs';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Users, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  ArrowUpRight,
  Repeat,
  Clock,
  AlertCircle,
  ArrowRight,
  Wallet,
  Bell,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  CreditCard
} from 'lucide-react';

interface DashboardExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  type: 'personal' | 'shared';
  paidBy?: string;
  groupId?: string;
  groupName?: string;
  splitBetween?: string[];
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<DashboardExpense[]>([]);
  const [recurringStats, setRecurringStats] = useState<RecurringExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Subscribe to groups
    const unsubscribeGroups = subscribeToUserGroups(user.uid, (updatedGroups: Group[]) => {
      setGroups(updatedGroups);
    });

    // Subscribe to expenses
    const unsubscribeExpenses = subscribeToUserExpenses(
      user.uid,
      (updatedExpenses: any[]) => {
        const mappedExpenses = updatedExpenses.map((exp: any) => ({
          id: exp.id,
          description: exp.description,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          type: exp.type,
          paidBy: exp.paidBy,
          groupId: exp.groupId,
          groupName: exp.groupName || '',
          splitBetween: exp.splitBetween,
        }));
        setExpenses(mappedExpenses);
        setLoading(false);
      }
    );

    // Load recurring stats
    getRecurringExpenseStats(user.uid).then(setRecurringStats);

    return () => {
      unsubscribeGroups();
      unsubscribeExpenses();
    };
  }, [user]);

  // Calculate comprehensive dashboard statistics
  const stats = useMemo(() => {
    if (!user) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Today's expenses
    const todayExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.toDateString() === now.toDateString();
    });
    const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // This week's expenses (last 7 days)
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekExpenses = expenses.filter(exp => new Date(exp.date) >= weekAgo);
    const thisWeekTotal = thisWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Current month expenses
    const currentMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });

    // Last month expenses
    const lastMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
    });

    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const monthChange = lastMonthTotal > 0 
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    // Shared vs Personal breakdown
    const sharedTotal = currentMonthExpenses
      .filter(exp => exp.type === 'shared')
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const personalTotal = currentMonthExpenses
      .filter(exp => exp.type === 'personal')
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown (top 3)
    const categoryTotals = new Map<string, number>();
    currentMonthExpenses.forEach(exp => {
      categoryTotals.set(exp.category, (categoryTotals.get(exp.category) || 0) + exp.amount);
    });
    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: currentMonthTotal > 0 ? (amount / currentMonthTotal) * 100 : 0
      }));

    // Calculate settlement balances
    const userMap = new Map<string, string>();
    userMap.set(user.uid, userProfile?.displayName || 'You');
    
    // Add all group members to map
    groups.forEach(group => {
      group.members.forEach(member => {
        if (!userMap.has(member.userId)) {
          userMap.set(member.userId, member.displayName);
        }
      });
    });

    const sharedExpenses = expenses
      .filter(exp => exp.type === 'shared' && exp.paidBy && exp.splitBetween)
      .map(exp => ({
        paidBy: exp.paidBy!,
        amount: exp.amount,
        splitBetween: exp.splitBetween!
      }));

    const balances = calculatePersonBalances(sharedExpenses, userMap);
    const settlements = calculateOptimalSettlements(balances);

    // Calculate what user owes and is owed
    const userOwes = settlements
      .filter(s => s.from === user.uid)
      .reduce((sum, s) => sum + s.amount, 0);
    
    const userIsOwed = settlements
      .filter(s => s.to === user.uid)
      .reduce((sum, s) => sum + s.amount, 0);

    const netBalance = userIsOwed - userOwes;

    // Average daily spending (this month)
    const daysInMonth = now.getDate();
    const avgDaily = daysInMonth > 0 ? currentMonthTotal / daysInMonth : 0;

    // Upcoming recurring expenses
    const upcomingRecurring = recurringStats?.dueThisWeek || 0;

    return {
      todayTotal,
      thisWeekTotal,
      currentMonthTotal,
      lastMonthTotal,
      monthChange,
      sharedTotal,
      personalTotal,
      totalExpenses: expenses.length,
      currentMonthCount: currentMonthExpenses.length,
      topCategories,
      userOwes,
      userIsOwed,
      netBalance,
      avgDaily,
      upcomingRecurring,
      settlements: settlements.filter(s => s.from === user.uid || s.to === user.uid).slice(0, 3),
    };
  }, [expenses, groups, user, userProfile, recurringStats]);

  const recentExpenses = expenses.slice(0, 5);

  if (!stats) return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Hero Section with Enhanced Quick Stats */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                Welcome back, {userProfile?.displayName?.split(' ')[0] || 'there'}! 👋
              </h1>
              <p className="text-muted-foreground mt-2">
                Here&apos;s your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Today&apos;s Spending</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(stats.todayTotal)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/50 dark:border-purple-800/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">This Week</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats.thisWeekTotal)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Daily Average</p>
                      <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(stats.avgDaily)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Key Metrics Cards - Enhanced */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total This Month */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total This Month
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.currentMonthTotal)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stats.monthChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">+{stats.monthChange.toFixed(1)}%</span>
                    </>
                  ) : stats.monthChange < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">{stats.monthChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <span>No change</span>
                  )}
                  <span className="ml-1">from last month</span>
                </p>
              </CardContent>
            </Card>

            {/* Settlement Balance - NEW */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.netBalance >= 0 ? '+' : ''}{formatCurrency(stats.netBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.netBalance > 0 ? `You are owed ${formatCurrency(stats.userIsOwed)}` : 
                   stats.netBalance < 0 ? `You owe ${formatCurrency(stats.userOwes)}` : 
                   'All settled up!'}
                </p>
              </CardContent>
            </Card>

            {/* Shared Expenses */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Shared Expenses
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(stats.sharedTotal)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {groups.length} group{groups.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* Recurring Expenses */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recurring Bills
                </CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recurringStats?.active || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stats.upcomingRecurring > 0 && (
                    <>
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400">{stats.upcomingRecurring} due this week</span>
                    </>
                  )}
                  {stats.upcomingRecurring === 0 && (
                    <span>{recurringStats?.estimatedMonthly ? formatCurrency(recurringStats.estimatedMonthly) : '$0'}/mo</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-7">
            {/* Left Column - Quick Actions */}
            <div className="md:col-span-3 space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AddExpenseDialog>
                    <Button className="w-full justify-start h-auto py-4" size="lg">
                      <Plus className="mr-3 h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">Add Expense</span>
                        <span className="text-xs font-normal opacity-80">Track a new transaction</span>
                      </div>
                    </Button>
                  </AddExpenseDialog>

                  <Link href="/dashboard/expenses" className="block">
                    <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
                      <Receipt className="mr-3 h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">View All Expenses</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {stats.totalExpenses} total • {stats.currentMonthCount} this month
                        </span>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/dashboard/analytics" className="block">
                    <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
                      <TrendingUp className="mr-3 h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">View Analytics</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          Insights & spending trends
                        </span>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/dashboard/settlements" className="block">
                    <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
                      <Wallet className="mr-3 h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">Settlements</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {stats.settlements.length > 0 ? `${stats.settlements.length} pending` : 'All settled up'}
                        </span>
                      </div>
                      {stats.settlements.length > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {stats.settlements.length}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Top Spending Categories with Visual Chart */}
              {stats.topCategories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Top Categories This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.topCategories.map((cat, index) => {
                      const colors = [
                        'bg-blue-500',
                        'bg-purple-500', 
                        'bg-pink-500'
                      ];
                      const textColors = [
                        'text-blue-600 dark:text-blue-400',
                        'text-purple-600 dark:text-purple-400',
                        'text-pink-600 dark:text-pink-400'
                      ];
                      return (
                        <div key={cat.category} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${colors[index]}`} />
                              <span className="font-medium">{cat.category}</span>
                            </div>
                            <span className={`font-semibold ${textColors[index]}`}>
                              {formatCurrency(cat.amount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={cat.percentage} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                              {cat.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Pending Settlements */}
              {stats.settlements.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-amber-500" />
                      Pending Settlements
                    </CardTitle>
                    <Link href="/dashboard/settlements">
                      <Button variant="ghost" size="sm">
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.settlements.map((settlement) => {
                      const isYouPaying = settlement.from === user?.uid;
                      const otherPersonId = isYouPaying ? settlement.to : settlement.from;
                      const otherPersonName = groups
                        .flatMap(g => g.members)
                        .find(m => m.userId === otherPersonId)?.displayName || 'Someone';

                      return (
                        <div key={`${settlement.from}-${settlement.to}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isYouPaying ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                              <ArrowRight className={`h-4 w-4 ${isYouPaying ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {isYouPaying ? `Pay ${otherPersonName}` : `${otherPersonName} pays you`}
                              </p>
                              <p className="text-xs text-muted-foreground">Group settlement</p>
                            </div>
                          </div>
                          <span className={`font-semibold ${isYouPaying ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(settlement.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Activity & Groups */}
            <div className="md:col-span-4 space-y-6">
              {/* Spending Trend Visualization */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Last 7 Days Spending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {(() => {
                      const last7Days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        return date;
                      });
                      
                      const dailyTotals = last7Days.map(date => {
                        const dayExpenses = expenses.filter(exp => {
                          const expDate = new Date(exp.date);
                          return expDate.toDateString() === date.toDateString();
                        });
                        return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                      });
                      
                      const maxAmount = Math.max(...dailyTotals, 1);
                      
                      return last7Days.map((date, index) => {
                        const height = (dailyTotals[index] / maxAmount) * 100;
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                              <div 
                                className={`w-full rounded-t transition-all ${
                                  isToday 
                                    ? 'bg-primary' 
                                    : 'bg-primary/40 hover:bg-primary/60'
                                }`}
                                style={{ height: `${height}%` }}
                                title={`${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${formatCurrency(dailyTotals[index])}`}
                              />
                            </div>
                            <span className={`text-xs ${isToday ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Link href="/dashboard/expenses">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : recentExpenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No expenses yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add your first expense to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{expense.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={expense.type === 'shared' ? 'default' : 'secondary'} className="text-xs">
                                  {expense.type === 'shared' ? 'Shared' : 'Personal'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(expense.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                            <p className="text-xs text-muted-foreground">{expense.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Your Groups */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Groups</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage shared expenses with friends and family
                    </p>
                  </div>
                  <Link href="/dashboard/groups">
                    <Button variant="outline">
                      View All
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
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
                        Create your first group to start tracking shared expenses with friends, roommates, or family.
                      </p>
                      <Link href="/dashboard/groups">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Group
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {groups.slice(0, 4).map((group) => {
                        const groupExpenses = expenses.filter(exp => exp.groupId === group.id);
                        const groupTotal = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                        const cardDesign = getCardDesign(group.cardDesign);
                        
                        return (
                          <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                            {/* Mini Bank Card */}
                            <div className={cn(
                              'relative h-32 rounded-xl p-4 shadow-lg',
                              'transition-all duration-300 hover:scale-105 hover:shadow-xl',
                              'flex flex-col justify-between cursor-pointer',
                              cardDesign.gradient,
                              cardDesign.textColor
                            )}>
                              {/* Top - Chip */}
                              <div className="flex items-start justify-between">
                                <div className={cn('h-6 w-8 rounded', cardDesign.accentColor, 'backdrop-blur-sm')}>
                                  <div className="h-full w-full grid grid-cols-3 gap-0.5 p-0.5">
                                    {[...Array(9)].map((_, i) => (
                                      <div key={i} className="bg-white/30 rounded-sm" />
                                    ))}
                                  </div>
                                </div>
                                <div className="text-[10px] font-bold opacity-60 tracking-widest">
                                  DUOFI
                                </div>
                              </div>

                              {/* Middle - Group Name */}
                              <div>
                                <h4 className="text-sm font-bold tracking-wide line-clamp-1">
                                  {group.name}
                                </h4>
                              </div>

                              {/* Bottom - Stats */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 opacity-90">
                                  <Users className="h-3 w-3" />
                                  <span>{group.members.length}</span>
                                  <span className="opacity-50">•</span>
                                  <CreditCard className="h-3 w-3" />
                                  <span>{groupExpenses.length}</span>
                                </div>
                                <div className="font-semibold">
                                  {formatCurrency(groupTotal)}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
