import { supabase } from '../lib/supabaseClient'

export interface TransactionData {
  id: string
  type: 'invoice' | 'expense'
  // Invoice fields
  invoice_number?: string
  status: string
  issue_date?: string
  due_date?: string
  subtotal?: number
  tax_amount?: number
  total_amount: number
  notes?: string
  template?: string | null
  template_data?: any
  template_settings?: any
  currency_code?: string
  selected_payment_method_ids?: string[]
  recurring_invoice_id?: string | null
  // Expense fields
  category?: string
  expense_date?: string
  description?: string
  payment_method?: string
  is_tax_deductible?: boolean
  receipt_url?: string
  receipt_filename?: string
  // Client fields
  client_id?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  client_company_name?: string
  // Common fields
  created_at: string
  updated_at?: string
}

export class TransactionService {
  /**
   * Load all transactions (invoices + expenses) for a user
   */
  static async getUserTransactions(userId: string): Promise<TransactionData[]> {
    console.log('🔍 DEBUGGING: TransactionService.getUserTransactions called with userId:', userId)
    
    try {
      // Load invoices with ALL fields
      console.log('🔍 DEBUGGING: Loading invoices...')
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          user_id,
          client_id,
          invoice_number,
          status,
          issue_date,
          due_date,
          subtotal,
          tax_amount,
          total_amount,
          notes,
          template,
          template_data,
          template_settings,
          currency_code,
          selected_payment_method_ids,
          recurring_invoice_id,
          created_at,
          updated_at,
          clients!inner(
            id,
            name,
            email,
            phone,
            address,
            company_name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (invoicesError) {
        console.error('🚨 DEBUGGING: Error loading invoices:', invoicesError)
        throw invoicesError
      }

      console.log('🔍 DEBUGGING: Raw invoices data:', invoices)

      // Load expenses
      console.log('🔍 DEBUGGING: Loading expenses...')
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          category,
          status,
          expense_date,
          amount,
          description,
          payment_method,
          is_tax_deductible,
          receipt_url,
          receipt_filename,
          created_at,
          updated_at,
          clients(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (expensesError) {
        console.error('🚨 DEBUGGING: Error loading expenses:', expensesError)
        throw expensesError
      }

      console.log('🔍 DEBUGGING: Raw expenses data:', expenses)

      // Transform invoices
      const transformedInvoices: TransactionData[] = (invoices || []).map((invoice: any) => {
        console.log('🔍 DEBUGGING: Processing invoice:', invoice.invoice_number, 'template:', invoice.template)
        
        // STRICT TEMPLATE VALIDATION
        if (!invoice.template || invoice.template.trim() === '') {
          const errorMsg = `🚨 STRICT VALIDATION ERROR: Invoice ${invoice.invoice_number} has NULL/empty template!`
          console.error(errorMsg)
          throw new Error(`Invoice ${invoice.invoice_number} has no template assigned!`)
        }

        const validTemplates = ['default', 'professional']
        if (!validTemplates.includes(invoice.template)) {
          const errorMsg = `🚨 STRICT VALIDATION ERROR: Invoice ${invoice.invoice_number} has unknown template: ${invoice.template}`
          console.error(errorMsg)
          throw new Error(`Invoice ${invoice.invoice_number} has unknown template '${invoice.template}'!`)
        }

        console.log('✅ Valid template for invoice:', invoice.invoice_number, '→', invoice.template)

        return {
          id: invoice.id,
          type: 'invoice' as const,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount,
          total_amount: invoice.total_amount,
          notes: invoice.notes,
          template: invoice.template,
          template_data: invoice.template_data,
          template_settings: invoice.template_settings,
          currency_code: invoice.currency_code,
          selected_payment_method_ids: invoice.selected_payment_method_ids,
          recurring_invoice_id: invoice.recurring_invoice_id,
          // Client fields
          client_id: invoice.client_id,
          client_name: invoice.clients?.name,
          client_email: invoice.clients?.email,
          client_phone: invoice.clients?.phone,
          client_address: invoice.clients?.address,
          client_company_name: invoice.clients?.company_name,
          // Common fields
          created_at: invoice.created_at,
          updated_at: invoice.updated_at
        }
      })

      // Transform expenses
      const transformedExpenses: TransactionData[] = (expenses || []).map((expense: any) => {
        console.log('🔍 DEBUGGING: Processing expense:', expense.id, 'category:', expense.category)
        
        return {
          id: expense.id,
          type: 'expense' as const,
          category: expense.category,
          status: expense.status,
          expense_date: expense.expense_date,
          total_amount: expense.amount,
          description: expense.description || expense.clients?.name,
          payment_method: expense.payment_method,
          is_tax_deductible: expense.is_tax_deductible,
          receipt_url: expense.receipt_url,
          receipt_filename: expense.receipt_filename,
          created_at: expense.created_at,
          updated_at: expense.updated_at
        }
      })

      // Combine and sort by created_at
      const allTransactions = [...transformedInvoices, ...transformedExpenses]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log('🔍 DEBUGGING: Final combined transactions:', allTransactions.length)
      console.log('🔍 DEBUGGING: Transaction breakdown:', {
        invoices: transformedInvoices.length,
        expenses: transformedExpenses.length,
        total: allTransactions.length
      })

      return allTransactions

    } catch (error) {
      console.error('🚨 DEBUGGING: TransactionService error:', error)
      throw error
    }
  }

  /**
   * Get a single invoice by invoice number with ALL fields
   */
  static async getInvoiceByNumber(invoiceNumber: string, userId: string) {
    console.log('🔍 DEBUGGING: Getting invoice by number:', invoiceNumber)
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        user_id,
        client_id,
        invoice_number,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_amount,
        total_amount,
        notes,
        template,
        template_data,
        template_settings,
        currency_code,
        selected_payment_method_ids,
        created_at,
        updated_at,
        clients(
          id,
          name,
          email,
          phone,
          address,
          company_name,
          created_at,
          updated_at,
          overdue_count
        ),
        invoice_items(
          id,
          invoice_id,
          description,
          quantity,
          unit_price,
          tax_rate,
          line_total,
          discount,
          created_at
        )
      `)
      .eq('invoice_number', invoiceNumber)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('🚨 DEBUGGING: Error loading invoice:', error)
      throw error
    }

    console.log('🔍 DEBUGGING: Invoice loaded with template:', data?.template)
    console.log('🔍 DEBUGGING: Invoice items count:', data?.invoice_items?.length)

    return data
  }
}
