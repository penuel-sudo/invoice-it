import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { getUserDisplayName, getUserProfilePictureUrl, getUserInitial } from '../lib/profilePicture'
import NotificationDropdown from '../components/NotificationDropdown'
import DesktopSettingsPanel from '../components/DesktopSettingsPanel'
import StatusButton from '../components/StatusButton'
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

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Load profile picture when component mounts or user changes
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (user) {
        try {
          const url = await getUserProfilePictureUrl(user)
          setProfilePictureUrl(url)
        } catch (error) {
          console.error('Error loading profile picture:', error)
          setProfilePictureUrl(null)
        }
      }
    }

    loadProfilePicture()
  }, [user])

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
    <Layout 
      isNotificationVisible={isNotificationVisible}
      onNotificationToggle={() => setIsNotificationVisible(!isNotificationVisible)}
      onSettingsOpen={() => setIsSettingsVisible(true)}
      showTopbar={true}
    >
      {/* Desktop Settings Panel */}
      <DesktopSettingsPanel
        isVisible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onNotificationClick={() => setIsNotificationVisible(true)}
      />
      
      {/* Notification Dropdown */}
      <NotificationDropdown
        isVisible={isNotificationVisible}
        onClose={() => setIsNotificationVisible(false)}
      />
      
      <div style={{
        paddingBottom: '4rem', // Space for bottom nav
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* 📊 INVOICE STATS SECTION - Light green background with rounded corners */}
        <div style={{
          height: '20vh',
          minHeight: '160px',
          backgroundColor: brandColors.primary[100],
          borderRadius: '40px',
          border: `2px solid ${brandColors.white}`,
          padding: '2rem 1.5rem 2rem 2rem',
          paddingRight: '3rem',
          width: '100%',
          position: 'relative',
          margin: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>

          {/* Stats Container - 3 columns without borders */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem 0',
            backgroundColor: 'transparent',
            gap: '1rem'
          }}>
            <div style={{ 
              textAlign: 'center', 
              flex: 1,
              backgroundColor: 'transparent',
              padding: '1.5rem 0.5rem'
            }}>
              <p style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: brandColors.primary[800],
                margin: '0 0 0.5rem 0'
              }}>
                35
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.primary[600],
                margin: 0,
                fontWeight: '500'
              }}>
                Total Invoices
              </p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              flex: 1,
              backgroundColor: 'transparent',
              padding: '1.5rem 0.5rem'
            }}>
              <p style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: brandColors.primary[800],
                margin: '0 0 0.5rem 0'
              }}>
                28
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.primary[600],
                margin: 0,
                fontWeight: '500'
              }}>
                Paid Invoices
              </p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              flex: 1,
              backgroundColor: 'transparent',
              padding: '1.5rem 0.5rem'
            }}>
              <p style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: brandColors.primary[800],
                margin: '0 0 0.5rem 0'
              }}>
                7
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.primary[600],
                margin: 0,
                fontWeight: '500'
              }}>
                Pending Invoices
              </p>
            </div>
          </div>
        </div>

        {/* 🔘 QUICK ACTIONS SECTION (2 rows with shadows) - 6 buttons in 2 rows */}
        <div style={{
          padding: '3rem 1rem 2rem 1rem',
          backgroundColor: 'transparent'
        }}>
          {/* Row 1 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            gap: '0.75rem'
          }}>
            <button
              onClick={() => navigate('/invoice/new')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1.25rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[100]}`,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: brandColors.primary[100],
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={24} color={brandColors.primary[600]} />
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
              padding: '1.25rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[100]}`,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: brandColors.warning[100],
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={24} color={brandColors.warning[600]} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Advanced
              </span>
            </button>

            <button style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1.25rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[100]}`,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: brandColors.primary[100],
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} color={brandColors.primary[600]} />
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

          {/* Row 2 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <button style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1.25rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[100]}`,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: brandColors.warning[100],
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package size={24} color={brandColors.warning[600]} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Items
              </span>
            </button>

            <button style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1.25rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[100]}`,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: brandColors.error[100],
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowDownRight size={24} color={brandColors.error[600]} />
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
              padding: '1.25rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[100]}`,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: brandColors.success[100],
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowUpRight size={24} color={brandColors.success[600]} />
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
        {/* TODO: Hide this section for new users with no transaction data
        const hasTransactions = allTransactions.length > 0
        if (!hasTransactions) {
          return (
            <Layout>
              <div>Welcome! Create your first invoice to see transactions here.</div>
            </Layout>
          )
        }
        */}
        <div style={{
          padding: '1.5rem 1rem 0.5rem 1rem'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
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
                  padding: '0.75rem 1.5rem',
                  backgroundColor: activeTab === tab.id ? brandColors.primary[600] : brandColors.neutral[100],
                  color: activeTab === tab.id ? brandColors.white : brandColors.neutral[600],
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: transaction.type === 'income' ? brandColors.success[600] : brandColors.error[600],
                      margin: 0
                    }}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
                    </p>
                    <StatusButton 
                      status={transaction.status === 'paid' ? 'paid' : 'pending'} 
                      size="sm" 
                    />
                  </div>
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