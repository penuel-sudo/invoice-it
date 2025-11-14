import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { brandColors } from '../../../stylings'
import { Layout } from '../../layout'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
import { CURRENCIES, getCurrencySymbol } from '../../../lib/currencyUtils'
import { useInvoiceCurrency } from '../../../hooks/useInvoiceCurrency'
import ClientDropdown from '../../ClientDropdown'
import type { Client } from '../../ClientDropdown'
import type { PaymentMethod } from '../../../lib/storage/invoiceStorage'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import { saveProfessionalInvoice } from './ProfessionalTemplateSave'
import type { ProfessionalInvoiceFormData, ProfessionalInvoiceItem } from './ProfessionalTemplateSave'
import FormattedNumberInput from '../../FormattedNumberInput'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2,
  Calendar,
  User,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  CreditCard,
  Building,
  Hash,
  Settings,
  Truck,
  Percent
} from 'lucide-react'
import toast from 'react-hot-toast'
import CustomizationPanel from '../../CustomizationPanel'

const PAYMENT_METHOD_TYPES = [
  { value: 'bank_local_us', label: 'Bank Transfer (US)' },
  { value: 'bank_local_ng', label: 'Bank Transfer (Nigeria)' },
  { value: 'bank_international', label: 'International Wire' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
]

export default function ProfessionalInvoiceCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Generate default invoice number
  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    return `INV-${timestamp}`
  }

  // Format currency with commas
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Initialize form data with localStorage like Default template
  const [formData, setFormData] = useState<ProfessionalInvoiceFormData>(() => {
    // Start with template-specific localStorage data
    const savedData = invoiceStorage.getDraftProfessional()
    if (savedData) {
      // Convert to ProfessionalInvoiceFormData with defaults for missing fields
      return {
        ...savedData,
        discountAmount: (savedData as any).discountAmount || 0,
        shippingCost: (savedData as any).shippingCost || 0,
        amountPaid: (savedData as any).amountPaid || 0,
        balanceDue: (savedData as any).balanceDue || 0,
        poNumber: (savedData as any).poNumber || '',
        taxId: (savedData as any).taxId || '',
        shipToName: (savedData as any).shipToName || '',
        shipToAddress: (savedData as any).shipToAddress || '',
        shipToCity: (savedData as any).shipToCity || '',
        shipToState: (savedData as any).shipToState || '',
        shipToZip: (savedData as any).shipToZip || '',
        shipToCountry: (savedData as any).shipToCountry || '',
        termsAndConditions: (savedData as any).termsAndConditions || '',
        items: (savedData.items || []).map((item: any) => ({
          ...item,
          discount: item.discount || 0
        }))
      }
    }
    
    // Default values if no saved data
    return {
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      clientPhone: '',
      clientCompanyName: '',
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      poNumber: '',
      taxId: '',
      shipToName: '',
      shipToAddress: '',
      shipToCity: '',
      shipToState: '',
      shipToZip: '',
      shipToCountry: '',
      items: [{
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0,
        lineTotal: 0
      }],
      notes: '',
      termsAndConditions: '',
      subtotal: 0,
      discountAmount: 0,
      shippingCost: 0,
      taxTotal: 0,
      grandTotal: 0,
      amountPaid: 0,
      balanceDue: 0,
      currency: 'USD',
      currencySymbol: '$',
      selectedPaymentMethodIds: []
    }
  })

  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { currency: globalCurrency, currencySymbol: globalCurrencySymbol, setCurrency } = useInvoiceCurrency(formData.currency)
  const itemsContainerRef = useRef<HTMLDivElement>(null)
  const lastItemRef = useRef<HTMLTableRowElement>(null)
  
  const [userDefaults, setUserDefaults] = useState<{ 
    paymentMethods: PaymentMethod[]
  }>({
    paymentMethods: []
  })

  const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>([])
  
  // Customization panel state
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false)
  const [customizationData, setCustomizationData] = useState<any>({})
  const [templateSettings, setTemplateSettings] = useState<any>(null)
  
  // Load template settings
  const loadTemplateSettings = async () => {
    if (!user) return
    
    try {
      // First try to load from localStorage for unsaved invoices
      const savedCustomizations = localStorage.getItem('professional_template_customizations')
      if (savedCustomizations) {
        const customizations = JSON.parse(savedCustomizations)
        setTemplateSettings(customizations)
        setCustomizationData(customizations)
        return
      }

      // If no localStorage, try to load from database
      const { data, error } = await supabase
        .from('invoices')
        .select('template_settings')
        .eq('user_id', user.id)
        .eq('template', 'professional')
        .not('template_settings', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (data?.template_settings) {
        setTemplateSettings(data.template_settings)
        setCustomizationData(data.template_settings)
      }
    } catch (error) {
      console.error('Error loading template settings:', error)
    }
  }
  
  // Load template settings on component mount
  useEffect(() => {
    loadTemplateSettings()
  }, [user])
  
  // Load invoice data from URL parameter or state
  useEffect(() => {
    const loadInvoiceData = async () => {
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      if (invoiceNumber) {
        // Only show loading if we don't already have the data
        if (formData.invoiceNumber !== invoiceNumber) {
          setLoading(true)
        }
        try {
          // Load invoice from database using invoice number (same as DefaultCreate)
          const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('invoice_number', invoiceNumber)
            .eq('user_id', user?.id)
            .single()

          if (error) {
            console.error('Error loading invoice from database:', error)
            console.log('Invoice not found in database, checking localStorage and state...')
            
            // Check localStorage for this invoice number (same as DefaultCreate)
            const savedData = invoiceStorage.getDraftProfessional()
            if (savedData && savedData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in localStorage')
              setFormData(savedData)
              setLoading(false)
              return
            }
            
            // Check state data (same as DefaultCreate)
            if (location.state?.invoiceData && location.state.invoiceData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in state')
              setFormData(location.state.invoiceData)
              setLoading(false)
              return
            }
            
            // If not found anywhere, redirect to new invoice (same as DefaultCreate)
            console.log('Invoice not found anywhere, creating new invoice')
            navigate('/invoice/create/professional')
            return
          }

          if (data) {
            // Load invoice items
            const { data: itemsData } = await supabase
              .from('invoice_items')
              .select('*')
              .eq('invoice_id', data.id)

            // Convert database data to form data
            const invoiceFormData: ProfessionalInvoiceFormData = {
              id: data.id,
              clientId: data.client_id,
              clientName: data.client_name || '',
              clientEmail: data.client_email || '',
              clientAddress: data.client_address || '',
              clientPhone: data.client_phone || '',
              clientCompanyName: data.client_company_name || '',
              invoiceNumber: data.invoice_number,
              invoiceDate: data.issue_date,
              dueDate: data.due_date,
              poNumber: data.template_data?.poNumber || '',
              taxId: data.template_data?.taxId || '',
              shipToName: data.template_data?.shipTo?.name || '',
              shipToAddress: data.template_data?.shipTo?.address || '',
              shipToCity: data.template_data?.shipTo?.city || '',
              shipToState: data.template_data?.shipTo?.state || '',
              shipToZip: data.template_data?.shipTo?.zip || '',
              shipToCountry: data.template_data?.shipTo?.country || '',
              items: itemsData?.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discount: item.discount || 0,
                taxRate: item.tax_rate || 0,
                lineTotal: item.line_total
              })) || [],
              notes: data.notes || '',
              termsAndConditions: data.template_data?.termsAndConditions || '',
              subtotal: data.subtotal || 0,
              discountAmount: data.template_data?.discountAmount || 0,
              shippingCost: data.template_data?.shippingCost || 0,
              taxTotal: data.tax_amount || 0,
              grandTotal: data.total_amount || 0,
              amountPaid: data.template_data?.amountPaid || 0,
              balanceDue: data.template_data?.balanceDue || data.total_amount || 0,
              currency: data.currency_code || 'USD',
              currencySymbol: getCurrencySymbol(data.currency_code || 'USD'),
              selectedPaymentMethodIds: data.selected_payment_method_ids || []
            }
            setFormData(invoiceFormData)
          }
        } catch (error) {
          console.error('Error loading invoice:', error)
          toast.error('Error loading invoice')
          navigate('/invoices')
        } finally {
          setLoading(false)
        }
      } else if (location.state?.invoiceData) {
        setFormData(location.state.invoiceData)
      }
    }

    if (user) {
      loadInvoiceData()
    }
  }, [searchParams, location.state, navigate, user])

  // Load user's default currency and payment details
  useEffect(() => {
    const loadUserDefaults = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('currency_code, payment_methods')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error loading user defaults:', error)
          return
        }

        if (data) {
          const currencyCode = data.currency_code || 'USD'
          const currencySymbol = getCurrencySymbol(currencyCode)
          const paymentMethods = data.payment_methods || []
          
          setUserDefaults({
            paymentMethods: paymentMethods
          })

          setAllPaymentMethods(paymentMethods)

          if (!formData.currency) {
            setFormData(prev => ({
              ...prev,
              currency: currencyCode,
              currencySymbol: currencySymbol,
              paymentMethods: paymentMethods,
              selectedPaymentMethodIds: paymentMethods.map((m: PaymentMethod) => m.id)
            }))
          }
        }
      } catch (error) {
        console.error('Error loading user defaults:', error)
      }
    }

    loadUserDefaults()
  }, [user])

  // Number formatting helpers
  const formatNumberForDisplay = (value: number): string => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatNumberWhileTyping = (value: string): string => {
    const numValue = parseFloat(value.replace(/,/g, ''))
    if (isNaN(numValue)) return ''
    return numValue.toLocaleString('en-US')
  }

  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // Calculate totals
  const calculateTotals = (items: ProfessionalInvoiceItem[], discountAmt: number, shippingCost: number, amountPaid: number) => {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemDiscount = itemSubtotal * (item.discount / 100)
      return sum + (itemSubtotal - itemDiscount)
    }, 0)

    const taxTotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemDiscount = itemSubtotal * (item.discount / 100)
      const taxableAmount = itemSubtotal - itemDiscount
      return sum + (taxableAmount * (item.taxRate / 100))
    }, 0)

    // Calculate total item discounts for auto-calculation
    const totalItemDiscounts = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice
      return sum + (itemSubtotal * (item.discount / 100))
    }, 0)

    // Use the larger of manual discount or auto-calculated item discounts
    const effectiveDiscount = Math.max(discountAmt, totalItemDiscounts)

    const grandTotal = subtotal + taxTotal - effectiveDiscount + shippingCost
    const balanceDue = grandTotal - amountPaid

    return { subtotal, taxTotal, grandTotal, balanceDue, totalItemDiscounts }
  }

  // Auto-recalculate when items, discount, shipping, or amount paid changes
  useEffect(() => {
    const totals = calculateTotals(formData.items, formData.discountAmount, formData.shippingCost, formData.amountPaid)
    
    // Auto-update discount amount to match calculated item discounts
    // This ensures the overall discount reflects the sum of item discounts
    setFormData(prev => ({
      ...prev,
      ...totals,
      discountAmount: totals.totalItemDiscounts
    }))
  }, [formData.items, formData.shippingCost, formData.amountPaid])

  // Auto-save form data to localStorage (like Default)
  useEffect(() => {
    // For localStorage: include selected payment methods from allPaymentMethods
    const selectedPaymentMethods = allPaymentMethods.filter(method => 
      formData.selectedPaymentMethodIds?.includes(method.id)
    )
    
    const dataToSave = {
      ...formData,
      paymentMethods: selectedPaymentMethods
    }
    
    invoiceStorage.saveDraftDebouncedProfessional(dataToSave)
  }, [formData, allPaymentMethods])

  // URL is only updated in preview, not in create component

  // Add item
  const addItem = () => {
    const newItem: ProfessionalInvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
      lineTotal: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    
    setTimeout(() => {
      lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // Remove item
  const removeItem = (id: string) => {
    if (formData.items.length === 1) {
      toast.error('Invoice must have at least one item')
      return
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  // Update item
  const updateItem = (id: string, field: keyof ProfessionalInvoiceItem, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          const itemSubtotal = updatedItem.quantity * updatedItem.unitPrice
          const itemDiscount = itemSubtotal * (updatedItem.discount / 100)
          updatedItem.lineTotal = itemSubtotal - itemDiscount
          return updatedItem
        }
        return item
      })

      // Auto-add new item if last item is complete
      const currentItem = updatedItems.find(item => item.id === id)
      const isLastItem = updatedItems[updatedItems.length - 1]?.id === id
      
      if (isLastItem && currentItem) {
        const isComplete = currentItem.description.trim() !== '' && 
                          currentItem.quantity > 0 && 
                          currentItem.unitPrice > 0
        
        if (isComplete) {
          const newItem: ProfessionalInvoiceItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            taxRate: 0,
            lineTotal: 0
          }
          updatedItems.push(newItem)
          
          setTimeout(() => {
            lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }

      return {
        ...prev,
        items: updatedItems
      }
    })
  }

  // Cleanup empty last item
  const cleanupEmptyLastItem = () => {
    setFormData(prev => {
      const lastItem = prev.items[prev.items.length - 1]
      if (prev.items.length > 1 && 
          lastItem.description.trim() === '' && 
          lastItem.quantity === 1 && 
          lastItem.unitPrice === 0) {
        return {
          ...prev,
          items: prev.items.slice(0, -1)
        }
      }
      return prev
    })
  }

  // Handle client selection from dropdown
  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.name,
      clientEmail: client.email || prev.clientEmail,
      clientAddress: client.address || prev.clientAddress,
      clientPhone: client.phone || prev.clientPhone,
      clientCompanyName: client.company_name || prev.clientCompanyName
    }))
  }

  // Handle save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Filter out empty items before saving
      const validItems = formData.items.filter(item => 
        item.description.trim() !== '' || item.quantity > 0 || item.unitPrice > 0
      )

      const saveData = {
        ...formData,
        items: validItems
      }

      // Check if invoice already exists in database
      let existingInvoice = null
      if (saveData.invoiceNumber) {
        const { data } = await supabase
          .from('invoices')
          .select('id, template_settings')
          .eq('invoice_number', saveData.invoiceNumber)
          .eq('user_id', user.id)
          .single()
        existingInvoice = data
      }
      
      // Only use localStorage customization for NEW invoices (not existing ones)
      // For existing invoices, saveProfessionalInvoice will preserve their existing template_settings
      let latestTemplateSettings = undefined
      if (!existingInvoice) {
        // New invoice - use localStorage if available
      const savedCustomizationsRaw = localStorage.getItem('professional_template_customizations')
        latestTemplateSettings = savedCustomizationsRaw ? JSON.parse(savedCustomizationsRaw) : undefined
        console.log('📝 [CREATE] New invoice - using localStorage customization:', !!latestTemplateSettings)
      } else {
        // Existing invoice - don't pass templateSettings (will preserve existing DB settings)
        console.log('📝 [CREATE] Existing invoice - preserving database template_settings')
      }
      
      const result = await saveProfessionalInvoice(saveData, user, latestTemplateSettings, { status: 'draft' })
      
      if (result.success) {
        // Reset form to default state (same as DefaultCreate)
        setFormData({
          clientName: '',
          clientEmail: '',
          clientAddress: '',
          clientPhone: '',
          clientCompanyName: '',
          invoiceNumber: generateInvoiceNumber(),
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          poNumber: '',
          taxId: '',
          shipToName: '',
          shipToAddress: '',
          shipToCity: '',
          shipToState: '',
          shipToZip: '',
          shipToCountry: '',
          items: [{
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            taxRate: 0,
            lineTotal: 0
          }],
          notes: '',
          termsAndConditions: '',
          subtotal: 0,
          discountAmount: 0,
          shippingCost: 0,
          taxTotal: 0,
          grandTotal: 0,
          amountPaid: 0,
          balanceDue: 0,
          currency: 'USD',
          currencySymbol: '$',
          selectedPaymentMethodIds: []
        })
        // Clear URL params
        setSearchParams({})
        toast.success('Invoice saved successfully!')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Failed to save invoice')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle preview
  const handlePreview = () => {
    if (!formData.clientName.trim()) {
      toast.error('Client name is required')
      return
    }

    // Filter out empty items before preview
    const validItems = formData.items.filter(item => 
      item.description.trim() !== '' || item.quantity > 0 || item.unitPrice > 0
    )

    if (validItems.length === 0) {
      toast.error('Add at least one item to the invoice')
      return
    }

    // Get selected payment methods from allPaymentMethods
    const selectedPaymentMethods = allPaymentMethods.filter(method => 
      formData.selectedPaymentMethodIds?.includes(method.id)
    )

    const previewData = {
      ...formData,
      items: validItems,
      paymentMethods: selectedPaymentMethods // Include payment methods in preview data
    }

    navigate(`/invoice/preview/professional?invoice=${formData.invoiceNumber}`, {
      state: { invoiceData: previewData }
    })
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ fontSize: '18px', color: brandColors.neutral[600] }}>
          Loading invoice...
        </div>
      </div>
    )
  }

  return (
    <Layout hideBottomNav={true}>
      <div style={{
        paddingBottom: '0.5rem',
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflowY: 'auto'
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
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate(-1)
            }}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.neutral[100]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
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
            Professional Invoice
          </h1>
          
          {/* Customization Button */}
          <button
            onClick={() => setIsCustomizationOpen(true)}
            style={{
              padding: '0.5rem',
              backgroundColor: brandColors.primary[50],
              border: `1px solid ${brandColors.primary[200]}`,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: brandColors.primary[600],
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[100]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColors.primary[50]
            }}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Form Content */}
        <div style={{ 
          padding: '1rem',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            
            {/* Client Information Section */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${brandColors.neutral[100]}`,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
            onClick={cleanupEmptyLastItem}>
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
                  Bill To
                </h2>
              </div>

              {/* Client Dropdown */}
              <div style={{ marginBottom: '1rem' }}>
                <ClientDropdown onClientSelect={handleClientSelect} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="John Doe"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: brandColors.white,
                      color: brandColors.neutral[900],
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.clientCompanyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientCompanyName: e.target.value }))}
                    placeholder="Acme Corporation"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="john@example.com"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Billing Address
                  </label>
                  <textarea
                    value={formData.clientAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                    placeholder="123 Business Street, Suite 100, City, State, ZIP"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ship To Section (Optional) */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
            onClick={cleanupEmptyLastItem}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <Truck size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  Ship To (Optional)
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
                gap: '1rem'
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={formData.shipToName}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipToName: e.target.value }))}
                    placeholder="Delivery contact name"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.shipToAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipToAddress: e.target.value }))}
                    placeholder="Street address"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.shipToCity}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipToCity: e.target.value }))}
                    placeholder="City"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.shipToState}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipToState: e.target.value }))}
                    placeholder="State"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.shipToZip}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipToZip: e.target.value }))}
                    placeholder="ZIP"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.shipToCountry}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipToCountry: e.target.value }))}
                    placeholder="Country"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details Section */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
            onClick={cleanupEmptyLastItem}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <FileText size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  Invoice Details
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    <Hash size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                    placeholder="PO-12345"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    <Building size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Tax ID / VAT
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="12-3456789"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => {
                      const newCurrency = e.target.value
                      setFormData(prev => ({
                        ...prev,
                        currency: newCurrency,
                        currencySymbol: getCurrencySymbol(newCurrency)
                      }))
                    }}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: brandColors.white,
                      color: brandColors.neutral[900],
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2316a34a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = brandColors.primary[500]
                      e.target.style.boxShadow = `0 0 0 3px ${brandColors.primary[100]}`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = brandColors.neutral[300]
                      e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {CURRENCIES.map(currency => (
                      <option 
                        key={currency.code} 
                        value={currency.code}
                        style={{
                          backgroundColor: brandColors.white,
                          color: brandColors.neutral[900],
                          padding: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items Section */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <DollarSign size={20} color={brandColors.primary[600]} />
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    margin: 0
                  }}>
                    Line Items
                  </h2>
                </div>
                <button
                  onClick={addItem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: brandColors.primary[50],
                    border: `1px solid ${brandColors.primary[200]}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.primary[700]
                  }}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div ref={itemsContainerRef} style={{ 
                overflowX: 'auto',
                width: '100%',
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch',
                boxSizing: 'border-box'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: window.innerWidth < 768 ? '600px' : '800px'
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[600],
                        borderBottom: `2px solid ${brandColors.neutral[200]}`,
                        width: '35%'
                      }}>
                        Description
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[600],
                        borderBottom: `2px solid ${brandColors.neutral[200]}`,
                        width: '12%'
                      }}>
                        Qty
                      </th>
                      <th style={{
                        textAlign: 'right',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[600],
                        borderBottom: `2px solid ${brandColors.neutral[200]}`,
                        width: '15%'
                      }}>
                        Unit Price
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[600],
                        borderBottom: `2px solid ${brandColors.neutral[200]}`,
                        width: '10%'
                      }}>
                        Disc %
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[600],
                        borderBottom: `2px solid ${brandColors.neutral[200]}`,
                        width: '10%'
                      }}>
                        Tax %
                      </th>
                      <th style={{
                        textAlign: 'right',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[600],
                        borderBottom: `2px solid ${brandColors.neutral[200]}`,
                        width: '15%'
                      }}>
                        Total
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: brandColors.neutral[600],
                        borderBottom: `2px solid ${brandColors.neutral[200]}`,
                        width: '3%'
                      }}>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr 
                        key={item.id}
                        ref={index === formData.items.length - 1 ? lastItemRef : null}
                        style={{
                          borderBottom: `1px solid ${brandColors.neutral[100]}`
                        }}
                      >
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Service or product description"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: `1px solid ${brandColors.neutral[300]}`,
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              maxWidth: '100%'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <FormattedNumberInput
                            value={item.quantity}
                            onChange={(value) => updateItem(item.id, 'quantity', value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: `1px solid ${brandColors.neutral[300]}`,
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              textAlign: 'center'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <FormattedNumberInput
                            value={item.unitPrice}
                            onChange={(value) => updateItem(item.id, 'unitPrice', value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: `1px solid ${brandColors.neutral[300]}`,
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              textAlign: 'right',
                              boxSizing: 'border-box',
                              maxWidth: '100%'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <FormattedNumberInput
                            value={item.discount}
                            onChange={(value) => updateItem(item.id, 'discount', value)}
                            min={0}
                            max={100}
                            step={0.1}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: `1px solid ${brandColors.neutral[300]}`,
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                              maxWidth: '100%'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <FormattedNumberInput
                            value={item.taxRate}
                            onChange={(value) => updateItem(item.id, 'taxRate', value)}
                            min={0}
                            max={100}
                            step={0.1}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: `1px solid ${brandColors.neutral[300]}`,
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                              maxWidth: '100%'
                            }}
                          />
                        </td>
                        <td style={{ 
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: brandColors.neutral[900]
                        }}>
                          {formData.currencySymbol}{formatCurrency(item.lineTotal)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            onClick={() => removeItem(item.id)}
                            style={{
                              padding: '0.25rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: brandColors.error[600]
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals & Additional Charges Section */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
            onClick={cleanupEmptyLastItem}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <CreditCard size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  Totals & Charges
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Left column - Additional charges */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[700],
                      marginBottom: '0.5rem'
                    }}>
                      <Percent size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Overall Discount
                    </label>
                    <FormattedNumberInput
                      value={formData.discountAmount}
                      onChange={(value) => setFormData(prev => ({ ...prev, discountAmount: value }))}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: `1px solid ${brandColors.neutral[300]}`,
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
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
                      <Truck size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Shipping / Handling
                    </label>
                    <FormattedNumberInput
                      value={formData.shippingCost}
                      onChange={(value) => setFormData(prev => ({ ...prev, shippingCost: value }))}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: `1px solid ${brandColors.neutral[300]}`,
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
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
                      <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Amount Paid / Deposit
                    </label>
                    <FormattedNumberInput
                      value={formData.amountPaid}
                      onChange={(value) => setFormData(prev => ({ ...prev, amountPaid: value }))}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: `1px solid ${brandColors.neutral[300]}`,
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Right column - Totals summary */}
                <div style={{
                  backgroundColor: brandColors.white,
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700]
                  }}>
                    <span>Subtotal:</span>
                    <span>{formData.currencySymbol}{formatCurrency(formData.subtotal)}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700]
                  }}>
                    <span>Tax:</span>
                    <span>{formData.currencySymbol}{formatCurrency(formData.taxTotal)}</span>
                  </div>

              {formData.discountAmount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: brandColors.error[600]
                }}>
                  <span>Discount:</span>
                  <span>-{formData.currencySymbol}{formatCurrency(formData.discountAmount)}</span>
                </div>
              )}

                  {formData.shippingCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      color: brandColors.neutral[700]
                    }}>
                      <span>Shipping:</span>
                      <span>{formData.currencySymbol}{formatCurrency(formData.shippingCost)}</span>
                    </div>
                  )}

                  <div style={{
                    borderTop: `2px solid ${brandColors.neutral[300]}`,
                    paddingTop: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: brandColors.neutral[900]
                  }}>
                    <span>Total:</span>
                    <span>{formData.currencySymbol}{formatCurrency(formData.grandTotal)}</span>
                  </div>

                  {formData.amountPaid > 0 && (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.875rem',
                        color: brandColors.success[600]
                      }}>
                        <span>Paid:</span>
                        <span>-{formData.currencySymbol}{formatCurrency(formData.amountPaid)}</span>
                      </div>

                      <div style={{
                        borderTop: `2px solid ${brandColors.neutral[300]}`,
                        paddingTop: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: brandColors.primary[600]
                      }}>
                        <span>Balance Due:</span>
                        <span>{formData.currencySymbol}{formatCurrency(formData.balanceDue)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Methods Section */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
            onClick={cleanupEmptyLastItem}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <CreditCard size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  Payment Methods
                </h2>
              </div>

              {allPaymentMethods.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {allPaymentMethods.map((method) => (
                    <label
                      key={method.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        border: `1px solid ${brandColors.neutral[200]}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: formData.selectedPaymentMethodIds?.includes(method.id) 
                          ? brandColors.primary[50] 
                          : brandColors.white
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedPaymentMethodIds?.includes(method.id) || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          setFormData(prev => ({
                            ...prev,
                            selectedPaymentMethodIds: isChecked
                              ? [...(prev.selectedPaymentMethodIds || []), method.id]
                              : (prev.selectedPaymentMethodIds || []).filter(id => id !== method.id)
                          }))
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: brandColors.primary[600],
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          color: brandColors.neutral[900],
                          fontSize: '0.875rem',
                          marginBottom: '0.25rem'
                        }}>
                          {method.label}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: brandColors.neutral[600]
                        }}>
                          {PAYMENT_METHOD_TYPES.find(t => t.value === method.type)?.label}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: brandColors.neutral[500],
                  fontSize: '0.875rem'
                }}>
                  <p>No payment methods configured.</p>
                  <p style={{ marginTop: '0.5rem' }}>
                    Add payment methods in <a href="/settings" style={{ color: brandColors.primary[600] }}>Settings</a>
                  </p>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
            onClick={cleanupEmptyLastItem}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <FileText size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  Notes & Terms
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Notes / Additional Information
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Thank you for your business!"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
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
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                    placeholder="Payment terms, refund policy, etc."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons - Bottom like Default */}
          <div style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: brandColors.white,
            borderTop: `1px solid ${brandColors.neutral[200]}`,
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1,
                maxWidth: '200px',
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.neutral[100],
                color: brandColors.neutral[700],
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                opacity: isSaving ? 0.6 : 1
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={handlePreview}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>
      </div>
      
      {/* Customization Panel */}
      <CustomizationPanel
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        onSave={async (data) => {
          // Save the EXACT data from the panel - don't clean it for localStorage
          // Only clean when saving to database to remove extra fields
          // For localStorage, we want to preserve all user selections exactly as they are
          console.log('💾 [CUSTOMIZATION] Saving to localStorage:', data)
          
          // Always save to localStorage for preview purposes - use data directly
          localStorage.setItem('professional_template_customizations', JSON.stringify(data))
          setCustomizationData(data)
          setTemplateSettings(data)
          
          // Clean data only for database saves (to remove extra fields)
          const cleanData = {
            // Company Details
            company_name: data.company_name || '',
            website: data.website || '',
            tax_id: data.tax_id || '',
            tagline: data.tagline || '',
            business_type: data.business_type || '',
            registration_number: data.registration_number || '',
            
            // Branding
            logo_url: data.logo_url || '',
            primary_color: data.primary_color || '#16a34a',
            accent_color: data.accent_color || '#6b7280',
            font_family: data.font_family || 'Helvetica',
            
            // Background Colors
            background_colors: {
              main_background: data.background_colors?.main_background || '#f8fafc',
              card_background: data.background_colors?.card_background || '#ffffff',
              section_background: data.background_colors?.section_background || '#f1f5f9',
              header_background: data.background_colors?.header_background || '#ffffff',
              form_background: data.background_colors?.form_background || '#ffffff'
            },
            
            // Template Settings
            template_settings: {
              show_logo: data.template_settings?.show_logo ?? true,
              show_tagline: data.template_settings?.show_tagline ?? true,
              show_website: data.template_settings?.show_website ?? true,
              show_tax_id: data.template_settings?.show_tax_id ?? true,
              show_registration: data.template_settings?.show_registration ?? true
            }
          }
          
          // If invoice already exists in database, save customization to database too
          if (formData.invoiceNumber) {
            try {
              const { data: existingInvoice } = await supabase
                .from('invoices')
                .select('id')
                .eq('invoice_number', formData.invoiceNumber)
                .eq('user_id', user.id)
                .single()
              
              if (existingInvoice) {
                // Update template_settings in database with cleaned data
                // This replaces the entire object, removing any old/extra fields
                const { error: updateError } = await supabase
                  .from('invoices')
                  .update({ template_settings: cleanData })
                  .eq('id', existingInvoice.id)
                
                if (updateError) {
                  console.error('Error saving customization to database:', updateError)
                  toast.error('Failed to save customization to database')
                } else {
                  console.log('✅ [CUSTOMIZATION] Saved clean data to database for invoice:', formData.invoiceNumber)
                  console.log('📋 [CUSTOMIZATION] Saved structure:', Object.keys(cleanData))
                }
              }
            } catch (error) {
              console.error('Error checking/saving invoice customization:', error)
            }
          }
        }}
        initialData={customizationData}
        template="professional"
      />
    </Layout>
  )
}

