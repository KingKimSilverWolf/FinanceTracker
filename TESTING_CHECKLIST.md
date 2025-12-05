# DuoFi - Complete Feature Testing Checklist

Test all 3 newly implemented features: Edit Expense, Settlement Payment Tracking, and Onboarding Flow.

---

## 🧪 Test Environment Setup

1. **Browser**: Use Chrome/Safari with DevTools open (Console tab)
2. **Authentication**: Make sure you're logged in
3. **Data**: Have at least one group and a few expenses created
4. **Clean State**: Clear localStorage for onboarding test: `localStorage.removeItem('duofi-onboarded')`

---

## ✅ FEATURE 1: Edit Expense Functionality

### Test 1.1: Edit Shared Expense - Change Amount
**Steps:**
1. Navigate to Dashboard → Expenses
2. Click on any **shared expense** (has group icon)
3. Click "Edit" button in top right
4. Change the amount (e.g., from $50.00 to $75.00)
5. Click "Update Expense"

**Expected Results:**
- ✅ Dialog opens with all fields pre-filled
- ✅ Amount shows in dollars (not cents)
- ✅ Success toast appears
- ✅ Dialog closes automatically
- ✅ Expense detail page refreshes with new amount
- ✅ "Updated" timestamp shows at bottom of page
- ✅ Group balances update accordingly

**Notes:** _______________

---

### Test 1.2: Edit Shared Expense - Change Description & Category
**Steps:**
1. Open a shared expense
2. Click "Edit"
3. Change description (e.g., "Groceries" → "Whole Foods Grocery Run")
4. Change category (try different category icon)
5. Add or edit notes field
6. Click "Update Expense"

**Expected Results:**
- ✅ All fields update successfully
- ✅ Category icon changes in UI
- ✅ Description updates on detail page
- ✅ Notes show if added

**Notes:** _______________

---

### Test 1.3: Edit Personal Expense
**Steps:**
1. Navigate to a **personal expense** (no group)
2. Click "Edit"
3. Form should show personal expense fields only (no group/split)
4. Change amount, category, and date
5. Click "Update Expense"

**Expected Results:**
- ✅ Personal expense form shows (simpler than shared)
- ✅ No group/paidBy/splitMethod fields
- ✅ Updates save correctly
- ✅ Page refreshes with new data

**Notes:** _______________

---

### Test 1.4: Edit Expense - Change Date & Payment Method
**Steps:**
1. Open any expense
2. Click "Edit"
3. Change the date using date picker
4. Change payment method (Cash → Card, etc.)
5. Click "Update Expense"

**Expected Results:**
- ✅ Date picker works correctly
- ✅ Date updates in expense details
- ✅ Payment method updates
- ✅ Expense sorts correctly in lists

**Notes:** _______________

---

### Test 1.5: Edit Expense - Validation
**Steps:**
1. Open any expense
2. Click "Edit"
3. Try to clear the description field (leave it empty)
4. Try to set amount to 0 or negative number
5. Click "Update Expense"

**Expected Results:**
- ✅ Validation errors show
- ✅ Form doesn't submit with invalid data
- ✅ Error messages are clear
- ✅ Cancel button works

**Notes:** _______________

---

### Test 1.6: Edit Expense - Only Owner Can Edit
**Steps:**
1. View an expense you didn't create (if in a group)
2. Check if Edit button appears

**Expected Results:**
- ✅ Edit button only shows for expense owner
- ✅ Other members can view but not edit

**Notes:** _______________

---

## 💰 FEATURE 2: Settlement Payment Tracking

### Test 2.1: View Pending Settlements
**Steps:**
1. Navigate to Dashboard or Group page
2. Look for "Pending Settlements" section
3. Find a settlement where you owe someone

**Expected Results:**
- ✅ Settlements show: "You pay [Person] $X.XX"
- ✅ "Mark as Paid" button appears
- ✅ Amount and direction are clear
- ✅ Avatar and names show correctly

**Notes:** _______________

---

### Test 2.2: Mark Settlement as Paid (Happy Path)
**Steps:**
1. Click "Mark as Paid" on a settlement where YOU owe money
2. Payment dialog opens
3. Review the payment summary (Payer → Receiver)
4. Select payment method (try "Venmo")
5. Add optional note: "Paid via Venmo @username"
6. Click "Confirm Payment"

**Expected Results:**
- ✅ Dialog shows correct payer/receiver with avatars
- ✅ Amount displays prominently
- ✅ Payment method selector works
- ✅ Notes field accepts text (500 char limit)
- ✅ Success toast appears
- ✅ Dialog closes
- ✅ Redirects to newly created expense page
- ✅ Expense description: "Settlement payment: You → [Person]"
- ✅ Category is "Other"
- ✅ Notes include original amount
- ✅ Settlement disappears from pending list
- ✅ Group balances update

**Notes:** _______________

---

### Test 2.3: Mark Settlement as Paid - Different Payment Methods
**Steps:**
1. Mark another settlement as paid
2. Try different payment methods:
   - 💵 Cash
   - 🏦 Bank Transfer
   - 💳 Card
   - ⚡ Zelle
   - 💰 PayPal

**Expected Results:**
- ✅ All payment methods selectable
- ✅ Icons show correctly
- ✅ Payment method saves to expense

**Notes:** _______________

---

### Test 2.4: Settlement Payment - Receiver View
**Steps:**
1. Find a settlement where someone owes YOU money
2. Click "Mark as Paid"
3. Dialog opens showing you're the receiver

**Expected Results:**
- ✅ Dialog shows informational message
- ✅ Yellow warning box: "Only [Payer] can mark it as paid"
- ✅ Payment method selector is disabled or hidden
- ✅ "Confirm Payment" button doesn't show or is disabled
- ✅ Only "Cancel" button available

**Notes:** _______________

---

### Test 2.5: Settlement Payment - Notifications
**Steps:**
1. Mark a settlement as paid
2. Check notifications (bell icon)
3. If possible, have the other person check their notifications

**Expected Results:**
- ✅ Payer receives: "Your payment of $X.XX to [Person] has been recorded"
- ✅ Receiver receives: "[Person] marked the settlement of $X.XX as paid"
- ✅ Both notifications link to the expense
- ✅ Clicking notification opens expense detail page

**Notes:** _______________

---

### Test 2.6: Settlement Payment - Created Expense Validation
**Steps:**
1. After marking settlement as paid
2. Navigate to the created expense (from notification or redirect)
3. Verify expense details

**Expected Results:**
- ✅ Expense type: Shared
- ✅ Payer: Person who owed money
- ✅ Amount: Exact settlement amount
- ✅ Split: Custom split (100% to receiver)
- ✅ Category: "Other"
- ✅ Date: Today's date
- ✅ Notes: Includes settlement info
- ✅ Payment method: What you selected
- ✅ Expense appears in both users' lists

**Notes:** _______________

---

### Test 2.7: Settlement Balance Recalculation
**Steps:**
1. Note group balance before payment: "You owe $50"
2. Mark settlement as paid
3. Go back to group settlements page
4. Check new balances

**Expected Results:**
- ✅ Original settlement no longer shows
- ✅ Balance updates to account for payment
- ✅ New net balance is correct
- ✅ No duplicate settlements appear

**Notes:** _______________

---

## 🎓 FEATURE 3: Onboarding Flow

### Test 3.1: First-Time User Onboarding (Clean Slate)
**Preparation:**
1. Open DevTools Console
2. Run: `localStorage.removeItem('duofi-onboarded')`
3. Make sure you have NO groups and NO expenses (or use a new account)
4. Refresh the dashboard page

**Steps:**
1. Wait 0.5 seconds after page load
2. Onboarding dialog should auto-open

**Expected Results:**
- ✅ Dialog opens automatically
- ✅ Shows "Welcome to DuoFi" with sparkle icon
- ✅ Progress bar shows 1/4 (25%)
- ✅ "Skip Tour" button available
- ✅ Welcome screen shows 3 feature cards:
  - Create Groups
  - Track Expenses
  - Settle Up
- ✅ "Get Started" button present

**Notes:** _______________

---

### Test 3.2: Onboarding - Step Navigation
**Steps:**
1. Click "Get Started" from welcome screen
2. Should advance to Step 2: "Create your first group"
3. Progress bar shows 2/4 (50%)
4. Read the guidance text and examples
5. Click "Skip for Now"
6. Should advance to Step 3: "Add your first expense"
7. Progress bar shows 3/4 (75%)
8. Click "Skip for Now" again
9. Should advance to Step 4: "Complete"
10. Progress bar shows 4/4 (100%)

**Expected Results:**
- ✅ Each step advances correctly
- ✅ Progress bar updates
- ✅ Step indicators highlight current step
- ✅ Can skip steps
- ✅ Final screen shows success message
- ✅ "What's Next?" list displays

**Notes:** _______________

---

### Test 3.3: Onboarding - Create Group from Wizard
**Steps:**
1. Start onboarding again (clear localStorage and refresh)
2. Click "Get Started"
3. On Step 2 (Create Group), click "Create Group" button
4. Notice dialog temporarily closes
5. In ~0.3 seconds, should see success checkmark: "Group created!"
6. Wizard advances to Step 3 automatically

**Expected Results:**
- ✅ Dialog closes to allow group creation
- ✅ Success indicator shows
- ✅ Automatically advances to next step
- ✅ Can continue or skip

**Notes:** _______________

---

### Test 3.4: Onboarding - Add Expense from Wizard
**Steps:**
1. During onboarding, reach Step 3 (Add Expense)
2. Click "Add Expense" button
3. Dialog closes temporarily
4. Success checkmark: "Expense added!"
5. Advances to completion screen

**Expected Results:**
- ✅ Dialog management works
- ✅ Success feedback shows
- ✅ Advances to final step

**Notes:** _______________

---

### Test 3.5: Onboarding - Complete and Dismiss
**Steps:**
1. Reach the final "Complete" screen
2. Read the "What's Next?" checklist
3. Click "Go to Dashboard"
4. Dialog closes

**Expected Results:**
- ✅ Dialog closes
- ✅ Dashboard shows normally
- ✅ `localStorage.getItem('duofi-onboarded')` returns "true"
- ✅ Refreshing page doesn't show onboarding again

**Notes:** _______________

---

### Test 3.6: Onboarding - Skip Functionality
**Steps:**
1. Clear localStorage and refresh
2. Wait for onboarding dialog
3. Click X button (top right) OR "Skip Tour" button
4. Dialog should close immediately

**Expected Results:**
- ✅ Dialog closes
- ✅ Onboarding marked as complete
- ✅ Doesn't show again

**Notes:** _______________

---

### Test 3.7: Onboarding Checklist Widget - Display
**Steps:**
1. Have at least 1 group or 1 expense (but not fully complete)
2. Refresh dashboard
3. Look for checklist widget at top (below welcome message)

**Expected Results:**
- ✅ Widget displays with border and gradient background
- ✅ Title: "Get Started with DuoFi"
- ✅ Progress bar shows X/4 tasks
- ✅ Shows 4 checklist items:
  - Create your first group (with icon)
  - Add an expense
  - Check your analytics
  - Set up a budget
- ✅ Completed items have green checkmark and background
- ✅ Incomplete items have outline and "Go" button

**Notes:** _______________

---

### Test 3.8: Onboarding Checklist - Task Completion
**Steps:**
1. View checklist widget
2. If "Create group" is incomplete, click "Go" button
3. Should navigate to groups page
4. Create a group
5. Return to dashboard
6. Check if "Create group" is now marked complete

**Expected Results:**
- ✅ "Go" buttons navigate correctly
- ✅ Completed tasks show green checkmark
- ✅ Progress bar updates (e.g., 2/4 → 3/4)
- ✅ Line-through text on completed items

**Notes:** _______________

---

### Test 3.9: Onboarding Checklist - Collapse/Expand
**Steps:**
1. View checklist widget
2. Click chevron button (up arrow)
3. Widget collapses showing only header
4. Click chevron again (down arrow)
5. Widget expands showing all items

**Expected Results:**
- ✅ Collapse animation smooth
- ✅ Expand animation smooth
- ✅ Header always visible
- ✅ Icon changes: ChevronUp ↔ ChevronDown

**Notes:** _______________

---

### Test 3.10: Onboarding Checklist - Dismiss
**Steps:**
1. View checklist widget
2. Click X button (top right)
3. Widget disappears

**Expected Results:**
- ✅ Widget removes from DOM
- ✅ Dashboard layout adjusts
- ✅ Doesn't reappear on refresh (session)

**Notes:** _______________

---

### Test 3.11: Onboarding Checklist - Auto-Dismiss on Completion
**Steps:**
1. Have 3 out of 4 tasks complete
2. Complete the final task (e.g., visit analytics, set budget)
3. Return to dashboard
4. Checklist should show "All Set! 🎉"
5. Wait 3 seconds

**Expected Results:**
- ✅ Title changes to "All Set! 🎉"
- ✅ Description changes to success message
- ✅ Shows "This card will auto-dismiss in a few seconds"
- ✅ After 3 seconds, widget fades out and disappears
- ✅ Dashboard adjusts layout

**Notes:** _______________

---

### Test 3.12: Onboarding - Conditional Display Logic
**Steps:**
1. Create a new account or clear all data
2. Dashboard with no groups/expenses → onboarding wizard shows
3. Create 1 group
4. Refresh → checklist widget shows (not wizard)
5. Create 2+ groups and 3+ expenses
6. Refresh → neither widget nor wizard shows

**Expected Results:**
- ✅ New users see wizard
- ✅ Users with some data see checklist
- ✅ Experienced users see neither
- ✅ Logic based on groups/expenses count

**Notes:** _______________

---

## 🔄 Cross-Feature Integration Tests

### Test 4.1: Edit Expense After Settlement Payment
**Steps:**
1. Mark a settlement as paid (creates expense)
2. Navigate to that settlement payment expense
3. Try to edit the settlement payment expense

**Expected Results:**
- ✅ Can edit the settlement expense
- ✅ Description makes it clear it's a settlement
- ✅ Editing doesn't break balance calculations

**Notes:** _______________

---

### Test 4.2: Onboarding → Create Group → Add Expense → Edit
**Steps:**
1. Go through full onboarding flow
2. Create group during onboarding
3. Add expense during onboarding
4. After completion, edit that expense

**Expected Results:**
- ✅ Full flow works end-to-end
- ✅ Created items are editable
- ✅ No errors in console

**Notes:** _______________

---

### Test 4.3: Settlement Payment Creates Editable Expense
**Steps:**
1. Mark settlement as paid
2. Go to created expense
3. Edit that expense (change notes, payment method)
4. Verify balances still correct

**Expected Results:**
- ✅ Settlement expenses are fully editable
- ✅ Edits don't break settlement tracking
- ✅ Balance calculations remain accurate

**Notes:** _______________

---

## 🐛 Error Handling & Edge Cases

### Test 5.1: Edit Expense - Network Error Simulation
**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to edit an expense
4. Click "Update Expense"

**Expected Results:**
- ✅ Loading state shows
- ✅ Error toast appears with clear message
- ✅ Form doesn't close
- ✅ User can retry when back online

**Notes:** _______________

---

### Test 5.2: Settlement Payment - Double Click Prevention
**Steps:**
1. Click "Mark as Paid"
2. Quickly click "Confirm Payment" multiple times

**Expected Results:**
- ✅ Button disables after first click
- ✅ Shows loading state
- ✅ Only creates one expense
- ✅ No duplicate settlements

**Notes:** _______________

---

### Test 5.3: Onboarding - Interrupt and Resume
**Steps:**
1. Start onboarding
2. Close browser tab mid-flow
3. Reopen and go to dashboard

**Expected Results:**
- ✅ Onboarding restarts from beginning OR
- ✅ Doesn't show again (depends on implementation)
- ✅ No broken state
- ✅ No console errors

**Notes:** _______________

---

## ✅ Final Verification

### Overall System Check
- [ ] No console errors across all tests
- [ ] All TypeScript types are correct
- [ ] All toasts appear and are readable
- [ ] All animations are smooth
- [ ] Mobile responsive (if applicable)
- [ ] Dark mode works correctly
- [ ] All navigation links work
- [ ] Data persists after page refresh
- [ ] Can use browser back button without issues

### Performance Check
- [ ] Dialogs open quickly (<300ms)
- [ ] Form submissions complete in <2s
- [ ] Page doesn't freeze during operations
- [ ] No memory leaks (check DevTools Memory tab)

### Accessibility Check
- [ ] Can tab through all forms
- [ ] Dialogs trap focus correctly
- [ ] Labels are clear and descriptive
- [ ] Color contrast is sufficient
- [ ] Error messages are helpful

---

## 📝 Test Summary

**Tester Name:** _______________  
**Date Tested:** _______________  
**Browser/Device:** _______________  

**Total Tests:** 45+  
**Tests Passed:** _______________  
**Tests Failed:** _______________  
**Critical Issues:** _______________  

**Overall Status:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ NEEDS WORK

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## 🎯 Priority Issues to Fix (if any)

1. _____________________________________
2. _____________________________________
3. _____________________________________

---

**Happy Testing! 🚀**

Report any issues you find and we'll fix them together!
