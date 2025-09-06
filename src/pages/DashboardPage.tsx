import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors, typographyPresets } from '../stylings'
import { Layout } from '../components/layout'
import { FileText, TrendingUp, Users, Plus } from 'lucide-react'

const getTypographyStyle = (preset: any) => {
  return {
    fontSize: Array.isArray(preset.fontSize) ? preset.fontSize[0] : preset.fontSize,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing,
    fontFamily: preset.fontFamily,
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (!user) { return null } // AuthWrapper handles redirection

  return (
    <Layout>
      <div style={{
        paddingBottom: '6rem', // Space for bottom nav
        backgroundColor: brandColors.neutral[50],
        minHeight: '100vh'
      }}>
        {/* Green gradient section - covers header + stats upwards, full width */}
        <div style={{
          background: `linear-gradient(135deg, ${brandColors.primary[100]} 0%, ${brandColors.primary[50]} 100%)`,
          padding: '1rem',
          paddingBottom: '2rem'
        }}>
        {/* Header with User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          padding: '0.5rem 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: brandColors.primary[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: brandColors.primary[700]
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p style={{
                ...getTypographyStyle(typographyPresets.bodyLarge),
                color: brandColors.neutral[900],
                margin: 0,
                fontWeight: '600'
              }}>
                Rahat Nur
              </p>
            </div>
          </div>
          <button style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            🔔
          </button>
        </div>

          {/* Stats Overview - Inside the green gradient */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            padding: '1rem'
          }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: brandColors.neutral[900],
              margin: '0 0 0.25rem 0'
            }}>
              35
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: brandColors.neutral[500],
              margin: 0
            }}>
              Total Invoices
            </p>
            <p style={{
              fontSize: '0.625rem',
              color: brandColors.neutral[400],
              margin: 0
            }}>
              Last 24 hours
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: brandColors.neutral[900],
              margin: '0 0 0.25rem 0'
            }}>
              50
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: brandColors.neutral[500],
              margin: 0
            }}>
              Paid Invoice
            </p>
            <p style={{
              fontSize: '0.625rem',
              color: brandColors.neutral[400],
              margin: 0
            }}>
              Last 30 days
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: brandColors.neutral[900],
              margin: '0 0 0.25rem 0'
            }}>
              05
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: brandColors.neutral[500],
              margin: 0
            }}>
              Pending Invoice
            </p>
            <p style={{
              fontSize: '0.625rem',
              color: brandColors.neutral[400],
              margin: 0
            }}>
              Last 30 days
            </p>
          </div>
        </div>
        {/* End of green gradient section */}

        {/* Quick Actions - No card backgrounds */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          padding: '0 1rem'
        }}>
          <button
            onClick={() => navigate('/invoice/new')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: brandColors.primary[100],
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} color={brandColors.primary[600]} />
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              Create Invoice
            </span>
          </button>

          <button style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: brandColors.warning[100],
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} color={brandColors.warning[600]} />
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              Advance Invoice
            </span>
          </button>

          <button style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: brandColors.primary[100],
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} color={brandColors.primary[600]} />
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              Customers
            </span>
          </button>
        </div>

        {/* Secondary Actions - No card backgrounds */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          padding: '0 1rem'
        }}>
          <button style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: brandColors.warning[100],
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              📦
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              Items / Services
            </span>
          </button>

          <button style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: brandColors.error[100],
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              📊
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              Expenses
            </span>
          </button>

          <button style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: brandColors.success[100],
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              💰
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              Income
            </span>
          </button>
        </div>

        {/* Recent Transactions - No card background */}
        <div style={{
          padding: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: 0
            }}>
              Recent transactions
            </h3>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              All Invoices
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.neutral[100],
              color: brandColors.neutral[600],
              border: 'none',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Expenses
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.neutral[100],
              color: brandColors.neutral[600],
              border: 'none',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Income
            </button>
          </div>

          {/* Transaction List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { name: 'Karim Ahmed', type: 'Sales', invoice: '#INV0078', date: '25 Jun 2024', amount: '$5,000', status: 'success' },
              { name: 'Nasir Hussain', type: 'Purchase', invoice: '#INV0078', date: '26 Jun 2024', amount: '$5,000', status: 'warning' },
              { name: 'Kabir Ahmed', type: 'Sales', invoice: '#INV0078', date: '27 Jun 2024', amount: '$5,000', status: 'error' }
            ].map((transaction, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: transaction.status === 'success' ? brandColors.success[100] : 
                                   transaction.status === 'warning' ? brandColors.warning[100] : brandColors.error[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem'
                  }}>
                    {transaction.status === 'success' ? '✓' : transaction.status === 'warning' ? '⚠' : '✗'}
                  </div>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: brandColors.neutral[900],
                      margin: '0 0 0.125rem 0'
                    }}>
                      {transaction.name}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: brandColors.neutral[500],
                      margin: 0
                    }}>
                      {transaction.type} • {transaction.invoice} • {transaction.date}
                    </p>
                  </div>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  {transaction.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </Layout>
  )
}