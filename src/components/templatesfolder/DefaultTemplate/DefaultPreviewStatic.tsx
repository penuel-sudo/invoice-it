import React from 'react'
import { 
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
  XCircle
} from 'lucide-react'
import { brandColors } from '../../../stylings'

// Mock data for static preview
const mockInvoiceData = {
  clientName: 'John Smith',
  clientEmail: 'john@example.com',
  clientAddress: '123 Business St, City, State 12345',
  clientPhone: '+1 (555) 123-4567',
  clientCompanyName: 'Smith Enterprises',
  invoiceNumber: 'INV-123456',
  invoiceDate: '2024-01-15',
  dueDate: '2024-02-14',
  items: [
    {
      id: '1',
      description: 'Web Development Services',
      quantity: 40,
      unitPrice: 75,
      taxRate: 10,
      lineTotal: 3000
    },
    {
      id: '2', 
      description: 'UI/UX Design',
      quantity: 20,
      unitPrice: 50,
      taxRate: 10,
      lineTotal: 1000
    }
  ],
  notes: 'Thank you for your business! Payment is due within 30 days.',
  subtotal: 4000,
  taxTotal: 400,
  grandTotal: 4400
}

export default function DefaultPreviewStatic() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          backgroundColor: brandColors.neutral[50]
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: brandColors.neutral[900],
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.025em'
              }}>
                Invoice
              </h1>
              <p style={{
                fontSize: '1rem',
                color: brandColors.neutral[600],
                margin: 0
              }}>
                #{mockInvoiceData.invoiceNumber}
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.warning[100],
              color: brandColors.warning[700],
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <Clock size={16} />
              Draft
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
          }}>
            <div>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                margin: '0 0 0.5rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Bill To
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[600],
                lineHeight: '1.5'
              }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600' }}>
                  {mockInvoiceData.clientName}
                </p>
                {mockInvoiceData.clientCompanyName && (
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    {mockInvoiceData.clientCompanyName}
                  </p>
                )}
                {mockInvoiceData.clientEmail && (
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    {mockInvoiceData.clientEmail}
                  </p>
                )}
                {mockInvoiceData.clientPhone && (
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    {mockInvoiceData.clientPhone}
                  </p>
                )}
                {mockInvoiceData.clientAddress && (
                  <p style={{ margin: '0 0 0.25rem 0' }}>
                    {mockInvoiceData.clientAddress}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                margin: '0 0 0.5rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Invoice Details
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[600],
                lineHeight: '1.5'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.25rem'
                }}>
                  <span>Issue Date:</span>
                  <span>{new Date(mockInvoiceData.invoiceDate).toLocaleDateString()}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Due Date:</span>
                  <span>{new Date(mockInvoiceData.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ padding: '2rem' }}>
          <div style={{
            border: `1px solid ${brandColors.neutral[200]}`,
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              backgroundColor: brandColors.neutral[50],
              borderBottom: `1px solid ${brandColors.neutral[200]}`
            }}>
              <div style={{
                padding: '1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                borderRight: `1px solid ${brandColors.neutral[200]}`
              }}>
                Description
              </div>
              <div style={{
                padding: '1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                textAlign: 'center',
                borderRight: `1px solid ${brandColors.neutral[200]}`
              }}>
                Qty
              </div>
              <div style={{
                padding: '1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                textAlign: 'center',
                borderRight: `1px solid ${brandColors.neutral[200]}`
              }}>
                Rate
              </div>
              <div style={{
                padding: '1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                textAlign: 'center',
                borderRight: `1px solid ${brandColors.neutral[200]}`
              }}>
                Tax
              </div>
              <div style={{
                padding: '1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                textAlign: 'right'
              }}>
                Amount
              </div>
            </div>

            {mockInvoiceData.items.map((item, index) => (
              <div key={item.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                borderBottom: index < mockInvoiceData.items.length - 1 ? `1px solid ${brandColors.neutral[200]}` : 'none'
              }}>
                <div style={{
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: brandColors.neutral[700],
                  borderRight: `1px solid ${brandColors.neutral[200]}`
                }}>
                  {item.description}
                </div>
                <div style={{
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  textAlign: 'center',
                  borderRight: `1px solid ${brandColors.neutral[200]}`
                }}>
                  {item.quantity}
                </div>
                <div style={{
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  textAlign: 'center',
                  borderRight: `1px solid ${brandColors.neutral[200]}`
                }}>
                  ${item.unitPrice.toFixed(2)}
                </div>
                <div style={{
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  textAlign: 'center',
                  borderRight: `1px solid ${brandColors.neutral[200]}`
                }}>
                  {item.taxRate}%
                </div>
                <div style={{
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  textAlign: 'right'
                }}>
                  ${item.lineTotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              width: '300px',
              border: `1px solid ${brandColors.neutral[200]}`,
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: brandColors.neutral[50],
                borderBottom: `1px solid ${brandColors.neutral[200]}`
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[700]
                }}>
                  Subtotal
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600]
                }}>
                  ${mockInvoiceData.subtotal.toFixed(2)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: brandColors.neutral[50],
                borderBottom: `1px solid ${brandColors.neutral[200]}`
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[700]
                }}>
                  Tax
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600]
                }}>
                  ${mockInvoiceData.taxTotal.toFixed(2)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: brandColors.primary[50],
                borderTop: `2px solid ${brandColors.primary[500]}`
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: brandColors.neutral[900]
                }}>
                  Total
                </span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: brandColors.primary[600]
                }}>
                  ${mockInvoiceData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {mockInvoiceData.notes && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                margin: '0 0 0.5rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Notes
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[600],
                lineHeight: '1.5',
                margin: 0,
                padding: '1rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: '6px',
                border: `1px solid ${brandColors.neutral[200]}`
              }}>
                {mockInvoiceData.notes}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: brandColors.neutral[50],
            borderRadius: '6px',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: brandColors.neutral[500],
              margin: 0,
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              This invoice was generated electronically and is valid without a signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
