import { Home, FileText, Plus, DollarSign, Settings, Users, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/useAuth'
import { brandColors, typographyPresets } from '../../stylings'
import toast from 'react-hot-toast'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'invoices', label: 'Invoices', icon: FileText, path: '/invoices' },
  { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
  { id: 'expenses', label: 'Expenses', icon: DollarSign, path: '/expenses' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully!')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: '280px',
      backgroundColor: brandColors.white,
      borderRight: `1px solid ${brandColors.neutral[200]}`,
      padding: '2rem 0',
      zIndex: 40,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Navigation Items */}
        <nav style={{ padding: '0 1.5rem' }}>
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: isActive ? brandColors.primary[50] : 'transparent',
                  color: isActive ? brandColors.primary[700] : brandColors.neutral[600],
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                    e.currentTarget.style.color = brandColors.neutral[900]
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = brandColors.neutral[600]
                  }
                }}
              >
                <Icon size={20} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Create Invoice Button */}
        <div style={{ padding: '1.5rem' }}>
          <button
            onClick={() => navigate('/invoice/new')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[700]
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px 0 rgb(0 0 0 / 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[600]
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)'
            }}
          >
            <Plus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Logout Button - Fixed at Bottom */}
      <div style={{
        padding: '0 1.5rem 1.5rem 1.5rem',
        borderTop: `1px solid ${brandColors.neutral[200]}`,
        marginTop: 'auto'
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            marginBottom: '0.5rem',
            backgroundColor: 'transparent',
            color: brandColors.error[600],
            border: `1px solid ${brandColors.error[200]}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.error[50]
            e.currentTarget.style.borderColor = brandColors.error[300]
            e.currentTarget.style.color = brandColors.error[700]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = brandColors.error[200]
            e.currentTarget.style.color = brandColors.error[600]
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  )
}
