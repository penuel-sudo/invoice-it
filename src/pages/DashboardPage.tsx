import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/useAuth'
import { brandColors, typographyPresets } from '../stylings'

// Helper function to convert typography presets to inline styles
const getTypographyStyle = (preset: any) => ({
  fontSize: typeof preset.fontSize === 'string' ? preset.fontSize : (Array.isArray(preset.fontSize) ? preset.fontSize[0] : '1rem'),
  fontWeight: preset.fontWeight,
  lineHeight: preset.lineHeight,
  letterSpacing: preset.letterSpacing,
})

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Handle OAuth callback - clear URL hash if present
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/auth')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }


  if (!user) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.neutral[50],
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <div>
            <h1 style={{
              ...getTypographyStyle(typographyPresets.h2),
              color: brandColors.neutral[900],
              margin: 0,
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              Dashboard
            </h1>
            <p style={{
              ...getTypographyStyle(typographyPresets.bodySmall),
              color: brandColors.neutral[600],
              margin: '0.25rem 0 0'
            }}>
              Welcome back, {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.error[500],
              color: brandColors.white,
              border: 'none',
              borderRadius: '6px',
              ...getTypographyStyle(typographyPresets.button),
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.error[600]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.error[500]
            }}
          >
            Sign Out
          </button>
        </header>

        <div style={{
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <h2 style={{
            ...getTypographyStyle(typographyPresets.h3),
            color: brandColors.neutral[900],
            margin: '0 0 1rem'
          }}>
            Invoice Management
          </h2>
          <p style={{
            ...getTypographyStyle(typographyPresets.body),
            color: brandColors.neutral[600],
            margin: 0
          }}>
            Your invoice dashboard is ready! This is where you'll manage all your invoices.
          </p>
        </div>
      </div>
    </div>
  )
}
