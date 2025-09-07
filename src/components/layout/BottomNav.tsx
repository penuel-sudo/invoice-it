import { Home, FileText, Plus, BarChart3, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { brandColors } from '../../stylings'
import SettingsPanel from '../SettingsPanel'
import NotificationDropdown from '../NotificationDropdown'

const navigationItems = [
  { id: 'Home', icon: Home, path: '/dashboard' },
  { id: 'Invoices', icon: FileText, path: '/invoices' },
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
        padding: '0.75rem 1rem 1rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        boxShadow: '0 -4px 12px 0 rgb(0 0 0 / 0.1)'
      }}>
        {/* Regular Navigation Items */}
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || (item.path === '/menu' && isSettingsVisible)
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: isActive ? brandColors.primary[600] : brandColors.neutral[500],
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                minWidth: '60px'
              }}
            >
              <Icon size={24} />
              <span style={{
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {item.id}
              </span>
            </button>
          )
        })}

        {/* Floating Action Button - Create Invoice */}
        <button
          onClick={() => navigate('/invoice/new')}
          style={{
            position: 'absolute',
            top: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '55px',
            height: '55px',
            backgroundColor: 'transparent',
            color: brandColors.primary[600],
            border: `3px solid ${brandColors.primary[600]}`,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px 0 rgb(0 0 0 / 0.15)',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.primary[50]
            e.currentTarget.style.boxShadow = '0 6px 16px 0 rgb(0 0 0 / 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.boxShadow = '0 4px 12px 0 rgb(0 0 0 / 0.15)'
          }}
        >
          <Plus size={28} />
        </button>
      </nav>
    </>
  )
}
