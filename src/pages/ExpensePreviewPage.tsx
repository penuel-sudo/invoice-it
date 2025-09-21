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
  ArrowDownRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { StatusLogic } from '../lib/statusLogic'

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  status: 'spent' | 'expense'
  expense_date: string
  notes?: string
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
        {/* Header */}
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
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: 0
            }}>
              Expense Details
            </h1>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
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

        {/* Expense Details */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          {/* Main Info Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            border: `1px solid ${brandColors.neutral[200]}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            marginBottom: '1.5rem',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: `1px solid ${brandColors.neutral[100]}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: brandColors.error[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowDownRight size={20} color={brandColors.error[600]} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    margin: '0 0 0.25rem 0'
                  }}>
                    {expense.description}
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[500],
                    margin: 0
                  }}>
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
                <StatusButton status={expense.status} size="md" />
              </div>
            </div>

            {/* Details */}
            <div style={{
              padding: '1.5rem'
            }}>
              {/* Amount */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: brandColors.error[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={16} color={brandColors.error[600]} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    margin: '0 0 0.25rem 0'
                  }}>
                    Amount
                  </p>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: brandColors.error[600],
                    margin: 0
                  }}>
                    {formatAmount(expense.amount)}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: brandColors.neutral[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Tag size={16} color={brandColors.neutral[600]} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    margin: '0 0 0.25rem 0'
                  }}>
                    Category
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: brandColors.neutral[900],
                    margin: 0
                  }}>
                    {expense.category}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {expense.notes && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: brandColors.neutral[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <StickyNote size={16} color={brandColors.neutral[600]} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[700],
                      margin: '0 0 0.25rem 0'
                    }}>
                      Notes
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: brandColors.neutral[600],
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {expense.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${brandColors.neutral[100]}`
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: brandColors.neutral[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={16} color={brandColors.neutral[600]} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    margin: '0 0 0.25rem 0'
                  }}>
                    Created
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    margin: 0
                  }}>
                    {formatDate(expense.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
