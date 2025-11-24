'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createRecurringExpense } from '@/lib/firebase/recurring';
import { getUserGroups } from '@/lib/firebase/groups';
import type { RecurringExpenseFormData, RecurringFrequency } from '@/lib/recurring/types';
import type { Group } from '@/lib/firebase/groups';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const categories = [
  'Rent',
  'Utilities',
  'Groceries',
  'Transportation',
  'Subscriptions',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Other',
];

const frequencies: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (every 3 months)' },
  { value: 'yearly', label: 'Yearly' },
];

export default function NewRecurringExpensePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [formData, setFormData] = useState<Partial<RecurringExpenseFormData>>({
    description: '',
    amount: 0,
    category: 'Rent',
    frequency: 'monthly',
    startDate: new Date(),
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    const userGroups = await getUserGroups(user.uid);
    setGroups(userGroups);
    if (userGroups.length > 0) {
      setSelectedGroup(userGroups[0]);
      setFormData((prev) => ({
        ...prev,
        groupId: userGroups[0].id,
        paidBy: user.uid,
        splitBetween: userGroups[0].members.map(m => m.userId),
      }));
    }
  };

  const handleGroupChange = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group && user) {
      setSelectedGroup(group);
      setFormData((prev) => ({
        ...prev,
        groupId: group.id,
        paidBy: user.uid,
        splitBetween: group.members.map(m => m.userId),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.groupId) return;

    try {
      setLoading(true);

      // Validate required fields
      if (!formData.description || !formData.amount || formData.amount <= 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Convert dollar amount to cents
      const amountInCents = Math.round(formData.amount * 100);

      const recurringData: RecurringExpenseFormData = {
        description: formData.description,
        amount: amountInCents,
        category: formData.category || 'Other',
        groupId: formData.groupId,
        paidBy: formData.paidBy || user.uid,
        splitBetween: formData.splitBetween || [],
        frequency: formData.frequency || 'monthly',
        startDate: formData.startDate || new Date(),
        endDate: formData.endDate,
        notes: formData.notes,
      };

      await createRecurringExpense(recurringData, user.uid);
      toast.success('Recurring expense created successfully');
      router.push('/dashboard/recurring');
    } catch (error) {
      console.error('Error creating recurring expense:', error);
      toast.error('Failed to create recurring expense');
    } finally {
      setLoading(false);
    }
  };

  if (groups.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto p-6">
            <Card className="p-12 text-center">
              <h2 className="text-2xl font-semibold mb-2">No Groups Available</h2>
              <p className="text-muted-foreground mb-6">
                You need to create or join a group before setting up recurring expenses.
              </p>
              <Button asChild>
                <Link href="/dashboard/groups">Go to Groups</Link>
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
        <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/recurring">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Recurring Expense</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              placeholder="e.g., Monthly Rent"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">
              Amount ($) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group */}
          <div>
            <Label htmlFor="group">
              Group <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.groupId}
              onValueChange={handleGroupChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div>
            <Label htmlFor="frequency">
              Frequency <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) =>
                setFormData({ ...formData, frequency: value as RecurringFrequency })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="startDate">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate?.toISOString().split('T')[0]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startDate: new Date(e.target.value),
                })
              }
              required
            />
          </div>

          {/* End Date (Optional) */}
          <div>
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endDate: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty if this expense has no end date
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Paid By Info */}
          {selectedGroup && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Expenses will be automatically created for{' '}
                <span className="font-medium text-foreground">
                  {selectedGroup.name}
                </span>
                , paid by you, and split equally among all members.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Recurring Expense'}
            </Button>
          </div>
        </form>
      </Card>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
