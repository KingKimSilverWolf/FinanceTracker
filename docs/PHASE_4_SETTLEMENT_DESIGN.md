# Phase 4: Settlement System - Design Document

## Overview
The settlement system is the core feature that makes DuoFi valuable for expense splitting. It calculates who owes whom based on all group expenses and provides a way to track when debts are settled.

## Financial Best Practices

### 1. Precision & Accuracy
- **All amounts stored in cents** (already implemented) - avoids floating-point errors
- **Balance validation**: Sum of all balances in a group must always equal zero
- **Rounding**: Use banker's rounding (round half to even) to avoid systematic bias
- **Audit trail**: Never delete settlements, only mark as void/cancelled
- **Immutability**: Once an expense is used in a settlement calculation, changing it should create a new version

### 2. Debt Simplification
- **Minimize transactions**: Use algorithm to reduce number of payments needed
- **Example**: If A owes B $10, B owes C $10, simplify to: A pays C $10 (1 transaction instead of 2)
- **Algorithm**: Greedy approach - match largest debtor with largest creditor repeatedly

### 3. Settlement States
```
PENDING → COMPLETED → [DISPUTED] → RESOLVED
         ↓
      CANCELLED
```

### 4. Data Integrity
- **Atomicity**: Settlement creation and balance updates must be atomic
- **Validation**: Prevent settling more than owed amount
- **Access Control**: Only involved parties can mark settlement as complete
- **Double-entry**: Every debit has a corresponding credit

## Data Models

### Balance (Calculated, not stored)
```typescript
interface Balance {
  userId: string;
  userName: string;
  userPhoto: string | null;
  netBalance: number; // in cents, positive = owed to them, negative = they owe
  owedTo: BalanceDetail[]; // who owes this user
  owes: BalanceDetail[]; // who this user owes
}

interface BalanceDetail {
  userId: string;
  userName: string;
  userPhoto: string | null;
  amount: number; // in cents, always positive
}
```

### SimplifiedTransaction (Calculated)
```typescript
interface SimplifiedTransaction {
  id: string; // generated client-side for UI keys
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto: string | null;
  toUserId: string;
  toUserName: string;
  toUserPhoto: string | null;
  amount: number; // in cents
  status: 'pending' | 'completed'; // derived from settlement existence
  settlementId?: string; // if completed
}
```

### Settlement (Firestore document)
```typescript
interface Settlement {
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
  
  // For verification (optional feature)
  confirmedBy?: {
    fromUser: boolean;
    toUser: boolean;
  };
}
```

### GroupBalanceSnapshot (Optional - for history)
```typescript
interface GroupBalanceSnapshot {
  id: string;
  groupId: string;
  calculatedAt: Date;
  balances: Balance[];
  simplifiedTransactions: SimplifiedTransaction[];
  totalExpenses: number; // sum of all expenses
  expenseCount: number;
}
```

## Firestore Schema

```
settlements/
├── {settlementId}
│   ├── id: string
│   ├── groupId: string
│   ├── fromUserId: string
│   ├── toUserId: string
│   ├── amount: number
│   ├── status: 'pending' | 'completed' | 'cancelled'
│   ├── createdAt: timestamp
│   ├── createdBy: string
│   ├── completedAt?: timestamp
│   ├── completedBy?: string
│   ├── cancelledAt?: timestamp
│   ├── cancelledBy?: string
│   ├── notes?: string
│   ├── relatedExpenseIds: string[]
│   ├── calculatedAt: timestamp
│   └── confirmedBy?: { fromUser: boolean, toUser: boolean }

// Indexes needed:
// - groupId (for querying group settlements)
// - fromUserId (for user's outgoing settlements)
// - toUserId (for user's incoming settlements)
// - status (for filtering)
// - createdAt (for sorting)
```

## Core Algorithms

### 1. Balance Calculation

```typescript
function calculateGroupBalances(
  expenses: Expense[],
  groupMembers: GroupMember[]
): Balance[] {
  // Step 1: Initialize balance map
  const balanceMap = new Map<string, number>();
  groupMembers.forEach(member => {
    balanceMap.set(member.userId, 0);
  });

  // Step 2: Process each expense
  for (const expense of expenses) {
    if (expense.type !== 'shared' || !expense.splitData || !expense.paidBy) {
      continue; // Skip personal or invalid expenses
    }

    // Payer gets credited the full amount
    balanceMap.set(
      expense.paidBy,
      balanceMap.get(expense.paidBy)! + expense.amount
    );

    // Each participant (including payer) gets debited their share
    for (const [userId, shareAmount] of Object.entries(expense.splitData)) {
      balanceMap.set(
        userId,
        balanceMap.get(userId)! - shareAmount
      );
    }
  }

  // Step 3: Validate (sum should be 0 or very close due to rounding)
  const sum = Array.from(balanceMap.values()).reduce((a, b) => a + b, 0);
  if (Math.abs(sum) > groupMembers.length) { // Allow 1 cent error per member
    console.warn('Balance validation failed:', sum);
    // In production, log this as an error for investigation
  }

  // Step 4: Convert to Balance objects with details
  const balances: Balance[] = [];
  
  for (const [userId, netBalance] of balanceMap.entries()) {
    const member = groupMembers.find(m => m.userId === userId)!;
    
    const owedTo: BalanceDetail[] = [];
    const owes: BalanceDetail[] = [];
    
    // For each other member, calculate pairwise balance
    for (const [otherUserId, otherBalance] of balanceMap.entries()) {
      if (otherUserId === userId) continue;
      
      // Calculate what this user owes to other user specifically
      let pairwiseBalance = 0;
      
      for (const expense of expenses) {
        if (expense.type !== 'shared' || !expense.splitData || !expense.paidBy) {
          continue;
        }
        
        // If other user paid and this user participated
        if (expense.paidBy === otherUserId && expense.splitData[userId]) {
          pairwiseBalance -= expense.splitData[userId];
        }
        
        // If this user paid and other user participated
        if (expense.paidBy === userId && expense.splitData[otherUserId]) {
          pairwiseBalance += expense.splitData[otherUserId];
        }
      }
      
      if (pairwiseBalance > 0) {
        // Other user owes this user
        const otherMember = groupMembers.find(m => m.userId === otherUserId)!;
        owedTo.push({
          userId: otherUserId,
          userName: otherMember.displayName,
          userPhoto: otherMember.photoURL,
          amount: pairwiseBalance,
        });
      } else if (pairwiseBalance < 0) {
        // This user owes other user
        const otherMember = groupMembers.find(m => m.userId === otherUserId)!;
        owes.push({
          userId: otherUserId,
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
```

### 2. Debt Simplification (Minimize Transactions)

```typescript
function simplifyDebts(balances: Balance[]): SimplifiedTransaction[] {
  // Create mutable copies for algorithm
  const creditors = balances
    .filter(b => b.netBalance > 0)
    .map(b => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining); // Largest first

  const debtors = balances
    .filter(b => b.netBalance < 0)
    .map(b => ({ ...b, remaining: -b.netBalance }))
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
        id: `${debtor.userId}-${creditor.userId}-${Date.now()}`,
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
    if (creditor.remaining === 0) i++;
    if (debtor.remaining === 0) j++;
  }

  return transactions;
}
```

### 3. Settlement Status Tracking

```typescript
function mergeSettlementsWithTransactions(
  simplifiedTransactions: SimplifiedTransaction[],
  settlements: Settlement[]
): SimplifiedTransaction[] {
  // Create a map of active (completed) settlements
  const settlementMap = new Map<string, Settlement>();
  
  settlements
    .filter(s => s.status === 'completed')
    .forEach(s => {
      const key = `${s.fromUserId}-${s.toUserId}`;
      settlementMap.set(key, s);
    });

  // Update transaction status based on settlements
  return simplifiedTransactions.map(tx => {
    const key = `${tx.fromUserId}-${tx.toUserId}`;
    const settlement = settlementMap.get(key);
    
    if (settlement) {
      return {
        ...tx,
        status: 'completed',
        settlementId: settlement.id,
      };
    }
    
    return tx;
  });
}
```

## API Functions (lib/firebase/settlements.ts)

```typescript
// Calculate current balances for a group
export async function calculateGroupBalances(groupId: string): Promise<Balance[]>

// Get simplified transactions (minimal payments needed)
export async function getSimplifiedTransactions(groupId: string): Promise<SimplifiedTransaction[]>

// Create a settlement record
export async function createSettlement(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
  relatedExpenseIds: string[],
  notes?: string
): Promise<string>

// Mark settlement as completed
export async function completeSettlement(
  settlementId: string,
  userId: string
): Promise<void>

// Cancel a settlement
export async function cancelSettlement(
  settlementId: string,
  userId: string,
  reason?: string
): Promise<void>

// Get all settlements for a group
export async function getGroupSettlements(
  groupId: string,
  status?: 'pending' | 'completed' | 'cancelled'
): Promise<Settlement[]>

// Get user's settlements (what they owe or are owed)
export async function getUserSettlements(
  userId: string,
  status?: 'pending' | 'completed'
): Promise<Settlement[]>

// Verify if user can mark settlement as complete
export function canCompleteSettlement(
  settlement: Settlement,
  userId: string
): boolean

// Get settlement history for audit
export async function getSettlementHistory(
  groupId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Settlement[]>
```

## UI Components

### 1. GroupBalanceDashboard
**Location:** `components/settlements/group-balance-dashboard.tsx`

Shows:
- Net balance for current user (you are owed / you owe)
- List of simplified transactions with:
  - "You pay [Name] $X" or "[Name] pays you $X"
  - Status (pending/completed)
  - Mark as settled button
- Total group expenses and expense count
- Link to settlement history

### 2. SimplifiedTransactionCard
**Location:** `components/settlements/simplified-transaction-card.tsx`

Shows:
- Avatar of other person
- Direction indicator (arrow icon)
- Amount with color coding:
  - Green: you are owed
  - Red: you owe
- Status badge
- Action button:
  - "Mark as Settled" (if pending and you're involved)
  - "View Settlement" (if completed)

### 3. SettlementDialog
**Location:** `components/settlements/settlement-dialog.tsx`

For marking a transaction as settled:
- Transaction details (from, to, amount)
- Optional notes field
- Confirmation checkbox: "I confirm this payment was made"
- Submit button
- Warning about permanent record

### 4. SettlementHistoryList
**Location:** `components/settlements/settlement-history-list.tsx`

Shows:
- All settlements for group (completed and cancelled)
- Grouped by date
- Each settlement shows:
  - From → To
  - Amount
  - Status badge
  - Date completed/cancelled
  - Notes if any

## Validation Rules

### 1. Settlement Creation
```typescript
// Cannot create settlement for zero or negative amount
if (amount <= 0) throw new Error('Amount must be positive');

// Cannot create settlement with yourself
if (fromUserId === toUserId) throw new Error('Cannot settle with yourself');

// Both users must be group members
const group = await getGroup(groupId);
const memberIds = group.members.map(m => m.userId);
if (!memberIds.includes(fromUserId) || !memberIds.includes(toUserId)) {
  throw new Error('Both users must be group members');
}

// Amount should not exceed calculated owed amount (allow small buffer for timing)
const balances = await calculateGroupBalances(groupId);
const fromUserBalance = balances.find(b => b.userId === fromUserId);
const owedAmount = fromUserBalance?.owes.find(o => o.userId === toUserId)?.amount || 0;

if (amount > owedAmount * 1.1) { // 10% buffer
  throw new Error('Settlement amount exceeds calculated debt');
}
```

### 2. Settlement Completion
```typescript
// Only involved parties can complete
if (userId !== settlement.fromUserId && userId !== settlement.toUserId) {
  throw new Error('Only involved parties can complete settlement');
}

// Cannot complete if already completed or cancelled
if (settlement.status !== 'pending') {
  throw new Error('Settlement is not pending');
}

// Record who completed it for audit
settlement.completedBy = userId;
settlement.completedAt = new Date();
settlement.status = 'completed';
```

## Edge Cases to Handle

### 1. Concurrent Expense Creation
- User A and User B both add expenses at same time
- Balance calculation sees different states
- **Solution**: Calculate balances from scratch each time, don't cache

### 2. Floating Point Precision
- Split $10 three ways = $3.33, $3.33, $3.34
- Total = $9.99 (off by 1 cent)
- **Solution**: Always work in cents, validate sum ≈ 0 (within tolerance)

### 3. Partial Settlements
- User owes $100, pays $50
- **Solution**: Create two settlements (not in MVP, document for future)

### 4. Expense Deletion After Settlement
- Settlement created, then expense deleted
- Balance recalculation shows different amount
- **Solution**: Keep relatedExpenseIds for audit, show warning if mismatch

### 5. User Leaves Group
- User has unsettled debts
- **Solution**: Prevent leaving if unsettled debts exist

### 6. Circular Debts
- A owes B $10, B owes C $10, C owes A $10
- **Solution**: Debt simplification should eliminate all transactions (net zero)

## Testing Strategy

### Unit Tests
1. Balance calculation with various expense combinations
2. Debt simplification algorithm correctness
3. Validation rules (all error cases)
4. Rounding and precision handling

### Integration Tests
1. Create expense → calculate balance → create settlement → complete settlement → verify final state
2. Multiple users, multiple expenses, verify balances sum to zero
3. Concurrent operations (multiple settlements at once)

### Manual Test Cases
1. **Simple 2-person**: A pays $100, split equally → A should be owed $50 from B
2. **3-person equal**: A pays $90 for A, B, C → B owes $30, C owes $30
3. **Complex splits**: Mix of equal and custom splits
4. **Debt chain**: A→B→C→D chain should simplify to A→D
5. **Full circle**: A→B→C→A should result in 0 transactions

## Security Considerations

### 1. Access Control
- Users can only view settlements for groups they're in
- Users can only complete settlements they're involved in
- Firestore rules must enforce these constraints

### 2. Data Validation
- Server-side validation of all amounts (positive, reasonable range)
- Verify group membership before any operation
- Prevent tampering with relatedExpenseIds

### 3. Audit Trail
- Never delete settlements (mark as cancelled instead)
- Track who created, completed, cancelled
- Timestamp all state changes
- Keep relatedExpenseIds for investigation

## Firestore Security Rules

```javascript
match /settlements/{settlementId} {
  // Allow read if user is in the group
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/groups/$(resource.data.groupId)/members/$(request.auth.uid));
  
  // Allow create if user is from or to user and is group member
  allow create: if request.auth != null &&
    (request.resource.data.fromUserId == request.auth.uid || 
     request.resource.data.toUserId == request.auth.uid) &&
    exists(/databases/$(database)/documents/groups/$(request.resource.data.groupId)/members/$(request.auth.uid)) &&
    request.resource.data.amount > 0 &&
    request.resource.data.status == 'pending' &&
    request.resource.data.createdBy == request.auth.uid;
  
  // Allow update only for status change to completed/cancelled by involved parties
  allow update: if request.auth != null &&
    (resource.data.fromUserId == request.auth.uid || 
     resource.data.toUserId == request.auth.uid) &&
    (request.resource.data.status == 'completed' || 
     request.resource.data.status == 'cancelled') &&
    resource.data.status == 'pending';
}
```

## Implementation Phases

### Phase 4.1 (Current - First Part)
- ✅ Design document (this file)
- 🔄 Implement balance calculation algorithm
- 🔄 Implement debt simplification algorithm
- 🔄 Create settlements.ts with core functions
- 🔄 Add Firestore settlements collection
- 🔄 Unit tests for calculations

### Phase 4.2 (Second Part)
- Build GroupBalanceDashboard component
- Build SimplifiedTransactionCard component
- Build SettlementDialog component
- Integrate into group detail page
- Add settlement tab/section

### Phase 4.3 (Polish)
- Settlement history view
- Notifications for settlements
- Dispute resolution flow (optional)
- Export settlement reports
- Analytics for settlements

## Success Criteria

✅ **Correct Calculations**: Balances always sum to zero (within 1 cent per member tolerance)
✅ **Minimal Transactions**: Debt simplification reduces transaction count effectively
✅ **Data Integrity**: All settlements have audit trail, no data loss
✅ **User Experience**: Clear indication of who owes what, easy to mark as settled
✅ **Performance**: Balance calculation < 1s for 100 expenses
✅ **Security**: Only authorized users can access/modify settlements

## References

- [Splitwise Algorithm](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688)
- [Debt Simplification Graph Theory](https://www.geeksforgeeks.org/minimize-cash-flow-among-given-set-friends-borrowed-money/)
- [Financial Precision Best Practices](https://stackoverflow.com/questions/3730019/why-not-use-double-or-float-to-represent-currency)
