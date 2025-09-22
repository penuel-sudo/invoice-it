import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { brandColors } from '../stylings'
import { AlertTriangle, Clock, Calendar } from 'lucide-react'

export interface OverdueWarning {
  id: string
  type: 'invoice' | 'expense'
  title: string
  daysUntilDue: number
  dueDate: string
  clientName?: string
  description?: string
  amount: number
}

interface OverdueDetectorProps {
  userId: string
  onOverdueUpdate?: (count: number) => void
  showWarnings?: boolean
  className?: string
}

export default function OverdueDetector({ 
  userId, 
  onOverdueUpdate, 
  showWarnings = true,
  className = '' 
}: OverdueDetectorProps) {
  const [overdueCount, setOverdueCount] = useState(0)
  const [warnings, setWarnings] = useState<OverdueWarning[]>([])
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkOverdueInvoices = async () => {
    if (!userId) return

    try {
      setLoading(true)
      console.log('Checking overdue invoices for user:', userId)

      // Get all pending invoices that are past due date
      const { data: overdueInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          id,
          client_id,
          due_date,
          total_amount,
          clients!inner(id, name, overdue_count)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString().split('T')[0]) // Due date is before today

      if (fetchError) {
        console.error('Error fetching overdue invoices:', fetchError)
        return
      }

      if (!overdueInvoices || overdueInvoices.length === 0) {
        console.log('No overdue invoices found')
        setOverdueCount(0)
        onOverdueUpdate?.(0)
        return
      }

      console.log(`Found ${overdueInvoices.length} overdue invoices`)

      // Update invoice statuses to overdue
      const invoiceIds = overdueInvoices.map(inv => inv.id)
      const { error: updateInvoiceError } = await supabase
        .from('invoices')
        .update({ 
          status: 'overdue',
          updated_at: new Date().toISOString()
        })
        .in('id', invoiceIds)

      if (updateInvoiceError) {
        console.error('Error updating invoice statuses:', updateInvoiceError)
        return
      }

      // Update client overdue counts
      const clientUpdates = new Map<string, number>()
      
      overdueInvoices.forEach(invoice => {
        const clientId = invoice.client_id
        const currentCount = clientUpdates.get(clientId) || invoice.clients.overdue_count
        clientUpdates.set(clientId, currentCount + 1)
      })

      // Update each client's overdue count
      for (const [clientId, newCount] of clientUpdates) {
        const { error: updateClientError } = await supabase
          .from('clients')
          .update({ 
            overdue_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId)
          .eq('user_id', userId)

        if (updateClientError) {
          console.error(`Error updating client ${clientId} overdue count:`, updateClientError)
        }
      }

      console.log(`Successfully updated ${overdueInvoices.length} invoices to overdue status`)
      setOverdueCount(overdueInvoices.length)
      onOverdueUpdate?.(overdueInvoices.length)
      setLastChecked(new Date())
    } catch (error) {
      console.error('Error in checkOverdueInvoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUpcomingWarnings = async () => {
    if (!userId) return

    try {
      const today = new Date()
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

      // Get invoices due in the next 3 days
      const { data: upcomingInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          id,
          due_date,
          total_amount,
          status,
          clients!inner(name)
        `)
        .eq('user_id', userId)
        .in('status', ['pending', 'draft'])
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])

      if (fetchError) {
        console.error('Error fetching upcoming invoices:', fetchError)
        return
      }

      if (!upcomingInvoices || upcomingInvoices.length === 0) {
        setWarnings([])
        return
      }

      // Generate warnings
      const newWarnings: OverdueWarning[] = upcomingInvoices.map(invoice => {
        const dueDate = new Date(invoice.due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: invoice.id,
          type: 'invoice',
          title: `Invoice due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          daysUntilDue,
          dueDate: invoice.due_date,
          clientName: invoice.clients.name,
          amount: invoice.total_amount
        }
      })

      // Sort by days until due (most urgent first)
      newWarnings.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      setWarnings(newWarnings)
    } catch (error) {
      console.error('Error in getUpcomingWarnings:', error)
    }
  }

  const formatWarningMessage = (warning: OverdueWarning): string => {
    if (warning.daysUntilDue === 0) {
      return `${warning.title} (Today!)`
    } else if (warning.daysUntilDue === 1) {
      return `${warning.title} (Tomorrow)`
    } else {
      return `${warning.title} (${warning.dueDate})`
    }
  }

  const getWarningColor = (warning: OverdueWarning): string => {
    if (warning.daysUntilDue === 0) {
      return brandColors.error[600] // Red for due today
    } else if (warning.daysUntilDue === 1) {
      return brandColors.warning[600] // Orange for due tomorrow
    } else {
      return brandColors.info[600] // Blue for due in 2-3 days
    }
  }

  const getWarningIcon = (warning: OverdueWarning) => {
    if (warning.daysUntilDue === 0) {
      return <AlertTriangle size={16} />
    } else if (warning.daysUntilDue === 1) {
      return <Clock size={16} />
    } else {
      return <Calendar size={16} />
    }
  }

  // Check overdue invoices on mount and when userId changes
  useEffect(() => {
    if (userId) {
      checkOverdueInvoices()
      getUpcomingWarnings()
    }
  }, [userId])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        checkOverdueInvoices()
        getUpcomingWarnings()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [userId])

  if (!showWarnings) {
    return null
  }

  return (
    <div className={className}>
      {/* Overdue Summary */}
      {overdueCount > 0 && (
        <div style={{
          backgroundColor: brandColors.error[50],
          border: `1px solid ${brandColors.error[200]}`,
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={16} color={brandColors.error[600]} />
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: brandColors.error[700]
          }}>
            {overdueCount} invoice{overdueCount !== 1 ? 's' : ''} overdue
          </span>
        </div>
      )}

      {/* Upcoming Warnings */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {warnings.map((warning) => (
            <div
              key={warning.id}
              style={{
                backgroundColor: warning.daysUntilDue === 0 ? brandColors.error[50] : 
                                warning.daysUntilDue === 1 ? brandColors.warning[50] : 
                                brandColors.info[50],
                border: `1px solid ${warning.daysUntilDue === 0 ? brandColors.error[200] : 
                                  warning.daysUntilDue === 1 ? brandColors.warning[200] : 
                                  brandColors.info[200]}`,
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {getWarningIcon(warning)}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: getWarningColor(warning),
                  margin: '0 0 0.25rem 0'
                }}>
                  {formatWarningMessage(warning)}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  margin: 0
                }}>
                  {warning.clientName} • ${warning.amount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          color: brandColors.neutral[600],
          fontSize: '0.875rem'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${brandColors.neutral[200]}`,
            borderTop: `2px solid ${brandColors.primary[600]}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          Checking overdue invoices...
        </div>
      )}

      {/* Last Checked */}
      {lastChecked && !loading && (
        <p style={{
          fontSize: '0.75rem',
          color: brandColors.neutral[500],
          margin: '0.5rem 0 0 0',
          textAlign: 'center'
        }}>
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
