import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { brandColors } from '../../../stylings'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { InvoiceData, PaymentMethod } from '../../../lib/storage/invoiceStorage'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
import { getCurrencySymbol } from '../../../lib/currencyUtils'
import { 
  ArrowLeft, 
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
// Lazy load heavy button components
import { lazy, Suspense } from 'react'

const StatusButton = lazy(() => import('../../StatusButton'))
const SendButton = lazy(() => import('../../buttons/SendButton'))
const EditButton = lazy(() => import('../../buttons/EditButton'))

// DownloadButton with heavy PDF dependencies - load separately
const DownloadButton = lazy(() => import('../../buttons/DownloadButton'))


export default function InvoicePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [dbStatus, setDbStatus] = useState<string>('draft')
  const [loading, setLoading] = useState(false)
  const [isFromDatabase, setIsFromDatabase] = useState(false)

  useEffect(() => {
    const loadInvoiceData = async () => {
      // First check URL parameter for invoice number
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      if (invoiceNumber) {
        setLoading(true)
        try {
          // Load invoice from database using invoice number with proper joins
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
              *,
              clients (
                name,
                email,
                address,
                phone,
                company_name
              ),
              invoice_items (
                description,
                quantity,
                unit_price,
                tax_rate,
                line_total
              )
            `)
            .eq('invoice_number', invoiceNumber)
            .eq('user_id', user?.id)
            .single()

          if (invoiceError) {
            console.log('Invoice not found in database, checking localStorage and state...')
            
            // Check state data first (from create page navigation)
            if (location.state?.invoiceData && location.state.invoiceData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in state (create → preview flow)')
              setInvoiceData(location.state.invoiceData)
              setIsFromDatabase(false)
              setLoading(false)
              return
            }
            
            // Check localStorage for this invoice number
            const savedData = invoiceStorage.getDraft()
            if (savedData && savedData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in localStorage')
              setInvoiceData(savedData)
              setIsFromDatabase(false)
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
            // Convert database invoice to InvoiceData format
            const currencyCode = invoiceData.currency_code || 'USD'
            const transformedData: InvoiceData = {
              invoiceNumber: invoiceData.invoice_number,
              invoiceDate: invoiceData.issue_date,
              dueDate: invoiceData.due_date,
              clientName: invoiceData.clients?.name || '',
              clientCompanyName: invoiceData.clients?.company_name || '',
              clientEmail: invoiceData.clients?.email || '',
              clientPhone: invoiceData.clients?.phone || '',
              clientAddress: invoiceData.clients?.address || '',
              items: invoiceData.invoice_items?.map(item => ({
                id: Date.now().toString(), // Generate ID for form compatibility
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                taxRate: item.tax_rate,
                lineTotal: item.line_total
              })) || [],
              subtotal: invoiceData.subtotal || 0,
              taxTotal: invoiceData.tax_amount || 0,
              grandTotal: invoiceData.total_amount || 0,
              notes: invoiceData.notes || '',
              currency: currencyCode,
              currencySymbol: getCurrencySymbol(currencyCode),
              paymentDetails: invoiceData.payment_details || undefined,
              paymentMethods: invoiceData.payment_methods || [],
              selectedPaymentMethodIds: invoiceData.selected_payment_method_ids || []
            }
            setInvoiceData(transformedData)
            setDbStatus(invoiceData.status || 'draft')
            setIsFromDatabase(true)
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
        setInvoiceData(location.state.invoiceData)
        setIsFromDatabase(false)
        // Update URL to include invoice number
        if (location.state.invoiceData.invoiceNumber) {
          setSearchParams({ invoice: location.state.invoiceData.invoiceNumber })
        }
      } else {
        // Try to get data from localStorage
        const savedData = invoiceStorage.getDraft()
        if (savedData) {
          setInvoiceData(savedData)
          setIsFromDatabase(false)
          // Update URL to include invoice number
          if (savedData.invoiceNumber) {
            setSearchParams({ invoice: savedData.invoiceNumber })
          }
        } else {
          // If no data, redirect back to create page
          navigate('/invoice/create/default')
        }
      }
    }

    if (user) {
      loadInvoiceData()
    }
  }, [searchParams, location.state, navigate, user])

  // Set status based on data source
  useEffect(() => {
    if (invoiceData) {
      if (isFromDatabase) {
        // Status already set from database in loadInvoiceData
        // Don't override it
      } else {
        // For new invoices (form data), default to draft
        setDbStatus('draft')
      }
    }
  }, [invoiceData, isFromDatabase])

  // Update URL when invoice data changes
  useEffect(() => {
    if (invoiceData?.invoiceNumber) {
      setSearchParams({ invoice: invoiceData.invoiceNumber })
    }
  }, [invoiceData?.invoiceNumber, setSearchParams])

  const handleEdit = () => {
    if (invoiceData) {
      navigate('/invoice/create/default', { 
        state: { invoiceData } 
      })
    }
  }

  if (!user || loading) { 
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: brandColors.white
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            marginBottom: '0.5rem'
          }}>
            Loading Invoice...
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: brandColors.neutral[600]
          }}>
            Please wait while we load your invoice preview.
          </p>
        </div>
      </div>
    )
  }

  if (!invoiceData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: brandColors.white
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            marginBottom: '0.5rem'
          }}>
            Invoice Not Found
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: brandColors.neutral[600]
          }}>
            The requested invoice could not be found.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.primary[50],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
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
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Invoice Preview Card */}
        <div style={{
          backgroundColor: brandColors.white,
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
          position: 'relative'
        }}>
          {/* Payment Badge and Status */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            right: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: brandColors.primary[100],
              color: brandColors.primary[700],
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Payment - {invoiceData.invoiceNumber}
            </div>
            <StatusButton 
              status={dbStatus} 
              size="sm" 
            />
          </div>

          {/* Amount */}
          <div style={{
            marginTop: '2rem',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem 0'
            }}>
              {invoiceData.currencySymbol || '$'}{invoiceData.grandTotal.toFixed(2)}
            </h1>
          </div>

          {/* Client Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: brandColors.neutral[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[600]
              }}>
                {invoiceData.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.125rem 0'
                }}>
                  {invoiceData.clientName}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[500],
                  margin: 0
                }}>
                  {new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div style={{
              textAlign: 'right'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem'
              }}>
                Due
              </div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[900]
              }}>
                {Math.ceil((new Date(invoiceData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div style={{
            backgroundColor: brandColors.neutral[50],
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 0.75rem 0'
            }}>
              Invoice Details
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {invoiceData.items.map((item, index) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: brandColors.neutral[600],
                    wordBreak: 'break-word'
                  }}>
                    {item.quantity} {item.description}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                    {invoiceData.currencySymbol || '$'}{item.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
              
              {/* Subtotal and Tax Section (only show if tax exists) */}
              {invoiceData.taxTotal > 0 && (
                <>
                  <div style={{
                    borderTop: `1px solid ${brandColors.neutral[200]}`,
                    paddingTop: '0.5rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                      Subtotal
                    </span>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                      {invoiceData.currencySymbol || '$'}{invoiceData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                      Tax
                    </span>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                      {invoiceData.currencySymbol || '$'}{invoiceData.taxTotal.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              
              {/* Total Section (separate from subtotal/tax) */}
              <div style={{
                borderTop: `1px solid ${brandColors.neutral[200]}`,
                paddingTop: '0.5rem',
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: brandColors.neutral[900] }}>
                  TOTAL
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: brandColors.neutral[900] }}>
                  {invoiceData.currencySymbol || '$'}{invoiceData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Notes Section */}
            {invoiceData.notes && (
              <div style={{
                borderTop: `1px solid ${brandColors.neutral[200]}`,
                margin: '1rem 0 0 0',
                paddingTop: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Notes:
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.4',
                  whiteSpace: 'pre-line'
                }}>
                  {invoiceData.notes}
                </div>
              </div>
            )}

            {/* Payment Methods Section */}
            {invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0 && (
              <div style={{
                borderTop: `1px solid ${brandColors.neutral[200]}`,
                margin: '1rem 0 0 0',
                paddingTop: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: brandColors.neutral[700],
                  marginBottom: '0.75rem'
                }}>
                  Payment Methods:
                </div>
                {invoiceData.paymentMethods
                  .filter(method => invoiceData.selectedPaymentMethodIds?.includes(method.id))
                  .map((method) => {
                    const details = method.details as any
                    return (
                      <div
                        key={method.id}
                        style={{
                          fontSize: '0.7rem',
                          color: brandColors.neutral[600],
                          lineHeight: '1.6',
                          marginBottom: '0.75rem',
                          padding: '0.5rem',
                          backgroundColor: brandColors.neutral[50],
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: brandColors.neutral[800], marginBottom: '0.25rem' }}>
                          {method.label}
                        </div>
                        {method.type === 'bank_local_us' && (
                          <>
                            <div>Bank: {details.bankName}</div>
                            <div>Account: {details.accountName} ({details.accountType})</div>
                            <div>Acct #: {details.accountNumber}</div>
                            <div>Routing: {details.routingNumber}</div>
                          </>
                        )}
                        {method.type === 'bank_local_ng' && (
                          <>
                            <div>Bank: {details.bankName}</div>
                            <div>Account Name: {details.accountName}</div>
                            <div>Account #: {details.accountNumber}</div>
                            <div>Bank Code: {details.bankCode}</div>
                          </>
                        )}
                        {method.type === 'bank_international' && (
                          <>
                            <div>Bank: {details.bankName}</div>
                            <div>Beneficiary: {details.accountName}</div>
                            <div>IBAN: {details.iban}</div>
                            <div>SWIFT: {details.swiftCode}</div>
                            <div>Address: {details.bankAddress}, {details.bankCity}, {details.bankCountry}</div>
                          </>
                        )}
                        {method.type === 'paypal' && (
                          <div>Email: {details.email}</div>
                        )}
                        {method.type === 'crypto' && (
                          <>
                            <div>Network: {details.network}</div>
                            <div style={{ wordBreak: 'break-all' }}>Address: {details.walletAddress}</div>
                          </>
                        )}
                        {method.type === 'other' && (
                          <div>{details.instructions}</div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
            
            {/* Disclaimer */}
            <div style={{
              borderTop: `1px solid ${brandColors.neutral[200]}`,
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: brandColors.neutral[400],
                marginBottom: '0.25rem'
              }}>
                Generated by InvoiceIt
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: brandColors.neutral[300],
                fontStyle: 'italic'
              }}>
                Thanks for doing business with us
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center'
        }}>
          <Suspense fallback={<div style={{ padding: '12px', color: '#666' }}>Loading buttons...</div>}>
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
              template="default"
              size="md"
              variant="primary"
            />
            
            <SendButton 
              invoiceData={invoiceData}
              userData={user}
              size="md"
              variant="secondary"
            />
            
          </Suspense>
        </div>

      </div>

    </div>
  )
}