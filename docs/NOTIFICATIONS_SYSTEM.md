# Notifications & Budget Alerts System

## Overview

The notifications and budget alerts system provides real-time, in-app notifications to keep users informed about their spending, budgets, and important events. The system automatically monitors budgets, detects unusual spending patterns, and alerts users to large expenses.

## Architecture

### Components

#### 1. **Type System** (`lib/notifications/types.ts`)
- Defines 11 notification types:
  - `budget_warning` - Budget reaching threshold
  - `budget_exceeded` - Budget exceeded
  - `large_expense` - Large single expense
  - `spending_spike` - Unusual spending increase
  - `settlement_due` - Settlement approaching due date
  - `settlement_overdue` - Settlement overdue
  - `recurring_created` - New recurring expense created
  - `recurring_processed` - Recurring expense processed
  - `payment_received` - Payment received
  - `group_invite` - Group invitation
  - `monthly_summary` - Monthly summary report

- **Priority Levels**: `urgent`, `high`, `normal`, `low`
- **Status States**: `unread`, `read`, `archived`

#### 2. **Notification Service** (`lib/notifications/notifications.ts`)
Core CRUD operations for notifications:

```typescript
// Create a new notification
createNotification(notification: Omit<Notification, 'id' | 'createdAt'>)

// Get user's notifications
getUserNotifications(userId: string, limit?: number)

// Mark single/all as read
markNotificationAsRead(notificationId: string)
markAllNotificationsAsRead(userId: string)

// Get notification summary (counts by type/priority)
getNotificationSummary(userId: string)

// Manage preferences
getNotificationPreferences(userId: string)
saveNotificationPreferences(prefs: NotificationPreferences)
```

#### 3. **Budget Monitoring** (`lib/notifications/budget-alerts.ts`)
Automatic budget monitoring and alert generation:

```typescript
// Check all budgets for a user and create alerts if needed
checkBudgetsAndAlert(userId: string)

// Check if an expense is unusually large
checkLargeExpense(userId: string, amount: number, category: string)

// Detect spending spikes compared to average
checkSpendingSpike(userId: string)
```

**Budget Alert Logic:**
- Warning at 80% (configurable) of budget
- Critical alert at 100%
- Projects overage for remaining days
- Compares with previous month spending

#### 4. **UI Components**

##### NotificationBell (`components/notifications/notification-bell.tsx`)
- Bell icon with unread count badge
- Real-time polling (30-second intervals)
- Popover trigger for notification list
- Integrated into desktop sidebar header

##### NotificationList (`components/notifications/notification-list.tsx`)
- Dropdown display of notifications
- Mark all as read functionality
- Empty state with icon
- Loading skeleton
- Scrollable (max 500px height)

##### NotificationItem (`components/notifications/notification-item.tsx`)
- Individual notification card
- Type-specific icons:
  - 💰 Budget warning/exceeded
  - 💳 Large expense
  - 📈 Spending spike
  - 💸 Settlement due/overdue
  - 🔄 Recurring expenses
  - 💵 Payment received
  - 👥 Group invite
  - 📊 Monthly summary
- Priority-based border colors:
  - Red: Urgent
  - Amber: High
  - Blue: Normal
  - Muted: Low
- Click to mark as read
- Link wrapper for actionable notifications

## Settings Pages

### Budget Settings (`components/settings/budget-settings.tsx`)
Configure monthly budget limits:
- Add/remove budgets per category
- Set monthly limit in dollars
- Enable/disable individual budgets
- Global alert threshold (default 80%)

**Features:**
- Multi-budget support (one per category)
- Category dropdown with available categories
- Real-time save to Firestore
- Loading/saving states
- Toast notifications for feedback

### Notification Settings (`components/settings/notification-settings.tsx`)
Configure notification preferences:
- **Budget Alerts:**
  - Warning threshold percentage
  - Enable/disable budget warnings
- **Large Expense Alerts:**
  - Dollar threshold
  - Toggle on/off
- **Spending Spike Detection:**
  - Percentage increase threshold
  - Enable/disable spike detection
- **Notification Channels:**
  - In-app notifications (active)
  - Email notifications (coming soon)
  - Push notifications (coming soon)

### Settings Page (`app/(dashboard)/dashboard/settings/page.tsx`)
Tabbed interface with three sections:
1. **Budgets** - Budget configuration
2. **Notifications** - Alert preferences
3. **General** - Theme and other settings

## Integration Points

### 1. Navigation
**Desktop Sidebar** (`components/navigation/desktop-sidebar.tsx`):
- NotificationBell in header (when expanded)
- Settings nav item added

**Mobile Bottom Nav** (`components/navigation/mobile-bottom-nav.tsx`):
- "More" menu button
- Sheet with notifications section
- Access to Groups, Settlements, Profile, Settings

### 2. Expense Creation
**Automatic Triggers** (`lib/firebase/expenses.ts`):
When a new expense is created, automatically:
1. Check all budgets and generate alerts if thresholds exceeded
2. Check if expense is unusually large
3. Check for spending spikes

**Implementation:**
```typescript
// In createExpense()
Promise.all([
  checkBudgetsAndAlert(userId),
  checkLargeExpense(userId, amount, category),
  checkSpendingSpike(userId),
]).catch(error => {
  console.error('Error checking budgets/notifications:', error);
});
```

## Database Schema

### Firestore Collections

#### `notifications` Collection
```typescript
{
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  readAt?: Date;
}
```

**Indexes Required:**
```json
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

#### `users/{userId}/settings/notifications` Document
```typescript
{
  userId: string;
  budgetWarningEnabled: boolean;
  budgetWarningThreshold: number; // percentage
  budgetExceededEnabled: boolean;
  largeExpenseEnabled: boolean;
  largeExpenseThreshold: number; // in cents
  spendingSpikeEnabled: boolean;
  settlementDueEnabled: boolean;
  settlementReminderDays: number;
  recurringCreatedEnabled: boolean;
  monthlySummaryEnabled: boolean;
  monthlySummaryDay: number;
  groupInviteEnabled: boolean;
  paymentReceivedEnabled: boolean;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `users/{userId}/settings/budgets` Document
```typescript
{
  budgets: Array<{
    category: string;
    monthlyLimit: number; // in cents
    enabled: boolean;
  }>;
  alertThreshold: number; // percentage (default 80)
}
```

## User Flow

### First-Time Setup
1. User navigates to Settings → Budgets
2. Adds budget for desired categories (e.g., "Food & Dining" = $500/month)
3. Navigates to Settings → Notifications
4. Configures alert preferences (thresholds, channels)

### Daily Usage
1. User creates an expense
2. System automatically:
   - Checks if expense exceeds budget threshold → Creates notification
   - Checks if expense is large (> $100 default) → Creates notification
   - Checks if today's spending is spike → Creates notification
3. Bell icon shows unread count badge
4. User clicks bell to view notifications
5. Notifications marked as read on click
6. User can click "Mark all read" for bulk action

### Notification Examples

#### Budget Warning (80% threshold)
```
Title: "Budget Alert: Food & Dining"
Message: "You've spent $420.50 of your $500.00 budget this month (84%)"
Priority: high
Type: budget_warning
```

#### Large Expense
```
Title: "Large Expense Recorded"
Message: "You just added a $250.00 expense for Shopping"
Priority: normal
Type: large_expense
```

#### Spending Spike
```
Title: "Unusual Spending Detected"
Message: "Your spending today is 75% higher than your daily average"
Priority: high
Type: spending_spike
```

## Technical Details

### Polling Strategy
- **Desktop**: 30-second interval when sidebar is expanded
- **Mobile**: On-demand when "More" menu is opened
- Uses React.useEffect with setInterval
- Automatically cleans up on unmount

### Performance Considerations
1. **Async Budget Checks**: Don't block expense creation
2. **Firestore Queries**: Limited to 50 notifications by default
3. **Indexes**: Composite index on userId + createdAt for fast queries
4. **Caching**: React state prevents unnecessary re-renders

### Error Handling
- Budget check failures don't prevent expense creation
- Toast notifications for save/load errors
- Console.error logging for debugging
- Graceful degradation if notification system unavailable

## Future Enhancements

### Phase 1 (Near-term)
- [ ] Email notifications via SendGrid/Resend
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Notification preferences per type
- [ ] Snooze/dismiss functionality

### Phase 2 (Mid-term)
- [ ] Weekly/monthly digest emails
- [ ] Custom notification schedules
- [ ] Notification history/archive page
- [ ] Notification search and filters

### Phase 3 (Long-term)
- [ ] Smart notifications with ML predictions
- [ ] Notification grouping/batching
- [ ] Custom notification rules engine
- [ ] SMS notifications for critical alerts

## Testing

### Manual Testing Checklist
- [ ] Create expense exceeding budget → Verify notification appears
- [ ] Add large expense ($100+) → Verify large expense alert
- [ ] Rapid expense addition → Verify spending spike detection
- [ ] Click bell icon → Verify notification list opens
- [ ] Click notification → Verify marked as read
- [ ] Click "Mark all read" → Verify all marked
- [ ] Update budget settings → Verify saves correctly
- [ ] Update notification settings → Verify saves correctly
- [ ] Test on mobile → Verify "More" menu works
- [ ] Test notification polling → Verify updates automatically

### Unit Test Coverage (TODO)
```typescript
// notifications.test.ts
- createNotification()
- getUserNotifications()
- markNotificationAsRead()
- getNotificationSummary()

// budget-alerts.test.ts
- checkBudgetsAndAlert()
- checkLargeExpense()
- checkSpendingSpike()
- createBudgetNotification()
```

## Troubleshooting

### Notifications Not Appearing
1. Check Firestore rules allow read/write to `notifications` collection
2. Verify userId is correct in notification creation
3. Check browser console for errors
4. Verify notification preferences are enabled

### Budget Alerts Not Triggering
1. Verify budgets are configured in Settings → Budgets
2. Check budget `enabled` field is true
3. Verify expense category matches budget category
4. Check notification preferences have budget alerts enabled

### Bell Icon Not Updating
1. Check polling interval (30 seconds)
2. Verify authentication state
3. Check Firestore query indexes created
4. Clear browser cache and refresh

## Dependencies

```json
{
  "firebase": "^12.6.0",
  "lucide-react": "latest",
  "sonner": "latest",
  "date-fns": "^4.1.0"
}
```

## File Structure

```
lib/
  notifications/
    types.ts              # TypeScript interfaces
    notifications.ts      # Core notification service
    budget-alerts.ts      # Budget monitoring logic
    index.ts             # Module exports

components/
  notifications/
    notification-bell.tsx    # Bell icon with badge
    notification-list.tsx    # Dropdown list
    notification-item.tsx    # Individual card
  settings/
    budget-settings.tsx          # Budget configuration
    notification-settings.tsx    # Alert preferences

app/(dashboard)/dashboard/
  settings/
    page.tsx             # Settings page with tabs
```

## Summary

The notifications and budget alerts system is fully functional and integrated into the DuoFi application. Users can:

1. ✅ Configure monthly budgets per category
2. ✅ Set notification preferences and thresholds
3. ✅ Receive real-time in-app notifications
4. ✅ View notification history with unread count
5. ✅ Get automatic alerts for budget warnings, large expenses, and spending spikes

The system is built with scalability in mind, using Firestore for persistence, async processing for performance, and a modular architecture for easy extension.
