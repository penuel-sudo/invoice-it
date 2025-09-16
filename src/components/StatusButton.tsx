import { brandColors } from '../stylings'

interface StatusButtonProps {
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'spent' | 'expense'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StatusButton({ status, size = 'sm', className = '' }: StatusButtonProps) {
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
          backgroundColor: brandColors.error[100],
          color: brandColors.error[700],
          borderColor: brandColors.error[200]
        }
      case 'spent':
        return {
          text: 'Spent',
          backgroundColor: brandColors.error[100],
          color: brandColors.error[700],
          borderColor: brandColors.error[200]
        }
      case 'expense':
        return {
          text: 'Expense',
          backgroundColor: brandColors.error[100],
          color: brandColors.error[700],
          borderColor: brandColors.error[200]
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
          borderRadius: '6px'
        }
      case 'md':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.75rem',
          borderRadius: '8px'
        }
      case 'lg':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          borderRadius: '10px'
        }
      default:
        return {
          padding: '0.25rem 0.5rem',
          fontSize: '0.625rem',
          borderRadius: '6px'
        }
    }
  }

  const statusConfig = getStatusConfig(status)
  const sizeConfig = getSizeConfig(size)

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
        whiteSpace: 'nowrap'
      }}
    >
      {statusConfig.text}
    </span>
  )
}
