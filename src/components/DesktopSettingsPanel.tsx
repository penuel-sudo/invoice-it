import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { 
  User, 
  LogOut, 
  Bell, 
  Shield, 
  HelpCircle, 
  X,
  ChevronRight,
  Download,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DesktopSettingsPanelProps {
  isVisible: boolean
  onClose: () => void
  onNotificationClick: () => void
}

export default function DesktopSettingsPanel({ 
  isVisible, 
  onClose, 
  onNotificationClick 
}: DesktopSettingsPanelProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully!')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const handleInstallApp = () => {
    // Check if PWA can be installed
    if ('serviceWorker' in navigator) {
      // Trigger the install prompt
      const event = new CustomEvent('trigger-install-prompt')
      window.dispatchEvent(event)
      toast.success('Install prompt triggered!')
    } else {
      toast.error('App installation not supported on this device')
    }
  }

  const settingsItems = [
    {
      id: 'profile',
      icon: User,
      title: 'Profile',
      subtitle: 'Manage your profile and business information',
      action: () => {
        navigate('/profile')
        onClose()
      }
    },
    {
      id: 'billing',
      icon: CreditCard,
      title: 'Billing & Plans',
      subtitle: 'Manage your subscription and billing',
      action: () => toast('Billing settings coming soon!', { icon: '💳' })
    },
    {
      id: 'install',
      icon: Download,
      title: 'Install App',
      subtitle: 'Install Invoice-It for quick access',
      action: () => {
        handleInstallApp()
        onClose()
      }
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      action: () => {
        onNotificationClick()
        onClose()
      }
    },
    {
      id: 'privacy',
      icon: Shield,
      title: 'Privacy & Security',
      subtitle: 'Control your privacy settings',
      action: () => toast('Privacy settings coming soon!', { icon: '🔒' })
    },
    {
      id: 'help',
      icon: HelpCircle,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      action: () => toast('Help center coming soon!', { icon: '❓' })
    }
  ]

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: brandColors.white,
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: brandColors.neutral[900],
            margin: 0
          }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: brandColors.neutral[100],
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.neutral[200]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.neutral[100]
            }}
          >
            <X size={20} color={brandColors.neutral[600]} />
          </button>
        </div>

        {/* Settings Items */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {settingsItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.5rem',
                  backgroundColor: brandColors.neutral[50],
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.primary[50]
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px 0 rgb(0 0 0 / 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: brandColors.primary[100],
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={24} color={brandColors.primary[600]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    margin: '0 0 0.25rem 0'
                  }}>
                    {item.title}
                  </h4>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[500],
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight size={16} color={brandColors.neutral[400]} style={{ marginTop: '4px' }} />
              </button>
            )
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: brandColors.error[50],
            color: brandColors.error[600],
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.error[100]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.error[50]
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
