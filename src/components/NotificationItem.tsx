import { brandColors } from '../stylings'
import StatusButton from './StatusButton'

interface NotificationItemProps {
  id: number
  type: string
  title: string
  message: string
  time: string
  icon: any
  status?: 'paid' | 'due' | 'pending' | 'spent' | 'income' | 'expense'
  isRead?: boolean
  onClick?: () => void
}

export default function NotificationItem({ 
  id, 
  type, 
  title, 
  message, 
  time, 
  icon: Icon, 
  status, 
  isRead = false,
  onClick 
}: NotificationItemProps) {
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: brandColors.success[50],
          border: brandColors.success[200],
          icon: brandColors.success[600]
        }
      case 'warning':
        return {
          bg: brandColors.warning[50],
          border: brandColors.warning[200],
          icon: brandColors.warning[600]
        }
      case 'error':
        return {
          bg: brandColors.error[50],
          border: brandColors.error[200],
          icon: brandColors.error[600]
        }
      default:
        return {
          bg: brandColors.neutral[50],
          border: brandColors.neutral[200],
          icon: brandColors.neutral[600]
        }
    }
  }

  const colors = getNotificationColor(type)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: colors.bg,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        // Visual difference for unread notifications
        opacity: isRead ? 0.7 : 1,
        borderLeft: isRead ? `1px solid ${colors.border}` : `4px solid ${colors.icon}`
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Unread indicator dot */}
      {!isRead && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '8px',
          height: '8px',
          backgroundColor: brandColors.error[500],
          borderRadius: '50%',
          border: `2px solid ${brandColors.white}`
        }} />
      )}

      <div style={{
        width: '32px',
        height: '32px',
        backgroundColor: brandColors.white,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={16} color={colors.icon} />
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: isRead ? '500' : '600', // Lighter font weight for read notifications
            color: brandColors.neutral[900],
            margin: 0,
            flex: 1
          }}>
            {title}
          </h4>
          {status && (
            <StatusButton 
              status={status} 
              size="sm" 
            />
          )}
        </div>
        <p style={{
          fontSize: '0.75rem',
          color: brandColors.neutral[600],
          margin: '0 0 0.25rem 0',
          lineHeight: '1.4'
        }}>
          {message}
        </p>
        <p style={{
          fontSize: '0.625rem',
          color: brandColors.neutral[400],
          margin: 0
        }}>
          {time}
        </p>
      </div>
    </div>
  )
}
