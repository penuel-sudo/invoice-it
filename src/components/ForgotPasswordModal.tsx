import { useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Button, Input, Label } from './ui'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        toast.error(error.message)
      } else {
        setIsEmailSent(true)
        toast.success('Password reset email sent!')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setIsEmailSent(false)
    setFocused(false)
    onClose()
  }

  if (!isOpen) return null

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
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: brandColors.white,
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: brandColors.neutral[500],
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.neutral[100]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <X size={20} />
        </button>

        {!isEmailSent ? (
          <>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.025em',
                fontFamily: 'Poppins, sans-serif'
              }}>
                Reset your password
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[600],
                margin: 0,
                fontWeight: '400',
                fontFamily: 'Poppins, sans-serif'
              }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'relative',
                  border: `1px solid ${brandColors.neutral[300]}`,
                  borderRadius: '50px',
                  transition: 'all 0.2s ease'
                }}>
                  <Input
                    id="email"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => {
                      setFocused(true)
                      e.target.parentElement.style.borderColor = brandColors.primary[400]
                      e.target.parentElement.style.boxShadow = `0 0 0 2px ${brandColors.primary[100]}`
                    }}
                    onBlur={(e) => {
                      setFocused(false)
                      e.target.parentElement.style.borderColor = brandColors.neutral[300]
                      e.target.parentElement.style.boxShadow = 'none'
                    }}
                    style={{
                      width: '100%',
                      padding: '1.125rem 1.5rem',
                      border: 'none',
                      borderRadius: '50px',
                      fontSize: '1rem',
                      backgroundColor: 'transparent',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      fontFamily: 'Poppins, sans-serif',
                      height: '3.25rem'
                    }}
                  />
                  <Label htmlFor="email" style={{ 
                    position: 'absolute',
                    left: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: brandColors.neutral[500],
                    backgroundColor: brandColors.white,
                    padding: '0',
                    opacity: (email || focused) ? 0 : 1,
                    transition: 'all 0.2s ease',
                    pointerEvents: 'none',
                    fontFamily: 'Poppins, sans-serif',
                    zIndex: 20
                  }}>
                    Email
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1.125rem 1.5rem',
                  backgroundColor: brandColors.primary[600],
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  height: '3.25rem'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = brandColors.primary[700]
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = brandColors.primary[600]
                  }
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </>
        ) : (
          <>
            {/* Success State */}
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: brandColors.primary[100],
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: `2px solid ${brandColors.primary[200]}`
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={brandColors.primary[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.025em',
                fontFamily: 'Poppins, sans-serif'
              }}>
                Check your email
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[600],
                margin: '0 0 0.75rem 0',
                fontWeight: '400',
                fontFamily: 'Poppins, sans-serif'
              }}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p style={{
                fontSize: '0.8125rem',
                color: brandColors.neutral[500],
                margin: 0,
                fontWeight: '400',
                fontFamily: 'Poppins, sans-serif',
                fontStyle: 'italic'
              }}>
                If you don't see it, check your spam folder.
              </p>
            </div>

            <Button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '1.125rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '50px',
                fontSize: '1rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                height: '3.25rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[600]
              }}
            >
              Back to Login
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
