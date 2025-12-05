# 🎨 Visual Guide: Custom Date Range Picker

## 📸 Component Preview

### Default State (Closed)
```
┌─────────────────────────────────────────────┐
│  📅  Pick a date range                  ▼  │
└─────────────────────────────────────────────┘
```

### With Selected Range
```
┌─────────────────────────────────────────────┐
│  📅  Nov 05, 2025 - Dec 05, 2025       ✕  │
└─────────────────────────────────────────────┘
```

### Open State (Full Picker)
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│  │  Quick Select   │  │      November 2025                  │ │
│  ├─────────────────┤  ├─────────────────────────────────────┤ │
│  │ • Today         │  │  S  M  T  W  T  F  S               │ │
│  │ • Yesterday     │  │                 1  2                │ │
│  │ • Last 7 days   │  │  3  4 [5] 6  7  8  9               │ │
│  │ • Last 14 days  │  │ 10 11 12 13 14 15 16               │ │
│  │ • Last 30 days  │  │ 17 18 19 20 21 22 23               │ │
│  │ ───────────     │  │ 24 25 26 27 28 29 30               │ │
│  │ • This month    │  │                                     │ │
│  │ • Last month    │  │      December 2025                  │ │
│  │ • Last 3 months │  ├─────────────────────────────────────┤ │
│  │ • Last 6 months │  │  S  M  T  W  T  F  S               │ │
│  │ ───────────     │  │  1  2  3  4 [5] 6  7               │ │
│  │ • This year     │  │  8  9 10 11 12 13 14               │ │
│  │ • Last year     │  │ 15 16 17 18 19 20 21               │ │
│  └─────────────────┘  │ 22 23 24 25 26 27 28               │ │
│                       │ 29 30 31                            │ │
│                       └─────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

Legend:
[5] = Selected date (highlighted in teal)
```

## 🎯 Interactive Elements

### 1. Trigger Button
- **Default:** Gray outline with calendar icon
- **With Selection:** Shows formatted date range
- **Clear Button:** X icon appears on right when dates selected
- **Hover:** Subtle background change
- **Focus:** Ring outline in teal

### 2. Quick Preset Buttons
- **Layout:** Vertical stack on left side
- **Styling:** Ghost buttons with hover effect
- **Active:** Subtle background on hover
- **Click:** Auto-selects date range and closes picker

### 3. Calendar Grid
- **Layout:** Two months side by side (desktop)
- **Today:** Light accent background
- **Selected Start:** Primary teal background
- **Selected End:** Primary teal background
- **Range:** Light teal background between dates
- **Hover:** Hover state on each date cell
- **Outside Dates:** Grayed out, lower opacity

## 📱 Responsive Layouts

### Desktop (≥768px)
```
┌────────────────────────────────────────────┐
│  Presets  │  Calendar  │  Calendar         │
│  Sidebar  │  Month 1   │  Month 2          │
│           │            │                   │
│  • Today  │  Nov 2025  │  Dec 2025        │
│  • Week   │  [Grid]    │  [Grid]          │
│  • Month  │            │                   │
│  • Year   │            │                   │
└────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────┐
│  Presets (Stacked)   │
│  • Today             │
│  • Yesterday         │
│  • Last 7 days       │
│                      │
│  Calendar (Single)   │
│  November 2025       │
│  [Grid - Full Width] │
│                      │
└──────────────────────┘
```

## 🎨 Color Scheme (Teal Wave)

### Primary (Selected)
- **Background:** `#14b8a6` (Teal 500)
- **Text:** `#ffffff` (White)
- **Use:** Selected dates, active states

### Accent (Range)
- **Background:** `#f0f9ff` (Light Blue 50)
- **Text:** `#0c4a6e` (Blue 900)
- **Use:** Date range middle, hover states

### Muted
- **Background:** `#f7f8fa` (Gray 50)
- **Text:** `#718096` (Gray 600)
- **Use:** Outside dates, labels

## 🔤 Typography

### Button Text
- **Font:** Geist Sans (System font)
- **Size:** 14px (0.875rem)
- **Weight:** 500 (Medium)

### Calendar Labels
- **Font:** Geist Sans
- **Size:** 12px (0.75rem)
- **Weight:** 400 (Regular)

### Selected Range Display
- **Font:** Geist Sans
- **Size:** 14px (0.875rem)
- **Weight:** 400 (Regular)

## 📐 Spacing & Sizing

### Button
- **Height:** 40px
- **Padding:** 12px 16px
- **Border Radius:** 0.75rem (12px)

### Popover
- **Width:** Auto (expands with content)
- **Padding:** 12px
- **Border Radius:** 0.75rem (12px)
- **Shadow:** Medium elevation

### Calendar Cells
- **Size:** 40px × 40px
- **Gap:** 8px between cells
- **Border Radius:** 0.5rem (8px)

### Preset Buttons
- **Height:** 32px
- **Padding:** 8px 12px
- **Border Radius:** 0.5rem (8px)

## ⚡ Interaction States

### 1. Idle
```
┌─────────────────────────────┐
│  📅  Pick a date range   ▼ │  ← Gray border, white bg
└─────────────────────────────┘
```

### 2. Hover
```
┌─────────────────────────────┐
│  📅  Pick a date range   ▼ │  ← Subtle bg change
└─────────────────────────────┘
```

### 3. Focus
```
┌─────────────────────────────┐
│  📅  Pick a date range   ▼ │  ← Teal ring outline
└─────────────────────────────┘
```

### 4. Open
```
┌─────────────────────────────┐
│  📅  Pick a date range   ▲ │  ← Chevron flips up
└─────────────────────────────┘
        ↓
   [Popover Opens]
```

### 5. Selecting Range
```
Step 1: Click start date (Nov 5)
  → Date gets teal background

Step 2: Hover over dates
  → Range preview shows light teal

Step 3: Click end date (Dec 5)
  → Range confirms with teal
  → Popover auto-closes after 300ms
```

## 🎭 Animation Sequences

### Opening Popover
```
Duration: 200ms
Effect: Fade in + Scale up (zoom-in-95)
Timing: ease-out
```

### Closing Popover
```
Duration: 200ms
Effect: Fade out + Scale down (zoom-out-95)
Timing: ease-in
```

### Auto-Close (After Selection)
```
Delay: 300ms after second date selected
Effect: Smooth fade-out
Purpose: Give user time to see selection
```

### Preset Click
```
Delay: 200ms
Effect: Quick fade-out
Purpose: Instant feedback
```

## 🎯 Usage Patterns

### Pattern 1: Analytics Dashboard
```tsx
// Tabs for presets + custom option
[1M] [3M] [6M] [1Y] [📅]
                     ↓
            [Date Range Picker]
```

### Pattern 2: Expense Filtering
```tsx
// Inline with other filters
[Search...] [Type Filter] [Date Range Picker]
```

### Pattern 3: Report Generation
```tsx
// With action buttons
[Date Range Picker] [Refresh] [Export CSV]
```

## 🎨 Theming Examples

### Light Mode
- Background: White (#ffffff)
- Border: Light Gray (#e2e8f0)
- Text: Dark Gray (#1a202c)
- Selected: Teal (#14b8a6)
- Range: Light Blue (#f0f9ff)

### Dark Mode
- Background: Dark Blue (#1e293b)
- Border: Gray (#334155)
- Text: Light Gray (#f9fafb)
- Selected: Teal (#14b8a6) - Same!
- Range: Dark Blue (#0c4a6e)

## 📊 Component Hierarchy

```
DateRangePicker
├── Button (Trigger)
│   ├── CalendarIcon
│   ├── Text (Selected range or placeholder)
│   └── X Icon (Clear button)
│
└── Popover
    └── PopoverContent
        ├── Presets Section
        │   ├── Label ("Quick Select")
        │   └── Preset Buttons (×11)
        │       ├── Today
        │       ├── Yesterday
        │       ├── Last 7 days
        │       ├── Last 14 days
        │       ├── Last 30 days
        │       ├── ─────────
        │       ├── This month
        │       ├── Last month
        │       ├── Last 3 months
        │       ├── Last 6 months
        │       ├── ─────────
        │       ├── This year
        │       └── Last year
        │
        └── Calendar Section
            └── Calendar (DayPicker)
                ├── Month 1
                │   ├── Header (Month/Year)
                │   ├── Nav Buttons (< >)
                │   └── Date Grid
                └── Month 2
                    ├── Header
                    ├── Nav Buttons
                    └── Date Grid
```

## 🎯 Key Measurements

| Element | Desktop | Mobile |
|---------|---------|--------|
| Popover Width | ~700px | 320px |
| Calendar Count | 2 months | 1 month |
| Preset Width | 140px | Full width |
| Cell Size | 40px | 36px |
| Total Height | ~420px | ~500px |

## ✨ Polish Details

1. **Border Separator** between preset groups (dotted line)
2. **Smooth transitions** on all hover states (200ms)
3. **Focus ring** matches primary color (teal)
4. **Today indicator** subtle accent background
5. **Outside dates** grayed out but still selectable
6. **Clear button** only shows when dates selected
7. **Auto-close** smooth fade with 300ms delay
8. **Responsive breakpoint** at 768px
9. **Touch targets** 44px minimum on mobile
10. **Keyboard focus** visible outline on all interactive elements

---

**Visual Design:** ✅ Complete
**Interaction Design:** ✅ Complete
**Responsive Design:** ✅ Complete
**Accessibility:** ✅ Complete

Ready to impress users! 🚀
