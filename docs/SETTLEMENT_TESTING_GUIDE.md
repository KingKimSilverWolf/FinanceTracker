# Settlement System Testing Guide

## Quick Start Testing

### Prerequisites
1. Dev server running (`npm run dev`)
2. At least 2 test users (can use Google OAuth or create accounts)
3. At least 1 test group created

### Basic Test Scenario (5 minutes)

#### Step 1: Create Test Expenses
1. Log in as **User A**
2. Navigate to a group (or create new group with User B)
3. Add first expense:
   - Click "Add Expense"
   - Select "Shared" tab
   - Amount: $60
   - Description: "Dinner"
   - Split: Equal (should be $30 each)
   - Click "Add Expense"

4. Add second expense:
   - Amount: $40
   - Description: "Groceries"
   - Click "Add Expense"

**Expected State:**
- User A paid: $100 total
- User B owes User A: $50 total
- Net balances: A: +$50, B: -$50

#### Step 2: View Balances
1. Scroll to "Balances & Settlements" section on group page
2. Verify summary cards show:
   - Your Net Balance: +$50.00 (green)
   - Owed to You: $50.00
   - You Owe: $0.00
3. Verify pending settlements shows:
   - "User B pays you $50.00"
   - Status: Pending
   - "Mark Settled" button visible

#### Step 3: Mark as Settled
1. Click "Mark Settled" button
2. Settlement dialog opens:
   - Verify amount shows $50.00
   - Verify "From: User B" and "To: User A"
   - Warning message displayed
3. Add note: "Paid via Venmo 12/15"
4. Check confirmation checkbox
5. Click "Confirm Settlement"
6. Verify:
   - Success toast appears
   - Dialog closes
   - Transaction now shows "Settled" badge
   - Balance updates to $0.00
   - "All Settled Up!" message appears

#### Step 4: Log in as User B (Optional)
1. Log out and log in as **User B**
2. Navigate to same group
3. Verify balances show:
   - Your Net Balance: $0.00 (if settlement completed)
   - Or: You Owe: $50.00 (if not settled yet)
4. Should see same settlement status as User A

### Advanced Test Scenarios

#### Test 2: Multiple Expenses with 3+ People
```
Setup:
- Group: User A, User B, User C
- Expense 1: A pays $90, split 3 ways ($30 each)
- Expense 2: B pays $60, split 3 ways ($20 each)
- Expense 3: C pays $30, split 3 ways ($10 each)

Expected Balances:
- User A: +$60 (paid $90, owes $60)
- User B: +$40 (paid $60, owes $60)
- User C: +$20 (paid $30, owes $60)

Expected Simplified Transactions:
- B pays A: $20
- C pays A: $40
```

#### Test 3: Debt Chain (Simplification Test)
```
Setup:
- Group: User A, User B, User C
- Expense 1: A pays $30, only B participates ($15 each)
- Expense 2: B pays $30, only C participates ($15 each)

Expected Balances:
- User A: +$15 (B owes A)
- User B: $0 (neutral)
- User C: -$15 (C owes someone)

Expected Simplified Transactions:
- C pays A: $15 (NOT C→B→A, simplified to C→A directly)

This tests debt simplification algorithm!
```

#### Test 4: Circular Debt (Cancellation Test)
```
Setup:
- Group: User A, User B, User C
- Expense 1: A pays $30, B and C split ($15 each)
- Expense 2: B pays $30, A and C split ($15 each)
- Expense 3: C pays $30, A and B split ($15 each)

Expected Balances:
- Everyone: $0 (all neutral)

Expected Simplified Transactions:
- None! All debts cancel out

This tests circular debt detection!
```

## Verification Checklist

### Visual Verification
- [ ] Summary cards have correct colors (green/red/gray)
- [ ] Icons match status (trending up/down, checkmark, clock)
- [ ] Amounts formatted correctly ($X.XX)
- [ ] Avatars display or show initials
- [ ] Status badges visible and colored correctly
- [ ] Buttons appear/disappear based on status
- [ ] Responsive on mobile (test at 375px width)

### Functional Verification
- [ ] Balances calculate correctly (sum to $0)
- [ ] Simplified transactions are minimal
- [ ] Marking settled updates balance immediately
- [ ] Toast notifications appear on actions
- [ ] Loading spinners show during async operations
- [ ] Error messages display on failures
- [ ] Empty states show when appropriate
- [ ] "All Settled Up" shows when balanced

### Data Integrity Verification
- [ ] Settlement created in Firestore
- [ ] Settlement has correct status (completed)
- [ ] relatedExpenseIds populated
- [ ] createdAt, completedAt timestamps set
- [ ] createdBy, completedBy user IDs recorded
- [ ] notes saved if provided
- [ ] Balance recalculation matches expenses

### Edge Cases
- [ ] Zero balance displays correctly
- [ ] Very large amounts (>$1,000) format correctly
- [ ] Odd cent amounts ($X.XX where XX is odd)
- [ ] Single person in group (no transactions)
- [ ] User leaves group with unsettled debt
- [ ] Expense deleted after settlement created

## Debugging Tips

### If balances don't appear:
1. Check browser console for errors
2. Verify group has expenses
3. Check Firestore rules allow read
4. Verify user is group member
5. Try hard refresh (Cmd/Ctrl + Shift + R)

### If "Mark Settled" fails:
1. Check console for error message
2. Verify user is involved in transaction (from or to)
3. Check Firestore rules allow create/update
4. Verify all required fields populated
5. Check network tab for failed requests

### If balances don't sum to zero:
1. Check console for validation warning
2. Review expenses for correct split data
3. Verify all participants have splitData entries
4. Check for rounding errors (should be < $0.04 for 4 people)
5. Report as bug if sum > $0.10

### If simplification seems wrong:
1. Manually calculate expected transactions
2. Compare with displayed transactions
3. Check if debt chain or circular debt exists
4. Verify algorithm ran (check console logs)
5. Test with simpler scenario to isolate issue

## Performance Testing

### Metrics to Monitor
- Balance calculation time: < 500ms for 100 expenses
- UI render time: < 200ms for 10 transactions
- Mark settled latency: < 1s total (create + complete)
- Page load time: < 2s

### Load Testing Scenarios
1. **Many Expenses**: 100+ expenses in group
2. **Many Members**: 20+ people in group
3. **Many Settlements**: 50+ completed settlements
4. **Complex Splits**: Mix of equal, percentage, custom

### Tools
- Chrome DevTools Performance tab
- React DevTools Profiler
- Network tab for request timing
- Console.time() for function timing

## Automated Testing (Future)

### Unit Tests
```typescript
describe('Balance Calculation', () => {
  it('should calculate 2-person split correctly', () => {
    // Test implementation
  });
  
  it('should simplify debt chain A→B→C to A→C', () => {
    // Test implementation
  });
  
  it('should eliminate circular debts', () => {
    // Test implementation
  });
});

describe('Settlement Operations', () => {
  it('should create settlement with validation', () => {
    // Test implementation
  });
  
  it('should mark settlement as completed', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('Settlement Flow', () => {
  it('should complete full settlement workflow', async () => {
    // 1. Create expenses
    // 2. View balances
    // 3. Mark as settled
    // 4. Verify settlement created
    // 5. Verify balance updated
  });
});
```

### E2E Tests (Playwright/Cypress)
```typescript
test('user can settle debt', async ({ page }) => {
  // 1. Login
  // 2. Navigate to group
  // 3. Click "Mark Settled"
  // 4. Fill form
  // 5. Submit
  // 6. Verify success
});
```

## Reporting Issues

### Bug Report Template
```
Title: [Brief description]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happened]

Screenshots:
[If applicable]

Environment:
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- User Role: [Admin/Member]

Console Errors:
[Any errors from browser console]

Additional Context:
[Any other relevant information]
```

## Success Criteria

Testing is complete when:
- [ ] All basic test scenarios pass
- [ ] At least 2 advanced scenarios tested
- [ ] Edge cases verified
- [ ] Performance acceptable (<1s for operations)
- [ ] No console errors during normal use
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive on mobile (tested at 375px)
- [ ] Accessible (keyboard navigation works)

## Next Steps After Testing

1. **Document any bugs found**
   - Create issues in GitHub/project tracker
   - Prioritize by severity
   - Assign for fixing

2. **User Acceptance Testing**
   - Get feedback from real users
   - Identify UX pain points
   - Gather feature requests

3. **Performance Optimization**
   - Add caching if needed
   - Optimize queries
   - Consider pagination for large datasets

4. **Polish & Refinement**
   - Improve animations/transitions
   - Add micro-interactions
   - Enhance error messages
   - Add helpful tooltips

5. **Production Deployment**
   - Set up monitoring
   - Configure alerts
   - Document deployment process
   - Plan rollback strategy

## Getting Help

If you encounter issues:
1. Check documentation in `/docs` folder
2. Review test cases in `PHASE_4_TEST_CASES.md`
3. Check console for error messages
4. Review Firestore rules and data structure
5. Ask for help with specific error messages

Happy Testing! 🧪✅
