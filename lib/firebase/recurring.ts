/**
 * Recurring Expense Service
 * 
 * Firebase operations for recurring expense templates and automation
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { createExpense } from './expenses';
import type {
  RecurringExpense,
  RecurringExpenseFormData,
  RecurringFrequency,
  RecurringStatus,
  RecurringExpenseStats,
} from '../recurring/types';

/**
 * Calculate next run date based on frequency
 */
export function calculateNextRunDate(
  currentDate: Date,
  frequency: RecurringFrequency
): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}

/**
 * Create a new recurring expense template
 */
export async function createRecurringExpense(
  formData: RecurringExpenseFormData,
  userId: string
): Promise<string> {
  try {
    const recurringRef = collection(db, 'recurringExpenses');
    
    const recurringExpense = {
      description: formData.description,
      amount: formData.amount,
      category: formData.category,
      groupId: formData.groupId,
      paidBy: formData.paidBy,
      splitBetween: formData.splitBetween,
      frequency: formData.frequency,
      startDate: Timestamp.fromDate(formData.startDate),
      endDate: formData.endDate ? Timestamp.fromDate(formData.endDate) : null,
      nextRunDate: Timestamp.fromDate(formData.startDate),
      status: 'active' as RecurringStatus,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      totalCreated: 0,
      notes: formData.notes || '',
    };
    
    const docRef = await addDoc(recurringRef, recurringExpense);
    return docRef.id;
  } catch (error) {
    console.error('Error creating recurring expense:', error);
    throw error;
  }
}

/**
 * Get all recurring expenses for a user
 */
export async function getUserRecurringExpenses(
  userId: string
): Promise<RecurringExpense[]> {
  try {
    const recurringRef = collection(db, 'recurringExpenses');
    const q = query(
      recurringRef,
      where('createdBy', '==', userId),
      orderBy('nextRunDate', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const recurring: RecurringExpense[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      recurring.push({
        id: doc.id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        groupId: data.groupId,
        groupName: data.groupName || '',
        paidBy: data.paidBy,
        splitBetween: data.splitBetween,
        frequency: data.frequency,
        startDate: data.startDate.toDate(),
        endDate: data.endDate?.toDate(),
        nextRunDate: data.nextRunDate.toDate(),
        status: data.status,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        lastCreatedAt: data.lastCreatedAt?.toDate(),
        totalCreated: data.totalCreated || 0,
        notes: data.notes,
      });
    });
    
    return recurring;
  } catch (error) {
    console.error('Error getting recurring expenses:', error);
    return [];
  }
}

/**
 * Get recurring expenses for a specific group
 */
export async function getGroupRecurringExpenses(
  groupId: string
): Promise<RecurringExpense[]> {
  try {
    const recurringRef = collection(db, 'recurringExpenses');
    const q = query(
      recurringRef,
      where('groupId', '==', groupId),
      where('status', '==', 'active'),
      orderBy('nextRunDate', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const recurring: RecurringExpense[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      recurring.push({
        id: doc.id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        groupId: data.groupId,
        groupName: data.groupName || '',
        paidBy: data.paidBy,
        splitBetween: data.splitBetween,
        frequency: data.frequency,
        startDate: data.startDate.toDate(),
        endDate: data.endDate?.toDate(),
        nextRunDate: data.nextRunDate.toDate(),
        status: data.status,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        lastCreatedAt: data.lastCreatedAt?.toDate(),
        totalCreated: data.totalCreated || 0,
        notes: data.notes,
      });
    });
    
    return recurring;
  } catch (error) {
    console.error('Error getting group recurring expenses:', error);
    return [];
  }
}

/**
 * Update a recurring expense template
 */
export async function updateRecurringExpense(
  recurringId: string,
  updates: Partial<RecurringExpenseFormData>
): Promise<void> {
  try {
    const recurringRef = doc(db, 'recurringExpenses', recurringId);
    
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    // Convert dates to Timestamps
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    }
    
    await updateDoc(recurringRef, updateData);
  } catch (error) {
    console.error('Error updating recurring expense:', error);
    throw error;
  }
}

/**
 * Pause or resume a recurring expense
 */
export async function toggleRecurringExpenseStatus(
  recurringId: string,
  newStatus: 'active' | 'paused'
): Promise<void> {
  try {
    const recurringRef = doc(db, 'recurringExpenses', recurringId);
    await updateDoc(recurringRef, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling recurring expense status:', error);
    throw error;
  }
}

/**
 * Delete a recurring expense template
 */
export async function deleteRecurringExpense(recurringId: string): Promise<void> {
  try {
    const recurringRef = doc(db, 'recurringExpenses', recurringId);
    await deleteDoc(recurringRef);
  } catch (error) {
    console.error('Error deleting recurring expense:', error);
    throw error;
  }
}

/**
 * Check and create expenses from recurring templates
 * This should be called periodically (e.g., on app startup or daily)
 */
export async function processRecurringExpenses(userId: string): Promise<number> {
  try {
    const recurringRef = collection(db, 'recurringExpenses');
    const now = new Date();
    
    // Get active recurring expenses that are due
    const q = query(
      recurringRef,
      where('createdBy', '==', userId),
      where('status', '==', 'active'),
      where('nextRunDate', '<=', Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    let createdCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      // Convert Timestamps to Dates
      const nextRunDate = data.nextRunDate.toDate();
      const endDate = data.endDate?.toDate();
      
      // Check if end date has passed
      if (endDate && endDate < now) {
        // Mark as completed
        await updateDoc(doc(db, 'recurringExpenses', docSnapshot.id), {
          status: 'completed',
          updatedAt: Timestamp.now(),
        });
        continue;
      }
      
      try {
        // Create the actual expense
        await createExpense({
          type: 'shared',
          userId: data.createdBy,
          amount: data.amount,
          description: `${data.description} (Auto-created)`,
          category: data.category,
          date: now,
          groupId: data.groupId,
          paidBy: data.paidBy,
          splitMethod: 'equal',
          participants: data.splitBetween,
        });
        
        // Update recurring expense
        const nextRun = calculateNextRunDate(nextRunDate, data.frequency);
        await updateDoc(doc(db, 'recurringExpenses', docSnapshot.id), {
          nextRunDate: Timestamp.fromDate(nextRun),
          lastCreatedAt: Timestamp.now(),
          totalCreated: (data.totalCreated || 0) + 1,
          updatedAt: Timestamp.now(),
        });
        
        createdCount++;
      } catch (error) {
        console.error(`Error processing recurring expense ${docSnapshot.id}:`, error);
      }
    }
    
    return createdCount;
  } catch (error) {
    console.error('Error processing recurring expenses:', error);
    return 0;
  }
}

/**
 * Get statistics about recurring expenses
 */
export async function getRecurringExpenseStats(
  userId: string
): Promise<RecurringExpenseStats> {
  try {
    const recurring = await getUserRecurringExpenses(userId);
    
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const monthFromNow = new Date(now);
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);
    
    const stats: RecurringExpenseStats = {
      totalActive: recurring.filter(r => r.status === 'active').length,
      totalPaused: recurring.filter(r => r.status === 'paused').length,
      upcomingThisWeek: recurring.filter(
        r => r.status === 'active' && r.nextRunDate <= weekFromNow
      ).length,
      upcomingThisMonth: recurring.filter(
        r => r.status === 'active' && r.nextRunDate <= monthFromNow
      ).length,
      totalAmountPerMonth: 0,
    };
    
    // Calculate estimated monthly total
    recurring
      .filter(r => r.status === 'active')
      .forEach(r => {
        let monthlyAmount = 0;
        switch (r.frequency) {
          case 'daily':
            monthlyAmount = r.amount * 30;
            break;
          case 'weekly':
            monthlyAmount = r.amount * 4;
            break;
          case 'biweekly':
            monthlyAmount = r.amount * 2;
            break;
          case 'monthly':
            monthlyAmount = r.amount;
            break;
          case 'quarterly':
            monthlyAmount = r.amount / 3;
            break;
          case 'yearly':
            monthlyAmount = r.amount / 12;
            break;
        }
        stats.totalAmountPerMonth += monthlyAmount;
      });
    
    return stats;
  } catch (error) {
    console.error('Error getting recurring expense stats:', error);
    return {
      totalActive: 0,
      totalPaused: 0,
      upcomingThisWeek: 0,
      upcomingThisMonth: 0,
      totalAmountPerMonth: 0,
    };
  }
}
