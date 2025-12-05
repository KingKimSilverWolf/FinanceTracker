'use client';

import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, History, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  getSimplifiedTransactions,
  createSettlement,
  completeSettlement,
  SimplifiedTransaction,
} from '@/lib/firebase/settlements';
import { SimplifiedTransactionCard } from './simplified-transaction-card';
import { SettlementDialog } from './settlement-dialog';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface GroupBalanceDashboardProps {
  groupId: string;
  onViewHistory?: () => void;
}

export function GroupBalanceDashboard({ groupId, onViewHistory }: GroupBalanceDashboardProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<SimplifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<SimplifiedTransaction | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getSimplifiedTransactions(groupId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleMarkAsSettled(transaction: SimplifiedTransaction) {
    if (!user) return;

    setSelectedTransaction(transaction);
    setDialogOpen(true);
  }

  async function handleConfirmSettlement(transaction: SimplifiedTransaction, notes?: string) {
    if (!user) return;

    try {
      // Create settlement if it doesn't exist
      if (transaction.status === 'pending') {
        const settlementId = await createSettlement(
          groupId,
          transaction.fromUserId,
          transaction.toUserId,
          transaction.amount,
          notes
        );

        // Immediately mark as completed
        await completeSettlement(settlementId, user.uid);
      }

      // Reload transactions
      await loadTransactions();
      
      toast.success('Settlement marked as complete!');
    } catch (error) {
      console.error('Error completing settlement:', error);
      throw error; // Re-throw to be handled by dialog
    }
  }

  // Calculate user's net balance
  const userTransactions = transactions.filter(
    (t) => t.fromUserId === user?.uid || t.toUserId === user?.uid
  );

  const totalOwed = transactions
    .filter((t) => t.toUserId === user?.uid && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOwing = transactions
    .filter((t) => t.fromUserId === user?.uid && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalOwed - totalOwing;

  const pendingTransactions = userTransactions.filter((t) => t.status === 'pending');
  const completedTransactions = userTransactions.filter((t) => t.status === 'completed');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
          <CardDescription>Loading balances...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Balances & Settlements</CardTitle>
              <CardDescription>Who owes what in this group</CardDescription>
            </div>
            {onViewHistory && completedTransactions.length > 0 && (
              <Button variant="outline" size="sm" onClick={onViewHistory}>
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Net Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Net Balance */}
            <Card className={netBalance > 0 ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : netBalance < 0 ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'border-muted'}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Your Net Balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {netBalance > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : netBalance < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={`text-2xl font-bold ${netBalance > 0 ? 'text-green-600 dark:text-green-400' : netBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    {formatCurrency(Math.abs(netBalance))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {netBalance > 0
                    ? 'You are owed'
                    : netBalance < 0
                    ? 'You owe'
                    : 'All settled up!'}
                </p>
              </CardContent>
            </Card>

            {/* Owed to You */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Owed to You</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalOwed)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter((t) => t.toUserId === user?.uid && t.status === 'pending')
                    .length}{' '}
                  pending
                </p>
              </CardContent>
            </Card>

            {/* You Owe */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">You Owe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalOwing)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter((t) => t.fromUserId === user?.uid && t.status === 'pending')
                    .length}{' '}
                  pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Transactions */}
          {pendingTransactions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Pending Settlements</h3>
                <div className="space-y-2">
                  {pendingTransactions.map((transaction) => (
                    <SimplifiedTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      currentUserId={user?.uid || ''}
                      onMarkAsSettled={handleMarkAsSettled}
                      onPaymentRecorded={loadTransactions}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* All Balanced Message */}
          {pendingTransactions.length === 0 && transactions.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-1">All Settled Up!</h3>
                <p className="text-sm text-muted-foreground">
                  Everyone in this group is even. Great job keeping track of expenses!
                </p>
              </div>
            </>
          )}

          {/* No Transactions Yet */}
          {transactions.length === 0 && (
            <>
              <Separator />
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No Expenses Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Once expenses are added to this group, balances and settlements will appear here.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Settlement Dialog */}
      <SettlementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
        currentUserId={user?.uid || ''}
        onConfirm={handleConfirmSettlement}
      />
    </>
  );
}
