import React from 'react'
import { Send } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'

interface SendButtonProps {
  invoiceData: any
  onSend?: () => void
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function SendButton({ 
  invoiceData, 
  onSend,
  style,
  size = 'md',
  variant = 'primary'
}: SendButtonProps) {
  const handleSend = () => {
    // TODO: Implement email sending
    toast('Email sending will be available in Phase 2!', {
      icon: 'ℹ️',
    })
    
    if (onSend) {
      onSend()
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
      onClick={handleSend}
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
      <Send size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      {size !== 'sm' && <span>Send</span>}
    </button>
  )
}
