import { supabase } from './supabaseClient'
import toast from 'react-hot-toast'

export interface StatusUpdateResult {
  success: boolean
  message: string
}

// Valid statuses that match StatusButton component
const VALID_STATUSES = ['draft', 'pending', 'paid', 'overdue', 'spent', 'expense', 'due'] as const
type ValidStatus = typeof VALID_STATUSES[number]

/**
 * Simple status validation and management
 */
export class StatusLogic {
  /**
   * Get valid status from database status
   * This is the main function that components should use
   */
  static getValidStatus(dbStatus: string): ValidStatus {
    // Check if the status from DB matches our valid statuses
    if (VALID_STATUSES.includes(dbStatus as ValidStatus)) {
      return dbStatus as ValidStatus
    }
    
    // Handle common database status variations
    const statusMap: Record<string, ValidStatus> = {
      'draft': 'draft',
      'pending': 'pending', 
      'paid': 'paid',
      'overdue': 'overdue',
      'spent': 'spent',
      'expense': 'expense',
      'due': 'due',
      // Handle any variations
      'DRAFT': 'draft',
      'PENDING': 'pending',
      'PAID': 'paid',
      'OVERDUE': 'overdue',
      'SPENT': 'spent',
      'EXPENSE': 'expense',
      'DUE': 'due'
    }
    
    return statusMap[dbStatus] || 'pending' // Default fallback
  }

  /**
   * Update invoice status using the database function
   */
  static async updateInvoiceStatus(
    invoiceId: string, 
    newStatus: ValidStatus,
    userId: string
  ): Promise<StatusUpdateResult> {
    try {
      const { error } = await supabase.rpc('update_invoice_status', {
        invoice_id: invoiceId,
        new_status: newStatus
      })

      if (error) {
        console.error('Error updating invoice status:', error)
        return {
          success: false,
          message: `Failed to update status: ${error.message}`
        }
      }

      const statusMessages = {
        draft: 'Invoice saved as draft',
        pending: 'Invoice marked as pending',
        paid: 'Invoice marked as paid',
        overdue: 'Invoice marked as overdue',
        due: 'Invoice marked as due'
      }

      return {
        success: true,
        message: statusMessages[newStatus] || 'Status updated'
      }
    } catch (error) {
      console.error('Error updating invoice status:', error)
      return {
        success: false,
        message: 'Failed to update invoice status'
      }
    }
  }

  /**
   * Update expense status directly in the database
   */
  static async updateExpenseStatus(
    expenseId: string,
    newStatus: ValidStatus,
    userId: string
  ): Promise<StatusUpdateResult> {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating expense status:', error)
        return {
          success: false,
          message: `Failed to update status: ${error.message}`
        }
      }

      const statusMessages = {
        spent: 'Expense marked as spent',
        expense: 'Expense marked as expense',
        draft: 'Expense saved as draft',
        pending: 'Expense marked as pending'
      }

      return {
        success: true,
        message: statusMessages[newStatus] || 'Status updated'
      }
    } catch (error) {
      console.error('Error updating expense status:', error)
      return {
        success: false,
        message: 'Failed to update expense status'
      }
    }
  }

  /**
   * Handle transaction action (mark as paid, pending, delete, etc.)
   */
  static async handleTransactionAction(
    transactionId: string,
    action: string,
    userId: string
  ): Promise<StatusUpdateResult> {
    try {
      // First, get the transaction to determine if it's an invoice or expense
      const { data: transaction, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        // Try expenses table
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('id, status')
          .eq('id', transactionId)
          .eq('user_id', userId)
          .single()

        if (expenseError) {
          return {
            success: false,
            message: 'Transaction not found'
          }
        }

        // Handle expense actions
        return await this.updateExpenseStatus(transactionId, action as ValidStatus, userId)
      }

      // Handle invoice actions
      return await this.updateInvoiceStatus(transactionId, action as ValidStatus, userId)
    } catch (error) {
      console.error('Error handling transaction action:', error)
      return {
        success: false,
        message: 'Failed to perform action'
      }
    }
  }

  /**
   * Delete transaction (invoice or expense)
   */
  static async deleteTransaction(
    transactionId: string,
    transactionType: 'invoice' | 'expense',
    userId: string
  ): Promise<StatusUpdateResult> {
    try {
      const tableName = transactionType === 'invoice' ? 'invoices' : 'expenses'
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (error) {
        console.error(`Error deleting ${transactionType}:`, error)
        return {
          success: false,
          message: `Failed to delete ${transactionType}: ${error.message}`
        }
      }

      return {
        success: true,
        message: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} deleted successfully`
      }
    } catch (error) {
      console.error(`Error deleting ${transactionType}:`, error)
      return {
        success: false,
        message: `Failed to delete ${transactionType}`
      }
    }
  }
}