import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { supabase } from '../lib/supabaseClient'
import StatusButton from '../components/StatusButton'
import { useGlobalCurrency } from '../hooks/useGlobalCurrency'
import { 
  ArrowLeft, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Check,
  CheckSquare,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
// StatusLogic removed - StatusButton handles validation internally
import OverdueDetector from '../components/OverdueDetector'

interface Transaction {
  id: string
  type: 'invoice' | 'expense'
  invoice_number?: string
  status: string // Accept any status from database
  issue_date?: string
  due_date?: string
  subtotal?: number
  tax_amount?: number
  total_amount: number
  notes?: string
  client_name?: string
  category?: string
  description?: string
  payment_method?: string
  is_tax_deductible?: boolean
  receipt_url?: string
  receipt_filename?: string
  template?: string // Template used for the invoice
  created_at: string
  updated_at?: string
}

console.log('🔍 DEBUGGING: TransactionPage.tsx file loaded')

export default function TransactionPage() {
  console.log('🔍 DEBUGGING: TransactionPage component rendered')
  
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currencySymbol } = useGlobalCurrency()
  
  console.log('🔍 DEBUGGING: User from auth:', user?.id)
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showTopbarDropdown, setShowTopbarDropdown] = useState(false)
  const [showTransactionDropdown, setShowTransactionDropdown] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const topbarDropdownRef = useRef<HTMLDivElement>(null)
  const transactionDropdownRef = useRef<HTMLDivElement>(null)


  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  // Load transactions from database
  useEffect(() => {
    console.log('🔍 DEBUGGING: useEffect triggered with user:', user?.id)
    if (user) {
      console.log('🔍 DEBUGGING: User exists, calling loadTransactions()')
      loadTransactions()
    } else {
      console.log('🔍 DEBUGGING: No user, skipping loadTransactions()')
    }
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topbarDropdownRef.current && !topbarDropdownRef.current.contains(event.target as Node)) {
        setShowTopbarDropdown(false)
      }
      if (transactionDropdownRef.current && !transactionDropdownRef.current.contains(event.target as Node)) {
        setShowTransactionDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const loadTransactions = async () => {
    console.log('🔍 DEBUGGING: loadTransactions() called')
    if (!user) {
      console.log('🔍 DEBUGGING: No user in loadTransactions, returning early')
      return
    }

    try {
      console.log('🔍 DEBUGGING: Starting transaction load process')
      setLoading(true)
      console.log('Loading transactions for user:', user.id)
      
      // Overdue detection is now handled by OverdueDetector component
      
      console.log('🔍 DEBUGGING: About to call get_user_transactions with user_id:', user.id)
      
      const { data, error } = await supabase.rpc('get_user_transactions', {
        user_id: user.id
      })

      console.log('🔍 DEBUGGING: Raw Supabase response:', { data, error })
      console.log('🔍 DEBUGGING: Data type:', typeof data)
      console.log('🔍 DEBUGGING: Data length:', data?.length)
      
      if (data && data.length > 0) {
        console.log('🔍 DEBUGGING: First transaction structure:', data[0])
        console.log('🔍 DEBUGGING: First transaction keys:', Object.keys(data[0]))
        console.log('🔍 DEBUGGING: Template field value:', data[0].template)
        console.log('🔍 DEBUGGING: Receipt URL field value:', data[0].receipt_url)
        console.log('🔍 DEBUGGING: Receipt filename field value:', data[0].receipt_filename)
      }

      if (error) {
        console.error('🚨 DEBUGGING: Error loading transactions:', error)
        console.error('🚨 DEBUGGING: Error details:', JSON.stringify(error, null, 2))
        toast.error('Failed to load transactions: ' + error.message)
        return
      }

      console.log('🔍 DEBUGGING: Raw database response:', data)

      // Transform database response to match Transaction interface
      const transformedTransactions: Transaction[] = (data || []).map((dbTransaction: any, index: number) => {
        console.log(`🔍 DEBUGGING: Processing transaction ${index + 1}:`, dbTransaction.transaction_type, 'status:', dbTransaction.status)
        console.log(`🔍 DEBUGGING: Transaction ${index + 1} available fields:`, Object.keys(dbTransaction))
        
        const isInvoice = dbTransaction.transaction_type === 'invoice'
        const isExpense = dbTransaction.transaction_type === 'expense'

        console.log(`🔍 DEBUGGING: Transaction ${index + 1} field access:`)
        console.log(`  - template: ${dbTransaction.template} (exists: ${dbTransaction.hasOwnProperty('template')})`)
        console.log(`  - receipt_url: ${dbTransaction.receipt_url} (exists: ${dbTransaction.hasOwnProperty('receipt_url')})`)
        console.log(`  - receipt_filename: ${dbTransaction.receipt_filename} (exists: ${dbTransaction.hasOwnProperty('receipt_filename')})`)

        const transformedTransaction = {
          id: dbTransaction.id,
          type: dbTransaction.transaction_type as 'invoice' | 'expense',
          // For invoices: reference_number = invoice_number, for expenses: reference_number = category
          invoice_number: isInvoice ? dbTransaction.reference_number : undefined,
          category: isExpense ? dbTransaction.reference_number : undefined,
          status: dbTransaction.status as 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense',
          issue_date: dbTransaction.transaction_date,
          total_amount: dbTransaction.amount,
          client_name: isInvoice ? dbTransaction.client_name : undefined,
          description: isExpense ? dbTransaction.client_name : undefined, // For expenses, client_name contains description
          payment_method: isExpense ? dbTransaction.payment_method : undefined,
          is_tax_deductible: isExpense ? dbTransaction.is_tax_deductible : undefined,
          receipt_url: isExpense ? (dbTransaction.receipt_url || undefined) : undefined,
          receipt_filename: isExpense ? (dbTransaction.receipt_filename || undefined) : undefined,
          template: isInvoice ? dbTransaction.template : undefined, // Template for invoices
          created_at: dbTransaction.created_at,
          updated_at: dbTransaction.created_at // Using created_at as updated_at since DB function doesn't return updated_at
        }
        
        console.log(`🔍 DEBUGGING: Transformed transaction ${index + 1}:`, transformedTransaction)
        return transformedTransaction
      })

      console.log('Transformed transactions:', transformedTransactions)
      
      // Sort by created_at DESC (latest first) as additional safety
      const sortedTransactions = transformedTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      setTransactions(sortedTransactions)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
      
      // Set empty array if database fails
      console.log('No transactions found or database error')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true
    if (activeTab === 'invoice') return transaction.type === 'invoice'
    if (activeTab === 'expenses') return transaction.type === 'expense'
    return true
  })

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleTransactionAction = async (transactionId: string, action: string) => {
    if (!user) return

    const transaction = transactions.find(t => t.id === transactionId)
    if (!transaction) return

    // Store original status for rollback
    const originalStatus = transaction.status

    // Optimistic update for status changes
    if (action === 'mark_paid' || action === 'mark_pending') {
      const newStatus = action === 'mark_paid' ? 'paid' : 'pending'
      
      // Immediate UI update (optimistic)
      setTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, status: newStatus } : t
      ))
    }

    // Handle transaction action directly
    let result
    if (action === 'delete') {
      if (transaction.type === 'invoice') {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', transactionId)
          .eq('user_id', user.id)
        result = {
          success: !error,
          message: error ? 'Failed to delete invoice' : 'Invoice deleted successfully'
        }
      } else {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', transactionId)
          .eq('user_id', user.id)
        result = {
          success: !error,
          message: error ? 'Failed to delete expense' : 'Expense deleted successfully'
        }
      }
    } else {
      // Handle status updates
      if (transaction.type === 'invoice') {
        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: action === 'mark_paid' ? 'paid' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)
          .eq('user_id', user.id)
        result = {
          success: !error,
          message: error ? 'Failed to update invoice status' : 'Invoice status updated successfully'
        }
      } else {
        const { error } = await supabase
          .from('expenses')
          .update({ 
            status: action === 'mark_paid' ? 'spent' : 'expense',
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)
          .eq('user_id', user.id)
        result = {
          success: !error,
          message: error ? 'Failed to update expense status' : 'Expense status updated successfully'
        }
      }
    }

    // Handle result
    if (result.success) {
      // Keep optimistic change, reload to get latest data
      loadTransactions()
    } else {
      // Revert optimistic change on error
      if (action === 'mark_paid' || action === 'mark_pending') {
        setTransactions(prev => prev.map(t => 
          t.id === transactionId ? { ...t, status: originalStatus } : t
        ))
      }
    }
  }

  const handleBulkAction = async (action: string) => {
    if (!user || selectedItems.size === 0) return

    const selectedTransactions = transactions.filter(t => selectedItems.has(t.id))
    let successCount = 0

    try {
      for (const transaction of selectedTransactions) {
        // Handle bulk action directly
        let result
        if (action === 'delete') {
          if (transaction.type === 'invoice') {
            const { error } = await supabase
              .from('invoices')
              .delete()
              .eq('id', transaction.id)
              .eq('user_id', user.id)
            result = {
              success: !error,
              message: error ? 'Failed to delete invoice' : 'Invoice deleted successfully'
            }
          } else {
            const { error } = await supabase
              .from('expenses')
              .delete()
              .eq('id', transaction.id)
              .eq('user_id', user.id)
            result = {
              success: !error,
              message: error ? 'Failed to delete expense' : 'Expense deleted successfully'
            }
          }
        } else {
          // Handle status updates
          if (transaction.type === 'invoice') {
            const { error } = await supabase
              .from('invoices')
              .update({ 
                status: action === 'mark_paid' ? 'paid' : 'pending',
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.id)
              .eq('user_id', user.id)
            result = {
              success: !error,
              message: error ? 'Failed to update invoice status' : 'Invoice status updated successfully'
            }
          } else {
            const { error } = await supabase
              .from('expenses')
              .update({ 
                status: action === 'mark_paid' ? 'spent' : 'expense',
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.id)
              .eq('user_id', user.id)
            result = {
              success: !error,
              message: error ? 'Failed to update expense status' : 'Expense status updated successfully'
            }
          }
        }
        
        if (result.success) {
          successCount++
        }
      }

      // Show summary toast
      if (action === 'delete') {
        toast.success(`${successCount} transactions deleted successfully`)
      } else if (action === 'mark_paid') {
        toast.success(`${successCount} invoices marked as paid`)
      } else if (action === 'mark_pending') {
        toast.success(`${successCount} invoices marked as pending`)
      }

      // Clear selection and reload
      setSelectedItems(new Set())
      setBulkMode(false)
      setShowBulkActions(false)
      loadTransactions()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Failed to perform bulk action')
    }
  }

  const toggleSelection = (transactionId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedItems(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleLongPress = (transactionId: string) => {
    if (!bulkMode) {
      setBulkMode(true)
    }
    toggleSelection(transactionId)
  }

  const enterBulkMode = () => {
    setBulkMode(true)
    setSelectedItems(new Set())
    setShowBulkActions(false)
    setShowTopbarDropdown(false)
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setSelectedItems(new Set())
    setShowBulkActions(false)
  }

  const formatAmount = (amount: number | undefined, type: string) => {
    if (!amount || isNaN(amount)) return type === 'invoice' ? `+${currencySymbol}0.00` : `-${currencySymbol}0.00`
    const formatted = `${currencySymbol}${amount.toFixed(2)}`
    return type === 'invoice' ? `+${formatted}` : `-${formatted}`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return format(date, 'MMM dd, yyyy')
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString)
      return 'Invalid Date'
    }
  }

  // Status validation now handled by StatusButton component

  if (!user) return null

  return (
    <Layout hideBottomNav={false}>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${brandColors.primary[50]} 0%, ${brandColors.neutral[50]} 100%)`,
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: window.innerWidth < 768 ? '1rem' : '1rem 2rem',
          backgroundColor: 'white',
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {!isMobile && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.5rem',
                backgroundColor: brandColors.neutral[100],
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: brandColors.neutral[600],
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0,
            textAlign: 'center',
            flex: 1
          }}>
            {bulkMode ? `${selectedItems.size} selected` : 'Transactions'}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {bulkMode ? (
              <button
                onClick={exitBulkMode}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: brandColors.neutral[100],
                  border: `1px solid ${brandColors.neutral[300]}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: brandColors.neutral[700],
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <X size={16} />
                Cancel
              </button>
            ) : (
              <div ref={topbarDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowTopbarDropdown(!showTopbarDropdown)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: brandColors.neutral[100],
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: brandColors.neutral[700],
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <MoreVertical size={16} />
                </button>
                
                {/* Topbar Dropdown - Normal Dropdown */}
                {showTopbarDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: 'white',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 50,
                    minWidth: '180px'
                  }}>
                    <div style={{ padding: '0.25rem' }}>
                    <button
                        onClick={() => {
                        enterBulkMode()
                        setShowTopbarDropdown(false)
                      }}
                      style={{
                        width: '100%',
                          padding: '0.5rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                          borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                          gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                          color: brandColors.neutral[700]
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                        <CheckSquare size={16} />
                      Select Multiple
                    </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions - Replace Tab Navigation */}
        {bulkMode && (
          <div style={{
            padding: window.innerWidth < 768 ? '1rem 0.5rem 0.5rem 0.5rem' : '1.5rem 1rem 0.5rem 1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
              marginBottom: '1rem',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row'
            }}>
              <button
                onClick={() => handleBulkAction('mark_paid')}
                style={{
                  padding: window.innerWidth < 768 ? '1rem 1.5rem' : '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: brandColors.primary[600],
                  border: `1px solid ${brandColors.primary[600]}`,
                  borderRadius: window.innerWidth < 768 ? '12px' : '20px',
                  fontSize: window.innerWidth < 768 ? '0.9rem' : '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  minHeight: window.innerWidth < 768 ? '48px' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[50]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Mark Paid
              </button>
              <button
                onClick={() => handleBulkAction('mark_pending')}
                style={{
                  padding: window.innerWidth < 768 ? '1rem 1.5rem' : '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: brandColors.primary[600],
                  border: `1px solid ${brandColors.primary[600]}`,
                  borderRadius: window.innerWidth < 768 ? '12px' : '20px',
                  fontSize: window.innerWidth < 768 ? '0.9rem' : '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  minHeight: window.innerWidth < 768 ? '48px' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[50]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Mark Pending
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                style={{
                  padding: window.innerWidth < 768 ? '1rem 1.5rem' : '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: brandColors.primary[600],
                  border: `1px solid ${brandColors.primary[600]}`,
                  borderRadius: window.innerWidth < 768 ? '12px' : '20px',
                  fontSize: window.innerWidth < 768 ? '0.9rem' : '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  minHeight: window.innerWidth < 768 ? '48px' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[50]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation - Only show when not in bulk mode */}
        {!bulkMode && (
          <div style={{
            padding: window.innerWidth < 768 ? '1rem' : '2rem 2rem 1rem 2rem'
          }}>
            {/* Overdue Detector */}
            {user && (
              <div style={{ marginBottom: '1rem' }}>
                <OverdueDetector 
                  userId={user.id}
                  showWarnings={true}
                />
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
              marginBottom: '1rem',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row'
            }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'invoice', label: 'Invoice' },
                { id: 'expenses', label: 'Expenses' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    padding: window.innerWidth < 768 ? '0.875rem 1rem' : '1rem 2rem',
                    backgroundColor: activeTab === tab.id ? brandColors.primary[600] : 'rgba(255, 255, 255, 0.8)',
                    color: activeTab === tab.id ? brandColors.white : brandColors.neutral[700],
                    border: 'none',
                    borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                    fontSize: window.innerWidth < 768 ? '0.8rem' : '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1,
                    boxShadow: activeTab === tab.id ? '0 4px 12px rgba(22, 163, 74, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)',
                    minHeight: window.innerWidth < 768 ? '44px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div style={{
          padding: window.innerWidth < 768 
            ? (bulkMode ? '0 1rem 1rem 1rem' : '0 1rem 1rem 1rem')
            : (bulkMode ? '0 2rem 2rem 2rem' : '0 2rem 2rem 2rem')
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4rem 2rem',
              color: brandColors.neutral[600],
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${brandColors.neutral[200]}`
            }}>
              <p style={{
                fontSize: '1.125rem',
                color: brandColors.neutral[700],
                margin: '0 0 1.5rem 0',
                fontWeight: '500'
              }}>
                No transactions found
              </p>
              <button
                onClick={() => navigate(activeTab === 'expenses' ? '/expense/new' : '/invoice/create/default')}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: brandColors.primary[600],
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(22, 163, 74, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                {activeTab === 'expenses' ? 'Create Your First Expense' : 'Create Your First Invoice'}
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: window.innerWidth < 768 ? '0.75rem' : '1rem' 
            }}>
              {filteredTransactions.map((transaction, index) => (
                <div key={transaction.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: window.innerWidth < 768 ? '0.875rem' : '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  border: `1px solid ${brandColors.neutral[200]}`,
                  cursor: bulkMode ? 'pointer' : 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  zIndex: showTransactionDropdown === transaction.id ? 1000 : index + 1,
                  minHeight: window.innerWidth < 768 ? '60px' : 'auto'
                }}
                onClick={() => bulkMode ? toggleSelection(transaction.id) : undefined}
                onMouseDown={(e) => {
                  e.preventDefault()
                  const startTime = Date.now()
                  const longPressTimer = setTimeout(() => {
                    handleLongPress(transaction.id)
                  }, 500) // 500ms for long press
                  
                  const handleMouseUp = () => {
                    clearTimeout(longPressTimer)
                    document.removeEventListener('mouseup', handleMouseUp)
                  }
                  
                  document.addEventListener('mouseup', handleMouseUp)
                }}
                onMouseEnter={(e) => {
                  if (!bulkMode) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!bulkMode) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }
                }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
                    flex: 1,
                    minWidth: 0
                  }}>
                    {bulkMode && (
                      <div style={{
                        width: window.innerWidth < 768 ? '24px' : '20px',
                        height: window.innerWidth < 768 ? '24px' : '20px',
                        border: `2px solid ${selectedItems.has(transaction.id) ? brandColors.primary[600] : brandColors.neutral[300]}`,
                        borderRadius: '4px',
                        backgroundColor: brandColors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {selectedItems.has(transaction.id) && (
                          <Check size={window.innerWidth < 768 ? 14 : 12} color={brandColors.primary[600]} />
                        )}
                      </div>
                    )}
                    
                    <div style={{
                      width: window.innerWidth < 768 ? '40px' : '36px',
                      height: window.innerWidth < 768 ? '40px' : '36px',
                      borderRadius: '50%',
                      backgroundColor: transaction.type === 'invoice' ? brandColors.success[100] : brandColors.error[100],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {transaction.type === 'invoice' ? (
                        <ArrowUpRight size={window.innerWidth < 768 ? 20 : 18} color={brandColors.success[600]} />
                      ) : (
                        <ArrowDownRight size={window.innerWidth < 768 ? 20 : 18} color={brandColors.error[600]} />
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '0.9rem' : '0.875rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900],
                        margin: '0 0 0.125rem 0',
                        wordBreak: 'break-word',
                        lineHeight: '1.3'
                      }}>
                        {transaction.type === 'invoice' 
                          ? (transaction.client_name || 'Client')
                          : (transaction.description || 'Expense')
                        }
                      </p>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '0.8rem' : '0.75rem',
                        color: brandColors.neutral[500],
                        margin: 0,
                        wordBreak: 'break-word',
                        lineHeight: '1.3'
                      }}>
                        {transaction.type === 'invoice' 
                          ? (transaction.invoice_number ? `#${transaction.invoice_number}` : 'Invoice')
                          : (transaction.category || 'Expense')
                        } • {transaction.issue_date ? formatDate(transaction.issue_date) : 'No Date'}
                        {/* Template Badge */}
                        {transaction.type === 'invoice' && transaction.template && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            backgroundColor: transaction.template === 'professional' ? brandColors.primary[100] : brandColors.neutral[100],
                            color: transaction.template === 'professional' ? brandColors.primary[700] : brandColors.neutral[700],
                            textTransform: 'capitalize',
                            marginLeft: '0.5rem'
                          }}>
                            {transaction.template}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end', 
                      gap: window.innerWidth < 768 ? '0.125rem' : '0.25rem' 
                    }}>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '0.9rem' : '0.875rem',
                        fontWeight: '600',
                        color: transaction.type === 'invoice' ? brandColors.success[600] : brandColors.error[600],
                        margin: 0,
                        whiteSpace: 'nowrap'
                      }}>
                        {formatAmount(transaction.total_amount, transaction.type)}
                      </p>
                      <StatusButton 
                        status={transaction.status} 
                        size="sm" 
                      />
                    </div>
                    
                    {!bulkMode && (
                      <div ref={transactionDropdownRef} style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setShowTransactionDropdown(showTransactionDropdown === transaction.id ? null : transaction.id)}
                          style={{
                            padding: window.innerWidth < 768 ? '0.75rem' : '0.5rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s ease',
                            minWidth: window.innerWidth < 768 ? '44px' : 'auto',
                            minHeight: window.innerWidth < 768 ? '44px' : 'auto'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = brandColors.neutral[100]
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <MoreVertical size={18} color={brandColors.neutral[600]} />
                        </button>
                        
                        {/* Dropdown Menu - Dynamic positioning */}
                        {showTransactionDropdown === transaction.id && (
                          <div 
                            ref={(el) => {
                              if (el) {
                                const rect = el.getBoundingClientRect()
                                const viewportHeight = window.innerHeight
                                const spaceBelow = viewportHeight - rect.bottom
                                const spaceAbove = rect.top
                                
                                // Only reposition upward if not enough space below AND enough space above
                                if (spaceBelow < 300 && spaceAbove > 300) {
                                  el.style.top = 'auto'
                                  el.style.bottom = '100%'
                                  el.style.marginTop = '0'
                                  el.style.marginBottom = '0.5rem'
                                } else {
                                  // Default downward positioning
                                  el.style.top = '100%'
                                  el.style.bottom = 'auto'
                                  el.style.marginTop = '0.5rem'
                                  el.style.marginBottom = '0'
                                }
                              }
                            }}
                            style={{
                            position: 'absolute',
                              top: '100%',
                              right: '0',
                              marginTop: '0.5rem',
                            backgroundColor: brandColors.white,
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              zIndex: 10000,
                            width: '160px',
                            padding: '0.5rem 0',
                            overflow: 'hidden'
                          }}>
                            {/* View */}
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault()
                                if (transaction.type === 'invoice') {
                                  console.log('🔍 DEBUGGING: View Details clicked for invoice:')
                                  console.log('  - Transaction ID:', transaction.id)
                                  console.log('  - Invoice Number:', transaction.invoice_number)
                                  console.log('  - Template from transaction:', transaction.template)
                                  console.log('  - Template type:', typeof transaction.template)
                                  console.log('  - Template is null/undefined:', transaction.template == null)
                                  
                                  const template = transaction.template || 'default'
                                  console.log('  - Final template used:', template)
                                  console.log('  - Navigation URL:', `/invoice/preview/${template}?invoice=${transaction.invoice_number}`)
                                  
                                  navigate(`/invoice/preview/${template}?invoice=${transaction.invoice_number}`)
                                } else {
                                  navigate(`/expense/preview`, { state: { expenseId: transaction.id } })
                                }
                                setShowTransactionDropdown(null)
                              }}
                              style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: brandColors.neutral[800],
                                transition: 'background-color 0.2s ease',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Eye size={16} color={brandColors.neutral[600]} />
                              View Details
                            </button>
                            
                            {/* Status Actions for Invoices */}
                            {transaction.type === 'invoice' && (
                              <>
                                {transaction.status !== 'paid' && (
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      handleTransactionAction(transaction.id, 'mark_paid')
                                      setShowTransactionDropdown(null)
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.875rem 1rem',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.75rem',
                                      fontSize: '0.875rem',
                                      fontWeight: '500',
                                      color: brandColors.neutral[800],
                                      transition: 'background-color 0.2s ease',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <CheckSquare size={16} color={brandColors.success[600]} />
                                    Mark as Paid
                                  </button>
                                )}
                                
                                {transaction.status !== 'pending' && (
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      handleTransactionAction(transaction.id, 'mark_pending')
                                      setShowTransactionDropdown(null)
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.875rem 1rem',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.75rem',
                                      fontSize: '0.875rem',
                                      fontWeight: '500',
                                      color: brandColors.neutral[800],
                                      transition: 'background-color 0.2s ease',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <CheckSquare size={16} color={brandColors.warning[600]} />
                                    Mark as Pending
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* Separator */}
                            <div style={{
                              height: '1px',
                              backgroundColor: brandColors.neutral[200],
                              margin: '0.5rem 0'
                            }} />
                            
                            {/* Delete */}
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault()
                                if (window.confirm('Are you sure you want to delete this transaction?')) {
                                  handleTransactionAction(transaction.id, 'delete')
                                  setShowTransactionDropdown(null)
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: brandColors.error[600],
                                transition: 'background-color 0.2s ease',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = brandColors.error[50]
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Trash2 size={16} color={brandColors.error[600]} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
