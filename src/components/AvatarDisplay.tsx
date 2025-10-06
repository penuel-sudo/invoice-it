import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabaseClient'
import { brandColors } from '../stylings'

interface AvatarDisplayProps {
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

export default function AvatarDisplay({ 
  size = 'md', 
  showBorder = false, 
  className = '',
  style = {}
}: AvatarDisplayProps) {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) {
        setAvatarUrl(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching avatar URL:', error)
          setAvatarUrl(null)
        } else {
          setAvatarUrl(data?.avatar_url || null)
        }
      } catch (error) {
        console.error('Error fetching avatar URL:', error)
        setAvatarUrl(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvatar()

    // Listen for avatar changes
    const handleAvatarChanged = () => {
      fetchAvatar() // Re-fetch when event is dispatched
    }

    window.addEventListener('avatarChanged', handleAvatarChanged)
    return () => window.removeEventListener('avatarChanged', handleAvatarChanged)
  }, [user])

  const sizeStyles = sizeMap[size]
  const userInitial = user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 
                     user?.email?.charAt(0).toUpperCase() || 'U'

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
    backgroundColor: brandColors.primary[200],
    color: brandColors.primary[600],
    fontSize: sizeStyles.fontSize,
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  if (isLoading) {
    return (
      <div style={avatarStyle} className={className}>
        <div style={{
          ...fallbackStyle,
          width: '100%',
          height: '100%'
        }}>
          <User size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 30 : 40} />
        </div>
      </div>
    )
  }

  return (
    <div style={avatarStyle} className={className}>
      {avatarUrl ? (
        <img
          src={avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${avatarUrl}`}
          alt="Avatar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={() => {
            setAvatarUrl(null) // Fallback to initials if image fails to load
          }}
        />
      ) : (
        <div style={{
          ...fallbackStyle,
          width: '100%',
          height: '100%'
        }}>
          {userInitial}
        </div>
      )}
    </div>
  )
}
