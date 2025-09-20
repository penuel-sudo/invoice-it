import { supabase } from './supabaseClient'
import toast from 'react-hot-toast'

export interface StatusUpdateResult {
  success: boolean
  message: string
}

/**
 * Reusable status logic for handling transaction status updates
 */
export class StatusLogic {
  /**
   * Update invoice status using the database function
   */
  static async updateInvoiceStatus(
    invoiceId: string, 
    newStatus: 'draft' | 'pending' | 'paid' | 'overdue',
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
        overdue: 'Invoice marked as overdue'
      }

      return {
        success: true,
        message: statusMessages[newStatus]
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
   * Update expense status
   */
  static async updateExpenseStatus(
    expenseId: string,
    newStatus: 'spent' | 'expense',
    userId: string
  ): Promise<StatusUpdateResult> {
    try {
      const { error } = await supabase.rpc('update_expense_status', {
        expense_id: expenseId,
        new_status: newStatus
      })

      if (error) {
        console.error('Error updating expense status:', error)
        return {
          success: false,
          message: `Failed to update status: ${error.message}`
        }
      }

      const statusMessages = {
        spent: 'Expense marked as spent',
        expense: 'Expense categorized'
      }

      return {
        success: true,
        message: statusMessages[newStatus]
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
   * Delete transaction (invoice or expense)
   */
  static async deleteTransaction(
    transactionId: string,
    type: 'invoice' | 'expense',
    userId: string
  ): Promise<StatusUpdateResult> {
    try {
      const tableName = type === 'invoice' ? 'invoices' : 'expenses'
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (error) {
        console.error(`Error deleting ${type}:`, error)
        return {
          success: false,
          message: `Failed to delete ${type}: ${error.message}`
        }
      }

      return {
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error)
      return {
        success: false,
        message: `Failed to delete ${type}`
      }
    }
  }

  /**
   * Handle transaction action with proper error handling and toast notifications
   */
  static async handleTransactionAction(
    transactionId: string,
    action: string,
    type: 'invoice' | 'expense',
    userId: string,
    currentStatus?: string
  ): Promise<StatusUpdateResult> {
    let result: StatusUpdateResult

    switch (action) {
      case 'delete':
        result = await this.deleteTransaction(transactionId, type, userId)
        break

      case 'mark_paid':
        if (type === 'invoice') {
          result = await this.updateInvoiceStatus(transactionId, 'paid', userId)
        } else {
          result = { success: false, message: 'Cannot mark expense as paid' }
        }
        break

      case 'mark_pending':
        if (type === 'invoice') {
          result = await this.updateInvoiceStatus(transactionId, 'pending', userId)
        } else {
          result = { success: false, message: 'Cannot mark expense as pending' }
        }
        break

      case 'mark_draft':
        if (type === 'invoice') {
          result = await this.updateInvoiceStatus(transactionId, 'draft', userId)
        } else {
          result = { success: false, message: 'Cannot mark expense as draft' }
        }
        break

      default:
        result = { success: false, message: 'Unknown action' }
    }

    // Show toast notification
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    return result
  }

  /**
   * Get valid status for StatusButton component
   */
  static getValidStatus(status: string): 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense' {
    const validStatuses = ['draft', 'pending', 'paid', 'overdue', 'spent', 'expense']
    return validStatuses.includes(status) ? status as 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense' : 'draft'
  }
}
