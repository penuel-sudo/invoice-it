import { useState, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { getUserInitial, getProfilePictureUrl } from '../lib/profilePicture'
import { useAuth } from '../lib/useAuth'

interface ProfilePictureProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBorder?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  showHoverEffect?: boolean
  allowUpload?: boolean // Only allow upload in SettingsPage
}

const sizeMap = {
  sm: { width: '32px', height: '32px', fontSize: '0.75rem' },
  md: { width: '40px', height: '40px', fontSize: '0.875rem' },
  lg: { width: '80px', height: '80px', fontSize: '1.5rem' },
  xl: { width: '120px', height: '120px', fontSize: '2.5rem' }
}

export default function ProfilePicture({ 
  size = 'md', 
  showBorder = false, 
  className = '',
  style = {},
  onClick,
  showHoverEffect = false,
  allowUpload = false
}: ProfilePictureProps) {
  const { user } = useAuth()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load profile picture on mount
  useEffect(() => {
    if (user) {
      loadProfilePicture()
    }
  }, [user])

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      if (user) {
        loadProfilePicture()
      }
    }

    window.addEventListener('profilePictureChanged', handleProfilePictureUpdate)
    return () => window.removeEventListener('profilePictureChanged', handleProfilePictureUpdate)
  }, [user])

  const loadProfilePicture = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const url = await getProfilePictureUrl(user.id)
      setProfilePictureUrl(url)
    } catch (error) {
      console.error('Error loading profile picture:', error)
      setProfilePictureUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeStyles = sizeMap[size]
  const userInitials = getUserInitial(user)

  const avatarStyle = {
    width: sizeStyles.width,
    height: sizeStyles.height,
    ...(showBorder && {
      border: `2px solid white`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }),
    ...style
  }

  const fallbackStyle = {
    backgroundColor: '#dcfce7', // green-100
    color: '#166534', // green-800
    fontSize: sizeStyles.fontSize,
    fontWeight: '600'
  }

  return (
    <Avatar 
      style={avatarStyle}
      className={className}
      onClick={onClick}
    >
      {!isLoading && profilePictureUrl && (
        <AvatarImage 
          src={profilePictureUrl} 
          alt={user?.user_metadata?.full_name || 'Profile'} 
        />
      )}
      <AvatarFallback style={fallbackStyle}>
        {userInitials}
      </AvatarFallback>
    </Avatar>
  )
}
