import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Home, ArrowLeft } from 'lucide-react'

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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: brandColors.white,
      padding: '1rem',
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* 404 Number */}
        <div style={{
          fontSize: '6rem',
          fontWeight: '700',
          color: brandColors.primary[100],
          lineHeight: '1',
          marginBottom: '1rem'
        }}>
          404
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: brandColors.neutral[900],
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Page Not Found
        </h1>
        
        {/* Description */}
        <p style={{
          fontSize: '0.875rem',
          color: brandColors.neutral[600],
          margin: '0 0 2rem 0',
          lineHeight: '1.5',
          fontFamily: 'Poppins, sans-serif'
        }}>
          The page you're looking for doesn't exist.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
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
              borderRadius: '50px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '180px',
              justifyContent: 'center',
              fontFamily: 'Poppins, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[700]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[600]
            }}
          >
            <Home size={16} />
            {user ? 'Go to Dashboard' : 'Go to Home'}
          </button>

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
              transition: 'all 0.2s ease',
              fontFamily: 'Poppins, sans-serif'
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
            <ArrowLeft size={14} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
