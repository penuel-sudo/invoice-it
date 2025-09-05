import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { brandColors, typographyPresets } from '../../stylings'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'

// Helper function to convert typography presets to inline styles
const getTypographyStyle = (preset: any) => ({
  fontSize: typeof preset.fontSize === 'string' ? preset.fontSize : (Array.isArray(preset.fontSize) ? preset.fontSize[0] : '1rem'),
  fontWeight: preset.fontWeight,
  lineHeight: preset.lineHeight,
  letterSpacing: preset.letterSpacing,
})

export default function Header() {
  const { user, signOut } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
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

  return (
    <header style={{
      backgroundColor: brandColors.white,
      borderBottom: `1px solid ${brandColors.neutral[200]}`,
      padding: '1rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    }}>
      {/* Left Side - Logo/App Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <img 
          src="/logo3_assets_bundle/icon-64x64.png" 
          alt="Invoice-It" 
          style={{ 
            width: '32px', 
            height: '32px',
            borderRadius: '8px'
          }}
        />
        <h1 style={{
          ...getTypographyStyle(typographyPresets.h3),
          color: brandColors.neutral[900],
          margin: 0,
          fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
        }}>
          Invoice-It
        </h1>
      </div>

      {/* Right Side - Notifications & Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: brandColors.neutral[600],
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.neutral[100]
            e.currentTarget.style.color = brandColors.neutral[900]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = brandColors.neutral[600]
          }}
        >
          <Bell size={20} />
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              style={{
                padding: 0,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Avatar style={{ width: '40px', height: '40px' }}>
                <AvatarImage 
                  src={user?.user_metadata?.avatar_url} 
                  alt={user?.user_metadata?.name || user?.email || 'User'} 
                />
                <AvatarFallback style={{
                  backgroundColor: brandColors.primary[100],
                  color: brandColors.primary[700],
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {getInitials(user?.user_metadata?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{
            backgroundColor: brandColors.white,
            border: `1px solid ${brandColors.neutral[200]}`,
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
            padding: '0.5rem',
            minWidth: '200px'
          }}>
            <DropdownMenuItem style={{
              padding: '0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: brandColors.neutral[700]
            }}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem style={{
              padding: '0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: brandColors.neutral[700]
            }}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleSignOut}
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: brandColors.error[600]
              }}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
