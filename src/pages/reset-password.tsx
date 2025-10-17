import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Button, Input, Label } from '../components/ui'

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  // Handle Supabase password reset flow
  useEffect(() => {
    // Check if we have tokens in URL fragments (Supabase redirects with #)
    const hash = window.location.hash
    const urlParams = new URLSearchParams(hash.substring(1))
    
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    const type = urlParams.get('type')
    
    // Supabase will automatically handle the session when tokens are in URL
    // No additional action needed here
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await updatePassword(formData.password)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated successfully!')
        navigate('/auth/login')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.white,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth < 768 ? '1.5rem' : '2rem',
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Back Button */}
      <button
            onClick={() => navigate('/auth/login')}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: brandColors.neutral[600],
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          fontFamily: 'Poppins, sans-serif',
          padding: '0.5rem',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = brandColors.neutral[100]
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>

      {/* Main Content */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '1.75rem' : '2rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Set new password
          </h1>
          <p style={{
            fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
            color: brandColors.neutral[600],
            margin: 0,
            fontWeight: '400',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div style={{
          width: '100%'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* New Password */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'relative',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '50px',
                transition: 'all 0.2s ease'
              }}>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={(e) => {
                    setFocused('password')
                    e.target.parentElement.style.borderColor = brandColors.primary[400]
                    e.target.parentElement.style.boxShadow = `0 0 0 2px ${brandColors.primary[100]}`
                  }}
                  onBlur={(e) => {
                    setFocused('')
                    e.target.parentElement.style.borderColor = brandColors.neutral[300]
                    e.target.parentElement.style.boxShadow = 'none'
                  }}
                  style={{
                    width: '100%',
                    padding: window.innerWidth < 768 ? '1.125rem 3.5rem 1.125rem 1.5rem' : '1.125rem 3.5rem 1.125rem 1.5rem',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: window.innerWidth < 768 ? '1rem' : '1rem',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    fontFamily: 'Poppins, sans-serif',
                    height: window.innerWidth < 768 ? '3.25rem' : '3.25rem'
                  }}
                />
                <Label htmlFor="password" style={{ 
                  position: 'absolute',
                  left: '1.5rem',
                  top: (formData.password || focused === 'password') ? '-0.5rem' : '50%',
                  transform: (formData.password || focused === 'password') ? 'translateY(0)' : 'translateY(-50%)',
                  fontSize: formData.password ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem'),
                  fontWeight: '500',
                  color: formData.password ? brandColors.primary[600] : brandColors.neutral[500],
                  backgroundColor: brandColors.white,
                  padding: formData.password ? '0 0.5rem' : '0',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'none',
                  fontFamily: 'Poppins, sans-serif',
                  zIndex: 20
                }}>
                  New Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: brandColors.neutral[500],
                    padding: '0.25rem',
                    zIndex: 10
                  }}
                >
                  {showPassword ? <EyeOff size={window.innerWidth < 768 ? 18 : 20} /> : <Eye size={window.innerWidth < 768 ? 18 : 20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'relative',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '50px',
                transition: 'all 0.2s ease'
              }}>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder=" "
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onFocus={(e) => {
                    setFocused('confirmPassword')
                    e.target.parentElement.style.borderColor = brandColors.primary[400]
                    e.target.parentElement.style.boxShadow = `0 0 0 2px ${brandColors.primary[100]}`
                  }}
                  onBlur={(e) => {
                    setFocused('')
                    e.target.parentElement.style.borderColor = brandColors.neutral[300]
                    e.target.parentElement.style.boxShadow = 'none'
                  }}
                  style={{
                    width: '100%',
                    padding: window.innerWidth < 768 ? '1.125rem 3.5rem 1.125rem 1.5rem' : '1.125rem 3.5rem 1.125rem 1.5rem',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: window.innerWidth < 768 ? '1rem' : '1rem',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    fontFamily: 'Poppins, sans-serif',
                    height: window.innerWidth < 768 ? '3.25rem' : '3.25rem'
                  }}
                />
                <Label htmlFor="confirmPassword" style={{ 
                  position: 'absolute',
                  left: '1.5rem',
                  top: (formData.confirmPassword || focused === 'confirmPassword') ? '-0.5rem' : '50%',
                  transform: (formData.confirmPassword || focused === 'confirmPassword') ? 'translateY(0)' : 'translateY(-50%)',
                  fontSize: formData.confirmPassword ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem'),
                  fontWeight: '500',
                  color: formData.confirmPassword ? brandColors.primary[600] : brandColors.neutral[500],
                  backgroundColor: brandColors.white,
                  padding: formData.confirmPassword ? '0 0.5rem' : '0',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'none',
                  fontFamily: 'Poppins, sans-serif',
                  zIndex: 20
                }}>
                  Confirm Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: brandColors.neutral[500],
                    padding: '0.25rem',
                    zIndex: 10
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={window.innerWidth < 768 ? 18 : 20} /> : <Eye size={window.innerWidth < 768 ? 18 : 20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: window.innerWidth < 768 ? '1.125rem 1.5rem' : '1.125rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                marginTop: '0.5rem',
                borderRadius: '50px',
                fontSize: window.innerWidth < 768 ? '1rem' : '1rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                height: window.innerWidth < 768 ? '3.25rem' : '3.25rem'
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
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
