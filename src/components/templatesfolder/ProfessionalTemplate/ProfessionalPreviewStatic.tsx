import React, { useState, useEffect } from 'react'
import { brandColors } from '../../../stylings'
import { 
  Building,
  Hash,
  Truck,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

// Mock data for static preview - matches the exact structure
const mockInvoiceData = {
  clientName: 'Sarah Johnson',
  clientEmail: 'sarah@techcorp.com',
  clientAddress: '456 Innovation Drive, Suite 200, San Francisco, CA 94105',
  clientPhone: '+1 (555) 987-6543',
  clientCompanyName: 'TechCorp Solutions',
  invoiceNumber: 'INV-2024-001',
  invoiceDate: '2024-01-15',
  dueDate: '2024-02-14',
  poNumber: 'PO-789456',
  taxId: '12-3456789',
  shipToName: 'John Smith',
  shipToAddress: '789 Delivery Street',
  shipToCity: 'San Francisco',
  shipToState: 'CA',
  shipToZip: '94105',
  shipToCountry: 'USA',
  items: [
    {
      id: '1',
      description: 'Professional Web Development Services',
      quantity: 40,
      unitPrice: 125,
      discount: 5,
      taxRate: 8.5,
      lineTotal: 4750
    },
    {
      id: '2', 
      description: 'UI/UX Design Consultation',
      quantity: 15,
      unitPrice: 95,
      discount: 0,
      taxRate: 8.5,
      lineTotal: 1425
    },
    {
      id: '3',
      description: 'Database Architecture & Setup',
      quantity: 8,
      unitPrice: 150,
      discount: 10,
      taxRate: 8.5,
      lineTotal: 1080
    }
  ],
  notes: 'Thank you for choosing our professional services. We appreciate your business and look forward to continued partnership.',
  termsAndConditions: 'Payment is due within 30 days of invoice date. Late payments may incur a 1.5% monthly service charge. All work is subject to our standard terms and conditions.',
  subtotal: 7255,
  discountAmount: 500,
  shippingCost: 0,
  taxTotal: 573.25,
  grandTotal: 7328.25,
  amountPaid: 2000,
  balanceDue: 5328.25,
  currency: 'USD',
  currencySymbol: '$'
}

export default function ProfessionalPreviewStatic() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const hasShipTo = mockInvoiceData.shipToName || mockInvoiceData.shipToAddress

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.primary[50],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem 0.5rem' : '2rem 1rem',
      overflowX: isMobile ? 'auto' : 'visible',
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
        padding: '0 1rem'
      }}>
        {/* Invoice Preview Card */}
        <div style={{
          backgroundColor: brandColors.white,
          borderRadius: isMobile ? '8px' : '12px',
          padding: isMobile ? '0.75rem' : '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
          position: 'relative',
          width: isMobile ? '800px' : '100%',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          
          {/* Header Section - centered title, info left, logo+status right */}
          <div style={{
            marginBottom: '3rem',
            paddingBottom: '2rem',
            borderBottom: `2px solid ${brandColors.neutral[200]}`,
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: 800,
                color: brandColors.primary[700],
                margin: 0,
                fontFamily: 'Helvetica, Arial, sans-serif'
              }}>
                INVOICE
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: isMobile ? '0.8rem' : '0.9rem', color: brandColors.neutral[600] }}>
                Professional Business Solutions
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.25rem' }}>
              <div>
                <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: brandColors.neutral[600], margin: '0 0 0.25rem 0' }}>
                  www.company.com
                </p>
                <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: brandColors.neutral[600], margin: '0 0 0.25rem 0' }}>
                  Tax ID: 12-3456789
                </p>
                <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: brandColors.neutral[600], margin: 0 }}>
                  Reg: 123456
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: brandColors.warning[100],
                  color: brandColors.warning[700],
                  borderRadius: '12px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '600'
                }}>
                  Draft
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: isMobile ? '0.5rem' : '0.75rem',
            backgroundColor: brandColors.neutral[50],
            borderRadius: '8px',
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
          
            <div style={{ minWidth: '120px', flex: '1' }}>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Invoice Number
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900]
              }}>
                {mockInvoiceData.invoiceNumber}
              </div>
            </div>

            <div style={{ minWidth: '120px', flex: '1' }}>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Issue Date
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900]
              }}>
                {new Date(mockInvoiceData.invoiceDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            <div style={{ minWidth: '120px', flex: '1' }}>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Due Date
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: brandColors.error[600]
              }}>
                {new Date(mockInvoiceData.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            <div style={{ minWidth: '120px', flex: '1' }}>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                PO Number
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900]
              }}>
                {mockInvoiceData.poNumber}
              </div>
            </div>

            <div style={{ minWidth: '120px', flex: '1' }}>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                color: brandColors.neutral[500],
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Tax ID
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900]
              }}>
                {mockInvoiceData.taxId}
              </div>
            </div>
          </div>

          {/* Bill To & Ship To */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: hasShipTo 
              ? (isMobile ? '1fr' : '1fr 1fr')
              : '1fr',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Bill To */}
            <div>
              <h3 style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '700',
                color: brandColors.neutral[700],
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Bill To
              </h3>
              <div style={{
                padding: isMobile ? '1rem' : '1.25rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: '8px',
                border: `1px solid ${brandColors.neutral[200]}`
              }}>
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '700',
                  color: brandColors.neutral[900],
                  marginBottom: '0.75rem'
                }}>
                  {mockInvoiceData.clientName}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Building size={14} />
                  {mockInvoiceData.clientCompanyName}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Mail size={14} />
                  {mockInvoiceData.clientEmail}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: brandColors.neutral[600],
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Phone size={14} />
                  {mockInvoiceData.clientPhone}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: brandColors.neutral[600],
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}>
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{mockInvoiceData.clientAddress}</span>
                </div>
              </div>
            </div>

            {/* Ship To */}
            {hasShipTo && (
              <div>
                <h3 style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '700',
                  color: brandColors.neutral[700],
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Ship To
                </h3>
                <div style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  backgroundColor: brandColors.primary[50],
                  borderRadius: '8px',
                  border: `1px solid ${brandColors.primary[200]}`
                }}>
                  <div style={{
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: '700',
                    color: brandColors.neutral[900],
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Truck size={18} color={brandColors.primary[600]} />
                    {mockInvoiceData.shipToName}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: brandColors.neutral[700],
                    marginBottom: '0.25rem'
                  }}>
                    {mockInvoiceData.shipToAddress}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: brandColors.neutral[700]
                  }}>
                    {[mockInvoiceData.shipToCity, mockInvoiceData.shipToState, mockInvoiceData.shipToZip]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: brandColors.neutral[700]
                  }}>
                    {mockInvoiceData.shipToCountry}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '2rem', overflowX: 'auto' }}>
            <h3 style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
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
                    padding: isMobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Description
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: isMobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Qty
                  </th>
                  <th style={{
                    textAlign: 'right',
                    padding: isMobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Unit Price
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: isMobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Disc %
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: isMobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: brandColors.neutral[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Tax %
                  </th>
                  <th style={{
                    textAlign: 'right',
                    padding: isMobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
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
                {mockInvoiceData.items.map((item, index) => (
                  <tr key={item.id} style={{
                    borderBottom: `1px solid ${brandColors.neutral[200]}`
                  }}>
                    <td style={{
                      padding: isMobile ? '0.75rem 0.25rem' : '0.75rem 0.5rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      color: brandColors.neutral[900],
                      textAlign: 'left'
                    }}>
                      {item.description}
                    </td>
                    <td style={{
                      padding: isMobile ? '0.75rem 0.25rem' : '0.75rem 0.5rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      color: brandColors.neutral[700],
                      textAlign: 'center'
                    }}>
                      {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{
                      padding: isMobile ? '0.75rem 0.25rem' : '0.75rem 0.5rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      color: brandColors.neutral[700],
                      textAlign: 'right'
                    }}>
                      {mockInvoiceData.currencySymbol}{item.unitPrice.toFixed(2)}
                    </td>
                    <td style={{
                      padding: isMobile ? '0.75rem 0.25rem' : '0.75rem 0.5rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      color: item.discount > 0 ? brandColors.error[600] : brandColors.neutral[400],
                      textAlign: 'center'
                    }}>
                      {item.discount > 0 ? `${item.discount}%` : '-'}
                    </td>
                    <td style={{
                      padding: isMobile ? '0.75rem 0.25rem' : '0.75rem 0.5rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      color: brandColors.neutral[700],
                      textAlign: 'center'
                    }}>
                      {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                    </td>
                    <td style={{
                      padding: isMobile ? '0.75rem 0.25rem' : '0.75rem 0.5rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      fontWeight: '600',
                      color: brandColors.neutral[900],
                      textAlign: 'right'
                    }}>
                      {mockInvoiceData.currencySymbol}{item.lineTotal.toFixed(2)}
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
              minWidth: isMobile ? '280px' : '350px',
              backgroundColor: brandColors.neutral[50],
              borderRadius: '8px',
              padding: isMobile ? '1rem' : '1.5rem',
              border: `1px solid ${brandColors.neutral[200]}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: brandColors.neutral[700]
              }}>
                <span>Subtotal:</span>
                <span>{mockInvoiceData.currencySymbol}{mockInvoiceData.subtotal.toFixed(2)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: brandColors.error[600]
              }}>
                <span>Discount:</span>
                <span>-{mockInvoiceData.currencySymbol}{mockInvoiceData.discountAmount.toFixed(2)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: brandColors.neutral[700]
              }}>
                <span>Tax:</span>
                <span>{mockInvoiceData.currencySymbol}{mockInvoiceData.taxTotal.toFixed(2)}</span>
              </div>

              <div style={{
                borderTop: `2px solid ${brandColors.neutral[300]}`,
                paddingTop: '1rem',
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '700',
                color: brandColors.neutral[900]
              }}>
                <span>Total:</span>
                <span>{mockInvoiceData.currencySymbol}{mockInvoiceData.grandTotal.toFixed(2)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.75rem',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: brandColors.success[600]
              }}>
                <span>Amount Paid:</span>
                <span>-{mockInvoiceData.currencySymbol}{mockInvoiceData.amountPaid.toFixed(2)}</span>
              </div>

              <div style={{
                borderTop: `2px solid ${brandColors.primary[300]}`,
                paddingTop: '1rem',
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: brandColors.primary[600]
              }}>
                <span>Balance Due:</span>
                <span>{mockInvoiceData.currencySymbol}{mockInvoiceData.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Information */}
          <div style={{
            backgroundColor: brandColors.neutral[50],
            borderRadius: '8px',
            padding: isMobile ? '1rem' : '1.5rem',
            marginBottom: '2rem',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
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
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: brandColors.neutral[600],
                marginBottom: '0.5rem',
                lineHeight: '1.6'
              }}>
                <strong>Payment Terms:</strong> Net 30 days. Late payments subject to 1.5% monthly interest charge.
              </p>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: brandColors.neutral[600],
                lineHeight: '1.6'
              }}>
                <strong>Payment Due:</strong> Payment is due within 30 days from invoice date. Please include invoice number with payment.
              </p>
            </div>

            {/* Payment Methods Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile 
                ? '1fr' 
                : isMobile && window.innerWidth < 1024
                  ? 'repeat(auto-fit, minmax(180px, 1fr))' 
                  : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              {/* Bank Transfer */}
              <div style={{
                backgroundColor: brandColors.white,
                padding: isMobile ? '0.75rem' : '1rem',
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
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  Bank Transfer
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.4'
                }}>
                  Bank: ABC Bank<br/>
                  Account: 1234567890<br/>
                  Routing: 123456789
                </div>
              </div>

              {/* Credit Card */}
              <div style={{
                backgroundColor: brandColors.white,
                padding: isMobile ? '0.75rem' : '1rem',
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
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  Credit Card
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.4'
                }}>
                  Visa, Mastercard, AmEx<br/>
                  Pay online at:<br/>
                  www.company.com/pay
                </div>
              </div>

              {/* PayPal */}
              <div style={{
                backgroundColor: brandColors.white,
                padding: isMobile ? '0.75rem' : '1rem',
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
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  PayPal
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.4'
                }}>
                  payments@company.com
                </div>
              </div>

              {/* Check */}
              <div style={{
                backgroundColor: brandColors.white,
                padding: isMobile ? '0.75rem' : '1rem',
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
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  Check
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: brandColors.neutral[600],
                  lineHeight: '1.4'
                }}>
                  Payable to: Your Company<br/>
                  Mail to address above
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '700',
              color: brandColors.neutral[700],
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Notes
            </h3>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              color: brandColors.neutral[700],
              whiteSpace: 'pre-line',
              lineHeight: '1.6'
            }}>
              {mockInvoiceData.notes}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${brandColors.neutral[200]}`,
            paddingTop: '1.5rem',
            textAlign: 'center',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: brandColors.neutral[400]
          }}>
            Thank you for your business! • Generated by InvoiceIt
          </div>
        </div>
      </div>
    </div>
  )
}
