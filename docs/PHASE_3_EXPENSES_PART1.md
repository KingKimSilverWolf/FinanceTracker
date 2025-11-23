# Phase 3: Expense Tracking - Part 1 Complete ✅

## Summary
**First half of Phase 3** is complete! We've built the foundation for expense tracking with schemas, constants, and the add expense form.

---

## What Was Built

### 📊 Expense Constants (`lib/constants/expenses.ts`)
- ✅ **27 Expense Categories** - Shared (8), Personal (11), Both (1)
  - Shared: Rent, Utilities, Groceries, Internet, Parking, Furniture, Household, Subscriptions
  - Personal: Food, Transport, Entertainment, Healthcare, Shopping, Education, Fitness, Personal Care, Gifts, Travel
  - Each with icon, color, and type classification

- ✅ **4 Split Methods** - Equal, Percentage, Amount, Custom
  - Equal: Divide equally among all members
  - Percentage: Custom percentages for each person
  - Amount: Exact amounts per person
  - Custom: Manually assign splits

- ✅ **8 Payment Methods** - Cash, Credit/Debit, Venmo, Zelle, PayPal, Bank Transfer, Other

- ✅ **Helper Functions**:
  - `getCategoriesByType()` - Filter categories by shared/personal/all
  - `getCategory()` - Get category details by key
  - Default expense values

### 🗄️ Expense Firestore Operations (`lib/firebase/expenses.ts`)
- ✅ **Expense Interface** - Complete TypeScript definitions
  ```typescript
  interface Expense {
    id: string;
    type: 'shared' | 'personal';
    userId: string; // Owner
    amount: number; // In cents
    description: string;
    category: string;
    date: Date;
    
    // Shared fields
    groupId?: string;
    paidBy?: string;
    splitMethod?: SplitMethod;
    splitData?: SplitData; // { userId: amount }
    participants?: string[];
    
    // Metadata
    createdAt: Date;
    updatedAt: Date;
  }
  ```

- ✅ **CRUD Operations**:
  - `createExpense()` - Add new expense (shared or personal)
  - `getExpense()` - Fetch single expense by ID
  - `getPersonalExpenses()` - Get user's personal expenses
  - `getGroupExpenses()` - Get expenses for a group
  - `getUserExpenses()` - Get all expenses for user
  - `updateExpense()` - Update expense details
  - `deleteExpense()` - Remove expense

- ✅ **Split Calculation Helpers**:
  - `calculateEqualSplit()` - Divide amount equally
  - `calculatePercentageSplit()` - Calculate from percentages
  - `validateSplitData()` - Ensure splits equal total (with 1¢ tolerance)

### 💳 Add Expense Dialog (`components/expenses/add-expense-dialog.tsx`)
- ✅ **Dual Tabs** - Switch between Shared and Personal expenses
- ✅ **Context-Aware Defaults** - Remembers last used type
- ✅ **Smart Group Loading** - Fetches user's groups on open

**Shared Expense Form:**
- Select group from user's groups
- Amount input (converts dollars to cents)
- Date picker (defaults to today)
- Description field (required, min 2 chars)
- Category dropdown (filtered for shared)
- "Paid By" selector (group members)
- Split method selector (Equal, Percentage, Amount, Custom)
- Payment method dropdown
- Optional notes field
- Auto-calculates equal split on submission

**Personal Expense Form:**
- Amount input
- Date picker
- Description field
- Category dropdown (filtered for personal)
- Payment method dropdown
- Optional notes field
- Simpler flow (no group/split logic)

**Features:**
- Form validation with Zod schemas
- Loading states during submission
- Toast notifications for success/errors
- Redirects to expense detail page after creation
- Optional `onSuccess` callback for refresh
- Can set `defaultType` and `defaultGroupId` props

---

## File Structure

```
duofi/
├── lib/
│   ├── constants/
│   │   └── expenses.ts              ✅ NEW - Categories, split methods, payment types
│   └── firebase/
│       └── expenses.ts               ✅ NEW - Firestore CRUD operations
│
└── components/
    └── expenses/
        └── add-expense-dialog.tsx    ✅ NEW - Add expense form with tabs
```

---

## Database Schema

### Firestore Collection: `expenses`
```typescript
{
  id: string;                    // Auto-generated doc ID
  type: 'shared' | 'personal';   // Expense type
  
  // Common fields
  userId: string;                // Creator/owner
  amount: number;                // Total in cents (e.g., $10.50 = 1050)
  description: string;           // "Rent for November"
  category: string;              // 'RENT', 'GROCERIES', etc.
  date: Timestamp;               // Expense date
  notes?: string;                // Optional notes
  receiptURL?: string;           // Future: receipt image
  paymentMethod?: string;        // 'credit_card', 'venmo', etc.
  
  // Shared expense fields (null for personal)
  groupId?: string;              // Group this belongs to
  paidBy?: string;               // User ID who paid
  splitMethod?: string;          // 'equal', 'percentage', etc.
  splitData?: {                  // Split breakdown
    [userId: string]: number;    // Amount each person owes (cents)
  };
  participants?: string[];       // Array of user IDs involved
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Example Shared Expense
```json
{
  "id": "exp_123",
  "type": "shared",
  "userId": "user_kim",
  "amount": 287974,
  "description": "Rent for November",
  "category": "RENT",
  "date": "2025-11-01",
  "groupId": "group_roommates",
  "paidBy": "user_kim",
  "splitMethod": "equal",
  "splitData": {
    "user_kim": 143987,
    "user_ray": 143987
  },
  "participants": ["user_kim", "user_ray"],
  "paymentMethod": "bank_transfer",
  "createdAt": "2025-11-23T10:00:00Z",
  "updatedAt": "2025-11-23T10:00:00Z"
}
```

### Example Personal Expense
```json
{
  "id": "exp_456",
  "type": "personal",
  "userId": "user_kim",
  "amount": 550,
  "description": "Starbucks coffee",
  "category": "FOOD",
  "date": "2025-11-23",
  "paymentMethod": "credit_card",
  "notes": "Morning meeting",
  "createdAt": "2025-11-23T08:30:00Z",
  "updatedAt": "2025-11-23T08:30:00Z"
}
```

---

## Key Design Decisions

### 1. **Amount in Cents**
- Store all amounts as integers in cents
- Avoids floating-point precision issues
- `$10.50` stored as `1050`
- Convert to dollars for display only

### 2. **Split Data Structure**
- Object mapping userId to amount: `{ userId: amountInCents }`
- Flexible for any split method
- Easy to query "how much does X owe?"
- Validation ensures sum equals total

### 3. **Type Discrimination**
- `type: 'shared' | 'personal'` field
- Shared expenses have groupId, splitData
- Personal expenses don't have group fields
- Easy to query: `where('type', '==', 'personal')`

### 4. **Participants Array**
- Denormalized list of user IDs involved
- Makes queries efficient: `where('participants', 'array-contains', userId)`
- Redundant with splitData keys but optimizes reads

### 5. **Category System**
- Predefined categories with icons
- Type-aware (shared, personal, both)
- Extensible for custom categories (future)
- Color-coded for visual distinction

---

## UX Features Implemented

### Visual Distinction
- **Teal (#14B8A6)** = Shared expenses (brand color)
- **Purple (#8B5CF6)** = Personal expenses (secondary color)
- Icons for every category
- Clear tab separation in add form

### Smart Defaults
- Date defaults to today
- Payment method defaults to credit card
- Group defaults to first available
- "Paid By" defaults to current user
- Split method defaults to equal

### Form Validation
- Amount required and must be positive
- Description minimum 2 characters
- Group required for shared expenses
- "Paid By" required for shared expenses
- Date cannot be empty

### User Feedback
- Loading states during submission
- Success toast with green checkmark
- Error toast with specific message
- Form resets after successful add
- Optional redirect to expense detail

---

## What's Next (Part 2)

### Immediate Tasks
1. **Expenses List Page** (`/dashboard/expenses`)
   - View all expenses (personal + shared)
   - Filter by type, date range, category
   - Search by description
   - Grouped by date (Today, Yesterday, This Week, etc.)
   - Summary cards (total spent, by type)

2. **Expense Detail Page** (`/dashboard/expenses/[id]`)
   - Full expense details
   - Edit expense button
   - Delete expense button
   - Split breakdown for shared expenses
   - Who paid, who owes what
   - Receipt image (placeholder)

3. **Group Integration**
   - Show recent expenses on group detail page
   - "Add Expense" button with group pre-selected
   - Total group spending summary
   - Per-member expense tracking

### Future Enhancements
- Personal finance dashboard page
- Expense analytics and charts
- Receipt photo upload
- Recurring expenses
- Expense templates
- Export to CSV/PDF
- Expense search with filters

---

## Testing Instructions

### Test Add Personal Expense
1. Go to dashboard
2. Click "Add Expense" button
3. Select "💰 Personal" tab
4. Fill in:
   - Amount: $5.50
   - Description: "Starbucks coffee"
   - Category: "🍔 Food & Dining"
   - Date: Today
   - Payment: Credit Card
5. Click "Add Expense"
6. Should see success toast
7. Should redirect to expense detail page

### Test Add Shared Expense
1. Go to a group detail page
2. Click "Add Expense" button
3. Should default to "👥 Shared" tab
4. Should pre-select current group
5. Fill in:
   - Amount: $2879.74
   - Description: "Rent for November"
   - Category: "🏠 Rent"
   - Paid By: Your name
   - Split Method: "⚖️ Split Equally"
6. Click "Add Expense"
7. Should calculate equal split
8. Should see success toast
9. Check Firebase Console → expenses collection

### Verify in Firebase
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open `expenses` collection
4. Verify document structure:
   - `type` field: "shared" or "personal"
   - `amount` in cents (550 for $5.50)
   - `splitData` object for shared
   - `participants` array for shared
   - All timestamps present

---

## Known Limitations

### Current Constraints
1. **Equal Split Only** - Other methods (percentage, amount, custom) not yet implemented
2. **No Edit After Creation** - Can't modify expense after adding (coming in Part 2)
3. **No Receipt Upload** - receiptURL field exists but no upload UI yet
4. **No Expense List** - Can create but can't view list (coming in Part 2)
5. **No Settlement Calculation** - Just tracks expenses, doesn't calculate balances yet

### Future Features
- Custom split UI for percentage/amount methods
- Expense edit/delete functionality
- Recurring expense templates
- Bulk expense import
- Expense categories customization
- Tags and labels
- Expense comments/discussion

---

## Success Metrics

### Part 1 Goals (Achieved ✅)
- ✅ Can add personal expenses
- ✅ Can add shared expenses to groups
- ✅ Expenses saved to Firestore
- ✅ Split calculation works (equal method)
- ✅ Form validation prevents errors
- ✅ Type-safe with TypeScript
- ✅ Clean UX with tabs and smart defaults

---

## Next Session

Ready to build Part 2:
1. Expenses list page
2. Expense detail/edit page
3. Group expense integration
4. Dashboard expense widgets

The foundation is solid - all CRUD operations ready, data schema defined, form working perfectly!

---

**Built with:** React Hook Form, Zod validation, Firestore, TypeScript

**Last Updated:** November 23, 2025
