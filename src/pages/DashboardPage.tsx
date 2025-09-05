import { useEffect } from 'react'
import { Layout } from '../components/layout'
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
  const { user } = useAuth()

  useEffect(() => {
    // Handle OAuth callback - clear URL hash if present
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Welcome Section */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <h1 style={{
            ...getTypographyStyle(typographyPresets.h1),
            color: brandColors.neutral[900],
            margin: '0 0 0.5rem',
            fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
          }}>
            Welcome back!
          </h1>
          <p style={{
            ...getTypographyStyle(typographyPresets.bodyLarge),
            color: brandColors.neutral[600],
            margin: 0
          }}>
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              ...getTypographyStyle(typographyPresets.h4),
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem'
            }}>
              Net Revenue
            </h3>
            <p style={{
              ...getTypographyStyle(typographyPresets.h2),
              color: brandColors.success[600],
              margin: 0,
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              $4,200
            </p>
          </div>

          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              ...getTypographyStyle(typographyPresets.h4),
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem'
            }}>
              Outstanding
            </h3>
            <p style={{
              ...getTypographyStyle(typographyPresets.h2),
              color: brandColors.warning[600],
              margin: 0,
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              $1,800
            </p>
          </div>

          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              ...getTypographyStyle(typographyPresets.h4),
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem'
            }}>
              Total Invoices
            </h3>
            <p style={{
              ...getTypographyStyle(typographyPresets.h2),
              color: brandColors.primary[600],
              margin: 0,
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              12
            </p>
          </div>
        </div>

        {/* Recent Invoices */}
        <div style={{
          backgroundColor: brandColors.white,
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          border: `1px solid ${brandColors.neutral[200]}`
        }}>
          <h3 style={{
            ...getTypographyStyle(typographyPresets.h3),
            color: brandColors.neutral[900],
            margin: '0 0 1.5rem',
            fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
          }}>
            Recent Invoices
          </h3>
          <p style={{
            ...getTypographyStyle(typographyPresets.body),
            color: brandColors.neutral[600],
            margin: 0
          }}>
            Your recent invoices will appear here. Start by creating your first invoice!
          </p>
        </div>
      </div>
    </Layout>
  )
}