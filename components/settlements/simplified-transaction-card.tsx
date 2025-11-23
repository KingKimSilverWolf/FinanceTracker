'use client';

import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimplifiedTransaction } from '@/lib/firebase/settlements';
import { formatCurrency, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SimplifiedTransactionCardProps {
  transaction: SimplifiedTransaction;
  currentUserId: string;
  onMarkAsSettled?: (transaction: SimplifiedTransaction) => void;
  onViewSettlement?: (settlementId: string) => void;
}

export function SimplifiedTransactionCard({
  transaction,
  currentUserId,
  onMarkAsSettled,
  onViewSettlement,
}: SimplifiedTransactionCardProps) {
  const isFromCurrentUser = transaction.fromUserId === currentUserId;
  const isToCurrentUser = transaction.toUserId === currentUserId;
  const isInvolved = isFromCurrentUser || isToCurrentUser;

  // Determine the "other" person in the transaction
  const otherUserName = isFromCurrentUser ? transaction.toUserName : transaction.fromUserName;
  const otherUserPhoto = isFromCurrentUser ? transaction.toUserPhoto : transaction.fromUserPhoto;

  // Color coding: red if you owe, green if you're owed
  const amountColor = isFromCurrentUser
    ? 'text-red-600 dark:text-red-400'
    : 'text-green-600 dark:text-green-400';

  const directionText = isFromCurrentUser
    ? `You pay ${transaction.toUserName}`
    : `${transaction.fromUserName} pays you`;

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      transaction.status === 'completed' && 'opacity-75'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Avatar and direction */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={otherUserPhoto || undefined} />
              <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {directionText}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {transaction.status === 'pending' ? (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Settled
                    </Badge>
                  )}
                </div>
              </div>

              {!isFromCurrentUser && !isToCurrentUser && (
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </div>

          {/* Right: Amount and action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className={cn('text-lg font-bold', amountColor)}>
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            {transaction.status === 'pending' && isInvolved && onMarkAsSettled && (
              <Button
                size="sm"
                onClick={() => onMarkAsSettled(transaction)}
                className="shrink-0"
              >
                Mark Settled
              </Button>
            )}

            {transaction.status === 'completed' && transaction.settlementId && onViewSettlement && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewSettlement(transaction.settlementId!)}
                className="shrink-0"
              >
                View
              </Button>
            )}
          </div>
        </div>

        {/* Show full transaction details if not involved (for group admins viewing all) */}
        {!isInvolved && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={transaction.fromUserPhoto || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(transaction.fromUserName)}
              </AvatarFallback>
            </Avatar>
            <ArrowRight className="w-3 h-3" />
            <Avatar className="h-6 w-6">
              <AvatarImage src={transaction.toUserPhoto || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(transaction.toUserName)}
              </AvatarFallback>
            </Avatar>
            <span>
              {transaction.fromUserName} → {transaction.toUserName}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
