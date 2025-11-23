/**
 * Analytics Service
 * 
 * Provides analytics calculations and aggregations for expense data.
 * All amounts are in cents for precision.
 */

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit as firestoreLimit,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';
import { endOfMonth, format, startOfDay, endOfDay, startOfMonth } from 'date-fns';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ExpenseData {
  amount: number;
  paidBy: string;
  splitBetween?: string[];
  category?: string;
  date: unknown;
  groupId: string;
  groupName?: string;
  description?: string;
}

export interface SpendingByPeriod {
  period: string; // "2024-11", "2024-W45", "2024-11-23"
  totalSpent: number; // in cents
  totalExpenses: number;
  categories: Record<string, number>; // category -> amount in cents
}

export interface CategoryBreakdown {
  category: string;
  totalSpent: number; // in cents
  expenseCount: number;
  percentage: number; // 0-100
  averageAmount: number; // in cents
  groups: Record<string, number>; // groupId -> amount in cents
}

export interface PeriodComparison {
  current: SpendingByPeriod;
  previous: SpendingByPeriod;
  percentageChange: number; // -100 to +Infinity
  absoluteChange: number; // in cents
  trend: 'up' | 'down' | 'stable'; // >5% change = up/down
}

export interface TopExpense {
  id: string;
  description: string;
  amount: number; // in cents
  category: string;
  groupName: string;
  date: Date;
  userShare: number; // in cents (what user paid or owes)
}

export interface SpendingSummary {
  totalSpent: number; // in cents
  averagePerDay: number; // in cents
  averagePerExpense: number; // in cents
  expenseCount: number;
  daysWithExpenses: number;
  topCategory: string;
  topCategoryAmount: number; // in cents
}

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate user's share of an expense
 */
function calculateUserShare(
  expense: ExpenseData,
  userId: string
): number {
  // If user is the payer, they initially paid the full amount
  if (expense.paidBy === userId) {
    // But they only "spent" their share
    const totalSplits = expense.splitBetween?.length || 1;
    return Math.floor(expense.amount / totalSplits);
  }
  
  // If user is in splitBetween, they owe their share
  if (expense.splitBetween?.includes(userId)) {
    const totalSplits = expense.splitBetween.length;
    return Math.floor(expense.amount / totalSplits);
  }
  
  return 0;
}

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: unknown): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
}

// ============================================================================
// Core Analytics Functions
// ============================================================================

/**
 * Get spending aggregated by month
 */
export async function getSpendingByMonth(
  userId: string,
  startMonth: string, // "2024-01"
  endMonth: string // "2024-12"
): Promise<SpendingByPeriod[]> {
  try {
    // Parse month strings
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);
    
    const startDate = new Date(startYear, startMonthNum - 1, 1);
    const endDate = endOfMonth(new Date(endYear, endMonthNum - 1, 1));
    
    // Query all expenses in date range
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    // Group by month
    const monthlyData = new Map<string, SpendingByPeriod>();
    
    snapshot.forEach((doc) => {
      const expense = doc.data() as ExpenseData;
      
      // Only include expenses where user is involved
      const isInvolved = expense.paidBy === userId || 
                         expense.splitBetween?.includes(userId);
      if (!isInvolved) return;
      
      const expenseDate = timestampToDate(expense.date);
      const monthKey = format(expenseDate, 'yyyy-MM');
      
      // Initialize month data if not exists
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          period: monthKey,
          totalSpent: 0,
          totalExpenses: 0,
          categories: {},
        });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      const userShare = calculateUserShare(expense, userId);
      
      // Update totals
      monthData.totalSpent += userShare;
      monthData.totalExpenses += 1;
      
      // Update category breakdown
      const category = expense.category || 'Uncategorized';
      monthData.categories[category] = (monthData.categories[category] || 0) + userShare;
    });
    
    // Convert to array and sort by period
    return Array.from(monthlyData.values()).sort((a, b) => 
      a.period.localeCompare(b.period)
    );
  } catch (error) {
    console.error('Error in getSpendingByMonth:', error);
    throw error;
  }
}

/**
 * Get category breakdown for a date range
 */
export async function getCategoryBreakdown(
  userId: string,
  startDate: Date,
  endDate: Date,
  groupIds?: string[] // optional filter by groups
): Promise<CategoryBreakdown[]> {
  try {
    // Query expenses in date range
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(startOfDay(startDate))),
      where('date', '<=', Timestamp.fromDate(endOfDay(endDate))),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Aggregate by category
    const categoryMap = new Map<string, {
      totalSpent: number;
      expenseCount: number;
      groups: Record<string, number>;
    }>();
    
    let grandTotal = 0;
    
    snapshot.forEach((doc) => {
      const expense = doc.data() as ExpenseData;
      
      // Filter by groups if specified
      if (groupIds && groupIds.length > 0 && !groupIds.includes(expense.groupId)) {
        return;
      }
      
      // Only include expenses where user is involved
      const isInvolved = expense.paidBy === userId || 
                         expense.splitBetween?.includes(userId);
      if (!isInvolved) return;
      
      const category = expense.category || 'Uncategorized';
      const userShare = calculateUserShare(expense, userId);
      
      // Initialize category if not exists
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          totalSpent: 0,
          expenseCount: 0,
          groups: {},
        });
      }
      
      const categoryData = categoryMap.get(category)!;
      categoryData.totalSpent += userShare;
      categoryData.expenseCount += 1;
      categoryData.groups[expense.groupId] = 
        (categoryData.groups[expense.groupId] || 0) + userShare;
      
      grandTotal += userShare;
    });
    
    // Convert to array with percentages
    const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        totalSpent: data.totalSpent,
        expenseCount: data.expenseCount,
        percentage: grandTotal > 0 ? (data.totalSpent / grandTotal) * 100 : 0,
        averageAmount: data.expenseCount > 0 ? 
          Math.floor(data.totalSpent / data.expenseCount) : 0,
        groups: data.groups,
      })
    );
    
    // Sort by total spent descending
    return breakdown.sort((a, b) => b.totalSpent - a.totalSpent);
  } catch (error) {
    console.error('Error in getCategoryBreakdown:', error);
    throw error;
  }
}

/**
 * Compare two time periods
 */
export async function comparePeriods(
  userId: string,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): Promise<PeriodComparison> {
  try {
    // Get data for both periods
    const [currentData, previousData] = await Promise.all([
      getSpendingForPeriod(userId, currentStart, currentEnd),
      getSpendingForPeriod(userId, previousStart, previousEnd),
    ]);
    
    const absoluteChange = currentData.totalSpent - previousData.totalSpent;
    const percentageChange = previousData.totalSpent > 0
      ? (absoluteChange / previousData.totalSpent) * 100
      : 0;
    
    // Determine trend (>5% change is significant)
    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(percentageChange) < 5) {
      trend = 'stable';
    } else if (percentageChange > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }
    
    return {
      current: currentData,
      previous: previousData,
      percentageChange,
      absoluteChange,
      trend,
    };
  } catch (error) {
    console.error('Error in comparePeriods:', error);
    throw error;
  }
}

/**
 * Helper: Get spending for a single period
 */
async function getSpendingForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SpendingByPeriod> {
  const expensesRef = collection(db, 'expenses');
  const q = query(
    expensesRef,
    where('date', '>=', Timestamp.fromDate(startOfDay(startDate))),
    where('date', '<=', Timestamp.fromDate(endOfDay(endDate))),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  let totalSpent = 0;
  let totalExpenses = 0;
  const categories: Record<string, number> = {};
  
  snapshot.forEach((doc) => {
    const expense = doc.data() as ExpenseData;
    
    // Only include expenses where user is involved
    const isInvolved = expense.paidBy === userId || 
                       expense.splitBetween?.includes(userId);
    if (!isInvolved) return;
    
    const userShare = calculateUserShare(expense, userId);
    const category = expense.category || 'Uncategorized';
    
    totalSpent += userShare;
    totalExpenses += 1;
    categories[category] = (categories[category] || 0) + userShare;
  });
  
  return {
    period: format(startDate, 'yyyy-MM-dd'),
    totalSpent,
    totalExpenses,
    categories,
  };
}

/**
 * Get top expenses for a date range
 */
export async function getTopExpenses(
  userId: string,
  startDate: Date,
  endDate: Date,
  limitCount: number = 10
): Promise<TopExpense[]> {
  try {
    // Query expenses in date range, ordered by amount
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(startOfDay(startDate))),
      where('date', '<=', Timestamp.fromDate(endOfDay(endDate))),
      orderBy('amount', 'desc'),
      firestoreLimit(limitCount * 2) // Get more to filter
    );
    
    const snapshot = await getDocs(q);
    
    // Filter and map to TopExpense
    const expenses: TopExpense[] = [];
    
    for (const doc of snapshot.docs) {
      const expense = doc.data() as ExpenseData;
      
      // Only include expenses where user is involved
      const isInvolved = expense.paidBy === userId || 
                         expense.splitBetween?.includes(userId);
      if (!isInvolved) continue;
      
      const userShare = calculateUserShare(expense, userId);
      
      expenses.push({
        id: doc.id,
        description: expense.description || 'No description',
        amount: expense.amount,
        category: expense.category || 'Uncategorized',
        groupName: expense.groupName || 'Unknown Group',
        date: timestampToDate(expense.date),
        userShare,
      });
      
      if (expenses.length >= limitCount) break;
    }
    
    return expenses;
  } catch (error) {
    console.error('Error in getTopExpenses:', error);
    throw error;
  }
}

/**
 * Get spending summary for a date range
 */
export async function getSpendingSummary(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SpendingSummary> {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(startOfDay(startDate))),
      where('date', '<=', Timestamp.fromDate(endOfDay(endDate))),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    let totalSpent = 0;
    let expenseCount = 0;
    const categories: Record<string, number> = {};
    const daysWithExpensesSet = new Set<string>();
    
    snapshot.forEach((doc) => {
      const expense = doc.data() as ExpenseData;
      
      // Only include expenses where user is involved
      const isInvolved = expense.paidBy === userId || 
                         expense.splitBetween?.includes(userId);
      if (!isInvolved) return;
      
      const userShare = calculateUserShare(expense, userId);
      const category = expense.category || 'Uncategorized';
      const expenseDate = timestampToDate(expense.date);
      
      totalSpent += userShare;
      expenseCount += 1;
      categories[category] = (categories[category] || 0) + userShare;
      daysWithExpensesSet.add(format(expenseDate, 'yyyy-MM-dd'));
    });
    
    // Calculate date range days
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    // Find top category
    let topCategory = 'None';
    let topCategoryAmount = 0;
    Object.entries(categories).forEach(([category, amount]) => {
      if (amount > topCategoryAmount) {
        topCategory = category;
        topCategoryAmount = amount;
      }
    });
    
    return {
      totalSpent,
      averagePerDay: daysDiff > 0 ? Math.floor(totalSpent / daysDiff) : 0,
      averagePerExpense: expenseCount > 0 ? Math.floor(totalSpent / expenseCount) : 0,
      expenseCount,
      daysWithExpenses: daysWithExpensesSet.size,
      topCategory,
      topCategoryAmount,
    };
  } catch (error) {
    console.error('Error in getSpendingSummary:', error);
    throw error;
  }
}

/**
 * Get daily spending data for trend charts
 */
export async function getDailySpending(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; amount: number }[]> {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(startOfDay(startDate))),
      where('date', '<=', Timestamp.fromDate(endOfDay(endDate))),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    // Group by date
    const dailyMap = new Map<string, number>();
    
    snapshot.forEach((doc) => {
      const expense = doc.data() as ExpenseData;
      
      // Only include expenses where user is involved
      const isInvolved = expense.paidBy === userId || 
                         expense.splitBetween?.includes(userId);
      if (!isInvolved) return;
      
      const userShare = calculateUserShare(expense, userId);
      const dateKey = format(timestampToDate(expense.date), 'yyyy-MM-dd');
      
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + userShare);
    });
    
    // Fill in missing dates with 0
    const result: { date: string; amount: number }[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      result.push({
        date: dateKey,
        amount: dailyMap.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  } catch (error) {
    console.error('Error in getDailySpending:', error);
    throw error;
  }
}

// ============================================================================
// Budget Tracking Functions
// ============================================================================

export interface BudgetSetting {
  category: string;
  monthlyLimit: number; // in cents
  enabled: boolean;
}

export interface BudgetStatus {
  category: string;
  budgetAmount: number; // in cents
  spentAmount: number; // in cents
  remainingAmount: number; // in cents
  percentageUsed: number; // 0-100+
  status: 'safe' | 'warning' | 'exceeded'; // <70%, 70-100%, >100%
  projectedTotal: number; // in cents (based on current pace)
  daysInMonth: number;
  daysRemaining: number;
}

export interface UserBudgetSettings {
  userId: string;
  budgets: BudgetSetting[];
  currency: string;
  alertThreshold: number; // percentage (default 80)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get budget settings for a user
 */
export async function getUserBudgetSettings(userId: string): Promise<UserBudgetSettings | null> {
  try {
    const settingsRef = collection(db, 'users', userId, 'settings');
    const q = query(settingsRef, where('__name__', '==', 'budgets'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const data = snapshot.docs[0].data();
    return {
      userId,
      budgets: data.budgets || [],
      currency: data.currency || 'USD',
      alertThreshold: data.alertThreshold || 80,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error in getUserBudgetSettings:', error);
    return null;
  }
}

/**
 * Save budget settings for a user
 */
export async function saveUserBudgetSettings(
  userId: string,
  budgets: BudgetSetting[],
  alertThreshold: number = 80
): Promise<void> {
  try {
    const settingsRef = collection(db, 'users', userId, 'settings');
    const budgetDocRef = doc(settingsRef, 'budgets');
    
    await setDoc(budgetDocRef, {
      budgets,
      alertThreshold,
      currency: 'USD',
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error in saveUserBudgetSettings:', error);
    throw error;
  }
}

/**
 * Get budget status for current month
 */
export async function getBudgetStatus(
  userId: string,
  month?: Date
): Promise<BudgetStatus[]> {
  try {
    // Get budget settings
    const settings = await getUserBudgetSettings(userId);
    if (!settings || settings.budgets.length === 0) {
      return [];
    }
    
    // Calculate date range for month
    const targetMonth = month || new Date();
    const startDate = startOfMonth(targetMonth);
    const endDate = endOfMonth(targetMonth);
    
    // Get category breakdown for the month
    const categoryBreakdown = await getCategoryBreakdown(userId, startDate, endDate);
    const categoryMap = new Map(
      categoryBreakdown.map(cat => [cat.category, cat.totalSpent])
    );
    
    // Calculate days in month and days remaining
    const now = new Date();
    const daysInMonth = endDate.getDate();
    const currentDay = now.getDate();
    const daysElapsed = currentDay;
    const daysRemaining = Math.max(0, daysInMonth - currentDay);
    
    // Build budget status for each enabled budget
    const statuses: BudgetStatus[] = [];
    
    for (const budget of settings.budgets) {
      if (!budget.enabled) continue;
      
      const spentAmount = categoryMap.get(budget.category) || 0;
      const remainingAmount = budget.monthlyLimit - spentAmount;
      const percentageUsed = budget.monthlyLimit > 0 
        ? (spentAmount / budget.monthlyLimit) * 100 
        : 0;
      
      // Project total based on current pace
      let projectedTotal = spentAmount;
      if (daysElapsed > 0) {
        const dailyAverage = spentAmount / daysElapsed;
        projectedTotal = Math.floor(dailyAverage * daysInMonth);
      }
      
      // Determine status
      let status: 'safe' | 'warning' | 'exceeded';
      if (percentageUsed > 100) {
        status = 'exceeded';
      } else if (percentageUsed >= settings.alertThreshold) {
        status = 'warning';
      } else {
        status = 'safe';
      }
      
      statuses.push({
        category: budget.category,
        budgetAmount: budget.monthlyLimit,
        spentAmount,
        remainingAmount,
        percentageUsed,
        status,
        projectedTotal,
        daysInMonth,
        daysRemaining,
      });
    }
    
    return statuses;
  } catch (error) {
    console.error('Error in getBudgetStatus:', error);
    throw error;
  }
}
