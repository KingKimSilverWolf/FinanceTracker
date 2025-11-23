/**
 * Global constants for DuoFi application
 */

// App metadata
export const APP_NAME = 'DuoFi';
export const APP_TAGLINE = 'Finance for two or more, simplified';
export const APP_DESCRIPTION =
  'Track shared expenses, split bills, and settle up with friends, roommates, or family.';

// API endpoints (when we add backend)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Date formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const MONTH_FORMAT = 'MMMM yyyy';

// Currency
export const DEFAULT_CURRENCY = 'USD';
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

// Group settings
export const MIN_GROUP_SIZE = 2;
export const MAX_GROUP_SIZE = 50; // Reasonable limit for performance

// Expense categories (system defaults)
export const EXPENSE_CATEGORIES = [
  { id: 'rent', name: 'Rent', icon: '🏠', color: '#14B8A6' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#3B82F6' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84CC16' },
  { id: 'restaurants', name: 'Restaurants', icon: '🍽️', color: '#F59E0B' },
  { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#8B5CF6' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#EC4899' },
  { id: 'healthcare', name: 'Healthcare', icon: '⚕️', color: '#EF4444' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#06B6D4' },
  { id: 'other', name: 'Other', icon: '📌', color: '#6B7280' },
] as const;

// Split types
export const SPLIT_TYPES = {
  EQUAL: 'equal',
  PERCENTAGE: 'percentage',
  CUSTOM: 'custom',
  AMOUNT: 'amount',
} as const;

// Group types
export const GROUP_TYPES = {
  COUPLE: 'couple',
  ROOMMATES: 'roommates',
  FRIENDS: 'friends',
  FAMILY: 'family',
  OTHER: 'other',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  EXPENSES: '/expenses',
  SETTLEMENT: '/settlement',
  ANALYTICS: '/analytics',
  GROUPS: '/groups',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;
