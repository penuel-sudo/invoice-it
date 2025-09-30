import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
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
  default_payment_details: PaymentDetails | null
}

interface PaymentDetails {
  bankName?: string
  accountNumber?: string
  accountName?: string
  routingNumber?: string
  swiftCode?: string
  paypalEmail?: string
  instructions?: string
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'currency' | 'payment' | 'notifications' | 'appearance'>('profile')

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
    default_payment_details: null
  })

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    routingNumber: '',
    swiftCode: '',
    paypalEmail: '',
    instructions: ''
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
        setProfileData({
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          country_code: data.country_code || '',
          country_name: data.country_name || '',
          phone_prefix: data.phone_prefix || '',
          currency_code: data.currency_code || 'USD',
          default_payment_details: data.default_payment_details || null
        })

        // Load payment details if exists
        if (data.default_payment_details) {
          setPaymentDetails(data.default_payment_details)
        }
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

  const handleSavePaymentDetails = async () => {
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          default_payment_details: paymentDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving payment details:', error)
        toast.error('Failed to save payment details')
        return
      }

      toast.success('Payment details updated successfully!')
    } catch (error) {
      console.error('Error saving payment details:', error)
      toast.error('Failed to save payment details')
    } finally {
      setSaving(false)
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
  }

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
          padding: '1rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '1200px',
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
              fontSize: '1.5rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: 0
            }}>
              Settings
            </h1>
          </div>
        </div>

        {/* Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
          display: 'flex',
          gap: '2rem'
        }}>
          {/* Sidebar Tabs */}
          <div style={{
            width: '250px',
            flexShrink: 0
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      backgroundColor: isActive ? brandColors.primary[50] : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.25rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon 
                      size={20} 
                      color={isActive ? brandColors.primary[600] : brandColors.neutral[600]} 
                    />
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? brandColors.primary[600] : brandColors.neutral[700]
                    }}>
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem'
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
                        onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                        placeholder="Enter your company name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem'
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
                          cursor: 'not-allowed'
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
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveProfile}
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
                        opacity: saving ? 0.6 : 1
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
                        opacity: saving ? 0.6 : 1
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

              {/* Payment Details Tab */}
              {activeTab === 'payment' && (
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '0.5rem'
                  }}>
                    Payment Details
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    marginBottom: '2rem'
                  }}>
                    Set default payment information that will appear on your invoices. You can customize this per invoice.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Bank Name */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.bankName}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                        placeholder="e.g., Chase Bank"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    {/* Account Name */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.accountName}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                        placeholder="e.g., Your Business LLC"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    {/* Account Number */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.accountNumber}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                        placeholder="e.g., **** **** 1234"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Routing Number */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: brandColors.neutral[700],
                          marginBottom: '0.5rem'
                        }}>
                          Routing Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.routingNumber}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, routingNumber: e.target.value })}
                          placeholder="e.g., 123456789"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: `1px solid ${brandColors.neutral[300]}`,
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>

                      {/* SWIFT Code */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: brandColors.neutral[700],
                          marginBottom: '0.5rem'
                        }}>
                          SWIFT/BIC Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.swiftCode}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, swiftCode: e.target.value })}
                          placeholder="e.g., CHASUS33"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: `1px solid ${brandColors.neutral[300]}`,
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </div>

                    {/* PayPal Email */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        PayPal Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={paymentDetails.paypalEmail}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, paypalEmail: e.target.value })}
                        placeholder="e.g., payments@yourbusiness.com"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    {/* Payment Instructions */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        marginBottom: '0.5rem'
                      }}>
                        Payment Instructions (Optional)
                      </label>
                      <textarea
                        value={paymentDetails.instructions}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, instructions: e.target.value })}
                        placeholder="e.g., Please reference invoice number in payment description"
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSavePaymentDetails}
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
                        opacity: saving ? 0.6 : 1
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
                          Save Payment Details
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '0.5rem'
                  }}>
                    Notification Settings
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    marginBottom: '2rem'
                  }}>
                    Coming soon! Manage your notification preferences.
                  </p>
                </div>
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
      </div>
    </Layout>
  )
}

