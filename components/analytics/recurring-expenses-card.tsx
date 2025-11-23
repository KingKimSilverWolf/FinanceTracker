'use client';

import { RecurringExpense } from '@/lib/firebase/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RepeatIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

interface RecurringExpensesCardProps {
  expenses: RecurringExpense[];
  isLoading?: boolean;
}

export function RecurringExpensesCard({ expenses, isLoading }: RecurringExpensesCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
          <CardDescription>Detecting patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
          <CardDescription>Automatically detected subscription patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <RepeatIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recurring expenses detected yet.</p>
            <p className="text-sm mt-2">Add more expenses to identify patterns.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFrequencyColor = (frequency: RecurringExpense['frequency']) => {
    switch (frequency) {
      case 'weekly':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'monthly':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'quarterly':
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const getDaysUntilNext = (nextDate: Date) => {
    const days = differenceInDays(nextDate, new Date());
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `in ${days} days`;
  };

  const totalMonthly = expenses.reduce((sum, expense) => {
    const multiplier = expense.frequency === 'weekly' ? 4.33 : expense.frequency === 'monthly' ? 1 : 0.33;
    return sum + expense.averageAmount * multiplier;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RepeatIcon className="w-5 h-5" />
              Recurring Expenses
            </CardTitle>
            <CardDescription>Automatically detected subscription patterns</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(totalMonthly)}</div>
            <div className="text-xs text-muted-foreground">Monthly Estimate</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenses.map((expense, index) => {
            const daysUntil = getDaysUntilNext(expense.nextExpectedDate);
            const isUpcoming = differenceInDays(expense.nextExpectedDate, new Date()) <= 7;

            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  isUpcoming ? 'bg-amber-50 border-amber-200' : 'bg-card'
                } hover:bg-accent/50 transition-colors`}
              >
                <div className="w-10 h-10 flex items-center justify-center rounded bg-primary/10 shrink-0">
                  <RepeatIcon className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">{expense.description}</h4>
                    <Badge variant="outline" className={`shrink-0 ${getFrequencyColor(expense.frequency)}`}>
                      {expense.frequency}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {expense.category}
                      </Badge>
                      <span>•</span>
                      <span>{expense.occurrences} occurrences</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span className={isUpcoming ? 'text-amber-700 font-medium' : 'text-muted-foreground'}>
                          Next: {format(expense.nextExpectedDate, 'MMM d')} ({daysUntil})
                        </span>
                      </div>
                      <div className="font-semibold text-sm">
                        {formatCurrency(expense.averageAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Recurring</span>
            <span className="font-semibold">{expenses.length} expenses found</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
