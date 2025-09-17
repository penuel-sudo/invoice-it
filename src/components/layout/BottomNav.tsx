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
        padding: '0.75rem 0.5rem 1rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        zIndex: 50,
        boxShadow: '0 -4px 12px 0 rgb(0 0 0 / 0.1)'
      }}>
        {/* Home - Closer to left edge */}
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
            marginRight: 'auto'
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

        {/* Transaction - With spacing from Create button */}
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
            marginRight: '1rem'
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

        {/* Create Invoice Button - Center */}
        <button
          onClick={() => navigate('/invoice/new')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: brandColors.primary[600],
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.primary[50]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Plus size={24} />
          <span style={{
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Create
          </span>
        </button>

        {/* Reports - With spacing from Create button */}
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
            marginLeft: '1rem'
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

        {/* Menu - Closer to right edge */}
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
            marginLeft: 'auto'
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
