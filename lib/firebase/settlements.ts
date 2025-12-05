import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getGroup } from './groups';
import { getGroupExpenses } from './expenses';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Details of a balance between two users
 */
export interface BalanceDetail {
  userId: string;
  userName: string;
  userPhoto: string | null;
  amount: number; // in cents, always positive
}

/**
 * Complete balance information for a user in a group
 */
export interface Balance {
  userId: string;
  userName: string;
  userPhoto: string | null;
  netBalance: number; // in cents, positive = owed to them, negative = they owe
  owedTo: BalanceDetail[]; // who owes this user
  owes: BalanceDetail[]; // who this user owes
}

/**
 * A simplified transaction after debt minimization
 */
export interface SimplifiedTransaction {
  id: string; // generated client-side for UI keys
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto: string | null;
  toUserId: string;
  toUserName: string;
  toUserPhoto: string | null;
  amount: number; // in cents
  status: 'pending' | 'completed';
  settlementId?: string; // if completed
}

/**
 * A settlement record in Firestore
 */
export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string; // person who pays
  toUserId: string; // person who receives
  amount: number; // in cents
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  createdBy: string; // userId who created settlement record
  completedAt?: Date;
  completedBy?: string; // userId who marked as complete
  cancelledAt?: Date;
  cancelledBy?: string;
  notes?: string;

  // For audit trail
  relatedExpenseIds: string[]; // expenses considered in this settlement
  calculatedAt: Date; // when balance was calculated
}

// ============================================================================
// Balance Calculation Algorithm
// ============================================================================

/**
 * Calculate balances for all members of a group based on expenses
 * 
 * Algorithm:
 * 1. Initialize balance map with 0 for each member
 * 2. For each expense:
 *    - Credit the payer with full amount
 *    - Debit each participant (including payer) with their share
 * 3. Calculate pairwise balances for detailed breakdown
 * 4. Validate that sum of all balances equals 0 (within tolerance)
 * 
 * Financial Best Practice: All calculations in cents to avoid floating-point errors
 */
export async function calculateGroupBalances(groupId: string): Promise<Balance[]> {
  // Fetch group and expenses
  const group = await getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  
  const expenses = await getGroupExpenses(groupId);

  // Step 1: Initialize balance map
  const balanceMap = new Map<string, number>();
  group.members.forEach((member) => {
    balanceMap.set(member.userId, 0);
  });

  // Step 2: Process each expense
  for (const expense of expenses) {
    if (expense.type !== 'shared' || !expense.splitData || !expense.paidBy) {
      continue; // Skip personal or invalid expenses
    }

    // Payer gets credited the full amount
    const payerBalance = balanceMap.get(expense.paidBy) || 0;
    balanceMap.set(expense.paidBy, payerBalance + expense.amount);

    // Each participant (including payer) gets debited their share
    for (const [userId, shareAmount] of Object.entries(expense.splitData)) {
      const userBalance = balanceMap.get(userId) || 0;
      balanceMap.set(userId, userBalance - shareAmount);
    }
  }

  // Step 3: Validate balance integrity
  // Sum of all balances should be 0 (or very close due to rounding)
  const sum = Array.from(balanceMap.values()).reduce((a, b) => a + b, 0);
  const tolerance = group.members.length; // Allow 1 cent error per member
  
  if (Math.abs(sum) > tolerance) {
    console.error('Balance validation failed:', {
      groupId,
      sum,
      tolerance,
      balances: Array.from(balanceMap.entries()),
    });
    // In production, this should trigger an alert for investigation
    // For now, we'll continue but log the error
  }

  // Step 4: Build Balance objects with pairwise details
  const balances: Balance[] = [];

  for (const [userId, netBalance] of balanceMap.entries()) {
    const member = group.members.find((m) => m.userId === userId);
    if (!member) continue; // Should never happen

    const owedTo: BalanceDetail[] = [];
    const owes: BalanceDetail[] = [];

    // Calculate pairwise balances
    for (const otherMember of group.members) {
      if (otherMember.userId === userId) continue;

      // Calculate what this user owes to other user specifically
      let pairwiseBalance = 0;

      for (const expense of expenses) {
        if (expense.type !== 'shared' || !expense.splitData || !expense.paidBy) {
          continue;
        }

        // If other user paid and this user participated
        if (expense.paidBy === otherMember.userId && expense.splitData[userId]) {
          pairwiseBalance -= expense.splitData[userId];
        }

        // If this user paid and other user participated
        if (expense.paidBy === userId && expense.splitData[otherMember.userId]) {
          pairwiseBalance += expense.splitData[otherMember.userId];
        }
      }

      if (pairwiseBalance > 0) {
        // Other user owes this user
        owedTo.push({
          userId: otherMember.userId,
          userName: otherMember.displayName,
          userPhoto: otherMember.photoURL,
          amount: pairwiseBalance,
        });
      } else if (pairwiseBalance < 0) {
        // This user owes other user
        owes.push({
          userId: otherMember.userId,
          userName: otherMember.displayName,
          userPhoto: otherMember.photoURL,
          amount: -pairwiseBalance,
        });
      }
    }

    balances.push({
      userId,
      userName: member.displayName,
      userPhoto: member.photoURL,
      netBalance,
      owedTo,
      owes,
    });
  }

  return balances;
}

// ============================================================================
// Debt Simplification Algorithm
// ============================================================================

/**
 * Simplify debts to minimize number of transactions
 * 
 * Algorithm: Greedy approach
 * 1. Separate creditors (positive balance) and debtors (negative balance)
 * 2. Sort both by amount (largest first)
 * 3. Match largest debtor with largest creditor repeatedly
 * 4. Settle minimum of what's owed/due
 * 5. Move to next when current is settled
 * 
 * Example:
 * Before: A owes B $10, B owes C $10
 * After: A owes C $10 (1 transaction instead of 2)
 * 
 * Time Complexity: O(n log n) for sorting, O(n) for matching = O(n log n)
 * Space Complexity: O(n)
 */
export function simplifyDebts(balances: Balance[]): SimplifiedTransaction[] {
  // Create mutable copies for algorithm
  const creditors = balances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining); // Largest first

  const debtors = balances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ ...b, remaining: -b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining); // Largest debt first

  const transactions: SimplifiedTransaction[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // Settle the minimum of what's owed and what's due
    const settleAmount = Math.min(creditor.remaining, debtor.remaining);

    if (settleAmount > 0) {
      transactions.push({
        id: `${debtor.userId}-${creditor.userId}-${Date.now()}-${Math.random()}`,
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        fromUserPhoto: debtor.userPhoto,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        toUserPhoto: creditor.userPhoto,
        amount: settleAmount,
        status: 'pending',
      });

      creditor.remaining -= settleAmount;
      debtor.remaining -= settleAmount;
    }

    // Move to next creditor or debtor if current is settled
    if (Math.abs(creditor.remaining) < 1) i++; // Allow 1 cent rounding error
    if (Math.abs(debtor.remaining) < 1) j++;
  }

  return transactions;
}

/**
 * Get simplified transactions with settlement status
 * Merges calculated transactions with actual settlement records
 */
export async function getSimplifiedTransactions(
  groupId: string
): Promise<SimplifiedTransaction[]> {
  // Calculate current balances and simplify
  const balances = await calculateGroupBalances(groupId);
  const simplifiedTransactions = simplifyDebts(balances);

  // Fetch existing settlements
  const settlements = await getGroupSettlements(groupId, 'completed');

  // Create a map of completed settlements
  const settlementMap = new Map<string, Settlement>();
  settlements.forEach((s) => {
    const key = `${s.fromUserId}-${s.toUserId}`;
    settlementMap.set(key, s);
  });

  // Update transaction status based on settlements
  return simplifiedTransactions.map((tx) => {
    const key = `${tx.fromUserId}-${tx.toUserId}`;
    const settlement = settlementMap.get(key);

    if (settlement) {
      return {
        ...tx,
        status: 'completed' as const,
        settlementId: settlement.id,
      };
    }

    return tx;
  });
}

// ============================================================================
// Settlement CRUD Operations
// ============================================================================

/**
 * Create a settlement record
 * 
 * Validation:
 * - Amount must be positive
 * - Cannot settle with yourself
 * - Both users must be group members
 * - Amount should not grossly exceed calculated debt (with 10% buffer for timing)
 */
export async function createSettlement(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
  notes?: string
): Promise<string> {
  // Validation: Amount must be positive
  if (amount <= 0) {
    throw new Error('Settlement amount must be positive');
  }

  // Validation: Cannot settle with yourself
  if (fromUserId === toUserId) {
    throw new Error('Cannot create settlement with yourself');
  }

  // Validation: Both users must be group members
  const group = await getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  
  const memberIds = group.members.map((m) => m.userId);
  
  if (!memberIds.includes(fromUserId)) {
    throw new Error('Payer must be a group member');
  }
  
  if (!memberIds.includes(toUserId)) {
    throw new Error('Recipient must be a group member');
  }

  // Validation: Amount should not grossly exceed calculated debt
  // (Allow 10% buffer to account for timing - expenses added between calculation and settlement)
  const balances = await calculateGroupBalances(groupId);
  const fromUserBalance = balances.find((b) => b.userId === fromUserId);
  const owedAmount = fromUserBalance?.owes.find((o) => o.userId === toUserId)?.amount || 0;

  if (amount > owedAmount * 1.1 && owedAmount > 0) {
    throw new Error(
      `Settlement amount ($${(amount / 100).toFixed(2)}) exceeds calculated debt ($${(owedAmount / 100).toFixed(2)})`
    );
  }

  // Get all expense IDs for audit trail
  const expenses = await getGroupExpenses(groupId);
  const relatedExpenseIds = expenses.map((e) => e.id);

  // Create settlement document
  const settlementData = {
    groupId,
    fromUserId,
    toUserId,
    amount,
    status: 'pending' as const,
    createdAt: new Date(),
    createdBy: fromUserId, // Assume fromUser creates the settlement
    notes: notes || '',
    relatedExpenseIds,
    calculatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'settlements'), settlementData);
  
  return docRef.id;
}

/**
 * Mark a settlement as paid
 * Creates an offsetting expense to record the payment
 * Sends notifications to both parties
 * Only involved parties can mark as paid
 */
export async function markSettlementAsPaid(
  settlementId: string,
  userId: string,
  paymentMethod: string = 'Other',
  notes?: string
): Promise<string> {
  const settlementRef = doc(db, 'settlements', settlementId);
  const settlementDoc = await getDoc(settlementRef);

  if (!settlementDoc.exists()) {
    throw new Error('Settlement not found');
  }

  const settlement = settlementDoc.data() as Omit<Settlement, 'id'>;

  // Validation: Only involved parties can mark as paid
  if (userId !== settlement.fromUserId && userId !== settlement.toUserId) {
    throw new Error('Only involved parties can mark settlement as paid');
  }

  // Validation: Cannot mark as paid if not pending
  if (settlement.status !== 'pending') {
    throw new Error(`Settlement is ${settlement.status}, cannot mark as paid`);
  }

  // Get group for member info
  const group = await getGroup(settlement.groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Find member names for description
  const fromMember = group.members.find(m => m.userId === settlement.fromUserId);
  const toMember = group.members.find(m => m.userId === settlement.toUserId);
  
  if (!fromMember || !toMember) {
    throw new Error('Settlement members not found in group');
  }

  // Create offsetting expense to record the payment
  const { createExpense } = await import('./expenses');
  
  const expenseDescription = `Settlement payment: ${fromMember.name} → ${toMember.name}`;
  const expenseNotes = notes || `Payment recorded for settlement. Original amount: $${(settlement.amount / 100).toFixed(2)}`;

  // Create a shared expense that offsets the settlement
  // The payer (fromUser) pays the full amount
  // Only the receiver (toUser) is in the split
  const splitData: { [key: string]: number } = {
    [settlement.toUserId]: settlement.amount,
  };

  const expenseId = await createExpense({
    type: 'shared',
    userId: settlement.fromUserId,
    amount: settlement.amount,
    description: expenseDescription,
    category: 'OTHER',
    date: new Date(),
    notes: expenseNotes,
    paymentMethod,
    groupId: settlement.groupId,
    paidBy: settlement.fromUserId,
    splitMethod: 'custom',
    splitData,
    participants: [settlement.fromUserId, settlement.toUserId],
  });

  // Update settlement status
  await updateDoc(settlementRef, {
    status: 'completed',
    completedAt: new Date(),
    completedBy: userId,
    notes: notes || settlement.notes,
  });

  // Send notifications to both parties
  Promise.all([
    import('@/lib/notifications/notification-service').then(({ createNotification }) => {
      return Promise.all([
        // Notify the payer
        createNotification({
          userId: settlement.fromUserId,
          type: 'settlement_paid',
          title: 'Settlement Marked as Paid',
          message: `Your payment of $${(settlement.amount / 100).toFixed(2)} to ${toMember.name} has been recorded.`,
          link: `/dashboard/expenses/${expenseId}`,
          relatedId: settlementId,
        }),
        // Notify the receiver
        createNotification({
          userId: settlement.toUserId,
          type: 'settlement_paid',
          title: 'Payment Received',
          message: `${fromMember.name} marked the settlement of $${(settlement.amount / 100).toFixed(2)} as paid.`,
          link: `/dashboard/expenses/${expenseId}`,
          relatedId: settlementId,
        }),
      ]);
    })
  ]).catch(error => {
    console.error('Error sending settlement notifications:', error);
    // Don't throw - settlement was completed successfully
  });

  return expenseId;
}

/**
 * Mark settlement as completed (legacy method - use markSettlementAsPaid instead)
 * Only involved parties (from or to user) can complete
 */
export async function completeSettlement(
  settlementId: string,
  userId: string
): Promise<void> {
  const settlementRef = doc(db, 'settlements', settlementId);
  const settlementDoc = await getDoc(settlementRef);

  if (!settlementDoc.exists()) {
    throw new Error('Settlement not found');
  }

  const settlement = settlementDoc.data() as Omit<Settlement, 'id'>;

  // Validation: Only involved parties can complete
  if (userId !== settlement.fromUserId && userId !== settlement.toUserId) {
    throw new Error('Only involved parties can mark settlement as complete');
  }

  // Validation: Cannot complete if not pending
  if (settlement.status !== 'pending') {
    throw new Error(`Settlement is ${settlement.status}, cannot complete`);
  }

  // Update settlement
  await updateDoc(settlementRef, {
    status: 'completed',
    completedAt: new Date(),
    completedBy: userId,
  });
}

/**
 * Cancel a settlement
 * Only involved parties can cancel
 */
export async function cancelSettlement(
  settlementId: string,
  userId: string,
  reason?: string
): Promise<void> {
  const settlementRef = doc(db, 'settlements', settlementId);
  const settlementDoc = await getDoc(settlementRef);

  if (!settlementDoc.exists()) {
    throw new Error('Settlement not found');
  }

  const settlement = settlementDoc.data() as Omit<Settlement, 'id'>;

  // Validation: Only involved parties can cancel
  if (userId !== settlement.fromUserId && userId !== settlement.toUserId) {
    throw new Error('Only involved parties can cancel settlement');
  }

  // Validation: Cannot cancel if not pending
  if (settlement.status !== 'pending') {
    throw new Error(`Settlement is ${settlement.status}, cannot cancel`);
  }

  // Update settlement
  await updateDoc(settlementRef, {
    status: 'cancelled',
    cancelledAt: new Date(),
    cancelledBy: userId,
    notes: reason ? `${settlement.notes ? settlement.notes + ' | ' : ''}Cancelled: ${reason}` : settlement.notes,
  });
}

/**
 * Get all settlements for a group
 */
export async function getGroupSettlements(
  groupId: string,
  status?: 'pending' | 'completed' | 'cancelled'
): Promise<Settlement[]> {
  const settlementsRef = collection(db, 'settlements');
  
  let q = query(
    settlementsRef,
    where('groupId', '==', groupId),
    orderBy('createdAt', 'desc')
  );

  if (status) {
    q = query(
      settlementsRef,
      where('groupId', '==', groupId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt,
      cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : data.cancelledAt,
      calculatedAt: data.calculatedAt instanceof Timestamp ? data.calculatedAt.toDate() : data.calculatedAt,
    } as Settlement;
  });
}

/**
 * Get user's settlements (across all groups)
 */
export async function getUserSettlements(
  userId: string,
  status?: 'pending' | 'completed' | 'cancelled'
): Promise<Settlement[]> {
  const settlementsRef = collection(db, 'settlements');

  // Query for settlements where user is fromUser
  let fromQuery = query(
    settlementsRef,
    where('fromUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  // Query for settlements where user is toUser
  let toQuery = query(
    settlementsRef,
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  if (status) {
    fromQuery = query(
      settlementsRef,
      where('fromUserId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    toQuery = query(
      settlementsRef,
      where('toUserId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }

  const [fromSnapshot, toSnapshot] = await Promise.all([
    getDocs(fromQuery),
    getDocs(toQuery),
  ]);

  const settlements = [
    ...fromSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt,
        cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : data.cancelledAt,
        calculatedAt: data.calculatedAt instanceof Timestamp ? data.calculatedAt.toDate() : data.calculatedAt,
      } as Settlement;
    }),
    ...toSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt,
        cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : data.cancelledAt,
        calculatedAt: data.calculatedAt instanceof Timestamp ? data.calculatedAt.toDate() : data.calculatedAt,
      } as Settlement;
    }),
  ];

  // Remove duplicates and sort by date
  const uniqueSettlements = Array.from(
    new Map(settlements.map((s) => [s.id, s])).values()
  );

  return uniqueSettlements.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

/**
 * Check if user can complete a settlement
 */
export function canCompleteSettlement(
  settlement: Settlement,
  userId: string
): boolean {
  return (
    settlement.status === 'pending' &&
    (settlement.fromUserId === userId || settlement.toUserId === userId)
  );
}

/**
 * Get settlement history for a date range (for audit/reports)
 */
export async function getSettlementHistory(
  groupId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Settlement[]> {
  const settlementsRef = collection(db, 'settlements');
  
  const q = query(
    settlementsRef,
    where('groupId', '==', groupId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  
  let settlements = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt,
      cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : data.cancelledAt,
      calculatedAt: data.calculatedAt instanceof Timestamp ? data.calculatedAt.toDate() : data.calculatedAt,
    } as Settlement;
  });

  // Filter by date range if provided
  if (startDate) {
    settlements = settlements.filter((s) => s.createdAt >= startDate);
  }
  if (endDate) {
    settlements = settlements.filter((s) => s.createdAt <= endDate);
  }

  return settlements;
}
