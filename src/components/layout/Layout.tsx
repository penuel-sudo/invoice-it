import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/useAuth'
import Sidebar from './Sidebar.tsx'
import BottomNav from './BottomNav.tsx'
import { brandColors } from '../../stylings'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
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
      backgroundColor: brandColors.neutral[50],
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
        {/* Sidebar - Desktop only */}
        {!isMobile && <Sidebar />}
        
        {/* Main Content */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: isMobile ? '100vw' : 'calc(100vw - 280px)',
          padding: isMobile ? '0' : '2rem',
          paddingBottom: isMobile ? '5rem' : '2rem', // Space for bottom nav on mobile
          marginLeft: isMobile ? 0 : '280px', // Sidebar width
          transition: 'margin-left 0.3s ease',
          overflowX: 'hidden',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>
      </div>
      
      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav />}
    </div>
  )
}
