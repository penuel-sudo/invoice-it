import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { useGlobalCurrency } from '../hooks/useGlobalCurrency'
import NotificationDropdown from '../components/NotificationDropdown'
import Topbar from '../components/layout/Topbar'
import StatusButton from '../components/StatusButton'
// StatusLogic removed - StatusButton handles validation internally
import { supabase } from '../lib/supabaseClient'
import { format } from 'date-fns'
import { getCurrencySymbol } from '../lib/currencyUtils'
import { batchConvert } from '../lib/currencyConversion'
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
  Receipt,
  BarChart3,
  PieChart,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText as FileTextIcon,
  Repeat
} from 'lucide-react'
import { useLoading } from '../contexts/LoadingContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { loading, setLoading: setGlobalLoading } = useLoading()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all')
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)
  const { currency, currencySymbol } = useGlobalCurrency()
  const [transactions, setTransactions] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0,
    thisMonthCount: 0,
    thisMonthRevenue: 0,
    thisMonthExpenses: 0,
    thisMonthProfit: 0
  })

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  // Auto-slide functionality
  const startAutoSlide = () => {
    // Clear any existing interval first
    stopAutoSlide()
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3)
    }, 5000) // 5 seconds between slides
    
    autoSlideIntervalRef.current = interval
  }

  const stopAutoSlide = () => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current)
      autoSlideIntervalRef.current = null
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    // Stop auto-slide on any interaction
    stopAutoSlide()
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentSlide < 2) {
      setCurrentSlide(prev => prev + 1)
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }

    setTouchStart(0)
    setTouchEnd(0)
    
    // Don't restart automatically - let user control it
  }

  // Helper functions from TransactionPage
  const formatAmount = (amount: number, type: string, currencyCode?: string) => {
    if (amount === null || amount === undefined) {
      const symbol = currencyCode ? getCurrencySymbol(currencyCode) : currencySymbol
      return `${symbol}0.00`
    }
    const symbol = currencyCode ? getCurrencySymbol(currencyCode) : currencySymbol
    const formatted = `${symbol}${amount.toFixed(2)}`
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


  // Calculate real stats from invoices and expenses
  const calculateStats = async () => {
    if (!user) return

    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfMonthISO = startOfMonth.toISOString()

      // Load invoices with currency
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('status, total_amount, created_at, currency_code')
        .eq('user_id', user.id)

      if (invoicesError) {
        console.error('Error loading invoices:', invoicesError)
        return
      }

      // Load expenses for current month with currency
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date, currency_code')
        .eq('user_id', user.id)
        .gte('expense_date', startOfMonthISO.split('T')[0])

      if (expensesError) {
        console.error('Error loading expenses:', expensesError)
      }

      // Calculate invoice stats
      const thisMonthInvoices = invoices?.filter(inv => new Date(inv.created_at) >= startOfMonth) || []
      const thisMonthPaidInvoices = thisMonthInvoices.filter(inv => inv.status === 'paid')
      
      // Convert income amounts to user's default currency
      const incomeAmounts = thisMonthPaidInvoices.map(inv => {
        const invCurrency = (inv as any).currency_code || (inv as any).currency || currency || 'USD'
        return {
          amount: inv.total_amount || 0,
          currency: invCurrency
        }
      })
      
      console.log('📊 Dashboard: Converting income amounts:', incomeAmounts, 'to', currency || 'USD')
      let thisMonthIncome = 0
      try {
        if (incomeAmounts.length > 0) {
          thisMonthIncome = await batchConvert(incomeAmounts, currency || 'USD')
        }
      } catch (error) {
        console.error('Error converting income amounts:', error)
        // Fallback: sum without conversion
        thisMonthIncome = thisMonthPaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      }
      
      // Convert expense amounts to user's default currency
      const expenseAmounts = (expenses || []).map(exp => {
        const expCurrency = (exp as any).currency_code || currency || 'USD'
        return {
          amount: exp.amount || 0,
          currency: expCurrency
        }
      })
      
      console.log('📊 Dashboard: Converting expense amounts:', expenseAmounts, 'to', currency || 'USD')
      let thisMonthExpenses = 0
      try {
        if (expenseAmounts.length > 0) {
          thisMonthExpenses = await batchConvert(expenseAmounts, currency || 'USD')
        }
      } catch (error) {
        console.error('Error converting expense amounts:', error)
        // Fallback: sum without conversion
        thisMonthExpenses = (expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)
      }
      
      // Calculate profit
      const thisMonthProfit = thisMonthIncome - thisMonthExpenses

      const calculated = {
        total: invoices?.length || 0,
        paid: invoices?.filter(inv => inv.status === 'paid').length || 0,
        pending: invoices?.filter(inv => inv.status === 'pending').length || 0,
        overdue: invoices?.filter(inv => inv.status === 'overdue').length || 0,
        draft: invoices?.filter(inv => inv.status === 'draft').length || 0,
        thisMonthCount: thisMonthInvoices.length,
        thisMonthRevenue: thisMonthIncome,
        thisMonthExpenses: thisMonthExpenses,
        thisMonthProfit: thisMonthProfit
      }

      setStats(calculated)
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  // Load transactions from database
  const loadTransactions = async () => {
    if (!user) return

    try {
      setGlobalLoading(true)
      
      const { data, error } = await supabase.rpc('get_user_transactions', {
        user_id: user.id
      })

      if (error) {
        console.error('Error loading transactions:', error)
        
        // Fallback: Query tables directly
        const [invoicesData, expensesData] = await Promise.all([
          supabase.from('invoices').select('*, clients!invoices_client_id_fkey(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
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
          currency_code: invoice.currency_code,
          client_name: invoice.clients?.name || 'Client',
          created_at: invoice.created_at
        }))
        
         const transformedExpenses = (expensesData.data || []).map(expense => ({
          id: expense.id,
          type: 'expense' as const,
          status: expense.status,
          issue_date: expense.expense_date,
          expense_date: expense.expense_date,
          total_amount: expense.amount,
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


      // Transform database response to match Transaction interface - EXACT COPY from TransactionPage
      const transformedTransactions: any[] = (data || []).map((dbTransaction: any) => {
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
          currency_code: isInvoice ? dbTransaction.currency_code : undefined,
          client_name: isInvoice ? dbTransaction.client_name : undefined,
          description: isExpense ? dbTransaction.client_name : undefined,
          expense_date: isExpense ? dbTransaction.expense_date : undefined,
          created_at: dbTransaction.created_at
        }
      })

      
      // Sort by created_at DESC (latest first) and limit to 4 items
      const sortedTransactions = transformedTransactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
      
      setTransactions(sortedTransactions)
    } catch (error) {
      console.error('Error loading transactions:', error)
      setTransactions([])
    } finally {
      setGlobalLoading(false)
    }
  }

  // Update URL when tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams)
    if (activeTab === 'all') {
      newSearchParams.delete('tab')
    } else {
      newSearchParams.set('tab', activeTab)
    }
    setSearchParams(newSearchParams)
  }, [activeTab, searchParams, setSearchParams])

  useEffect(() => {
    if (user) {
      calculateStats()
      loadTransactions()
    }
  }, [user])

  // Start auto-slide only once on mount
  useEffect(() => {
    startAutoSlide()
    
    // Cleanup auto-slide on unmount
    return () => {
      stopAutoSlide()
    }
  }, []) // Empty dependency array - only run once

  if (!user) { return null } // AuthWrapper handles redirection

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true
    if (activeTab === 'income') return transaction.type === 'invoice'
    if (activeTab === 'expense') return transaction.type === 'expense'
    return true
  })

  return (
    <Layout 
      isNotificationVisible={isNotificationVisible}
      onNotificationToggle={() => setIsNotificationVisible(!isNotificationVisible)}
      onSettingsOpen={() => navigate('/settings')}
    >
      
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
          onSettingsOpen={() => navigate('/settings')}
        />
        
        {/* 📊 STATS CAROUSEL */}
        <div style={{
          margin: '0.5rem 1rem 0rem 1rem',
          position: 'relative'
        }}>
          {/* Carousel Container */}
          <div
            onMouseEnter={() => stopAutoSlide()} // Stop on hover
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              backgroundColor: brandColors.white,
              borderRadius: '16px',
              padding: '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              minHeight: '180px',
          position: 'relative',
              overflow: 'hidden',
              touchAction: 'pan-y'
            }}
          >
            {/* Slide 1: Overview */}
            {currentSlide === 0 && (
              <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[600],
                  margin: '0 0 1.5rem 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: 'left'
                }}>
                  Invoice Overview
                </h3>
          <div style={{
            display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
          }}>
                  <div style={{ textAlign: 'center' }}>
              <p style={{
                      fontSize: '3rem',
                fontWeight: '700',
                      color: brandColors.primary[600],
                      margin: '0 0 0.25rem 0',
                      lineHeight: 1
              }}>
                      {stats.total}
              </p>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: brandColors.neutral[600],
                margin: 0
              }}>
                      Total Invoices
              </p>
            </div>

            <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
            }}>
                    <div style={{ textAlign: 'center' }}>
              <p style={{
                        fontSize: '1.75rem',
                        fontWeight: '600',
                        color: brandColors.success[600],
                margin: '0 0 0.25rem 0'
              }}>
                        {stats.paid}
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[500],
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}>
                        <CheckCircle size={12} color={brandColors.success[600]} />
                        Paid
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '1.75rem',
                        fontWeight: '600',
                        color: brandColors.warning[600],
                        margin: '0 0 0.25rem 0'
                      }}>
                        {stats.pending}
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[500],
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}>
                        <Clock size={12} color={brandColors.warning[600]} />
                        Pending
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: Status Breakdown */}
            {currentSlide === 1 && (
              <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[600],
                  margin: '0 0 1.5rem 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <BarChart3 size={16} color={brandColors.primary[600]} />
                  Status Breakdown
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: brandColors.success[50],
                    borderRadius: '10px'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: brandColors.neutral[700], display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={14} color={brandColors.success[600]} />
                      Paid
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: brandColors.success[600] }}>
                      {stats.paid}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: brandColors.warning[50],
                    borderRadius: '10px'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: brandColors.neutral[700], display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} color={brandColors.warning[600]} />
                      Pending
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: brandColors.warning[600] }}>
                      {stats.pending}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: brandColors.error[50],
                    borderRadius: '10px'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: brandColors.neutral[700], display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={14} color={brandColors.error[600]} />
                      Overdue
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: brandColors.error[600] }}>
                      {stats.overdue}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '10px'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: brandColors.neutral[700], display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileTextIcon size={14} color={brandColors.neutral[600]} />
                      Draft
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: brandColors.neutral[600] }}>
                      {stats.draft}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: This Month */}
            {currentSlide === 2 && (
              <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                <h3 style={{
                  fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[600],
                  margin: '0 0 1.5rem 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <Calendar size={window.innerWidth < 768 ? 14 : 16} color={brandColors.primary[600]} />
                  This Month
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  {/* Income and Expenses Row */}
                  <div style={{
                    width: '100%',
                    padding: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}>
                    {/* Income */}
                    <div style={{
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
                        fontWeight: '700',
                        color: brandColors.success[600],
                        margin: '0 0 0.25rem 0'
                      }}>
                        {currencySymbol}{(stats.thisMonthRevenue || 0).toLocaleString()}
                      </p>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '0.65rem' : '0.75rem',
                        color: brandColors.neutral[600],
                        margin: 0
                      }}>
                        Income
                      </p>
                    </div>

                    {/* Minus Sign */}
                    <div style={{
                      fontSize: window.innerWidth < 768 ? '1.25rem' : '1.5rem',
                      fontWeight: '700',
                      color: brandColors.neutral[400],
                      lineHeight: 1
                    }}>
                      −
                    </div>

                    {/* Expenses */}
                    <div style={{
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
                        fontWeight: '700',
                        color: brandColors.error[600],
                        margin: '0 0 0.25rem 0'
                      }}>
                        {currencySymbol}{(stats.thisMonthExpenses || 0).toLocaleString()}
                      </p>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '0.65rem' : '0.75rem',
                        color: brandColors.neutral[600],
                        margin: 0
                      }}>
                        Expenses
                      </p>
                    </div>
                  </div>

                  {/* Profit - Prominent */}
                  <div style={{
                    width: '100%',
                    padding: window.innerWidth < 768 ? '1rem' : '1.25rem',
                    backgroundColor: stats.thisMonthProfit >= 0 ? brandColors.primary[50] : brandColors.warning[50],
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: `2px solid ${stats.thisMonthProfit >= 0 ? brandColors.primary[200] : brandColors.warning[200]}`
                  }}>
                    <p style={{
                      fontSize: window.innerWidth < 768 ? '1.75rem' : '2rem',
                      fontWeight: '700',
                      color: stats.thisMonthProfit >= 0 ? brandColors.primary[600] : brandColors.warning[600],
                      margin: '0 0 0.25rem 0',
                      lineHeight: 1
                    }}>
                      {currencySymbol}{(stats.thisMonthProfit || 0).toLocaleString()}
                    </p>
                    <p style={{
                      fontSize: window.innerWidth < 768 ? '0.7rem' : '0.875rem',
                      fontWeight: '600',
                      color: brandColors.neutral[600],
                      margin: 0
                    }}>
                      Profit
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

          {/* Dot Indicators */}
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => {
                  stopAutoSlide() // Stop on click
                  setCurrentSlide(index)
                }}
                onMouseEnter={() => stopAutoSlide()} // Stop on hover
                style={{
                  width: currentSlide === index ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: currentSlide === index ? brandColors.primary[600] : brandColors.neutral[300],
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* 🔘 QUICK ACTIONS */}
        <div style={{
          padding: '2rem 1rem',
          backgroundColor: 'transparent'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            {/* Create Invoice */}
            <button
              onClick={() => navigate('/invoice/create/default')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '1.125rem 0.75rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[200]}`,
                cursor: 'pointer',
                borderRadius: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColors.primary[300]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brandColors.neutral[200]
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
                fontSize: '0.7rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Invoice
              </span>
            </button>

            {/* Recurring Invoices (Mobile only - replaces Invoices) */}
            {window.innerWidth < 768 ? (
              <button
                onClick={() => navigate('/recurring')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '1.125rem 0.75rem',
                  backgroundColor: brandColors.white,
                  border: `1px solid ${brandColors.neutral[200]}`,
                  cursor: 'pointer',
                  borderRadius: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = brandColors.success[300]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = brandColors.neutral[200]
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: brandColors.success[100],
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Repeat size={22} color={brandColors.success[600]} />
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700]
                }}>
                  Recurring
                </span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/invoices?tab=invoice')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '1.125rem 0.75rem',
                  backgroundColor: brandColors.white,
                  border: `1px solid ${brandColors.neutral[200]}`,
                  cursor: 'pointer',
                  borderRadius: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = brandColors.success[300]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = brandColors.neutral[200]
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: brandColors.success[100],
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={22} color={brandColors.success[600]} />
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700]
                }}>
                  Invoices
                </span>
              </button>
            )}

            {/* Clients */}
            <button
              onClick={() => navigate('/clients')}
              style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
                gap: '0.625rem',
                padding: '1.125rem 0.75rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[200]}`,
                cursor: 'pointer',
                borderRadius: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColors.primary[300]
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brandColors.neutral[200]
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
                <Users size={22} color={brandColors.primary[600]} />
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Clients
              </span>
            </button>

            {/* View Expenses */}
            <button 
              onClick={() => navigate('/invoices?tab=expenses')}
              style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
                gap: '0.625rem',
                padding: '1.125rem 0.75rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[200]}`,
                cursor: 'pointer',
                borderRadius: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColors.error[300]
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brandColors.neutral[200]
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: brandColors.error[100],
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Receipt size={22} color={brandColors.error[600]} />
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Expense
              </span>
            </button>

            {/* Templates */}
            <button 
              onClick={() => navigate('/templates')}
              style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
                gap: '0.625rem',
                padding: '1.125rem 0.75rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[200]}`,
                cursor: 'pointer',
                borderRadius: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColors.primary[300]
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brandColors.neutral[200]
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
                <Package size={22} color={brandColors.primary[600]} />
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Templates
              </span>
            </button>

            {/* Reports */}
            <button
              onClick={() => navigate('/reports')}
              style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
                gap: '0.625rem',
                padding: '1.125rem 0.75rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[200]}`,
                cursor: 'pointer',
                borderRadius: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColors.warning[300]
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brandColors.neutral[200]
              }}
            >
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
                fontSize: '0.7rem',
                fontWeight: '500',
                color: brandColors.neutral[700]
              }}>
                Reports
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

          {/* Transaction List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {filteredTransactions.slice(0, 4).map((transaction) => (
              <div 
                key={transaction.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  backgroundColor: brandColors.white,
                  borderRadius: '12px',
                  border: `1px solid ${brandColors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => navigate(`/invoices?tab=${transaction.type === 'invoice' ? 'invoices' : 'expenses'}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = brandColors.primary[300]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = brandColors.neutral[200]
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
                      } • {(transaction.type === 'invoice' ? transaction.issue_date : transaction.expense_date) ? formatDate(transaction.type === 'invoice' ? transaction.issue_date! : transaction.expense_date!) : 'No Date'}
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
                      {formatAmount(transaction.total_amount, transaction.type, transaction.currency_code)}
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

          {/* View All Button */}
          <button
            onClick={() => navigate('/invoices')}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.875rem',
              backgroundColor: 'transparent',
              border: `1px solid ${brandColors.neutral[200]}`,
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.primary[600],
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[50]
              e.currentTarget.style.borderColor = brandColors.primary[600]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = brandColors.neutral[200]
            }}
          >
            View All Transactions →
          </button>
        </div>
        )}
      </div>
    </Layout>
  )
}