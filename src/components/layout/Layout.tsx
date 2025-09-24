import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/useAuth'
import Sidebar from './Sidebar.tsx'
import BottomNav from './BottomNav.tsx'
import Topbar from './Topbar.tsx'
import { brandColors } from '../../stylings'
import { Bell } from 'lucide-react'
import { getUserProfilePictureUrl } from '../../lib/profilePicture'

interface LayoutProps {
  children: React.ReactNode
  isNotificationVisible?: boolean
  onNotificationToggle?: () => void
  onSettingsOpen?: () => void
  hideBottomNav?: boolean
  showTopbar?: boolean
}

export default function Layout({ children, isNotificationVisible, onNotificationToggle, onSettingsOpen, hideBottomNav = false, showTopbar = false }: LayoutProps) {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load profile picture
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
    }

    loadProfilePicture()
  }, [user])

  if (!user) return null

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.white,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>

      <div style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Sidebar Area - Desktop only */}
        {!isMobile && (
          <div style={{
            width: '280px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Logo Header - Above Sidebar */}
            <div style={{
              padding: '1.5rem 1rem',
              backgroundColor: brandColors.white,
              borderBottom: `1px solid ${brandColors.neutral[200]}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <img
                src="/logo_web_app_64x64.png"
                alt="InvoiceIt Logo"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: brandColors.neutral[900],
                margin: 0,
                fontFamily: 'Poppins, sans-serif'
              }}>
                InvoiceIt
              </h1>
            </div>
            
            {/* Sidebar */}
            <Sidebar onSettingsOpen={onSettingsOpen} />
          </div>
        )}
        
        {/* Main Content Area */}
        <div style={{
          flex: 1,
          width: '100%',
          maxWidth: isMobile ? '100vw' : 'calc(100vw - 280px)',
          marginLeft: isMobile ? 0 : '280px', // Sidebar width
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* User Display Header - Above Main Content */}
          {!isMobile && (
            <div style={{
              padding: '1.5rem 2rem',
              backgroundColor: brandColors.white,
              borderBottom: `1px solid ${brandColors.neutral[200]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* User Profile */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: brandColors.primary[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: brandColors.primary[600],
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    margin: 0
                  }}>
                    Hi, {user?.email?.split('@')[0] || 'User'}
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={onNotificationToggle}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.neutral[100]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Bell size={24} color={brandColors.neutral[600]} />
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main style={{
            flex: 1,
            width: '100%',
            padding: isMobile ? '0' : '0.5rem',
            paddingBottom: isMobile && !hideBottomNav ? '5rem' : '2rem', // Space for bottom nav on mobile
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}>
            {children}
          </main>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile only */}
      {isMobile && !hideBottomNav && <BottomNav isNotificationVisible={isNotificationVisible} onNotificationToggle={onNotificationToggle} />}
    </div>
  )
}
