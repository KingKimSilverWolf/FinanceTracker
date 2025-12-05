'use client';

import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/contexts/auth-context';
import { updateExpense, type Expense } from '@/lib/firebase/expenses';
import { getUserGroups, type Group } from '@/lib/firebase/groups';
import {
  getCategoriesByType,
  SPLIT_METHODS,
  PAYMENT_METHODS,
} from '@/lib/constants/expenses';
import { toast } from 'sonner';

const sharedExpenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  category: z.string(),
  groupId: z.string().min(1, 'Please select a group'),
  paidBy: z.string().min(1, 'Please select who paid'),
  splitMethod: z.string(),
  date: z.string(),
  notes: z.string().optional(),
  paymentMethod: z.string(),
});

const personalExpenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  category: z.string(),
  date: z.string(),
  notes: z.string().optional(),
  paymentMethod: z.string(),
});

type SharedFormData = z.infer<typeof sharedExpenseSchema>;
type PersonalFormData = z.infer<typeof personalExpenseSchema>;

interface EditExpenseDialogProps {
  expense: Expense;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function EditExpenseDialog({ expense, onSuccess, children }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { user } = useAuth();

  const isShared = expense.type === 'shared';

  const sharedForm = useForm<SharedFormData>({
    resolver: zodResolver(sharedExpenseSchema),
    defaultValues: {
      amount: (expense.amount / 100).toFixed(2),
      description: expense.description,
      category: expense.category,
      groupId: expense.groupId || '',
      paidBy: expense.paidBy || user?.uid || '',
      splitMethod: expense.splitMethod || 'equal',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: expense.notes || '',
      paymentMethod: expense.paymentMethod || 'credit_card',
    },
  });

  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalExpenseSchema),
    defaultValues: {
      amount: (expense.amount / 100).toFixed(2),
      description: expense.description,
      category: expense.category,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: expense.notes || '',
      paymentMethod: expense.paymentMethod || 'credit_card',
    },
  });

  // Load groups when dialog opens
  useEffect(() => {
    if (open && user && isShared) {
      getUserGroups(user.uid).then((userGroups) => {
        setGroups(userGroups);
        const group = userGroups.find((g) => g.id === expense.groupId);
        setSelectedGroup(group || null);
      });
    }
  }, [open, user, isShared, expense.groupId]);

  async function onSubmitShared(data: SharedFormData) {
    if (!user) {
      toast.error('You must be logged in to edit expenses');
      return;
    }

    if (!selectedGroup) {
      toast.error('Please select a group');
      return;
    }

    setLoading(true);

    try {
      const amountInCents = Math.round(parseFloat(data.amount) * 100);
      const memberIds = selectedGroup.members.map((m) => m.userId);
      const splitData: Record<string, number> = {};
      const splitAmount = Math.round(amountInCents / memberIds.length);
      memberIds.forEach((id) => {
        splitData[id] = splitAmount;
      });

      await updateExpense(expense.id, {
        amount: amountInCents,
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        groupId: data.groupId,
        paidBy: data.paidBy,
        splitMethod: data.splitMethod as 'equal' | 'percentage' | 'custom',
        splitData,
        participants: selectedGroup.members.map((m) => m.userId),
      });

      toast.success('Expense updated successfully!');
      setOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitPersonal(data: PersonalFormData) {
    if (!user) {
      toast.error('You must be logged in to edit expenses');
      return;
    }

    setLoading(true);

    try {
      const amountInCents = Math.round(parseFloat(data.amount) * 100);

      await updateExpense(expense.id, {
        amount: amountInCents,
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        paymentMethod: data.paymentMethod,
      });

      toast.success('Expense updated successfully!');
      setOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const sharedCategories = getCategoriesByType('shared');
  const personalCategories = getCategoriesByType('personal');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the details of this {isShared ? 'shared' : 'personal'} expense.
          </DialogDescription>
        </DialogHeader>

        {isShared ? (
          <Form {...sharedForm}>
            <form onSubmit={sharedForm.handleSubmit(onSubmitShared)} className="space-y-4">
              <FormField
                control={sharedForm.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const group = groups.find((g) => g.id === value);
                        setSelectedGroup(group || null);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={sharedForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sharedForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={sharedForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rent for November" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={sharedForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sharedCategories.map(([key, cat]) => (
                            <SelectItem key={key} value={key}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sharedForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                            <SelectItem key={key} value={method.value}>
                              {method.icon} {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedGroup && (
                <>
                  <FormField
                    control={sharedForm.control}
                    name="paidBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paid By</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Who paid?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedGroup.members.map((member) => (
                              <SelectItem key={member.userId} value={member.userId}>
                                {member.displayName}
                                {member.userId === user?.uid && ' (You)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sharedForm.control}
                    name="splitMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Split Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="How to split?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SPLIT_METHODS).map(([key, method]) => (
                              <SelectItem key={key} value={method.value}>
                                {method.icon} {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={sharedForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Expense'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...personalForm}>
            <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={personalForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={personalForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Groceries at Whole Foods" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={personalForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {personalCategories.map(([key, cat]) => (
                            <SelectItem key={key} value={key}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                            <SelectItem key={key} value={method.value}>
                              {method.icon} {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={personalForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Expense'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
