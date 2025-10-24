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


export default function ProfessionalInvoicePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  
  const [invoiceData, setInvoiceData] = useState<ProfessionalInvoiceFormData | null>(null)
  const [dbStatus, setDbStatus] = useState<string>('draft')
  const [loading, setLoading] = useState(false)
  const [isFromDatabase, setIsFromDatabase] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  useEffect(() => {
    const loadInvoiceData = async () => {
      // First check URL parameter for invoice number
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      if (invoiceNumber && !loading) {
        setLoading(true)
        try {
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
            .eq('template', 'professional')
            .single()

          if (invoiceError) {
            console.log('Invoice not found in database, checking localStorage and state...')
            
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
              setLoading(false)
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
              
              // Load payment methods for localStorage data
              if (user) {
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
                    setPaymentMethods(selectedPaymentMethods)
                  }
                } catch (error) {
                  console.error('Error loading payment methods:', error)
                }
              }
              
              setLoading(false)
              return
            }
            
            // If not found anywhere, show error
            console.log('Invoice not found anywhere')
            toast.error('Invoice not found')
            navigate('/invoices')
            return
          }

          if (invoiceData) {
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

            setInvoiceData(formData)
            setDbStatus(invoiceData.status || 'draft')
            setIsFromDatabase(true)
            
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
        }
      } else if (location.state?.invoiceData) {
        // From create page
        setInvoiceData(location.state.invoiceData)
        setIsFromDatabase(false)
        setDbStatus('draft') // Default status for new invoices
        
        // Load payment methods for localStorage data
        if (user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('payment_methods')
              .eq('id', user.id)
              .single()

            if (profileData?.payment_methods) {
              const allPaymentMethods = profileData.payment_methods || []
              const selectedIds = location.state.invoiceData.selectedPaymentMethodIds || []
              const selectedPaymentMethods = allPaymentMethods.filter((method: any) => 
                selectedIds.includes(method.id)
              )
              setPaymentMethods(selectedPaymentMethods)
            }
          } catch (error) {
            console.error('Error loading payment methods:', error)
          }
        }
      } else {
        toast.error('No invoice data found')
        navigate('/invoices')
      }
    }

    if (user) {
      loadInvoiceData()
    }
  }, [searchParams, location.state, navigate, user])

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
      backgroundColor: brandColors.primary[50],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth < 768 ? '1rem 0.5rem' : '2rem 1rem', // Mobile responsive padding
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
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          padding: window.innerWidth < 768 ? '1rem' : '1.5rem', // More compact padding
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
          position: 'relative',
          width: '100%'
        }}>
        
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '3rem',
          paddingBottom: '2rem',
          borderBottom: `2px solid ${brandColors.neutral[200]}`
        }}>
          {/* Left - Logo space / Company name */}
          <div>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: '700',
              color: brandColors.primary[600],
              margin: '0 0 0.5rem 0'
            }}>
              INVOICE
            </h1>
          </div>
        </div>

        {/* Invoice Details Bar */}
        {(() => {
          // Count available fields
          const availableFields = [
            'invoiceNumber',
            'invoiceDate', 
            'dueDate',
            ...(invoiceData.poNumber ? ['poNumber'] : []),
            ...(invoiceData.taxId ? ['taxId'] : [])
          ];
          const fieldCount = availableFields.length;
          
          // Calculate optimal grid layout
          const getGridColumns = () => {
            if (window.innerWidth < 768) return '1fr'; // Mobile: single column
            if (fieldCount <= 2) return 'repeat(2, 1fr)'; // 2 items: 2 columns
            if (fieldCount <= 4) return 'repeat(2, 1fr)'; // 3-4 items: 2 columns
            if (fieldCount <= 6) return 'repeat(3, 1fr)'; // 5-6 items: 3 columns
            return 'repeat(4, 1fr)'; // 7+ items: 4 columns
          };

          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: getGridColumns(),
              gap: '1rem',
              padding: '1rem',
              backgroundColor: brandColors.neutral[50],
              borderRadius: '8px',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
          {/* Status Button - Top Right */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Status
              </div>
              <StatusButton 
                status={dbStatus}
                size="sm"
              />
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: brandColors.neutral[500],
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Invoice Number
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900]
            }}>
              {invoiceData.invoiceNumber}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: brandColors.neutral[500],
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Issue Date
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900]
            }}>
              {new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: brandColors.neutral[500],
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Due Date
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.error[600]
            }}>
              {new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>

          {invoiceData.poNumber && (
            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                PO Number
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900]
              }}>
                {invoiceData.poNumber}
              </div>
            </div>
          )}

          {invoiceData.taxId && (
            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Tax ID / VAT
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900]
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
            ? (window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 ? '1fr 1fr' : '1fr 1fr')
            : '1fr',
          gap: window.innerWidth < 768 ? '1rem' : '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Bill To */}
          <div>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: brandColors.neutral[700],
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Bill To
            </h3>
            <div style={{
              padding: '1.25rem',
              backgroundColor: brandColors.neutral[50],
              borderRadius: '8px',
              border: `1px solid ${brandColors.neutral[200]}`
            }}>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: brandColors.neutral[900],
                marginBottom: '0.75rem'
              }}>
                {invoiceData.clientName}
              </div>
              {invoiceData.clientCompanyName && (
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Building size={14} />
                  {invoiceData.clientCompanyName}
                </div>
              )}
              {invoiceData.clientEmail && (
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Mail size={14} />
                  {invoiceData.clientEmail}
                </div>
              )}
              {invoiceData.clientPhone && (
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Phone size={14} />
                  {invoiceData.clientPhone}
                </div>
              )}
              {invoiceData.clientAddress && (
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
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
                color: brandColors.neutral[700],
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Ship To
              </h3>
              <div style={{
                padding: '1.25rem',
                backgroundColor: brandColors.primary[50],
                borderRadius: '8px',
                border: `1px solid ${brandColors.primary[200]}`
              }}>
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: brandColors.neutral[900],
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Truck size={18} color={brandColors.primary[600]} />
                  {invoiceData.shipToName}
                </div>
                {invoiceData.shipToAddress && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700],
                    marginBottom: '0.25rem'
                  }}>
                    {invoiceData.shipToAddress}
                  </div>
                )}
                {(invoiceData.shipToCity || invoiceData.shipToState || invoiceData.shipToZip) && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700]
                  }}>
                    {[invoiceData.shipToCity, invoiceData.shipToState, invoiceData.shipToZip]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {invoiceData.shipToCountry && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700]
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
            color: brandColors.neutral[700],
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Items
          </h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                backgroundColor: brandColors.neutral[100],
                borderBottom: `2px solid ${brandColors.neutral[300]}`
              }}>
                <th style={{
                  textAlign: 'left',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Description
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Qty
                </th>
                <th style={{
                  textAlign: 'right',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Unit Price
                </th>
                {invoiceData.items.some(item => item.discount > 0) && (
                  <th style={{
                    textAlign: 'center',
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
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
                    color: brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Tax %
                  </th>
                )}
                <th style={{
                  textAlign: 'right',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: brandColors.neutral[700],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
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
                    color: brandColors.neutral[900],
                    textAlign: 'left'
                  }}>
                    {item.description}
                  </td>
                  <td style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700],
                    textAlign: 'center'
                  }}>
                    {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700],
                    textAlign: 'right'
                  }}>
                    {invoiceData.currencySymbol}{item.unitPrice.toFixed(2)}
                  </td>
                  {invoiceData.items.some(item => item.discount > 0) && (
                    <td style={{
                      padding: '0.75rem 0.5rem',
                      fontSize: '0.875rem',
                      color: item.discount > 0 ? brandColors.error[600] : brandColors.neutral[400],
                      textAlign: 'center'
                    }}>
                      {item.discount > 0 ? `${item.discount}%` : '-'}
                    </td>
                  )}
                  {invoiceData.items.some(item => item.taxRate > 0) && (
                    <td style={{
                      padding: '0.75rem 0.5rem',
                      fontSize: '0.875rem',
                      color: brandColors.neutral[700],
                      textAlign: 'center'
                    }}>
                      {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                    </td>
                  )}
                  <td style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    textAlign: 'right'
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
        {paymentMethods.length > 0 && (
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
            
            <div style={{
              marginBottom: '1rem'
            }}>
              {invoiceData.termsAndConditions ? (
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line'
                }}>
                  {invoiceData.termsAndConditions}
                </div>
              ) : (
                <>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    marginBottom: '0.5rem',
                    lineHeight: '1.6'
                  }}>
                    <strong>Payment Terms:</strong> Net 30 days. Late payments subject to 1.5% monthly interest charge.
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    lineHeight: '1.6'
                  }}>
                    <strong>Payment Due:</strong> Payment is due within 30 days from invoice date. Please include invoice number with payment.
                  </p>
                </>
              )}
            </div>

            {/* Payment Methods Grid */}
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
                          {details.accountType && <div>Account Type: {details.accountType}</div>}
                          <div>Sort Code: {details.sortCode}</div>
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
                          <div>{details.instructions}</div>
                        </div>
                      )}
                      {method.type === 'crypto' && details && (
                        <div>
                          <div>{details.cryptocurrency}: {details.walletAddress}</div>
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
              color: brandColors.neutral[700],
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Notes
            </h3>
            <div style={{
              fontSize: '0.875rem',
              color: brandColors.neutral[700],
              whiteSpace: 'pre-line',
              lineHeight: '1.6'
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
          justifyContent: 'center'
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
            size="md"
            variant="primary"
          />
          
          <SendButton 
            invoiceData={invoiceData}
            userData={user}
            size="md"
            variant="secondary"
          />
        </div>

      </div>

    </div>
  )
}

