import { Home, FileText, Layout, Plus, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { brandColors } from '../../stylings'
import NotificationDropdown from '../NotificationDropdown'

const navigationItems = [
  { id: 'Home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'Invoices', label: 'Invoices', icon: FileText, path: '/invoices?tab=invoices' },
  { id: 'Templates', label: 'Templates', icon: Layout, path: '/templates' },
  { id: 'Settings', label: 'Settings', icon: Settings, path: '/settings' }
]

interface BottomNavProps {
  isNotificationVisible?: boolean
  onNotificationToggle?: () => void
}

export default function BottomNav({ isNotificationVisible = false, onNotificationToggle }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      {/* Notification Dropdown */}
      <NotificationDropdown 
        isVisible={isNotificationVisible} 
        onClose={() => onNotificationToggle?.()} 
      />
      
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${brandColors.neutral[200]}`,
        padding: '0.5rem 1rem 0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: '0.5rem',
        zIndex: 50,
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Left Items (Home & Invoices) */}
        {navigationItems.slice(0, 2).map((item) => {
          const Icon = item.icon
          const itemPath = item.path.split('?')[0]
          const isActive = location.pathname === itemPath || 
                          (item.id === 'Invoices' && location.pathname === '/invoices')
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.25rem',
                backgroundColor: 'transparent',
                color: isActive ? brandColors.primary[600] : brandColors.neutral[400],
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  transition: 'all 0.2s ease'
                }}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s ease'
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '-0.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: brandColors.primary[600]
                }} />
              )}
            </button>
          )
        })}

        {/* Center Section: Create Button (FAB) */}
        <button
          onClick={() => navigate('/invoice/new')}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            minWidth: '56px',
            minHeight: '56px',
            marginTop: '-2rem',
            backgroundColor: brandColors.primary[600],
            color: brandColors.white,
            border: `4px solid ${brandColors.white}`,
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>

        {/* Right Items (Templates & Settings) */}
        {navigationItems.slice(2).map((item) => {
          const Icon = item.icon
          const itemPath = item.path.split('?')[0]
          const isActive = location.pathname === itemPath
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.25rem',
                backgroundColor: 'transparent',
                color: isActive ? brandColors.primary[600] : brandColors.neutral[400],
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  transition: 'all 0.2s ease'
                }}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s ease'
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '-0.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: brandColors.primary[600]
                }} />
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}
