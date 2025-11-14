import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { brandColors } from '../../../stylings'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
import { getCurrencySymbol } from '../../../lib/currencyUtils'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { ProfessionalInvoiceFormData } from './ProfessionalTemplateSave'
import { 
  ArrowLeft, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Building,
  Truck,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
// Reusable button components
import StatusButton from '../../StatusButton'
import SendButton from '../../buttons/SendButton'
import EditButton from '../../buttons/EditButton'
import DownloadButton from '../../buttons/DownloadButton'
import { useLoading } from '../../../contexts/LoadingContext'


export default function ProfessionalInvoicePreviewPage() {
  const { user } = useAuth()
  const { setLoading: setGlobalLoading } = useLoading()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  
  const [invoiceData, setInvoiceData] = useState<ProfessionalInvoiceFormData | null>(null)
  const [dbStatus, setDbStatus] = useState<string>('draft')
  const [loading, setLoading] = useState(false)
  const [isFromDatabase, setIsFromDatabase] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [templateSettings, setTemplateSettings] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileFallback, setProfileFallback] = useState<any>(null)

  // Load template settings
  const loadTemplateSettings = async () => {
    if (!user) return
    
    try {
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      // PRIORITY 1: Load from database for saved invoices (invoice-specific)
      if (invoiceNumber) {
        const { data: invoiceData, error } = await supabase
          .from('invoices')
          .select('template_settings')
          .eq('invoice_number', invoiceNumber)
          .eq('user_id', user.id)
          .single()
          
        if (!error && invoiceData?.template_settings) {
          console.log('✅ [PREVIEW] Loaded template_settings from database for invoice:', invoiceNumber)
          setTemplateSettings(invoiceData.template_settings)
          return
        }
      }
      
      // PRIORITY 2: Only use localStorage for unsaved/draft invoices (no invoice number in URL)
      // This is for invoices that haven't been saved to database yet
      if (!invoiceNumber) {
        const savedCustomizations = localStorage.getItem('professional_template_customizations')
        if (savedCustomizations) {
          console.log('✅ [PREVIEW] Loaded template_settings from localStorage (unsaved invoice)')
          const customizations = JSON.parse(savedCustomizations)
          setTemplateSettings(customizations)
          return
        }
      }
      
      // PRIORITY 3: No settings found - will use defaults in component
      console.log('⚠️ [PREVIEW] No template_settings found, using defaults')
    } catch (error) {
      console.error('Error loading template settings:', error)
    }
  }

  // Load avatar URL from profiles table
  const loadAvatarUrl = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, company_name, tagline, website, tax_id, registration_number')
        .eq('id', user.id)
        .single()
      
      if (data) {
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
        setProfileFallback({
          company_name: data.company_name || '',
          tagline: data.tagline || '',
          website: data.website || '',
          tax_id: data.tax_id || '',
          registration_number: data.registration_number || ''
        })
      }
    } catch (error) {
      console.error('Error loading avatar URL:', error)
    }
  }

  useEffect(() => {
    const loadInvoiceData = async () => {
      // First check URL parameter for invoice number
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      console.log('🔍 ProfessionalPreview: Loading invoice data')
      console.log('  - Invoice number from URL:', invoiceNumber)
      console.log('  - Search params:', Object.fromEntries(searchParams.entries()))
      console.log('  - Location state:', location.state?.invoiceData ? 'exists' : 'none')
      console.log('  - User ID:', user?.id)
      
      if (invoiceNumber) {
        // Always try to load from database if we have invoice number
        setLoading(true)
        setGlobalLoading(true)
        try {
          console.log('  - Querying database for invoice:', invoiceNumber)
          // Load invoice from database using invoice number with proper joins
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
              *,
              clients!invoices_client_id_fkey (
                name,
                email,
                address,
                phone,
                company_name
              ),
              invoice_items!invoice_items_invoice_id_fkey (
                id,
                description,
                quantity,
                unit_price,
                discount,
                tax_rate,
                line_total
              )
            `)
            .eq('invoice_number', invoiceNumber)
            .eq('user_id', user?.id)
            .single()

          console.log('  - Database query result:', invoiceData ? 'FOUND' : 'NOT FOUND')
          console.log('  - Database query error:', invoiceError)

          if (invoiceError) {
            console.log('  ⚠️ Invoice not found in database, checking localStorage and state...')
            
            // Check state data first (from create page navigation)
            if (location.state?.invoiceData && location.state.invoiceData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in state (create → preview flow)')
              // Convert to ProfessionalInvoiceFormData with defaults for missing fields
              const stateData = location.state.invoiceData as any
              const professionalData: ProfessionalInvoiceFormData = {
                ...stateData,
                discountAmount: stateData.discountAmount || 0,
                shippingCost: stateData.shippingCost || 0,
                amountPaid: stateData.amountPaid || 0,
                balanceDue: stateData.balanceDue || 0,
                poNumber: stateData.poNumber || '',
                taxId: stateData.taxId || '',
                shipToName: stateData.shipToName || '',
                shipToAddress: stateData.shipToAddress || '',
                termsAndConditions: stateData.termsAndConditions || '',
                // Convert items to ProfessionalInvoiceItem format
                items: (stateData.items || []).map((item: any) => ({
                  ...item,
                  discount: item.discount || 0
                }))
              }
              setInvoiceData(professionalData)
              setIsFromDatabase(false)
              
              // Load payment methods from state data
              if (stateData.paymentMethods && Array.isArray(stateData.paymentMethods) && stateData.paymentMethods.length > 0) {
                console.log('  ✅ Using payment methods from state:', stateData.paymentMethods.length)
                setPaymentMethods(stateData.paymentMethods)
              } else if (user && stateData.selectedPaymentMethodIds && stateData.selectedPaymentMethodIds.length > 0) {
                // Load payment methods from profiles
                try {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('payment_methods')
                    .eq('id', user.id)
                    .single()

                  if (profileData?.payment_methods) {
                    const allPaymentMethods = profileData.payment_methods || []
                    const selectedIds = stateData.selectedPaymentMethodIds || []
                    const selectedPaymentMethods = allPaymentMethods.filter((method: any) => 
                      selectedIds.includes(method.id)
                    )
                    console.log('  ✅ Loaded payment methods from profiles:', selectedPaymentMethods.length)
                    setPaymentMethods(selectedPaymentMethods)
                  }
                } catch (error) {
                  console.error('Error loading payment methods:', error)
                }
              }
              
              setLoading(false)
              setGlobalLoading(false)
              return
            }
            
            // Check localStorage for this invoice number
            const savedData = invoiceStorage.getDraftProfessional()
            if (savedData && savedData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in localStorage')
              // Convert to ProfessionalInvoiceFormData with defaults for missing fields
              const professionalData: ProfessionalInvoiceFormData = {
                ...savedData,
                discountAmount: (savedData as any).discountAmount || 0,
                shippingCost: (savedData as any).shippingCost || 0,
                amountPaid: (savedData as any).amountPaid || 0,
                balanceDue: (savedData as any).balanceDue || 0,
                poNumber: (savedData as any).poNumber || '',
                taxId: (savedData as any).taxId || '',
                shipToName: (savedData as any).shipToName || '',
                shipToAddress: (savedData as any).shipToAddress || '',
                termsAndConditions: (savedData as any).termsAndConditions || '',
                // Convert items to ProfessionalInvoiceItem format
                items: (savedData.items || []).map((item: any) => ({
                  ...item,
                  discount: item.discount || 0
                }))
              }
              setInvoiceData(professionalData)
              setIsFromDatabase(false)
              setDbStatus('draft')
              
              // Use paymentMethods directly from savedData if available, otherwise load from profiles
              if ((savedData as any).paymentMethods && Array.isArray((savedData as any).paymentMethods) && (savedData as any).paymentMethods.length > 0) {
                console.log('  ✅ Using payment methods from localStorage:', (savedData as any).paymentMethods.length)
                setPaymentMethods((savedData as any).paymentMethods)
              } else if (user && (savedData as any).selectedPaymentMethodIds && Array.isArray((savedData as any).selectedPaymentMethodIds) && (savedData as any).selectedPaymentMethodIds.length > 0) {
                // Load payment methods from profiles if IDs are available
                try {
                  const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('payment_methods')
                    .eq('id', user.id)
                    .single()

                  if (profileData?.payment_methods) {
                    const allPaymentMethods = profileData.payment_methods || []
                    const selectedIds = (savedData as any).selectedPaymentMethodIds || []
                    const selectedPaymentMethods = allPaymentMethods.filter((method: any) => 
                      selectedIds.includes(method.id)
                    )
                    console.log('  ✅ Loaded payment methods from profiles:', selectedPaymentMethods.length)
                    setPaymentMethods(selectedPaymentMethods)
                  }
                } catch (error) {
                  console.error('Error loading payment methods:', error)
                }
              } else {
                console.log('  ⚠️ No payment methods found in localStorage and no selectedPaymentMethodIds')
              }
              
              setLoading(false)
              setGlobalLoading(false)
              return
            }
            
            // If not found anywhere, show error
            console.error('  ❌ Invoice not found anywhere - invoice number:', invoiceNumber)
            console.error('  - Database error:', invoiceError)
            console.error('  - Location state:', location.state?.invoiceData ? 'exists but invoice number mismatch' : 'none')
            console.error('  - localStorage:', invoiceStorage.getDraftProfessional() ? 'exists but invoice number mismatch' : 'none')
            toast.error(`Invoice ${invoiceNumber} not found`)
            navigate('/invoices')
            return
          }

          if (invoiceData) {
            console.log('  ✅ Invoice found in database! Loading data...')
            console.log('  - Invoice ID:', invoiceData.id)
            console.log('  - Invoice Template:', invoiceData.template)
            console.log('  - Invoice Status:', invoiceData.status)
            
            // Convert database data to form data
            const formData: ProfessionalInvoiceFormData = {
              id: invoiceData.id,
              clientId: invoiceData.client_id,
              status: invoiceData.status,
              clientName: invoiceData.clients?.name || '',
              clientEmail: invoiceData.clients?.email || '',
              clientAddress: invoiceData.clients?.address || '',
              clientPhone: invoiceData.clients?.phone || '',
              clientCompanyName: invoiceData.clients?.company_name || '',
              invoiceNumber: invoiceData.invoice_number,
              invoiceDate: invoiceData.issue_date,
              dueDate: invoiceData.due_date,
              poNumber: invoiceData.template_data?.poNumber || '',
              taxId: invoiceData.template_data?.taxId || '',
              shipToName: invoiceData.template_data?.shipTo?.name || '',
              shipToAddress: invoiceData.template_data?.shipTo?.address || '',
              shipToCity: invoiceData.template_data?.shipTo?.city || '',
              shipToState: invoiceData.template_data?.shipTo?.state || '',
              shipToZip: invoiceData.template_data?.shipTo?.zip || '',
              shipToCountry: invoiceData.template_data?.shipTo?.country || '',
              items: invoiceData.invoice_items?.map((item: any) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discount: item.discount || 0,
                taxRate: item.tax_rate || 0,
                lineTotal: item.line_total
              })) || [],
              notes: invoiceData.notes || '',
              termsAndConditions: invoiceData.template_data?.termsAndConditions || '',
              subtotal: invoiceData.subtotal || 0,
              discountAmount: invoiceData.template_data?.discountAmount || 0,
              shippingCost: invoiceData.template_data?.shippingCost || 0,
              taxTotal: invoiceData.tax_amount || 0,
              grandTotal: invoiceData.total_amount || 0,
              amountPaid: invoiceData.template_data?.amountPaid || 0,
              balanceDue: invoiceData.template_data?.balanceDue || invoiceData.total_amount || 0,
              currency: invoiceData.currency_code || 'USD',
              currencySymbol: getCurrencySymbol(invoiceData.currency_code || 'USD'),
              selectedPaymentMethodIds: invoiceData.selected_payment_method_ids || []
            }

            const withTemplate: any = { ...formData, template: 'professional' }
            setInvoiceData(withTemplate)
            setDbStatus(invoiceData.status || 'draft')
            setIsFromDatabase(true)
            console.log('  ✅ Invoice data loaded and set in state')
            
            // Load payment methods from profiles
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('payment_methods')
              .eq('id', user?.id)
              .single()

            if (profileData?.payment_methods) {
              const allPaymentMethods = profileData.payment_methods || []
              const selectedIds = invoiceData.selected_payment_method_ids || []
              const selectedPaymentMethods = allPaymentMethods.filter((method: any) => 
                selectedIds.includes(method.id)
              )
              setPaymentMethods(selectedPaymentMethods)
            }
          }
        } catch (error) {
          console.error('Error loading invoice:', error)
          toast.error('Error loading invoice')
          navigate('/invoices')
        } finally {
          setLoading(false)
          setGlobalLoading(false)
        }
      } else if (location.state?.invoiceData) {
        // From create page (via state, not URL)
        console.log('  📦 Loading invoice from location.state (create → preview flow)')
        const stateData = location.state.invoiceData as any
        setInvoiceData({ ...stateData, template: 'professional' } as any)
        setIsFromDatabase(false)
        setDbStatus('draft') // Default status for new invoices
        
        // Use paymentMethods directly from invoiceData if available, otherwise load from profiles
        if (stateData.paymentMethods && Array.isArray(stateData.paymentMethods) && stateData.paymentMethods.length > 0) {
          console.log('  ✅ Using payment methods from invoiceData:', stateData.paymentMethods.length)
          setPaymentMethods(stateData.paymentMethods)
        } else if (user && stateData.selectedPaymentMethodIds && stateData.selectedPaymentMethodIds.length > 0) {
          // Load payment methods from profiles if IDs are available
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('payment_methods')
              .eq('id', user.id)
              .single()

            if (profileData?.payment_methods) {
              const allPaymentMethods = profileData.payment_methods || []
              const selectedIds = stateData.selectedPaymentMethodIds || []
              const selectedPaymentMethods = allPaymentMethods.filter((method: any) => 
                selectedIds.includes(method.id)
              )
              console.log('  ✅ Loaded payment methods from profiles:', selectedPaymentMethods.length)
              setPaymentMethods(selectedPaymentMethods)
            }
          } catch (error) {
            console.error('Error loading payment methods:', error)
          }
        } else {
          console.log('  ⚠️ No payment methods found in invoiceData and no selectedPaymentMethodIds')
        }
      } else {
        // No invoice number in URL and no state data
        console.error('  ❌ No invoice data found')
        console.error('  - Invoice number from URL: NONE')
        console.error('  - Location state: NONE')
        console.error('  - Current URL:', window.location.href)
        toast.error('No invoice data found. Please select an invoice from the transactions page.')
        navigate('/invoices')
      }
    }

    if (user) {
      loadInvoiceData()
      loadTemplateSettings()
      loadAvatarUrl()
    }
  }, [searchParams, location.state, navigate, user])

  // Listen for status changes and update UI immediately
  useEffect(() => {
    const handleStatusChange = () => {
      // Check if invoice was saved to database
      const savedInvoice = localStorage.getItem('professional_invoice_saved')
      if (savedInvoice) {
        const invoiceData = JSON.parse(savedInvoice)
        if (invoiceData.status && invoiceData.status !== 'draft') {
          setDbStatus(invoiceData.status)
          setIsFromDatabase(true)
          // Clear the saved flag
          localStorage.removeItem('professional_invoice_saved')
        }
      }
    }

    // Listen for custom events
    window.addEventListener('invoiceStatusChanged', handleStatusChange)
    window.addEventListener('invoiceSaved', handleStatusChange)
    
    // Check on mount
    handleStatusChange()

    return () => {
      window.removeEventListener('invoiceStatusChanged', handleStatusChange)
      window.removeEventListener('invoiceSaved', handleStatusChange)
    }
  }, [])

  const handleEdit = () => {
    if (invoiceData) {
      navigate(`/invoice/create/professional?invoice=${invoiceData.invoiceNumber}`, {
        state: { invoiceData }
      })
    }
  }

  if (loading || !invoiceData) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '1rem'
      }}>
        <Loader2 size={32} color={brandColors.primary[600]} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '18px', color: brandColors.neutral[600] }}>
          Loading invoice...
        </div>
      </div>
    )
  }

  const hasShipTo = invoiceData.shipToName || invoiceData.shipToAddress

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: templateSettings?.background_colors?.main_background || brandColors.primary[50],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth < 768 ? '1rem 0.5rem' : '2rem 1rem', // Mobile responsive padding
      overflowX: window.innerWidth < 768 ? 'auto' : 'visible',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${brandColors.primary[100]} 0%, ${brandColors.primary[50]} 100%)`,
        zIndex: 0
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        width: '100%',
        margin: '0 auto',
        padding: '0 1rem' // Mobile padding
      }}>
        {/* Invoice Preview Card */}
        <div style={{
          backgroundColor: templateSettings?.background_colors?.card_background || brandColors.white,
          borderRadius: window.innerWidth < 768 ? '8px' : '12px',
          padding: window.innerWidth < 768 ? '0.75rem' : '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
          position: 'relative',
          width: window.innerWidth < 768 ? '800px' : '100%',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
        
        {/* Header Section - centered title, info left, logo+status right */}
        <div style={{
          marginBottom: '3rem',
          paddingBottom: '2rem',
          borderBottom: `2px solid ${brandColors.neutral[200]}`,
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: templateSettings?.primary_color || brandColors.primary[700],
              margin: 0,
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              {(templateSettings?.company_name || profileFallback?.company_name || 'INVOICE').toString()}
            </h1>
            {(templateSettings?.tagline || profileFallback?.tagline) && (templateSettings?.template_settings?.show_tagline !== false) && (
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                fontSize: '0.9rem', 
                color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600],
                fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
              }}>
                {(templateSettings?.tagline || profileFallback?.tagline) as string}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              {(templateSettings?.website || profileFallback?.website) && (templateSettings?.template_settings?.show_website !== false) && (
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600], 
                  margin: '0 0 0.25rem 0',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  {(templateSettings?.website || profileFallback?.website) as string}
                </p>
              )}
              {(templateSettings?.tax_id || profileFallback?.tax_id) && (templateSettings?.template_settings?.show_tax_id !== false) && (
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600], 
                  margin: '0 0 0.25rem 0',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  Tax ID: {(templateSettings?.tax_id || profileFallback?.tax_id) as string}
                </p>
              )}
              {(templateSettings?.registration_number || profileFallback?.registration_number) && (templateSettings?.template_settings?.show_registration !== false) && (
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600], 
                  margin: 0,
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  Reg: {(templateSettings?.registration_number || profileFallback?.registration_number) as string}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              {avatarUrl && (templateSettings?.template_settings?.show_logo !== false) && (
                <img src={avatarUrl} alt="Company Logo" style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'contain' }} />
              )}
              <StatusButton status={dbStatus} size="sm" />
            </div>
          </div>
        </div>

        {/* Invoice Details Bar */}
        {(() => {
          return (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: templateSettings?.background_colors?.section_background || brandColors.neutral[50],
              borderRadius: '8px',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
          
          <div style={{ minWidth: '120px', flex: '1' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[500],
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              Invoice Number
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              {invoiceData.invoiceNumber}
            </div>
          </div>

          <div style={{ minWidth: '120px', flex: '1' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[500],
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              Issue Date
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              {new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>

          <div style={{ minWidth: '120px', flex: '1' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[500],
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              Due Date
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.error[600],
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              {new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>

          {invoiceData.poNumber && (
            <div style={{ minWidth: '120px', flex: '1' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
              }}>
                PO Number
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
                fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
              }}>
                {invoiceData.poNumber}
              </div>
            </div>
          )}

          {invoiceData.taxId && (
            <div style={{ minWidth: '120px', flex: '1' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
              }}>
                Tax ID / VAT
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
                fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
              }}>
                {invoiceData.taxId}
              </div>
            </div>
          )}
            </div>
          );
        })()}

        {/* Bill To & Ship To */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasShipTo 
            ? (window.innerWidth < 768 ? '1fr' : '1fr 1fr')
            : '1fr',
          gap: window.innerWidth < 768 ? '1rem' : '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Bill To */}
          <div>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              Bill To
            </h3>
            <div style={{
              padding: '1.25rem',
              backgroundColor: templateSettings?.background_colors?.section_background || brandColors.neutral[50],
              borderRadius: '8px',
              border: `1px solid ${brandColors.neutral[200]}`
            }}>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
                marginBottom: '0.75rem',
                fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
              }}>
                {invoiceData.clientName}
              </div>
              {invoiceData.clientCompanyName && (
                <div style={{
                  fontSize: '0.875rem',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  <Building size={14} />
                  {invoiceData.clientCompanyName}
                </div>
              )}
              {invoiceData.clientEmail && (
                <div style={{
                  fontSize: '0.875rem',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  <Mail size={14} />
                  {invoiceData.clientEmail}
                </div>
              )}
              {invoiceData.clientPhone && (
                <div style={{
                  fontSize: '0.875rem',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  <Phone size={14} />
                  {invoiceData.clientPhone}
                </div>
              )}
              {invoiceData.clientAddress && (
                <div style={{
                  fontSize: '0.875rem',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[600],
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{invoiceData.clientAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ship To (if provided) */}
          {hasShipTo && (
            <div>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
              }}>
                Ship To
              </h3>
              <div style={{
                padding: '1.25rem',
                backgroundColor: templateSettings?.background_colors?.section_background || brandColors.primary[50],
                borderRadius: '8px',
                border: `1px solid ${templateSettings?.primary_color || brandColors.primary[200]}`
              }}>
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  <Truck size={18} color={templateSettings?.primary_color || brandColors.primary[600]} />
                  {invoiceData.shipToName}
                </div>
                {invoiceData.shipToAddress && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                    marginBottom: '0.25rem',
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    {invoiceData.shipToAddress}
                  </div>
                )}
                {(invoiceData.shipToCity || invoiceData.shipToState || invoiceData.shipToZip) && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    {[invoiceData.shipToCity, invoiceData.shipToState, invoiceData.shipToZip]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {invoiceData.shipToCountry && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    {invoiceData.shipToCountry}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: '2rem', overflowX: 'auto' }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
          }}>
            Items
          </h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                backgroundColor: templateSettings?.background_colors?.section_background || brandColors.neutral[100],
                borderBottom: `2px solid ${brandColors.neutral[300]}`
              }}>
                <th style={{
                  textAlign: 'left',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  Description
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  Qty
                </th>
                <th style={{
                  textAlign: 'right',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  Unit Price
                </th>
                {invoiceData.items.some(item => item.discount > 0) && (
                  <th style={{
                    textAlign: 'center',
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    Disc %
                  </th>
                )}
                {invoiceData.items.some(item => item.taxRate > 0) && (
                  <th style={{
                    textAlign: 'center',
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    Tax %
                  </th>
                )}
                <th style={{
                  textAlign: 'right',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.filter(item => 
                item.description.trim() !== '' || item.quantity > 0 || item.unitPrice > 0
              ).map((item, index) => (
                <tr key={item.id} style={{
                  borderBottom: `1px solid ${brandColors.neutral[200]}`
                }}>
                  <td style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.875rem',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
                    textAlign: 'left',
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    {item.description}
                  </td>
                  <td style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.875rem',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                    textAlign: 'center',
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.875rem',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                    textAlign: 'right',
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    {invoiceData.currencySymbol}{item.unitPrice.toFixed(2)}
                  </td>
                  {invoiceData.items.some(item => item.discount > 0) && (
                    <td style={{
                      padding: '0.75rem 0.5rem',
                      fontSize: '0.875rem',
                      color: item.discount > 0 ? brandColors.error[600] : brandColors.neutral[400],
                      textAlign: 'center',
                      fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                    }}>
                      {item.discount > 0 ? `${item.discount}%` : '-'}
                    </td>
                  )}
                  {invoiceData.items.some(item => item.taxRate > 0) && (
                    <td style={{
                      padding: '0.75rem 0.5rem',
                      fontSize: '0.875rem',
                      color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
                      textAlign: 'center',
                      fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                    }}>
                      {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                    </td>
                  )}
                  <td style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[900],
                    textAlign: 'right',
                    fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
                  }}>
                    {invoiceData.currencySymbol}{item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '3rem'
        }}>
          <div style={{
            minWidth: '350px',
            backgroundColor: brandColors.neutral[50],
            borderRadius: '8px',
            padding: '1.5rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              fontSize: '0.875rem',
              color: brandColors.neutral[700]
            }}>
              <span>Subtotal:</span>
              <span>{invoiceData.currencySymbol}{invoiceData.subtotal.toFixed(2)}</span>
            </div>

            {invoiceData.discountAmount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                color: brandColors.error[600]
              }}>
                <span>Discount:</span>
                <span>-{invoiceData.currencySymbol}{invoiceData.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {invoiceData.shippingCost > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                color: brandColors.neutral[700]
              }}>
                <span>Shipping:</span>
                <span>{invoiceData.currencySymbol}{invoiceData.shippingCost.toFixed(2)}</span>
              </div>
            )}

            {invoiceData.taxTotal > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                color: brandColors.neutral[700]
              }}>
                <span>Tax:</span>
                <span>{invoiceData.currencySymbol}{invoiceData.taxTotal.toFixed(2)}</span>
              </div>
            )}

            <div style={{
              borderTop: `2px solid ${brandColors.neutral[300]}`,
              paddingTop: '1rem',
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: brandColors.neutral[900]
            }}>
              <span>Total:</span>
              <span>{invoiceData.currencySymbol}{invoiceData.grandTotal.toFixed(2)}</span>
            </div>

            {invoiceData.amountPaid > 0 && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: brandColors.success[600]
                }}>
                  <span>Amount Paid:</span>
                  <span>-{invoiceData.currencySymbol}{invoiceData.amountPaid.toFixed(2)}</span>
                </div>

                <div style={{
                  borderTop: `2px solid ${brandColors.primary[300]}`,
                  paddingTop: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: brandColors.primary[600]
                }}>
                  <span>Balance Due:</span>
                  <span>{invoiceData.currencySymbol}{invoiceData.balanceDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Terms & Information */}
        {(paymentMethods.length > 0 || invoiceData.termsAndConditions) && (
          <div style={{
            backgroundColor: brandColors.neutral[50],
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: brandColors.neutral[700],
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Payment Terms & Information
            </h3>
            
            {invoiceData.termsAndConditions && (
            <div style={{
              marginBottom: '1rem'
            }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line'
                }}>
                  {invoiceData.termsAndConditions}
                </div>
              </div>
            )}
            {/* Payment Methods Grid */}
            {paymentMethods.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 
                ? '1fr' 
                : window.innerWidth < 1024 
                  ? 'repeat(auto-fit, minmax(180px, 1fr))' 
                  : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              {paymentMethods.map((method) => {
                const details = method.details as any
                return (
                  <div key={method.id} style={{
                    backgroundColor: brandColors.white,
                    padding: '1rem',
                    borderRadius: '6px',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: brandColors.neutral[900],
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}>
                      {method.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: brandColors.neutral[600],
                      lineHeight: '1.4'
                    }}>
                      {method.type === 'bank_local_us' && details && (
                        <div>
                          <div>Bank: {details.bankName}</div>
                          <div>Account: {details.accountNumber}</div>
                          {details.accountType && <div>Account Type: {details.accountType}</div>}
                          <div>Routing: {details.routingNumber}</div>
                        </div>
                      )}
                      {method.type === 'bank_local_ng' && details && (
                        <div>
                          <div>Bank: {details.bankName}</div>
                          <div>Account: {details.accountNumber}</div>
                          <div>Bank Code: {details.bankCode}</div>
                        </div>
                      )}
                      {method.type === 'bank_international' && details && (
                        <div>
                          <div>Bank: {details.bankName}</div>
                          <div>SWIFT: {details.swiftCode}</div>
                          <div>IBAN: {details.iban}</div>
                        </div>
                      )}
                      {method.type === 'paypal' && details && (
                        <div>
                          <div>PayPal: {details.email}</div>
                        </div>
                      )}
                      {method.type === 'crypto' && details && (
                        <div>
                          <div>{details.currency || 'Crypto'}: {details.walletAddress}</div>
                          <div>Network: {details.network}</div>
                        </div>
                      )}
                      {method.type === 'other' && details && (
                        <div>{details.instructions}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}

        {/* Notes */}
        {invoiceData.notes && (
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              Notes
            </h3>
            <div style={{
              fontSize: '0.875rem',
              color: templateSettings?.primary_color || templateSettings?.accent_color || brandColors.neutral[700],
              whiteSpace: 'pre-line',
              lineHeight: '1.6',
              fontFamily: templateSettings?.font_family || 'Helvetica, Arial, sans-serif'
            }}>
              {invoiceData.notes}
            </div>
          </div>
        )}

      </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem'
        }}>
          {/* Only show Edit button for CREATE mode (not from database) */}
          {!isFromDatabase && (
          <EditButton 
            onEdit={handleEdit}
            size="md"
            variant="secondary"
          />
          )}
          
          <DownloadButton 
            invoiceData={invoiceData}
            user={user}
            template="professional"
            templateSettings={templateSettings}
            paymentMethods={paymentMethods}
            size="md"
            variant="primary"
          />
          
          <SendButton 
            invoiceData={invoiceData}
            userData={user}
            template="professional"
            templateSettings={templateSettings}
            size="md"
            variant="secondary"
          />
        </div>

      </div>

    </div>
  )
}

