'use client';

import { useState } from 'react';
import { Check, Sparkles, Users, Receipt, ArrowRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'create-group' | 'add-expense' | 'complete';

export function OnboardingFlow({ open, onOpenChange, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [groupCreated, setGroupCreated] = useState(false);
  const [expenseAdded, setExpenseAdded] = useState(false);

  const steps = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'create-group', label: 'Create Group', icon: Users },
    { id: 'add-expense', label: 'Add Expense', icon: Receipt },
    { id: 'complete', label: 'Complete', icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  function handleSkip() {
    onOpenChange(false);
    onComplete();
  }

  function handleNext() {
    if (currentStep === 'welcome') {
      setCurrentStep('create-group');
    } else if (currentStep === 'create-group') {
      setCurrentStep('add-expense');
    } else if (currentStep === 'add-expense') {
      setCurrentStep('complete');
    } else if (currentStep === 'complete') {
      onOpenChange(false);
      onComplete();
    }
  }

  function handleSkipCreateGroup() {
    setCurrentStep('add-expense');
  }

  function handleSkipAddExpense() {
    setCurrentStep('complete');
  }

  function handleCreateGroupClick() {
    // Close onboarding temporarily to allow dialog interaction
    onOpenChange(false);
    // Use a small delay to allow the onboarding dialog to close before showing tutorial
    setTimeout(() => {
      setGroupCreated(true);
      setCurrentStep('add-expense');
      onOpenChange(true);
    }, 300);
  }

  function handleAddExpenseClick() {
    // Close onboarding temporarily
    onOpenChange(false);
    setTimeout(() => {
      setExpenseAdded(true);
      setCurrentStep('complete');
      onOpenChange(true);
    }, 300);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Welcome to DuoFi
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Let&apos;s get you set up in just a few steps
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isComplete = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      isComplete && 'text-primary',
                      isCurrent && 'text-foreground font-medium',
                      !isComplete && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    <StepIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="py-6">
            {currentStep === 'welcome' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Track expenses together</h3>
                    <p className="text-muted-foreground">
                      DuoFi makes it easy to split bills, track shared expenses, and settle up with friends and roommates.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex gap-3 p-4 rounded-lg border bg-card">
                    <Users className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Create Groups</h4>
                      <p className="text-sm text-muted-foreground">
                        Set up groups for roommates, trips, or any shared expenses
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-lg border bg-card">
                    <Receipt className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Track Expenses</h4>
                      <p className="text-sm text-muted-foreground">
                        Add expenses and split them equally or customize the split
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-lg border bg-card">
                    <Check className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Settle Up</h4>
                      <p className="text-sm text-muted-foreground">
                        See who owes what and mark payments as settled
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleSkip} className="flex-1">
                    Skip Tour
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'create-group' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Create Your First Group</h3>
                  <p className="text-muted-foreground text-sm">
                    Groups help you organize shared expenses with roommates, friends, or travel companions
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Examples:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• &quot;Apartment 4B&quot; for roommates</li>
                    <li>• &quot;Tokyo Trip 2025&quot; for travel</li>
                    <li>• &quot;Beach House Weekend&quot; for events</li>
                  </ul>
                </div>

                {groupCreated ? (
                  <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Group created successfully!
                    </span>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSkipCreateGroup} className="flex-1">
                    Skip for Now
                  </Button>
                  <Button onClick={handleCreateGroupClick} className="flex-1">
                    <Users className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Click &quot;Create Group&quot; to open the group creation form, then come back here to continue
                </p>
              </div>
            )}

            {currentStep === 'add-expense' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Add Your First Expense</h3>
                  <p className="text-muted-foreground text-sm">
                    Track personal expenses or split group expenses easily
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">You can add:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Personal expenses (just for you)</li>
                    <li>• Shared expenses (split with your group)</li>
                    <li>• Add receipts and notes</li>
                  </ul>
                </div>

                {expenseAdded ? (
                  <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Expense added successfully!
                    </span>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSkipAddExpense} className="flex-1">
                    Skip for Now
                  </Button>
                  <Button onClick={handleAddExpenseClick} className="flex-1">
                    <Receipt className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Click &quot;Add Expense&quot; to open the expense form, then come back here to continue
                </p>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-20 w-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <Check className="h-10 w-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">You&apos;re All Set! 🎉</h3>
                    <p className="text-muted-foreground">
                      You&apos;re ready to start tracking expenses and managing your finances
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">What&apos;s Next?</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>View your dashboard to see expense summaries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Invite group members to start splitting expenses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Check analytics to understand your spending patterns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Set up budgets and get smart notifications</span>
                    </li>
                  </ul>
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
