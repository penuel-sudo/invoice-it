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

      // Read invoices already marked overdue
      const { data: overdueInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'overdue')

      if (fetchError) {
        console.error('Error fetching overdue invoices:', fetchError)
        return
      }

      const count = overdueInvoices?.length ?? 0
      console.log(`Overdue invoices detected: ${count}`)
      setOverdueCount(count)
      onOverdueUpdate?.(count)
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
