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

  const handleDownload = () => {
    // TODO: Implement PDF download
    toast.success('PDF download will be implemented in Phase 1 final step!')
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
      backgroundColor: brandColors.neutral[50],
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0
          }}>
            Invoice Preview
          </h1>
        </div>

        {/* Invoice Preview */}
        <div style={{
          padding: window.innerWidth < 768 ? '1rem' : '1rem',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '5rem' // Space for bottom buttons
        }}>
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: window.innerWidth < 768 ? '1rem 1.25rem' : '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[200]}`,
            width: '100%',
            maxWidth: '700px',
            minHeight: '600px'
          }}>
            {/* Top Section */}
            <div style={{
              marginBottom: '2rem'
            }}>
              {/* Payment Status and Status Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: brandColors.primary[100],
                  color: brandColors.primary[700],
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  Payment - {invoiceData.invoiceNumber}
                </div>
                
                <StatusButton 
                  status={dbStatus} 
                  size="sm" 
                />
              </div>

              {/* Total Amount - Prominently Displayed */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '700',
                  color: brandColors.primary[600], // Bold brand green
                  marginBottom: '0.5rem',
                }}>
                  ${invoiceData.grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Issuer Info Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: window.innerWidth < 768 ? '1.25rem' : '1rem',
                marginBottom: '2rem',
                padding: window.innerWidth < 768 ? '1.5rem' : '1rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: brandColors.primary[100],
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.primary[700],
                  flexShrink: 0
                }}>
                  {user.user_metadata?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'BI'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '0.25rem'
                  }}>
                    {user.user_metadata?.full_name || 'Your Business'}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600]
                  }}>
                    {new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
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
                    {new Date(invoiceData.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Grey Card */}
            <div style={{
              backgroundColor: brandColors.neutral[50],
              borderRadius: '12px',
              padding: window.innerWidth < 768 ? '2rem' : '1.5rem',
              marginBottom: '2rem',
              border: `1px solid ${brandColors.neutral[200]}`
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                textAlign: 'center'
              }}>
                Invoice Details
              </h3>
              
              {/* Client Info - Enhanced */}
              <div style={{
                marginBottom: window.innerWidth < 768 ? '2rem' : '1.5rem',
                padding: '1rem',
                backgroundColor: brandColors.primary[25], // Very light brand green background
                borderRadius: '8px',
                border: `1px solid ${brandColors.primary[100]}`
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.primary[700],
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  Bill To:
                </div>
                
                {/* Three-column layout for client info */}
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  alignItems: 'flex-start'
                }}>
                  {/* Left column - Name and Company */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: brandColors.neutral[900],
                      marginBottom: '0.5rem'
                    }}>
                      {invoiceData.clientName}
                    </div>
                    
                    {invoiceData.clientCompanyName && (
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700]
                      }}>
                        {invoiceData.clientCompanyName}
                      </div>
                    )}
                  </div>
                  
                  {/* Middle column - Contact details */}
                  <div style={{ flex: 1 }}>
                    {/* Email */}
                    {invoiceData.clientEmail && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: brandColors.neutral[600],
                        marginBottom: '0.5rem'
                      }}>
                        <Mail size={16} color={brandColors.neutral[500]} />
                        {invoiceData.clientEmail}
                      </div>
                    )}
                    
                    {/* Phone */}
                    {invoiceData.clientPhone && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: brandColors.neutral[600]
                      }}>
                        <Phone size={16} color={brandColors.neutral[500]} />
                        {invoiceData.clientPhone}
                      </div>
                    )}
                  </div>
                  
                  {/* Right column - Address */}
                  <div style={{ flex: 1 }}>
                    {invoiceData.clientAddress && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: brandColors.neutral[600],
                        lineHeight: '1.4'
                      }}>
                        <MapPin size={16} color={brandColors.neutral[500]} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{invoiceData.clientAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Service Items */}
              <div style={{
                marginBottom: '1rem'
              }}>
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: window.innerWidth < 768 ? '0.75rem 0' : '0.5rem 0',
                    borderBottom: index < invoiceData.items.length - 1 ? `1px solid ${brandColors.neutral[200]}` : 'none'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: brandColors.neutral[700],
                      fontWeight: '500',
                      wordBreak: 'break-word',
                      maxWidth: '60%',
                      paddingRight: '1rem'
                    }}>
                      {item.quantity} {item.description}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: brandColors.neutral[900],
                      fontWeight: '600'
                    }}>
                      ${item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Separator Line */}
              <div style={{
                borderTop: `1px solid ${brandColors.neutral[200]}`,
                margin: '1rem 0'
              }}></div>
              
              {/* Totals Section */}
              <div style={{
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: window.innerWidth < 768 ? '0.5rem 0' : '0.25rem 0'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[600]
                  }}>
                    Subtotal:
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[900]
                  }}>
                    ${invoiceData.subtotal.toFixed(2)}
                  </span>
                </div>
                
                {invoiceData.taxTotal > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: window.innerWidth < 768 ? '0.5rem 0' : '0.25rem 0'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: brandColors.neutral[600]
                    }}>
                      Tax:
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[900]
                    }}>
                      ${invoiceData.taxTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: window.innerWidth < 768 ? '0.75rem 0' : '0.5rem 0',
                  borderTop: `1px solid ${brandColors.neutral[200]}`,
                  marginTop: window.innerWidth < 768 ? '0.75rem' : '0.5rem'
                }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: brandColors.neutral[900]
                  }}>
                    Total:
                  </span>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: brandColors.neutral[900]
                  }}>
                    ${invoiceData.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Notes Section */}
              {invoiceData.notes && (
                <>
                  <div style={{
                    borderTop: `1px solid ${brandColors.neutral[200]}`,
                    margin: '1rem 0',
                    paddingTop: '1rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: brandColors.neutral[700],
                      marginBottom: '0.5rem'
                    }}>
                      Notes:
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: brandColors.neutral[600],
                      lineHeight: '1.4',
                      whiteSpace: 'pre-line'
                    }}>
                      {invoiceData.notes}
                    </div>
                  </div>
                </>
              )}
              
              {/* Disclaimer */}
              <div style={{
                borderTop: `1px solid ${brandColors.neutral[200]}`,
                marginTop: '1rem',
                paddingTop: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[400],
                  marginBottom: '0.25rem'
                }}>
                  Generated by InvoiceIt
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: brandColors.neutral[300],
                  fontStyle: 'italic'
                }}>
                  Thanks for doing business with us
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: brandColors.white,
          padding: '0.75rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${brandColors.neutral[200]}`,
          maxWidth: 'calc(100vw - 2rem)',
          overflowX: 'auto'
        }}>
          <button
            onClick={handleEdit}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: brandColors.neutral[100],
              color: brandColors.neutral[600],
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Edit size={14} />
            Edit
          </button>
          
          <button
            onClick={handleDownload}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Download size={14} />
            PDF
          </button>
          
          <button
            onClick={handleSend}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: brandColors.neutral[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Send size={14} />
            Send
          </button>
          
          <button
            onClick={handleShare}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: brandColors.neutral[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Share2 size={14} />
            Share
          </button>
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