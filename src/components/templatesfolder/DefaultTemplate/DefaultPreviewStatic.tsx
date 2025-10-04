import React from 'react'
import { brandColors } from '../../../stylings'

// Mock data for static preview - matches the exact structure
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
              Payment - {mockInvoiceData.invoiceNumber}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: brandColors.warning[100],
              color: brandColors.warning[700],
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Draft
            </div>
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
              ${mockInvoiceData.grandTotal.toFixed(2)}
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
                {mockInvoiceData.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.125rem 0'
                }}>
                  {mockInvoiceData.clientName}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[500],
                  margin: 0
                }}>
                  {new Date(mockInvoiceData.invoiceDate).toLocaleDateString('en-US', { 
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
                {Math.max(0, Math.ceil((new Date(mockInvoiceData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
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
              {mockInvoiceData.items.map((item, index) => (
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
              {mockInvoiceData.taxTotal > 0 && (
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
                      ${mockInvoiceData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[600] }}>
                      Tax
                    </span>
                    <span style={{ fontSize: '0.75rem', color: brandColors.neutral[900] }}>
                      ${mockInvoiceData.taxTotal.toFixed(2)}
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
                  ${mockInvoiceData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Notes Section */}
            {mockInvoiceData.notes && (
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
                  {mockInvoiceData.notes}
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

        {/* NO ACTION BUTTONS - This is the key difference! */}

      </div>

    </div>
  )
}
