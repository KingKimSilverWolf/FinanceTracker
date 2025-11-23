/**
 * CSV Export Functionality
 * 
 * Exports expense data to CSV format for download
 */

import { unparse } from 'papaparse';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ExportOptions {
  userId: string;
  startDate: Date;
  endDate: Date;
  groupIds?: string[];
  categories?: string[];
  includeSettlements?: boolean;
}

interface ExpenseRow {
  Date: string;
  Description: string;
  Category: string;
  Amount: string;
  Group: string;
  'Paid By': string;
  'Split With': string;
  'My Share': string;
  Status: string;
}

/**
 * Export expenses to CSV format
 */
export async function exportExpensesToCSV(options: ExportOptions): Promise<string> {
  try {
    const { userId, startDate, endDate, groupIds, categories } = options;

    // Query expenses
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);

    // Build CSV rows
    const rows: ExpenseRow[] = [];

    snapshot.forEach((doc) => {
      const expense = doc.data();

      // Filter by user involvement
      const isInvolved = expense.paidBy === userId || 
                         expense.splitBetween?.includes(userId);
      if (!isInvolved) return;

      // Filter by groups if specified
      if (groupIds && groupIds.length > 0 && !groupIds.includes(expense.groupId)) {
        return;
      }

      // Filter by categories if specified
      if (categories && categories.length > 0 && !categories.includes(expense.category)) {
        return;
      }

      // Calculate user share
      const totalSplits = expense.splitBetween?.length || 1;
      const userShare = Math.floor(expense.amount / totalSplits);

      // Get split with names (simplified)
      const splitWith = expense.splitBetween?.length > 0
        ? `${expense.splitBetween.length} members`
        : 'Solo';

      // Add row
      rows.push({
        'Date': format(expense.date.toDate(), 'yyyy-MM-dd'),
        'Description': expense.description || 'No description',
        'Category': expense.category || 'Uncategorized',
        'Amount': formatCurrency(expense.amount),
        'Group': expense.groupName || 'Unknown',
        'Paid By': expense.paidByName || 'Unknown',
        'Split With': splitWith,
        'My Share': formatCurrency(userShare),
        'Status': expense.status || 'active',
      });
    });

    // Convert to CSV
    const csv = unparse(rows, {
      quotes: true,
      header: true,
    });

    return csv;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export expenses to CSV');
  }
}

/**
 * Download CSV file to user's device
 */
export function downloadCSV(csv: string, filename: string = 'expenses.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export and download expenses in one step
 */
export async function exportAndDownloadExpenses(
  options: ExportOptions,
  filename?: string
): Promise<void> {
  try {
    const csv = await exportExpensesToCSV(options);
    const defaultFilename = `expenses_${format(options.startDate, 'yyyy-MM-dd')}_to_${format(options.endDate, 'yyyy-MM-dd')}.csv`;
    downloadCSV(csv, filename || defaultFilename);
  } catch (error) {
    console.error('Error in exportAndDownloadExpenses:', error);
    throw error;
  }
}

/**
 * Export category summary to CSV
 */
export function exportCategorySummaryToCSV(
  categories: Array<{ category: string; totalSpent: number; expenseCount: number; percentage: number }>
): string {
  const rows = categories.map(cat => ({
    'Category': cat.category,
    'Total Spent': formatCurrency(cat.totalSpent),
    'Expense Count': cat.expenseCount,
    'Percentage': `${cat.percentage.toFixed(1)}%`,
  }));

  return unparse(rows, {
    quotes: true,
    header: true,
  });
}

/**
 * Export budget status to CSV
 */
export function exportBudgetStatusToCSV(
  budgets: Array<{
    category: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    status: string;
  }>
): string {
  const rows = budgets.map(budget => ({
    'Category': budget.category,
    'Budget': formatCurrency(budget.budgetAmount),
    'Spent': formatCurrency(budget.spentAmount),
    'Remaining': formatCurrency(budget.remainingAmount),
    'Percentage Used': `${budget.percentageUsed.toFixed(1)}%`,
    'Status': budget.status.toUpperCase(),
  }));

  return unparse(rows, {
    quotes: true,
    header: true,
  });
}
