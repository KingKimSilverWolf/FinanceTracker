'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calculator } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/contexts/auth-context';
import { createExpense, calculateEqualSplit } from '@/lib/firebase/expenses';
import { getUserGroups, Group } from '@/lib/firebase/groups';
import {
  getCategoriesByType,
  SPLIT_METHODS,
  PAYMENT_METHODS,
} from '@/lib/constants/expenses';
import { toast } from 'sonner';

const sharedExpenseSchema = z.object({
  type: z.literal('shared'),
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
  type: z.literal('personal'),
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  category: z.string(),
  date: z.string(),
  notes: z.string().optional(),
  paymentMethod: z.string(),
});

type SharedFormData = z.infer<typeof sharedExpenseSchema>;
type PersonalFormData = z.infer<typeof personalExpenseSchema>;

interface AddExpenseDialogProps {
  defaultType?: 'shared' | 'personal';
  defaultGroupId?: string;
  onSuccess?: () => void;
}

export function AddExpenseDialog({ defaultType = 'personal', defaultGroupId, onSuccess }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenseType, setExpenseType] = useState<'shared' | 'personal'>(defaultType);
  const [groups, setGroups] = useState<Group[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  const sharedForm = useForm<SharedFormData>({
    resolver: zodResolver(sharedExpenseSchema),
    defaultValues: {
      type: 'shared',
      amount: '',
      description: '',
      category: 'OTHER',
      groupId: defaultGroupId || '',
      paidBy: user?.uid || '',
      splitMethod: 'equal',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      paymentMethod: 'credit_card',
    },
  });

  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalExpenseSchema),
    defaultValues: {
      type: 'personal',
      amount: '',
      description: '',
      category: 'OTHER',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      paymentMethod: 'credit_card',
    },
  });

  // Load user groups when dialog opens
  async function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && user && groups.length === 0) {
      try {
        const userGroups = await getUserGroups(user.uid);
        setGroups(userGroups);
        if (userGroups.length > 0 && !defaultGroupId) {
          sharedForm.setValue('groupId', userGroups[0].id);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    }
  }

  async function onSubmitShared(data: SharedFormData) {
    if (!user) {
      toast.error('You must be logged in to add expenses');
      return;
    }

    setLoading(true);

    try {
      // Convert amount from dollars to cents
      const amountInCents = Math.round(parseFloat(data.amount) * 100);

      // Find selected group to get members
      const selectedGroup = groups.find((g) => g.id === data.groupId);
      if (!selectedGroup) {
        toast.error('Selected group not found');
        return;
      }

      // Calculate split data
      const participants = selectedGroup.members.map((m) => m.userId);
      const splitData: { [userId: string]: number } = {};

      if (data.splitMethod === 'equal') {
        const sharePerPerson = calculateEqualSplit(amountInCents, participants.length);
        participants.forEach((userId) => {
          splitData[userId] = sharePerPerson;
        });
      }

      const expenseId = await createExpense({
        type: 'shared',
        userId: user.uid,
        amount: amountInCents,
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        groupId: data.groupId,
        paidBy: data.paidBy,
        splitMethod: data.splitMethod as 'equal' | 'percentage' | 'amount' | 'custom',
        splitData,
        participants,
      });

      toast.success('Expense added successfully!');
      setOpen(false);
      sharedForm.reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/expenses/${expenseId}`);
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add expense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitPersonal(data: PersonalFormData) {
    if (!user) {
      toast.error('You must be logged in to add expenses');
      return;
    }

    setLoading(true);

    try {
      // Convert amount from dollars to cents
      const amountInCents = Math.round(parseFloat(data.amount) * 100);

      const expenseId = await createExpense({
        type: 'personal',
        userId: user.uid,
        amount: amountInCents,
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        paymentMethod: data.paymentMethod,
      });

      toast.success('Expense added successfully!');
      setOpen(false);
      personalForm.reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/expenses/${expenseId}`);
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add expense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const sharedCategories = getCategoriesByType('shared');
  const personalCategories = getCategoriesByType('personal');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Track shared expenses with your group or personal expenses just for you.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={expenseType} onValueChange={(v) => setExpenseType(v as 'shared' | 'personal')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shared">👥 Shared</TabsTrigger>
            <TabsTrigger value="personal">💰 Personal</TabsTrigger>
          </TabsList>

          {/* Shared Expense Form */}
          <TabsContent value="shared">
            <Form {...sharedForm}>
              <form onSubmit={sharedForm.handleSubmit(onSubmitShared)} className="space-y-4">
                <FormField
                  control={sharedForm.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                            {groups
                              .find((g) => g.id === sharedForm.watch('groupId'))
                              ?.members.map((member) => (
                                <SelectItem key={member.userId} value={member.userId}>
                                  {member.displayName}
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
                  control={sharedForm.control}
                  name="splitMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Calculator className="inline h-4 w-4 mr-1" />
                        Split Method
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How to split?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(SPLIT_METHODS).map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.icon} {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {SPLIT_METHODS[sharedForm.watch('splitMethod').toUpperCase() as keyof typeof SPLIT_METHODS]?.description}
                      </FormDescription>
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
                            <SelectValue placeholder="How was it paid?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.icon} {method.label}
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Add any additional details..." {...field} />
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
                    {loading ? 'Adding...' : 'Add Expense'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Personal Expense Form */}
          <TabsContent value="personal">
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
                        <Input placeholder="e.g., Starbucks coffee" {...field} />
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
                              <SelectValue placeholder="How was it paid?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_METHODS.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
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
                        <Input placeholder="Add any additional details..." {...field} />
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
                    {loading ? 'Adding...' : 'Add Expense'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
