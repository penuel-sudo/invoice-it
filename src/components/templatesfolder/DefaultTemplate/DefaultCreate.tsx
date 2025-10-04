import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { brandColors } from '../../../stylings'
import { Layout } from '../../layout'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { InvoiceFormData, InvoiceItem, PaymentDetails, PaymentMethod } from '../../../lib/storage/invoiceStorage'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
import { CURRENCIES, getCurrencySymbol } from '../../../lib/currencyUtils'
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
  
  const [formData, setFormData] = useState<InvoiceFormData>(invoiceStorage.getDraftWithFallback())
  const [loading, setLoading] = useState(false)
  const [userDefaults, setUserDefaults] = useState<{ 
    currency: string
    currencySymbol: string
    paymentMethods: PaymentMethod[]
  }>({
    currency: 'USD',
    currencySymbol: '$',
    paymentMethods: []
  })
  
  // Load invoice data from URL parameter or state
  useEffect(() => {
    const loadInvoiceData = async () => {
      // First check URL parameter for invoice number
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      if (invoiceNumber) {
        setLoading(true)
        try {
          // Load invoice from database using invoice number
          const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('invoice_number', invoiceNumber)
            .eq('user_id', user?.id)
            .single()

          if (error) {
            console.error('Error loading invoice from database:', error)
            console.log('Invoice not found in database, checking localStorage and state...')
            
            // Check localStorage for this invoice number
            const savedData = invoiceStorage.getDraft()
            if (savedData && savedData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in localStorage')
              setFormData(savedData)
              setLoading(false)
              return
            }
            
            // Check state data
            if (location.state?.invoiceData && location.state.invoiceData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in state')
              setFormData(location.state.invoiceData)
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
          }
        } catch (error) {
          console.error('Error loading invoice:', error)
          toast.error('Error loading invoice')
          navigate('/invoices')
        } finally {
          setLoading(false)
        }
      } else if (location.state?.invoiceData) {
        // Fallback to state data
        setFormData(location.state.invoiceData)
        // Update URL to include invoice number
        if (location.state.invoiceData.invoiceNumber) {
          setSearchParams({ invoice: location.state.invoiceData.invoiceNumber })
        }
      } else {
        // Update URL with current invoice number if available
        if (formData.invoiceNumber) {
          setSearchParams({ invoice: formData.invoiceNumber })
        }
      }
    }

    if (user) {
      loadInvoiceData()
    }
  }, [searchParams, location.state, navigate, user])

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
          
          console.log('🔍 Create - Loading user defaults:', {
            data: data,
            paymentMethods: paymentMethods,
            paymentMethodsLength: paymentMethods.length,
            paymentMethodIds: paymentMethods.map(m => m.id)
          })
          
          setUserDefaults({
            currency: currencyCode,
            currencySymbol: currencySymbol,
            paymentMethods: paymentMethods
          })

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
    // Create a copy of formData with only selected payment methods
    const filteredMethods = formData.paymentMethods?.filter(method => 
      formData.selectedPaymentMethodIds?.includes(method.id)
    ) || []
    
    console.log('🔍 Create - Filtering payment methods:', {
      allMethods: formData.paymentMethods?.length || 0,
      selectedIds: formData.selectedPaymentMethodIds,
      filteredMethods: filteredMethods.length,
      filteredMethodIds: filteredMethods.map(m => m.id)
    })
    
    const dataToSave = {
      ...formData,
      paymentMethods: filteredMethods
    }
    invoiceStorage.saveDraftDebounced(dataToSave)
  }, [formData])

  // Update URL when invoice number changes
  useEffect(() => {
    if (formData.invoiceNumber) {
      setSearchParams({ invoice: formData.invoiceNumber })
    }
  }, [formData.invoiceNumber, setSearchParams])

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
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          // Recalculate line total
          updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleSave = async () => {
    if (!formData.clientName.trim()) {
      toast.error('Client name is required')
      return
    }

    if (formData.items.some(item => !item.description.trim())) {
      toast.error('All items must have a description')
      return
    }

    if (!user) {
      toast.error('User not authenticated')
      return
    }

    setIsSaving(true)
    try {
      // Step 1: Save or find client
      let clientId: string
      
      // Check if client already exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', formData.clientName)
        .eq('email', formData.clientEmail || '')
        .single()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        // Create new client
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: formData.clientName,
            email: formData.clientEmail || null,
            address: formData.clientAddress || null,
            phone: formData.clientPhone || null,
            company_name: formData.clientCompanyName || null
          })
          .select()
          .single()

        if (clientError) {
          console.error('Error saving client:', clientError)
          toast.error('Failed to save client: ' + clientError.message)
          return
        }
        clientId = client.id
      }

      // Step 2: Save invoice to database
      const { data: invoice, error: invoiceError} = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: clientId,
          invoice_number: formData.invoiceNumber,
          issue_date: formData.invoiceDate,
          due_date: formData.dueDate,
          notes: formData.notes || null,
          subtotal: formData.subtotal,
          tax_amount: formData.taxTotal,
          total_amount: formData.grandTotal,
          status: 'draft',
          template: 'default',
          currency_code: formData.currency || 'USD',
          payment_details: formData.paymentDetails || null,
          payment_methods: formData.paymentMethods?.filter(method => 
            formData.selectedPaymentMethodIds?.includes(method.id)
          ) || null,
          selected_payment_method_ids: formData.selectedPaymentMethodIds || null,
          template_data: {
            layout: 'clean',
            colors: {
              primary: '#16a34a',
              secondary: '#6b7280'
            },
            fonts: {
              heading: 'Inter',
              body: 'Inter'
            }
          },
          template_settings: {
            userPreferences: {
              defaultTaxRate: formData.taxTotal,
              currency: formData.currency || 'USD',
              currencySymbol: formData.currencySymbol || '$',
              dateFormat: 'MM/DD/YYYY'
            },
            branding: {
              companyName: 'Your Business'
            }
          }
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('Error saving invoice:', invoiceError)
        toast.error('Failed to save invoice: ' + invoiceError.message)
        return
      }

      // Save invoice items
      const invoiceItems = formData.items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        line_total: item.lineTotal
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) {
        console.error('Error saving invoice items:', itemsError)
        // Clean up the invoice if items failed
        await supabase.from('invoices').delete().eq('id', invoice.id)
        toast.error('Failed to save invoice items: ' + itemsError.message)
        return
      }

      // Clear the draft from localStorage after successful save
      invoiceStorage.clearDraft()
      
      // Reset form to default state
      setFormData(invoiceStorage.getDraftWithFallback())
      
      toast.success('Invoice saved successfully!')
    } catch (error) {
      console.error('Error saving invoice:', error)
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

    if (formData.items.some(item => !item.description.trim())) {
      toast.error('All items must have a description')
      return
    }

    // Navigate to preview with form data
    navigate('/invoice/preview/default', { 
      state: { invoiceData: formData } 
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
                Client Information
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.items.map((item, index) => (
                <div key={item.id} style={{
                  padding: '1rem',
                  backgroundColor: brandColors.neutral[50],
                  borderRadius: '12px',
                  border: `1px solid ${brandColors.neutral[200]}`
                }}>
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
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
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
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
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
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e) => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
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
                Default: {userDefaults.currencySymbol} {userDefaults.currency}
              </p>
            </div>
          </div>

          {/* Payment Methods Card */}
          {(() => {
            console.log('🔍 Create - Payment methods section check:', {
              userDefaultsPaymentMethods: userDefaults.paymentMethods,
              length: userDefaults.paymentMethods.length,
              shouldShow: userDefaults.paymentMethods.length > 0
            })
            return userDefaults.paymentMethods.length > 0
          })() && (
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`,
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
