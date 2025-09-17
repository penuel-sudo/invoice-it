import { Home, FileText, Plus, BarChart3, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { brandColors } from '../../stylings'
import SettingsPanel from '../SettingsPanel'
import NotificationDropdown from '../NotificationDropdown'

const navigationItems = [
  { id: 'Home', icon: Home, path: '/dashboard' },
  { id: 'Transaction', icon: FileText, path: '/invoices' },
  { id: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'Menu', icon: Menu, path: '/menu' }
]

interface BottomNavProps {
  isNotificationVisible?: boolean
  onNotificationToggle?: () => void
}

export default function BottomNav({ isNotificationVisible = false, onNotificationToggle }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)

  const handleNavigation = (path: string) => {
    if (path === '/menu') {
      setIsSettingsVisible(!isSettingsVisible)
    } else {
      setIsSettingsVisible(false)
      navigate(path)
    }
  }

  return (
    <>
      {/* Notification Dropdown */}
      <NotificationDropdown 
        isVisible={isNotificationVisible} 
        onClose={() => onNotificationToggle?.()} 
      />
      
      {/* Settings Panel */}
      <SettingsPanel 
        isVisible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)}
        onNotificationClick={() => onNotificationToggle?.()}
      />
      
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: brandColors.white,
        borderTop: `1px solid ${brandColors.neutral[200]}`,
        borderTopLeftRadius: '25px',
        borderTopRightRadius: '25px',
        borderBottomLeftRadius: '25px',
        borderBottomRightRadius: '25px',
        padding: '0.75rem 1.5rem 1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        zIndex: 50,
        boxShadow: '0 -4px 12px 0 rgb(0 0 0 / 0.1)'
      }}>
        {/* Left Section: Home */}
        <button
          onClick={() => handleNavigation('/dashboard')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: location.pathname === '/dashboard' ? brandColors.primary[600] : brandColors.neutral[500],
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            flex: 1
          }}
        >
          <Home size={24} />
          <span style={{
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Home
          </span>
        </button>

        {/* Left Center Section: Transaction */}
        <button
          onClick={() => handleNavigation('/invoices')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: location.pathname === '/invoices' ? brandColors.primary[600] : brandColors.neutral[500],
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            flex: 1
          }}
        >
          <FileText size={24} />
          <span style={{
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Transaction
          </span>
        </button>

        {/* Center Section: Create Button */}
        <button
          onClick={() => navigate('/invoice/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1rem',
            backgroundColor: 'transparent',
            color: brandColors.primary[600],
            border: `2px solid ${brandColors.primary[600]}`,
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            minWidth: '48px',
            minHeight: '48px',
            flex: 0,
            margin: '0 1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.primary[600]
            e.currentTarget.style.color = brandColors.white
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = brandColors.primary[600]
          }}
        >
          <Plus size={28} />
        </button>

        {/* Right Center Section: Reports */}
        <button
          onClick={() => handleNavigation('/reports')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: location.pathname === '/reports' ? brandColors.primary[600] : brandColors.neutral[500],
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            flex: 1
          }}
        >
          <BarChart3 size={24} />
          <span style={{
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Reports
          </span>
        </button>

        {/* Right Section: Menu */}
        <button
          onClick={() => handleNavigation('/menu')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: (location.pathname === '/menu' || isSettingsVisible) ? brandColors.primary[600] : brandColors.neutral[500],
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            flex: 1
          }}
        >
          <Menu size={24} />
          <span style={{
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Menu
          </span>
        </button>
      </nav>
    </>
  )
}
