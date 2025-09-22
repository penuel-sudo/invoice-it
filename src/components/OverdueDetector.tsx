import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { brandColors } from '../stylings'
import { AlertTriangle } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)

  const checkOverdueInvoices = async () => {
    if (!userId) return

    try {
      setLoading(true)
      console.log('Checking overdue invoices for user:', userId)

      // Get all pending invoices where due_date <= today (overdue)
      const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
      
      const { data: overdueInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          id,
          due_date,
          issue_date,
          status
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lte('due_date', today) // due_date <= today (overdue)

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

      console.log(`Successfully updated ${overdueInvoices.length} invoices to overdue status`)
      setOverdueCount(overdueInvoices.length)
      onOverdueUpdate?.(overdueInvoices.length)
    } catch (error) {
      console.error('Error in checkOverdueInvoices:', error)
    } finally {
      setLoading(false)
    }
  }



  // Check overdue invoices on mount and when userId changes
  useEffect(() => {
    if (userId) {
      checkOverdueInvoices()
    }
  }, [userId])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        checkOverdueInvoices()
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
    </div>
  )
}
