# DuoFi - Database Schema (Multi-Person Support)

## 🎯 **Design Goals**

✅ Support 2+ people per group (not just couples)  
✅ Users can be in multiple groups  
✅ Flexible expense splitting  
✅ Efficient settlement calculations  
✅ Real-time synchronization  
✅ Scalable to thousands of users

---

## 📊 **Data Model Overview**

```
Users ←→ GroupMembers ←→ Groups
                ↓
            Expenses
                ↓
          ExpenseSplits
                ↓
           Settlements
```

---

## 🗄️ **Collections**

### 1. **Users Collection** (`users`)

Stores user profile and authentication info.

```typescript
interface User {
  id: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  
  // Preferences
  preferences: {
    currency: string;            // 'USD', 'EUR', etc.
    locale: string;              // 'en-US', etc.
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      settlement: boolean;       // Notify on settlement due
      largeExpense: boolean;     // Notify on large expenses
      monthly: boolean;          // Monthly summary
    };
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

// Example:
{
  id: "user_kim_123",
  email: "kim@example.com",
  displayName: "Kim",
  photoURL: "https://...",
  preferences: {
    currency: "USD",
    locale: "en-US",
    theme: "system",
    notifications: {
      email: true,
      push: true,
      settlement: true,
      largeExpense: true,
      monthly: true
    }
  },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-11-22T10:30:00Z",
  lastLoginAt: "2025-11-22T10:30:00Z"
}
```

---

### 2. **Groups Collection** (`groups`)

Represents a shared expense group (couples, roommates, friends, etc.).

```typescript
interface Group {
  id: string;
  name: string;                  // "Kim & Ray's Home", "Roommate Expenses"
  description?: string;
  type: 'couple' | 'roommates' | 'friends' | 'family' | 'other';
  
  // Group settings
  settings: {
    currency: string;            // Default currency for group
    splitDefault: 'equal' | 'percentage' | 'custom';
    autoSettle: boolean;         // Auto-calculate settlements
    settlementDay?: number;      // Day of month (1-31) for reminders
  };
  
  // Metadata
  createdBy: string;             // User ID of creator
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Stats (denormalized for performance)
  stats: {
    memberCount: number;
    totalExpenses: number;
    currentMonthTotal: number;
  };
}

// Example:
{
  id: "group_kim_ray_home",
  name: "Kim & Ray's Home",
  description: "Shared living expenses",
  type: "couple",
  settings: {
    currency: "USD",
    splitDefault: "equal",
    autoSettle: true,
    settlementDay: 1
  },
  createdBy: "user_kim_123",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-11-22T10:30:00Z",
  stats: {
    memberCount: 2,
    totalExpenses: 3271.39,
    currentMonthTotal: 3271.39
  }
}
```

---

### 3. **GroupMembers Collection** (`groupMembers`)

Junction table for many-to-many relationship between Users and Groups.

```typescript
interface GroupMember {
  id: string;                    // Auto-generated
  groupId: string;               // Reference to Group
  userId: string;                // Reference to User
  
  // Member details
  role: 'owner' | 'admin' | 'member';
  nickname?: string;             // Display name in this group
  color?: string;                // Color for charts/UI
  
  // Status
  status: 'active' | 'invited' | 'left';
  invitedBy?: string;            // User ID who invited
  invitedAt?: Timestamp;
  joinedAt?: Timestamp;
  leftAt?: Timestamp;
  
  // Settings
  notifications: boolean;        // Receive notifications for this group
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Composite index: groupId + userId (unique)
// Index: userId (to find all groups for a user)

// Example:
{
  id: "member_kim_in_home",
  groupId: "group_kim_ray_home",
  userId: "user_kim_123",
  role: "owner",
  nickname: "Kim",
  color: "#14B8A6",
  status: "active",
  joinedAt: "2025-01-01T00:00:00Z",
  notifications: true,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

---

### 4. **Expenses Collection** (`expenses`)

Stores all expenses (both shared and personal).

```typescript
interface Expense {
  id: string;
  
  // Classification
  type: 'shared' | 'personal';
  groupId?: string;              // Required if type = 'shared'
  userId: string;                // Owner/creator of expense
  
  // Basic info
  description: string;
  amount: number;                // Total amount in cents (avoid decimals)
  currency: string;              // 'USD', 'EUR', etc.
  category: string;              // 'rent', 'utilities', 'groceries', etc.
  date: Timestamp;               // Date of expense
  
  // Payment info
  paidBy: string;                // User ID who paid
  paidAt?: Timestamp;            // When it was paid
  
  // Split info (for shared expenses)
  splitType?: 'equal' | 'percentage' | 'custom' | 'amount';
  splitData?: {
    [userId: string]: number;   // Amount or percentage per user
  };
  
  // Additional data
  notes?: string;
  receiptURL?: string;
  location?: string;
  tags?: string[];
  
  // Recurring
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;            // Every X days/weeks/months
    startDate: Timestamp;
    endDate?: Timestamp;
    nextDate?: Timestamp;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // User ID who created
}

// Indexes:
// - groupId + date (for group expense queries)
// - userId + date (for personal expense queries)
// - paidBy + date (for "I paid" queries)
// - category (for analytics)

// Example - Shared Expense:
{
  id: "expense_rent_nov_2025",
  type: "shared",
  groupId: "group_kim_ray_home",
  userId: "user_kim_123",
  description: "November Rent",
  amount: 287974,                // $2,879.74 in cents
  currency: "USD",
  category: "rent",
  date: "2025-11-01T00:00:00Z",
  paidBy: "user_kim_123",
  paidAt: "2025-11-01T10:00:00Z",
  splitType: "custom",
  splitData: {
    "user_kim_123": 149820,      // $1,498.20 in cents
    "user_ray_456": 138155       // $1,381.55 in cents
  },
  notes: "Monthly rent payment",
  isRecurring: true,
  recurringConfig: {
    frequency: "monthly",
    interval: 1,
    startDate: "2025-01-01T00:00:00Z",
    nextDate: "2025-12-01T00:00:00Z"
  },
  createdAt: "2025-11-01T10:00:00Z",
  updatedAt: "2025-11-01T10:00:00Z",
  createdBy: "user_kim_123"
}

// Example - Personal Expense:
{
  id: "expense_coffee_nov_22",
  type: "personal",
  userId: "user_kim_123",
  description: "Morning coffee",
  amount: 550,                   // $5.50 in cents
  currency: "USD",
  category: "food",
  date: "2025-11-22T08:30:00Z",
  paidBy: "user_kim_123",
  notes: "Starbucks",
  isRecurring: false,
  createdAt: "2025-11-22T08:35:00Z",
  updatedAt: "2025-11-22T08:35:00Z",
  createdBy: "user_kim_123"
}
```

---

### 5. **ExpenseSplits Collection** (`expenseSplits`)

Denormalized splits for faster queries (optional, for optimization).

```typescript
interface ExpenseSplit {
  id: string;
  expenseId: string;             // Reference to Expense
  groupId: string;               // Reference to Group
  
  // Split details
  userId: string;                // User this split belongs to
  amount: number;                // Their share in cents
  percentage?: number;           // Their percentage (if applicable)
  
  // Payment tracking
  isPaidBy: boolean;             // Did this user pay the expense?
  owes: number;                  // Amount they owe (negative if owed to them)
  
  // Metadata
  createdAt: Timestamp;
}

// Indexes:
// - expenseId (to get all splits for an expense)
// - userId + groupId (to get user's splits in a group)
// - groupId + userId (for settlement calculations)

// Example:
{
  id: "split_rent_kim",
  expenseId: "expense_rent_nov_2025",
  groupId: "group_kim_ray_home",
  userId: "user_kim_123",
  amount: 149820,                // Kim's share: $1,498.20
  percentage: 52.06,
  isPaidBy: true,                // Kim paid the full amount
  owes: -138155,                 // Kim is owed $1,381.55 (Ray's share)
  createdAt: "2025-11-01T10:00:00Z"
}
```

---

### 6. **Settlements Collection** (`settlements`)

Tracks balance settlements between users.

```typescript
interface Settlement {
  id: string;
  groupId: string;               // Reference to Group
  
  // Period
  period: string;                // 'YYYY-MM' or 'YYYY-Q1' or 'all-time'
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Payers
  fromUserId: string;            // Who owes money
  toUserId: string;              // Who is owed money
  amount: number;                // Amount in cents
  
  // Status
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: Timestamp;
  paidMethod?: 'cash' | 'venmo' | 'zelle' | 'bank_transfer' | 'paypal' | 'other';
  notes?: string;
  
  // Proof
  receiptURL?: string;
  confirmationId?: string;       // Transaction ID from payment service
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // User who created settlement
}

// Indexes:
// - groupId + period (for period settlements)
// - fromUserId (find what I owe)
// - toUserId (find what I'm owed)
// - status (find pending settlements)

// Example:
{
  id: "settlement_kim_ray_nov",
  groupId: "group_kim_ray_home",
  period: "2025-11",
  startDate: "2025-11-01T00:00:00Z",
  endDate: "2025-11-30T23:59:59Z",
  fromUserId: "user_ray_456",
  toUserId: "user_kim_123",
  amount: 130655,                // $1,306.55 in cents
  status: "pending",
  notes: "November expenses settlement",
  createdAt: "2025-11-22T10:00:00Z",
  updatedAt: "2025-11-22T10:00:00Z",
  createdBy: "user_kim_123"
}
```

---

### 7. **Categories Collection** (`categories`)

Predefined and custom categories.

```typescript
interface Category {
  id: string;
  name: string;
  icon: string;                  // Icon name or emoji
  color: string;                 // Hex color
  
  // Scope
  type: 'system' | 'group' | 'personal';
  groupId?: string;              // If type = 'group'
  userId?: string;               // If type = 'personal'
  
  // Settings
  isActive: boolean;
  budget?: number;               // Monthly budget in cents
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// System categories (predefined):
const SYSTEM_CATEGORIES = [
  { name: 'Rent', icon: '🏠', color: '#14B8A6' },
  { name: 'Utilities', icon: '💡', color: '#3B82F6' },
  { name: 'Groceries', icon: '🛒', color: '#84CC16' },
  { name: 'Restaurants', icon: '🍽️', color: '#F59E0B' },
  { name: 'Transportation', icon: '🚗', color: '#8B5CF6' },
  { name: 'Entertainment', icon: '🎬', color: '#EC4899' },
  { name: 'Healthcare', icon: '⚕️', color: '#EF4444' },
  { name: 'Shopping', icon: '🛍️', color: '#06B6D4' },
  { name: 'Other', icon: '📌', color: '#6B7280' },
];
```

---

### 8. **Invites Collection** (`invites`)

Track group invitations.

```typescript
interface Invite {
  id: string;
  groupId: string;
  
  // Invitation details
  invitedEmail: string;
  invitedBy: string;             // User ID
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  
  // Token
  token: string;                 // Unique invite token
  expiresAt: Timestamp;
  
  // Acceptance
  acceptedBy?: string;           // User ID who accepted
  acceptedAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 9. **Notifications Collection** (`notifications`)

User notifications.

```typescript
interface Notification {
  id: string;
  userId: string;
  
  // Notification details
  type: 'settlement_due' | 'expense_added' | 'payment_received' | 'invite' | 'reminder' | 'system';
  title: string;
  message: string;
  
  // Links
  actionURL?: string;
  actionText?: string;
  
  // Related entities
  relatedId?: string;            // ID of related expense, settlement, etc.
  relatedType?: 'expense' | 'settlement' | 'group' | 'invite';
  
  // Status
  isRead: boolean;
  readAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
}
```

---

## 🔐 **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isGroupMember(groupId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/groupMembers/$(request.auth.uid + '_' + groupId));
    }
    
    // Users - only owner can read/write
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // Groups - members can read, owner/admin can write
    match /groups/{groupId} {
      allow read: if isGroupMember(groupId);
      allow create: if isAuthenticated();
      allow update, delete: if isGroupMember(groupId) && 
        get(/databases/$(database)/documents/groupMembers/$(request.auth.uid + '_' + groupId)).data.role in ['owner', 'admin'];
    }
    
    // GroupMembers - members can read, owner/admin can write
    match /groupMembers/{memberId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        isGroupMember(resource.data.groupId)
      );
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        isGroupMember(resource.data.groupId)
      );
    }
    
    // Expenses - group members or owner can access
    match /expenses/{expenseId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        (resource.data.type == 'shared' && isGroupMember(resource.data.groupId))
      );
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        resource.data.createdBy == request.auth.uid ||
        (resource.data.type == 'shared' && isGroupMember(resource.data.groupId))
      );
    }
    
    // Settlements - group members can access
    match /settlements/{settlementId} {
      allow read: if isGroupMember(resource.data.groupId);
      allow create, update: if isGroupMember(resource.data.groupId);
      allow delete: if isGroupMember(resource.data.groupId) && 
        resource.data.status == 'pending';
    }
    
    // Categories - public for system, owner/group for custom
    match /categories/{categoryId} {
      allow read: if true;  // All can read
      allow write: if isAuthenticated() && (
        resource.data.type == 'personal' && resource.data.userId == request.auth.uid ||
        resource.data.type == 'group' && isGroupMember(resource.data.groupId)
      );
    }
  }
}
```

---

## 🚀 **Key Improvements Over Old Schema**

### ✅ **Multi-Person Support:**
- `Groups` replaces `Couples` - supports 2+ people
- `GroupMembers` junction table - users can be in multiple groups
- No hardcoded `partner1Id`, `partner2Id`

### ✅ **Flexible Expense Splitting:**
- Supports equal, percentage, custom, and amount splits
- Works for any number of people
- `splitData` object scales to any group size

### ✅ **Better Performance:**
- Denormalized stats for quick access
- Proper indexes for common queries
- Amount stored in cents (avoid floating-point issues)

### ✅ **Enhanced Features:**
- Recurring expenses
- Multiple groups per user
- Invitations system
- Notifications
- Custom categories per group

### ✅ **Scalability:**
- No N+1 query issues
- Efficient settlement calculations
- Real-time updates
- Handles thousands of users/groups

---

## 📊 **Example Queries**

### Get all groups for a user:
```typescript
const groups = await db
  .collection('groupMembers')
  .where('userId', '==', currentUserId)
  .where('status', '==', 'active')
  .get();
```

### Get all expenses for a group in November:
```typescript
const expenses = await db
  .collection('expenses')
  .where('groupId', '==', groupId)
  .where('date', '>=', startOfNovember)
  .where('date', '<=', endOfNovember)
  .orderBy('date', 'desc')
  .get();
```

### Calculate who owes whom:
```typescript
// Algorithm in backend/Cloud Function
// 1. Get all expenses for period
// 2. Calculate each person's total paid vs. owed
// 3. Optimize settlements (minimize transactions)
// 4. Create Settlement records
```

---

**This schema fully supports 2+ people per group! 🚀**
