import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors, typographyPresets } from '../stylings'
import { Layout } from '../components/layout'
import { getUserDisplayName, getUserInitial } from '../lib/profilePicture'
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Plus, 
  Bell, 
  Package, 
  DollarSign, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (!user) { return null } // AuthWrapper handles redirection

  // Sample data for transactions
  const allTransactions = [
    { id: 1, name: 'Karim Ahmed', type: 'income', invoice: '#INV0078', date: '25 Jun 2024', amount: '$5,000', status: 'paid' },
    { id: 2, name: 'Office Supplies', type: 'expense', invoice: '#EXP001', date: '26 Jun 2024', amount: '$200', status: 'pending' },
    { id: 3, name: 'Nasir Hussain', type: 'income', invoice: '#INV0079', date: '27 Jun 2024', amount: '$3,500', status: 'paid' },
    { id: 4, name: 'Internet Bill', type: 'expense', invoice: '#EXP002', date: '28 Jun 2024', amount: '$80', status: 'paid' },
    { id: 5, name: 'Kabir Ahmed', type: 'income', invoice: '#INV0080', date: '29 Jun 2024', amount: '$2,800', status: 'pending' }
  ]

  const filteredTransactions = activeTab === 'all' 
    ? allTransactions 
    : allTransactions.filter(t => t.type === activeTab)

  return (
    <Layout>
      <div style={{
        paddingBottom: '6rem', // Space for bottom nav
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* 🎨 GRADIENT SECTION (20% height) - Green gradient with orange/blue touches */}
        <div style={{
          height: '20vh',
          minHeight: '160px',
          background: `linear-gradient(135deg, ${brandColors.primary[200]} 0%, ${brandColors.primary[100]} 50%, ${brandColors.warning[100]} 100%)`,
          padding: '1rem',
          paddingTop: '0',
          width: '100%',
          position: 'relative'
        }}>
          {/* User Header - Transparent div */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0 0.5rem 0',
            backgroundColor: 'transparent'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: brandColors.primary[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.primary[800],
                border: `2px solid ${brandColors.white}`
              }}>
                {getUserInitial(user)}
              </div>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  {getUserDisplayName(user)}
                </p>
              </div>
            </div>
            <button style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={20} color={brandColors.neutral[700]} />
            </button>
          </div>

          {/* Stats Summary - Transparent div */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            backgroundColor: 'transparent'
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: brandColors.neutral[900],
                margin: '0 0 0.125rem 0'
              }}>
                35
              </p>
              <p style={{
                fontSize: '0.625rem',
                color: brandColors.neutral[600],
                margin: 0
              }}>
                Total
              </p>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: brandColors.neutral[900],
                margin: '0 0 0.125rem 0'
              }}>
                28
              </p>
              <p style={{
                fontSize: '0.625rem',
                color: brandColors.neutral[600],
                margin: 0
              }}>
                Paid
              </p>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: brandColors.neutral[900],
                margin: '0 0 0.125rem 0'
              }}>
                7
              </p>
              <p style={{
                fontSize: '0.625rem',
                color: brandColors.neutral[600],
                margin: 0
              }}>
                Pending
              </p>
            </div>
          </div>
        </div>

        {/* 🔘 QUICK ACTIONS SECTION (Transparent) - 6 buttons in 3 rows */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'transparent'
        }}>
          {/* Row 1 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem'
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
                textAlign: 'center',
                flex: 1,
                margin: '0 0.25rem',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[50]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: brandColors.primary[100],
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={22} color={brandColors.primary[600]} />
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
              textAlign: 'center',
              flex: 1,
              margin: '0 0.25rem',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.warning[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: brandColors.warning[100],
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={22} color={brandColors.warning[600]} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Advanced
              </span>
            </button>
          </div>

          {/* Row 2 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem'
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
              textAlign: 'center',
              flex: 1,
              margin: '0 0.25rem',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: brandColors.primary[100],
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={22} color={brandColors.primary[600]} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Customers
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
              textAlign: 'center',
              flex: 1,
              margin: '0 0.25rem',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.warning[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: brandColors.warning[100],
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package size={22} color={brandColors.warning[600]} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Items
              </span>
            </button>
          </div>

          {/* Row 3 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between'
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
              textAlign: 'center',
              flex: 1,
              margin: '0 0.25rem',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.error[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: brandColors.error[100],
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowDownRight size={22} color={brandColors.error[600]} />
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
              textAlign: 'center',
              flex: 1,
              margin: '0 0.25rem',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.success[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: brandColors.success[100],
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowUpRight size={22} color={brandColors.success[600]} />
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
        </div>

        {/* 📑 TABS SECTION */}
        <div style={{
          padding: '0 1rem 1rem 1rem'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {[
              { id: 'all', label: 'All Invoices' },
              { id: 'income', label: 'Income' },
              { id: 'expense', label: 'Expenses' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: activeTab === tab.id ? brandColors.primary[600] : brandColors.neutral[100],
                  color: activeTab === tab.id ? brandColors.white : brandColors.neutral[600],
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transaction List with Shadows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: brandColors.white,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${brandColors.neutral[100]}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: transaction.type === 'income' ? brandColors.success[100] : brandColors.error[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {transaction.type === 'income' ? (
                      <ArrowUpRight size={18} color={brandColors.success[600]} />
                    ) : (
                      <ArrowDownRight size={18} color={brandColors.error[600]} />
                    )}
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
                      {transaction.invoice} • {transaction.date}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: transaction.type === 'income' ? brandColors.success[600] : brandColors.error[600],
                    margin: 0
                  }}>
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
                  </p>
                  <button style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}>
                    <MoreVertical size={16} color={brandColors.neutral[400]} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}