import { useState, useEffect } from 'react'
import { brandColors } from '../stylings'
import NotificationItem from './NotificationItem'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Clock
} from 'lucide-react'

interface NotificationDropdownProps {
  isVisible: boolean
  onClose: () => void
}

interface Notification {
  id: number
  type: string
  title: string
  message: string
  time: string
  icon: any
  status?: 'paid' | 'due' | 'pending' | 'spent' | 'income' | 'expense'
  isRead?: boolean
}

export default function NotificationDropdown({ isVisible, onClose }: NotificationDropdownProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sample notifications data
  const notifications: Notification[] = [
    {
      id: 1,
      type: 'success',
      title: 'Payment Received',
      message: 'Invoice #INV0078 has been paid by Karim Ahmed',
      time: '2 minutes ago',
      icon: CheckCircle,
      status: 'paid',
      isRead: false // Unread
    },
    {
      id: 2,
      type: 'warning',
      title: 'Payment Overdue',
      message: 'Invoice #INV0079 is 3 days overdue',
      time: '1 hour ago',
      icon: AlertCircle,
      status: 'due',
      isRead: false // Unread
    },
    {
      id: 3,
      type: 'info',
      title: 'New Invoice Created',
      message: 'Invoice #INV0080 has been sent to Kabir Ahmed',
      time: '3 hours ago',
      icon: Info,
      status: 'pending',
      isRead: true // Read
    },
    {
      id: 4,
      type: 'info',
      title: 'Reminder Sent',
      message: 'Payment reminder sent to Nasir Hussain',
      time: '1 day ago',
      icon: Clock,
      status: 'pending',
      isRead: true // Read
    }
  ]


  return (
    <div
      style={{
        position: 'fixed',
        top: isVisible ? '80px' : '-100vh',
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
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            {...notification}
            onClick={() => {
              // TODO: Mark notification as read when clicked
              console.log('Notification clicked:', notification.id)
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: `1px solid ${brandColors.neutral[100]}`,
        textAlign: 'center'
      }}>
        <button style={{
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
        }}>
          Mark All as Read
        </button>
      </div>
    </div>
  )
}
