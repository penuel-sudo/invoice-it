import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { brandColors, typographyPresets } from '../stylings'
import { Button, Input, Label } from '../components/ui'

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
      backgroundColor: brandColors.neutral[50],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth < 768 ? '1.5rem' : '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header with Logo and Site Name */}
      <div style={{
        position: 'fixed',
        top: '1.5rem',
        right: window.innerWidth < 768 ? '1.5rem' : '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 10
      }}>
        <img 
          src="/logo_web_app_256x256.png" 
          alt="InvoiceIt" 
          style={{ 
            width: window.innerWidth < 768 ? '32px' : '40px', 
            height: window.innerWidth < 768 ? '32px' : '40px' 
          }}
        />
        {window.innerWidth >= 768 && (
          <span style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: brandColors.neutral[900],
            letterSpacing: '-0.025em'
          }}>
            InvoiceIt
          </span>
        )}
      </div>

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
          marginBottom: '2.5rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em'
          }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{
            fontSize: '1rem',
            color: brandColors.neutral[600],
            margin: 0,
            fontWeight: '400'
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
            <div>
              <Label htmlFor="name" style={{ 
                color: brandColors.neutral[700],
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth < 768 ? '1rem 1.5rem' : '1.25rem 1.5rem',
                  border: `1px solid ${brandColors.neutral[200]}`,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: brandColors.white,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = brandColors.primary[300]
                  e.target.style.boxShadow = `0 0 0 3px ${brandColors.primary[100]}`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = brandColors.neutral[200]
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" style={{ 
              color: brandColors.neutral[700],
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: window.innerWidth < 768 ? '1rem 1.5rem' : '1.25rem 1.5rem',
                border: `1px solid ${brandColors.neutral[200]}`,
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: brandColors.white,
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = brandColors.primary[300]
                e.target.style.boxShadow = `0 0 0 3px ${brandColors.primary[100]}`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = brandColors.neutral[200]
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div>
            <Label htmlFor="password" style={{ 
              color: brandColors.neutral[700],
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Password
            </Label>
            <div style={{ position: 'relative' }}>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth < 768 ? '1rem 1.5rem' : '1.25rem 1.5rem',
                  paddingRight: '3.5rem',
                  border: `1px solid ${brandColors.neutral[200]}`,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: brandColors.white,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = brandColors.primary[300]
                  e.target.style.boxShadow = `0 0 0 3px ${brandColors.primary[100]}`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = brandColors.neutral[200]
                  e.target.style.boxShadow = 'none'
                }}
              />
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
                  padding: '0.25rem'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '0.5rem 0'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: brandColors.neutral[600],
                cursor: 'pointer'
              }}>
                <input type="checkbox" style={{ margin: 0 }} />
                Remember me
              </label>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: brandColors.primary[600],
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: window.innerWidth < 768 ? '1rem 1.5rem' : '1.25rem 1.5rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
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
            fontSize: '0.875rem',
            color: brandColors.neutral[500],
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: brandColors.neutral[200]
            }}></div>
            <span style={{
              backgroundColor: brandColors.neutral[50],
              padding: '0 1rem',
              color: brandColors.neutral[500]
            }}>
              OR
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: window.innerWidth < 768 ? '1rem 1.5rem' : '1.25rem 1.5rem',
              backgroundColor: brandColors.white,
              color: brandColors.neutral[700],
              border: `1px solid ${brandColors.neutral[200]}`,
              borderRadius: '12px',
              fontSize: '1rem',
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
                e.currentTarget.style.borderColor = brandColors.neutral[200]
                e.currentTarget.style.backgroundColor = brandColors.white
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
            fontSize: '0.875rem',
            color: brandColors.neutral[600]
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
                textDecoration: 'none'
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Footer Links */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: brandColors.neutral[500]
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
  )
}