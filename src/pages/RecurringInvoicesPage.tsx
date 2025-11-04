import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import {
  ArrowLeft,
  Repeat,
  Pause,
  Play,
  X,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getRecurringInvoices,
  updateRecurringStatus,
  cancelRecurringInvoice,
  type RecurringInvoice
} from '../lib/recurring/recurringService'

export default function RecurringInvoicesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all')

  useEffect(() => {
    if (user) {
      loadRecurringInvoices()
    }
  }, [user])

  const loadRecurringInvoices = async () => {
    if (!user) return

    setLoading(true)
    try {
      const result = await getRecurringInvoices(user.id)
      if (result.success && result.data) {
        setRecurringInvoices(result.data)
      } else {
        toast.error(result.error || 'Failed to load recurring invoices')
      }
    } catch (error: any) {
      console.error('Error loading recurring invoices:', error)
      toast.error('Failed to load recurring invoices')
    } finally {
      setLoading(false)
    }
  }

  const handlePause = async (recurringId: string) => {
    try {
      const result = await updateRecurringStatus(recurringId, 'paused')
      if (result.success) {
        toast.success('Recurring invoice paused')
        loadRecurringInvoices()
      } else {
        toast.error(result.error || 'Failed to pause recurring invoice')
      }
    } catch (error: any) {
      console.error('Error pausing recurring invoice:', error)
      toast.error('Failed to pause recurring invoice')
    }
  }

  const handleResume = async (recurringId: string) => {
    try {
      const result = await updateRecurringStatus(recurringId, 'active')
      if (result.success) {
        toast.success('Recurring invoice resumed')
        loadRecurringInvoices()
      } else {
        toast.error(result.error || 'Failed to resume recurring invoice')
      }
    } catch (error: any) {
      console.error('Error resuming recurring invoice:', error)
      toast.error('Failed to resume recurring invoice')
    }
  }

  const handleCancel = async (recurringId: string) => {
    if (!window.confirm('Are you sure you want to cancel this recurring invoice?')) {
      return
    }

    try {
      const result = await cancelRecurringInvoice(recurringId)
      if (result.success) {
        toast.success('Recurring invoice cancelled')
        loadRecurringInvoices()
      } else {
        toast.error(result.error || 'Failed to cancel recurring invoice')
      }
    } catch (error: any) {
      console.error('Error cancelling recurring invoice:', error)
      toast.error('Failed to cancel recurring invoice')
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    }
    return labels[frequency] || frequency
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: brandColors.success[600],
          bg: brandColors.success[50],
          label: 'Active'
        }
      case 'paused':
        return {
          icon: AlertCircle,
          color: brandColors.warning[600],
          bg: brandColors.warning[50],
          label: 'Paused'
        }
      case 'cancelled':
        return {
          icon: XCircle,
          color: brandColors.neutral[600],
          bg: brandColors.neutral[50],
          label: 'Cancelled'
        }
      default:
        return {
          icon: Clock,
          color: brandColors.neutral[600],
          bg: brandColors.neutral[50],
          label: status
        }
    }
  }

  const filteredInvoices = recurringInvoices.filter((invoice) => {
    if (filter === 'all') return true
    return invoice.status === filter
  })

  if (!user) {
    return null
  }

  return (
    <Layout hideBottomNav={true}>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: brandColors.white,
          width: '100%',
          maxWidth: '100vw'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
            backgroundColor: brandColors.white,
            borderBottom: `1px solid ${brandColors.neutral[200]}`,
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <button
            onClick={() => navigate(-1)}
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
            <ArrowLeft size={window.innerWidth < 768 ? 20 : 24} color={brandColors.neutral[600]} />
          </button>
          
          <h1
            style={{
              fontSize: window.innerWidth < 768 ? '1.125rem' : '1.5rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: 0
            }}
          >
            Recurring Invoices
          </h1>
          
          <div style={{ width: window.innerWidth < 768 ? '40px' : '48px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Filters */}
        <div
          style={{
            padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
            borderBottom: `1px solid ${brandColors.neutral[200]}`,
            display: 'flex',
            gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
            overflowX: 'auto'
          }}
        >
          {(['all', 'active', 'paused', 'cancelled'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              style={{
                padding: window.innerWidth < 768 ? '0.5rem 1rem' : '0.75rem 1.5rem',
                backgroundColor: filter === filterOption ? brandColors.primary[600] : brandColors.neutral[100],
                color: filter === filterOption ? brandColors.white : brandColors.neutral[700],
                border: 'none',
                borderRadius: '8px',
                fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (filter !== filterOption) {
                  e.currentTarget.style.backgroundColor = brandColors.neutral[200]
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== filterOption) {
                  e.currentTarget.style.backgroundColor = brandColors.neutral[100]
                }
              }}
            >
              {filterOption === 'all' ? 'All' : filterOption}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: window.innerWidth < 768 ? '1rem' : '1.5rem' }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <Loader2 size={32} color={brandColors.primary[600]} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.875rem', color: brandColors.neutral[600] }}>
                Loading recurring invoices...
              </p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                flexDirection: 'column',
                gap: '1rem',
                textAlign: 'center'
              }}
            >
              <Repeat size={48} color={brandColors.neutral[400]} />
              <p style={{ fontSize: '1rem', fontWeight: '600', color: brandColors.neutral[900] }}>
                No Recurring Invoices
              </p>
              <p style={{ fontSize: '0.875rem', color: brandColors.neutral[600] }}>
                {filter === 'all'
                  ? "You haven't set up any recurring invoices yet."
                  : `No ${filter} recurring invoices found.`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredInvoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status)
                const StatusIcon = statusBadge.icon
                const invoiceSnapshot = invoice.invoice_snapshot || {}
                const totalAmount = parseFloat(invoiceSnapshot.total_amount || '0')

                return (
                  <div
                    key={invoice.id}
                    style={{
                      backgroundColor: brandColors.white,
                      borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: window.innerWidth < 768 ? '0.75rem' : '1rem'
                    }}
                  >
                    {/* Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                      gap: window.innerWidth < 768 ? '0.75rem' : '0'
                    }}>
                      <div style={{ flex: 1, width: '100%' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          marginBottom: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          <h3 style={{ 
                            fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem', 
                            fontWeight: '600', 
                            color: brandColors.neutral[900], 
                            margin: 0 
                          }}>
                            Invoice #{invoiceSnapshot.invoice_number_pattern || 'INV-####'}
                          </h3>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: statusBadge.bg,
                              color: statusBadge.color,
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <StatusIcon size={12} />
                            {statusBadge.label}
                          </div>
                        </div>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem', 
                          color: brandColors.neutral[600], 
                          margin: 0 
                        }}>
                          {(invoice as any).clients?.name || 'Client Name'}
                        </p>
                      </div>
                      <div style={{ 
                        textAlign: window.innerWidth < 768 ? 'left' : 'right',
                        width: window.innerWidth < 768 ? '100%' : 'auto'
                      }}>
                        <p
                          style={{
                            fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
                            fontWeight: '700',
                            color: brandColors.primary[600],
                            margin: 0
                          }}
                        >
                          ${totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
                        gap: window.innerWidth < 768 ? '0.75rem' : '1rem',
                        padding: window.innerWidth < 768 ? '0.75rem' : '1rem',
                        backgroundColor: brandColors.neutral[50],
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.7rem' : '0.75rem', 
                          color: brandColors.neutral[600], 
                          margin: '0 0 0.25rem 0' 
                        }}>
                          Frequency
                        </p>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.8rem' : '0.875rem', 
                          fontWeight: '600', 
                          color: brandColors.neutral[900], 
                          margin: 0 
                        }}>
                          {getFrequencyLabel(invoice.frequency)}
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.7rem' : '0.75rem', 
                          color: brandColors.neutral[600], 
                          margin: '0 0 0.25rem 0' 
                        }}>
                          Next Generation
                        </p>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.8rem' : '0.875rem', 
                          fontWeight: '600', 
                          color: brandColors.neutral[900], 
                          margin: 0 
                        }}>
                          {new Date(invoice.next_generation_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.7rem' : '0.75rem', 
                          color: brandColors.neutral[600], 
                          margin: '0 0 0.25rem 0' 
                        }}>
                          Generated Count
                        </p>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.8rem' : '0.875rem', 
                          fontWeight: '600', 
                          color: brandColors.neutral[900], 
                          margin: 0 
                        }}>
                          {invoice.total_generated_count} invoices
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.7rem' : '0.75rem', 
                          color: brandColors.neutral[600], 
                          margin: '0 0 0.25rem 0' 
                        }}>
                          Auto-send
                        </p>
                        <p style={{ 
                          fontSize: window.innerWidth < 768 ? '0.8rem' : '0.875rem', 
                          fontWeight: '600', 
                          color: brandColors.neutral[900], 
                          margin: 0 
                        }}>
                          {invoice.auto_send ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      flexWrap: 'wrap',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row'
                    }}>
                      {invoice.status === 'active' && (
                        <button
                          onClick={() => handlePause(invoice.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: brandColors.warning[50],
                            color: brandColors.warning[700],
                            border: `1px solid ${brandColors.warning[200]}`,
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            width: window.innerWidth < 768 ? '100%' : 'auto'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = brandColors.warning[100]
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = brandColors.warning[50]
                          }}
                        >
                          <Pause size={16} />
                          Pause
                        </button>
                      )}
                      {invoice.status === 'paused' && (
                        <button
                          onClick={() => handleResume(invoice.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: brandColors.success[50],
                            color: brandColors.success[700],
                            border: `1px solid ${brandColors.success[200]}`,
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            width: window.innerWidth < 768 ? '100%' : 'auto'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = brandColors.success[100]
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = brandColors.success[50]
                          }}
                        >
                          <Play size={16} />
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/invoices?recurring=${invoice.id}`)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: brandColors.primary[50],
                          color: brandColors.primary[700],
                          border: `1px solid ${brandColors.primary[200]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease',
                          width: window.innerWidth < 768 ? '100%' : 'auto'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = brandColors.primary[100]
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = brandColors.primary[50]
                        }}
                      >
                        <Eye size={16} />
                        View Generated
                      </button>
                      {invoice.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(invoice.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: brandColors.error[50],
                            color: brandColors.error[700],
                            border: `1px solid ${brandColors.error[200]}`,
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            width: window.innerWidth < 768 ? '100%' : 'auto'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = brandColors.error[100]
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = brandColors.error[50]
                          }}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

