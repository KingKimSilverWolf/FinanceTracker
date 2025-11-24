# Firestore Indexes Required

## Overview
DuoFi requires composite indexes in Firestore for efficient querying. Follow these steps to create them.

---

## Required Indexes

### 1. Expenses Collection - Index for User and Date Queries

**Collection:** `expenses`  
**Fields:**
- `userId` (Ascending)
- `date` (Descending)
- `__name__` (Descending)

**Query Scope:** Collection

**Create Index:**
Click this link or manually create in Firebase Console:
```
https://console.firebase.google.com/v1/r/project/duofi-69b36/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9kdW9maS02OWIzNi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXhwZW5zZXMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEZGF0ZRACGgwKCF9fbmFtZV9fEAI
```

**Purpose:** Enables queries that filter by userId and sort by date (most analytics queries)

---

### 2. Expenses Collection - Index for Group and Date Queries

**Collection:** `expenses`  
**Fields:**
- `groupId` (Ascending)
- `date` (Ascending)
- `__name__` (Ascending)

**Query Scope:** Collection

**Create Index:**
Click this link or manually create in Firebase Console:
```
https://console.firebase.google.com/v1/r/project/duofi-69b36/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9kdW9maS02OWIzNi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXhwZW5zZXMvaW5kZXhlcy9fEAEaCwoHZ3JvdXBJZBABGggKBGRhdGUQARoMCghfX25hbWVfXxAB
```

**Purpose:** Enables queries that filter by groupId and sort by date

---

### 3. Expenses Collection - Index for Amount and Date Queries

**Collection:** `expenses`  
**Fields:**
- `amount` (Descending)
- `date` (Descending)
- `__name__` (Descending)

**Query Scope:** Collection

**Create Index:**
Click this link or manually create in Firebase Console:
```
https://console.firebase.google.com/v1/r/project/duofi-69b36/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9kdW9maS02OWIzNi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXhwZW5zZXMvaW5kZXhlcy9fEAEaCgoGYW1vdW50EAIaCAoEZGF0ZRACGgwKCF9fbmFtZV9fEAI
```

**Purpose:** Enables queries for top expenses (sorted by amount and date)

---

## Manual Creation Steps

If the links don't work, follow these steps:

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `duofi-69b36`
3. Navigate to **Firestore Database** → **Indexes** tab

### Step 2: Create First Index (UserId + Date)
1. Click **"Create Index"**
2. Select Collection: `expenses`
3. Add fields in order:
   - Field: `userId`, Order: **Ascending**
   - Field: `date`, Order: **Descending**
4. Query scope: **Collection**
5. Click **"Create"**
6. Wait 2-5 minutes for index to build

### Step 3: Create Second Index (GroupId + Date)
1. Click **"Create Index"**
2. Select Collection: `expenses`
3. Add fields in order:
   - Field: `groupId`, Order: **Ascending**
   - Field: `date`, Order: **Ascending**
4. Query scope: **Collection**
5. Click **"Create"**
6. Wait 2-5 minutes for index to build

### Step 4: Create Third Index (Amount + Date)
1. Click **"Create Index"** again
2. Select Collection: `expenses`
3. Add fields in order:
   - Field: `amount`, Order: **Descending**
   - Field: `date`, Order: **Descending**
4. Query scope: **Collection**
5. Click **"Create"**
6. Wait 2-5 minutes for index to build

---

## Verification

After creating indexes:

1. **Check Index Status:**
   - Go to Firestore Console → Indexes tab
   - Verify both indexes show status: **"Enabled"** (green)

2. **Test in App:**
   - Refresh your analytics page
   - All Firebase errors should be resolved
   - Data should load without index errors

---

## Why These Indexes Are Needed

### Index 1: UserId + Date
Used by queries in:
- `getSpendingSummary()` - Fetches user's expenses in date range
- `getCategoryBreakdown()` - User's category analytics
- `getDailySpending()` - User's daily spending data
- Most analytics functions that query by user

**Query Pattern:**
```typescript
query(
  expensesRef,
  where('userId', '==', userId),
  where('date', '>=', startDate),
  where('date', '<=', endDate),
  orderBy('date', 'desc')
)
```

### Index 2: GroupId + Date
Used by queries in:
- `detectRecurringExpenses()` - Fetches expenses by group and date range
- Group-filtered analytics queries

**Query Pattern:**
```typescript
query(
  expensesRef,
  where('groupId', 'in', groupIds),
  where('date', '>=', startDate),
  where('date', '<=', endDate)
)
```

### Index 3: Amount + Date
Used by queries in:
- `getTopExpenses()` - Fetches highest expenses sorted by amount
- Analytics queries that need expense ranking

**Query Pattern:**
```typescript
query(
  expensesRef,
  where('date', '>=', startDate),
  where('date', '<=', endDate),
  orderBy('amount', 'desc'),
  limit(10)
)
```

---

## Troubleshooting

### Index Still Building
- **Status:** Building (yellow icon)
- **Solution:** Wait 2-5 minutes, refresh page
- **Large datasets:** May take up to 15 minutes

### Index Failed
- **Status:** Error (red icon)
- **Solution:** Delete and recreate the index
- **Check:** Ensure field names are exactly: `groupId`, `date`, `amount`

### Queries Still Failing
- **Check:** Index status is "Enabled" (not "Building")
- **Verify:** Field names in code match index definitions
- **Try:** Clear browser cache and refresh app
- **Last Resort:** Restart development server

---

## Future Index Optimization

As your app grows, consider these additional indexes:

### For User-Specific Queries
```
Collection: expenses
Fields: userId (Asc), date (Desc)
```

### For Category Analytics
```
Collection: expenses
Fields: category (Asc), date (Desc), amount (Desc)
```

### For Settlement Queries
```
Collection: expenses
Fields: status (Asc), groupId (Asc), date (Desc)
```

---

## Index Management Tips

1. **Monitor Usage:** Firebase Console shows index usage stats
2. **Remove Unused:** Delete indexes not used in queries (saves resources)
3. **Composite Over Single:** One composite index often better than multiple single indexes
4. **Test Before Production:** Create indexes in dev/staging first
5. **Document Changes:** Update this file when adding new indexes

---

## Quick Reference

| Index | Collection | Fields | Purpose |
|-------|-----------|--------|---------|
| 1 | expenses | userId ↑, date ↓ | User + date filtering |
| 2 | expenses | groupId ↑, date ↑ | Group + date filtering |
| 3 | expenses | amount ↓, date ↓ | Top expenses ranking |

**Legend:**
- ↑ = Ascending
- ↓ = Descending

---

## Estimated Build Time

- **Small dataset** (<1000 docs): 2-3 minutes
- **Medium dataset** (1000-10000 docs): 5-10 minutes
- **Large dataset** (>10000 docs): 10-15 minutes

---

## Need Help?

If you encounter issues:

1. **Check Firebase Status:** [status.firebase.google.com](https://status.firebase.google.com)
2. **Review Docs:** [Firebase Indexing Guide](https://firebase.google.com/docs/firestore/query-data/indexing)
3. **Community:** [Stack Overflow - firebase tag](https://stackoverflow.com/questions/tagged/firebase)

---

**Last Updated:** December 2024  
**Status:** Indexes pending creation  
**Action Required:** Create both indexes before using analytics features
