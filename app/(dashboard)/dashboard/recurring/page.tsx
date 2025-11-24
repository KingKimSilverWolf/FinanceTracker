'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getUserRecurringExpenses,
  getRecurringExpenseStats,
  toggleRecurringExpenseStatus,
  deleteRecurringExpense,
  processRecurringExpenses,
} from '@/lib/firebase/recurring';
import type { RecurringExpense, RecurringExpenseStats } from '@/lib/recurring/types';
import {
  Calendar,
  DollarSign,
  Pause,
  Play,
  Trash2,
  Plus,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export default function RecurringExpensesPage() {
  const { user } = useAuth();
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [stats, setStats] = useState<RecurringExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  useEffect(() => {
    if (!user) return;
    loadData();
    // Process due recurring expenses on page load
    processRecurringExpenses(user.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [recurringData, statsData] = await Promise.all([
        getUserRecurringExpenses(user.uid),
        getRecurringExpenseStats(user.uid),
      ]);
      setRecurring(recurringData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await toggleRecurringExpenseStatus(id, newStatus);
      await loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring expense?')) return;
    
    try {
      await deleteRecurringExpense(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
    }
  };

  const filteredRecurring = recurring.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading recurring expenses...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (recurring.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Recurring Expenses</h1>
            </div>
            
            <Card className="p-12 text-center">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Recurring Expenses</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Set up recurring expenses to automatically track regular payments like rent,
                subscriptions, or utilities.
              </p>
              <Button asChild>
                <Link href="/dashboard/recurring/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Recurring Expense
                </Link>
              </Button>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recurring Expenses</h1>
        <Button asChild>
          <Link href="/dashboard/recurring/new">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.totalActive}</p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold">{stats.totalPaused}</p>
              </div>
              <Pause className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due This Week</p>
                <p className="text-2xl font-bold">{stats.upcomingThisWeek}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Monthly</p>
                <p className="text-2xl font-bold">
                  ${(stats.totalAmountPerMonth / 100).toFixed(0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({recurring.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Active ({recurring.filter(r => r.status === 'active').length})
        </Button>
        <Button
          variant={filter === 'paused' ? 'default' : 'outline'}
          onClick={() => setFilter('paused')}
        >
          Paused ({recurring.filter(r => r.status === 'paused').length})
        </Button>
      </div>

      {/* Recurring Expenses List */}
      <div className="space-y-4">
        {filteredRecurring.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{item.description}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      ${(item.amount / 100).toFixed(2)}
                    </span>
                    <span className="text-xs">
                      {frequencyLabels[item.frequency]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Next: {formatDistanceToNow(item.nextRunDate, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Created {item.totalCreated} expenses</span>
                  </div>
                </div>
                
                {item.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>
                )}
                
                {item.groupName && (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Group:</span>{' '}
                    <span className="font-medium">{item.groupName}</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(item.id, item.status)}
                >
                  {item.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
