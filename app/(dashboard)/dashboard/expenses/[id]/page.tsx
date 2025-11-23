'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Edit, Calendar, DollarSign, Users, User } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { getExpense, deleteExpense, Expense } from '@/lib/firebase/expenses';
import { getGroup, Group } from '@/lib/firebase/groups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCategory } from '@/lib/constants/expenses';
import { formatCurrency, formatDate } from '@/lib/utils/index';
import { toast } from 'sonner';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const expenseId = params.id as string;

  const loadExpense = useCallback(async () => {
    try {
      setLoading(true);
      const expenseData = await getExpense(expenseId);
      setExpense(expenseData);

      // Load group if it's a shared expense
      if (expenseData?.groupId) {
        const groupData = await getGroup(expenseData.groupId);
        setGroup(groupData);
      }
    } catch (error) {
      console.error('Error loading expense:', error);
      toast.error('Failed to load expense');
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    if (user && expenseId) {
      loadExpense();
    }
  }, [user, expenseId, loadExpense]);

  async function handleDelete() {
    if (!expense || !user) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${expense.description}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteExpense(expenseId);
      toast.success('Expense deleted successfully');
      router.push('/dashboard/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete expense');
      }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading expense...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!expense) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Expense not found</CardTitle>
              <CardDescription>
                The expense you are looking for does not exist or you do not have access to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/expenses')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Expenses
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const category = getCategory(expense.category);
  const isOwner = expense.userId === user?.uid;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/expenses')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Button>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{expense.description}</h1>
                    <p className="text-muted-foreground">{category.label}</p>
                  </div>
                </div>
                <Badge variant={expense.type === 'shared' ? 'default' : 'secondary'} className="mt-2">
                  {expense.type === 'shared' ? '👥 Shared' : '💰 Personal'}
                </Badge>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <Button variant="outline" size="sm" disabled>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Details */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Amount</span>
                  </div>
                  <span className="text-2xl font-bold">{formatCurrency(expense.amount)}</span>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Date</span>
                  </div>
                  <span className="text-muted-foreground">{formatDate(expense.date, 'long')}</span>
                </div>

                <Separator />

                {/* Group Info (for shared expenses) */}
                {expense.type === 'shared' && group && (
                  <>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Group</span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/groups/${group.id}`)}
                        className="w-full justify-start"
                      >
                        {group.name}
                      </Button>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Payment Method */}
                {expense.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Payment Method</span>
                    <Badge variant="outline" className="capitalize">
                      {expense.paymentMethod.replace('_', ' ')}
                    </Badge>
                  </div>
                )}

                {/* Notes */}
                {expense.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">Notes</p>
                      <p className="text-muted-foreground">{expense.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Split Details (for shared expenses) */}
            {expense.type === 'shared' && expense.splitData && group && (
              <Card>
                <CardHeader>
                  <CardTitle>Split Details</CardTitle>
                  <CardDescription>How the expense is divided</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Split Method</p>
                    <p className="font-medium capitalize">
                      {expense.splitMethod?.replace('_', ' ') || 'Equal'}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-3">Breakdown</p>
                    <div className="space-y-3">
                      {Object.entries(expense.splitData).map(([userId, amount]) => {
                        const member = group.members.find((m) => m.userId === userId);
                        const isPayer = userId === expense.paidBy;
                        
                        return (
                          <div key={userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {member?.displayName || 'Unknown'}
                                {isPayer && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Paid
                                  </Badge>
                                )}
                              </span>
                            </div>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Expense Info */}
            {expense.type === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Expense</CardTitle>
                  <CardDescription>This expense is just for you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This expense is tracked separately from your group expenses.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Metadata */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
                <span>Created {formatDate(expense.createdAt, 'long')}</span>
                {expense.updatedAt.getTime() !== expense.createdAt.getTime() && (
                  <span>Updated {formatDate(expense.updatedAt, 'long')}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
