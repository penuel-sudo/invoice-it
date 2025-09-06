import { useState } from 'react'
import { brandColors } from '../stylings'
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

export default function NotificationDropdown({ isVisible, onClose }: NotificationDropdownProps) {
  // Sample notifications data
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Payment Received',
      message: 'Invoice #INV0078 has been paid by Karim Ahmed',
      time: '2 minutes ago',
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'warning',
      title: 'Payment Overdue',
      message: 'Invoice #INV0079 is 3 days overdue',
      time: '1 hour ago',
      icon: AlertCircle
    },
    {
      id: 3,
      type: 'info',
      title: 'New Invoice Created',
      message: 'Invoice #INV0080 has been sent to Kabir Ahmed',
      time: '3 hours ago',
      icon: Info
    },
    {
      id: 4,
      type: 'info',
      title: 'Reminder Sent',
      message: 'Payment reminder sent to Nasir Hussain',
      time: '1 day ago',
      icon: Clock
    }
  ]

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
      case 'info':
        return {
          bg: brandColors.primary[50],
          border: brandColors.primary[200],
          icon: brandColors.primary[600]
        }
      default:
        return {
          bg: brandColors.neutral[50],
          border: brandColors.neutral[200],
          icon: brandColors.neutral[600]
        }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: isVisible ? '80px' : '-100vh',
        right: '1rem',
        left: '1rem',
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
        {notifications.map((notification) => {
          const Icon = notification.icon
          const colors = getNotificationColor(notification.type)
          
          return (
            <div
              key={notification.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: colors.bg,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
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
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.25rem 0'
                }}>
                  {notification.title}
                </h4>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  margin: '0 0 0.25rem 0',
                  lineHeight: '1.4'
                }}>
                  {notification.message}
                </p>
                <p style={{
                  fontSize: '0.625rem',
                  color: brandColors.neutral[400],
                  margin: 0
                }}>
                  {notification.time}
                </p>
              </div>
            </div>
          )
        })}
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
