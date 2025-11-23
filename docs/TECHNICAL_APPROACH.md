# DuoFi - Technical Approach & Standards

## 🏗️ **Architecture Philosophy**

### **Guiding Principles:**
1. **Modular First** - Small, focused files (never >300 lines)
2. **Feature-Based** - Organize by feature, not by type
3. **Type-Safe** - TypeScript strict mode everywhere
4. **Composable** - Build with reusable components
5. **Testable** - Easy to test, debug, and maintain
6. **Performance** - Fast, responsive, optimized

---

## 📁 **Project Structure**

```
duofi/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-related pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Main app (protected)
│   │   ├── dashboard/
│   │   ├── expenses/
│   │   ├── settlement/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   ├── expenses/
│   │   ├── settlement/
│   │   └── auth/
│   ├── globals.css
│   └── layout.tsx
│
├── components/                    # Shared components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   │   ├── button.tsx            (~40 lines)
│   │   ├── card.tsx              (~50 lines)
│   │   ├── input.tsx             (~40 lines)
│   │   ├── select.tsx            (~60 lines)
│   │   └── dialog.tsx            (~70 lines)
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            (~80 lines)
│   │   ├── Sidebar.tsx           (~100 lines)
│   │   ├── MobileNav.tsx         (~90 lines)
│   │   └── Footer.tsx            (~40 lines)
│   └── shared/                   # Shared feature components
│       ├── LoadingSpinner.tsx    (~20 lines)
│       ├── ErrorBoundary.tsx     (~60 lines)
│       └── EmptyState.tsx        (~30 lines)
│
├── features/                      # Feature modules
│   ├── expenses/
│   │   ├── components/
│   │   │   ├── ExpenseCard.tsx           (~60 lines)
│   │   │   ├── ExpenseForm.tsx           (~150 lines)
│   │   │   ├── ExpenseList.tsx           (~80 lines)
│   │   │   ├── ExpenseFilters.tsx        (~70 lines)
│   │   │   └── SplitCalculator.tsx       (~100 lines)
│   │   ├── hooks/
│   │   │   ├── useExpenses.ts            (~80 lines)
│   │   │   ├── useExpenseForm.ts         (~60 lines)
│   │   │   └── useExpenseFilters.ts      (~40 lines)
│   │   ├── utils/
│   │   │   ├── expenseCalculations.ts    (~120 lines)
│   │   │   └── expenseValidation.ts      (~60 lines)
│   │   ├── types/
│   │   │   └── expense.types.ts          (~50 lines)
│   │   └── constants/
│   │       └── expenseCategories.ts      (~30 lines)
│   │
│   ├── settlement/
│   │   ├── components/
│   │   │   ├── SettlementCard.tsx        (~80 lines)
│   │   │   ├── BalanceDisplay.tsx        (~50 lines)
│   │   │   ├── PaymentForm.tsx           (~100 lines)
│   │   │   └── SettlementHistory.tsx     (~90 lines)
│   │   ├── hooks/
│   │   │   ├── useSettlement.ts          (~100 lines)
│   │   │   └── usePaymentTracking.ts     (~70 lines)
│   │   ├── utils/
│   │   │   ├── settlementCalculations.ts (~150 lines)
│   │   │   └── settlementOptimization.ts (~120 lines)
│   │   └── types/
│   │       └── settlement.types.ts       (~40 lines)
│   │
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── SpendingChart.tsx         (~100 lines)
│   │   │   ├── CategoryBreakdown.tsx     (~80 lines)
│   │   │   ├── TrendGraph.tsx            (~90 lines)
│   │   │   └── InsightCard.tsx           (~50 lines)
│   │   ├── hooks/
│   │   │   ├── useAnalytics.ts           (~80 lines)
│   │   │   └── useChartData.ts           (~100 lines)
│   │   ├── utils/
│   │   │   └── analyticsCalculations.ts  (~150 lines)
│   │   └── types/
│   │       └── analytics.types.ts        (~40 lines)
│   │
│   ├── groups/
│   │   ├── components/
│   │   │   ├── GroupCard.tsx             (~60 lines)
│   │   │   ├── GroupForm.tsx             (~120 lines)
│   │   │   ├── MemberList.tsx            (~70 lines)
│   │   │   └── InviteModal.tsx           (~90 lines)
│   │   ├── hooks/
│   │   │   ├── useGroups.ts              (~90 lines)
│   │   │   └── useGroupMembers.ts        (~70 lines)
│   │   ├── utils/
│   │   │   └── groupValidation.ts        (~50 lines)
│   │   └── types/
│   │       └── group.types.ts            (~40 lines)
│   │
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx             (~100 lines)
│       │   ├── SignupForm.tsx            (~120 lines)
│       │   └── AuthProvider.tsx          (~80 lines)
│       ├── hooks/
│       │   └── useAuth.ts                (~90 lines)
│       ├── utils/
│       │   └── authValidation.ts         (~60 lines)
│       └── types/
│           └── auth.types.ts             (~30 lines)
│
├── lib/                           # Shared utilities
│   ├── db/                       # Database utilities
│   │   ├── client.ts             (~40 lines)
│   │   └── queries.ts            (~200 lines - split if needed)
│   ├── utils/                    # Helper functions
│   │   ├── cn.ts                 (~10 lines - classNames merger)
│   │   ├── formatters.ts         (~80 lines - date, currency, etc)
│   │   ├── validators.ts         (~100 lines)
│   │   └── helpers.ts            (~80 lines)
│   ├── hooks/                    # Global hooks
│   │   ├── useMediaQuery.ts      (~30 lines)
│   │   ├── useDebounce.ts        (~20 lines)
│   │   └── useLocalStorage.ts    (~40 lines)
│   └── constants/                # Global constants
│       ├── routes.ts             (~30 lines)
│       ├── colors.ts             (~40 lines)
│       └── config.ts             (~50 lines)
│
├── types/                         # Global TypeScript types
│   ├── index.ts                  (~30 lines)
│   ├── api.types.ts              (~50 lines)
│   └── common.types.ts           (~40 lines)
│
├── styles/                        # Global styles
│   └── themes.css                (~100 lines)
│
├── public/                        # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── docs/                          # Documentation
    ├── PROJECT_PLAN.md
    ├── PRODUCT_VISION.md
    ├── TECHNICAL_APPROACH.md
    └── API_DOCUMENTATION.md
```

---

## 🎨 **Component Standards**

### **Component Template:**
```tsx
// features/expenses/components/ExpenseCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Expense } from '@/features/expenses/types/expense.types';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function ExpenseCard({ 
  expense, 
  onEdit, 
  onDelete, 
  className 
}: ExpenseCardProps) {
  const handleEdit = () => {
    onEdit?.(expense);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this expense?')) {
      onDelete?.(expense.id);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{expense.description}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          <span>{formatDate(expense.date)}</span>
          <span className="font-semibold">
            {formatCurrency(expense.amount)}
          </span>
        </div>
        {/* Additional content */}
      </CardContent>
    </Card>
  );
}
```

### **Component Rules:**
1. ✅ Use `'use client'` for interactive components
2. ✅ Define clear TypeScript interfaces
3. ✅ Keep under 150 lines (split if needed)
4. ✅ Extract complex logic to hooks
5. ✅ Use composition over complexity
6. ✅ Include className prop for flexibility
7. ✅ Use semantic HTML
8. ✅ Add proper ARIA labels

---

## 🪝 **Custom Hooks Standards**

### **Hook Template:**
```tsx
// features/expenses/hooks/useExpenses.ts
import { useState, useEffect } from 'react';
import { Expense } from '../types/expense.types';

interface UseExpensesOptions {
  groupId?: string;
  userId?: string;
  dateRange?: { start: Date; end: Date };
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        setLoading(true);
        const response = await fetch('/api/expenses', {
          method: 'POST',
          body: JSON.stringify(options),
        });
        const data = await response.json();
        setExpenses(data.expenses);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [options.groupId, options.userId]); // Dependencies

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    // Implementation
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    // Implementation
  };

  const deleteExpense = async (id: string) => {
    // Implementation
  };

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
```

### **Hook Rules:**
1. ✅ Always return an object (not array)
2. ✅ Include loading/error states
3. ✅ Type everything properly
4. ✅ Keep under 100 lines (split if complex)
5. ✅ Use descriptive names
6. ✅ Handle cleanup properly
7. ✅ Memoize expensive operations

---

## 🛠️ **Utility Functions Standards**

### **Utility Template:**
```tsx
// features/expenses/utils/expenseCalculations.ts
import { Expense, Split } from '../types/expense.types';

/**
 * Calculate individual split amounts from an expense
 * @param expense - The expense to split
 * @param participants - Array of participant IDs
 * @returns Object mapping participant IDs to their share
 */
export function calculateSplits(
  expense: Expense,
  participants: string[]
): Record<string, number> {
  const { amount, splitType, customSplits } = expense;

  if (splitType === 'equal') {
    const share = amount / participants.length;
    return Object.fromEntries(
      participants.map(id => [id, share])
    );
  }

  if (splitType === 'custom' && customSplits) {
    return customSplits;
  }

  // Default to equal split
  return calculateSplits(
    { ...expense, splitType: 'equal' },
    participants
  );
}

/**
 * Calculate settlement amounts between participants
 * @param expenses - Array of expenses
 * @param participants - Array of participant IDs
 * @returns Settlement matrix
 */
export function calculateSettlement(
  expenses: Expense[],
  participants: string[]
): Record<string, Record<string, number>> {
  // Implementation
  // Returns: { 'kim': { 'ray': 100 }, 'ray': { 'kim': -100 } }
}

/**
 * Optimize settlements to minimize transactions
 * @param settlements - Raw settlement matrix
 * @returns Optimized settlement array
 */
export function optimizeSettlements(
  settlements: Record<string, Record<string, number>>
): Array<{ from: string; to: string; amount: number }> {
  // Implementation
}
```

### **Utility Rules:**
1. ✅ Pure functions (no side effects)
2. ✅ JSDoc comments for complex functions
3. ✅ Type inputs and outputs
4. ✅ Keep functions focused (single responsibility)
5. ✅ Easy to test
6. ✅ Descriptive names
7. ✅ Handle edge cases

---

## 📝 **TypeScript Standards**

### **Type Definition Template:**
```tsx
// features/expenses/types/expense.types.ts

export type ExpenseCategory = 
  | 'rent'
  | 'utilities'
  | 'groceries'
  | 'furniture'
  | 'entertainment'
  | 'other';

export type SplitType = 'equal' | 'percentage' | 'custom';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  groupId: string;
  paidBy: string; // User ID who paid
  splitType: SplitType;
  customSplits?: Record<string, number>; // userId -> amount
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFormData {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  paidBy: string;
  splitType: SplitType;
  customSplits?: Record<string, number>;
  notes?: string;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  dateRange?: { start: Date; end: Date };
  paidBy?: string;
  minAmount?: number;
  maxAmount?: number;
}
```

### **TypeScript Rules:**
1. ✅ Use strict mode
2. ✅ Avoid `any` (use `unknown` if needed)
3. ✅ Define interfaces for props
4. ✅ Use union types for constants
5. ✅ Export all types
6. ✅ Co-locate types with features
7. ✅ Use enums sparingly (prefer unions)

---

## 🎨 **Styling Standards**

### **Tailwind Usage:**
```tsx
// ✅ Good - Consistent, readable
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-semibold text-gray-800">Title</h2>
  <p className="text-gray-600">Description</p>
</div>

// ✅ Good - Using custom utilities
<div className="card-primary">
  <h2 className="heading-lg">Title</h2>
</div>

// ❌ Bad - Too many classes, hard to read
<div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
  <!-- Too complex, extract to component -->
</div>
```

### **Custom Utilities:**
```css
/* styles/themes.css */
@layer components {
  .card-primary {
    @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
  }
  
  .heading-lg {
    @apply text-2xl font-semibold text-gray-800 tracking-tight;
  }
  
  .btn-primary {
    @apply bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg transition-colors;
  }
}
```

---

## 🧪 **Testing Strategy**

### **What to Test:**
1. **Utils** - All pure functions (100% coverage)
2. **Hooks** - Custom hooks with complex logic
3. **Components** - User interactions, edge cases
4. **API** - All endpoints
5. **Calculations** - Settlement, splits, etc.

### **Testing Template:**
```tsx
// features/expenses/utils/expenseCalculations.test.ts
import { calculateSplits } from './expenseCalculations';

describe('calculateSplits', () => {
  it('should split equally between 2 people', () => {
    const expense = {
      amount: 100,
      splitType: 'equal' as const,
    };
    const result = calculateSplits(expense, ['kim', 'ray']);
    
    expect(result).toEqual({
      kim: 50,
      ray: 50,
    });
  });

  it('should handle custom splits', () => {
    const expense = {
      amount: 100,
      splitType: 'custom' as const,
      customSplits: { kim: 60, ray: 40 },
    };
    const result = calculateSplits(expense, ['kim', 'ray']);
    
    expect(result).toEqual({
      kim: 60,
      ray: 40,
    });
  });
});
```

---

## 🚀 **Performance Standards**

### **Optimization Checklist:**
- ✅ Use `React.memo` for expensive components
- ✅ Memoize calculations with `useMemo`
- ✅ Debounce search/filter inputs
- ✅ Lazy load routes and components
- ✅ Optimize images (next/image)
- ✅ Virtual scrolling for long lists
- ✅ Server components where possible
- ✅ API route caching

---

## 📦 **Dependencies Philosophy**

### **When to Add a Package:**
- ✅ Solves a complex problem (date-fns, recharts)
- ✅ Well-maintained (recent updates)
- ✅ Small bundle size
- ✅ TypeScript support
- ✅ Good documentation

### **When NOT to Add:**
- ❌ Can be done in <50 lines of code
- ❌ Unmaintained/abandoned
- ❌ Large bundle size for simple task
- ❌ No TypeScript support
- ❌ Solves problem we don't have yet

---

## ✅ **Code Review Checklist**

Before committing:
- [ ] TypeScript strict mode passes
- [ ] No console.logs/debugger statements
- [ ] Proper error handling
- [ ] Loading states for async operations
- [ ] Accessible (keyboard navigation, ARIA)
- [ ] Responsive design
- [ ] No hardcoded values (use constants)
- [ ] Functions under 50 lines
- [ ] Files under 300 lines
- [ ] Comments for complex logic
- [ ] Proper naming (descriptive, not abbreviated)

---

**This is our technical foundation. Let's build something maintainable and beautiful! 🚀**
