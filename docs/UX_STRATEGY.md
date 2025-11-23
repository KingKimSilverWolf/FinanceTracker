# DuoFi UX Strategy: Personal + Group Finance

## 🎯 Core UX Principle
**"Seamlessly switch between personal and group finances without confusion"**

Users should always know:
1. Whether they're viewing personal or group data
2. How to quickly switch between contexts
3. Where their money is going (personal vs shared)

---

## 🧭 Navigation Architecture

### Primary Navigation (Dashboard Sidebar/Bottom Nav)
```
┌─────────────────────────────┐
│ 🏠 Home                     │  ← Overview of everything
│ 👥 Groups                   │  ← All expense groups
│ 💰 Personal                 │  ← Personal finances only
│ 📊 Analytics                │  ← Combined insights
│ ⚖️  Settlements              │  ← Who owes whom
│ ⚙️  Settings                 │  ← User preferences
└─────────────────────────────┘
```

### Context Switching (Quick Toggle)
- **Every expense page** should have a context selector
- Visual indicator of current mode (Group vs Personal)
- One-tap switch between modes

---

## 📱 Key User Flows

### Flow 1: Add Expense (Context-Aware)
```
User taps FAB (+) button
  ↓
Modal: "Add Expense"
  ├─ Tab 1: 👥 Shared (Default if viewing group)
  │   ├─ Select Group (if multiple)
  │   ├─ Amount, Description, Category
  │   ├─ Who Paid? (member selector)
  │   ├─ Split Method (equal/custom/percentage)
  │   └─ Who's involved? (select members)
  │
  └─ Tab 2: 💰 Personal
      ├─ Amount, Description, Category
      ├─ Date, Notes
      └─ Personal category selector
```

**UX Key:** Default to current context (if on group page → shared, if on personal → personal)

---

### Flow 2: Dashboard Home (Unified View)
```
┌─────────────────────────────────────┐
│ Welcome back, Kim! 👋               │
│                                     │
│ ┌─────────────┐ ┌─────────────┐   │
│ │ This Month  │ │  Personal   │   │
│ │   $3,271    │ │    $450     │   │
│ │ 👥 Shared   │ │ 💰 Only Me  │   │
│ └─────────────┘ └─────────────┘   │
│                                     │
│ ⚖️ Settlements                      │
│ ┌─────────────────────────────┐   │
│ │ 🔴 Ray owes you $1,306.55   │   │
│ └─────────────────────────────┘   │
│                                     │
│ 📋 Recent Activity (All)            │
│ ├─ 💰 Starbucks - $5.50 (Personal) │
│ ├─ 👥 Rent - $2,879 (Roommates)    │
│ └─ 👥 Groceries - $150 (Kim & Ray) │
│                                     │
│ 🏘️ Your Groups (3)                  │
│ ├─ Roommates (4 members)           │
│ ├─ Kim & Ray (2 members)           │
│ └─ Trip to Paris (3 members)       │
└─────────────────────────────────────┘
```

**UX Key:** Show everything at a glance, clear visual distinction between personal/shared

---

### Flow 3: Groups Page (Easy Access)
```
┌─────────────────────────────────────┐
│ 👥 Groups                    [+ New]│
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏠 Roommates                │   │
│ │ 4 members • $3,271 this mo. │   │
│ │ ⚖️ You owe $150              │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 💑 Kim & Ray                │   │
│ │ 2 members • $850 this mo.   │   │
│ │ ⚖️ Ray owes you $425         │   │
│ └─────────────────────────────┘   │
│                                     │
│ 💰 Personal Finances                │
│ ┌─────────────────────────────┐   │
│ │ 💰 Just Me                  │   │
│ │ $450 spent • 12 transactions│   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**UX Key:** Personal finances shown as a special "group" for consistency

---

### Flow 4: Personal Finances Page
```
┌─────────────────────────────────────┐
│ 💰 Personal Finances                │
│                                     │
│ ┌─────────────┐ ┌─────────────┐   │
│ │ This Month  │ │ This Week   │   │
│ │   $450.00   │ │   $125.50   │   │
│ └─────────────┘ └─────────────┘   │
│                                     │
│ 📊 Spending by Category             │
│ ├─ 🍔 Food: $180                   │
│ ├─ 🚗 Transport: $120              │
│ ├─ 🎮 Entertainment: $80           │
│ └─ 🏥 Healthcare: $70              │
│                                     │
│ 📋 Recent Personal Expenses         │
│ ├─ Starbucks - $5.50               │
│ ├─ Gas Station - $45.00            │
│ └─ Netflix - $15.99                │
│                                     │
│ [+ Add Personal Expense]            │
└─────────────────────────────────────┘
```

**UX Key:** Completely separate from group finances, focused view

---

## 🎨 Visual Distinction Strategy

### Color Coding
- **👥 Shared/Group**: Teal (#14B8A6) - Brand color
- **💰 Personal**: Purple (#8B5CF6) - Distinct secondary color
- **⚖️ Settlements**: Amber/Orange (#F59E0B) for owed, Green (#10B981) for receiving

### Icons & Badges
- **Group expenses**: 👥 Users icon + group name
- **Personal expenses**: 💰 Single person icon + "Personal"
- **Hybrid view**: Show both with clear labels

### Typography
- **Group names**: Bold, teal color
- **"Personal"**: Bold, purple color
- **Settlement amounts**: Large, prominent font

---

## 📊 Analytics UX (Combined View)

```
┌─────────────────────────────────────┐
│ 📊 Analytics                 [Filter]│
│                                     │
│ ┌───────────────────────────────┐  │
│ │ Total Spending: $3,721        │  │
│ │ ├─ 👥 Shared: $3,271 (88%)   │  │
│ │ └─ 💰 Personal: $450 (12%)   │  │
│ └───────────────────────────────┘  │
│                                     │
│ 📈 Spending Trend (Combined)        │
│ [Line chart with 2 lines]           │
│  - Teal line: Shared expenses       │
│  - Purple line: Personal expenses   │
│                                     │
│ 🥧 Category Breakdown               │
│ [Pie chart with segments]           │
│  - Each segment labeled             │
│  - Tap to see group vs personal     │
│                                     │
│ Toggle: [All] [👥 Shared] [💰 Personal] │
└─────────────────────────────────────┘
```

**UX Key:** Default to combined view, easy toggle to filter by type

---

## 🔄 Context Awareness Rules

### Smart Defaults
1. **On Group Detail Page** → "Add Expense" defaults to that group (shared)
2. **On Personal Page** → "Add Expense" defaults to personal
3. **On Home Dashboard** → "Add Expense" shows both tabs, remembers last used
4. **After login** → Dashboard shows both personal and group overview

### Context Preservation
- Remember last viewed context
- Deep links maintain context (e.g., `/dashboard/groups/abc123` → group context)
- Browser back button respects context

---

## 🎯 Critical UX Principles

### 1. **No Ambiguity**
- Always show whether viewing personal or group data
- Clear visual indicators (icons, colors, labels)
- Confirmation dialogs mention context ("Add to Roommates group?")

### 2. **Minimal Friction**
- Maximum 2 taps to add any expense
- Quick switch between contexts (dropdown/tabs)
- Smart defaults based on current page

### 3. **Unified Yet Separate**
- Personal finances feel integrated, not tacked-on
- Can view combined analytics but also isolated views
- Consistent UI patterns across both modes

### 4. **Progressive Disclosure**
- Home dashboard shows summary of both
- Drill down to see details
- Advanced features (custom splits) hidden until needed

### 5. **Mobile-First**
- Bottom nav for core sections (Home, Groups, Personal, Analytics)
- FAB for quick expense entry
- Swipe gestures for actions
- One-handed operation friendly

---

## 🚀 Implementation Priority

### Phase 3: Core Expense Tracking
- [ ] Personal expense type in database schema
- [ ] Add expense form with Personal/Shared tabs
- [ ] Personal expenses list page
- [ ] Filter expenses by type (personal/shared)

### Phase 4: Analytics & Dashboard
- [ ] Combined dashboard showing both
- [ ] Personal vs Shared breakdown
- [ ] Toggle filters on analytics
- [ ] Color-coded visual indicators

### Phase 5: Polish
- [ ] Context-aware defaults
- [ ] Smart expense categorization
- [ ] Quick action shortcuts
- [ ] Onboarding tutorial explaining both modes

---

## 📝 Database Schema Additions

### Expense Document (Updated)
```typescript
interface Expense {
  id: string;
  type: 'shared' | 'personal';  // ← KEY FIELD
  
  // Shared expense fields
  groupId?: string;              // null for personal expenses
  paidBy?: string;               // userId who paid (shared only)
  splitType?: 'equal' | 'custom' | 'percentage' | 'amount';
  splitData?: { [userId: string]: number };  // Who owes what
  
  // Common fields (both types)
  userId: string;                // Owner of expense
  amount: number;                // In cents
  description: string;
  category: string;
  date: Date;
  notes?: string;
  receiptURL?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Query Examples
```typescript
// Get personal expenses
const personalExpenses = await getDocs(
  query(
    collection(db, 'expenses'),
    where('userId', '==', currentUserId),
    where('type', '==', 'personal')
  )
);

// Get shared expenses for a group
const sharedExpenses = await getDocs(
  query(
    collection(db, 'expenses'),
    where('groupId', '==', groupId),
    where('type', '==', 'shared')
  )
);

// Get all expenses (combined)
const allExpenses = await getDocs(
  query(
    collection(db, 'expenses'),
    where('userId', '==', currentUserId),
    orderBy('date', 'desc')
  )
);
```

---

## ✅ Success Metrics (UX)

Users should be able to:
- [ ] Add a personal expense in under 5 seconds
- [ ] Add a shared expense in under 10 seconds
- [ ] Understand their personal vs shared spending at a glance
- [ ] Switch contexts without confusion
- [ ] Find any expense within 3 taps
- [ ] Never accidentally add to wrong context

---

## 🎨 Mockup Notes

### Key Visual Elements
1. **Context Badge**: Small pill showing "👥 Shared" or "💰 Personal" on each expense card
2. **Color Accents**: Border-left on cards (teal = shared, purple = personal)
3. **Summary Cards**: Side-by-side comparison on dashboard
4. **Tab Navigation**: Clear tabs in add expense modal
5. **Filter Chips**: Quick toggle filters (All, Shared, Personal)

### Accessibility
- Clear labels read by screen readers
- Color is not the only indicator (use icons + text)
- High contrast for both color schemes
- Focus states for keyboard navigation

---

## 🔮 Future Enhancements

1. **Hybrid Expenses**: Part personal, part shared (e.g., "I bought groceries, keep $50 for my stuff, split rest")
2. **Personal Budget Goals**: Set limits for personal categories
3. **Income Tracking**: Personal income vs group income
4. **Tax Categories**: Mark personal expenses as tax-deductible
5. **Multiple Currencies**: Handle personal and group currencies differently
6. **Savings Goals**: Personal savings targets separate from group goals

---

**Remember:** The key to great UX is making the complex feel simple. Users shouldn't think about data structure—they should just track their money naturally.
