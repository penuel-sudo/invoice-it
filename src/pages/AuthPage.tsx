import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { brandColors, typographyPresets } from '../stylings'
import { Button, Input, Label } from '../components/ui'

// Import Poppins font
const link = document.createElement('link')
link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
link.rel = 'stylesheet'
document.head.appendChild(link)

const getTypographyStyle = (preset: any) => {
  return {
    fontSize: Array.isArray(preset.fontSize) ? preset.fontSize[0] : preset.fontSize,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing,
    fontFamily: preset.fontFamily,
  }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const { signUp, signIn, signInWithGoogle } = useAuth()
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

    if (!isLogin && !formData.name) {
      toast.error('Please enter your name')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Welcome back!')
          navigate('/dashboard')
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name)
        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Account created successfully!')
          navigate('/dashboard')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message)
      }
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed')
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

      {/* Desktop Logo on Left */}
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
          marginBottom: window.innerWidth < 768 ? '3rem' : '2.5rem',
          marginTop: window.innerWidth < 768 ? '6rem' : '0'
        }}>
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '1.75rem' : '2rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{
            fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
            color: brandColors.neutral[600],
            margin: 0,
            fontWeight: '400',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {isLogin ? 'Sign in to your account' : 'Get started with InvoiceIt'}
          </p>
        </div>

        {/* Auth Form */}
        <div style={{
          width: '100%'
        }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <Input
                id="name"
                type="text"
                placeholder=" "
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth < 768 ? '1.25rem 1.5rem 0.75rem 1.5rem' : '1.5rem 1.5rem 1rem 1.5rem',
                  border: `1px solid ${brandColors.neutral[300]}`,
                  borderRadius: '50px',
                  fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = brandColors.primary[400]
                  e.target.style.boxShadow = `0 0 0 2px ${brandColors.primary[100]}`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = brandColors.neutral[300]
                  e.target.style.boxShadow = 'none'
                }}
              />
              <Label htmlFor="name" style={{ 
                position: 'absolute',
                left: '1.5rem',
                top: formData.name ? '0.5rem' : '50%',
                transform: formData.name ? 'translateY(0)' : 'translateY(-50%)',
                fontSize: formData.name ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem'),
                fontWeight: '500',
                color: formData.name ? brandColors.primary[600] : brandColors.neutral[500],
                backgroundColor: brandColors.white,
                padding: formData.name ? '0 0.5rem' : '0',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                fontFamily: 'Poppins, sans-serif'
              }}>
                Name
              </Label>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Input
              id="email"
              type="email"
              placeholder=" "
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: window.innerWidth < 768 ? '1.25rem 1.5rem 0.75rem 1.5rem' : '1.5rem 1.5rem 1rem 1.5rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '50px',
                fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                backgroundColor: 'transparent',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                fontFamily: 'Poppins, sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = brandColors.primary[400]
                e.target.style.boxShadow = `0 0 0 2px ${brandColors.primary[100]}`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = brandColors.neutral[300]
                e.target.style.boxShadow = 'none'
              }}
            />
            <Label htmlFor="email" style={{ 
              position: 'absolute',
              left: '1.5rem',
              top: formData.email ? '0.5rem' : '50%',
              transform: formData.email ? 'translateY(0)' : 'translateY(-50%)',
              fontSize: formData.email ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem'),
              fontWeight: '500',
              color: formData.email ? brandColors.primary[600] : brandColors.neutral[500],
              backgroundColor: brandColors.white,
              padding: formData.email ? '0 0.5rem' : '0',
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Email
            </Label>
          </div>

          <div style={{ position: 'relative' }}>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder=" "
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              style={{
                width: '100%',
                padding: window.innerWidth < 768 ? '1.25rem 3.5rem 0.75rem 1.5rem' : '1.5rem 3.5rem 1rem 1.5rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '50px',
                fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                backgroundColor: 'transparent',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                fontFamily: 'Poppins, sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = brandColors.primary[400]
                e.target.style.boxShadow = `0 0 0 2px ${brandColors.primary[100]}`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = brandColors.neutral[300]
                e.target.style.boxShadow = 'none'
              }}
            />
            <Label htmlFor="password" style={{ 
              position: 'absolute',
              left: '1.5rem',
              top: formData.password ? '0.5rem' : '50%',
              transform: formData.password ? 'translateY(0)' : 'translateY(-50%)',
              fontSize: formData.password ? '0.75rem' : (window.innerWidth < 768 ? '0.875rem' : '1rem'),
              fontWeight: '500',
              color: formData.password ? brandColors.primary[600] : brandColors.neutral[500],
              backgroundColor: brandColors.white,
              padding: formData.password ? '0 0.5rem' : '0',
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Password
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
                padding: '0.25rem'
              }}
            >
              {showPassword ? <EyeOff size={window.innerWidth < 768 ? 18 : 20} /> : <Eye size={window.innerWidth < 768 ? 18 : 20} />}
            </button>
          </div>

          {isLogin && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '0.25rem',
              marginBottom: '0.5rem'
            }}>
              <button
                type="button"
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
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            style={{
              padding: window.innerWidth < 768 ? '1rem 1.5rem' : '1.25rem 1.5rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '50px',
              fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
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
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </Button>

          <div style={{
            textAlign: 'center',
            margin: '1.5rem 0',
            fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
            color: brandColors.neutral[500],
            position: 'relative',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: brandColors.neutral[300]
            }}></div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: brandColors.neutral[300]
            }}></div>
            <span style={{
              backgroundColor: brandColors.white,
              padding: '0 1rem',
              color: brandColors.neutral[500]
            }}>
              ——————— Or ———————
            </span>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            style={{
              padding: window.innerWidth < 768 ? '1rem 1.5rem' : '1.25rem 1.5rem',
              backgroundColor: 'transparent',
              color: brandColors.neutral[700],
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '50px',
              fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
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
            <svg width={window.innerWidth < 768 ? 18 : 20} height={window.innerWidth < 768 ? 18 : 20} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
            color: brandColors.neutral[600],
            fontFamily: 'Poppins, sans-serif'
          }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: brandColors.primary[600],
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          {/* Footer Links */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
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
        </form>
        </div>
      </div>
    </div>
  )
}