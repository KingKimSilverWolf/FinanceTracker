'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimplifiedTransaction } from '@/lib/firebase/settlements';
import { formatCurrency, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

const settlementSchema = z.object({
  notes: z.string().optional(),
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm the payment was made',
  }),
});

type SettlementFormData = z.infer<typeof settlementSchema>;

interface SettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: SimplifiedTransaction | null;
  currentUserId: string;
  onConfirm: (transaction: SimplifiedTransaction, notes?: string) => Promise<void>;
}

export function SettlementDialog({
  open,
  onOpenChange,
  transaction,
  currentUserId,
  onConfirm,
}: SettlementDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      notes: '',
      confirmed: false,
    },
  });

  async function onSubmit(data: SettlementFormData) {
    if (!transaction) return;

    setLoading(true);

    try {
      await onConfirm(transaction, data.notes);
      toast.success('Settlement marked as complete!');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error marking settlement:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to mark settlement. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!transaction) return null;

  const isFromCurrentUser = transaction.fromUserId === currentUserId;
  const otherUserName = isFromCurrentUser ? transaction.toUserName : transaction.fromUserName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark Settlement as Complete</DialogTitle>
          <DialogDescription>
            Confirm that this payment has been made. This action will be recorded permanently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold">
                {formatCurrency(transaction.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">From</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={transaction.fromUserPhoto || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(transaction.fromUserName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{transaction.fromUserName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">To</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={transaction.toUserPhoto || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(transaction.toUserName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{transaction.toUserName}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Important</p>
              <p>
                Only mark this as settled if the payment has actually been made. This creates a
                permanent record in the settlement history.
              </p>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details about this payment..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      e.g., &quot;Paid via Venmo&quot;, &quot;Cash payment on 12/15&quot;
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmation Checkbox */}
              <FormField
                control={form.control}
                name="confirmed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I confirm that{' '}
                        {isFromCurrentUser ? 'I have paid' : `${otherUserName} has paid`}{' '}
                        {formatCurrency(transaction.amount)}
                      </FormLabel>
                      <FormDescription>
                        This action will be recorded in the settlement history and cannot be undone.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm Settlement
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
