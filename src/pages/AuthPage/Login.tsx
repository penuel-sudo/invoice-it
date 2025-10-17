import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { brandColors, typographyPresets } from '../../stylings'
import { Button, Input, Label } from '../../components/ui'
import ForgotPasswordModal from '../../components/ForgotPasswordModal'

const getTypographyStyle = (preset: any) => {
  return {
    fontSize: Array.isArray(preset.fontSize) ? preset.fontSize[0] : preset.fontSize,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing,
    fontFamily: preset.fontFamily,
  }
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false)

  const { signIn, signInWithGoogle } = useAuth()
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
      // Use serverless API for login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Login failed')
        return
      }

      toast.success('Welcome back!')
      navigate('/dashboard')
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
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during Google sign in')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            ...getTypographyStyle(typographyPresets.h1),
            color: brandColors.primary,
            marginBottom: '0.5rem'
          }}>
            Welcome Back
          </h1>
          <p style={{
            ...getTypographyStyle(typographyPresets.body),
            color: brandColors.textSecondary,
            margin: 0
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Label htmlFor="email" style={{ 
              ...getTypographyStyle(typographyPresets.label),
              color: brandColors.textPrimary,
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `2px solid ${focused === 'email' ? brandColors.primary : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: brandColors.textPrimary,
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label htmlFor="password" style={{ 
              ...getTypographyStyle(typographyPresets.label),
              color: brandColors.textPrimary,
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Password
            </Label>
            <div style={{ position: 'relative' }}>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: `2px solid ${focused === 'password' ? brandColors.primary : 'rgba(255, 255, 255, 0.3)'}`,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  color: brandColors.textPrimary,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
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
                  color: brandColors.textSecondary,
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <button
              type="button"
              onClick={() => setIsForgotPasswordModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: brandColors.primary,
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline'
              }}
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: brandColors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '1.5rem 0',
          color: brandColors.textSecondary
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.3)' }} />
          <span style={{ margin: '0 1rem', fontSize: '0.875rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.3)' }} />
        </div>

        {/* Google Sign In */}
        <Button
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.1)',
            color: brandColors.textPrimary,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
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

        {/* Navigation Link */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <p style={{
            ...getTypographyStyle(typographyPresets.body),
            color: brandColors.textSecondary,
            margin: 0
          }}>
            Don't have an account?{' '}
            <Link 
              to="/auth/register" 
              style={{
                color: brandColors.primary,
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Sign up
            </Link>
          </p>
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
