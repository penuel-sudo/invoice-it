import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, User, CreditCard, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { brandColors, typographyPresets } from '../stylings'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { getUserProfilePictureUrl, getUserDisplayName, getUserInitial } from '../lib/profilePicture'
import NotificationDropdown from './NotificationDropdown'
import toast from 'react-hot-toast'

interface ProfileDropdownProps {
  variant?: 'sidebar' | 'header' | 'topbar'
  showPlan?: boolean
  onSettingsOpen?: () => void
}

export default function ProfileDropdown({ 
  variant = 'sidebar', 
  showPlan = true,
  onSettingsOpen
}: ProfileDropdownProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)

  // Load profile picture when component mounts or user changes
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

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully!')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const displayName = getUserDisplayName(user)
  const userEmail = user?.email || ''
  const userInitials = getInitials(displayName, userEmail)

  // Define styles based on variant
  const containerStyle = variant === 'sidebar' ? {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    textAlign: 'left' as const
  } : variant === 'topbar' ? {
    padding: '0',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'left' as const
  } : {
    padding: '0.25rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }

  const avatarStyle = variant === 'sidebar' ? {
    width: '40px',
    height: '40px',
    flexShrink: 0
  } : variant === 'topbar' ? {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    border: `2px solid ${brandColors.neutral[200]}`
  } : {
    width: '32px',
    height: '32px',
    flexShrink: 0
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          style={containerStyle}
          onMouseEnter={(e) => {
            if (variant === 'sidebar') {
              e.currentTarget.style.backgroundColor = brandColors.neutral[50]
            }
          }}
          onMouseLeave={(e) => {
            if (variant === 'sidebar') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {/* Profile Picture */}
          <Avatar style={avatarStyle}>
            <AvatarImage 
              src={profilePictureUrl || user?.user_metadata?.avatar_url} 
              alt={displayName} 
            />
            <AvatarFallback style={{
              backgroundColor: brandColors.primary[100],
              color: brandColors.primary[700],
              fontSize: variant === 'sidebar' ? '14px' : '12px',
              fontWeight: '600'
            }}>
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info (sidebar and topbar variants) */}
          {(variant === 'sidebar' || variant === 'topbar') && (
            <>
              <div style={{
                flex: 1,
                minWidth: 0
              }}>
                <p style={{
                  fontSize: variant === 'topbar' ? '16px' : '14px',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  lineHeight: '1.4',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {displayName}
                </p>
                {variant === 'topbar' ? (
                  <p style={{
                    fontSize: '14px',
                    color: brandColors.neutral[500],
                    lineHeight: '1.2',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Good morning! 👋
                  </p>
                ) : showPlan && (
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: brandColors.neutral[500],
                    lineHeight: '1.3',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Free Plan
                  </p>
                )}
              </div>
              <ChevronDown 
                size={16} 
                style={{
                  flexShrink: 0,
                  color: brandColors.neutral[400],
                  transition: 'transform 0.2s ease'
                }}
              />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={variant === 'sidebar' ? 'start' : 'end'}
        style={{
          backgroundColor: brandColors.white,
          border: `1px solid ${brandColors.neutral[200]}`,
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
          padding: '0.5rem',
          minWidth: variant === 'sidebar' ? '240px' : '200px'
        }}
      >
        {/* Profile Info Header */}
        <div style={{
          padding: '0.75rem',
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          marginBottom: '0.25rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.25rem'
          }}>
            <Avatar style={{ width: '32px', height: '32px' }}>
              <AvatarImage 
                src={profilePictureUrl || user?.user_metadata?.avatar_url} 
                alt={displayName} 
              />
              <AvatarFallback style={{
                backgroundColor: brandColors.primary[100],
                color: brandColors.primary[700],
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0,
                lineHeight: '1.4'
              }}>
                {displayName}
              </p>
              <p style={{
                fontSize: '12px',
                color: brandColors.neutral[500],
                margin: 0,
                lineHeight: '1.3'
              }}>
                {userEmail}
              </p>
            </div>
          </div>
          {showPlan && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: brandColors.primary[50],
              borderRadius: '4px',
              marginTop: '0.5rem'
            }}>
              <CreditCard size={12} color={brandColors.primary[600]} />
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: brandColors.primary[700]
              }}>
                Free Plan
              </span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <DropdownMenuItem style={{
          padding: '0.75rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: brandColors.neutral[700],
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <User size={16} />
          Profile Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem style={{
          padding: '0.75rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: brandColors.neutral[700],
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CreditCard size={16} />
          Billing & Plans
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/settings')}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: brandColors.neutral[700],
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Settings size={16} />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: brandColors.error[600],
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <LogOut size={16} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Notification Dropdown */}
        <NotificationDropdown 
          isVisible={isNotificationVisible} 
          onClose={() => setIsNotificationVisible(false)} 
        />
  </>
  )
}
