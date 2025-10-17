import React from 'react'
import { Download } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'
import { pdf } from '@react-pdf/renderer'
import { getPDFTemplate } from '../../lib/templateRegistry'
import type { InvoiceData } from '../../lib/storage/invoiceStorage'
import { supabase } from '../../lib/supabaseClient'

interface DownloadButtonProps {
  invoiceData: InvoiceData
  user: any
  template?: string
  onDownload?: () => void
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function DownloadButton({ 
  invoiceData, 
  user,
  template = 'default',
  onDownload,
  style,
  size = 'md',
  variant = 'primary'
}: DownloadButtonProps) {
  const handleDownload = async () => {
    if (!invoiceData || !user) {
      toast.error('Invoice data not available')
      return
    }

    try {
      // Show loading state
      toast.loading('Generating PDF...', { id: 'pdf-generation' })
      
      // Update invoice status to 'pending' if it's not already pending
      // Query to find if this invoice exists in the database
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('invoice_number', invoiceData.invoiceNumber)
        .eq('user_id', user.id)
        .single()
      
      if (existingInvoice && existingInvoice.status === 'draft') {
        // Invoice exists in DB and is draft, update to pending
        await supabase
          .from('invoices')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvoice.id)
          .eq('user_id', user.id)
        console.log('Invoice status updated from draft to pending')
      } else if (!existingInvoice && invoiceData.status === 'draft') {
        // Invoice doesn't exist in DB yet (preview mode)
        // Auto-save the invoice to database first
        await autoSaveInvoice()
      }
      
      // Get the correct PDF template based on template name
      const PDFTemplate = getPDFTemplate(template)
      
      // Generate PDF blob using client-side rendering
      const blob = await pdf(<PDFTemplate invoiceData={invoiceData} />).toBlob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceData.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Success feedback
      toast.success('PDF downloaded successfully!', { id: 'pdf-generation' })
      
      // Call optional callback
      if (onDownload) {
        onDownload()
      }
      
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-generation' })
    }
  }

  const autoSaveInvoice = async () => {
    try {
      let clientId = invoiceData.clientId

      // Step 1: Handle client (create or update if needed)
      if (!clientId && invoiceData.clientName) {
        // Check if client already exists
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', invoiceData.clientName)
          .eq('email', invoiceData.clientEmail || null)
          .single()

        if (existingClient) {
          clientId = existingClient.id
        } else {
          // Create new client
          const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
              user_id: user.id,
              name: invoiceData.clientName,
              email: invoiceData.clientEmail || null,
              address: invoiceData.clientAddress || null,
              phone: invoiceData.clientPhone || null,
              company_name: invoiceData.clientCompanyName || null
            })
            .select()
            .single()

          if (clientError) {
            console.error('Error creating client:', clientError)
          } else {
            clientId = client.id
          }
        }
      }

      // Step 2: Save invoice to database
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: clientId,
          invoice_number: invoiceData.invoiceNumber,
          issue_date: invoiceData.invoiceDate,
          due_date: invoiceData.dueDate,
          notes: invoiceData.notes || null,
          subtotal: invoiceData.subtotal,
          tax_amount: invoiceData.taxTotal,
          total_amount: invoiceData.grandTotal,
          status: 'pending', // Set to pending since user is taking action
          template: template,
          currency_code: invoiceData.currency || 'USD',
          payment_details: invoiceData.paymentDetails || null,
          selected_payment_method_ids: invoiceData.selectedPaymentMethodIds || null,
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
              defaultTaxRate: invoiceData.taxTotal,
              currency: invoiceData.currency || 'USD',
              currencySymbol: invoiceData.currencySymbol || '$',
              dateFormat: 'MM/DD/YYYY'
            },
            branding: {
              companyName: user?.businessName || 'Your Business'
            }
          }
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('Error auto-saving invoice:', invoiceError)
        // Fallback: update localStorage
        invoiceData.status = 'pending'
        const updatedInvoiceData = { ...invoiceData, status: 'pending' }
        localStorage.setItem('invoiceData', JSON.stringify(updatedInvoiceData))
        return
      }

      // Step 3: Save invoice items
      const invoiceItems = invoiceData.items.map(item => ({
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
        console.error('Error saving invoice items:', itemsError)
        // Clean up the invoice if items failed
        await supabase.from('invoices').delete().eq('id', invoice.id)
        // Fallback: update localStorage
        invoiceData.status = 'pending'
        const updatedInvoiceData = { ...invoiceData, status: 'pending' }
        localStorage.setItem('invoiceData', JSON.stringify(updatedInvoiceData))
        return
      }

      console.log('Invoice auto-saved to database with pending status')
      // Update the invoiceData with the saved ID
      invoiceData.id = invoice.id
      invoiceData.status = 'pending'
      
      // Update localStorage with the new data
      const updatedInvoiceData = { ...invoiceData, id: invoice.id, status: 'pending' }
      localStorage.setItem('invoiceData', JSON.stringify(updatedInvoiceData))

    } catch (error) {
      console.error('Error in auto-save:', error)
      // Fallback: update localStorage
      invoiceData.status = 'pending'
      const updatedInvoiceData = { ...invoiceData, status: 'pending' }
      localStorage.setItem('invoiceData', JSON.stringify(updatedInvoiceData))
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          gap: '0.25rem'
        }
      case 'lg':
        return {
          padding: '1rem 2rem',
          fontSize: '1rem',
          gap: '0.5rem'
        }
      default: // md
        return {
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          gap: '0.375rem'
        }
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: brandColors.primary[100],
          color: brandColors.primary[700],
          border: 'none'
        }
      default: // primary
        return {
          backgroundColor: brandColors.primary[600],
          color: brandColors.white,
          border: 'none'
        }
    }
  }

  return (
    <button
      onClick={handleDownload}
      style={{
        ...getSizeStyles(),
        ...getVariantStyles(),
        borderRadius: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        flex: 1,
        maxWidth: '100px',
        ...style
      }}
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[700]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[200]
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[600]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[100]
        }
      }}
    >
      <Download size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      {size !== 'sm' && <span>PDF</span>}
    </button>
  )
}
