/**
 * Budget Alerts System
 * 
 * Monitors budget status and generates alerts/notifications
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getBudgetStatus, getUserBudgetSettings } from '@/lib/firebase/analytics';
import { createNotification } from '@/lib/notifications/notifications';
import type { BudgetAlert, NotificationType } from '@/lib/notifications/types';

/**
 * Check budgets and create alerts if needed
 */
export async function checkBudgetsAndAlert(userId: string): Promise<BudgetAlert[]> {
  try {
    const budgetStatuses = await getBudgetStatus(userId);
    const settings = await getUserBudgetSettings(userId);
    
    if (!settings) return [];
    
    const alerts: BudgetAlert[] = [];
    const now = new Date();
    
    for (const budget of budgetStatuses) {
      // Skip if safe
      if (budget.status === 'safe') continue;
      
      // Check if we already alerted for this budget this month
      const existingAlert = await getRecentBudgetAlert(
        userId,
        budget.category,
        now
      );
      
      // Determine alert type
      let shouldAlert = false;
      let notificationType: NotificationType = 'budget_warning';
      
      if (budget.status === 'exceeded' && !existingAlert?.exceededNotified) {
        shouldAlert = true;
        notificationType = 'budget_exceeded';
      } else if (
        budget.status === 'warning' && 
        budget.percentageUsed >= settings.alertThreshold &&
        !existingAlert?.warningNotified
      ) {
        shouldAlert = true;
        notificationType = 'budget_warning';
      }
      
      if (shouldAlert) {
        // Create alert record
        const alert: BudgetAlert = {
          id: '',
          userId,
          category: budget.category,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          percentageUsed: budget.percentageUsed,
          status: budget.status,
          projectedOverage: budget.projectedTotal > budget.budgetAmount 
            ? budget.projectedTotal - budget.budgetAmount 
            : undefined,
          daysRemaining: budget.daysRemaining,
          createdAt: now,
          notified: false,
        };
        
        // Save alert to database
        const alertRef = await addDoc(
          collection(db, 'users', userId, 'budgetAlerts'),
          {
            ...alert,
            createdAt: Timestamp.now(),
            [notificationType === 'budget_exceeded' ? 'exceededNotified' : 'warningNotified']: true,
          }
        );
        
        alert.id = alertRef.id;
        alert.notified = true;
        alerts.push(alert);
        
        // Create notification
        await createBudgetNotification(userId, budget, notificationType);
      }
    }
    
    return alerts;
  } catch (error) {
    console.error('Error in checkBudgetsAndAlert:', error);
    return [];
  }
}

/**
 * Get recent budget alert for a category
 */
async function getRecentBudgetAlert(
  userId: string,
  category: string,
  month: Date
): Promise<{ warningNotified: boolean; exceededNotified: boolean } | null> {
  try {
    const alertsRef = collection(db, 'users', userId, 'budgetAlerts');
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    
    const q = query(
      alertsRef,
      where('category', '==', category),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data();
    return {
      warningNotified: data.warningNotified || false,
      exceededNotified: data.exceededNotified || false,
    };
  } catch (error) {
    console.error('Error in getRecentBudgetAlert:', error);
    return null;
  }
}

/**
 * Create budget notification
 */
async function createBudgetNotification(
  userId: string,
  budget: {
    category: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    projectedTotal: number;
    daysRemaining: number;
  },
  type: NotificationType
): Promise<void> {
  const percentage = Math.round(budget.percentageUsed);
  const remaining = budget.remainingAmount;
  const daysLeft = budget.daysRemaining;
  
  let title: string;
  let message: string;
  let priority: 'high' | 'urgent' = 'high';
  
  if (type === 'budget_exceeded') {
    title = `🚨 Budget Exceeded: ${budget.category}`;
    message = `You've exceeded your ${budget.category} budget by ${Math.abs(remaining / 100).toFixed(2)}. You're at ${percentage}% of your limit with ${daysLeft} days left in the month.`;
    priority = 'urgent';
  } else {
    title = `⚠️ Budget Warning: ${budget.category}`;
    message = `You've used ${percentage}% of your ${budget.category} budget. ${(remaining / 100).toFixed(2)} remaining with ${daysLeft} days left in the month.`;
    priority = 'high';
  }
  
  // Add projection warning if needed
  if (budget.projectedTotal > budget.budgetAmount) {
    const projectedOverage = budget.projectedTotal - budget.budgetAmount;
    message += ` At your current pace, you'll exceed your budget by $${(projectedOverage / 100).toFixed(2)}.`;
  }
  
  await createNotification({
    userId,
    type,
    priority,
    title,
    message,
    category: budget.category,
    amount: budget.spentAmount,
    actionLabel: 'View Budget',
    actionUrl: '/dashboard/analytics',
  });
}

/**
 * Get all budget alerts for user
 */
export async function getUserBudgetAlerts(
  userId: string,
  limitCount: number = 10
): Promise<BudgetAlert[]> {
  try {
    const alertsRef = collection(db, 'users', userId, 'budgetAlerts');
    const q = query(
      alertsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const alerts: BudgetAlert[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      alerts.push({
        id: doc.id,
        userId: data.userId,
        category: data.category,
        budgetAmount: data.budgetAmount,
        spentAmount: data.spentAmount,
        percentageUsed: data.percentageUsed,
        status: data.status,
        projectedOverage: data.projectedOverage,
        daysRemaining: data.daysRemaining,
        createdAt: data.createdAt.toDate(),
        notified: data.notified || false,
      });
    });
    
    return alerts;
  } catch (error) {
    console.error('Error in getUserBudgetAlerts:', error);
    return [];
  }
}

/**
 * Check for large expense and create alert
 */
export async function checkLargeExpense(
  userId: string,
  amount: number,
  category: string,
  description: string
): Promise<void> {
  try {
    // Get user preferences
    const prefsSnap = await getDocs(query(collection(db, 'users', userId, 'settings')));
    
    let threshold = 10000; // Default $100
    
    prefsSnap.forEach((docSnap) => {
      if (docSnap.id === 'notifications') {
        threshold = docSnap.data().largeExpenseThreshold || 10000;
      }
    });
    
    if (amount >= threshold) {
      await createNotification({
        userId,
        type: 'large_expense',
        priority: 'medium',
        title: '💸 Large Expense Detected',
        message: `A large expense of $${(amount / 100).toFixed(2)} was recorded in ${category}: "${description}".`,
        category,
        amount,
        actionLabel: 'View Expense',
        actionUrl: '/dashboard/expenses',
      });
    }
  } catch (error) {
    console.error('Error in checkLargeExpense:', error);
  }
}

/**
 * Check for spending spike and create alert
 */
export async function checkSpendingSpike(
  userId: string,
  currentAmount: number,
  averageAmount: number,
  category: string
): Promise<void> {
  try {
    // Alert if current spending is 50% higher than average
    const threshold = averageAmount * 1.5;
    
    if (currentAmount >= threshold && averageAmount > 0) {
      const percentageIncrease = Math.round(
        ((currentAmount - averageAmount) / averageAmount) * 100
      );
      
      await createNotification({
        userId,
        type: 'spending_spike',
        priority: 'medium',
        title: `📈 Spending Spike: ${category}`,
        message: `Your ${category} spending is ${percentageIncrease}% higher than usual this month. Current: $${(currentAmount / 100).toFixed(2)}, Average: $${(averageAmount / 100).toFixed(2)}.`,
        category,
        amount: currentAmount,
        actionLabel: 'View Analytics',
        actionUrl: '/dashboard/analytics',
      });
    }
  } catch (error) {
    console.error('Error in checkSpendingSpike:', error);
  }
}
