import { brandColors } from '../stylings'

type ValidStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense' | 'due'

interface StatusButtonProps {
  status: string // Accept any string from database
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StatusButton({ status, size = 'sm', className = '' }: StatusButtonProps) {
  // Internal validation - handles any database status
  const getValidStatus = (dbStatus: string): ValidStatus => {
    // Valid statuses that this component supports
    const validStatuses = ['draft', 'pending', 'paid', 'overdue', 'spent', 'expense', 'due'] as const
    
    // Check if status matches valid statuses
    if (validStatuses.includes(dbStatus as ValidStatus)) {
      return dbStatus as ValidStatus
    }
    
    // Handle common database status variations
    const statusMap: Record<string, ValidStatus> = {
      'draft': 'draft',
      'pending': 'pending', 
      'paid': 'paid',
      'overdue': 'overdue',
      'spent': 'spent',
      'expense': 'expense',
      'due': 'due',
      // Handle variations
      'DRAFT': 'draft',
      'PENDING': 'pending',
      'PAID': 'paid',
      'OVERDUE': 'overdue',
      'SPENT': 'spent',
      'EXPENSE': 'expense',
      'DUE': 'due'
    }
    
    return statusMap[dbStatus] || 'pending' // Default fallback
  }

  // TEMPORARY DEBUG: Force styling for problematic statuses
  const forceStatusStyling = (dbStatus: string): ValidStatus => {
    // Force these three statuses to get their proper styling
    if (dbStatus.toLowerCase().includes('overdue')) return 'overdue'
    if (dbStatus.toLowerCase().includes('spent')) return 'spent' 
    if (dbStatus.toLowerCase().includes('expense')) return 'expense'
    
    // For other statuses, use normal validation
    return getValidStatus(dbStatus)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          text: 'Draft',
          backgroundColor: brandColors.neutral[100],
          color: brandColors.neutral[700],
          borderColor: brandColors.neutral[200]
        }
      case 'pending':
        return {
          text: 'Pending',
          backgroundColor: brandColors.warning[100],
          color: brandColors.warning[700],
          borderColor: brandColors.warning[200]
        }
      case 'paid':
        return {
          text: 'Paid',
          backgroundColor: brandColors.success[100],
          color: brandColors.success[700],
          borderColor: brandColors.success[200]
        }
      case 'overdue':
        return {
          text: 'Overdue',
          backgroundColor: '#fef2f2', // Red 50
          color: '#dc2626', // Red 600
          borderColor: '#fecaca' // Red 200
        }
      case 'spent':
        return {
          text: 'Spent',
          backgroundColor: '#fef2f2', // Red 50
          color: '#dc2626', // Red 600
          borderColor: '#fecaca' // Red 200
        }
      case 'expense':
        return {
          text: 'Expense',
          backgroundColor: '#fef2f2', // Red 50
          color: '#dc2626', // Red 600
          borderColor: '#fecaca' // Red 200
        }
      case 'due':
        return {
          text: 'Due',
          backgroundColor: brandColors.warning[100],
          color: brandColors.warning[700],
          borderColor: brandColors.warning[200]
        }
      default:
        return {
          text: 'Unknown',
          backgroundColor: brandColors.neutral[100],
          color: brandColors.neutral[600],
          borderColor: brandColors.neutral[200]
        }
    }
  }

  const getSizeConfig = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.25rem 0.5rem',
          fontSize: '0.625rem',
          borderRadius: '6px',
          width: '60px',
          minWidth: '60px'
        }
      case 'md':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.75rem',
          borderRadius: '8px',
          width: '70px',
          minWidth: '70px'
        }
      case 'lg':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          borderRadius: '10px',
          width: '80px',
          minWidth: '80px'
        }
      default:
        return {
          padding: '0.25rem 0.5rem',
          fontSize: '0.625rem',
          borderRadius: '6px',
          width: '60px',
          minWidth: '60px'
        }
    }
  }

  // TEMPORARY DEBUG: Force styling for problematic statuses
  const validStatus = forceStatusStyling(status)
  const statusConfig = getStatusConfig(validStatus)
  const sizeConfig = getSizeConfig(size)
  
  // DEBUG: Log what's happening inside StatusButton
  console.log('StatusButton DEBUG - Input status:', status)
  console.log('StatusButton DEBUG - Valid status:', validStatus)
  console.log('StatusButton DEBUG - Status config:', statusConfig)

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: sizeConfig.padding,
        backgroundColor: statusConfig.backgroundColor,
        color: statusConfig.color,
        border: `1px solid ${statusConfig.borderColor}`,
        borderRadius: sizeConfig.borderRadius,
        fontSize: sizeConfig.fontSize,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        whiteSpace: 'nowrap',
        width: sizeConfig.width,
        minWidth: sizeConfig.minWidth,
        textAlign: 'center'
      }}
    >
      {statusConfig.text}
    </span>
  )
}
