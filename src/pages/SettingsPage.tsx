import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { useGlobalCurrency } from '../hooks/useGlobalCurrency'
import { supabase } from '../lib/supabaseClient'
import { 
  ArrowLeft, 
  User, 
  DollarSign, 
  CreditCard, 
  Bell, 
  Palette, 
  Save, 
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import CountryPhoneSelector from '../components/CountryPhoneSelector'
import PaymentMethodManager from '../components/PaymentMethodManager'
import NotificationSettings from '../components/NotificationSettings'
import AvatarUpload from '../components/AvatarUpload'
import type { PaymentMethod, PaymentMethodType } from '../lib/storage/invoiceStorage'

interface NotificationPreferences {
  enabled: boolean
  push_enabled: boolean
  email_enabled: boolean
  invoice_sent: boolean
  payment_received: boolean
  payment_overdue: boolean
  invoice_created: boolean
  status_changed: boolean
}

interface ProfileData {
  full_name: string
  company_name: string
  email: string
  phone: string
  address: string
  country_code: string
  country_name: string
  phone_prefix: string
  currency_code: string
  payment_methods: PaymentMethod[]
  notification_preferences: NotificationPreferences
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
]


export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'currency' | 'payment' | 'notifications' | 'appearance'>(
    (searchParams.get('tab') as any) || 'profile'
  )
  const { currency, currencySymbol } = useGlobalCurrency()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData | null>(null)

  // Responsive state management
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update URL when tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams)
    if (activeTab === 'profile') {
      newSearchParams.delete('tab')
    } else {
      newSearchParams.set('tab', activeTab)
    }
    setSearchParams(newSearchParams)
  }, [activeTab, searchParams, setSearchParams])

  // Responsive styling constants
  const styles = {
    header: {
      padding: isMobile ? '0.875rem 1rem' : '1rem 2rem',
      fontSize: isMobile ? '1.125rem' : '1.5rem'
    },
    container: {
      maxWidth: '100%',
      padding: isMobile ? '0.875rem' : '2rem'
    },
    card: {
      borderRadius: isMobile ? '12px' : '20px',
      padding: isMobile ? '1.25rem' : '2rem'
    },
    tab: {
      padding: isMobile ? '0.625rem 1rem' : '0.875rem 1.5rem',
      fontSize: isMobile ? '0.75rem' : '0.875rem',
      iconSize: isMobile ? 14 : 18
    },
    input: {
      padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
      fontSize: isMobile ? '0.875rem' : '1rem',
      borderRadius: isMobile ? '8px' : '10px'
    },
    label: {
      fontSize: isMobile ? '0.8125rem' : '0.875rem',
      marginBottom: isMobile ? '0.375rem' : '0.5rem'
    },
    sectionTitle: {
      fontSize: isMobile ? '1rem' : '1.25rem',
      marginBottom: isMobile ? '0.375rem' : '0.5rem'
    },
    description: {
      fontSize: isMobile ? '0.8125rem' : '0.875rem',
      marginBottom: isMobile ? '1.25rem' : '1.5rem'
    },
    button: {
      padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
      fontSize: isMobile ? '0.875rem' : '1rem'
    },
    grid: {
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '1.125rem' : '1.5rem'
    }
  }

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    country_code: '',
    country_name: '',
    phone_prefix: '',
    currency_code: 'USD',
    payment_methods: [],
    notification_preferences: {
      enabled: true,
      push_enabled: true,
      email_enabled: true,
      invoice_sent: true,
      payment_received: true,
      payment_overdue: true,
      invoice_created: true,
      status_changed: true
    }
  })


  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user])


  const loadProfileData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load settings')
        return
      }

      if (data) {
        const profileData = {
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          country_code: data.country_code || '',
          country_name: data.country_name || '',
          phone_prefix: data.phone_prefix || '',
          currency_code: data.currency_code || 'USD',
          payment_methods: data.payment_methods || [],
          notification_preferences: data.notification_preferences || {
            enabled: true,
            push_enabled: true,
            email_enabled: true,
            invoice_sent: true,
            payment_received: true,
            payment_overdue: true,
            invoice_created: true,
            status_changed: true
          }
        }
        setProfileData(profileData)
        setOriginalProfileData(profileData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          company_name: profileData.company_name,
          phone: profileData.phone,
          address: profileData.address,
          country_code: profileData.country_code,
          country_name: profileData.country_name,
          phone_prefix: profileData.phone_prefix,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving profile:', error)
        toast.error('Failed to save profile')
        return
      }

      toast.success('Profile updated successfully!')
      setHasChanges(false)
      // Update original data to reflect saved state
      setOriginalProfileData(profileData)
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCurrency = async () => {
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          currency_code: profileData.currency_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving currency:', error)
        toast.error('Failed to save currency')
        return
      }

      toast.success('Currency updated successfully!')
    } catch (error) {
      console.error('Error saving currency:', error)
      toast.error('Failed to save currency')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPaymentMethod = (method: PaymentMethod) => {
    const updatedMethods = [...profileData.payment_methods, method]
    setProfileData(prev => ({ ...prev, payment_methods: updatedMethods }))
    savePaymentMethodsToDb(updatedMethods)
  }

  const handleDeletePaymentMethod = async (methodId: string) => {
    const updatedMethods = profileData.payment_methods.filter(m => m.id !== methodId)
    setProfileData(prev => ({ ...prev, payment_methods: updatedMethods }))
    await savePaymentMethodsToDb(updatedMethods)
  }

  const handleSetDefaultMethod = async (methodId: string) => {
    const updatedMethods = profileData.payment_methods.map(m => ({
      ...m,
      isDefault: m.id === methodId
    }))
    setProfileData(prev => ({ ...prev, payment_methods: updatedMethods }))
    await savePaymentMethodsToDb(updatedMethods)
  }

  const savePaymentMethodsToDb = async (methods: PaymentMethod[]) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_methods: methods })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving payment methods:', error)
        toast.error('Failed to save payment methods')
      }
    } catch (error) {
      console.error('Error saving payment methods:', error)
      toast.error('Failed to save payment methods')
    }
  }

  const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving notification preferences:', error)
        toast.error('Failed to save notification preferences')
        return
      }

      toast.success('Notification preferences saved')
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      toast.error('Failed to save notification preferences')
    }
  }

  const handleCountryChange = (value: {
    countryCode: string
    phoneNumber: string
    isValid: boolean
    countryName?: string
    phonePrefix?: string
    languageCode?: string
    currencyCode?: string
    timezone?: string
  }) => {
    setProfileData(prev => ({
      ...prev,
      country_code: value.countryCode,
      country_name: value.countryName || '',
      phone_prefix: value.phonePrefix || '',
      phone: value.phoneNumber,
      language_code: value.languageCode || '',
      timezone: value.timezone || ''
    }))
    setHasChanges(true)
  }

  // Check for changes whenever profileData changes
  useEffect(() => {
    if (originalProfileData) {
      const hasChanges = JSON.stringify(profileData) !== JSON.stringify(originalProfileData)
      setHasChanges(hasChanges)
    }
  }, [profileData, originalProfileData])



  if (!user || loading) {
    return (
      <Layout hideBottomNav={true}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <Loader2 size={32} className="animate-spin" color={brandColors.primary[600]} />
        </div>
      </Layout>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'currency', label: 'Currency', icon: DollarSign },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ]

  return (
    <Layout hideBottomNav={true}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: brandColors.neutral[50],
        paddingBottom: '2rem'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          padding: isMobile ? '1rem' : '1rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '100%',
            margin: '0 auto'
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.5rem',
                backgroundColor: brandColors.neutral[100],
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={20} color={brandColors.neutral[600]} />
            </button>
            <h1 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: 0,
              textAlign: 'center',
              flex: 1
            }}>
              Settings
            </h1>
            <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: isMobile ? '1rem' : '2rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Tab Navigation - Horizontal Scroll on Mobile */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE/Edge
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                    backgroundColor: isActive ? brandColors.primary[600] : 'white',
                    color: isActive ? 'white' : brandColors.neutral[700],
                    border: `1px solid ${isActive ? brandColors.primary[600] : brandColors.neutral[200]}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 2px 8px rgba(22, 163, 74, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Icon size={isMobile ? 16 : 18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Main Content Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '1.5rem'
                  }}>
                    Profile Information
                  </h2>

                  {/* Profile Picture Section */}
                  <div style={{
                    marginBottom: '2rem',
                    padding: isMobile ? '1.5rem' : '2rem',
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '12px',
                    border: `1px solid ${brandColors.neutral[200]}`
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'center' : 'flex-start',
                      gap: isMobile ? '1rem' : '1.5rem',
                      textAlign: isMobile ? 'center' : 'left'
                    }}>
                      {/* Avatar Upload Component */}
                      <AvatarUpload 
                        size="xl"
                        showHoverEffect={true}
                        style={{
                          width: isMobile ? '100px' : '150px',
                          height: isMobile ? '100px' : '150px',
                          border: `3px solid ${brandColors.white}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          flexShrink: 0
                        }}
                      />
                      
                      {/* Profile Info */}
                      <div style={{
                        flex: 1,
                        minWidth: 0,
                        width: isMobile ? '100%' : 'auto'
                      }}>
                        <h3 style={{
                          fontSize: isMobile ? '1.125rem' : '1.5rem',
                          fontWeight: '600',
                          color: brandColors.neutral[900],
                          lineHeight: '1.4',
                          margin: '0 0 0.5rem 0',
                          whiteSpace: isMobile ? 'normal' : 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                        </h3>
                        <p style={{
                          fontSize: isMobile ? '0.875rem' : '1.125rem',
                          color: brandColors.neutral[500],
                          lineHeight: '1.2',
                          margin: '0 0 0.75rem 0',
                          whiteSpace: isMobile ? 'normal' : 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {user?.email}
                        </p>
                        <p style={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: brandColors.neutral[400],
                          margin: 0,
                          lineHeight: '1.4'
                        }}>
                          Your profile picture will be used as your logo on invoices
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                  }}>
                    {/* Full Name */}
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
                        onChange={(e) => {
                          setProfileData({ ...profileData, full_name: e.target.value })
                          setHasChanges(true)
                        }}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Company Name */}
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
                        onChange={(e) => {
                          setProfileData({ ...profileData, company_name: e.target.value })
                          setHasChanges(true)
                        }}
                        placeholder="Enter your company name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Email (Read Only) */}
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
                        value={profileData.email}
                        disabled
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          backgroundColor: brandColors.neutral[50],
                          cursor: 'not-allowed',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Country & Phone */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Country & Phone Number
                      </label>
                      <CountryPhoneSelector
                        value={{
                          countryCode: profileData.country_code,
                          phoneNumber: profileData.phone
                        }}
                        onChange={handleCountryChange}
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Address
                      </label>
                      <textarea
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        placeholder="Enter your business address"
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving || !hasChanges}
                      style={{
                        padding: '0.875rem 1.5rem',
                        backgroundColor: hasChanges ? brandColors.primary[600] : brandColors.neutral[300],
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: (saving || !hasChanges) ? 0.6 : 1
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Currency Tab */}
              {activeTab === 'currency' && (
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '0.5rem'
                  }}>
                    Currency Settings
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    marginBottom: '2rem'
                  }}>
                    Set your default currency. You can override this for individual invoices.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Currency Selector */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Default Currency
                      </label>
                      <select
                        value={profileData.currency_code}
                        onChange={(e) => setProfileData({ ...profileData, currency_code: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preview */}
                    <div style={{
                      padding: '1rem',
                      backgroundColor: brandColors.primary[50],
                      borderRadius: '8px',
                      border: `1px solid ${brandColors.primary[200]}`
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Preview
                      </p>
                      <p style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: brandColors.primary[600],
                        margin: 0
                      }}>
                        {CURRENCIES.find(c => c.code === profileData.currency_code)?.symbol}1,234.56
                      </p>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveCurrency}
                      disabled={saving}
                      style={{
                        padding: '0.875rem 1.5rem',
                        backgroundColor: brandColors.primary[600],
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: saving ? 0.6 : 1,
                        width: '100%'
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Currency
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Methods Tab */}
              {activeTab === 'payment' && (
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '0.5rem'
                  }}>
                    Payment Methods
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    marginBottom: '2rem'
                  }}>
                    Add payment methods that will appear on your invoices. Clients can use any of these methods to pay you.
                  </p>

                  <PaymentMethodManager
                    paymentMethods={profileData.payment_methods}
                    onAdd={handleAddPaymentMethod}
                    onDelete={handleDeletePaymentMethod}
                    onSetDefault={handleSetDefaultMethod}
                    onUpdate={(method) => {
                      const updated = profileData.payment_methods.map(m => m.id === method.id ? method : m)
                      setProfileData(prev => ({ ...prev, payment_methods: updated }))
                      savePaymentMethodsToDb(updated)
                    }}
                  />
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <NotificationSettings
                  preferences={profileData.notification_preferences}
                  onChange={(newPrefs) => {
                    setProfileData(prev => ({ ...prev, notification_preferences: newPrefs }))
                    saveNotificationPreferences(newPrefs)
                  }}
                />
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '0.5rem'
                  }}>
                    Appearance Settings
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    marginBottom: '2rem'
                  }}>
                    Coming soon! Customize the look and feel of your dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
      </div>
    </Layout>
  )
}

