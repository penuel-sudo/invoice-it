import { supabase } from '../../../lib/supabaseClient'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { PaymentMethod } from '../../../lib/storage/invoiceStorage'
import { saveClient } from '../../../lib/clientCheck'
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

/**
 * Clean template settings to ensure only valid CustomizationData fields are saved
 * This prevents old/extra fields (like 'customization', 'userPreferences') from being saved
 */
const cleanTemplateSettings = (data: any): any => {
  if (!data) return null
  
  return {
    // Company Details
    company_name: data.company_name || '',
    website: data.website || '',
    tax_id: data.tax_id || '',
    tagline: data.tagline || '',
    business_type: data.business_type || '',
    registration_number: data.registration_number || '',
    
    // Branding
    logo_url: data.logo_url || '',
    primary_color: data.primary_color || '#16a34a',
    accent_color: data.accent_color || '#6b7280',
    font_family: data.font_family || 'Helvetica',
    
    // Background Colors
    background_colors: {
      main_background: data.background_colors?.main_background || '#f8fafc',
      card_background: data.background_colors?.card_background || '#ffffff',
      section_background: data.background_colors?.section_background || '#f1f5f9',
      header_background: data.background_colors?.header_background || '#ffffff',
      form_background: data.background_colors?.form_background || '#ffffff'
    },
    
    // Template Settings
    template_settings: {
      show_logo: data.template_settings?.show_logo ?? true,
      show_tagline: data.template_settings?.show_tagline ?? true,
      show_website: data.template_settings?.show_website ?? true,
      show_tax_id: data.template_settings?.show_tax_id ?? true,
      show_registration: data.template_settings?.show_registration ?? true
    }
  }
}

export interface ProfessionalInvoiceFormData {
  // Database IDs
  id?: string
  clientId?: string
  status?: string
  template?: string
  
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
  templateSettings?: any,
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
    hasCustomization: !!templateSettings
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

    // Step 1: Save or find client using reusable utility
    console.log('👤 [PROFESSIONAL TEMPLATE SAVE] Step 1: Handling client with reusable utility...')
    
    const clientResult = await saveClient({
      name: formData.clientName,
      email: formData.clientEmail,
      address: formData.clientAddress,
      phone: formData.clientPhone,
      company_name: formData.clientCompanyName
    }, user.id)

    if (!clientResult.success) {
      console.error('❌ [PROFESSIONAL TEMPLATE SAVE] Error handling client:', clientResult.error)
      toast.error('Failed to handle client: ' + (clientResult.error || 'Unknown error'))
      return { success: false, error: clientResult.error || 'Failed to handle client' }
    }

    const clientId = clientResult.clientId!
    
    // Show appropriate success message
    if (clientResult.isNewClient) {
      console.log('✅ [PROFESSIONAL TEMPLATE SAVE] New client created with ID:', clientId)
      toast.success('New client added successfully')
    } else if (clientResult.isUpdated) {
      console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Existing client updated with ID:', clientId)
      toast.success('Client information updated')
    } else {
      console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Using existing client with ID:', clientId)
    }

    // Step 2: Save invoice (UPDATE existing or INSERT new)
    console.log('📋 [PROFESSIONAL TEMPLATE SAVE] Step 2: Saving invoice...')
    let invoiceId: string
    let isNewInvoice = false
    
    // Check if invoice already exists (including template_settings to preserve it)
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, status, template_settings')
      .eq('invoice_number', formData.invoiceNumber)
      .eq('user_id', user.id)
      .single()

    if (existingInvoice) {
      console.log('🔄 [PROFESSIONAL TEMPLATE SAVE] Updating existing invoice...')
      
      // PRESERVE existing template_settings if new templateSettings not provided
      // Only update template_settings if explicitly provided (from customization panel)
      let finalTemplateSettings = existingInvoice.template_settings
      if (templateSettings) {
        // New customization provided - clean and use it
        console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Updating with new template_settings')
        finalTemplateSettings = cleanTemplateSettings(templateSettings)
      } else {
        // No new customization - preserve existing database settings
        console.log('✅ [PROFESSIONAL TEMPLATE SAVE] Preserving existing template_settings from database')
        if (!finalTemplateSettings) {
          // Only use defaults if invoice has no settings at all
          finalTemplateSettings = {
            company_name: '',
            website: '',
            tax_id: '',
            tagline: '',
            business_type: '',
            registration_number: '',
            logo_url: '',
            primary_color: '#16a34a',
            accent_color: '#6b7280',
            font_family: 'Helvetica',
            background_colors: {
              main_background: '#f8fafc',
              card_background: '#ffffff',
              section_background: '#f1f5f9',
              header_background: '#ffffff',
              form_background: '#ffffff'
            },
            template_settings: {
              show_logo: true,
              show_tagline: true,
              show_website: true,
              show_tax_id: true,
              show_registration: true
            }
          }
        }
      }
      
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
          template_settings: finalTemplateSettings,
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
      isNewInvoice = false
    } else {
      console.log('🆕 [PROFESSIONAL TEMPLATE SAVE] Creating new invoice...')
      isNewInvoice = true
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
          template_settings: cleanTemplateSettings(templateSettings) || {
            company_name: '',
            website: '',
            tax_id: '',
            tagline: '',
            business_type: '',
            registration_number: '',
            logo_url: '',
            primary_color: '#16a34a',
            accent_color: '#6b7280',
            font_family: 'Helvetica',
            background_colors: {
              main_background: '#f8fafc',
              card_background: '#ffffff',
              section_background: '#f1f5f9',
              header_background: '#ffffff',
              form_background: '#ffffff'
            },
            template_settings: {
              show_logo: true,
              show_tagline: true,
              show_website: true,
              show_tax_id: true,
              show_registration: true
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

    // Dispatch event if this is a new invoice (so Create page can clear/reset form)
    if (isNewInvoice) {
      window.dispatchEvent(new CustomEvent('professionalInvoiceSaved', {
        detail: { invoiceNumber: formData.invoiceNumber }
      }))
      console.log('📢 [PROFESSIONAL TEMPLATE SAVE] Dispatched invoiceSaved event for new invoice')
    }

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

