# DuoFi - Product Vision & Understanding

## 🎯 **Core Understanding**

### **What DuoFi Is:**
A modern web application that replaces messy spreadsheets for tracking shared expenses between 2 or more people, while also supporting personal finance tracking.

### **Primary Use Case:**
People living together (couples, roommates, family) who:
- Share recurring expenses (rent, utilities, groceries)
- Need to track "who paid what"
- Want to calculate "who owes whom" automatically
- Track both shared AND personal expenses
- Need mobile-friendly expense entry
- Want visual insights into spending patterns

---

## 📱 **Real-World Example: Kim & Ray's Spreadsheet**

### What They Track:
**Monthly Shared Expenses:**
- Rent: $2,879.74 (split unevenly: Kim $1,498.20 | Ray $1,381.55)
- Gas: $25.50 (Ray pays)
- Water: $91.15 (Ray pays)
- Internet: $0.00 (varies)
- Parking: $125.00 (Ray pays)
- Furniture: $150.00 (Kim pays)

**Settlement Calculation:**
- Kim paid: $1,648.20
- Ray paid: $1,623.20
- **Result: "To Pay Kim: $1,306.55"** ← This is the key feature!

**Groceries System:**
- Track monthly who bought groceries
- Each person's contribution logged
- Monthly settlement
- Yearly totals: Kim $1,125.19 | Ray $562.60

**Utilities Detail:**
- Month-by-month Gas & Water tracking
- Individual contributions per month
- Notes for special cases (errors, double payments)
- Yearly totals with breakdowns

---

## 🎨 **Brand Identity - UPDATED**

**Name:** DuoFi  
**Tagline:** "Finance for two or more, simplified"  
**Alt Taglines:**
- "Your money, together"
- "Shared expenses made simple"
- "Track it. Split it. Settle it."

**Target Audience:**
1. **Couples living together** (Primary - 70% of users)
2. **Roommates** (2-4+ people sharing rent/bills)
3. **Friends** (group trips, shared subscriptions)
4. **Family** (adult children with parents, siblings)
5. **Individuals** (personal finance tracking only)

---

## 🚀 **Key Features That Replace The Spreadsheet**

### 1. **Smart Expense Entry**
- Quick add with mobile-first design
- Auto-categorization based on history
- Split calculator (equal/custom/percentage)
- Receipt photo upload
- Recurring expense templates

### 2. **Auto Settlement Calculation**
- Real-time "who owes whom" display
- Monthly + all-time views
- Multi-person optimization (minimize transactions)
- Payment tracking with methods (Venmo, Zelle, etc.)
- Settlement history

### 3. **Beautiful Visualizations**
- Category spending pie charts
- Monthly trend graphs
- Year-over-year comparisons
- Personal vs shared spending ratio
- Spending heatmaps by category

### 4. **Mobile Experience**
- Bottom navigation for quick access
- Floating action button for instant add
- Swipe gestures for actions
- Pull-to-refresh
- Offline support with sync

### 5. **Smart Insights**
- "You spent 15% more on groceries this month"
- "Utilities are consistently $120/month"
- "Kim typically pays utilities, Ray pays groceries"
- Budget recommendations
- Spending pattern alerts

### 6. **Multi-Person Support**
- Add 2+ people to any group
- Each person has their own view/dashboard
- Shared group dashboard
- Individual contribution tracking
- Flexible split options per expense

---

## 🎨 **Design Language**

**Color Palette:** Teal Wave
- Primary: `#14B8A6` (Modern, trustworthy)
- Dark: `#0F766E` (Depth, emphasis)
- Light: `#CCFBF1` (Backgrounds, highlights)

**Personality:**
- Modern & sleek (not corporate/boring)
- Friendly (not intimidating)
- Clear & simple (not cluttered)
- Mobile-first (not desktop-heavy)
- Beautiful (not just functional)

**UI Principles:**
- Data visualization first
- Minimalist & clean
- Smooth micro-animations
- Large touch targets
- Instant feedback
- Accessible (WCAG 2.1 AA)

---

## 🏗️ **Technical Architecture Principles**

### Modular & Maintainable:
- **Components:** Small, reusable, single-responsibility
- **File Size:** Never exceed 200-300 lines
- **Structure:** Feature-based folders, not type-based
- **TypeScript:** Strict mode, proper types everywhere
- **Testing:** Unit + integration tests for critical paths

### Example Structure:
```
features/
├── expenses/
│   ├── components/
│   │   ├── ExpenseCard.tsx (50 lines)
│   │   ├── ExpenseForm.tsx (120 lines)
│   │   └── ExpenseList.tsx (80 lines)
│   ├── hooks/
│   │   ├── useExpenses.ts (60 lines)
│   │   └── useExpenseForm.ts (40 lines)
│   ├── utils/
│   │   └── expenseCalculations.ts (100 lines)
│   └── types/
│       └── expense.types.ts (30 lines)
├── settlement/
│   ├── components/
│   │   ├── SettlementCard.tsx (70 lines)
│   │   └── BalanceDisplay.tsx (40 lines)
│   ├── hooks/
│   │   └── useSettlement.ts (80 lines)
│   └── utils/
│       └── settlementCalculations.ts (150 lines)
```

### Best Practices:
✅ Modular, small files (easy to navigate)
✅ Clear separation of concerns
✅ Reusable components
✅ Custom hooks for logic
✅ Utils for pure functions
✅ Types for everything
✅ Easy to test, debug, maintain

❌ No 1000+ line files
❌ No mixing concerns
❌ No inline complex logic
❌ No copy-paste code
❌ No "god components"

---

## 📋 **Development Phases**

### Phase 1: Foundation (Current)
- ✅ Next.js + TypeScript setup
- ✅ Tailwind CSS configured
- ✅ Project structure defined
- ⏳ Design system + components
- ⏳ Authentication setup
- ⏳ Database schema

### Phase 2: Core Features
- Expense tracking (add/edit/delete)
- Settlement calculations
- Basic analytics
- User profiles
- Group management

### Phase 3: Enhanced Features
- Receipt upload/OCR
- Recurring expenses
- Advanced analytics
- Notifications
- Mobile PWA

### Phase 4: Polish & Launch
- Performance optimization
- Accessibility audit
- User testing
- Marketing site
- Public launch

---

## ✅ **We Now Understand:**

1. ✅ **Audience:** 2+ people sharing expenses (not just couples)
2. ✅ **Core Value:** Automated settlement calculation ("who owes whom")
3. ✅ **Origin:** Real spreadsheet used by Kim & Ray
4. ✅ **Pain Points:** Mobile UX, manual calculations, no insights
5. ✅ **Brand:** "Finance for two or more, simplified"
6. ✅ **Design:** Modern, sleek, Teal Wave color scheme
7. ✅ **Architecture:** Modular, maintainable, small files
8. ✅ **Features:** Based on real use case, not theoretical

---

**Ready to build? Let's create something beautiful! 🚀**
