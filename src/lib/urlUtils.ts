/**
 * Reusable URL utilities for handling invoice and transaction parameters
 */

export interface InvoiceUrlParams {
  invoice?: string
  transactionId?: string
  expenseId?: string
}

/**
 * Get invoice number from URL search parameters
 */
export const getInvoiceFromUrl = (searchParams: URLSearchParams): string | null => {
  return searchParams.get('invoice')
}

/**
 * Get transaction ID from URL search parameters
 */
export const getTransactionIdFromUrl = (searchParams: URLSearchParams): string | null => {
  return searchParams.get('transactionId')
}

/**
 * Get expense ID from URL search parameters
 */
export const getExpenseIdFromUrl = (searchParams: URLSearchParams): string | null => {
  return searchParams.get('expenseId')
}

/**
 * Create invoice preview URL with invoice number
 */
export const createInvoicePreviewUrl = (invoiceNumber: string): string => {
  return `/invoice/preview?invoice=${encodeURIComponent(invoiceNumber)}`
}

/**
 * Create invoice edit URL with invoice number
 */
export const createInvoiceEditUrl = (invoiceNumber: string): string => {
  return `/invoice/edit?invoice=${encodeURIComponent(invoiceNumber)}`
}

/**
 * Create expense preview URL with expense ID
 */
export const createExpensePreviewUrl = (expenseId: string): string => {
  return `/expense/preview?expenseId=${encodeURIComponent(expenseId)}`
}

/**
 * Parse all URL parameters for invoice/transaction pages
 */
export const parseInvoiceUrlParams = (searchParams: URLSearchParams): InvoiceUrlParams => {
  return {
    invoice: getInvoiceFromUrl(searchParams),
    transactionId: getTransactionIdFromUrl(searchParams),
    expenseId: getExpenseIdFromUrl(searchParams)
  }
}
