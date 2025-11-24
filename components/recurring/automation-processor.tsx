'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { processRecurringExpenses } from '@/lib/firebase/recurring';

/**
 * Background component to process recurring expenses
 * Runs on app mount and checks for due recurring expenses
 */
export function RecurringAutomationProcessor() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Process recurring expenses when app loads
    const processExpenses = async () => {
      try {
        const createdCount = await processRecurringExpenses(user.uid);
        if (createdCount > 0) {
          console.log(`Auto-created ${createdCount} recurring expenses`);
        }
      } catch (error) {
        console.error('Error processing recurring expenses:', error);
      }
    };

    // Run immediately on mount
    processExpenses();

    // Also run every hour while the app is open
    const interval = setInterval(processExpenses, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // This component doesn't render anything
  return null;
}
