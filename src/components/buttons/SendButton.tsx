import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'
import { useNotification } from '../../contexts/NotificationContext'
import { supabase } from '../../lib/supabaseClient'
import CustomizeMessageModal from '../CustomizeMessageModal'

interface SendButtonProps {
  invoiceData: any
  userData?: any
  onSend?: () => void
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function SendButton({ 
  invoiceData, 
  userData,
  onSend,
  style,
  size = 'md',
  variant = 'primary'
}: SendButtonProps) {
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotification()

  const handleSend = async () => {
    // Check if client email exists
    if (!invoiceData.clientEmail) {
      toast.error('Client email is required to send invoice')
      return
    }

    // Show customize message modal
    setShowCustomizeModal(true)
  }

  const sendInvoiceEmail = async (email: string, messageData: any) => {
    setIsLoading(true)
    
    // Debug logging
    console.log('Sending email with data:', {
      to: email,
      invoiceData: invoiceData,
      userData: userData,
      messageData: messageData
    })
    
    try {
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          invoiceData: invoiceData || {},
          userData: userData || { fullName: 'Business Owner', businessName: 'Your Business' },
          clientName: messageData.clientName || invoiceData?.clientName || 'Client',
          greetingMessage: messageData.greetingMessage || null,
          businessName: messageData.businessName || null
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Invoice sent successfully!')
        
        // Update invoice status from draft to pending if needed
        await updateInvoiceStatus()
        
        // Add notification
        addNotification({
          type: 'success',
          title: 'Invoice Sent',
          message: `Invoice #${invoiceData.invoiceNumber} sent to ${email}`,
          status: 'pending'
    })
    
    if (onSend) {
      onSend()
    }
      } else {
        throw new Error(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Send email error:', error)
      toast.error('Failed to send invoice. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateInvoiceStatus = async () => {
    try {
      // Only update if status is 'draft'
      if (invoiceData.status === 'draft') {
        // First, try to find the invoice in the database
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id, status')
          .eq('invoice_number', invoiceData.invoiceNumber)
          .eq('user_id', invoiceData.user_id || userData?.id)
          .single()

        if (existingInvoice) {
          // Invoice exists in DB, update its status
          const { error } = await supabase
            .from('invoices')
            .update({ 
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingInvoice.id)

          if (error) {
            console.error('Error updating invoice status:', error)
          } else {
            console.log('Invoice status updated from draft to pending')
          }
        } else {
          // Invoice doesn't exist in DB yet (preview mode)
          // Update localStorage first, then auto-save to database
          invoiceData.status = 'pending'
          const updatedInvoiceData = { ...invoiceData, status: 'pending' }
          localStorage.setItem('invoiceData', JSON.stringify(updatedInvoiceData))
          
          // Also update the invoiceStorage
          const { invoiceStorage } = await import('../../lib/storage/invoiceStorage')
          invoiceStorage.saveDraftDebounced(updatedInvoiceData)
          
          // Auto-save the invoice to database
          await autoSaveInvoice()
        }
      }
    } catch (error) {
      console.error('Error updating invoice status:', error)
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
          .eq('user_id', userData?.id)
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
              user_id: userData?.id,
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
          user_id: userData?.id,
          client_id: clientId,
          invoice_number: invoiceData.invoiceNumber,
          issue_date: invoiceData.invoiceDate,
          due_date: invoiceData.dueDate,
          notes: invoiceData.notes || null,
          subtotal: invoiceData.subtotal,
          tax_amount: invoiceData.taxTotal,
          total_amount: invoiceData.grandTotal,
          status: 'pending', // Set to pending since user is taking action
          template: 'default',
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
              companyName: userData?.businessName || 'Your Business'
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
      
      // Update localStorage with the new data (including the database ID)
      const updatedInvoiceData = { ...invoiceData, id: invoice.id, status: 'pending' }
      localStorage.setItem('invoiceData', JSON.stringify(updatedInvoiceData))
      
      // Also update the invoiceStorage
      const { invoiceStorage } = await import('../../lib/storage/invoiceStorage')
      invoiceStorage.saveDraftDebounced(updatedInvoiceData)

    } catch (error) {
      console.error('Error in auto-save:', error)
      // Fallback: update localStorage
      invoiceData.status = 'pending'
      const updatedInvoiceData = { ...invoiceData, status: 'pending' }
      localStorage.setItem('invoiceData', JSON.stringify(updatedInvoiceData))
    }
  }

  const handleCustomizeSubmit = (messageData: any) => {
    setShowCustomizeModal(false)
    sendInvoiceEmail(invoiceData.clientEmail, messageData)
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
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    <button
      onClick={handleSend}
        disabled={isLoading}
      style={{
        ...getSizeStyles(),
        ...getVariantStyles(),
        borderRadius: '12px',
        fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        flex: 1,
        maxWidth: '100px',
          opacity: isLoading ? 0.7 : 1,
        ...style
      }}
      onMouseEnter={(e) => {
          if (isLoading) return
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[700]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[200]
        }
      }}
      onMouseLeave={(e) => {
          if (isLoading) return
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[600]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[100]
        }
      }}
    >
        {isLoading ? (
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid transparent',
            borderTop: '2px solid currentColor',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        ) : (
      <Send size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        )}
        {size !== 'sm' && <span>{isLoading ? 'Sending...' : 'Send'}</span>}
    </button>

      {/* Customize Message Modal */}
      <CustomizeMessageModal
        isVisible={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onSend={handleCustomizeSubmit}
        defaultBusinessName={userData?.businessName || userData?.fullName || ''}
        defaultClientName={invoiceData?.clientName || invoiceData?.client?.name || ''}
      />
    </>
  )
}
