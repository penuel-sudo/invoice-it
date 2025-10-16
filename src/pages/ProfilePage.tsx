import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { 
  ArrowLeft, 
  User, 
  Save,
  Building
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import AvatarDisplay from '../components/AvatarDisplay'
import toast from 'react-hot-toast'

interface ProfileData {
  full_name: string
  company_name: string
  phone: string
  address: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    company_name: '',
    phone: '',
    address: ''
  })

  // Load profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      if (user) {
        try {
          // Load profile data from database
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, company_name, phone, address')
            .eq('id', user.id)
            .single()

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error loading profile:', error)
          } else if (profile) {
            setProfileData({
              full_name: profile.full_name || '',
              company_name: profile.company_name || '',
              phone: profile.phone || '',
              address: profile.address || ''
            })
          }
        } catch (error) {
          console.error('Error loading profile data:', error)
        }
      }
    }

    loadProfileData()
  }, [user])


  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          company_name: profileData.company_name,
          phone: profileData.phone,
          address: profileData.address,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving profile:', error)
        toast.error('Failed to save profile')
      } else {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) { return null }

  return (
    <Layout>
      <div style={{
        paddingBottom: '2rem',
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/dashboard')}
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
              <ArrowLeft size={20} color={brandColors.neutral[600]} />
            </button>
            <h1 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: 0
            }}>
              Profile
            </h1>
          </div>
          
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isSaving ? 0.6 : 1
            }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Profile Content */}
        <div style={{ padding: '1rem' }}>
          {/* Profile Picture Section */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <User size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Profile Picture
              </h2>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <AvatarDisplay 
                size="lg"
                showBorder={true}
                  style={{
                    border: `3px solid ${brandColors.white}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
              />
              
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.25rem 0'
                }}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[500],
                  margin: 0
                }}>
                  {user.email}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: brandColors.neutral[600],
              margin: 0,
              lineHeight: '1.5'
            }}>
              Your current profile picture
            </p>
          </div>

          {/* Personal Information Section */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <User size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Personal Information
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.neutral[50],
                    color: brandColors.neutral[500]
                  }}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[400],
                  margin: '0.25rem 0 0 0'
                }}>
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Building size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Business Information
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={profileData.company_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Enter your company name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Business Address
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your business address"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900],
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div style={{
            backgroundColor: brandColors.primary[50],
            borderRadius: '12px',
            padding: '1rem',
            border: `1px solid ${brandColors.primary[200]}`
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: brandColors.primary[700],
              margin: 0,
              lineHeight: '1.5'
            }}>
              💡 <strong>Tip:</strong> Your business information will appear on invoices you create. Make sure to keep it up to date!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
