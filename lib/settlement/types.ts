/**
 * Settlement System Types
 * 
 * Types for tracking who owes whom and settlement history
 */

export interface PersonBalance {
  userId: string;
  userName: string;
  totalPaid: number; // Amount this person paid for shared expenses
  totalOwed: number; // Amount this person owes based on their share
  netBalance: number; // Positive = owed money, Negative = owes money
}

export interface SettlementAmount {
  from: string; // userId who owes
  fromName: string;
  to: string; // userId who is owed
  toName: string;
  amount: number; // Amount to be paid
}

export interface MonthlySettlement {
  groupId: string;
  groupName: string;
  month: string; // "2025-11"
  totalExpenses: number;
  expenseCount: number;
  balances: PersonBalance[];
  settlements: SettlementAmount[]; // Simplified "who pays whom"
  isSettled: boolean;
  settledAt?: Date;
  settledBy?: string;
  notes?: string;
}

export interface SettlementHistory {
  id: string;
  groupId: string;
  groupName: string;
  month: string;
  settledAt: Date;
  settledBy: string;
  settledByName: string;
  totalAmount: number;
  settlements: SettlementAmount[];
  notes?: string;
}

export interface ExpenseSettlementDetails {
  expenseId: string;
  description: string;
  category: string;
  date: Date;
  totalAmount: number;
  paidBy: string;
  paidByName: string;
  splitBetween: Array<{
    userId: string;
    userName: string;
    share: number;
  }>;
}
