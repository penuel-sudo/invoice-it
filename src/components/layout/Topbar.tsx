import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { brandColors } from '../../stylings'
import { getUserDisplayName, getProfilePictureUrl, getUserInitial } from '../../lib/profilePicture'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useNotification } from '../../contexts/NotificationContext'

interface TopbarProps {
  onNotificationClick: () => void
  onSettingsOpen?: () => void
}

export default function Topbar({ onNotificationClick, onSettingsOpen }: TopbarProps) {
  const { unreadCount } = useNotification()
  const { user } = useAuth()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (user) {
        try {
          const url = await getProfilePictureUrl(user.id)
          setProfilePictureUrl(url)
        } catch (error) {
          console.error('Error loading profile picture:', error)
          setProfilePictureUrl(null)
        }
      }
      setIsLoading(false)
    }

    loadProfilePicture()
  }, [user])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const displayName = getUserDisplayName(user)
  const userInitials = getUserInitial(user)

  // Get greeting with user name
  const getGreeting = () => {
    return `Hi, ${displayName}`
  }

  return (
    <div style={{
      position: isMobile ? 'fixed' : 'relative',
      top: isMobile ? 0 : 'auto',
      left: isMobile ? 0 : 'auto',
      right: isMobile ? 0 : 'auto',
      height: '60px',
      backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.85)' : brandColors.white,
      backdropFilter: isMobile ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: isMobile ? 'blur(12px)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 0.5rem 0 0.5rem',
      boxSizing: 'border-box',
      width: '100%',
      flexShrink: 0,
      zIndex: isMobile ? 40 : 'auto',
    }}>
      {/* Left Side - Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <Avatar style={{
          width: '40px',
          height: '40px',
          border: `2px solid ${brandColors.neutral[200]}`
        }}>
          <AvatarImage
            src={profilePictureUrl || user?.user_metadata?.avatar_url}
            alt={displayName}
          />
          <AvatarFallback style={{
            backgroundColor: brandColors.primary[100],
            color: brandColors.primary[700],
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {userInitials}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <p style={{
            fontSize: '16px',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0,
            lineHeight: '1.3'
          }}>
            {`Hi, ${displayName}`}
          </p>
        </div>
      </div>

      {/* Right Side - Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={onNotificationClick}
          style={{
            position: 'relative',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <Bell size={20} color={brandColors.neutral[600]} />
          
          {/* Bare Notification Number */}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              fontSize: '10px',
              fontWeight: '700',
              color: brandColors.error[500],
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
              margin: 0,
              lineHeight: 1
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
