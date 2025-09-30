/**
 * Invoice Storage Utilities
 * Handles localStorage operations for invoice data
 * 
 * This file follows the pattern for localStorage utilities:
 * - Define storage keys as constants
 * - Include generic storage helper functions
 * - Export specific functions for the feature
 * 
 * To add new storage utilities, create similar files in this folder
 */

// Storage keys - add new keys here as needed
const STORAGE_KEYS = {
  INVOICE_DRAFT: 'invoice-draft'
} as const

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  lineTotal: number
}

export interface PaymentDetails {
  bankName?: string
  accountNumber?: string
  accountName?: string
  routingNumber?: string
  swiftCode?: string
  paypalEmail?: string
  instructions?: string
}

export interface InvoiceFormData {
  clientName: string
  clientEmail: string
  clientAddress: string
  clientPhone: string
  clientCompanyName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  items: InvoiceItem[]
  notes: string
  subtotal: number
  taxTotal: number
  grandTotal: number
  currency?: string
  currencySymbol?: string
  paymentDetails?: PaymentDetails
}

// Alias for preview page compatibility
export type InvoiceData = InvoiceFormData

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
      localStorage.setItem(key, JSON.stringify(value))
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

// Invoice-specific storage functions
export const invoiceStorage = {
  /**
   * Save invoice draft to localStorage
   */
  saveDraft: (invoiceData: InvoiceFormData): boolean => {
    return storage.setItem(STORAGE_KEYS.INVOICE_DRAFT, invoiceData)
  },

  /**
   * Save invoice draft with debounce for auto-save
   */
  saveDraftDebounced: (invoiceData: InvoiceFormData): void => {
    debouncedStorage.setItem(STORAGE_KEYS.INVOICE_DRAFT, invoiceData)
  },

  /**
   * Get invoice draft from localStorage
   */
  getDraft: (): InvoiceFormData | null => {
    return storage.getItem<InvoiceFormData>(STORAGE_KEYS.INVOICE_DRAFT)
  },

  /**
   * Clear invoice draft from localStorage
   */
  clearDraft: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.INVOICE_DRAFT)
  },

  /**
   * Check if there's a saved draft
   */
  hasDraft: (): boolean => {
    return storage.getItem(STORAGE_KEYS.INVOICE_DRAFT) !== null
  },

  /**
   * Get draft with fallback to default data
   */
  getDraftWithFallback: (): InvoiceFormData => {
    const draft = invoiceStorage.getDraft()
    
    if (draft) {
      return draft
    }

    // Return default invoice data
    return {
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      clientPhone: '',
      clientCompanyName: '',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        {
          id: '1',
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          lineTotal: 0
        }
      ],
      notes: '',
      subtotal: 0,
      taxTotal: 0,
      grandTotal: 0,
      currency: 'USD',
      currencySymbol: '$',
      paymentDetails: undefined
    }
  }
}