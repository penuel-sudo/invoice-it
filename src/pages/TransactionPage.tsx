import { useState, useEffect } from 'react'
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
  ArrowDownRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Transaction {
  id: string
  type: 'invoice' | 'expense'
  description: string
  amount: number
  status: string
  date: string
  created_at: string
  client_name?: string
  category?: string
  invoice_number?: string
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

  // Load transactions from database
  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user])

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
      
      const { data, error } = await supabase.rpc('get_user_transactions', {
        user_id: user.id
      })

      if (error) {
        console.error('Error loading transactions:', error)
        toast.error('Failed to load transactions: ' + error.message)
        return
      }

      console.log('Transactions loaded:', data)
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
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

    try {
      const transaction = transactions.find(t => t.id === transactionId)
      if (!transaction) return

      if (action === 'delete') {
        if (transaction.type === 'invoice') {
          const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', user.id)
          
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', user.id)
          
          if (error) throw error
        }
        toast.success('Transaction deleted successfully')
      } else if (action === 'mark_paid' && transaction.type === 'invoice') {
        const { error } = await supabase.rpc('update_invoice_status', {
          invoice_id: transactionId,
          new_status: 'paid'
        })
        
        if (error) throw error
        toast.success('Invoice marked as paid')
      } else if (action === 'mark_pending' && transaction.type === 'invoice') {
        const { error } = await supabase.rpc('update_invoice_status', {
          invoice_id: transactionId,
          new_status: 'pending'
        })
        
        if (error) throw error
        toast.success('Invoice marked as pending')
      }

      // Reload transactions
      loadTransactions()
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (!user || selectedItems.size === 0) return

    try {
      const selectedTransactions = transactions.filter(t => selectedItems.has(t.id))
      
      if (action === 'delete') {
        for (const transaction of selectedTransactions) {
          if (transaction.type === 'invoice') {
            await supabase
              .from('invoices')
              .delete()
              .eq('id', transaction.id)
              .eq('user_id', user.id)
          } else {
            await supabase
              .from('expenses')
              .delete()
              .eq('id', transaction.id)
              .eq('user_id', user.id)
          }
        }
        toast.success(`${selectedItems.size} transactions deleted successfully`)
      } else if (action === 'mark_paid') {
        const invoices = selectedTransactions.filter(t => t.type === 'invoice')
        for (const invoice of invoices) {
          await supabase.rpc('update_invoice_status', {
            invoice_id: invoice.id,
            new_status: 'paid'
          })
        }
        toast.success(`${invoices.length} invoices marked as paid`)
      } else if (action === 'mark_pending') {
        const invoices = selectedTransactions.filter(t => t.type === 'invoice')
        for (const invoice of invoices) {
          await supabase.rpc('update_invoice_status', {
            invoice_id: invoice.id,
            new_status: 'pending'
          })
        }
        toast.success(`${invoices.length} invoices marked as pending`)
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

  const enterBulkMode = () => {
    setBulkMode(true)
    setSelectedItems(new Set())
    setShowBulkActions(false)
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setSelectedItems(new Set())
    setShowBulkActions(false)
  }

  const formatAmount = (amount: number, type: string) => {
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

  const getValidStatus = (status: string): 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense' => {
    const validStatuses = ['draft', 'pending', 'paid', 'overdue', 'spent', 'expense']
    return validStatuses.includes(status) ? status as 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense' : 'draft'
  }

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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {bulkMode ? (
              <>
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
              </>
            ) : (
              <button
                onClick={enterBulkMode}
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
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: brandColors.primary[50],
            borderBottom: `1px solid ${brandColors.primary[200]}`
          }}>
            <button
              onClick={() => handleBulkAction('mark_paid')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.success[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Mark Paid
            </button>
            <button
              onClick={() => handleBulkAction('mark_pending')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.warning[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Mark Pending
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.error[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          padding: '1.5rem 1rem 0.5rem 1rem'
        }}>
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

          {/* Transaction List */}
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
                  cursor: bulkMode ? 'pointer' : 'default'
                }}
                onClick={() => bulkMode && toggleSelection(transaction.id)}
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
                          ? (transaction.invoice_number ? `Invoice #${transaction.invoice_number}` : transaction.description)
                          : transaction.description
                        }
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[500],
                        margin: 0
                      }}>
                        {transaction.type === 'invoice' 
                          ? (transaction.client_name || 'Client')
                          : (transaction.category || 'Expense')
                        } • {transaction.date ? formatDate(transaction.date) : 'No Date'}
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
                        {formatAmount(transaction.amount, transaction.type)}
                      </p>
                      <StatusButton 
                        status={getValidStatus(transaction.status)} 
                        size="sm" 
                      />
                    </div>
                    
                    {!bulkMode && (
                      <div style={{ position: 'relative' }}>
                        <button style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px'
                        }}>
                          <MoreVertical size={16} color={brandColors.neutral[400]} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          backgroundColor: brandColors.white,
                          border: `1px solid ${brandColors.neutral[200]}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          zIndex: 20,
                          minWidth: '150px',
                          padding: '0.5rem 0'
                        }}>
                          <button
                            onClick={() => navigate(`/invoice/preview`, { state: { transactionId: transaction.id } })}
                            style={{
                              width: '100%',
                              padding: '0.5rem 1rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.875rem',
                              color: brandColors.neutral[700]
                            }}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          
                          <button
                            onClick={() => navigate(`/invoice/edit`, { state: { transactionId: transaction.id } })}
                            style={{
                              width: '100%',
                              padding: '0.5rem 1rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.875rem',
                              color: brandColors.neutral[700]
                            }}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          
                          {transaction.type === 'invoice' && transaction.status !== 'paid' && (
                            <button
                              onClick={() => handleTransactionAction(transaction.id, 'mark_paid')}
                              style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: brandColors.success[600]
                              }}
                            >
                              <Check size={16} />
                              Mark Paid
                            </button>
                          )}
                          
                          {transaction.type === 'invoice' && transaction.status !== 'pending' && (
                            <button
                              onClick={() => handleTransactionAction(transaction.id, 'mark_pending')}
                              style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: brandColors.warning[600]
                              }}
                            >
                              <Check size={16} />
                              Mark Pending
                            </button>
                          )}
                          
                          <div style={{
                            height: '1px',
                            backgroundColor: brandColors.neutral[200],
                            margin: '0.5rem 0'
                          }} />
                          
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this transaction?')) {
                                handleTransactionAction(transaction.id, 'delete')
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem 1rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.875rem',
                              color: brandColors.error[600]
                            }}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
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
