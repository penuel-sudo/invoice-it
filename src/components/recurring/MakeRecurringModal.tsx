import { useState, useEffect } from 'react'
import { X, Calendar, Repeat, Mail, Clock, CheckCircle } from 'lucide-react'
import { brandColors } from '../../stylings'
import { checkIfRecurring, createRecurringInvoice, type RecurringSettings } from '../../lib/recurring/recurringService'
import toast from 'react-hot-toast'

interface MakeRecurringModalProps {
  invoiceId: string
  invoiceData: any
  user: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function MakeRecurringModal({
  invoiceId,
  invoiceData,
  user,
  isOpen,
  onClose,
  onSuccess
}: MakeRecurringModalProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringData, setRecurringData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>('')
  const [maxOccurrences, setMaxOccurrences] = useState<string>('')
  const [autoSend, setAutoSend] = useState(false)

  // Check if already recurring when modal opens
  useEffect(() => {
    if (isOpen && invoiceId) {
      checkRecurringStatus()
    }
  }, [isOpen, invoiceId])

  const checkRecurringStatus = async () => {
    setIsChecking(true)
    try {
      const result = await checkIfRecurring(invoiceId)
      setIsRecurring(result.isRecurring)
      setRecurringData(result.recurringData || null)
    } catch (error) {
      console.error('Error checking recurring status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invoiceData.client_id && !invoiceData.clientId) {
      toast.error('Client ID is required')
      return
    }

    setIsSaving(true)
    try {
      const settings: RecurringSettings = {
        frequency,
        startDate,
        endDate: endDate || undefined,
        maxOccurrences: maxOccurrences ? parseInt(maxOccurrences) : undefined,
        autoSend
      }

      const clientId = invoiceData.client_id || invoiceData.clientId
      const result = await createRecurringInvoice(
        invoiceId,
        clientId,
        user.id,
        settings
      )

      if (result.success) {
        toast.success('Invoice set as recurring!')
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      } else {
        toast.error(result.error || 'Failed to create recurring invoice')
      }
    } catch (error: any) {
      console.error('Error creating recurring invoice:', error)
      toast.error(error.message || 'Failed to create recurring invoice')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        style={{
          backgroundColor: brandColors.white,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            borderBottom: `1px solid ${brandColors.neutral[200]}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Repeat size={20} color={brandColors.primary[600]} />
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}
            >
              Make Recurring
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
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
            <X size={20} color={brandColors.neutral[600]} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {isChecking ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '0.875rem', color: brandColors.neutral[600] }}>
                Checking recurring status...
              </div>
            </div>
          ) : isRecurring ? (
            // Already recurring - show message
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: brandColors.primary[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <CheckCircle size={32} color={brandColors.primary[600]} />
              </div>
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  marginBottom: '0.5rem'
                }}
              >
                Already Set as Recurring
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}
              >
                This invoice is already configured as a recurring invoice.
              </p>
              {recurringData && (
                <div
                  style={{
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[600],
                        textTransform: 'capitalize'
                      }}
                    >
                      Frequency:
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900],
                        textTransform: 'capitalize'
                      }}
                    >
                      {recurringData.frequency}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[600]
                      }}
                    >
                      Next Generation:
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900]
                      }}
                    >
                      {new Date(recurringData.next_generation_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[600]
                      }}
                    >
                      Status:
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color:
                          recurringData.status === 'active'
                            ? brandColors.success[600]
                            : recurringData.status === 'paused'
                            ? brandColors.warning[600]
                            : brandColors.neutral[600],
                        textTransform: 'capitalize'
                      }}
                    >
                      {recurringData.status}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  onClose()
                  // Navigate to recurring page
                  if (window.location.pathname !== '/recurring') {
                    window.location.href = '/recurring'
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: brandColors.primary[600],
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[700]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[600]
                }}
              >
                View Recurring Invoices
              </button>
            </div>
          ) : (
            // Form for setting up recurring
            <form onSubmit={handleSubmit}>
              {/* Frequency */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}
                >
                  Frequency *
                </label>
                <select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(
                      e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
                    )
                  }
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900],
                    cursor: 'pointer'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Start Date */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
              </div>

              {/* End Date (Optional) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}
                >
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: brandColors.neutral[500],
                    marginTop: '0.25rem'
                  }}
                >
                  Leave empty for unlimited recurring
                </p>
              </div>

              {/* Max Occurrences (Optional) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}
                >
                  Max Occurrences (Optional)
                </label>
                <input
                  type="number"
                  value={maxOccurrences}
                  onChange={(e) => setMaxOccurrences(e.target.value)}
                  min="1"
                  placeholder="e.g., 12"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: brandColors.neutral[500],
                    marginTop: '0.25rem'
                  }}
                >
                  Maximum number of invoices to generate (leave empty for unlimited)
                </p>
              </div>

              {/* Auto Send */}
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: brandColors.neutral[50],
                  borderRadius: '8px',
                  border: `1px solid ${brandColors.neutral[200]}`
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700]
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoSend}
                    onChange={(e) => setAutoSend(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: brandColors.primary[600],
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      Auto-send Email
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[600]
                      }}
                    >
                      Automatically send email to client when invoice is generated
                    </div>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '2rem'
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    backgroundColor: brandColors.neutral[100],
                    color: brandColors.neutral[700],
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.neutral[200]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.neutral[100]
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    backgroundColor: brandColors.primary[600],
                    color: brandColors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    opacity: isSaving ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.backgroundColor = brandColors.primary[700]
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.backgroundColor = brandColors.primary[600]
                    }
                  }}
                >
                  {isSaving ? 'Setting up...' : 'Set as Recurring'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

