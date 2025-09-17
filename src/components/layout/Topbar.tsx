import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { brandColors } from '../../stylings'
import { getUserDisplayName, getUserProfilePictureUrl, getUserInitial } from '../../lib/profilePicture'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface TopbarProps {
  onNotificationClick: () => void
  onSettingsOpen?: () => void
  unreadCount?: number
}

export default function Topbar({ onNotificationClick, onSettingsOpen, unreadCount = 3 }: TopbarProps) {
  const { user } = useAuth()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (user) {
        try {
          const url = await getUserProfilePictureUrl(user)
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

  const displayName = getUserDisplayName(user)
  const userInitials = getUserInitial(user)

  // Get greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning! ☀️'
    if (hour < 17) return 'Good afternoon! 🌤️'
    return 'Good evening! 🌙'
  }

  return (
    <div style={{
      height: '70px',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 0.5rem',
      borderBottom: `1px solid ${brandColors.neutral[100]}`,
      boxSizing: 'border-box',
      width: '100%',
      flexShrink: 0
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
            {displayName}
          </p>
          <p style={{
            fontSize: '14px',
            color: brandColors.neutral[500],
            margin: 0,
            lineHeight: '1.2'
          }}>
            {getGreeting()}
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
