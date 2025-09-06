import { Home, FileText, Plus, BarChart3, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { brandColors } from '../../stylings'

const navigationItems = [
  { id: 'Home', icon: Home, path: '/dashboard' },
  { id: 'Invoices', icon: FileText, path: '/invoices' },
  { id: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'Menu', icon: Menu, path: '/menu' }
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: brandColors.white,
      borderTop: `1px solid ${brandColors.neutral[200]}`,
      padding: '0.75rem 1rem',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 50,
      boxShadow: '0 -1px 3px 0 rgb(0 0 0 / 0.1)'
    }}>
      {/* Regular Navigation Items */}
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        
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
            <Icon size={20} />
            <span style={{
              fontSize: '10px',
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
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '56px',
          height: '56px',
          backgroundColor: brandColors.primary[600],
          color: brandColors.white,
          border: 'none',
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
          e.currentTarget.style.backgroundColor = brandColors.primary[700]
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'
          e.currentTarget.style.boxShadow = '0 6px 16px 0 rgb(0 0 0 / 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = brandColors.primary[600]
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px 0 rgb(0 0 0 / 0.15)'
        }}
      >
        <Plus size={24} />
      </button>
    </nav>
  )
}
