import { useNavigate } from 'react-router-dom'
import { brandColors, typographyPresets } from '../stylings'
import { Button } from '../components/ui'

const getTypographyStyle = (preset: any) => {
  return {
    fontSize: Array.isArray(preset.fontSize) ? preset.fontSize[0] : preset.fontSize,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing,
    fontFamily: preset.fontFamily,
  }
}

export default function OnboardingPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.primary[50],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${brandColors.primary[100]} 0%, ${brandColors.primary[50]} 100%)`,
        zIndex: 0
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Invoice Preview Card */}
        <div style={{
          backgroundColor: brandColors.white,
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
          position: 'relative'
        }}>
          {/* Payment Badge */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            backgroundColor: brandColors.primary[100],
            color: brandColors.primary[700],
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            Payment - INV-123
          </div>

          {/* Amount */}
          <div style={{
            marginTop: '2rem',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem 0'
            }}>
              $450.00
            </h1>
          </div>

          {/* Client Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: brandColors.neutral[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[600]
              }}>
                NA
              </div>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.125rem 0'
                }}>
                  Nur Ahmed
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[500],
                  margin: 0
                }}>
                  Apr 15, 2024
                </p>
              </div>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: brandColors.primary[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.75rem' }}>📄</span>
            </div>
          </div>

          {/* Invoice Details */}
          <div style={{
            backgroundColor: brandColors.neutral[50],
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 0.75rem 0'
            }}>
              Invoice Details
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                  3 New Website
                </span>
                <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                  $150
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                  2 year web host
                </span>
                <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                  $100
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                  3 Domain name
                </span>
                <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                  $200
                </span>
              </div>
              <div style={{
                borderTop: `1px solid ${brandColors.neutral[200]}`,
                paddingTop: '0.5rem',
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: brandColors.neutral[900] }}>
                  TOTAL
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: brandColors.neutral[900] }}>
                  $450
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            ...getTypographyStyle(typographyPresets.h2),
            color: brandColors.neutral[900],
            margin: '0 0 0.75rem 0',
            fontWeight: '700'
          }}>
            All-in-One Invoicing Solution
          </h1>
          <p style={{
            ...getTypographyStyle(typographyPresets.body),
            color: brandColors.neutral[600],
            margin: 0,
            lineHeight: '1.6'
          }}>
            Get started with hassle-free invoicing and manage your finances efficiently.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <Button
            onClick={() => navigate('/auth/login')}
            style={{
              padding: '0.875rem 2rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            Sign up
          </Button>
          <Button
            onClick={() => navigate('/auth/login')}
            style={{
              padding: '0.875rem 2rem',
              backgroundColor: 'transparent',
              color: brandColors.primary[600],
              border: `2px solid ${brandColors.primary[200]}`,
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            Sign in
          </Button>
        </div>

        {/* Dots Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: brandColors.primary[600]
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: brandColors.neutral[300]
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: brandColors.neutral[300]
          }} />
        </div>
      </div>
    </div>
  )
}
