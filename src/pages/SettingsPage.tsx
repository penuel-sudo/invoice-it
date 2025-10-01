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
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

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
          padding: window.innerWidth < 768 ? '1rem' : '1rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              fontSize: window.innerWidth < 768 ? '1.25rem' : '1.5rem',
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
          maxWidth: window.innerWidth < 768 ? '600px' : '1000px',
          margin: '0 auto',
          padding: window.innerWidth < 768 ? '1rem' : '2rem'
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
                    padding: window.innerWidth < 768 ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                    backgroundColor: isActive ? brandColors.primary[600] : 'white',
                    color: isActive ? 'white' : brandColors.neutral[700],
                    border: `1px solid ${isActive ? brandColors.primary[600] : brandColors.neutral[200]}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: window.innerWidth < 768 ? '0.8rem' : '0.875rem',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 2px 8px rgba(22, 163, 74, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Icon size={window.innerWidth < 768 ? 16 : 18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Main Content Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: window.innerWidth < 768 ? '16px' : '20px',
            padding: window.innerWidth < 768 ? '1.5rem' : '2rem',
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

                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                    gap: '1.5rem'
                  }}>
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        type="text"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                        placeholder="Enter your company name"
                      />
                    </div>

                    {/* Email (Read Only) - Full Width */}
                    <div className="space-y-2" style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                      />
                    </div>

                    {/* Country & Phone - Full Width */}
                    <div className="space-y-2" style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Label>Country & Phone Number</Label>
                      <CountryPhoneSelector
                        value={{
                          countryCode: profileData.country_code,
                          phoneNumber: profileData.phone
                        }}
                        onChange={handleCountryChange}
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Address - Full Width */}
                    <div className="space-y-2" style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        placeholder="Enter your business address"
                        rows={3}
                      />
                    </div>

                    {/* Save Button - Full Width */}
                    <div style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Profile
                          </>
                        )}
                      </Button>
                    </div>
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
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Select
                        value={profileData.currency_code}
                        onValueChange={(value) => setProfileData({ ...profileData, currency_code: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Button
                      onClick={handleSaveCurrency}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Currency
                        </>
                      )}
                    </Button>
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

                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                    gap: '1.5rem'
                  }}>
                    {/* Bank Name */}
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        type="text"
                        value={paymentDetails.bankName}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                        placeholder="e.g., Chase Bank"
                      />
                    </div>

                    {/* Account Name */}
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        type="text"
                        value={paymentDetails.accountName}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                        placeholder="e.g., Your Business LLC"
                      />
                    </div>

                    {/* Account Number - Full Width */}
                    <div className="space-y-2" style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        type="text"
                        value={paymentDetails.accountNumber}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                        placeholder="e.g., **** **** 1234"
                      />
                    </div>

                    {/* Routing Number */}
                    <div className="space-y-2">
                      <Label htmlFor="routing">Routing Number (Optional)</Label>
                      <Input
                        id="routing"
                        type="text"
                        value={paymentDetails.routingNumber}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, routingNumber: e.target.value })}
                        placeholder="e.g., 123456789"
                      />
                    </div>

                    {/* SWIFT Code */}
                    <div className="space-y-2">
                      <Label htmlFor="swift">SWIFT/BIC Code (Optional)</Label>
                      <Input
                        id="swift"
                        type="text"
                        value={paymentDetails.swiftCode}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, swiftCode: e.target.value })}
                        placeholder="e.g., CHASUS33"
                      />
                    </div>

                    {/* PayPal Email - Full Width */}
                    <div className="space-y-2" style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Label htmlFor="paypal">PayPal Email (Optional)</Label>
                      <Input
                        id="paypal"
                        type="email"
                        value={paymentDetails.paypalEmail}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, paypalEmail: e.target.value })}
                        placeholder="e.g., payments@yourbusiness.com"
                      />
                    </div>

                    {/* Payment Instructions - Full Width */}
                    <div className="space-y-2" style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Label htmlFor="instructions">Payment Instructions (Optional)</Label>
                      <Textarea
                        id="instructions"
                        value={paymentDetails.instructions}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, instructions: e.target.value })}
                        placeholder="e.g., Please reference invoice number in payment description"
                        rows={3}
                      />
                    </div>

                    {/* Save Button - Full Width */}
                    <div style={{ gridColumn: window.innerWidth < 768 ? 'auto' : '1 / -1' }}>
                      <Button
                        onClick={handleSavePaymentDetails}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Payment Details
                          </>
                        )}
                      </Button>
                    </div>
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
    </Layout>
  )
}

