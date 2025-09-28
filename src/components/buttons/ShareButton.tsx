import React, { useState } from 'react'
import { Share2, Copy, Check, X } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'

interface ShareButtonProps {
  invoiceData: any
  onShare?: () => void
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function ShareButton({ 
  invoiceData, 
  onShare,
  style,
  size = 'md',
  variant = 'secondary'
}: ShareButtonProps) {
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    setShowSharePopup(true)
    
    if (onShare) {
      onShare()
    }
  }

  const handleCopyLink = async () => {
    const invoiceLink = `${window.location.origin}/invoice/preview?invoice=${invoiceData?.invoiceNumber}`
    try {
      await navigator.clipboard.writeText(invoiceLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleCloseSharePopup = () => {
    setShowSharePopup(false)
    setCopied(false)
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
      case 'primary':
        return {
          backgroundColor: brandColors.primary[600],
          color: brandColors.white,
          border: 'none'
        }
      default: // secondary
        return {
          backgroundColor: brandColors.primary[200],
          color: brandColors.primary[800],
          border: 'none'
        }
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
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
            e.currentTarget.style.backgroundColor = brandColors.primary[300]
          }
        }}
        onMouseLeave={(e) => {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = brandColors.primary[600]
          } else {
            e.currentTarget.style.backgroundColor = brandColors.primary[200]
          }
        }}
      >
        <Share2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        {size !== 'sm' && <span>Share</span>}
      </button>

      {/* Share Popup */}
      {showSharePopup && (
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
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Share Invoice
              </h3>
              <button
                onClick={handleCloseSharePopup}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} color={brandColors.neutral[600]} />
              </button>
            </div>

            {/* Link Input */}
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <label style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: brandColors.neutral[700],
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Invoice Link
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: brandColors.neutral[50],
                border: `1px solid ${brandColors.neutral[200]}`,
                borderRadius: '8px'
              }}>
                <input
                  type="text"
                  value={`${window.location.origin}/invoice/preview?invoice=${invoiceData?.invoiceNumber}`}
                  readOnly
                  style={{
                    flex: 1,
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: copied ? brandColors.success[100] : brandColors.primary[100],
                    color: copied ? brandColors.success[600] : brandColors.primary[600],
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={() => {
                // TODO: Implement platform sharing
                toast('Platform sharing will be available in Phase 2!', {
                  icon: 'ℹ️',
                })
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[600]
              }}
            >
              <Share2 size={16} />
              Share to Platforms
            </button>
          </div>
        </div>
      )}
    </>
  )
}
