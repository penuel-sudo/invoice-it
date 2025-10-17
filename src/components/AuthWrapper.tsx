import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { Toaster } from 'react-hot-toast'
import { toastConfig } from '../lib/toastConfig'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export default function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User needs to be authenticated but isn't
        navigate('/auth/login', { replace: true })
      } else if (!requireAuth && user) {
        // User is authenticated but trying to access auth page
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, loading, navigate, requireAuth])

  // Show loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            margin: 0
          }}>
            Loading...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Show content if authentication state matches requirement
  if ((requireAuth && user) || (!requireAuth && !user)) {
    return (
      <>
        {children}
        <Toaster toastOptions={toastConfig} />
      </>
    )
  }

  // Don't render anything while redirecting
  return null
}
