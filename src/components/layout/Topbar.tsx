import { Bell } from 'lucide-react'
import { brandColors } from '../../stylings'
import ProfileDropdown from '../ProfileDropdown'

interface TopbarProps {
  onNotificationClick: () => void
  onSettingsOpen?: () => void
  unreadCount?: number
}

export default function Topbar({ onNotificationClick, onSettingsOpen, unreadCount = 3 }: TopbarProps) {

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${brandColors.neutral[100]}`
    }}>
      {/* Left Side - Profile */}
      <ProfileDropdown 
        variant="topbar" 
        showPlan={false} 
        onSettingsOpen={onSettingsOpen}
      />

      {/* Right Side - Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={onNotificationClick}
          style={{
            position: 'relative',
            padding: '0.75rem',
            backgroundColor: brandColors.neutral[50],
            border: `1px solid ${brandColors.neutral[200]}`,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.neutral[100]
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.neutral[50]
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Bell size={20} color={brandColors.neutral[600]} />
          
          {/* Notification Dot */}
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '12px',
              height: '12px',
              backgroundColor: brandColors.error[500],
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${brandColors.white}`,
              fontSize: '10px',
              fontWeight: '700',
              color: brandColors.white,
              minWidth: '12px',
              padding: '0 2px'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
