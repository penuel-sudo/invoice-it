import { supabase } from '../../../lib/supabaseClient'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { PaymentMethod } from '../../../lib/storage/invoiceStorage'
import toast from 'react-hot-toast'

// Simple debounce mechanism to prevent multiple simultaneous saves
const saveInProgress = new Set<string>()

interface SaveResult {
  success: boolean
  invoiceId?: string
  clientId?: string
  error?: string
}

// Extended interface for Professional Template with additional fields
export interface ProfessionalInvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number // NEW: Per-item discount percentage
  taxRate: number
  lineTotal: number
}

export interface ProfessionalInvoiceFormData {
  // Database IDs
  id?: string
  clientId?: string
  status?: string
  
  // Client Information (Bill To)
  clientName: string
  clientEmail: string
  clientAddress: string
  clientPhone: string
  clientCompanyName: string
  
  // Ship To Address (NEW)
  shipToName?: string
  shipToAddress?: string
  shipToCity?: string
  shipToState?: string
  shipToZip?: string
  shipToCountry?: string
  
  // Invoice Metadata
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  poNumber?: string // NEW: Purchase Order Number
  taxId?: string // NEW: Tax ID / EIN / VAT Number
  
  // Line Items
  items: ProfessionalInvoiceItem[]
  
  // Notes
  notes: string
  termsAndConditions?: string // NEW: Separate T&C field
  
  // Calculations
  subtotal: number
  discountAmount: number // NEW: Overall discount
  shippingCost: number // NEW: Shipping/handling
  taxTotal: number
  grandTotal: number
  amountPaid: number // NEW: Deposits/partial payments
  balanceDue: number // NEW: Calculated field
  
  // Currency & Payment
  currency?: string
  currencySymbol?: string
  paymentMethods?: PaymentMethod[]
  selectedPaymentMethodIds?: string[]
}

/**
 * Professional Template Save Function
 * Handles complete invoice saving flow for Professional template
 * Includes: client matching, multi-table save, localStorage clearing, extended fields
 */
export const saveProfessionalInvoice = async (
  formData: ProfessionalInvoiceFormData, 
  user: any,
  customization?: {
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
    fontFamily?: string
  },
  options: {
    updateStatus?: boolean
    status?: 'draft' | 'pending'
  } = {}
): Promise<SaveResult> => {
  // Create unique key for this save operation
  const saveKey = `${user.id}-${formData.invoiceNumber}`
  
  // Check if save is already in progress
  if (saveInProgress.has(saveKey)) {
    console.log('⏳ [PROFESSIONAL TEMPLATE SAVE] Save already in progress, skipping...')
    return { success: false, error: 'Save already in progress' }
  }
  
  // Mark save as in progress
  saveInProgress.add(saveKey)
  
  console.log('🔄 [PROFESSIONAL TEMPLATE SAVE] Starting save process...')
  console.log('📊 [PROFESSIONAL TEMPLATE SAVE] Invoice data:', {
    invoiceNumber: formData.invoiceNumber,
    clientName: formData.clientName,
    itemsCount: formData.items?.length,
    grandTotal: formData.grandTotal,
    balanceDue: formData.balanceDue,
    status: options.status || 'draft',
    hasCustomization: !!customization
  })

  try {
    // Validation
    if (!formData.clientName.trim()) {
      console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Client name is required')
      toast.error('Client name is required')
      return { success: false, error: 'Client name is required' }
    }

    if (formData.items.some(item => !item.description.trim())) {
      console.error('❌ [PROFESSIONAL TEMPLATE SAVE] All items must have a description')
      toast.error('All items must have a description')
      return { success: false, error: 'All items must have a description' }
    }

    if (!user) {
      console.error('❌ [PROFESSIONAL TEMPLATE SAVE] User not authenticated')
      toast.error('User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    // Step 1: Save or find client (CASE-INSENSITIVE MATCHING)
    console.log('👤 [PROFESSIONAL TEMPLATE SAVE] Step 1: Handling client with case-insensitive matching...')
    let clientId: string
    
    // Check if client already exists by name (CASE-INSENSITIVE)
    console.log('🔍 [PROFESSIONAL TEMPLATE SAVE] Searching for existing client by name...')
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id, name, email, address, phone, company_name')
      .eq('user_id', user.id)
      .ilike('name', formData.clientName)

    let existingClient = existingClients?.find(client => 
      client.name.toLowerCase() === formData.clientName.toLowerCase()
    )
    
    console.log('📊 [PROFESSIONAL TEMPLATE SAVE] Client search results:', {
      foundClients: existingClients?.length || 0,
      exactMatch: !!existingClient,
      clientName: formData.clientName,
      existingClientName: existingClient?.name
    })

    if (existingClient) {
      clientId = existingClient.id
      console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Using existing client:', clientId)
      
      // Update client details if they've changed
      const shouldUpdate = 
        existingClient.email !== formData.clientEmail ||
        existingClient.address !== formData.clientAddress ||
        existingClient.phone !== formData.clientPhone ||
        existingClient.company_name !== formData.clientCompanyName

      if (shouldUpdate) {
        console.log('🔄 [PROFESSIONAL TEMPLATE SAVE] Updating client details...')
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            email: formData.clientEmail || null,
            address: formData.clientAddress || null,
            phone: formData.clientPhone || null,
            company_name: formData.clientCompanyName || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId)

        if (updateError) {
          console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Error updating client:', updateError)
        } else {
          console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Client updated successfully')
        }
      }
    } else {
      // Create new client
      console.log('🆕 [PROFESSIONAL TEMPLATE SAVE] Creating new client...')
      const { data: newClient, error: clientError } = await supabase
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

      if (clientError || !newClient) {
        console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Error creating client:', clientError)
        toast.error('Failed to create client: ' + (clientError?.message || 'Unknown error'))
        return { success: false, error: clientError?.message || 'Failed to create client' }
      }

      clientId = newClient.id
      console.log('✅ [PROFESSIONAL TEMPLATE SAVE] New client created with ID:', clientId)
    }

    // Step 2: Save invoice (UPDATE existing or INSERT new)
    console.log('📋 [PROFESSIONAL TEMPLATE SAVE] Step 2: Saving invoice...')
    let invoiceId: string
    
    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('invoice_number', formData.invoiceNumber)
      .eq('user_id', user.id)
      .single()

    if (existingInvoice) {
      console.log('🔄 [PROFESSIONAL TEMPLATE SAVE] Updating existing invoice...')
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
          status: options.status || existingInvoice.status,
          currency_code: formData.currency || 'USD',
          selected_payment_method_ids: formData.selectedPaymentMethodIds || null,
          template_data: {
            // Extended fields for Professional Template
            poNumber: formData.poNumber,
            taxId: formData.taxId,
            shipTo: formData.shipToName ? {
              name: formData.shipToName,
              address: formData.shipToAddress,
              city: formData.shipToCity,
              state: formData.shipToState,
              zip: formData.shipToZip,
              country: formData.shipToCountry
            } : null,
            termsAndConditions: formData.termsAndConditions,
            discountAmount: formData.discountAmount,
            shippingCost: formData.shippingCost,
            amountPaid: formData.amountPaid,
            balanceDue: formData.balanceDue
          },
          template_settings: {
            customization: customization || {
              primaryColor: '#16a34a', // Default green
              accentColor: '#6b7280', // Default gray
              fontFamily: 'Inter'
            },
            userPreferences: {
              defaultTaxRate: formData.taxTotal,
              currency: formData.currency || 'USD',
              currencySymbol: formData.currencySymbol || '$',
              dateFormat: 'MM/DD/YYYY'
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvoice.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Error updating invoice:', updateError)
        toast.error('Failed to update invoice: ' + updateError.message)
        return { success: false, error: updateError.message }
      }

      invoiceId = updatedInvoice.id
      console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Invoice updated successfully')
    } else {
      console.log('🆕 [PROFESSIONAL TEMPLATE SAVE] Creating new invoice...')
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
          status: options.status || 'draft',
          template: 'professional',
          currency_code: formData.currency || 'USD',
          selected_payment_method_ids: formData.selectedPaymentMethodIds || null,
          template_data: {
            // Extended fields for Professional Template
            poNumber: formData.poNumber,
            taxId: formData.taxId,
            shipTo: formData.shipToName ? {
              name: formData.shipToName,
              address: formData.shipToAddress,
              city: formData.shipToCity,
              state: formData.shipToState,
              zip: formData.shipToZip,
              country: formData.shipToCountry
            } : null,
            termsAndConditions: formData.termsAndConditions,
            discountAmount: formData.discountAmount,
            shippingCost: formData.shippingCost,
            amountPaid: formData.amountPaid,
            balanceDue: formData.balanceDue
          },
          template_settings: {
            customization: customization || {
              primaryColor: '#16a34a', // Default green
              accentColor: '#6b7280', // Default gray
              fontFamily: 'Inter'
            },
            userPreferences: {
              defaultTaxRate: formData.taxTotal,
              currency: formData.currency || 'USD',
              currencySymbol: formData.currencySymbol || '$',
              dateFormat: 'MM/DD/YYYY'
            }
          }
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Error creating invoice:', invoiceError)
        toast.error('Failed to create invoice: ' + invoiceError.message)
        return { success: false, error: invoiceError.message }
      }

      invoiceId = invoice.id
      console.log('✅ [PROFESSIONAL TEMPLATE SAVE] New invoice created with ID:', invoiceId)
    }

    console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Invoice saved with ID:', invoiceId)

    // Step 3: Save invoice items
    console.log('📋 [PROFESSIONAL TEMPLATE SAVE] Step 3: Saving invoice items...')
    
    // If updating existing invoice, clear old items first
    if (existingInvoice) {
      console.log('🗑️ [PROFESSIONAL TEMPLATE SAVE] Clearing old invoice items...')
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)
      
      if (deleteError) {
        console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Error deleting old items:', deleteError)
      }
    }
    
    // Insert new items
    const itemsToSave = formData.items.map((item) => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount || 0, // NEW: Per-item discount
      tax_rate: item.taxRate || 0,
      line_total: item.lineTotal
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToSave)

    if (itemsError) {
      console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Error saving invoice items:', itemsError)
      toast.error('Failed to save invoice items: ' + itemsError.message)
      return { success: false, error: itemsError.message }
    }

    console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Invoice items saved successfully')

    // Step 4: Clear localStorage draft
    console.log('🧹 [PROFESSIONAL TEMPLATE SAVE] Step 4: Clearing localStorage draft...')
    invoiceStorage.clearDraftProfessional()

    // Mark save as complete
    saveInProgress.delete(saveKey)

    console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Save completed successfully!')
    toast.success('Invoice saved successfully!')

    return { 
      success: true, 
      invoiceId,
      clientId 
    }

  } catch (error: any) {
    console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Unexpected error:', error)
    toast.error('An unexpected error occurred: ' + error.message)
    saveInProgress.delete(saveKey)
    return { success: false, error: error.message }
  }
}

