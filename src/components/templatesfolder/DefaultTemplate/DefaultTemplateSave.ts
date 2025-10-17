import { supabase } from '../../../lib/supabaseClient'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { InvoiceFormData } from '../../../lib/storage/invoiceStorage'
import toast from 'react-hot-toast'

// Simple debounce mechanism to prevent multiple simultaneous saves
const saveInProgress = new Set<string>()

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
  // Create unique key for this save operation
  const saveKey = `${user.id}-${formData.invoiceNumber}`
  
  // Check if save is already in progress
  if (saveInProgress.has(saveKey)) {
    console.log('⏳ [DEFAULT TEMPLATE SAVE] Save already in progress, skipping...')
    return { success: false, error: 'Save already in progress' }
  }
  
  // Mark save as in progress
  saveInProgress.add(saveKey)
  
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
    
    // Check if client already exists by name (CASE-INSENSITIVE) - PRIMARY MATCH
    console.log('🔍 [DEFAULT TEMPLATE SAVE] Searching for existing client by name...')
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id, name, email, address, phone, company_name')
      .eq('user_id', user.id)
      .ilike('name', formData.clientName) // CASE-INSENSITIVE MATCHING

    // Find client by name match (case-insensitive) - this is the primary match
    let existingClient = existingClients?.find(client => 
      client.name.toLowerCase() === formData.clientName.toLowerCase()
    )
    
    // Fallback: If no exact match found, try a broader search
    if (!existingClient && existingClients && existingClients.length > 0) {
      console.log('🔄 [DEFAULT TEMPLATE SAVE] No exact match, trying broader search...')
      // Try to find any client with similar name (fuzzy matching)
      existingClient = existingClients.find(client => 
        client.name.toLowerCase().trim() === formData.clientName.toLowerCase().trim()
      )
    }
    
    console.log('📊 [DEFAULT TEMPLATE SAVE] Client search results:', {
      foundClients: existingClients?.length || 0,
      exactMatch: !!existingClient,
      clientName: formData.clientName,
      existingClientName: existingClient?.name
    })

    if (existingClient) {
      console.log('✅ [DEFAULT TEMPLATE SAVE] Found existing client, updating...')
      console.log('📝 [DEFAULT TEMPLATE SAVE] Updating client with new data:', {
        existingId: existingClient.id,
        existingName: existingClient.name,
        newEmail: formData.clientEmail,
        newAddress: formData.clientAddress,
        newPhone: formData.clientPhone,
        newCompany: formData.clientCompanyName
      })
      
      // Update existing client with new data (merge with existing data)
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      // Only update fields that have new values
      if (formData.clientEmail) updateData.email = formData.clientEmail
      if (formData.clientAddress) updateData.address = formData.clientAddress
      if (formData.clientPhone) updateData.phone = formData.clientPhone
      if (formData.clientCompanyName) updateData.company_name = formData.clientCompanyName
      
      const { error: updateError } = await supabase
        .from('clients')
        .update(updateData)
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
      console.log('📝 [DEFAULT TEMPLATE SAVE] New client data:', {
        name: formData.clientName,
        email: formData.clientEmail,
        address: formData.clientAddress,
        phone: formData.clientPhone,
        company: formData.clientCompanyName
      })
      
      // Create new client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: formData.clientName.trim(), // Trim whitespace
          email: formData.clientEmail?.trim() || null,
          address: formData.clientAddress?.trim() || null,
          phone: formData.clientPhone?.trim() || null,
          company_name: formData.clientCompanyName?.trim() || null
        })
        .select()
        .single()

      if (clientError) {
        console.error('❌ [DEFAULT TEMPLATE SAVE] Error creating client:', clientError)
        console.error('❌ [DEFAULT TEMPLATE SAVE] Client error details:', {
          message: clientError.message,
          details: clientError.details,
          hint: clientError.hint
        })
        toast.error('Failed to save client: ' + clientError.message)
        return { success: false, error: clientError.message }
      }
      clientId = client.id
      console.log('✅ [DEFAULT TEMPLATE SAVE] New client created with ID:', clientId)
      toast.success('New client created')
    }

    // Step 2: Check if invoice already exists before creating new one
    console.log('🔍 [DEFAULT TEMPLATE SAVE] Step 2: Checking if invoice already exists...')
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('invoice_number', formData.invoiceNumber)
      .eq('user_id', user.id)
      .single()

    let invoiceId: string

    if (existingInvoice) {
      console.log('✅ [DEFAULT TEMPLATE SAVE] Invoice already exists, updating instead of creating new one...')
      // Update existing invoice
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          client_id: clientId,
          issue_date: formData.invoiceDate,
          due_date: formData.dueDate,
          notes: formData.notes || null,
          subtotal: formData.subtotal,
          tax_amount: formData.taxTotal,
          total_amount: formData.grandTotal,
          status: options.status || existingInvoice.status, // Keep existing status if no new status provided
          currency_code: formData.currency || 'USD',
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
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvoice.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ [DEFAULT TEMPLATE SAVE] Error updating invoice:', updateError)
        toast.error('Failed to update invoice: ' + updateError.message)
        return { success: false, error: updateError.message }
      }

      invoiceId = updatedInvoice.id
      console.log('✅ [DEFAULT TEMPLATE SAVE] Invoice updated successfully')
    } else {
      console.log('🆕 [DEFAULT TEMPLATE SAVE] Creating new invoice...')
      // Create new invoice
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
        console.error('❌ [DEFAULT TEMPLATE SAVE] Error creating invoice:', invoiceError)
        toast.error('Failed to create invoice: ' + invoiceError.message)
        return { success: false, error: invoiceError.message }
      }

      invoiceId = invoice.id
      console.log('✅ [DEFAULT TEMPLATE SAVE] New invoice created with ID:', invoiceId)
    }

    console.log('✅ [DEFAULT TEMPLATE SAVE] Invoice saved with ID:', invoiceId)

    // Step 3: Save invoice items
    console.log('📋 [DEFAULT TEMPLATE SAVE] Step 3: Saving invoice items...')
    
    // If updating existing invoice, clear old items first
    if (existingInvoice) {
      console.log('🗑️ [DEFAULT TEMPLATE SAVE] Clearing old invoice items...')
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)
      
      if (deleteError) {
        console.error('❌ [DEFAULT TEMPLATE SAVE] Error deleting old items:', deleteError)
        toast.error('Failed to clear old items: ' + deleteError.message)
        return { success: false, error: deleteError.message }
      }
    }
    
    const invoiceItems = formData.items.map(item => ({
      invoice_id: invoiceId,
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
      // Clean up the invoice if items failed (only for new invoices)
      if (!existingInvoice) {
        await supabase.from('invoices').delete().eq('id', invoiceId)
      }
      toast.error('Failed to save invoice items: ' + itemsError.message)
      return { success: false, error: itemsError.message }
    }

    console.log('✅ [DEFAULT TEMPLATE SAVE] Invoice items saved successfully')

    // Step 4: Clear localStorage and reset form (like Create page does)
    console.log('💾 [DEFAULT TEMPLATE SAVE] Step 4: Clearing localStorage and resetting form...')
    invoiceStorage.clearDraft()
    
    // Update formData with new IDs
    formData.id = invoiceId
    formData.clientId = clientId
    formData.status = options.status || 'draft'

    console.log('✅ [DEFAULT TEMPLATE SAVE] Save completed successfully!')
    console.log('📊 [DEFAULT TEMPLATE SAVE] Final result:', {
      invoiceId: invoiceId,
      clientId: clientId,
      status: formData.status
    })

    toast.success('Invoice saved successfully!')
    
    return { 
      success: true, 
      invoiceId: invoiceId, 
      clientId: clientId 
    }

  } catch (error) {
    console.error('❌ [DEFAULT TEMPLATE SAVE] Error in save process:', error)
    toast.error('Failed to save invoice')
    return { success: false, error: 'Unknown error occurred' }
  } finally {
    // Always remove from save in progress set
    saveInProgress.delete(saveKey)
    console.log('🧹 [DEFAULT TEMPLATE SAVE] Cleaned up save in progress flag')
  }
}
