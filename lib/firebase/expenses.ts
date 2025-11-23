import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { SplitMethod, ExpenseType } from '@/lib/constants/expenses';

/**
 * Split data for shared expenses
 * Maps userId to their share amount (in cents)
 */
export interface SplitData {
  [userId: string]: number;
}

/**
 * Expense interface
 */
export interface Expense {
  id: string;
  type: ExpenseType; // 'shared' | 'personal'
  
  // Common fields
  userId: string; // Owner/creator of expense
  amount: number; // Total amount in cents
  description: string;
  category: string;
  date: Date;
  notes?: string;
  receiptURL?: string;
  paymentMethod?: string;
  
  // Shared expense fields
  groupId?: string; // null for personal expenses
  paidBy?: string; // userId who paid (shared only)
  splitMethod?: SplitMethod; // 'equal' | 'percentage' | 'amount' | 'custom'
  splitData?: SplitData; // Who owes what (shared only)
  participants?: string[]; // Array of userIds involved in this expense
  
  // Recurring fields (future enhancement)
  isRecurring?: boolean;
  recurringFrequency?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Internal Firestore expense type
interface FirestoreExpense {
  type: ExpenseType;
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: { toDate?: () => Date } | Date;
  notes?: string;
  receiptURL?: string;
  paymentMethod?: string;
  groupId?: string;
  paidBy?: string;
  splitMethod?: SplitMethod;
  splitData?: SplitData;
  participants?: string[];
  isRecurring?: boolean;
  recurringFrequency?: string;
  createdAt: { toDate?: () => Date } | Date;
  updatedAt: { toDate?: () => Date } | Date;
}

/**
 * Helper to convert Firestore timestamp to Date
 */
function toDate(timestamp: { toDate?: () => Date } | Date): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate ? timestamp.toDate() : new Date();
}

/**
 * Create a new expense
 */
export async function createExpense(expenseData: {
  type: ExpenseType;
  userId: string;
  amount: number; // in cents
  description: string;
  category: string;
  date: Date;
  notes?: string;
  receiptURL?: string;
  paymentMethod?: string;
  groupId?: string;
  paidBy?: string;
  splitMethod?: SplitMethod;
  splitData?: SplitData;
  participants?: string[];
}): Promise<string> {
  const expenseRef = await addDoc(collection(db, 'expenses'), {
    ...expenseData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return expenseRef.id;
}

/**
 * Get a single expense by ID
 */
export async function getExpense(expenseId: string): Promise<Expense | null> {
  const expenseRef = doc(db, 'expenses', expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    return null;
  }

  const data = expenseSnap.data() as FirestoreExpense;
  return {
    id: expenseSnap.id,
    ...data,
    date: toDate(data.date),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * Get personal expenses for a user
 */
export async function getPersonalExpenses(userId: string, limitCount: number = 50): Promise<Expense[]> {
  const expensesRef = collection(db, 'expenses');
  const q = query(
    expensesRef,
    where('userId', '==', userId),
    where('type', '==', 'personal'),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as FirestoreExpense;
    return {
      id: doc.id,
      ...data,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}

/**
 * Get shared expenses for a group
 */
export async function getGroupExpenses(groupId: string, limitCount: number = 100): Promise<Expense[]> {
  const expensesRef = collection(db, 'expenses');
  const q = query(
    expensesRef,
    where('groupId', '==', groupId),
    where('type', '==', 'shared'),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as FirestoreExpense;
    return {
      id: doc.id,
      ...data,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}

/**
 * Get all expenses for a user (personal + shared from their groups)
 */
export async function getUserExpenses(userId: string, limitCount: number = 100): Promise<Expense[]> {
  const expensesRef = collection(db, 'expenses');
  const q = query(
    expensesRef,
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as FirestoreExpense;
    return {
      id: doc.id,
      ...data,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}

/**
 * Update an expense
 */
export async function updateExpense(
  expenseId: string,
  updates: Partial<{
    amount: number;
    description: string;
    category: string;
    date: Date;
    notes: string;
    receiptURL: string;
    paymentMethod: string;
    splitMethod: SplitMethod;
    splitData: SplitData;
    participants: string[];
  }>
): Promise<void> {
  const expenseRef = doc(db, 'expenses', expenseId);

  await updateDoc(expenseRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const expenseRef = doc(db, 'expenses', expenseId);
  await deleteDoc(expenseRef);
}

/**
 * Calculate equal split for shared expense
 */
export function calculateEqualSplit(totalAmount: number, memberCount: number): number {
  return Math.round(totalAmount / memberCount);
}

/**
 * Calculate split data from percentages
 */
export function calculatePercentageSplit(
  totalAmount: number,
  percentages: { [userId: string]: number }
): SplitData {
  const splitData: SplitData = {};
  
  Object.entries(percentages).forEach(([userId, percentage]) => {
    splitData[userId] = Math.round((totalAmount * percentage) / 100);
  });
  
  return splitData;
}

/**
 * Validate split data equals total amount
 */
export function validateSplitData(totalAmount: number, splitData: SplitData): boolean {
  const sum = Object.values(splitData).reduce((acc, amount) => acc + amount, 0);
  // Allow 1 cent difference due to rounding
  return Math.abs(sum - totalAmount) <= 1;
}
