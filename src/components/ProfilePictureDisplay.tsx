import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'

interface ProfilePictureDisplayProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBorder?: boolean
  className?: string
  style?: React.CSSProperties
}

const sizeMap = {
  sm: { width: '32px', height: '32px', fontSize: '0.75rem' },
  md: { width: '40px', height: '40px', fontSize: '0.875rem' },
  lg: { width: '80px', height: '80px', fontSize: '1.5rem' },
  xl: { width: '120px', height: '120px', fontSize: '2.5rem' }
}

export default function ProfilePictureDisplay({ 
  size = 'md', 
  showBorder = false,
  className = '',
  style = {}
}: ProfilePictureDisplayProps) {
  const { user } = useAuth()
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    async function fetchImage() {
      const { data, error } = await supabase
        .from('profiles')
        .select('image_url')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching image:', error)
        return
      }

      setImageUrl(data?.image_url || null)
    }

    fetchImage()

    // Listen for profile picture updates
    const handleProfilePictureUpdate = () => {
      fetchImage()
    }

    window.addEventListener('profilePictureChanged', handleProfilePictureUpdate)
    return () => window.removeEventListener('profilePictureChanged', handleProfilePictureUpdate)
  }, [user?.id])

  const sizeStyles = sizeMap[size]
  const userInitials = user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'

  const avatarStyle = {
    width: sizeStyles.width,
    height: sizeStyles.height,
    borderRadius: '50%',
    overflow: 'hidden',
    ...(showBorder && {
      border: `2px solid white`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }),
    ...style
  }

  const fallbackStyle = {
    backgroundColor: brandColors.primary[100],
    color: brandColors.primary[700],
    fontSize: sizeStyles.fontSize,
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  }

  return (
    <div 
      style={avatarStyle}
      className={className}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile picture"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div style={fallbackStyle}>
          {userInitials}
        </div>
      )}
    </div>
  )
}
