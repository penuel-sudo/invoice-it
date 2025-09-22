import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { getUserDisplayName, getUserProfilePictureUrl, getUserInitial } from '../lib/profilePicture'
import NotificationDropdown from '../components/NotificationDropdown'
import DesktopSettingsPanel from '../components/DesktopSettingsPanel'
import Topbar from '../components/layout/Topbar'
import StatusButton from '../components/StatusButton'
import { supabase } from '../lib/supabaseClient'
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
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  // Load real transaction data
  const loadTransactions = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Check if there's any data in invoices or expenses tables
      const [invoicesResult, expensesResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, created_at')
          .eq('user_id', user.id)
          .limit(1),
        supabase
          .from('expenses')
          .select('id, created_at')
          .eq('user_id', user.id)
          .limit(1)
      ])

      // If no data exists in either table, don't show the transaction section
      if ((!invoicesResult.data || invoicesResult.data.length === 0) && 
          (!expensesResult.data || expensesResult.data.length === 0)) {
        console.log('No data found in invoices or expenses tables')
        setTransactions([])
        return
      }

      console.log('Data found in tables, loading transactions...')
      console.log('Invoices result:', invoicesResult.data?.length || 0, 'items')
      console.log('Expenses result:', expensesResult.data?.length || 0, 'items')
      const { data, error } = await supabase.rpc('get_user_transactions', {
        user_id: user.id
      })

      if (error) {
        console.error('Error loading transactions:', error)
        // Don't return here, try to load data directly from tables
        console.log('RPC failed, trying direct table queries...')
        
        // Fallback: Load data directly from tables
        const [invoicesData, expensesData] = await Promise.all([
          supabase
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2),
          supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2)
        ])

        const allData = [
          ...(invoicesData.data || []).map(item => ({ ...item, type: 'invoice' })),
          ...(expensesData.data || []).map(item => ({ ...item, type: 'expense' }))
        ]

        if (allData.length > 0) {
          const transformedTransactions = allData.map((item: any) => ({
            id: item.id,
            name: item.client_name || item.description || 'Unknown',
            type: item.type === 'invoice' ? 'income' : 'expense',
            invoice: item.invoice_number || `#EXP${item.id.slice(-4)}`,
            date: new Date(item.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            amount: `$${parseFloat(item.total_amount || item.amount || 0).toLocaleString()}`,
            status: item.status
          }))

          const sortedTransactions = transformedTransactions
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 4)

          setTransactions(sortedTransactions)
        }
        return
      }

      if (data) {
        // Transform the data to match the expected format
        const transformedTransactions = data.map((item: any) => ({
          id: item.id,
          name: item.client_name || item.description || 'Unknown',
          type: item.type === 'invoice' ? 'income' : 'expense',
          invoice: item.invoice_number || item.expense_number || `#${item.type.toUpperCase()}${item.id.slice(-4)}`,
          date: new Date(item.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          amount: `$${parseFloat(item.total_amount || item.amount || 0).toLocaleString()}`,
          status: item.status
        }))

        // Sort by created_at DESC and take only the latest 4
        const sortedTransactions = transformedTransactions
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4)

        setTransactions(sortedTransactions)
      }
    } catch (error) {
      console.error('Error in loadTransactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user])

  if (!user) { return null } // AuthWrapper handles redirection

  const filteredTransactions = activeTab === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === activeTab)

  return (
    <Layout 
      isNotificationVisible={isNotificationVisible}
      onNotificationToggle={() => setIsNotificationVisible(!isNotificationVisible)}
      onSettingsOpen={() => setIsSettingsVisible(true)}
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
        paddingTop: window.innerWidth < 768 ? '60px' : '0', // Space for fixed topbar on mobile only
        paddingBottom: '4rem', // Space for bottom nav
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        
        {/* Topbar - Above display panel */}
        <Topbar 
          onNotificationClick={() => setIsNotificationVisible(!isNotificationVisible)}
          onSettingsOpen={() => setIsSettingsVisible(true)}
          unreadCount={3}
        />
        
        {/* 📊 INVOICE STATS SECTION - Subtle brand color background with green border */}
        <div style={{
          height: '20vh',
          minHeight: '160px',
          backgroundColor: brandColors.primary[50],
          borderRadius: '15px',
          border: `2px solid ${brandColors.primary[500]}`,
          padding: '1rem 1rem 0.5rem 1rem',
          margin: '0.5rem 5rem 0rem 0rem',
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>

          {/* Stats Container - 3 columns */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem 0.5rem',
            backgroundColor: 'transparent',
            gap: '0.5rem',
            width: '100%',
            flexShrink: 1,
            minWidth: 0
          }}>
            <div style={{ 
              textAlign: 'center', 
              flex: 1,
              flexShrink: 1,
              backgroundColor: 'transparent',
              padding: '1.5rem 0.25rem'
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
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}>
                Total Invoices
              </p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              flex: 1,
              flexShrink: 1,
              backgroundColor: 'transparent',
              padding: '1.5rem 0.25rem'
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
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}>
                Paid Invoices
              </p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              flex: 1,
              flexShrink: 1,
              backgroundColor: 'transparent',
              padding: '1.5rem 0.25rem'
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
                fontWeight: '500',
                whiteSpace: 'nowrap'
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

            <button 
              onClick={() => navigate('/expense/new')}
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
                Create Expense
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
        {/* Hide this section for new users with no transaction data */}
        {!loading && transactions.length > 0 && (
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
              <div 
                key={transaction.id} 
                onClick={() => navigate(`/transactions?tab=${transaction.type === 'income' ? 'invoice' : 'expense'}`)}
                style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: brandColors.white,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: `1px solid ${brandColors.neutral[100]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
              >
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
                      status={transaction.status as 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense'} 
                      size="sm" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </Layout>
  )
}