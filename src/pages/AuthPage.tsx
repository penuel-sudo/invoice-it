import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Input, Label, Card } from '../components/ui'
import { brandColors, colorSchemes, typographyPresets } from '../stylings'
import { useAuth } from '../lib/useAuth'

// Helper function to convert typography presets to inline styles
const getTypographyStyle = (preset: any) => ({
  fontSize: typeof preset.fontSize === 'string' ? preset.fontSize : (Array.isArray(preset.fontSize) ? preset.fontSize[0] : '1rem'),
  fontWeight: preset.fontWeight,
  lineHeight: preset.lineHeight,
  letterSpacing: preset.letterSpacing,
})

interface AuthFormData {
  name: string
  email: string
  password: string
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const loadingToast = toast.loading(isLogin ? 'Signing in...' : 'Creating account...')
    
    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          toast.error(error.message || 'Login failed', { id: loadingToast })
        } else {
          toast.success('Welcome back!', { id: loadingToast })
          navigate('/dashboard')
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name)
        if (error) {
          toast.error(error.message || 'Signup failed', { id: loadingToast })
        } else {
          toast.success('Account created! Check your email for verification link.', { id: loadingToast })
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    const loadingToast = toast.loading('Signing in with Google...')
    
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message || 'Google auth failed', { id: loadingToast })
      } else {
        toast.success('Redirecting to Google...', { id: loadingToast })
      }
    } catch (error) {
      toast.error('An unexpected error occurred', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${brandColors.primary[50]} 0%, ${brandColors.white} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-container"
        style={{ 
          width: '100%', 
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}
      >
        {/* Left Side - Logo and Branding (Desktop Only) */}
        <div className="auth-left-side" style={{
          flex: 1,
          display: 'none'
        }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              textAlign: 'left',
              maxWidth: '400px'
            }}
          >
            <img 
              src="/logo3_assets_bundle/icon-256x256.png" 
              alt="Invoice-It" 
              style={{ 
                width: '80px', 
                height: '80px', 
                marginBottom: '2rem',
                borderRadius: '16px'
              }}
            />
            <h1 style={{
              ...getTypographyStyle(typographyPresets.h1),
              color: brandColors.neutral[900],
              margin: '0 0 1rem',
              fontSize: '3rem',
              fontWeight: '800',
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              Invoice-It
            </h1>
            <p style={{
              ...getTypographyStyle(typographyPresets.bodyLarge),
              color: brandColors.neutral[600],
              margin: '0 0 2rem',
              lineHeight: '1.6'
            }}>
              Create, manage, and track professional invoices with ease. 
              Streamline your business operations with our intuitive invoice management platform.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: brandColors.neutral[600],
                fontSize: '14px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: brandColors.success[500],
                  borderRadius: '50%'
                }} />
                Professional Templates
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: brandColors.neutral[600],
                fontSize: '14px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: brandColors.primary[500],
                  borderRadius: '50%'
                }} />
                PDF Export
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: brandColors.neutral[600],
                fontSize: '14px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: brandColors.warning[500],
                  borderRadius: '50%'
                }} />
                Secure & Reliable
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="auth-right-side"
          style={{
            flex: '0 0 400px',
            width: '100%',
            maxWidth: '400px'
          }}
        >
          {/* Mobile Logo (Only on Mobile) */}
          <div className="mobile-logo" style={{
            textAlign: 'center',
            marginBottom: '2rem',
            display: 'none'
          }}>
            <img 
              src="/logo3_assets_bundle/icon-256x256.png" 
              alt="Invoice-It" 
              style={{ 
                width: '64px', 
                height: '64px', 
                margin: '0 auto 1rem',
                borderRadius: '12px'
              }}
            />
            <h1 style={{
              ...getTypographyStyle(typographyPresets.h2),
              color: brandColors.neutral[900],
              margin: 0,
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              Invoice-It
            </h1>
            <p style={{
              ...getTypographyStyle(typographyPresets.bodySmall),
              color: brandColors.neutral[500],
              margin: '0.5rem 0 0'
            }}>
              Professional invoice management
            </p>
          </div>

          {/* Auth Card */}
        <Card style={{
          padding: '2rem',
          backgroundColor: brandColors.white,
          border: `1px solid ${brandColors.neutral[200]}`,
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            marginBottom: '2rem',
            backgroundColor: brandColors.neutral[50],
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isLogin ? brandColors.white : 'transparent',
                color: isLogin ? brandColors.primary[600] : brandColors.neutral[600],
                ...getTypographyStyle(typographyPresets.button),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isLogin ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: !isLogin ? brandColors.white : 'transparent',
                color: !isLogin ? brandColors.primary[600] : brandColors.neutral[600],
                ...getTypographyStyle(typographyPresets.button),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: !isLogin ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '1.5rem' }}>
                <Label htmlFor="name" style={{
                  ...getTypographyStyle(typographyPresets.label),
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Full Name (Optional)
                </Label>
                <div style={{ position: 'relative' }}>
                  <User 
                    size={20} 
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: brandColors.neutral[400]
                    }}
                  />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    style={{
                      paddingLeft: '44px',
                      height: '48px',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: getTypographyStyle(typographyPresets.body).fontSize,
                      backgroundColor: brandColors.white,
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <Label htmlFor="email" style={{
                ...getTypographyStyle(typographyPresets.label),
                color: brandColors.neutral[700],
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Email Address
              </Label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: brandColors.neutral[400]
                  }}
                />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    paddingLeft: '44px',
                    height: '48px',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: getTypographyStyle(typographyPresets.body).fontSize,
                    backgroundColor: brandColors.white,
                    transition: 'border-color 0.2s ease'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <Label htmlFor="password" style={{
                ...getTypographyStyle(typographyPresets.label),
                color: brandColors.neutral[700],
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Password
              </Label>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: brandColors.neutral[400]
                  }}
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  style={{
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    height: '48px',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: getTypographyStyle(typographyPresets.body).fontSize,
                    backgroundColor: brandColors.white,
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: brandColors.neutral[400],
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!isLogin && (
                <p style={{
                  ...getTypographyStyle(typographyPresets.caption),
                  color: brandColors.neutral[500],
                  margin: '0.5rem 0 0'
                }}>
                  Minimum 6 characters
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: colorSchemes.primaryButton.background,
                color: colorSchemes.primaryButton.text,
                border: 'none',
                borderRadius: '8px',
                ...getTypographyStyle(typographyPresets.buttonLarge),
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = colorSchemes.primaryButton.hover
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = colorSchemes.primaryButton.background
                }
              }}
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: brandColors.neutral[200]
              }} />
              <span style={{
                ...getTypographyStyle(typographyPresets.caption),
                color: brandColors.neutral[500],
                padding: '0 1rem'
              }}>
                OR
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: brandColors.neutral[200]
              }} />
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              onClick={handleGoogleAuth}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: brandColors.white,
                color: brandColors.neutral[700],
                border: `1px solid ${brandColors.neutral[200]}`,
                borderRadius: '8px',
                ...getTypographyStyle(typographyPresets.buttonLarge),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.neutral[50]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.white
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </form>

          {/* Terms */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <p style={{
              ...getTypographyStyle(typographyPresets.caption),
              color: brandColors.neutral[500],
              lineHeight: '1.5'
            }}>
              By continuing, you agree to our{' '}
              <a href="#" style={{
                color: brandColors.primary[600],
                textDecoration: 'none'
              }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" style={{
                color: brandColors.primary[600],
                textDecoration: 'none'
              }}>
                Privacy Policy
              </a>
            </p>
          </div>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
