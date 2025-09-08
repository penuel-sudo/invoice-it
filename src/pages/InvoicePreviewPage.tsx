import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { 
  ArrowLeft, 
  Edit, 
  Download,
  Send,
  Share2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  lineTotal: number
}

interface InvoiceData {
  clientName: string
  clientEmail: string
  clientAddress: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  items: InvoiceItem[]
  notes: string
  subtotal: number
  taxTotal: number
  grandTotal: number
}

export default function InvoicePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)

  useEffect(() => {
    if (location.state?.invoiceData) {
      setInvoiceData(location.state.invoiceData)
    } else {
      // If no data, redirect back to create page
      navigate('/invoice/new')
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
      <Layout>
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
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{
        paddingBottom: '4rem',
        backgroundColor: brandColors.neutral[50],
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
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`,
            width: '100%',
            maxWidth: '800px',
            minHeight: '800px'
          }}>
            {/* Invoice Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: `2px solid ${brandColors.primary[200]}`
            }}>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: brandColors.primary[600],
                  margin: '0 0 0.5rem 0'
                }}>
                  INVOICE
                </h1>
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.5'
                }}>
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    {user.user_metadata?.full_name || 'Your Business Name'}
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    {user.email}
                  </p>
                  <p style={{ margin: 0 }}>
                    Your Business Address
                  </p>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  marginBottom: '0.5rem'
                }}>
                  {invoiceData.invoiceNumber}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.5'
                }}>
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    <strong>Date:</strong> {new Date(invoiceData.invoiceDate).toLocaleDateString()}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Due:</strong> {new Date(invoiceData.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.75rem 0'
                }}>
                  Bill To:
                </h3>
                <div style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[700],
                  lineHeight: '1.5'
                }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600' }}>
                    {invoiceData.clientName}
                  </p>
                  {invoiceData.clientEmail && (
                    <p style={{ margin: '0 0 0.25rem 0' }}>
                      {invoiceData.clientEmail}
                    </p>
                  )}
                  {invoiceData.clientAddress && (
                    <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                      {invoiceData.clientAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{
              marginBottom: '2rem'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: brandColors.neutral[50],
                    borderBottom: `2px solid ${brandColors.neutral[200]}`
                  }}>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: brandColors.neutral[700]
                    }}>
                      Description
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: brandColors.neutral[700]
                    }}>
                      Qty
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: brandColors.neutral[700]
                    }}>
                      Unit Price
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: brandColors.neutral[700]
                    }}>
                      Tax %
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: brandColors.neutral[700]
                    }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id} style={{
                      borderBottom: `1px solid ${brandColors.neutral[200]}`,
                      backgroundColor: index % 2 === 0 ? brandColors.white : brandColors.neutral[25]
                    }}>
                      <td style={{
                        padding: '0.75rem',
                        color: brandColors.neutral[900]
                      }}>
                        {item.description}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        color: brandColors.neutral[700]
                      }}>
                        {item.quantity}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: brandColors.neutral[700]
                      }}>
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        color: brandColors.neutral[700]
                      }}>
                        {item.taxRate}%
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontWeight: '500',
                        color: brandColors.neutral[900]
                      }}>
                        ${item.lineTotal.toFixed(2)}
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
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '300px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: `1px solid ${brandColors.neutral[200]}`
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
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: `1px solid ${brandColors.neutral[200]}`
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
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0',
                  borderTop: `2px solid ${brandColors.primary[200]}`,
                  borderBottom: `2px solid ${brandColors.primary[200]}`
                }}>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: brandColors.neutral[900]
                  }}>
                    Total:
                  </span>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: brandColors.primary[600]
                  }}>
                    ${invoiceData.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {invoiceData.notes && (
              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: '8px',
                border: `1px solid ${brandColors.neutral[200]}`
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[700],
                  margin: '0 0 0.5rem 0'
                }}>
                  Notes:
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
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.75rem',
          backgroundColor: brandColors.white,
          padding: '1rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${brandColors.neutral[200]}`
        }}>
          <button
            onClick={handleEdit}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: brandColors.neutral[100],
              color: brandColors.neutral[600],
              border: 'none',
              borderRadius: '12px',
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
              padding: '0.75rem 1.5rem',
              backgroundColor: brandColors.primary[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={16} />
            Download PDF
          </button>
          
          <button
            onClick={handleSend}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: brandColors.success[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Send size={16} />
            Send
          </button>
          
          <button
            onClick={handleShare}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: brandColors.warning[600],
              color: brandColors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>
    </Layout>
  )
}
