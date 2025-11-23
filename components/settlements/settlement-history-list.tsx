'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, CheckCircle2, XCircle, StickyNote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getGroupSettlements, Settlement } from '@/lib/firebase/settlements';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface SettlementHistoryListProps {
  groupId: string;
}

export function SettlementHistoryList({ groupId }: SettlementHistoryListProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettlements = useCallback(async () => {
    try {
      setLoading(true);
      // Get all settlements (pending, completed, cancelled)
      const data = await getGroupSettlements(groupId);
      setSettlements(data);
    } catch (error) {
      console.error('Error loading settlement history:', error);
      toast.error('Failed to load settlement history');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  // Group settlements by date
  const groupedSettlements = settlements.reduce((groups, settlement) => {
    const date = new Date(settlement.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(settlement);
    return groups;
  }, {} as Record<string, Settlement[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="font-semibold mb-1">No Settlement History</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Completed and cancelled settlements will appear here for record keeping.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedSettlements).map(([date, dateSettlements]) => (
        <div key={date}>
          {/* Date Header */}
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{date}</h3>
          </div>

          {/* Settlements for this date */}
          <div className="space-y-2">
            {dateSettlements.map((settlement) => (
              <Card key={settlement.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: From → To */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* From User */}
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={settlement.fromUserId} />
                        <AvatarFallback>
                          {settlement.fromUserId.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            From User → To User
                          </span>
                          {settlement.status === 'completed' && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {settlement.status === 'cancelled' && (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelled
                            </Badge>
                          )}
                          {settlement.status === 'pending' && (
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground mt-1">
                          {settlement.status === 'completed' && settlement.completedAt
                            ? `Completed ${new Date(settlement.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                            : settlement.status === 'cancelled' && settlement.cancelledAt
                            ? `Cancelled ${new Date(settlement.cancelledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                            : `Created ${new Date(settlement.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                        </p>

                        {/* Notes */}
                        {settlement.notes && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{settlement.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">
                        {formatCurrency(settlement.amount)}
                      </p>
                      {settlement.status === 'completed' && settlement.completedBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Confirmed by{' '}
                          {settlement.completedBy === settlement.fromUserId ? 'payer' : 'recipient'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
