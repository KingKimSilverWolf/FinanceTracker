'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateGroupBalances,
  getSimplifiedTransactions,
  getSettlementHistory,
  type Balance,
  type SimplifiedTransaction,
  type Settlement,
} from '@/lib/firebase/settlements';
import { getUserGroups } from '@/lib/firebase/groups';
import type { Group } from '@/lib/firebase/groups';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowRight, History, RefreshCcw, Loader2, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function SettlementsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<SimplifiedTransaction[]>([]);
  const [history, setHistory] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load user's groups
  useEffect(() => {
    if (!user) return;

    const loadGroups = async () => {
      try {
        setIsLoading(true);
        const userGroups = await getUserGroups(user.uid);
        setGroups(userGroups);
        if (userGroups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(userGroups[0].id);
        } else if (userGroups.length === 0) {
          // No groups, stop loading
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
        toast.error('Failed to load groups');
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [user, selectedGroupId]);

  // Load settlement data when group changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadSettlementData = async () => {
      try {
        setIsLoading(true);
        
        const [groupBalances, simplifiedTxns, settlementHistory] = await Promise.all([
          calculateGroupBalances(selectedGroupId),
          getSimplifiedTransactions(selectedGroupId),
          getSettlementHistory(selectedGroupId),
        ]);

        setBalances(groupBalances);
        setTransactions(simplifiedTxns);
        setHistory(settlementHistory);
      } catch (error) {
        console.error('Error loading settlement data:', error);
        toast.error('Failed to load settlement data');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettlementData();
  }, [selectedGroupId]);

  const handleRefresh = async () => {
    if (!selectedGroupId) return;
    
    setIsRefreshing(true);
    try {
      const [groupBalances, simplifiedTxns, settlementHistory] = await Promise.all([
        calculateGroupBalances(selectedGroupId),
        getSimplifiedTransactions(selectedGroupId),
        getSettlementHistory(selectedGroupId),
      ]);

      setBalances(groupBalances);
      setTransactions(simplifiedTxns);
      setHistory(settlementHistory);
      toast.success('Settlement data refreshed');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Settlements</h1>
              <p className="text-muted-foreground">Track who owes whom and settlement history</p>
            </div>
            {groups.length > 0 && (
              <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
                <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {/* Group Selector - Only show if user has groups */}
          {groups.length > 0 && (
            <div className="flex items-center gap-4">
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a group" />
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
          )}
        </div>

        {/* No Groups Empty State */}
        {groups.length === 0 && !isLoading ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create or join a group to start tracking settlements and see who owes whom.
              </p>
              <Button onClick={() => router.push('/dashboard/groups')}>
                <Users className="h-4 w-4 mr-2" />
                Go to Groups
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="current" className="space-y-6">
            <TabsList>
              <TabsTrigger value="current">Current Balances</TabsTrigger>
              <TabsTrigger value="history">Settlement History</TabsTrigger>
            </TabsList>

            {/* Current Balances Tab */}
            <TabsContent value="current" className="space-y-6">
              {/* Who Owes Whom Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Who Owes Whom
                  </CardTitle>
                  <CardDescription>
                    Simplified settlements to minimize transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg font-medium">All settled up! 🎉</p>
                      <p className="text-sm mt-2">No outstanding balances in this group</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary">
                                {txn.fromUserName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{txn.fromUserName}</p>
                              <p className="text-sm text-muted-foreground">pays</p>
                            </div>
                          </div>

                          <ArrowRight className="h-5 w-5 text-muted-foreground" />

                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-right">{txn.toUserName}</p>
                              <p className="text-sm text-muted-foreground text-right">receives</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              <span className="font-semibold text-green-600">
                                {txn.toUserName.charAt(0)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-xl font-bold text-primary">
                              {formatCurrency(txn.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Individual Balances */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Individual Balances
                  </CardTitle>
                  <CardDescription>
                    Detailed balance breakdown for each member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {balances.map((balance) => (
                      <div key={balance.userId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-lg text-primary">
                                {balance.userName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{balance.userName}</p>
                              <p className="text-sm text-muted-foreground">
                                Net Balance: {' '}
                                <span
                                  className={
                                    balance.netBalance > 0
                                      ? 'text-green-600 font-medium'
                                      : balance.netBalance < 0
                                      ? 'text-red-600 font-medium'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {formatCurrency(Math.abs(balance.netBalance))}
                                  {balance.netBalance > 0 && ' owed to them'}
                                  {balance.netBalance < 0 && ' they owe'}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {balance.netBalance > 0 ? (
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            ) : balance.netBalance < 0 ? (
                              <TrendingDown className="h-6 w-6 text-red-600" />
                            ) : null}
                          </div>
                        </div>

                        {(balance.owedTo.length > 0 || balance.owes.length > 0) && (
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Owed to them:</p>
                              {balance.owedTo.length === 0 ? (
                                <p className="text-sm text-muted-foreground">None</p>
                              ) : (
                                <ul className="space-y-1">
                                  {balance.owedTo.map((detail) => (
                                    <li key={detail.userId} className="text-sm">
                                      {detail.userName}: {formatCurrency(detail.amount)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">They owe:</p>
                              {balance.owes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">None</p>
                              ) : (
                                <ul className="space-y-1">
                                  {balance.owes.map((detail) => (
                                    <li key={detail.userId} className="text-sm">
                                      {detail.userName}: {formatCurrency(detail.amount)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settlement History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Settlement History
                  </CardTitle>
                  <CardDescription>
                    Past settlements and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No settlement history yet</p>
                      <p className="text-sm mt-2">Settlements will appear here once completed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((settlement) => {
                        // Get user names from balances
                        const fromUser = balances.find(b => b.userId === settlement.fromUserId);
                        const toUser = balances.find(b => b.userId === settlement.toUserId);
                        
                        return (
                          <div key={settlement.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold">
                                  Settlement #{settlement.id.slice(0, 8)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(settlement.createdAt, 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  {formatCurrency(settlement.amount)}
                                </p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {settlement.status}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{fromUser?.userName || 'Unknown'}</span>
                              <ArrowRight className="h-4 w-4" />
                              <span className="font-medium">{toUser?.userName || 'Unknown'}</span>
                            </div>
                            {settlement.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Note: {settlement.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
