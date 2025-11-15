/**
 * Expense Storage Utilities
 * Handles localStorage operations for expense data
 * 
 * This file follows the pattern for localStorage utilities:
 * - Define storage keys as constants
 * - Include generic storage helper functions
 * - Export specific functions for the feature
 */

// Storage keys
const STORAGE_KEYS = {
  EXPENSE_DRAFT: 'expense-draft'
} as const

export interface ExpenseFormData {
  id?: string // Database ID (added after save)
  expense_number?: string // Expense number (added after save)
  description: string
  category: string
  amount: string
  expense_date: string
  notes: string
  client_id?: string
  payment_method: string
  is_tax_deductible: boolean
  tax_rate: string
  currency_code?: string
  receipt_file?: File | null // File object (not stored in localStorage)
  receipt_url?: string
  receipt_filename?: string
  receipt_size?: number
}

// Alias for preview page compatibility
export type ExpenseData = ExpenseFormData

// Generic storage helper functions
const storage = {
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error parsing localStorage item "${key}":`, error)
      return null
    }
  },

  setItem: <T>(key: string, value: T): boolean => {
    try {
      // Remove receipt_file from data before storing (File objects can't be serialized)
      const { receipt_file, ...dataToStore } = value as any
      localStorage.setItem(key, JSON.stringify(dataToStore))
      return true
    } catch (error) {
      console.error(`Error setting localStorage item "${key}":`, error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing localStorage item "${key}":`, error)
      return false
    }
  }
}

// Debounced storage for auto-save
const debounceTimeouts = new Map<string, NodeJS.Timeout>()

const debouncedStorage = {
  setItem: <T>(key: string, value: T, delay: number = 500): void => {
    // Clear existing timeout
    const existingTimeout = debounceTimeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      storage.setItem(key, value)
      debounceTimeouts.delete(key)
    }, delay)

    debounceTimeouts.set(key, timeout)
  },

  cancel: (key: string): void => {
    const timeout = debounceTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      debounceTimeouts.delete(key)
    }
  }
}

// Expense-specific storage functions
export const expenseStorage = {
  /**
   * Save expense draft to localStorage
   */
  saveDraft: (expenseData: ExpenseFormData): boolean => {
    return storage.setItem(STORAGE_KEYS.EXPENSE_DRAFT, expenseData)
  },

  /**
   * Save expense draft with debounce for auto-save
   */
  saveDraftDebounced: (expenseData: ExpenseFormData): void => {
    debouncedStorage.setItem(STORAGE_KEYS.EXPENSE_DRAFT, expenseData)
  },

  /**
   * Get expense draft from localStorage
   */
  getDraft: (): ExpenseFormData | null => {
    return storage.getItem<ExpenseFormData>(STORAGE_KEYS.EXPENSE_DRAFT)
  },

  /**
   * Clear expense draft from localStorage
   */
  clearDraft: (): boolean => {
    debouncedStorage.cancel(STORAGE_KEYS.EXPENSE_DRAFT)
    return storage.removeItem(STORAGE_KEYS.EXPENSE_DRAFT)
  },

  /**
   * Check if there's a saved draft
   */
  hasDraft: (): boolean => {
    return storage.getItem(STORAGE_KEYS.EXPENSE_DRAFT) !== null
  }
}

