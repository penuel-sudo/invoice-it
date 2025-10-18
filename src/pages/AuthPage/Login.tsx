import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { brandColors } from '../../stylings'
import { Button, Input, Label } from '../../components/ui'
import ForgotPasswordModal from '../../components/ForgotPasswordModal'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false)

  const { signInWithGoogle, refreshSession } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      // Use direct Supabase authentication (frontend)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Redirect to auth-redirect page to handle user age check
      navigate('/auth-redirect')
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message)
        return
      }
      
      // Google OAuth will redirect to /auth-redirect automatically
      // No need to handle redirect here
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during Google sign in')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Mobile Logo at Top */}
      {window.innerWidth < 768 && (
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: brandColors.primary[100],
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${brandColors.primary[200]}`
          }}>
            <img 
              src="/logo_web_app_256x256.png" 
              alt="InvoiceIt" 
              style={{ width: '40px', height: '40px' }}
            />
          </div>
          <span style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: brandColors.neutral[900],
            letterSpacing: '-0.025em'
          }}>
            InvoiceIt
          </span>
        </div>
      )}

      {/* Desktop Logo on left */}
      {window.innerWidth >= 768 && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          left: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 10
        }}>
          <img 
            src="/logo_web_app_256x256.png" 
            alt="InvoiceIt" 
            style={{ width: '40px', height: '40px' }}
          />
          <span style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: brandColors.neutral[900],
            letterSpacing: '-0.025em'
          }}>
            InvoiceIt
          </span>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Welcome Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: window.innerWidth < 768 ? '2rem' : '1.5rem',
          marginTop: window.innerWidth < 768 ? '5rem' : '2rem'
        }}>
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '1.875rem' : '2.25rem',
            fontWeight: '700',
            color: brandColors.neutral[900],
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em',
            fontFamily: 'Poppins, sans-serif',
            lineHeight: '1.2'
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
            color: brandColors.neutral[600],
            margin: 0,
            fontWeight: '400',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Auth Form */}
        <div style={{
          width: '100%'
        }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '50px',
              transition: 'all 0.2s ease',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <Input
                id="email"
                type="email"
                placeholder=" "
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onFocus={(e) => {
                  setFocused('email')
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
                  maxWidth: '400px',
                  padding: window.innerWidth < 768 ? '1.125rem 1.5rem' : '1.125rem 1.5rem',
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
              <Label htmlFor="email" style={{ 
                position: 'absolute',
                left: '1.5rem',
                top: (formData.email || focused === 'email') ? '-0.5rem' : '50%',
                transform: (formData.email || focused === 'email') ? 'translateY(0)' : 'translateY(-50%)',
                fontSize: formData.email ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem'),
                fontWeight: '500',
                color: formData.email ? brandColors.primary[600] : brandColors.neutral[500],
                backgroundColor: 'transparent',
                padding: formData.email ? '0 0.5rem' : '0',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                fontFamily: 'Poppins, sans-serif',
                zIndex: 20
              }}>
                Email
              </Label>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '50px',
              transition: 'all 0.2s ease',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
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
                  maxWidth: '400px',
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
                backgroundColor: 'transparent',
                padding: formData.password ? '0 0.5rem' : '0',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                fontFamily: 'Poppins, sans-serif',
                zIndex: 20
              }}>
                Password
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
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

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '0.25rem',
            marginBottom: '0.5rem'
          }}>
            <button
              type="button"
              onClick={() => setIsForgotPasswordModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: brandColors.primary[600],
                fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: window.innerWidth < 768 ? '1.125rem 1.5rem' : '1.125rem 1.5rem',
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              backdropFilter: 'blur(10px)',
              color: brandColors.white,
              border: 'none',
              marginTop: '0.5rem',
              borderRadius: '50px',
              boxShadow: '0 4px 6px rgba(34, 197, 94, 0.3)',
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
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.9)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.8)'
              }
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <div style={{
              flexGrow: 1,
              height: '1px',
              backgroundColor: brandColors.neutral[300]
            }}></div>
            <span style={{
              padding: '0 1rem',
              fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
              color: brandColors.neutral[500],
              fontWeight: '500'
            }}>
              OR
            </span>
            <div style={{
              flexGrow: 1,
              height: '1px',
              backgroundColor: brandColors.neutral[300]
            }}></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: window.innerWidth < 768 ? '1.25rem 1.5rem' : '1.25rem 1.5rem',
              backgroundColor: 'transparent',
              color: brandColors.neutral[700],
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '50px',
              fontSize: window.innerWidth < 768 ? '1rem' : '1rem',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              height: window.innerWidth < 768 ? '3.5rem' : '3.5rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = brandColors.neutral[300]
                e.currentTarget.style.backgroundColor = brandColors.neutral[50]
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = brandColors.neutral[300]
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
            color: brandColors.neutral[600],
            fontFamily: 'Poppins, sans-serif'
          }}>
            Don't have an account?{' '}
            <Link
              to="/auth/register"
              style={{
                background: 'none',
                border: 'none',
                color: brandColors.primary[600],
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Sign up
            </Link>
          </div>

        </form>
        </div>

        {/* Footer Links - Outside Form */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: window.innerWidth < 768 ? '0.625rem' : '0.75rem',
          color: brandColors.neutral[500],
          fontFamily: 'Poppins, sans-serif'
        }}>
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>
            Terms of Use
          </span>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>
            Privacy Policy
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  )
}
