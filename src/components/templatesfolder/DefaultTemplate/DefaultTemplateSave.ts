import { supabase } from '../../../lib/supabaseClient'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { InvoiceFormData } from '../../../lib/storage/invoiceStorage'
import toast from 'react-hot-toast'

interface SaveResult {
  success: boolean
  invoiceId?: string
  clientId?: string
  error?: string
}

/**
 * Default Template Save Function
 * Handles complete invoice saving flow for Default template
 * Includes: client matching, multi-table save, localStorage clearing
 */
export const saveInvoiceToDatabase = async (
  formData: InvoiceFormData, 
  user: any,
  options: {
    updateStatus?: boolean
    status?: 'draft' | 'pending'
  } = {}
): Promise<SaveResult> => {
  console.log('🔄 [DEFAULT TEMPLATE SAVE] Starting save process...')
  console.log('📊 [DEFAULT TEMPLATE SAVE] Invoice data:', {
    invoiceNumber: formData.invoiceNumber,
    clientName: formData.clientName,
    itemsCount: formData.items?.length,
    grandTotal: formData.grandTotal,
    status: options.status || 'draft'
  })

  try {
    // Validation
    if (!formData.clientName.trim()) {
      console.error('❌ [DEFAULT TEMPLATE SAVE] Client name is required')
      toast.error('Client name is required')
      return { success: false, error: 'Client name is required' }
    }

    if (formData.items.some(item => !item.description.trim())) {
      console.error('❌ [DEFAULT TEMPLATE SAVE] All items must have a description')
      toast.error('All items must have a description')
      return { success: false, error: 'All items must have a description' }
    }

    if (!user) {
      console.error('❌ [DEFAULT TEMPLATE SAVE] User not authenticated')
      toast.error('User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    // Step 1: Save or find client (CASE-INSENSITIVE MATCHING)
    console.log('👤 [DEFAULT TEMPLATE SAVE] Step 1: Handling client with case-insensitive matching...')
    let clientId: string
    
    // Check if client already exists by name and email (CASE-INSENSITIVE)
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id, name, email, address, phone, company_name')
      .eq('user_id', user.id)
      .ilike('name', formData.clientName) // CASE-INSENSITIVE MATCHING

    // Find exact match or update existing
    let existingClient = existingClients?.find(client => 
      client.name.toLowerCase() === formData.clientName.toLowerCase() && 
      client.email === (formData.clientEmail || null)
    )

    if (existingClient) {
      console.log('✅ [DEFAULT TEMPLATE SAVE] Found existing client, updating...')
      // Update existing client with new data
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          email: formData.clientEmail || null,
          address: formData.clientAddress || null,
          phone: formData.clientPhone || null,
          company_name: formData.clientCompanyName || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingClient.id)

      if (updateError) {
        console.error('❌ [DEFAULT TEMPLATE SAVE] Error updating client:', updateError)
        toast.error('Failed to update client: ' + updateError.message)
        return { success: false, error: updateError.message }
      }
      
      clientId = existingClient.id
      console.log('✅ [DEFAULT TEMPLATE SAVE] Client updated successfully')
      toast.success('Client information updated')
    } else {
      console.log('🆕 [DEFAULT TEMPLATE SAVE] Creating new client...')
      // Create new client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: formData.clientName,
          email: formData.clientEmail || null,
          address: formData.clientAddress || null,
          phone: formData.clientPhone || null,
          company_name: formData.clientCompanyName || null
        })
        .select()
        .single()

      if (clientError) {
        console.error('❌ [DEFAULT TEMPLATE SAVE] Error creating client:', clientError)
        toast.error('Failed to save client: ' + clientError.message)
        return { success: false, error: clientError.message }
      }
      clientId = client.id
      console.log('✅ [DEFAULT TEMPLATE SAVE] New client created with ID:', clientId)
      toast.success('New client created')
    }

    // Step 2: Save invoice to database (FIXED COLUMNS)
    console.log('📄 [DEFAULT TEMPLATE SAVE] Step 2: Saving invoice to database...')
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: clientId,
        invoice_number: formData.invoiceNumber,
        issue_date: formData.invoiceDate,
        due_date: formData.dueDate,
        notes: formData.notes || null,
        subtotal: formData.subtotal,
        tax_amount: formData.taxTotal,
        total_amount: formData.grandTotal,
        status: options.status || 'draft', // Use provided status or default to draft
        template: 'default',
        currency_code: formData.currency || 'USD',
        // REMOVED: payment_details: formData.paymentDetails || null, // This column doesn't exist!
        selected_payment_method_ids: formData.selectedPaymentMethodIds || null,
        template_data: {
          layout: 'clean',
          colors: {
            primary: '#16a34a',
            secondary: '#6b7280'
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter'
          }
        },
        template_settings: {
          userPreferences: {
            defaultTaxRate: formData.taxTotal,
            currency: formData.currency || 'USD',
            currencySymbol: formData.currencySymbol || '$',
            dateFormat: 'MM/DD/YYYY'
          },
          branding: {
            companyName: 'Your Business'
          }
        }
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('❌ [DEFAULT TEMPLATE SAVE] Error saving invoice:', invoiceError)
      toast.error('Failed to save invoice: ' + invoiceError.message)
      return { success: false, error: invoiceError.message }
    }

    console.log('✅ [DEFAULT TEMPLATE SAVE] Invoice saved with ID:', invoice.id)

    // Step 3: Save invoice items
    console.log('📋 [DEFAULT TEMPLATE SAVE] Step 3: Saving invoice items...')
    const invoiceItems = formData.items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      line_total: item.lineTotal
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      console.error('❌ [DEFAULT TEMPLATE SAVE] Error saving invoice items:', itemsError)
      // Clean up the invoice if items failed
      await supabase.from('invoices').delete().eq('id', invoice.id)
      toast.error('Failed to save invoice items: ' + itemsError.message)
      return { success: false, error: itemsError.message }
    }

    console.log('✅ [DEFAULT TEMPLATE SAVE] Invoice items saved successfully')

    // Step 4: Clear localStorage and reset form (like Create page does)
    console.log('💾 [DEFAULT TEMPLATE SAVE] Step 4: Clearing localStorage and resetting form...')
    invoiceStorage.clearDraft()
    
    // Update formData with new IDs
    formData.id = invoice.id
    formData.clientId = clientId
    formData.status = options.status || 'draft'

    console.log('✅ [DEFAULT TEMPLATE SAVE] Save completed successfully!')
    console.log('📊 [DEFAULT TEMPLATE SAVE] Final result:', {
      invoiceId: invoice.id,
      clientId: clientId,
      status: formData.status
    })

    toast.success('Invoice saved successfully!')
    
    return { 
      success: true, 
      invoiceId: invoice.id, 
      clientId: clientId 
    }

  } catch (error) {
    console.error('❌ [DEFAULT TEMPLATE SAVE] Error in save process:', error)
    toast.error('Failed to save invoice')
    return { success: false, error: 'Unknown error occurred' }
  }
}
