import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { Home, ArrowLeft, LogIn } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleGoHome = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/')
    }
  }

  const handleSignIn = () => {
    navigate('/auth')
  }

  return (
    <Layout>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brandColors.white,
        padding: '1rem'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          {/* 404 Illustration */}
          <div style={{
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '8rem',
              fontWeight: '700',
              color: brandColors.primary[100],
              lineHeight: '1',
              marginBottom: '1rem'
            }}>
              404
            </div>
            <div style={{
              width: '120px',
              height: '4px',
              backgroundColor: brandColors.primary[200],
              borderRadius: '2px',
              margin: '0 auto'
            }} />
          </div>

          {/* Content */}
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: brandColors.neutral[900],
            margin: '0 0 1rem 0',
            lineHeight: '1.2'
          }}>
            Page Not Found
          </h1>
          
          <p style={{
            fontSize: '1rem',
            color: brandColors.neutral[600],
            margin: '0 0 2rem 0',
            lineHeight: '1.5'
          }}>
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={handleGoHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '200px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[700]
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[600]
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Home size={18} />
              {user ? 'Go to Dashboard' : 'Go to Home'}
            </button>

            {!user && (
              <button
                onClick={handleSignIn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: brandColors.primary[600],
                  border: `2px solid ${brandColors.primary[200]}`,
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '200px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[50]
                  e.currentTarget.style.borderColor = brandColors.primary[300]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = brandColors.primary[200]
                }}
              >
                <LogIn size={18} />
                Sign In
              </button>
            )}

            <button
              onClick={() => window.history.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: brandColors.neutral[600],
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.neutral[100]
                e.currentTarget.style.color = brandColors.neutral[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = brandColors.neutral[600]
              }}
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </div>

          {/* Help Text */}
          <div style={{
            marginTop: '3rem',
            padding: '1.5rem',
            backgroundColor: brandColors.neutral[50],
            borderRadius: '12px',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem 0'
            }}>
              Need Help?
            </h3>
            <p style={{
              fontSize: '0.75rem',
              color: brandColors.neutral[600],
              margin: '0 0 0.75rem 0',
              lineHeight: '1.4'
            }}>
              If you think this is an error, please check the URL or try refreshing the page.
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: brandColors.primary[100],
                  color: brandColors.primary[700],
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.625rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[200]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[100]
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/invoice/new')}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: brandColors.primary[100],
                  color: brandColors.primary[700],
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.625rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[200]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[100]
                }}
              >
                New Invoice
              </button>
              <button
                onClick={() => navigate('/profile')}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: brandColors.primary[100],
                  color: brandColors.primary[700],
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.625rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[200]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[100]
                }}
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
