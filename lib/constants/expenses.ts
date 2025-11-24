/**
 * Expense-related constants and configurations
 */

/**
 * Expense categories with icons and colors (Pastel/Light Palette)
 * Softer, more modern colors while maintaining brand recognition
 */
export const EXPENSE_CATEGORIES = {
  // Shared expense categories - Pastel versions
  RENT: { label: 'Rent', icon: '🏠', color: '#C4B5FD', type: 'shared' },
  UTILITIES: { label: 'Utilities', icon: '💡', color: '#93C5FD', type: 'shared' },
  GROCERIES: { label: 'Groceries', icon: '🛒', color: '#6EE7B7', type: 'shared' },
  INTERNET: { label: 'Internet', icon: '📡', color: '#67E8F9', type: 'shared' },
  PARKING: { label: 'Parking', icon: '🅿️', color: '#A5B4FC', type: 'shared' },
  FURNITURE: { label: 'Furniture', icon: '🛋️', color: '#DDD6FE', type: 'shared' },
  HOUSEHOLD: { label: 'Household', icon: '🏡', color: '#5EEAD4', type: 'shared' },
  SUBSCRIPTIONS: { label: 'Subscriptions', icon: '📺', color: '#F9A8D4', type: 'shared' },
  
  // Personal expense categories - Pastel versions
  FOOD: { label: 'Food & Dining', icon: '🍔', color: '#FCD34D', type: 'personal' },
  TRANSPORT: { label: 'Transportation', icon: '🚗', color: '#93C5FD', type: 'personal' },
  ENTERTAINMENT: { label: 'Entertainment', icon: '🎮', color: '#F9A8D4', type: 'personal' },
  HEALTHCARE: { label: 'Healthcare', icon: '🏥', color: '#FCA5A5', type: 'personal' },
  SHOPPING: { label: 'Shopping', icon: '🛍️', color: '#DDD6FE', type: 'personal' },
  EDUCATION: { label: 'Education', icon: '📚', color: '#A5B4FC', type: 'personal' },
  FITNESS: { label: 'Fitness', icon: '💪', color: '#6EE7B7', type: 'personal' },
  PERSONAL_CARE: { label: 'Personal Care', icon: '💅', color: '#FBCFE8', type: 'personal' },
  GIFTS: { label: 'Gifts', icon: '🎁', color: '#FDA4AF', type: 'personal' },
  TRAVEL: { label: 'Travel', icon: '✈️', color: '#A5F3FC', type: 'personal' },
  
  // Both
  OTHER: { label: 'Other', icon: '📝', color: '#D1D5DB', type: 'both' },
} as const;

export type ExpenseCategoryKey = keyof typeof EXPENSE_CATEGORIES;

/**
 * Split methods for shared expenses
 */
export const SPLIT_METHODS = {
  EQUAL: {
    value: 'equal',
    label: 'Split Equally',
    description: 'Divide equally among all members',
    icon: '⚖️',
  },
  PERCENTAGE: {
    value: 'percentage',
    label: 'By Percentage',
    description: 'Split by custom percentages',
    icon: '📊',
  },
  AMOUNT: {
    value: 'amount',
    label: 'By Amount',
    description: 'Specify exact amounts for each person',
    icon: '💰',
  },
  CUSTOM: {
    value: 'custom',
    label: 'Custom Split',
    description: 'Manually assign who pays what',
    icon: '✏️',
  },
} as const;

export type SplitMethod = typeof SPLIT_METHODS[keyof typeof SPLIT_METHODS]['value'];

/**
 * Expense type options
 */
export const EXPENSE_TYPES = {
  SHARED: {
    value: 'shared',
    label: 'Shared',
    description: 'Split with group members',
    icon: '👥',
    color: '#14B8A6',
  },
  PERSONAL: {
    value: 'personal',
    label: 'Personal',
    description: 'Your expense only',
    icon: '💰',
    color: '#8B5CF6',
  },
} as const;

export type ExpenseType = typeof EXPENSE_TYPES[keyof typeof EXPENSE_TYPES]['value'];

/**
 * Payment methods
 */
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  { value: 'venmo', label: 'Venmo', icon: '📱' },
  { value: 'zelle', label: 'Zelle', icon: '📱' },
  { value: 'paypal', label: 'PayPal', icon: '📱' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '💸' },
] as const;

/**
 * Recurring expense frequencies
 */
export const RECURRING_FREQUENCIES = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

/**
 * Get categories by type
 */
export function getCategoriesByType(type: 'shared' | 'personal' | 'all' = 'all') {
  return Object.entries(EXPENSE_CATEGORIES).filter(([, category]) => {
    if (type === 'all') return true;
    return category.type === type || category.type === 'both';
  });
}

/**
 * Get category by key
 */
export function getCategory(key: string) {
  return EXPENSE_CATEGORIES[key as ExpenseCategoryKey] || EXPENSE_CATEGORIES.OTHER;
}

/**
 * Default expense values
 */
export const DEFAULT_EXPENSE = {
  amount: 0,
  description: '',
  category: 'OTHER',
  date: new Date(),
  splitMethod: 'equal' as SplitMethod,
  paymentMethod: 'credit_card',
  recurring: 'none',
} as const;
