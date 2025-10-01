import { useState, useEffect } from 'react'
import { brandColors } from '../stylings'
import NotificationItem from './NotificationItem'
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Clock
} from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'

interface NotificationDropdownProps {
  isVisible: boolean
  onClose: () => void
}

export default function NotificationDropdown({ isVisible, onClose }: NotificationDropdownProps) {
  const [isMobile, setIsMobile] = useState(false)
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotification()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertCircle
      case 'error':
        return AlertCircle
      default:
        return Info
    }
  }

  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Just now'
    }
  }


  return (
    <>
      <style>
        {`
          .notification-dropdown::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div
        className="notification-dropdown"
        style={{
        position: 'fixed',
        top: isVisible ? (isMobile ? '70px' : '80px') : '-100vh',
        right: isMobile ? '1rem' : '2rem',
        left: isMobile ? '1rem' : 'auto',
        width: isMobile ? 'auto' : '400px',
        backgroundColor: brandColors.white,
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        zIndex: 50,
        transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: '60vh',
        overflowY: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        border: `1px solid ${brandColors.neutral[100]}`
      }}
    >
      {/* Top Border Line */}
      <div style={{
        width: '40px',
        height: '4px',
        backgroundColor: brandColors.neutral[900],
        borderRadius: '2px',
        margin: '0 auto 1.5rem auto'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: brandColors.neutral[900],
          margin: 0
        }}>
          Notifications
        </h3>
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
            justifyContent: 'center'
          }}
        >
          <X size={18} color={brandColors.neutral[500]} />
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: brandColors.neutral[400]
          }}>
            <Info size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              id={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              time={getTimeAgo(notification.created_at)}
              icon={getNotificationIcon(notification.type)}
              status={notification.status}
              isRead={notification.is_read}
              onClick={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id)
                }
              }}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${brandColors.neutral[100]}`,
          textAlign: 'center'
        }}>
          <button 
            onClick={markAllAsRead}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.primary[50],
              color: brandColors.primary[600],
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[100]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[50]
            }}
          >
            Mark All as Read
          </button>
        </div>
      )}
    </div>
    </>
  )
}
