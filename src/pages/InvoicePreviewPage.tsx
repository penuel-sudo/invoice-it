import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { invoiceStorage } from '../lib/storage/invoiceStorage'
import type { InvoiceData } from '../lib/storage/invoiceStorage'
import { supabase } from '../lib/supabaseClient'
import { 
  ArrowLeft, 
  Edit, 
  Download,
  Send,
  Share2,
  FileText,
  Copy,
  Check,
  X,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'
import StatusButton from '../components/StatusButton'


export default function InvoicePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dbStatus, setDbStatus] = useState<string>('pending')

  useEffect(() => {
    if (location.state?.invoiceData) {
      setInvoiceData(location.state.invoiceData)
    } else {
      // Try to get data from localStorage
      const savedData = invoiceStorage.getDraft()
      if (savedData) {
        setInvoiceData(savedData)
      } else {
        // If no data, redirect back to create page
        navigate('/invoice/new')
      }
    }
  }, [location.state, navigate])

  // Set status from form data or default to pending
  useEffect(() => {
    if (invoiceData) {
      // For new invoices (form data), default to pending
      // For existing invoices, the status would come from the database
      setDbStatus('pending')
    }
  }, [invoiceData])

  const handleEdit = () => {
    if (invoiceData) {
      navigate('/invoice/new', { 
        state: { invoiceData } 
      })
    }
  }

  const handleDownload = async () => {
    if (!invoiceData || !user) {
      toast.error('Invoice data not available')
      return
    }

    try {
      // Show loading state
      toast.loading('Generating PDF...', { id: 'pdf-generation' })
      
      // Prepare data for API
      const requestData = {
        invoiceData,
        user: {
          user_metadata: {
            full_name: user.user_metadata?.full_name || 'Your Business'
          },
          email: user.email
        }
      }
      
      // Call serverless function
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Get PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceData.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Success feedback
      toast.success('PDF downloaded successfully!', { id: 'pdf-generation' })
      
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-generation' })
    }
  }

  const handleSend = () => {
    // TODO: Implement email sending
    toast('Email sending will be available in Phase 2!', {
      icon: 'ℹ️',
    })
  }

  const handleShare = () => {
    setShowSharePopup(true)
  }

  const handleCopyLink = async () => {
    const invoiceLink = `${window.location.origin}/invoice/preview?invoice=${invoiceData?.invoiceNumber}`
    try {
      await navigator.clipboard.writeText(invoiceLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleCloseSharePopup = () => {
    setShowSharePopup(false)
    setCopied(false)
  }

  if (!user || !invoiceData) { 
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
          <button
            onClick={handleEdit}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              color: brandColors.primary[600],
              border: `2px solid ${brandColors.primary[200]}`,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              maxWidth: '100px'
            }}
          >
            Edit
          </button>
          
          <button
            onClick={handleDownload}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              maxWidth: '100px'
            }}
          >
            PDF
          </button>
          
          <button
            onClick={handleSend}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: brandColors.neutral[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              maxWidth: '100px'
            }}
          >
            Send
          </button>
          
          <button
            onClick={handleShare}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: brandColors.neutral[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              maxWidth: '100px'
            }}
          >
            Share
          </button>
        </div>

      </div>

      {/* Share Popup */}
      {showSharePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Share Invoice
              </h3>
              <button
                onClick={handleCloseSharePopup}
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
                <X size={20} color={brandColors.neutral[600]} />
              </button>
            </div>

            {/* Link Input */}
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <label style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: brandColors.neutral[700],
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Invoice Link
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: brandColors.neutral[50],
                border: `1px solid ${brandColors.neutral[200]}`,
                borderRadius: '8px'
              }}>
                <input
                  type="text"
                  value={`${window.location.origin}/invoice/preview?invoice=${invoiceData?.invoiceNumber}`}
                  readOnly
                  style={{
                    flex: 1,
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600],
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: copied ? brandColors.success[100] : brandColors.primary[100],
                    color: copied ? brandColors.success[600] : brandColors.primary[600],
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={() => {
                // TODO: Implement platform sharing
                toast('Platform sharing will be available in Phase 2!', {
                  icon: 'ℹ️',
                })
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
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
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[600]
              }}
            >
              <Share2 size={16} />
              Share to Platforms
            </button>
          </div>
        </div>
      )}
    </div>
  )
}