import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/useAuth'
import Sidebar from './Sidebar.tsx'
import BottomNav from './BottomNav.tsx'
import Topbar from './Topbar.tsx'
import { brandColors } from '../../stylings'

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      {/* Topbar - Only show when showTopbar is true */}
      {showTopbar && (
        <Topbar 
          onNotificationClick={() => onNotificationToggle?.()}
          onSettingsOpen={onSettingsOpen}
          unreadCount={3}
        />
      )}
      
      <div style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Sidebar - Desktop only */}
        {!isMobile && <Sidebar onSettingsOpen={onSettingsOpen} />}
        
        {/* Main Content */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: isMobile ? '100vw' : 'calc(100vw - 280px)',
          padding: isMobile ? '0' : '2rem',
          paddingBottom: isMobile && !hideBottomNav ? '5rem' : '2rem', // Space for bottom nav on mobile
          transition: 'margin-left 0.3s ease',
          overflowX: 'hidden',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>
      </div>
      
      {/* Bottom Navigation - Mobile only */}
      {isMobile && !hideBottomNav && <BottomNav isNotificationVisible={isNotificationVisible} onNotificationToggle={onNotificationToggle} />}
    </div>
  )
}
