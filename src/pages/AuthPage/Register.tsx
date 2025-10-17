import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { brandColors } from '../../stylings'
import { Button, Input, Label } from '../../components/ui'
import CountryPhoneSelector from '../../components/CountryPhoneSelector'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [phoneData, setPhoneData] = useState({
    countryCode: '',
    phoneNumber: '',
    isValid: false,
    countryName: '',
    phonePrefix: '',
    languageCode: '',
    currencyCode: '',
    timezone: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const { signInWithGoogle, refreshSession } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!phoneData.countryCode || !phoneData.phoneNumber) {
      toast.error('Please enter your phone number')
      return
    }

    if (phoneData.phoneNumber && !phoneData.isValid) {
      toast.error('Please enter a valid phone number')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      // Use serverless API for registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          countryCode: phoneData.countryCode,
          phoneNumber: phoneData.phoneNumber,
          countryName: phoneData.countryName || '',
          phonePrefix: phoneData.phonePrefix || '',
          languageCode: phoneData.languageCode || '',
          currencyCode: phoneData.currencyCode || '',
          timezone: phoneData.timezone || ''
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }

      // Refresh the frontend auth state to sync with server
      await refreshSession()

      toast.success(data.message || 'Account created successfully! Please check your email to verify your account.')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during registration')
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
      
      // Refresh session to get user data
      await refreshSession()
      
      // Redirect to settings to complete profile (especially phone number)
      toast.success('Welcome! Please complete your profile in settings.')
      navigate('/settings')
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during Google sign in')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
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
          marginTop: window.innerWidth < 768 ? '5rem' : '1rem'
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
            Create your account
          </h1>
          <p style={{
            fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
            color: brandColors.neutral[600],
            margin: 0,
            fontWeight: '400',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Get started with InvoiceIt
          </p>
        </div>

        {/* Auth Form */}
        <div style={{
          width: '100%',
          border: `1px solid ${brandColors.neutral[200]}`,
          borderRadius: '16px',
          padding: '2rem',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '50px',
              transition: 'all 0.2s ease'
            }}>
              <Input
                id="name"
                type="text"
                placeholder=" "
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onFocus={(e) => {
                  setFocused('name')
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
                  padding: window.innerWidth < 768 ? '1.25rem 1.5rem' : '1.25rem 1.5rem',
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
              <Label htmlFor="name" style={{ 
                position: 'absolute',
                left: '1.5rem',
                top: (formData.name || focused === 'name') ? '-0.5rem' : '50%',
                transform: (formData.name || focused === 'name') ? 'translateY(0)' : 'translateY(-50%)',
                fontSize: formData.name ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem'),
                fontWeight: '500',
                color: formData.name ? brandColors.primary[600] : brandColors.neutral[500],
                backgroundColor: brandColors.white,
                padding: formData.name ? '0 0.5rem' : '0',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                fontFamily: 'Poppins, sans-serif',
                zIndex: 20
              }}>
                Name
              </Label>
            </div>
          </div>

          <CountryPhoneSelector
            value={{
              countryCode: phoneData.countryCode,
              phoneNumber: phoneData.phoneNumber
            }}
            onChange={(value) => {
              setPhoneData({
                countryCode: value.countryCode,
                phoneNumber: value.phoneNumber,
                isValid: value.isValid,
                countryName: value.countryName || '',
                phonePrefix: value.phonePrefix || '',
                languageCode: value.languageCode || '',
                currencyCode: value.currencyCode || '',
                timezone: value.timezone || ''
              })
              setFormData(prev => ({
                ...prev,
                countryCode: value.countryCode,
                phoneNumber: value.phoneNumber
              }))
            }}
            placeholder="Enter your phone number"
            required={true}
            autoDetectCountry={true}
          />

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
                backgroundColor: brandColors.white,
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
                backgroundColor: brandColors.white,
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
            {isLoading ? 'Registering...' : 'Sign Up'}
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
            Already have an account?{' '}
            <Link
              to="/auth/login"
              style={{
                background: 'none',
                border: 'none',
                color: brandColors.primary[600],
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Sign in
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
    </div>
  )
}
