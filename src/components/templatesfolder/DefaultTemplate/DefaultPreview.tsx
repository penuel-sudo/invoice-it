import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { brandColors } from '../../../stylings'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { InvoiceData } from '../../../lib/storage/invoiceStorage'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
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
import StatusButton from '../../StatusButton'
import SendButton from '../../buttons/SendButton'
import EditButton from '../../buttons/EditButton'
import DownloadButton from '../../buttons/DownloadButton'
import ShareButton from '../../buttons/ShareButton'


export default function InvoicePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [dbStatus, setDbStatus] = useState<string>('pending')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadInvoiceData = async () => {
      // First check URL parameter for invoice number
      const invoiceNumber = getInvoiceFromUrl(searchParams)
      
      if (invoiceNumber) {
        setLoading(true)
        try {
          // Load invoice from database using invoice number
          const { data, error } = await supabase
            .from('transactions')
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
              setInvoiceData(savedData)
              setLoading(false)
              return
            }
            
            // Check state data
            if (location.state?.invoiceData && location.state.invoiceData.invoiceNumber === invoiceNumber) {
              console.log('Found invoice in state')
              setInvoiceData(location.state.invoiceData)
              setLoading(false)
              return
            }
            
            // If not found anywhere, show error
            console.log('Invoice not found anywhere')
            toast.error('Invoice not found')
            navigate('/invoices')
            return
          }

          if (data) {
            // Convert database transaction to InvoiceData format
            const invoiceData: InvoiceData = {
              invoiceNumber: data.invoice_number,
              invoiceDate: data.issue_date,
              dueDate: data.due_date,
              clientName: data.client_name || '',
              clientCompanyName: data.client_company_name || '',
              clientEmail: data.client_email || '',
              clientPhone: data.client_phone || '',
              clientAddress: data.client_address || '',
              items: data.items || [],
              subtotal: data.subtotal || 0,
              taxTotal: data.tax_amount || 0,
              grandTotal: data.total_amount || 0,
              notes: data.notes || ''
            }
            setInvoiceData(invoiceData)
            setDbStatus(data.status || 'pending')
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
        // Update URL to include invoice number
        if (location.state.invoiceData.invoiceNumber) {
          setSearchParams({ invoice: location.state.invoiceData.invoiceNumber })
        }
      } else {
        // Try to get data from localStorage
        const savedData = invoiceStorage.getDraft()
        if (savedData) {
          setInvoiceData(savedData)
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

  // Set status from form data or default to pending
  useEffect(() => {
    if (invoiceData) {
      // For new invoices (form data), default to pending
      // For existing invoices, the status would come from the database
      setDbStatus('pending')
    }
  }, [invoiceData])

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
              ${invoiceData.grandTotal.toFixed(2)}
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
                  <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                    {item.quantity} {item.description}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                    ${item.lineTotal.toFixed(2)}
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
                      ${invoiceData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                      Tax
                    </span>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                      ${invoiceData.taxTotal.toFixed(2)}
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
                  ${invoiceData.grandTotal.toFixed(2)}
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
          <EditButton 
            onEdit={handleEdit}
            size="md"
            variant="secondary"
          />
          
          <DownloadButton 
            invoiceData={invoiceData}
            user={user}
            size="md"
            variant="primary"
          />
          
          <SendButton 
            invoiceData={invoiceData}
            size="md"
            variant="secondary"
          />
          
          <ShareButton 
            invoiceData={invoiceData}
            size="md"
            variant="secondary"
          />
        </div>

      </div>

    </div>
  )
}