import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { invoiceStorage } from '../lib/storage/invoiceStorage'
import type { InvoiceData } from '../lib/storage/invoiceStorage'
import { 
  ArrowLeft, 
  Edit, 
  Download,
  Send,
  Share2,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'


export default function InvoicePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)

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
    // TODO: Implement share link
    toast('Share link will be available in Phase 2!', {
      icon: 'ℹ️',
    })
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
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              Invoice Preview
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleEdit}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.neutral[100],
                color: brandColors.neutral[600],
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Edit size={16} />
              Edit
            </button>
            
            <button
              onClick={handleDownload}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div style={{
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '5rem' // Space for bottom buttons
        }}>
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[200]}`,
            width: '100%',
            maxWidth: '600px',
            minHeight: '600px'
          }}>
            {/* Invoice Header - Reorganized to match image */}
            <div style={{
              marginBottom: '2rem'
            }}>
              {/* Payment Status Tag */}
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
              </div>

              {/* Total Amount - Prominently Displayed */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '700',
                  color: brandColors.neutral[900],
                  marginBottom: '0.5rem'
                }}>
                  ${invoiceData.grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Client Info Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: brandColors.neutral[300],
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.neutral[700],
                  flexShrink: 0
                }}>
                  {invoiceData.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: brandColors.neutral[900],
                    marginBottom: '0.25rem'
                  }}>
                    {invoiceData.clientName}
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
                  width: '32px',
                  height: '32px',
                  backgroundColor: brandColors.primary[100],
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={16} color={brandColors.primary[600]} />
                </div>
              </div>
            </div>

            {/* Invoice Details Card - Matching Image Style */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: `1px solid ${brandColors.neutral[200]}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
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
              
              {/* Service Items */}
              <div style={{
                marginBottom: '1rem'
              }}>
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: index < invoiceData.items.length - 1 ? `1px solid ${brandColors.neutral[100]}` : 'none'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: brandColors.neutral[700],
                      fontWeight: '500'
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
              
              {/* Total Line */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderTop: `2px solid ${brandColors.neutral[200]}`,
                marginTop: '0.5rem'
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: brandColors.neutral[900]
                }}>
                  TOTAL
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: brandColors.neutral[900]
                }}>
                  ${invoiceData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Additional Invoice Information */}
            <div style={{
              backgroundColor: brandColors.neutral[50],
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                margin: '0 0 1rem 0'
              }}>
                Invoice Information
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                fontSize: '0.875rem'
              }}>
                <div>
                  <span style={{ color: brandColors.neutral[600] }}>Invoice Number:</span>
                  <div style={{ fontWeight: '500', color: brandColors.neutral[900] }}>
                    {invoiceData.invoiceNumber}
                  </div>
                </div>
                <div>
                  <span style={{ color: brandColors.neutral[600] }}>Invoice Date:</span>
                  <div style={{ fontWeight: '500', color: brandColors.neutral[900] }}>
                    {new Date(invoiceData.invoiceDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span style={{ color: brandColors.neutral[600] }}>Due Date:</span>
                  <div style={{ fontWeight: '500', color: brandColors.neutral[900] }}>
                    {new Date(invoiceData.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span style={{ color: brandColors.neutral[600] }}>Subtotal:</span>
                  <div style={{ fontWeight: '500', color: brandColors.neutral[900] }}>
                    ${invoiceData.subtotal.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {invoiceData.taxTotal > 0 && (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: `1px solid ${brandColors.neutral[200]}`
                }}>
                  <span style={{ color: brandColors.neutral[600], fontSize: '0.875rem' }}>Tax Total:</span>
                  <div style={{ fontWeight: '500', color: brandColors.neutral[900], fontSize: '0.875rem' }}>
                    ${invoiceData.taxTotal.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {invoiceData.notes && (
              <div style={{
                backgroundColor: brandColors.white,
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: `1px solid ${brandColors.neutral[200]}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[700],
                  margin: '0 0 0.75rem 0'
                }}>
                  Additional Notes
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.5',
                  margin: 0,
                  whiteSpace: 'pre-line'
                }}>
                  {invoiceData.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              paddingTop: '2rem',
              borderTop: `1px solid ${brandColors.neutral[200]}`,
              color: brandColors.neutral[400],
              fontSize: '0.75rem'
            }}>
              <p style={{ margin: 0 }}>
                Thank you for your business!
              </p>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Generated by InvoiceIt
              </p>
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
      </div>
  )
}