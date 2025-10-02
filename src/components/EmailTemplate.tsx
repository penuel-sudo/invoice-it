import React from 'react'
import { brandColors } from '../stylings'

interface EmailTemplateProps {
  businessName: string
  clientName: string
  invoiceNumber: string
  totalAmount: number
  dueDate: string
  currency: string
  currencySymbol: string
  greetingMessage?: string
  onPayNow?: () => void
  onViewInvoice?: () => void
}

export default function EmailTemplate({
  businessName,
  clientName,
  invoiceNumber,
  totalAmount,
  dueDate,
  currency,
  currencySymbol,
  greetingMessage,
  onPayNow,
  onViewInvoice
}: EmailTemplateProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8fafc'
    }}>
      {/* Greeting Message */}
      <div style={{
        fontSize: '16px',
        color: '#1a202c',
        marginBottom: '24px',
        lineHeight: '1.5'
      }}>
        {greetingMessage || `Hi ${clientName},`}
      </div>

      {/* Small Focused Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {/* Top-left: Invoice Number */}
        <div style={{
          fontSize: '14px',
          color: brandColors.neutral[600],
          marginBottom: '16px',
          fontWeight: '500'
        }}>
          Payment #{invoiceNumber}
        </div>

        {/* Prominent: Total Amount */}
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: brandColors.primary[600],
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {formatAmount(totalAmount)}
        </div>

        {/* Due Date */}
        <div style={{
          fontSize: '14px',
          color: brandColors.neutral[500],
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          Due: {formatDate(dueDate)}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          {/* View Invoice Button (Secondary) */}
          <button
            onClick={onViewInvoice}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: brandColors.primary[600],
              border: `1px solid ${brandColors.primary[200]}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[50]
              e.currentTarget.style.borderColor = brandColors.primary[300]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = brandColors.primary[200]
            }}
          >
            👁️ View Invoice
          </button>

          {/* Pay Now Button (Primary) */}
          <button
            onClick={onPayNow}
            style={{
              padding: '8px 16px',
              backgroundColor: brandColors.primary[600],
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[700]
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[600]
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Pay Now
          </button>
        </div>

        {/* Professional Text */}
        <div style={{
          fontSize: '12px',
          color: brandColors.neutral[500],
          textAlign: 'center',
          marginTop: '16px',
          fontStyle: 'italic'
        }}>
          View invoice details below
        </div>
      </div>

      {/* Business Footer */}
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
        fontSize: '14px',
        color: brandColors.neutral[600]
      }}>
        <strong>{businessName}</strong> - Thank you for your business
      </div>
    </div>
  )
}
