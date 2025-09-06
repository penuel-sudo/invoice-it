import { useState, useRef } from 'react'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { 
  User, 
  Camera, 
  LogOut, 
  Bell, 
  Shield, 
  HelpCircle, 
  X,
  ChevronRight,
  Upload,
  Trash2
} from 'lucide-react'
import { uploadProfilePicture, deleteProfilePicture, getUserDisplayName, getUserInitial } from '../lib/profilePicture'
import toast from 'react-hot-toast'

interface SettingsPanelProps {
  isVisible: boolean
  onClose: () => void
  onNotificationClick: () => void
}

export default function SettingsPanel({ isVisible, onClose, onNotificationClick }: SettingsPanelProps) {
  const { user, signOut } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      const result = await uploadProfilePicture({ file, userId: user.id })
      
      if (result.success) {
        toast.success('Profile picture updated successfully!')
        // Refresh the page to show new image
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to upload image')
      }
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteProfilePicture = async () => {
    if (!user) return

    try {
      const result = await deleteProfilePicture(user.id)
      
      if (result.success) {
        toast.success('Profile picture removed successfully!')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to remove image')
      }
    } catch (error) {
      toast.error('Failed to remove image')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully!')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const settingsItems = [
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

  return (
    <div
        style={{
          position: 'fixed',
          bottom: isVisible ? '80px' : '-100vh',
          left: 0,
          right: 0,
          backgroundColor: brandColors.white,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 45,
          transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
      >
      {/* Top Border Line */}
      <div style={{
        width: '40px',
        height: '4px',
        backgroundColor: brandColors.neutral[900],
        borderRadius: '2px',
        margin: '0 auto 1.5rem auto'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
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
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} color={brandColors.neutral[500]} />
        </button>
      </div>

      {/* Profile Section */}
      <div style={{
        backgroundColor: brandColors.neutral[50],
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            position: 'relative',
            width: '60px',
            height: '60px',
            borderRadius: '25px',
            backgroundColor: brandColors.primary[200],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: brandColors.primary[800],
            border: `3px solid ${brandColors.white}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            {getUserInitial(user)}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 0.25rem 0'
            }}>
              {getUserDisplayName(user)}
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: brandColors.neutral[500],
              margin: 0
            }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Profile Picture Actions */}
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={16} />
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </button>
          
          <button
            onClick={handleDeleteProfilePicture}
            style={{
              padding: '0.75rem',
              backgroundColor: brandColors.error[100],
              color: brandColors.error[600],
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleProfilePictureUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Settings Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {settingsItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={item.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.neutral[50]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: brandColors.primary[100],
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} color={brandColors.primary[600]} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.125rem 0'
                }}>
                  {item.title}
                </h4>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[500],
                  margin: 0
                }}>
                  {item.subtitle}
                </p>
              </div>
              <ChevronRight size={16} color={brandColors.neutral[400]} />
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
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginTop: '1rem',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = brandColors.error[100]
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = brandColors.error[50]
        }}
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  )
}
