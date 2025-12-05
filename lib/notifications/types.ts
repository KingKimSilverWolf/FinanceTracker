/**
 * Notification System Types
 * 
 * Defines all notification types and interfaces for DuoFi
 */

export type NotificationType = 
  | 'budget_warning'
  | 'budget_exceeded'
  | 'budget_approaching'
  | 'large_expense'
  | 'settlement_due'
  | 'recurring_created'
  | 'monthly_summary'
  | 'spending_spike'
  | 'savings_milestone'
  | 'group_invite'
  | 'payment_received';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  
  // Content
  title: string;
  message: string;
  icon?: string;
  
  // Metadata
  category?: string;
  amount?: number;
  groupId?: string;
  expenseId?: string;
  
  // Actions
  actionLabel?: string;
  actionUrl?: string;
  
  // Timestamps
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  
  // Budget Notifications
  budgetWarningEnabled: boolean;
  budgetWarningThreshold: number; // percentage (default 80)
  budgetExceededEnabled: boolean;
  
  // Expense Notifications
  largeExpenseEnabled: boolean;
  largeExpenseThreshold: number; // in cents (default 10000 = $100)
  spendingSpikeEnabled: boolean;
  
  // Settlement Notifications
  settlementDueEnabled: boolean;
  settlementReminderDays: number; // days before (default 7)
  
  // Recurring Notifications
  recurringCreatedEnabled: boolean;
  
  // Summary Notifications
  monthlySummaryEnabled: boolean;
  monthlySummaryDay: number; // day of month (default 1)
  
  // Group Notifications
  groupInviteEnabled: boolean;
  paymentReceivedEnabled: boolean;
  
  // Delivery Channels
  inAppNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  userId: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentageUsed: number;
  status: 'warning' | 'exceeded';
  projectedOverage?: number;
  daysRemaining: number;
  createdAt: Date;
  notified: boolean;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  urgent: Notification[];
}
