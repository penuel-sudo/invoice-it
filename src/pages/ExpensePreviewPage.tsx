import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import StatusButton from '../components/StatusButton'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  FileText,
  Tag,
  StickyNote,
  ArrowDownRight,
  CreditCard,
  User,
  Receipt,
  CheckCircle,
  Download,
  Share2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { StatusLogic } from '../lib/statusLogic'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
]

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  status: 'spent' | 'expense'
  expense_date: string
  notes?: string
  client_id?: string
  client_name?: string
  payment_method: string
  is_tax_deductible: boolean
  tax_rate: number
  tax_amount: number
  receipt_url?: string
  receipt_filename?: string
  receipt_size?: number
  created_at: string
  updated_at?: string
}

export default function ExpensePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      setAuthLoading(false)
      if (!user) {
        navigate('/auth')
        return
      }

      // Check if we have form data from create page
      const expenseData = location.state?.expenseData
      if (expenseData) {
        // Transform form data to match Expense interface
        const transformedExpense: Expense = {
          id: 'preview',
          description: expenseData.description,
          category: expenseData.category,
          amount: parseFloat(expenseData.amount),
          status: 'spent',
          expense_date: expenseData.expense_date,
          notes: expenseData.notes,
          client_id: expenseData.client_id,
          client_name: undefined, // Will be loaded from clients
          payment_method: expenseData.payment_method,
          is_tax_deductible: expenseData.is_tax_deductible,
          tax_rate: parseFloat(expenseData.tax_rate),
          tax_amount: expenseData.is_tax_deductible ? (parseFloat(expenseData.amount) * parseFloat(expenseData.tax_rate) / 100) : 0,
          receipt_url: expenseData.receipt_url,
          receipt_filename: expenseData.receipt_filename,
          receipt_size: expenseData.receipt_file?.size,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setExpense(transformedExpense)
        setLoading(false)
        return
      }

      // Get expense ID from location state or URL params
      const expenseId = location.state?.expenseId || new URLSearchParams(location.search).get('id')
      
      if (expenseId) {
        loadExpense(expenseId)
      } else {
        navigate('/invoices')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [user, navigate, location])

  const loadExpense = async (expenseId: string) => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading expense:', error)
        toast.error('Failed to load expense: ' + error.message)
        navigate('/invoices')
        return
      }

      setExpense(data)
    } catch (error) {
      console.error('Error loading expense:', error)
      toast.error('Failed to load expense')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!expense || !user) return

    const confirmed = window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeleting(true)

      const result = await StatusLogic.deleteTransaction(
        expense.id,
        'expense',
        user.id
      )

      if (result.success) {
        toast.success('Expense deleted successfully')
        navigate('/invoices')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    } finally {
      setDeleting(false)
    }
  }

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  if (authLoading) {
    return (
      <Layout>
        <div style={{
          padding: '2rem',
          backgroundColor: brandColors.white,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '1rem',
            color: brandColors.neutral[600]
          }}>
            Loading...
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) return null

  if (loading) {
    return (
      <Layout>
        <div style={{
          padding: '2rem',
          backgroundColor: brandColors.white,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '1rem',
            color: brandColors.neutral[600]
          }}>
            Loading expense...
          </div>
        </div>
      </Layout>
    )
  }

  if (!expense) {
    return (
      <Layout>
        <div style={{
          padding: '2rem',
          backgroundColor: brandColors.white,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              marginBottom: '0.5rem'
            }}>
              Expense Not Found
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: brandColors.neutral[600],
              marginBottom: '1rem'
            }}>
              The expense you're looking for doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => navigate('/invoices')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Back to Transactions
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{
        padding: '1rem',
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Header - Clean Design */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${brandColors.neutral[200]}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => navigate('/invoices')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                e.currentTarget.style.borderColor = brandColors.neutral[400]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = brandColors.neutral[300]
              }}
            >
              <ArrowLeft size={20} color={brandColors.neutral[600]} />
            </button>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 0.25rem 0'
              }}>
                Expense Receipt
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[500],
                margin: 0
              }}>
                {formatDate(expense.expense_date)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => navigate('/expense/new', { state: { expenseData: expense } })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                color: brandColors.primary[600],
                border: `1px solid ${brandColors.primary[300]}`,
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[50]
                e.currentTarget.style.borderColor = brandColors.primary[400]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = brandColors.primary[300]
              }}
            >
              <Edit size={16} />
              Edit
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                color: brandColors.error[600],
                border: `1px solid ${brandColors.error[300]}`,
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: deleting ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = brandColors.error[50]
                  e.currentTarget.style.borderColor = brandColors.error[400]
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = brandColors.error[300]
                }
              }}
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Main Content - Clean Card Layout */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Expense Summary Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            border: `1px solid ${brandColors.neutral[200]}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            {/* Expense Icon & Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: brandColors.error[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowDownRight size={28} color={brandColors.error[600]} />
              </div>
              <StatusButton status={expense.status} size="lg" />
            </div>

            {/* Description */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem 0'
            }}>
              {expense.description}
            </h2>

            {/* Amount */}
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: brandColors.error[600],
              margin: '0 0 0.5rem 0'
            }}>
              {formatAmount(expense.amount)}
            </div>

            {/* Category */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.neutral[100],
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              <Tag size={16} />
              {expense.category}
            </div>
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Payment Information */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CreditCard size={20} />
                Payment Details
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    margin: '0 0 0.25rem 0'
                  }}>
                    Payment Method
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: brandColors.neutral[900],
                    margin: 0
                  }}>
                    {PAYMENT_METHODS.find(m => m.value === expense.payment_method)?.label || expense.payment_method}
                  </p>
                </div>
                
                {expense.client_name && (
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[700],
                      margin: '0 0 0.25rem 0'
                    }}>
                      Client
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      color: brandColors.neutral[900],
                      margin: 0
                    }}>
                      {expense.client_name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tax Information */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Receipt size={20} />
                Tax Information
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle 
                    size={16} 
                    color={expense.is_tax_deductible ? brandColors.success[600] : brandColors.neutral[400]} 
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    color: expense.is_tax_deductible ? brandColors.success[700] : brandColors.neutral[600]
                  }}>
                    {expense.is_tax_deductible ? 'Tax Deductible' : 'Not Tax Deductible'}
                  </span>
                </div>
                
                {expense.is_tax_deductible && expense.tax_rate && expense.tax_rate > 0 && (
                  <>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        margin: '0 0 0.25rem 0'
                      }}>
                        Tax Rate
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        color: brandColors.neutral[900],
                        margin: 0
                      }}>
                        {expense.tax_rate}%
                      </p>
                    </div>
                    
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        margin: '0 0 0.25rem 0'
                      }}>
                        Tax Amount
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        color: brandColors.neutral[900],
                        margin: 0
                      }}>
                        {formatAmount(expense.tax_amount || 0)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {expense.notes && (
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <StickyNote size={20} />
                Notes
              </h3>
              
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[700],
                margin: 0,
                lineHeight: '1.6'
              }}>
                {expense.notes}
              </p>
            </div>
          )}

          {/* Receipt Section - Only show if receipt exists */}
          {expense.receipt_url && (
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Receipt size={20} />
                Receipt
              </h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: '12px',
                border: `1px solid ${brandColors.neutral[200]}`
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: brandColors.primary[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Receipt size={24} color={brandColors.primary[600]} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[900],
                    margin: '0 0 0.25rem 0'
                  }}>
                    {expense.receipt_filename || 'Receipt'}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.neutral[500],
                    margin: 0
                  }}>
                    {expense.receipt_size ? `${(expense.receipt_size / 1024 / 1024).toFixed(2)} MB` : 'Receipt file'}
                  </p>
                </div>
                <button
                  onClick={() => window.open(expense.receipt_url, '_blank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: brandColors.primary[600],
                    color: brandColors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.primary[700]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.primary[600]
                  }}
                >
                  <Download size={16} />
                  View
                </button>
              </div>
            </div>
          )}

          {/* Footer Information */}
          <div style={{
            backgroundColor: brandColors.neutral[50],
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: brandColors.neutral[500],
              margin: 0
            }}>
              Created on {formatDate(expense.created_at)} • Expense ID: {expense.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
