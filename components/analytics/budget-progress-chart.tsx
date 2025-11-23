'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BudgetStatus } from '@/lib/firebase/analytics';

interface BudgetProgressChartProps {
  budgets: BudgetStatus[];
  isLoading?: boolean;
}

export function BudgetProgressChart({ budgets, isLoading = false }: BudgetProgressChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending against budgets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending against budgets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">No budgets set</p>
            <p className="text-xs text-muted-foreground">Create budgets to track your spending</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'exceeded':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'exceeded':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
        <CardDescription>
          Track your spending against monthly budgets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {budgets.map((budget, index) => (
            <div key={index} className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(budget.status)}
                  <span className="font-medium text-sm">{budget.category}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${getStatusColor(budget.status)}`}>
                    {budget.percentageUsed.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColor(budget.percentageUsed)}`}
                    style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
                </span>
                <span>
                  {budget.remainingAmount > 0 
                    ? `${formatCurrency(budget.remainingAmount)} left`
                    : `${formatCurrency(Math.abs(budget.remainingAmount))} over`
                  }
                </span>
              </div>

              {/* Projection */}
              {budget.projectedTotal > budget.budgetAmount && (
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    Projected: {formatCurrency(budget.projectedTotal)} by month end
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Days Remaining */}
        {budgets.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              {budgets[0].daysRemaining} days remaining in this month
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
