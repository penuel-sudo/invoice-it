import { Home, FileText, Plus, DollarSign, Users, Layout } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { brandColors, typographyPresets } from '../../stylings'
import ProfileDropdown from '../ProfileDropdown'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'invoices', label: 'Transactions', icon: FileText, path: '/invoices' },
  { id: 'templates', label: 'Templates', icon: Layout, path: '/templates' },
  { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
  { id: 'expenses', label: 'Expenses', icon: DollarSign, path: '/expense/new' }
]

interface SidebarProps {
  onSettingsOpen?: () => void
}

export default function Sidebar({ onSettingsOpen }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
    navigate(path)
  }//i

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: '280px',
      backgroundColor: brandColors.white,
      borderRight: `1px solid ${brandColors.neutral[200]}`,
      padding: '1rem 0.5rem 0.5rem 0.5rem',
      zIndex: 40,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo & App Name */}
      <div 
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = brandColors.neutral[50]
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <img 
          src="/logo.svg" 
          alt="invoice-it logo"
          style={{
            width: '36px',
            height: '36px',
            objectFit: 'contain'
          }}
        />
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          color: brandColors.neutral[900],
          letterSpacing: '-0.02em'
        }}>
          invoice-it
        </span>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Navigation Items */}
        <nav style={{ padding: '0 0.5rem' }}>
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
        <div style={{ padding: '1rem 0.5rem' }}>
          <button
            onClick={() => navigate('/invoice/create/default')}
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

      {/* Profile Dropdown - Fixed at Bottom */}
      <div style={{
        padding: '0.1rem 0.5rem 0.1rem 0.5rem',
        borderTop: `1px solid ${brandColors.neutral[200]}`,
        marginTop: 'auto'
      }}>
        <ProfileDropdown variant="sidebar" showPlan={true} onSettingsOpen={onSettingsOpen} />
      </div>
    </aside>
  )
}
