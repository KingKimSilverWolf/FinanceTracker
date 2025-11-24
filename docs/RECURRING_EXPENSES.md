# Recurring Expenses - Documentation

## 📋 Overview

The recurring expenses feature allows users to automate the creation of regular, repeating expenses like rent, utilities, subscriptions, and other bills. Once configured, these expenses are automatically created at the specified frequency without manual intervention.

## ✨ Features

### Automation
- **Automatic Creation**: Expenses are auto-created when due
- **Background Processing**: Runs on app startup and hourly while open
- **Smart Scheduling**: Calculates next run date based on frequency
- **End Date Support**: Optional end date for time-limited recurring expenses

### Frequency Options
- **Daily**: Every day
- **Weekly**: Every 7 days
- **Biweekly**: Every 14 days
- **Monthly**: Once per month
- **Quarterly**: Every 3 months
- **Yearly**: Once per year

### Management
- **Pause/Resume**: Temporarily stop recurring expenses without deleting
- **Edit**: Update description, amount, frequency, etc.
- **Delete**: Permanently remove recurring expense template
- **Status Tracking**: Active, Paused, or Completed

### Statistics Dashboard
- **Total Active**: Count of currently running recurring expenses
- **Total Paused**: Count of paused templates
- **Due This Week**: Upcoming expenses in the next 7 days
- **Estimated Monthly**: Projected monthly total from all active recurring expenses

## 🏗️ Technical Architecture

### Database Schema

```typescript
Collection: recurringExpenses

Document Fields:
- id: string                    // Firestore document ID
- description: string           // "Monthly Rent"
- amount: number                // Amount in cents
- category: string              // "Rent", "Utilities", etc.
- groupId: string               // Reference to group
- paidBy: string                // User ID who pays
- splitBetween: string[]        // Array of user IDs
- frequency: RecurringFrequency // daily|weekly|biweekly|monthly|quarterly|yearly
- startDate: Timestamp          // When to start creating expenses
- endDate: Timestamp?           // Optional end date
- nextRunDate: Timestamp        // When to create next expense
- status: RecurringStatus       // active|paused|completed
- createdBy: string             // User ID who created template
- createdAt: Timestamp
- updatedAt: Timestamp
- lastCreatedAt: Timestamp?     // Last time an expense was created
- totalCreated: number          // Count of expenses created
- notes: string?                // Optional notes
```

### Firestore Indexes Required

```
Collection: recurringExpenses
Composite Indexes:
1. createdBy (Ascending) + status (Ascending) + nextRunDate (Ascending)
   - Used for: Querying due expenses per user
   - Query: getUserRecurringExpenses()
   
2. groupId (Ascending) + status (Ascending) + nextRunDate (Ascending)
   - Used for: Group-specific recurring expenses
   - Query: getGroupRecurringExpenses()
```

## 📁 File Structure

```
lib/
├── firebase/
│   └── recurring.ts                    # Firebase CRUD operations
├── recurring/
│   └── types.ts                        # TypeScript interfaces

components/
└── recurring/
    └── automation-processor.tsx        # Background automation component

app/(dashboard)/dashboard/recurring/
├── page.tsx                            # Recurring expenses list page
└── new/
    └── page.tsx                        # Create new recurring expense form
```

## 🔄 Automation Flow

### Process Flow
1. **User creates recurring expense template** via form
2. **Template stored in Firestore** with nextRunDate = startDate
3. **Background processor runs**:
   - On app startup
   - Every hour while app is open
4. **For each due expense** (nextRunDate <= today):
   - Create actual expense in expenses collection
   - Update recurring template:
     - lastCreatedAt = now
     - totalCreated++
     - nextRunDate = calculated next date
5. **If end date passed**: Mark as "completed"

### Next Date Calculation

```typescript
function calculateNextRunDate(currentDate: Date, frequency: RecurringFrequency): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
  }
  
  return next;
}
```

## 📊 API Reference

### Firebase Functions

#### `createRecurringExpense()`
Creates a new recurring expense template.

```typescript
await createRecurringExpense(formData: RecurringExpenseFormData, userId: string): Promise<string>
```

**Parameters:**
- `formData`: Expense details (description, amount, frequency, etc.)
- `userId`: ID of user creating the template

**Returns:** Document ID of created template

---

#### `getUserRecurringExpenses()`
Gets all recurring expenses for a user.

```typescript
await getUserRecurringExpenses(userId: string): Promise<RecurringExpense[]>
```

**Parameters:**
- `userId`: User ID to fetch templates for

**Returns:** Array of recurring expense templates

---

#### `getGroupRecurringExpenses()`
Gets active recurring expenses for a specific group.

```typescript
await getGroupRecurringExpenses(groupId: string): Promise<RecurringExpense[]>
```

**Parameters:**
- `groupId`: Group ID to fetch templates for

**Returns:** Array of active recurring expenses

---

#### `updateRecurringExpense()`
Updates an existing recurring expense template.

```typescript
await updateRecurringExpense(recurringId: string, updates: Partial<RecurringExpenseFormData>): Promise<void>
```

**Parameters:**
- `recurringId`: Template document ID
- `updates`: Fields to update

---

#### `toggleRecurringExpenseStatus()`
Pauses or resumes a recurring expense.

```typescript
await toggleRecurringExpenseStatus(recurringId: string, newStatus: 'active' | 'paused'): Promise<void>
```

**Parameters:**
- `recurringId`: Template document ID
- `newStatus`: New status (active or paused)

---

#### `deleteRecurringExpense()`
Permanently deletes a recurring expense template.

```typescript
await deleteRecurringExpense(recurringId: string): Promise<void>
```

**Parameters:**
- `recurringId`: Template document ID to delete

---

#### `processRecurringExpenses()`
Main automation function - checks and creates due expenses.

```typescript
await processRecurringExpenses(userId: string): Promise<number>
```

**Parameters:**
- `userId`: User ID to process templates for

**Returns:** Count of expenses created

**When Called:**
- On app startup
- Every hour while app is open
- Manually via recurring expenses page

---

#### `getRecurringExpenseStats()`
Calculates statistics about user's recurring expenses.

```typescript
await getRecurringExpenseStats(userId: string): Promise<RecurringExpenseStats>
```

**Parameters:**
- `userId`: User ID to calculate stats for

**Returns:**
```typescript
{
  totalActive: number         // Count of active templates
  totalPaused: number         // Count of paused templates
  upcomingThisWeek: number    // Due in next 7 days
  upcomingThisMonth: number   // Due in next 30 days
  totalAmountPerMonth: number // Estimated monthly total in cents
}
```

## 🎨 UI Components

### Pages

#### `/dashboard/recurring`
Main recurring expenses dashboard showing:
- Statistics cards (Active, Paused, Due This Week, Est. Monthly)
- Filter tabs (All, Active, Paused)
- List of recurring expenses with actions
- Empty state for no templates

#### `/dashboard/recurring/new`
Form to create new recurring expense:
- Description (required)
- Amount (required)
- Category selector
- Group selector (required)
- Frequency selector (required)
- Start date (required)
- End date (optional)
- Notes (optional)

### Navigation

Updated navigation components to include recurring expenses:
- **Desktop Sidebar**: Clock icon, "Recurring" label
- **Mobile Bottom Nav**: Clock icon, "Recurring" label
- **Position**: Between "Expenses" and "Settlements"

## 🧪 Testing Checklist

### Manual Testing

- [ ] Create recurring expense with daily frequency
- [ ] Create recurring expense with monthly frequency
- [ ] Verify expense auto-created on due date
- [ ] Pause recurring expense - verify no creation
- [ ] Resume paused expense - verify creation resumes
- [ ] Edit recurring expense details
- [ ] Delete recurring expense
- [ ] Verify end date stops creation
- [ ] Check statistics update correctly
- [ ] Test with multiple groups
- [ ] Test empty state (no recurring expenses)
- [ ] Test navigation from mobile and desktop

### Edge Cases

- [ ] Start date in past - should create immediately
- [ ] End date before next run - should mark completed
- [ ] Multiple expenses due same day
- [ ] User with no groups - should show message
- [ ] Very high frequency (daily) - performance check
- [ ] Very low frequency (yearly) - date calculation check
- [ ] Expense creation fails - handle gracefully

## 🚀 Future Enhancements

### Planned Features
- [ ] Email/push notifications before due date
- [ ] Variable amounts (e.g., utility bills that change monthly)
- [ ] Custom frequency (e.g., every 10 days)
- [ ] Bulk edit multiple recurring expenses
- [ ] Templates/presets for common recurring expenses
- [ ] Calendar view of upcoming recurring expenses
- [ ] History of all auto-created expenses from template
- [ ] Recurring expense suggestions based on patterns

### Advanced Features
- [ ] Machine learning to predict variable amounts
- [ ] Integration with bank APIs for auto-sync
- [ ] Recurring expense sharing/copying between groups
- [ ] Conditional rules (e.g., only create if balance > X)
- [ ] Multiple currencies support
- [ ] Tax category tagging for recurring expenses

## 📝 Best Practices

### For Users
1. **Use descriptive names**: "Monthly Netflix" instead of just "Netflix"
2. **Set end dates**: For time-limited subscriptions or leases
3. **Review monthly**: Check auto-created expenses for accuracy
4. **Use categories**: Makes analytics more useful
5. **Add notes**: Document why expense exists or special conditions

### For Developers
1. **Error handling**: All Firebase operations wrapped in try-catch
2. **Type safety**: Full TypeScript coverage
3. **Idempotency**: Safe to run automation multiple times
4. **Performance**: Batch operations where possible
5. **Testing**: Test with various frequencies and edge cases
6. **Logging**: Console log automation events for debugging

## 🐛 Known Issues / Limitations

### Current Limitations
1. **Processing frequency**: Only runs hourly, not real-time
2. **Timezone handling**: Uses browser timezone, may cause issues for global users
3. **No notifications**: Users must open app for processing to run
4. **No history view**: Can't see list of all expenses created from a template
5. **Equal split only**: Auto-created expenses always split equally

### Workarounds
1. **Processing**: Users can manually visit recurring page to trigger processing
2. **Timezone**: Document expected behavior in help section
3. **Notifications**: Phase 2 enhancement
4. **History**: Can filter expenses by description pattern
5. **Split**: Edit auto-created expense after creation if needed

## 🔐 Security Considerations

### Firestore Rules
```javascript
match /recurringExpenses/{recurringId} {
  // Allow read if user is member of the group
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/groups/$(resource.data.groupId)).data.members.hasAny([request.auth.uid]);
  
  // Allow create if user is creating for their own group
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.createdBy &&
    get(/databases/$(database)/documents/groups/$(request.resource.data.groupId)).data.members.hasAny([request.auth.uid]);
  
  // Allow update/delete if user created the template
  allow update, delete: if request.auth != null && 
    request.auth.uid == resource.data.createdBy;
}
```

### Data Validation
- Amount must be positive integer (cents)
- Start date cannot be more than 1 year in past
- End date must be after start date
- Frequency must be valid enum value
- Group must exist and user must be member
- Split between must include valid user IDs

## 📚 Related Documentation

- [Firebase Expenses Service](../lib/firebase/expenses.ts)
- [Groups Management](../lib/firebase/groups.ts)
- [TypeScript Types](../lib/recurring/types.ts)
- [Project Plan](./PROJECT_PLAN.md)
