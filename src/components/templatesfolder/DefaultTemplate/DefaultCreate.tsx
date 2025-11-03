import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { brandColors } from '../../../stylings'
import { Layout } from '../../layout'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { InvoiceFormData, InvoiceItem, PaymentDetails, PaymentMethod } from '../../../lib/storage/invoiceStorage'
import { saveInvoiceToDatabase } from './DefaultTemplateSave'
import FormattedNumberInput from '../../FormattedNumberInput'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
import { CURRENCIES, getCurrencySymbol } from '../../../lib/currencyUtils'
import { useInvoiceCurrency } from '../../../hooks/useInvoiceCurrency'
import ClientDropdown from '../../ClientDropdown'
import type { Client } from '../../ClientDropdown'
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
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_METHOD_TYPES = [
  { value: 'bank_local_us', label: 'Bank Transfer (US)' },
  { value: 'bank_local_ng', label: 'Bank Transfer (Nigeria)' },
  { value: 'bank_international', label: 'International Wire' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
]

export default function InvoiceCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    // Only use Default template's localStorage key, never generic or professional
    const savedData = invoiceStorage.getDraftDefault()
    if (savedData) {
      return savedData
    }
    // Return fresh default data, don't use getDraftWithFallback which uses generic key
    return {
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      clientPhone: '',
      clientCompanyName: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [
        {
          id: Date.now().toString(),
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          lineTotal: 0
        }
      ],
      notes: '',
      subtotal: 0,
      taxTotal: 0,
      grandTotal: 0,
      currency: 'USD',
      currencySymbol: '$'
    }
  })
  const [loading, setLoading] = useState(false)
  const { currency: globalCurrency, currencySymbol: globalCurrencySymbol, setCurrency } = useInvoiceCurrency(formData.currency)
  const itemsContainerRef = useRef<HTMLDivElement>(null)
  const lastItemRef = useRef<HTMLDivElement>(null)
  const [userDefaults, setUserDefaults] = useState<{ 
    paymentMethods: PaymentMethod[],
    defaultCurrency: string,
    defaultCurrencySymbol: string
  }>({
    paymentMethods: [],
    defaultCurrency: 'USD',
    defaultCurrencySymbol: '$'
  })

  // Store all payment methods from profiles for localStorage operations
  const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>([])
  
  // Track if we've already loaded initial data to prevent overwriting user changes
  const hasLoadedInitialData = useRef(false)
  
  // Load invoice data from URL parameter or state - only once on mount
  useEffect(() => {
    if (hasLoadedInitialData.current || !user) return
    
    const loadInvoiceData = async () => {
      // First check state data (from preview/edit navigation)
      if (location.state?.invoiceData) {
        console.log('Found invoice in state')
        setFormData(location.state.invoiceData)
        hasLoadedInitialData.current = true
        // Update URL to include invoice number
        if (location.state.invoiceData.invoiceNumber) {
          setSearchParams({ invoice: location.state.invoiceData.invoiceNumber }, { replace: true })
        }
        return
      }

      // Then check URL parameter for invoice number
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      if (invoiceNumber) {
        setLoading(true)
        try {
          // Load invoice from database using invoice number
          const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('invoice_number', invoiceNumber)
            .eq('user_id', user.id)
            .single()

          if (error) {
            console.error('Error loading invoice from database:', error)
            console.log('Invoice not found in database, checking localStorage...')
            
            // Check localStorage for this invoice number
            const savedData = invoiceStorage.getDraftDefault()
            if (savedData && savedData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in localStorage')
              setFormData(savedData)
              hasLoadedInitialData.current = true
              setLoading(false)
              return
            }
            
            // If not found anywhere, redirect to new invoice
            console.log('Invoice not found anywhere, creating new invoice')
            navigate('/invoice/create/default')
            return
          }

          if (data) {
            // Convert database transaction to InvoiceFormData format
            const invoiceFormData: InvoiceFormData = {
              clientName: data.client_name || '',
              clientEmail: data.client_email || '',
              clientAddress: data.client_address || '',
              clientPhone: data.client_phone || '',
              clientCompanyName: data.client_company_name || '',
              invoiceNumber: data.invoice_number,
              invoiceDate: data.issue_date,
              dueDate: data.due_date,
              items: data.items || [],
              notes: data.notes || '',
              subtotal: data.subtotal || 0,
              taxTotal: data.tax_amount || 0,
              grandTotal: data.total_amount || 0
            }
            setFormData(invoiceFormData)
            hasLoadedInitialData.current = true
          }
        } catch (error) {
          console.error('Error loading invoice:', error)
          toast.error('Error loading invoice')
          navigate('/invoices')
        } finally {
          setLoading(false)
        }
      } else {
        // No invoice to load, check localStorage for any saved draft
        const savedData = invoiceStorage.getDraftDefault()
        if (savedData) {
          console.log('Loading saved draft from localStorage')
          setFormData(savedData)
          if (savedData.invoiceNumber) {
            setSearchParams({ invoice: savedData.invoiceNumber }, { replace: true })
          }
        }
        hasLoadedInitialData.current = true
      }
    }

    loadInvoiceData()
  }, []) // Only run once on mount - removed searchParams dependency

  const [isSaving, setIsSaving] = useState(false)

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
            paymentMethods: paymentMethods,
            defaultCurrency: currencyCode,
            defaultCurrencySymbol: currencySymbol
          })

          // Store all payment methods for localStorage operations
          setAllPaymentMethods(paymentMethods)

          // Set form data with user defaults if this is a new invoice
          if (!formData.currency) {
            setFormData(prev => ({
              ...prev,
              currency: currencyCode,
              currencySymbol: currencySymbol,
              paymentMethods: paymentMethods,
              selectedPaymentMethodIds: paymentMethods.map((m: PaymentMethod) => m.id) // Select all by default
            }))
          }
        }
      } catch (error) {
        console.error('Error loading user defaults:', error)
      }
    }

    loadUserDefaults()
  }, [user])

  // Calculate totals whenever items change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.lineTotal, 0)
    const taxTotal = formData.items.reduce((sum, item) => sum + (item.lineTotal * item.taxRate / 100), 0)
    const grandTotal = subtotal + taxTotal

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxTotal,
      grandTotal
    }))
  }, [formData.items])

  // Auto-save form data to localStorage
  useEffect(() => {
    // For localStorage: include selected payment methods from allPaymentMethods
    const selectedPaymentMethods = allPaymentMethods.filter(method => 
      formData.selectedPaymentMethodIds?.includes(method.id)
    )
    
    const dataToSave = {
      ...formData,
      paymentMethods: selectedPaymentMethods
    }
    
    invoiceStorage.saveDraftDebouncedDefault(dataToSave)
  }, [formData, allPaymentMethods])

  // Update URL when invoice number changes - but don't trigger loadInvoiceData
  useEffect(() => {
    if (formData.invoiceNumber && !loading && hasLoadedInitialData.current) {
      const currentInvoice = getInvoiceFromUrl(searchParams)
      if (currentInvoice !== formData.invoiceNumber) {
        setSearchParams({ invoice: formData.invoiceNumber }, { replace: true })
      }
    }
  }, [formData.invoiceNumber, loading])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      lineTotal: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    
    // Scroll to new item
    setTimeout(() => {
      lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const removeItem = (id: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          // Recalculate line total
          updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice
          return updatedItem
        }
        return item
      })

      // Check if we should auto-add a new item
      const currentItem = updatedItems.find(item => item.id === id)
      const isLastItem = updatedItems[updatedItems.length - 1]?.id === id
      
      if (currentItem && isLastItem) {
        // Check if current item is complete (has description, quantity > 0, and unitPrice > 0)
        const isComplete = 
          currentItem.description.trim() !== '' &&
          currentItem.quantity > 0 &&
          currentItem.unitPrice > 0

        if (isComplete) {
          // Auto-add new empty item
          const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: 0,
            lineTotal: 0
          }
          
          // Scroll to new item after state update
          setTimeout(() => {
            lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)

          return {
            ...prev,
            items: [...updatedItems, newItem]
          }
        }
      }

      return {
        ...prev,
        items: updatedItems
      }
    })
  }

  // Format number while typing (with commas, no forced decimals)
  const formatNumberWhileTyping = (value: string): string => {
    if (!value) return ''
    
    // Split by decimal point
    const parts = value.split('.')
    
    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    // Join back with decimal if it exists
    return parts.join('.')
  }

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // Remove empty last item when user clicks another section
  const cleanupEmptyLastItem = () => {
    setFormData(prev => {
      const lastItem = prev.items[prev.items.length - 1]
      if (
        prev.items.length > 1 &&
        lastItem &&
        lastItem.description.trim() === '' &&
        lastItem.quantity <= 0 &&
        lastItem.unitPrice <= 0
      ) {
        return {
          ...prev,
          items: prev.items.slice(0, -1)
        }
      }
      return prev
    })
  }

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

      // Use shared save function - handles all validation, saving, and localStorage clearing
      const result = await saveInvoiceToDatabase(saveData, user, { status: 'draft' })
      
      if (result.success) {
        // Reset form to default state (like the original function did)
        setFormData(invoiceStorage.getDraftWithFallback())
      }
    } catch (error) {
      console.error('Error in handleSave:', error)
      toast.error('Failed to save invoice')
    } finally {
      setIsSaving(false)
    }
  }

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

    // Create preview data with only valid items
    const previewData = {
      ...formData,
      items: validItems
    }

    // Check if all valid items have descriptions
    if (validItems.some(item => !item.description.trim())) {
      toast.error('All items must have a description')
      return
    }

    // Navigate to preview with filtered data (only valid items)
    navigate('/invoice/preview/default', { 
      state: { invoiceData: previewData } 
    })
  }

  if (!user) { return null }

  return (
    <Layout hideBottomNav={true}>
      <div style={{
        paddingBottom: '0.5rem',
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
          <button
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0
          }}>
            New Invoice
          </h1>
          
          <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Form Content */}
        <div style={{ padding: '1rem' }}>
          {/* Client Information Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
              onClick={cleanupEmptyLastItem}
            >
              <User size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Client Information
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Client Dropdown - Auto-fill client info */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Select Existing Client (Optional)
                </label>
                <ClientDropdown
                  onClientSelect={(client: Client) => {
                    // Auto-fill only fields that have data
                    setFormData(prev => ({
                      ...prev,
                      clientName: client.name || prev.clientName,
                      clientEmail: client.email || prev.clientEmail,
                      clientPhone: client.phone || prev.clientPhone,
                      clientAddress: client.address || prev.clientAddress,
                      clientCompanyName: client.company_name || prev.clientCompanyName
                    }))
                    toast.success(`Client "${client.name}" info loaded!`)
                  }}
                  placeholder="Search and select a client to auto-fill..."
                />
              </div>

              <div style={{
                height: '1px',
                background: `linear-gradient(to right, transparent, ${brandColors.neutral[200]}, transparent)`,
                margin: '0.5rem 0'
              }} />

              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr 1fr' : '1fr',
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
                    placeholder="Enter client name"
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
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="client@example.com"
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
              </div>

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
                  value={formData.clientAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                  placeholder="Enter client address"
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

              <div style={{ display: 'flex', gap: '1rem', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
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
                      padding: '0.75rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: brandColors.white,
                      color: brandColors.neutral[900]
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
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
                    placeholder="Company Inc."
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
              </div>
            </div>
          </div>

          {/* Invoice Details Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <FileText size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Invoice Details
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
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
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

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: brandColors.white,
                      color: brandColors.neutral[900],
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: brandColors.white,
                      color: brandColors.neutral[900],
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1rem',
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
                  padding: '0.5rem',
                  backgroundColor: brandColors.primary[100],
                  color: brandColors.primary[600],
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div ref={itemsContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.items.map((item, index) => (
                <div 
                  key={item.id} 
                  ref={index === formData.items.length - 1 ? lastItemRef : null}
                  style={{
                    padding: '1rem',
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '12px',
                    border: `1px solid ${brandColors.neutral[200]}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[700]
                    }}>
                      Item {index + 1}
                    </span>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} color={brandColors.error[500]} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: brandColors.neutral[600],
                        marginBottom: '0.25rem'
                      }}>
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Enter item description"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${brandColors.neutral[200]}`,
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          backgroundColor: brandColors.white,
                          color: brandColors.neutral[900]
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: brandColors.neutral[600],
                          marginBottom: '0.25rem'
                        }}>
                          Qty
                        </label>
                        <FormattedNumberInput
                          value={item.quantity}
                          onChange={(value) => updateItem(item.id, 'quantity', value)}
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            backgroundColor: brandColors.white,
                            color: brandColors.neutral[900]
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: brandColors.neutral[600],
                          marginBottom: '0.25rem'
                        }}>
                          Unit Price
                        </label>
                        <FormattedNumberInput
                          value={item.unitPrice}
                          onChange={(value) => updateItem(item.id, 'unitPrice', value)}
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            backgroundColor: brandColors.white,
                            color: brandColors.neutral[900]
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: brandColors.neutral[600],
                          marginBottom: '0.25rem'
                        }}>
                          Tax %
                        </label>
                        <FormattedNumberInput
                          min={0}
                          max={100}
                          step={0.01}
                          value={item.taxRate}
                          onChange={(value) => updateItem(item.id, 'taxRate', value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            backgroundColor: brandColors.white,
                            color: brandColors.neutral[900]
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      paddingTop: '0.5rem',
                      borderTop: `1px solid ${brandColors.neutral[200]}`
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900]
                      }}>
                        Subtotal: ${item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 1rem 0'
            }}>
              Notes / Terms
            </h2>
            
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter payment terms or additional notes..."
              rows={4}
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

          {/* Currency Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <DollarSign size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Currency
              </h2>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: brandColors.neutral[700],
                marginBottom: '0.5rem'
              }}>
                Invoice Currency
              </label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => {
                  const selectedCurrency = CURRENCIES.find(c => c.code === e.target.value)
                  setCurrency(e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    currency: e.target.value,
                    currencySymbol: selectedCurrency?.symbol || '$'
                  }))
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${brandColors.neutral[200]}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: brandColors.white,
                  color: brandColors.neutral[900],
                  cursor: 'pointer'
                }}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p style={{
                fontSize: '0.75rem',
                color: brandColors.neutral[500],
                marginTop: '0.5rem'
              }}>
                Default: {userDefaults.defaultCurrencySymbol} {userDefaults.defaultCurrency}
              </p>
            </div>
          </div>

          {/* Payment Methods Card */}
          {userDefaults.paymentMethods.length > 0 && (
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
                <CreditCard size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  Payment Methods (Optional)
                </h2>
              </div>

              <p style={{
                fontSize: '0.75rem',
                color: brandColors.neutral[600],
                marginBottom: '1rem'
              }}>
                Select which payment methods to show on this invoice:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {userDefaults.paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: formData.selectedPaymentMethodIds?.includes(method.id) 
                        ? brandColors.primary[50] 
                        : brandColors.neutral[50],
                      borderRadius: '8px',
                      border: `1px solid ${
                        formData.selectedPaymentMethodIds?.includes(method.id)
                          ? brandColors.primary[200]
                          : brandColors.neutral[200]
                      }`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedPaymentMethodIds?.includes(method.id) || false}
                      onChange={(e) => {
                        const currentIds = formData.selectedPaymentMethodIds || []
                        const newIds = e.target.checked
                          ? [...currentIds, method.id]
                          : currentIds.filter(id => id !== method.id)
                        setFormData(prev => ({ ...prev, selectedPaymentMethodIds: newIds }))
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
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900],
                        marginBottom: '0.125rem'
                      }}>
                        {method.label}
                        {method.isDefault && (
                          <span style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.7rem',
                            backgroundColor: brandColors.primary[100],
                            color: brandColors.primary[700],
                            padding: '0.125rem 0.5rem',
                            borderRadius: '6px',
                            fontWeight: '600'
                          }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: brandColors.neutral[500]
                      }}>
                        {PAYMENT_METHOD_TYPES.find(t => t.value === method.type)?.label}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <p style={{
                fontSize: '0.7rem',
                color: brandColors.neutral[500],
                marginTop: '1rem',
                fontStyle: 'italic'
              }}>
                Clients will see the selected payment methods on the invoice. You can manage payment methods in Settings.
              </p>
            </div>
          )}

          {/* Summary Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 1rem 0'
            }}>
              Summary
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600]
                }}>
                  Subtotal
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[900]
                }}>
                  {formData.currencySymbol || '$'}{formData.subtotal.toFixed(2)}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600]
                }}>
                  Tax
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[900]
                }}>
                  {formData.currencySymbol || '$'}{formData.taxTotal.toFixed(2)}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: `1px solid ${brandColors.neutral[200]}`
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900]
                }}>
                  Total
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: brandColors.primary[600]
                }}>
                  {formData.currencySymbol || '$'}{formData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Non-floating */}
        <div style={{
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: brandColors.white,
          padding: '0.75rem',
            borderRadius: '16px',
            border: `1px solid ${brandColors.neutral[200]}`,
            maxWidth: '100%',
          overflowX: 'auto'
        }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: brandColors.neutral[100],
              color: brandColors.neutral[600],
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
    </Layout>
  )
}