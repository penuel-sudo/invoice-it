import React, { useState } from 'react'
import { X } from 'lucide-react'
import { brandColors } from '../stylings'
import toast from 'react-hot-toast'

interface CustomizeMessageModalProps {
  isVisible: boolean
  onClose: () => void
  onSend: (messageData: MessageData) => void
  defaultBusinessName?: string
  defaultClientName?: string
}

interface MessageData {
  greetingMessage: string
  businessName: string
  clientName: string
}

export default function CustomizeMessageModal({
  isVisible,
  onClose,
  onSend,
  defaultBusinessName = '',
  defaultClientName = ''
}: CustomizeMessageModalProps) {
  const [greetingMessage, setGreetingMessage] = useState('')
  const [businessName, setBusinessName] = useState(defaultBusinessName)
  const [clientName, setClientName] = useState(defaultClientName)

  const handleSend = () => {
    // Use default values if fields are empty
    const finalGreetingMessage = greetingMessage.trim() || `Hi ${defaultClientName || 'Client'}, here's your invoice for the work completed by ${defaultBusinessName || 'our business'}.`
    const finalBusinessName = businessName.trim() || defaultBusinessName || 'Your Business'
    const finalClientName = clientName.trim() || defaultClientName || 'Client'

    onSend({
      greetingMessage: finalGreetingMessage,
      businessName: finalBusinessName,
      clientName: finalClientName
    })
  }

  const handleClose = () => {
    setGreetingMessage('')
    setBusinessName(defaultBusinessName)
    setClientName(defaultClientName)
    onClose()
  }

  if (!isVisible) return null

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0
          }}>
            Customize Email Message
          </h3>
          <button
            onClick={handleClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color={brandColors.neutral[500]} />
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Business Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '6px'
            }}>
              Business Name <span style={{ color: brandColors.neutral[500], fontWeight: '400' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = brandColors.primary[500]
              }}
              onBlur={(e) => {
                e.target.style.borderColor = brandColors.neutral[300]
              }}
            />
          </div>

          {/* Client Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '6px'
            }}>
              Client Name <span style={{ color: brandColors.neutral[500], fontWeight: '400' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = brandColors.primary[500]
              }}
              onBlur={(e) => {
                e.target.style.borderColor = brandColors.neutral[300]
              }}
            />
          </div>

          {/* Greeting Message */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '6px'
            }}>
              Greeting Message <span style={{ color: brandColors.neutral[500], fontWeight: '400' }}>(optional)</span>
            </label>
            <textarea
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder="Hi [Client Name], here's your invoice for the work completed by [Business Name]..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                resize: 'vertical',
                minHeight: '100px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = brandColors.primary[500]
              }}
              onBlur={(e) => {
                e.target.style.borderColor = brandColors.neutral[300]
              }}
            />
            <div style={{
              fontSize: '12px',
              color: brandColors.neutral[500],
              marginTop: '4px'
            }}>
              Use [Client Name] and [Business Name] as placeholders
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '24px'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: brandColors.neutral[600],
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.neutral[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            style={{
              padding: '10px 20px',
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
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[600]
            }}
          >
            Send Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
