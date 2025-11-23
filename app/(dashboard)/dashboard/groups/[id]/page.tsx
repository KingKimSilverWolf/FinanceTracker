'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Trash2, Crown, Receipt, Plus } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { getGroup, isGroupAdmin, deleteGroup, removeGroupMember, Group } from '@/lib/firebase/groups';
import { getGroupExpenses, Expense } from '@/lib/firebase/expenses';
import { getCategory } from '@/lib/constants/expenses';
import { formatCurrency } from '@/lib/utils';
import { EditGroupDialog } from '@/components/groups/edit-group-dialog';
import { InviteMemberDialog } from '@/components/groups/invite-member-dialog';
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog';
import { GroupBalanceDashboard } from '@/components/settlements/group-balance-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const groupId = params.id as string;

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      const groupData = await getGroup(groupId);
      setGroup(groupData);
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadExpenses = useCallback(async () => {
    try {
      setLoadingExpenses(true);
      const expenseData = await getGroupExpenses(groupId);
      setExpenses(expenseData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoadingExpenses(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (user && groupId) {
      loadGroup();
      loadExpenses();
    }
  }, [user, groupId, loadGroup, loadExpenses]);

  async function handleDeleteGroup() {
    if (!group || !user) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${group.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteGroup(groupId);
      toast.success('Group deleted successfully');
      router.push('/dashboard/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete group');
      }
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!group || !user) return;

    const confirmed = confirm(
      `Are you sure you want to remove ${memberName} from this group?`
    );
    if (!confirmed) return;

    try {
      await removeGroupMember(groupId, memberId);
      toast.success(`${memberName} removed from group`);
      loadGroup(); // Reload group data
    } catch (error) {
      console.error('Error removing member:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to remove member');
      }
    }
  }

  const isAdmin = group && user ? isGroupAdmin(group, user.uid) : false;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading group...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!group) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Group not found</CardTitle>
              <CardDescription>
                The group you are looking for does not exist or you do not have access to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/groups')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/groups')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground mt-2">{group.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <EditGroupDialog group={group} onUpdate={loadGroup} />
                    <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Group
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Members Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Members</CardTitle>
                    <Badge variant="secondary">{group.members.length}</Badge>
                  </div>
                  {isAdmin && (
                    <InviteMemberDialog groupId={group.id} groupName={group.name} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.members.map((member, index) => (
                    <div key={member.userId}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.photoURL || undefined} />
                            <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.displayName}</p>
                              {member.role === 'admin' && (
                                <Crown className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        {isAdmin && member.userId !== user?.uid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId, member.displayName)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Expense Count</p>
                  <p className="text-2xl font-bold">{expenses.length}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Settlements</p>
                  <p className="text-2xl font-bold">Coming Soon</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses Section */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Track and split expenses with your group</CardDescription>
                </div>
                <AddExpenseDialog
                  defaultType="shared"
                  defaultGroupId={groupId}
                  onSuccess={() => {
                    loadExpenses();
                    loadGroup();
                  }}
                >
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </AddExpenseDialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Start adding expenses to track who paid and split the costs among members.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((expense) => {
                    const category = getCategory(expense.category);
                    const paidByMember = group.members.find(m => m.userId === expense.paidBy);
                    
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                            style={{ backgroundColor: category?.color + '20' || '#6366f120' }}
                          >
                            {category?.icon || '💸'}
                          </div>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Paid by {paidByMember?.displayName || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                          {expense.participants && (
                            <p className="text-sm text-muted-foreground">
                              Split {expense.participants.length} ways
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {expenses.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-4"
                      onClick={() => router.push(`/dashboard/expenses?group=${groupId}`)}
                    >
                      View All {expenses.length} Expenses
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balances & Settlements Section */}
          <div className="mt-6">
            <GroupBalanceDashboard groupId={groupId} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
