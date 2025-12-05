'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimplifiedTransaction } from '@/lib/firebase/settlements';
import { markSettlementAsPaid } from '@/lib/firebase/settlements';
import { formatCurrency, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface SettlementPaymentDialogProps {
  transaction: SimplifiedTransaction | null;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: '💵 Cash', icon: '💵' },
  { value: 'Bank Transfer', label: '🏦 Bank Transfer', icon: '🏦' },
  { value: 'Card', label: '💳 Card', icon: '💳' },
  { value: 'Venmo', label: '💸 Venmo', icon: '💸' },
  { value: 'PayPal', label: '💰 PayPal', icon: '💰' },
  { value: 'Zelle', label: '⚡ Zelle', icon: '⚡' },
  { value: 'Other', label: '📝 Other', icon: '📝' },
];

export function SettlementPaymentDialog({
  transaction,
  currentUserId,
  open,
  onOpenChange,
  onSuccess,
}: SettlementPaymentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  if (!transaction) return null;

  const isFromCurrentUser = transaction.fromUserId === currentUserId;

  // Only the payer (fromUser) should be able to mark as paid
  const canMarkAsPaid = isFromCurrentUser;

  async function handleMarkAsPaid() {
    if (!transaction || !transaction.settlementId) {
      toast.error('Settlement ID not found');
      return;
    }

    if (!canMarkAsPaid) {
      toast.error('Only the payer can mark this settlement as paid');
      return;
    }

    setLoading(true);

    try {
      const expenseId = await markSettlementAsPaid(
        transaction.settlementId,
        currentUserId,
        paymentMethod,
        notes || undefined
      );

      toast.success('Payment recorded successfully!', {
        description: `Settlement of ${formatCurrency(transaction.amount)} has been marked as paid.`,
      });

      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to the created expense
      router.push(`/dashboard/expenses/${expenseId}`);
    } catch (error) {
      console.error('Error marking settlement as paid:', error);
      toast.error('Failed to record payment', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setPaymentMethod('Cash');
      setNotes('');
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Mark Settlement as Paid
          </DialogTitle>
          <DialogDescription>
            {canMarkAsPaid
              ? 'Confirm that you have paid this settlement. This will create a record of the payment.'
              : 'Only the payer can mark this settlement as paid.'}
          </DialogDescription>
        </DialogHeader>

        {/* Settlement Summary */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={transaction.fromUserPhoto || undefined} />
                <AvatarFallback>{getInitials(transaction.fromUserName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{transaction.fromUserName}</p>
                <p className="text-xs text-muted-foreground">Payer</p>
              </div>
            </div>

            <div className="text-center px-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">pays</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium text-sm">{transaction.toUserName}</p>
                <p className="text-xs text-muted-foreground">Receiver</p>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={transaction.toUserPhoto || undefined} />
                <AvatarFallback>{getInitials(transaction.toUserName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Settlement Amount</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>
        </div>

        {canMarkAsPaid && (
          <div className="space-y-4">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>
          </div>
        )}

        {!canMarkAsPaid && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              You are receiving this payment. Only <strong>{transaction.fromUserName}</strong> can mark it as paid.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {canMarkAsPaid && (
            <Button
              type="button"
              onClick={handleMarkAsPaid}
              disabled={loading}
            >
              {loading ? 'Recording...' : 'Confirm Payment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
