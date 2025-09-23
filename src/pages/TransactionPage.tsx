import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { supabase } from '../lib/supabaseClient'
import StatusButton from '../components/StatusButton'
import { 
  ArrowLeft, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Check,
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
  created_at: string
  updated_at?: string
}

export default function TransactionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showTopbarDropdown, setShowTopbarDropdown] = useState(false)
  const [showTransactionDropdown, setShowTransactionDropdown] = useState<string | null>(null)
  const topbarDropdownRef = useRef<HTMLDivElement>(null)
  const transactionDropdownRef = useRef<HTMLDivElement>(null)


  // Load transactions from database
  useEffect(() => {
    if (user) {
      loadTransactions()
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
    if (!user) return

    try {
      setLoading(true)
      console.log('Loading transactions for user:', user.id)
      
      // Overdue detection is now handled by OverdueDetector component
      
      const { data, error } = await supabase.rpc('get_user_transactions', {
        user_id: user.id
      })

      if (error) {
        console.error('Error loading transactions:', error)
        toast.error('Failed to load transactions: ' + error.message)
        return
      }

      console.log('Raw database response:', data)

      // Transform database response to match Transaction interface
      const transformedTransactions: Transaction[] = (data || []).map((dbTransaction: any) => {
        console.log('Processing transaction:', dbTransaction.transaction_type, 'status:', dbTransaction.status)
        const isInvoice = dbTransaction.transaction_type === 'invoice'
        const isExpense = dbTransaction.transaction_type === 'expense'

        return {
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
          receipt_url: isExpense ? dbTransaction.receipt_url : undefined,
          receipt_filename: isExpense ? dbTransaction.receipt_filename : undefined,
          created_at: dbTransaction.created_at,
          updated_at: dbTransaction.created_at // Using created_at as updated_at since DB function doesn't return updated_at
        }
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
    if (!amount || isNaN(amount)) return type === 'invoice' ? '+$0.00' : '-$0.00'
    const formatted = `$${amount.toFixed(2)}`
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
    <Layout hideBottomNav={true}>
      <div style={{
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={20} color={brandColors.neutral[600]} />
          </button>
          
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0
          }}>
            {bulkMode ? `${selectedItems.size} selected` : 'Transaction'}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            {bulkMode ? (
              <button
                onClick={exitBulkMode}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} color={brandColors.neutral[600]} />
              </button>
            ) : (
              <div ref={topbarDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowTopbarDropdown(!showTopbarDropdown)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MoreVertical size={20} color={brandColors.neutral[600]} />
                </button>
                
                {/* Topbar Dropdown - WhatsApp Style */}
                {showTopbarDropdown && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    backgroundColor: brandColors.white,
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 90,
                    width: '160px',
                    padding: '0.5rem 0',
                    overflow: 'hidden'
                  }}>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        enterBulkMode()
                        setShowTopbarDropdown(false)
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
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: `2px solid ${brandColors.primary[600]}`,
                        borderRadius: '3px',
                        backgroundColor: brandColors.primary[600],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={10} color={brandColors.white} />
                      </div>
                      Select Multiple
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions - Replace Tab Navigation */}
        {bulkMode && (
          <div style={{
            padding: '1.5rem 1rem 0.5rem 1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <button
                onClick={() => handleBulkAction('mark_paid')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: brandColors.primary[600],
                  border: `1px solid ${brandColors.primary[600]}`,
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
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
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: brandColors.primary[600],
                  border: `1px solid ${brandColors.primary[600]}`,
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
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
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: brandColors.primary[600],
                  border: `1px solid ${brandColors.primary[600]}`,
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
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
            padding: '1.5rem 1rem 0.5rem 1rem'
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
              gap: '0.75rem',
              marginBottom: '1rem'
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
          </div>
        )}

        {/* Transaction List */}
        <div style={{
          padding: bulkMode ? '0 1rem 0.5rem 1rem' : '0 1rem 0.5rem 1rem'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem',
              color: brandColors.neutral[500]
            }}>
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 1rem',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '1rem',
                color: brandColors.neutral[600],
                margin: '0 0 1rem 0'
              }}>
                No transactions found
              </p>
              <button
                onClick={() => navigate('/invoice/new')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: brandColors.primary[600],
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Create Your First Invoice
              </button>
            </div>
          ) : (
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
                  border: `1px solid ${brandColors.neutral[100]}`,
                  cursor: bulkMode ? 'pointer' : 'pointer',
                  transition: 'all 0.2s ease'
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
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!bulkMode) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {bulkMode && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: `2px solid ${selectedItems.has(transaction.id) ? brandColors.primary[600] : brandColors.neutral[300]}`,
                        borderRadius: '4px',
                        backgroundColor: selectedItems.has(transaction.id) ? brandColors.primary[600] : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedItems.has(transaction.id) && (
                          <Check size={12} color={brandColors.white} />
                        )}
                      </div>
                    )}
                    
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
                      {/* DEBUG: Validate and force styling for problematic statuses */}
                      {(() => {
                        const status = transaction.status
                        console.log('DEBUG - Checking status:', status)
                        
                        // Check if the displayed text contains any of the three problematic statuses
                        if (status && (
                          status.toLowerCase().includes('overdue') || 
                          status.toLowerCase().includes('spent') || 
                          status.toLowerCase().includes('expense')
                        )) {
                          console.log('DEBUG - Found problematic status, forcing correct styling for:', status)
                          
                          // Force the correct status to get proper styling
                          let forcedStatus = status
                          if (status.toLowerCase().includes('overdue')) forcedStatus = 'overdue'
                          if (status.toLowerCase().includes('spent')) forcedStatus = 'spent'
                          if (status.toLowerCase().includes('expense')) forcedStatus = 'expense'
                          
                          return (
                            <StatusButton 
                              status={forcedStatus} 
                              size="sm" 
                            />
                          )
                        }
                        
                        // For other statuses, use normal StatusButton
                        return (
                          <StatusButton 
                            status={status} 
                            size="sm" 
                          />
                        )
                      })()}
                    </div>
                    
                    {!bulkMode && (
                      <div ref={transactionDropdownRef} style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setShowTransactionDropdown(showTransactionDropdown === transaction.id ? null : transaction.id)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s ease'
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
                        
                        {/* WhatsApp-style Dropdown Menu - Positioned to the left */}
                        {showTransactionDropdown === transaction.id && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '100%',
                            transform: 'translateY(-50%)',
                            marginRight: '0.5rem',
                            backgroundColor: brandColors.white,
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            zIndex: 100,
                            width: '160px',
                            padding: '0.5rem 0',
                            overflow: 'hidden'
                          }}>
                            {/* View */}
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault()
                                if (transaction.type === 'invoice') {
                                  navigate(`/invoice/preview`, { state: { transactionId: transaction.id } })
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
                                    <Check size={16} color={brandColors.success[600]} />
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
                                    <Check size={16} color={brandColors.warning[600]} />
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
