'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Calendar, CreditCard } from 'lucide-react';

interface AnalyticsSummaryCardsProps {
  totalSpent: number; // in cents
  averagePerDay: number; // in cents
  expenseCount: number;
  topCategory: string;
  isLoading?: boolean;
}

export function AnalyticsSummaryCards({
  totalSpent,
  averagePerDay,
  expenseCount,
  topCategory,
  isLoading = false,
}: AnalyticsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-8 bg-muted rounded w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Spent */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Per Day */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg / Day</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(averagePerDay)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Count */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold mt-1">{expenseCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Category */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Category</p>
              <p className="text-2xl font-bold mt-1 truncate">{topCategory || 'None'}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
