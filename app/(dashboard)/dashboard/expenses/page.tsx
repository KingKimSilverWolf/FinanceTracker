'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, Search, TrendingUp, Calendar } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/lib/contexts/auth-context';
import { subscribeToUserExpenses, Expense } from '@/lib/firebase/expenses';
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCategory } from '@/lib/constants/expenses';
import { formatCurrency, formatDate } from '@/lib/utils/index';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'shared' | 'personal'>('all');

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserExpenses(user.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || expense.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group expenses by date
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const date = formatDate(expense.date, 'medium');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  // Calculate totals
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const sharedTotal = filteredExpenses
    .filter((exp) => exp.type === 'shared')
    .reduce((sum, exp) => sum + exp.amount, 0);
  const personalTotal = filteredExpenses
    .filter((exp) => exp.type === 'personal')
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
              <p className="text-muted-foreground">Track all your shared and personal expenses</p>
            </div>
            <AddExpenseDialog />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Spent</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalSpent)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>All expenses</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>👥 Shared</CardDescription>
                <CardTitle className="text-2xl text-primary">{formatCurrency(sharedTotal)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {filteredExpenses.filter((e) => e.type === 'shared').length} expenses
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>💰 Personal</CardDescription>
                <CardTitle className="text-2xl" style={{ color: '#8B5CF6' }}>
                  {formatCurrency(personalTotal)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {filteredExpenses.filter((e) => e.type === 'personal').length} expenses
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'shared' | 'personal')} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="shared">👥 Shared</TabsTrigger>
                <TabsTrigger value="personal">💰 Personal</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Expenses List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading expenses...</p>
              </div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No expenses found' : 'No expenses yet'}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  {searchQuery
                    ? 'Try adjusting your search query or filters'
                    : 'Start tracking your expenses by adding your first expense.'}
                </p>
                {!searchQuery && <AddExpenseDialog />}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      {date}
                    </h3>
                    <div className="flex-1 border-t"></div>
                  </div>

                  <div className="space-y-2">
                    {dateExpenses.map((expense) => {
                      const category = getCategory(expense.category);
                      return (
                        <Link key={expense.id} href={`/dashboard/expenses/${expense.id}`}>
                          <Card className="hover:bg-accent transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className="h-10 w-10 rounded-full flex items-center justify-center text-xl"
                                    style={{ backgroundColor: `${category.color}20` }}
                                  >
                                    {category.icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{expense.description}</p>
                                      <Badge
                                        variant={expense.type === 'shared' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {expense.type === 'shared' ? '👥' : '💰'}{' '}
                                        {expense.type === 'shared' ? 'Shared' : 'Personal'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{category.label}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-lg">
                                    {formatCurrency(expense.amount)}
                                  </p>
                                  {expense.type === 'shared' && expense.splitData && (
                                    <p className="text-xs text-muted-foreground">
                                      {Object.keys(expense.splitData).length} people
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
