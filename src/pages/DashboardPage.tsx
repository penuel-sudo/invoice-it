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
// StatusLogic removed - StatusButton handles validation internally
import { supabase } from '../lib/supabaseClient'
import { format } from 'date-fns'
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

  // Helper functions from TransactionPage
  const formatAmount = (amount: number, type: string) => {
    if (amount === null || amount === undefined) return '$0.00'
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
    return type === 'invoice' ? `+${formatted}` : `-${formatted}`
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'No Date'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return format(date, 'MMM dd, yyyy')
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString)
      return 'Invalid Date'
    }
  }

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

  // Load transactions from database
  const loadTransactions = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Loading transactions for user:', user.id)
      
      const { data, error } = await supabase.rpc('get_user_transactions', {
        user_id: user.id
      })

      if (error) {
        console.error('Error loading transactions:', error)
        console.log('RPC failed, trying direct table queries...')
        
        // Fallback: Query tables directly
        const [invoicesData, expensesData] = await Promise.all([
          supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ])
        
        if (invoicesData.error || expensesData.error) {
          console.error('Error in fallback queries:', invoicesData.error || expensesData.error)
          setTransactions([])
          return
        }
        
        // Transform and combine data - EXACT COPY from TransactionPage
        const transformedInvoices = (invoicesData.data || []).map(invoice => ({
          id: invoice.id,
          type: 'invoice' as const,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          issue_date: invoice.issue_date,
          total_amount: invoice.total_amount,
          client_name: 'Client', // You might want to join with clients table
          created_at: invoice.created_at
        }))
        
        const transformedExpenses = (expensesData.data || []).map(expense => ({
          id: expense.id,
          type: 'expense' as const,
          status: expense.status,
          issue_date: expense.expense_date,
          total_amount: expense.total_amount,
          description: expense.description || 'Expense',
          category: expense.category || 'Expense',
          created_at: expense.created_at
        }))
        
        const allTransactions = [...transformedInvoices, ...transformedExpenses]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4) // Limit to 4 items for dashboard
        
        setTransactions(allTransactions)
        return
      }

      console.log('Raw database response:', data)

      // Transform database response to match Transaction interface - EXACT COPY from TransactionPage
      const transformedTransactions: any[] = (data || []).map((dbTransaction: any) => {
        console.log('Processing transaction:', dbTransaction.transaction_type, 'status:', dbTransaction.status)
        const isInvoice = dbTransaction.transaction_type === 'invoice'
        const isExpense = dbTransaction.transaction_type === 'expense'

        return {
          id: dbTransaction.id,
          type: dbTransaction.transaction_type as 'invoice' | 'expense',
          invoice_number: isInvoice ? dbTransaction.reference_number : undefined,
          category: isExpense ? dbTransaction.reference_number : undefined,
          status: dbTransaction.status,
          issue_date: dbTransaction.transaction_date,
          total_amount: dbTransaction.amount,
          client_name: isInvoice ? dbTransaction.client_name : undefined,
          description: isExpense ? dbTransaction.client_name : undefined,
          created_at: dbTransaction.created_at
        }
      })

      console.log('Transformed transactions:', transformedTransactions)
      
      // Sort by created_at DESC (latest first) and limit to 4 items
      const sortedTransactions = transformedTransactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
      
      setTransactions(sortedTransactions)
    } catch (error) {
      console.error('Error loading transactions:', error)
      setTransactions([])
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

  const filteredTransactions = transactions.filter(transaction => {
    console.log('Filtering transaction:', transaction.type, 'for activeTab:', activeTab)
    if (activeTab === 'all') return true
    if (activeTab === 'income') return transaction.type === 'invoice'
    if (activeTab === 'expense') return transaction.type === 'expense'
    return true
  })
  
  console.log('Active tab:', activeTab)
  console.log('Total transactions:', transactions.length)
  console.log('Filtered transactions:', filteredTransactions.length)

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
                onClick={() => {
                  console.log('Tab clicked:', tab.id)
                  setActiveTab(tab.id)
                }}
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

          {/* Transaction List - EXACT COPY from TransactionPage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
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
                onClick={() => navigate(`/invoices?tab=${transaction.type === 'invoice' ? 'invoice' : 'expenses'}`)}
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
                    backgroundColor: transaction.type === 'invoice' ? brandColors.success[100] : brandColors.error[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {transaction.type === 'invoice' ? (
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
                      {transaction.type === 'invoice' 
                        ? (transaction.client_name || 'Client')
                        : (transaction.description || 'Expense')
                      }
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: brandColors.neutral[500],
                      margin: 0
                    }}>
                      {transaction.type === 'invoice' 
                        ? (transaction.invoice_number ? `#${transaction.invoice_number}` : 'Invoice')
                        : (transaction.category || 'Expense')
                      } • {transaction.issue_date ? formatDate(transaction.issue_date) : 'No Date'}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: transaction.type === 'invoice' ? brandColors.success[600] : brandColors.error[600],
                      margin: 0
                    }}>
                      {formatAmount(transaction.total_amount, transaction.type)}
                    </p>
                    <StatusButton 
                      status={transaction.status} 
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