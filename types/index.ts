/**
 * Global TypeScript type definitions for DuoFi
 * Feature-specific types should be defined in their respective feature folders
 */

// Common types used across the application
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Common UI state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Currency types
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

// Date range type
export interface DateRange {
  start: Date;
  end: Date;
}
