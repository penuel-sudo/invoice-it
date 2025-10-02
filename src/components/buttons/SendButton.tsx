import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'
import { useNotification } from '../../contexts/NotificationContext'
import { supabase } from '../../lib/supabaseClient'

interface SendButtonProps {
  invoiceData: any
  userData: any
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
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [clientEmail, setClientEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotification()

  const handleSend = async () => {
    // Check if client email exists
    if (!invoiceData.clientEmail) {
      setShowEmailModal(true)
      return
    }

    await sendInvoiceEmail(invoiceData.clientEmail)
  }

  const sendInvoiceEmail = async (email: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          invoiceData,
          userData,
          clientName: invoiceData.clientName || 'Client'
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
        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceData.id)

        if (error) {
          console.error('Error updating invoice status:', error)
          // Don't show error to user as email was sent successfully
        } else {
          console.log('Invoice status updated from draft to pending')
        }
      }
    } catch (error) {
      console.error('Error updating invoice status:', error)
      // Don't show error to user as email was sent successfully
    }
  }

  const handleEmailSubmit = () => {
    if (!clientEmail.trim()) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setShowEmailModal(false)
    sendInvoiceEmail(clientEmail)
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

      {/* Email Input Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: brandColors.neutral[900],
              marginBottom: '16px'
            }}>
              Enter Client Email
            </h3>
            <p style={{
              color: brandColors.neutral[600],
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              The client's email address is required to send the invoice.
            </p>
            <input
              type="email"
              placeholder="client@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '24px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: brandColors.neutral[100],
                  color: brandColors.neutral[700],
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSubmit}
                style={{
                  padding: '10px 20px',
                  backgroundColor: brandColors.primary[600],
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
