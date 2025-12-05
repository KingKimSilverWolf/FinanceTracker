'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, X, Users, Receipt, TrendingUp, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  hasGroups: boolean;
  hasExpenses: boolean;
  onDismiss: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
  link?: string;
}

export function OnboardingChecklist({ hasGroups, hasExpenses, onDismiss }: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const items: ChecklistItem[] = [
    {
      id: 'create-group',
      label: 'Create your first group',
      description: 'Set up a group for roommates or friends',
      completed: hasGroups,
      icon: Users,
      link: '/dashboard/groups',
    },
    {
      id: 'add-expense',
      label: 'Add an expense',
      description: 'Track your first expense',
      completed: hasExpenses,
      icon: Receipt,
      link: '/dashboard/expenses',
    },
    {
      id: 'view-analytics',
      label: 'Check your analytics',
      description: 'See insights about your spending',
      completed: false,
      icon: TrendingUp,
      link: '/dashboard/analytics',
    },
    {
      id: 'set-budget',
      label: 'Set up a budget',
      description: 'Get notified about spending limits',
      completed: false,
      icon: Settings,
      link: '/dashboard/settings?tab=budgets',
    },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;
  const isFullyCompleted = completedCount === items.length;

  useEffect(() => {
    // Auto-dismiss when all items are completed
    if (isFullyCompleted) {
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFullyCompleted]);

  function handleDismiss() {
    setDismissed(true);
    onDismiss();
  }

  if (dismissed) return null;

  return (
    <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {isFullyCompleted ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  All Set! 🎉
                </>
              ) : (
                <>
                  Get Started with DuoFi
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {isFullyCompleted
                ? "You've completed all the basics!"
                : `Complete ${items.length - completedCount} more ${items.length - completedCount === 1 ? 'task' : 'tasks'} to get the most out of DuoFi`}
            </CardDescription>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2 text-sm">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-muted-foreground font-medium whitespace-nowrap">
              {completedCount}/{items.length}
            </span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-all',
                  item.completed 
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50' 
                    : 'bg-card hover:bg-muted/50 border-border'
                )}
              >
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    item.completed
                      ? 'bg-green-600 text-white'
                      : 'border-2 border-muted-foreground/30'
                  )}
                >
                  {item.completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'font-medium text-sm',
                        item.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>

                {!item.completed && item.link && (
                  <Link href={item.link}>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      Go
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}

          {isFullyCompleted && (
            <div className="text-center pt-2 pb-1">
              <p className="text-sm text-muted-foreground">
                This card will auto-dismiss in a few seconds ✨
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
