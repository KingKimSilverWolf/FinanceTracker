# Database Schema: Old vs New Comparison

## 🔄 **Why We Changed the Schema**

The original schema only supported **2 people (couples)**. The new schema supports **2+ people** in flexible groups.

---

## ❌ **Old Schema Problems**

### 1. **Hardcoded for 2 People:**
```typescript
// ❌ OLD: Only supports couples
interface Couple {
  id: string;
  partner1Id: string;  // 👈 Hardcoded for 2 people only
  partner2Id: string;  // 👈 Can't add a 3rd person
  createdAt: Timestamp;
}

// User could only be in ONE couple
interface User {
  coupleId?: string;  // 👈 Can't be in multiple groups
}
```

**Problems:**
- ❌ Can't add a 3rd roommate
- ❌ Can't have multiple groups (e.g., home + vacation group)
- ❌ Schema breaks if you need 4 roommates
- ❌ Not scalable

---

### 2. **Split Calculations Were Limited:**
```typescript
// ❌ OLD: Limited split options
interface Expense {
  splitType?: '50-50' | 'custom';  // 👈 Assumes 2 people
  splitDetails?: {
    [userId: string]: number;
  };
}
```

**Problems:**
- ❌ "50-50" assumes exactly 2 people
- ❌ Doesn't handle 3-way, 4-way splits easily
- ❌ Percentage splits unclear

---

### 3. **Security Rules Were Couple-Specific:**
```javascript
// ❌ OLD: References "coupleId" everywhere
match /couples/{coupleId} {
  allow read, write: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coupleId == coupleId);
}
```

**Problems:**
- ❌ Assumes user has one `coupleId`
- ❌ Can't check membership in multiple groups
- ❌ Breaks for 3+ people

---

## ✅ **New Schema Solution**

### 1. **Groups Instead of Couples:**
```typescript
// ✅ NEW: Supports any number of people
interface Group {
  id: string;
  name: string;                    // "Kim & Ray's Home", "4 Roommates"
  type: 'couple' | 'roommates' | 'friends' | 'family' | 'other';
  settings: {
    currency: string;
    splitDefault: 'equal' | 'percentage' | 'custom';
  };
  stats: {
    memberCount: number;           // 👈 Can be 2, 3, 4, 10+
  };
}
```

**Benefits:**
- ✅ Supports 2+ people
- ✅ Flexible group types
- ✅ Can have multiple groups
- ✅ Scalable

---

### 2. **Junction Table for Many-to-Many:**
```typescript
// ✅ NEW: Users can be in multiple groups
interface GroupMember {
  id: string;
  groupId: string;                 // Reference to group
  userId: string;                  // Reference to user
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'left';
}

// Query: Get all groups for Kim
const groups = await db.collection('groupMembers')
  .where('userId', '==', 'user_kim_123')
  .where('status', '==', 'active')
  .get();
// Returns: ["Kim & Ray's Home", "Vacation Trip", "Family Expenses"]
```

**Benefits:**
- ✅ Many-to-many relationship
- ✅ User can be in unlimited groups
- ✅ Proper relational design
- ✅ Easy to query

---

### 3. **Flexible Expense Splits:**
```typescript
// ✅ NEW: Works for any number of people
interface Expense {
  splitType: 'equal' | 'percentage' | 'custom' | 'amount';
  splitData?: {
    [userId: string]: number;
  };
}

// Example: 3 roommates, equal split
{
  amount: 300000,  // $3,000 rent in cents
  splitType: "equal",
  splitData: {
    "kim": 100000,   // $1,000
    "ray": 100000,   // $1,000
    "alex": 100000   // $1,000
  }
}

// Example: 2 people, custom split (60/40)
{
  amount: 100000,  // $1,000
  splitType: "custom",
  splitData: {
    "kim": 60000,    // $600 (60%)
    "ray": 40000     // $400 (40%)
  }
}

// Example: 4 roommates, one person doesn't split this expense
{
  amount: 200000,  // $2,000 utility bill
  splitType: "custom",
  splitData: {
    "kim": 50000,    // $500
    "ray": 50000,    // $500
    "alex": 100000,  // $1,000
    "jordan": 0      // $0 (doesn't pay utilities)
  }
}
```

**Benefits:**
- ✅ Scales to any group size
- ✅ Flexible split types
- ✅ Can exclude people from specific expenses
- ✅ Clear, explicit amounts

---

### 4. **Better Security Rules:**
```javascript
// ✅ NEW: Check membership via junction table
function isGroupMember(groupId) {
  return exists(/databases/$(database)/documents/groupMembers/$(request.auth.uid + '_' + groupId));
}

match /groups/{groupId} {
  allow read: if isGroupMember(groupId);
  allow write: if isGroupMember(groupId) && 
    get(/databases/$(database)/documents/groupMembers/$(request.auth.uid + '_' + groupId)).data.role in ['owner', 'admin'];
}
```

**Benefits:**
- ✅ Works for any group size
- ✅ Proper membership checking
- ✅ Role-based permissions
- ✅ Secure & scalable

---

## 📊 **Side-by-Side Comparison**

| Feature | ❌ Old Schema | ✅ New Schema |
|---------|--------------|--------------|
| **Max People per Group** | 2 (hardcoded) | Unlimited |
| **Groups per User** | 1 | Unlimited |
| **Group Types** | Couples only | Couples, roommates, friends, family |
| **Split Types** | 50-50, custom | Equal, percentage, custom, amount |
| **Membership Model** | Direct reference | Junction table (proper) |
| **Scalability** | Limited | Excellent |
| **Security Rules** | Couple-specific | Group-agnostic |
| **Performance** | Good | Better (denormalized stats) |
| **Future-Proof** | No | Yes |

---

## 🎯 **Use Case Examples**

### Example 1: Couple (Kim & Ray) ✅
```typescript
// Group
{
  id: "group_kim_ray",
  name: "Kim & Ray's Home",
  type: "couple",
  stats: { memberCount: 2 }
}

// Members
[
  { groupId: "group_kim_ray", userId: "kim", role: "owner" },
  { groupId: "group_kim_ray", userId: "ray", role: "admin" }
]

// Works perfectly! ✅
```

---

### Example 2: 4 Roommates ✅
```typescript
// Group
{
  id: "group_4_roommates",
  name: "Apartment 4B",
  type: "roommates",
  stats: { memberCount: 4 }
}

// Members
[
  { groupId: "group_4_roommates", userId: "kim", role: "owner" },
  { groupId: "group_4_roommates", userId: "ray", role: "admin" },
  { groupId: "group_4_roommates", userId: "alex", role: "member" },
  { groupId: "group_4_roommates", userId: "jordan", role: "member" }
]

// Expense: $2,400 rent split 4 ways
{
  amount: 240000,
  splitType: "equal",
  splitData: {
    "kim": 60000,    // $600 each
    "ray": 60000,
    "alex": 60000,
    "jordan": 60000
  }
}

// Works perfectly! ✅
```

---

### Example 3: Multiple Groups ✅
```typescript
// Kim is in 3 groups:
[
  { groupId: "group_kim_ray_home", userId: "kim" },      // Home expenses
  { groupId: "group_vacation_2025", userId: "kim" },     // Vacation trip
  { groupId: "group_family_reunion", userId: "kim" }     // Family event
]

// Query: Get Kim's groups
const myGroups = await db.collection('groupMembers')
  .where('userId', '==', 'kim')
  .get();
// Returns: 3 groups ✅
```

---

### Example 4: Person Leaves Group ✅
```typescript
// Alex leaves the group
{
  groupId: "group_4_roommates",
  userId: "alex",
  status: "left",  // 👈 Changed from "active" to "left"
  leftAt: "2025-11-22T10:00:00Z"
}

// Group stats automatically update
{
  id: "group_4_roommates",
  stats: { memberCount: 3 }  // 👈 Now 3 instead of 4
}

// Alex can't see new expenses after leaving ✅
```

---

## 🚀 **Migration Strategy**

If you had the old schema, here's how to migrate:

```typescript
// 1. Create new Groups from old Couples
for (const couple of oldCouples) {
  await db.collection('groups').add({
    id: couple.id,
    name: `${couple.partner1Name} & ${couple.partner2Name}`,
    type: 'couple',
    // ... other fields
  });
}

// 2. Create GroupMembers from couple relationships
for (const couple of oldCouples) {
  // Partner 1
  await db.collection('groupMembers').add({
    groupId: couple.id,
    userId: couple.partner1Id,
    role: 'owner',
    status: 'active'
  });
  
  // Partner 2
  await db.collection('groupMembers').add({
    groupId: couple.id,
    userId: couple.partner2Id,
    role: 'admin',
    status: 'active'
  });
}

// 3. Update Users (remove coupleId)
for (const user of users) {
  await db.collection('users').doc(user.id).update({
    coupleId: FieldValue.delete()
  });
}

// 4. Update Expenses (rename coupleId to groupId)
for (const expense of expenses) {
  await db.collection('expenses').doc(expense.id).update({
    groupId: expense.coupleId,
    coupleId: FieldValue.delete()
  });
}
```

---

## ✅ **Summary**

### **New Schema Wins:**
1. ✅ **Supports 2+ people** (not just couples)
2. ✅ **Multiple groups per user** (home, trips, etc.)
3. ✅ **Flexible splits** (equal, percentage, custom, amount)
4. ✅ **Scalable** (works for 2 or 200 people)
5. ✅ **Proper relational design** (junction table)
6. ✅ **Future-proof** (easy to add features)
7. ✅ **Better performance** (denormalized stats, indexes)
8. ✅ **Secure** (role-based permissions)

### **The Answer:**
**YES, we absolutely needed to update the schema!** The old schema was hardcoded for couples and wouldn't support your multi-person use case. The new schema is flexible, scalable, and ready for any group size! 🚀

---

**Next Steps:**
1. Review `docs/DATABASE_SCHEMA.md` for complete details
2. Implement the new schema when building
3. Write settlement calculation logic for N people
4. Test with 2, 3, 4+ person scenarios
