import { supabase } from '../supabaseClient'
import type { InvoiceData } from '../storage/invoiceStorage'

export interface RecurringInvoice {
  id: string
  user_id: string
  base_invoice_id: string
  client_id: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date: string | null
  max_occurrences: number | null
  next_generation_date: string
  auto_create: boolean
  auto_send: boolean
  status: 'active' | 'paused' | 'cancelled'
  invoice_snapshot: any
  items_snapshot: any
  created_at: string
  updated_at: string
  last_generated_at: string | null
  total_generated_count: number
}

export interface RecurringSettings {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate?: string
  maxOccurrences?: number
  autoSend: boolean
}

/**
 * Check if an invoice is already set as recurring
 */
export async function checkIfRecurring(invoiceId: string): Promise<{
  isRecurring: boolean
  recurringData?: RecurringInvoice
  error?: any
}> {
  try {
    const { data, error } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('base_invoice_id', invoiceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected if not recurring)
      return { isRecurring: false, error }
    }

    return {
      isRecurring: !!data,
      recurringData: data || undefined
    }
  } catch (error) {
    console.error('Error checking if recurring:', error)
    return { isRecurring: false, error }
  }
}

/**
 * Calculate next generation date based on frequency
 */
function calculateNextGenerationDate(startDate: string, frequency: string): string {
  const date = new Date(startDate)
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      date.setMonth(date.getMonth() + 1) // Default to monthly
  }
  
  return date.toISOString().split('T')[0]
}

/**
 * Create a recurring invoice
 */
export async function createRecurringInvoice(
  invoiceId: string,
  clientId: string,
  userId: string,
  settings: RecurringSettings
): Promise<{
  success: boolean
  data?: RecurringInvoice
  error?: string
}> {
  try {
    // 1. Fetch original invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError) {
      return { success: false, error: `Failed to fetch invoice: ${invoiceError.message}` }
    }

    // 2. Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      return { success: false, error: `Failed to fetch invoice items: ${itemsError.message}` }
    }

    // 3. Calculate next generation date
    const nextDate = calculateNextGenerationDate(settings.startDate, settings.frequency)

    // 4. Calculate payment terms days
    const paymentTermsDays = Math.ceil(
      (new Date(invoice.due_date).getTime() - new Date(invoice.issue_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    // 5. Build invoice snapshot (store all invoice data)
    const invoiceSnapshot = {
      invoice_number_pattern: 'INV-{YYYY}-{MM}-{####}',
      template: invoice.template || 'default', // Dynamic template
      template_data: invoice.template_data || null,
      template_settings: invoice.template_settings || null,
      currency_code: invoice.currency_code || 'USD',
      notes: invoice.notes || '',
      selected_payment_method_ids: invoice.selected_payment_method_ids || [],
      payment_terms_days: paymentTermsDays,
      subtotal: invoice.subtotal.toString(),
      tax_amount: (invoice.tax_amount || 0).toString(),
      total_amount: invoice.total_amount.toString()
    }

    // 6. Build items snapshot
    const itemsSnapshot = items.map(item => ({
      description: item.description,
      quantity: item.quantity.toString(),
      unit_price: item.unit_price.toString(),
      tax_rate: (item.tax_rate || 0).toString(),
      discount: (item.discount || 0).toString(),
      line_total: item.line_total.toString()
    }))

    // 7. Insert into recurring_invoices
    const { data: recurring, error } = await supabase
      .from('recurring_invoices')
      .insert({
        user_id: userId,
        base_invoice_id: invoiceId,
        client_id: clientId,
        frequency: settings.frequency,
        start_date: settings.startDate,
        end_date: settings.endDate || null,
        max_occurrences: settings.maxOccurrences || null,
        next_generation_date: nextDate,
        auto_create: true,
        auto_send: settings.autoSend,
        status: 'active',
        invoice_snapshot: invoiceSnapshot,
        items_snapshot: itemsSnapshot
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: `Failed to create recurring invoice: ${error.message}` }
    }

    return { success: true, data: recurring }
  } catch (error: any) {
    console.error('Error creating recurring invoice:', error)
    return { success: false, error: error.message || 'Unknown error occurred' }
  }
}

/**
 * Get all recurring invoices for a user
 */
export async function getRecurringInvoices(userId: string): Promise<{
  success: boolean
  data?: RecurringInvoice[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('recurring_invoices')
      .select(`
        *,
        clients!recurring_invoices_client_id_fkey (
          id,
          name,
          email,
          company_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error fetching recurring invoices:', error)
    return { success: false, error: error.message || 'Unknown error occurred' }
  }
}

/**
 * Update recurring invoice status
 */
export async function updateRecurringStatus(
  recurringId: string,
  status: 'active' | 'paused' | 'cancelled'
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase
      .from('recurring_invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', recurringId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating recurring status:', error)
    return { success: false, error: error.message || 'Unknown error occurred' }
  }
}

/**
 * Delete/Cancel recurring invoice
 */
export async function cancelRecurringInvoice(recurringId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase
      .from('recurring_invoices')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', recurringId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error cancelling recurring invoice:', error)
    return { success: false, error: error.message || 'Unknown error occurred' }
  }
}

/**
 * Get invoices generated from a recurring invoice
 */
export async function getGeneratedInvoices(recurringId: string): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('recurring_invoice_id', recurringId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error fetching generated invoices:', error)
    return { success: false, error: error.message || 'Unknown error occurred' }
  }
}

