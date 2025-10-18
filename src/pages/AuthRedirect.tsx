import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

export default function AuthRedirect() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleRedirect = async () => {
      if (!loading && user) {
        try {
          // Check if user was created today (new user)
          const userCreatedAt = new Date(user.created_at)
          const today = new Date()
          const isNewUser = userCreatedAt.toDateString() === today.toDateString()
          
          // Redirect based on user age
          const redirectTo = isNewUser ? '/settings' : '/dashboard'
          navigate(redirectTo)
        } catch (error) {
          console.error('Error in auth redirect:', error)
          navigate('/dashboard')
        }
      } else if (!loading && !user) {
        // No user, redirect to login
        navigate('/auth/login')
      }
    }

    handleRedirect()
  }, [user, loading, navigate])

  // Show loading while checking
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{
          color: '#475569',
          fontSize: '1rem',
          margin: 0
        }}>
          Redirecting...
        </p>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
