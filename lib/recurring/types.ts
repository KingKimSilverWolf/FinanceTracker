/**
 * Recurring Expense Types
 * 
 * Types for automated recurring expense templates
 */

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly' // Every 2 weeks
  | 'monthly'
  | 'quarterly' // Every 3 months
  | 'yearly';

export type RecurringStatus = 'active' | 'paused' | 'completed';

export interface RecurringExpense {
  id: string;
  
  // Template information
  description: string;
  amount: number; // in cents
  category: string;
  
  // Group and split information
  groupId: string;
  groupName: string;
  paidBy: string; // userId of default payer
  splitBetween: string[]; // userIds to split between
  
  // Recurring configuration
  frequency: RecurringFrequency;
  startDate: Date; // When to start creating expenses
  endDate?: Date; // Optional end date
  nextRunDate: Date; // Next date to create expense
  
  // Status
  status: RecurringStatus;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Tracking
  lastCreatedAt?: Date; // Last time an expense was created
  totalCreated: number; // Count of expenses created
  
  // Optional
  notes?: string;
}

export interface RecurringExpenseFormData {
  description: string;
  amount: number;
  category: string;
  groupId: string;
  paidBy: string;
  splitBetween: string[];
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface RecurringExpenseStats {
  totalActive: number;
  totalPaused: number;
  upcomingThisWeek: number;
  upcomingThisMonth: number;
  totalAmountPerMonth: number; // Estimated monthly total in cents
}
