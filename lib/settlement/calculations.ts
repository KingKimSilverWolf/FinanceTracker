/**
 * Settlement Calculations
 * 
 * Core logic for calculating who owes whom and settlement amounts
 */

import { PersonBalance, SettlementAmount } from './types';

/**
 * Calculate individual balances from expense data
 * Returns who paid what and who owes what
 */
export function calculatePersonBalances(
  expenses: Array<{
    paidBy: string;
    amount: number;
    splitBetween?: string[];
  }>,
  userMap: Map<string, string> // userId -> userName
): PersonBalance[] {
  const balances = new Map<string, PersonBalance>();

  // Initialize balances for all users
  userMap.forEach((userName, userId) => {
    balances.set(userId, {
      userId,
      userName,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
    });
  });

  // Process each expense
  expenses.forEach((expense) => {
    const paidBy = expense.paidBy;
    const splitCount = expense.splitBetween?.length || 1;
    const sharePerPerson = expense.amount / splitCount;

    // Add to payer's totalPaid
    const payer = balances.get(paidBy);
    if (payer) {
      payer.totalPaid += expense.amount;
    }

    // Add to each person's totalOwed (their share)
    if (expense.splitBetween) {
      expense.splitBetween.forEach((userId) => {
        const person = balances.get(userId);
        if (person) {
          person.totalOwed += sharePerPerson;
        }
      });
    } else {
      // If no splitBetween, assume payer owes the full amount
      if (payer) {
        payer.totalOwed += expense.amount;
      }
    }
  });

  // Calculate net balance (positive = owed money, negative = owes money)
  balances.forEach((balance) => {
    balance.netBalance = balance.totalPaid - balance.totalOwed;
  });

  return Array.from(balances.values());
}

/**
 * Simplify settlements using the "greedy" algorithm
 * Minimizes number of transactions needed
 */
export function calculateOptimalSettlements(
  balances: PersonBalance[]
): SettlementAmount[] {
  const settlements: SettlementAmount[] = [];

  // Separate creditors (owed money) and debtors (owe money)
  const creditors = balances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = balances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ ...b, remaining: Math.abs(b.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);

  let creditorIdx = 0;
  let debtorIdx = 0;

  // Match creditors with debtors
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];

    // Amount to settle is minimum of what's owed and what's due
    const amount = Math.min(creditor.remaining, debtor.remaining);

    if (amount > 0.01) {
      // Only create settlement if amount is significant (> 1 cent)
      settlements.push({
        from: debtor.userId,
        fromName: debtor.userName,
        to: creditor.userId,
        toName: creditor.userName,
        amount: Math.round(amount), // Round to nearest cent
      });
    }

    // Update remaining amounts
    creditor.remaining -= amount;
    debtor.remaining -= amount;

    // Move to next creditor or debtor if fully settled
    if (creditor.remaining < 0.01) creditorIdx++;
    if (debtor.remaining < 0.01) debtorIdx++;
  }

  return settlements;
}

/**
 * Calculate total settlement amount (sum of all settlements)
 */
export function calculateTotalSettlementAmount(
  settlements: SettlementAmount[]
): number {
  return settlements.reduce((sum, s) => sum + s.amount, 0);
}

/**
 * Get settlement summary text (e.g., "Kim pays Ray $1,306.55")
 */
export function getSettlementSummaryText(
  settlements: SettlementAmount[]
): string[] {
  return settlements.map(
    (s) =>
      `${s.fromName} pays ${s.toName} $${(s.amount / 100).toFixed(2)}`
  );
}

/**
 * Check if all balances are settled (everyone's net is ~0)
 */
export function isFullySettled(balances: PersonBalance[]): boolean {
  return balances.every((b) => Math.abs(b.netBalance) < 0.01);
}
