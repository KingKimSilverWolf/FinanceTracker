# Phase 5: Analytics & Reports - Design Document

## Overview

Phase 5 transforms raw expense data into actionable financial insights through visualization, trend analysis, and intelligent reporting. This phase empowers users to understand their spending patterns, track budgets, and make informed financial decisions.

## Core Objectives

1. **Visual Data Exploration** - Transform expenses into intuitive charts and graphs
2. **Spending Insights** - Identify patterns, trends, and anomalies
3. **Budget Tracking** - Monitor spending against goals with alerts
4. **Predictive Analytics** - Forecast future spending based on patterns
5. **Export & Reporting** - Generate shareable reports in multiple formats

## User Stories

### Primary Stories
- As a user, I want to see my spending by category so I can identify where my money goes
- As a user, I want to view spending trends over time to understand my financial patterns
- As a user, I want to compare this month vs last month to track improvement
- As a user, I want to receive alerts when approaching budget limits
- As a user, I want to export my expense data for tax purposes or external analysis

### Secondary Stories
- As a user, I want to see predictions of future spending based on my patterns
- As a user, I want to filter analytics by date range, groups, or categories
- As a user, I want to see insights about my most frequent expenses
- As a user, I want to track my net position across all groups over time

---

## Architecture

### 1. Data Service Layer (`lib/firebase/analytics.ts`)

**Core Analytics Functions:**

```typescript
// Time-based aggregations
interface SpendingByPeriod {
  period: string; // "2024-11", "2024-W45", "2024-11-23"
  totalSpent: number; // in cents
  totalExpenses: number;
  categories: Record<string, number>;
}

async function getSpendingByMonth(
  userId: string,
  startMonth: string, // "2024-01"
  endMonth: string
): Promise<SpendingByPeriod[]>

async function getSpendingByWeek(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SpendingByPeriod[]>

// Category analytics
interface CategoryBreakdown {
  category: string;
  totalSpent: number; // in cents
  expenseCount: number;
  percentage: number; // 0-100
  averageAmount: number; // in cents
  groups: Record<string, number>; // groupId -> amount
}

async function getCategoryBreakdown(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CategoryBreakdown[]>

// Comparative analytics
interface PeriodComparison {
  current: SpendingByPeriod;
  previous: SpendingByPeriod;
  percentageChange: number; // -100 to +Infinity
  absoluteChange: number; // in cents
  trend: 'up' | 'down' | 'stable'; // >5% change
}

async function compareMonths(
  userId: string,
  currentMonth: string,
  previousMonth: string
): Promise<PeriodComparison>

// Top expenses
interface TopExpense {
  id: string;
  description: string;
  amount: number; // in cents
  category: string;
  groupName: string;
  date: Date;
  userShare: number; // in cents
}

async function getTopExpenses(
  userId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<TopExpense[]>

// Budget tracking
interface BudgetStatus {
  category: string;
  budgetAmount: number; // in cents (from user settings)
  spentAmount: number; // in cents
  remainingAmount: number; // in cents
  percentageUsed: number; // 0-100+
  status: 'safe' | 'warning' | 'exceeded'; // <70%, 70-100%, >100%
  projectedTotal: number; // in cents (based on current pace)
}

async function getBudgetStatus(
  userId: string,
  month: string
): Promise<BudgetStatus[]>

// Net position (balances across all groups)
interface NetPositionOverTime {
  date: string; // ISO date
  netBalance: number; // in cents (positive = owed, negative = owe)
  totalOwed: number; // in cents
  totalOwing: number; // in cents
  settledAmount: number; // in cents (cumulative)
}

async function getNetPositionHistory(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<NetPositionOverTime[]>
```

**Predictive Analytics:**

```typescript
// Simple linear regression for spending prediction
interface SpendingPrediction {
  predictedAmount: number; // in cents
  confidence: 'high' | 'medium' | 'low'; // based on data points
  basedOnDataPoints: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

async function predictNextMonthSpending(
  userId: string,
  category?: string // optional category filter
): Promise<SpendingPrediction>

// Spending patterns detection
interface SpendingPattern {
  type: 'recurring' | 'seasonal' | 'one-time' | 'unusual';
  description: string; // e.g., "Coffee every weekday morning"
  category: string;
  averageAmount: number; // in cents
  frequency: string; // "daily", "weekly", "monthly"
  confidence: number; // 0-1
  examples: string[]; // expense IDs
}

async function detectSpendingPatterns(
  userId: string,
  lookbackDays: number = 90
): Promise<SpendingPattern[]>
```

**Insights Generation:**

```typescript
interface SpendingInsight {
  id: string;
  type: 'alert' | 'tip' | 'milestone' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: boolean;
  action?: {
    label: string;
    route: string;
  };
  category?: string;
  amount?: number; // in cents
  date: Date;
}

async function generateInsights(
  userId: string
): Promise<SpendingInsight[]>

// Example insights:
// - "You're spending 30% more on Dining Out this month"
// - "Great job! You've stayed under budget for 3 months"
// - "Upcoming: Your Netflix subscription ($15.99) renews in 3 days"
// - "Warning: You've exceeded your Transport budget by $45"
// - "Tip: You could save $120/month by making coffee at home"
```

### 2. Chart Components

**A. Category Pie Chart (`components/analytics/category-pie-chart.tsx`)**

Features:
- Pie chart with category breakdown
- Hover tooltips showing amount and percentage
- Legend with color coding
- Responsive design
- Empty state for no data
- Click to filter/drill down

**B. Spending Trend Chart (`components/analytics/spending-trend-chart.tsx`)**

Features:
- Line chart showing spending over time
- Multiple series (total, by category)
- Date range selector (1M, 3M, 6M, 1Y, All)
- Zoom and pan capabilities
- Tooltip with date and amounts
- Comparison overlay (vs previous period)

**C. Monthly Comparison Chart (`components/analytics/monthly-comparison-chart.tsx`)**

Features:
- Bar chart comparing current vs previous month
- Side-by-side bars by category
- Percentage change indicators
- Color coding (green=decreased, red=increased)
- Total comparison at top

**D. Budget Progress Chart (`components/analytics/budget-progress-chart.tsx`)**

Features:
- Horizontal bar chart for each budget category
- Color zones (green <70%, yellow 70-100%, red >100%)
- Current vs budget amount labels
- Days remaining in period indicator
- Projected end-of-month spend

**E. Net Balance Timeline (`components/analytics/net-balance-timeline.tsx`)**

Features:
- Area chart of net position over time
- Positive area (green) = owed to you
- Negative area (red) = you owe
- Settlement markers on timeline
- Zoom to date range

### 3. Analytics Dashboard Component

**Personal Analytics Dashboard (`components/analytics/personal-analytics-dashboard.tsx`)**

Layout structure:
```
┌─────────────────────────────────────────────────────────┐
│ Summary Cards Row                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│ │ Total   │ │ Avg/Day │ │ Top     │ │ Budget  │      │
│ │ Spent   │ │         │ │ Category│ │ Status  │      │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
├─────────────────────────────────────────────────────────┤
│ Quick Filters & Date Range Picker                      │
│ [This Month ▼] [All Groups ▼] [All Categories ▼]      │
├─────────────────────────────────────────────────────────┤
│ Main Charts Grid                                        │
│ ┌──────────────────────┐ ┌──────────────────────┐    │
│ │ Spending Trend       │ │ Category Breakdown   │    │
│ │ (Line Chart)         │ │ (Pie Chart)          │    │
│ └──────────────────────┘ └──────────────────────┘    │
│ ┌──────────────────────┐ ┌──────────────────────┐    │
│ │ Monthly Comparison   │ │ Budget Progress      │    │
│ │ (Bar Chart)          │ │ (Horizontal Bars)    │    │
│ └──────────────────────┘ └──────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│ Insights & Alerts Section                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 💡 Insights                                      │   │
│ │ • You're spending 30% more on Dining Out        │   │
│ │ • Coffee purchases down 15% - great job!        │   │
│ │ ⚠️  Budget alert: Transport at 95%               │   │
│ └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Top Expenses Table                                      │
│ ┌─────┬──────────────────┬──────────┬──────────┐     │
│ │ Date│ Description      │ Category │ Amount   │     │
│ ├─────┼──────────────────┼──────────┼──────────┤     │
│ │ ...                                           │     │
│ └─────┴──────────────────┴──────────┴──────────┘     │
├─────────────────────────────────────────────────────────┤
│ Export Options                                          │
│ [📊 Export CSV] [📄 Export PDF] [🔗 Share Link]       │
└─────────────────────────────────────────────────────────┘
```

### 4. Export Functionality

**CSV Export (`lib/export/csv-export.ts`)**

```typescript
interface ExportOptions {
  userId: string;
  startDate: Date;
  endDate: Date;
  groupIds?: string[]; // optional filter
  categories?: string[]; // optional filter
  includeSettlements?: boolean;
}

async function exportExpensesToCSV(
  options: ExportOptions
): Promise<string> // Returns CSV string

// CSV Format:
// Date,Description,Category,Amount,Group,Paid By,Split With,My Share,Status
```

**PDF Export (`lib/export/pdf-export.ts`)**

```typescript
// Using jsPDF or similar library
async function exportExpensesToPDF(
  options: ExportOptions & {
    includeCharts?: boolean;
    includeSummary?: boolean;
  }
): Promise<Blob> // Returns PDF blob

// PDF Structure:
// - Header with date range
// - Summary statistics
// - Charts (if included)
// - Expense table
// - Footer with generation timestamp
```

---

## Data Models

### Analytics Settings (User Preferences)

```typescript
interface AnalyticsSettings {
  userId: string;
  budgets: {
    category: string;
    monthlyLimit: number; // in cents
    enabled: boolean;
  }[];
  defaultDateRange: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  currency: string; // "USD", "EUR", etc.
  alerts: {
    budgetWarningThreshold: number; // percentage (default 80)
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  insights: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

Firestore structure:
```
users/{userId}/settings/analytics
```

---

## Technical Considerations

### 1. Performance Optimization

**Query Optimization:**
- Use composite indexes for common queries (userId + date range + category)
- Implement pagination for large expense lists
- Cache aggregated data for common time periods (today, this week, this month)
- Use Firestore `count()` aggregation queries where available

**Client-Side Caching:**
```typescript
// Cache analytics data in React Query
const { data, isLoading } = useQuery(
  ['analytics', userId, startDate, endDate],
  () => getSpendingByMonth(userId, startDate, endDate),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  }
);
```

**Aggregation Strategy:**
- For recent data (<30 days): Query directly from expenses
- For historical data (>30 days): Use pre-aggregated monthly summaries
- Background job to compute monthly aggregates (future enhancement)

### 2. Charting Library

**Recommendation: Recharts**
- Pros: React-native, composable, responsive, TypeScript support
- Cons: Bundle size (~200KB), limited 3D charts
- Alternative: Chart.js with react-chartjs-2 (lighter, 100KB)

Installation:
```bash
npm install recharts
npm install -D @types/recharts
```

### 3. Date Handling

**Library: date-fns**
- Already in project
- Functions needed: startOfMonth, endOfMonth, format, differenceInDays, subMonths

**Date Range Utilities:**
```typescript
// lib/utils/date-ranges.ts
export const DATE_RANGES = {
  '1M': { label: 'Last Month', days: 30 },
  '3M': { label: 'Last 3 Months', days: 90 },
  '6M': { label: 'Last 6 Months', days: 180 },
  '1Y': { label: 'Last Year', days: 365 },
  'ALL': { label: 'All Time', days: null },
} as const;

export function getDateRangeFromPreset(
  preset: keyof typeof DATE_RANGES
): { start: Date; end: Date }
```

### 4. Number Formatting

**Consistent Currency Display:**
```typescript
// lib/utils/format-currency.ts
export function formatCurrency(
  amountInCents: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}

// For analytics: Show K, M for large numbers
export function formatCompactCurrency(
  amountInCents: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(amountInCents / 100);
  // Examples: $1.2K, $45K, $1.2M
}
```

### 5. Firestore Indexes Required

```javascript
// firestore.indexes.json additions
{
  "indexes": [
    // Analytics queries
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "amount", "order": "DESCENDING" }
      ]
    },
    // For group-filtered analytics
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "groupId", "order": "ASCENDING" },
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Security Considerations

### 1. Data Access Rules

**Firestore Security Rules:**
```javascript
// Users can only query their own analytics
match /users/{userId}/settings/analytics {
  allow read, write: if request.auth.uid == userId;
}

// Expenses already protected by existing rules
// Analytics aggregation must respect group membership
```

### 2. Export Rate Limiting

- Limit exports to 10 per hour per user
- Track export requests in Firestore
- Implement client-side cooldown UI

### 3. Data Privacy

- Never expose other users' personal spending details
- In group analytics, only show:
  - Total group spending
  - Category breakdowns (aggregate)
  - Your personal share and balances
- Do not show: Who paid what, individual spending patterns

---

## Progressive Enhancement Strategy

### Phase 5.1 - Core Analytics (MVP)
1. ✅ Spending by month calculation
2. ✅ Category breakdown
3. ✅ Basic charts (pie, line)
4. ✅ Summary cards
5. ✅ Date range filtering
6. ✅ Analytics page setup

### Phase 5.2 - Advanced Features
1. Budget tracking with alerts
2. Monthly comparisons
3. Top expenses list
4. Export to CSV
5. Insights generation

### Phase 5.3 - Predictive & AI
1. Spending predictions
2. Pattern detection
3. Smart recommendations
4. PDF reports with charts
5. Scheduled email reports

---

## UI/UX Considerations

### 1. Loading States
- Skeleton loaders for charts
- Progressive data loading (summaries first, then charts)
- Loading indicators for expensive calculations

### 2. Empty States
```
No Expenses Yet
Add your first expense to see analytics

[+ Add Expense Button]
```

### 3. Error Handling
- Graceful fallbacks for failed chart renders
- Clear error messages for date range issues
- Retry mechanisms for failed queries

### 4. Responsive Design
- Mobile: Stack charts vertically
- Tablet: 2-column grid
- Desktop: 2x2 grid with side panels
- Charts: Use responsive containers

### 5. Accessibility
- ARIA labels for chart elements
- Keyboard navigation for date pickers
- Color-blind friendly palettes
- Screen reader announcements for insights
- Alt text for chart images in exports

### 6. Color Palette

**Analytics-Specific Colors:**
```typescript
export const ANALYTICS_COLORS = {
  categories: [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
  ],
  trends: {
    positive: '#10B981', // green
    negative: '#EF4444', // red
    neutral: '#6B7280', // gray
  },
  budgets: {
    safe: '#10B981', // <70%
    warning: '#F59E0B', // 70-100%
    exceeded: '#EF4444', // >100%
  },
};
```

---

## Testing Strategy

### 1. Unit Tests

```typescript
// lib/firebase/analytics.test.ts
describe('getSpendingByMonth', () => {
  it('calculates monthly spending correctly', async () => {
    // Mock Firestore data
    // Assert aggregation logic
  });

  it('handles zero expenses gracefully', async () => {
    // Assert empty array returned
  });

  it('respects date range boundaries', async () => {
    // Assert expenses outside range excluded
  });
});

describe('getCategoryBreakdown', () => {
  it('calculates percentages correctly', async () => {
    // Assert sum of percentages = 100
  });

  it('sorts categories by amount desc', async () => {
    // Assert order
  });
});
```

### 2. Integration Tests

- Test full analytics page load with real Firestore emulator
- Test date range filtering updates charts
- Test export functionality generates valid CSV/PDF
- Test budget alerts trigger at correct thresholds

### 3. Visual Regression Tests

- Screenshot comparison for chart rendering
- Test responsive breakpoints
- Test dark mode chart colors

### 4. Performance Tests

- Measure query time for 1000+ expenses
- Test chart render time with large datasets
- Monitor memory usage during export

---

## Known Limitations & Future Enhancements

### Current Limitations
1. No real-time analytics updates (5-minute cache)
2. No cross-group comparative analytics
3. Basic prediction model (linear regression only)
4. PDF exports require client-side generation (large bundle)
5. No scheduled email reports

### Future Enhancements
1. **Machine Learning Integration**
   - More sophisticated spending predictions
   - Anomaly detection (unusual transactions)
   - Personalized savings recommendations

2. **Advanced Visualizations**
   - Sankey diagrams for money flow
   - Heat maps for spending by day/time
   - 3D charts for multi-dimensional analysis

3. **Collaborative Analytics**
   - Group spending comparisons
   - Leaderboards (most frugal, biggest spender)
   - Shared budget goals with progress tracking

4. **External Integrations**
   - Bank account syncing (Plaid API)
   - Investment portfolio tracking
   - Tax document generation (Form 1099, receipts)

5. **Mobile-Specific Features**
   - Swipe gestures for date navigation
   - Widget for home screen spending summary
   - Voice queries ("How much did I spend on food this month?")

---

## Success Criteria

### Functional Requirements ✅
- [ ] Users can view spending breakdown by category
- [ ] Users can see spending trends over time (line chart)
- [ ] Users can compare current vs previous month
- [ ] Users can filter analytics by date range
- [ ] Users can export data to CSV
- [ ] Summary cards show key metrics
- [ ] Charts are responsive and accessible
- [ ] Empty states guide new users

### Performance Requirements ✅
- [ ] Analytics page loads in <2 seconds
- [ ] Chart render time <500ms
- [ ] Query optimization for 1000+ expenses
- [ ] Smooth animations (60fps)

### UX Requirements ✅
- [ ] Intuitive date range selection
- [ ] Clear visual hierarchy
- [ ] Helpful insights and tips
- [ ] Error states are informative
- [ ] Mobile-friendly layouts

---

## Implementation Timeline

### Week 1: Foundation
- Day 1-2: Analytics data service (`lib/firebase/analytics.ts`)
- Day 3-4: Basic chart components (pie, line)
- Day 5: Summary cards and dashboard layout

### Week 2: Features
- Day 1-2: Date range filtering and comparison charts
- Day 3: Budget tracking UI
- Day 4: Export to CSV
- Day 5: Insights generation

### Week 3: Polish
- Day 1-2: Responsive design and mobile optimization
- Day 3: Accessibility improvements
- Day 4: Performance optimization and caching
- Day 5: Testing and bug fixes

---

## Dependencies

### New Packages Required
```json
{
  "recharts": "^2.10.0",
  "date-fns": "^2.30.0", // already installed
  "jspdf": "^2.5.1", // for PDF export (Phase 5.2)
  "papaparse": "^5.4.1" // for CSV parsing/export
}
```

### Existing Packages Used
- React Query (caching)
- Firestore (data source)
- shadcn/ui (UI components)
- Tailwind CSS (styling)

---

## Conclusion

Phase 5 transforms DuoFi from a simple expense tracker into a powerful financial analytics platform. By providing visual insights, predictive analytics, and actionable recommendations, we empower users to make informed financial decisions and achieve their savings goals.

The modular architecture allows for progressive enhancement - we can ship the MVP (Phase 5.1) quickly while building advanced features (5.2, 5.3) iteratively based on user feedback and usage patterns.

**Next Steps After This Document:**
1. Install recharts and papaparse
2. Implement core analytics service (`lib/firebase/analytics.ts`)
3. Build basic chart components
4. Create analytics dashboard page
5. Test with real expense data
6. Iterate based on performance metrics

