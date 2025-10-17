import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceData } from '../../../lib/storage/invoiceStorage'
import { getCurrencySymbol } from '../../../lib/currencyUtils'

// PDF-specific styles matching the preview layout
const styles = StyleSheet.create({
  page: {
    padding: 10,
    backgroundColor: '#f0fdf4', // Light green background like preview
    fontFamily: 'Helvetica',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    overflow: 'hidden'
  },
  container: {
    width: 400,
    margin: 'auto'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 0,
    position: 'relative',
    overflow: 'hidden'
  },
  headerBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  badge: {
    backgroundColor: '#dcfce7', // primary[100]
    color: '#15803d', // primary[700]
    padding: '4 12',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold'
  },
  amountSection: {
    marginTop: 10,
    marginBottom: 12,
    textAlign: 'center'
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827', // neutral[900]
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold'
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
    letterSpacing: 0.5
  },
  currencySymbolSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
    marginRight: 3,
    letterSpacing: 0.3
  },
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280'
  },
  clientInfo: {
    gap: 2
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2
  },
  clientDate: {
    fontSize: 10,
    color: '#9ca3af'
  },
  dueSection: {
    textAlign: 'right'
  },
  dueLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4
  },
  dueValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827'
  },
  detailsSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center'
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  itemDescription: {
    fontSize: 10,
    color: '#6b7280'
  },
  itemPrice: {
    fontSize: 10,
    color: '#111827'
  },
  separator: {
    borderTop: '1px solid #e5e7eb',
    marginVertical: 8
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280'
  },
  totalValue: {
    fontSize: 10,
    color: '#111827'
  },
  grandTotalSeparator: {
    borderTop: '1px solid #e5e7eb',
    marginVertical: 8
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827'
  },
  grandTotalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827'
  },
  notesSection: {
    borderTop: '1px solid #e5e7eb',
    marginTop: 8,
    paddingTop: 8,
    textAlign: 'center'
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center'
  },
  notesText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
    textAlign: 'center'
  },
  disclaimerSection: {
    borderTop: '1px solid #e5e7eb',
    marginTop: 8,
    paddingTop: 8,
    textAlign: 'center'
  },
  disclaimerText: {
    fontSize: 9,
    color: '#d1d5db',
    marginBottom: 4,
    textAlign: 'center'
  },
  disclaimerSubtext: {
    fontSize: 8,
    color: '#d1d5db',
    fontStyle: 'italic',
    textAlign: 'center'
  },
  paymentSection: {
    borderTop: '1px solid #e5e7eb',
    marginTop: 8,
    paddingTop: 8,
    textAlign: 'center'
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  paymentText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
    marginBottom: 2
  }
})

interface DefaultPDFProps {
  invoiceData: InvoiceData
}

export default function DefaultPDF({ invoiceData }: DefaultPDFProps) {
  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate days until due
  const getDaysUntilDue = () => {
    if (!invoiceData.dueDate) return 'N/A'
    const dueDate = new Date(invoiceData.dueDate)
    const today = new Date()
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    // Stop countdown at 0 - don't show negative days
    const displayDays = Math.max(0, days)
    return `${displayDays} days`
  }

  // Get currency symbol with proper font support
  const currencySymbol = invoiceData.currencySymbol || getCurrencySymbol(invoiceData.currency || 'USD')

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.container}>
          {/* Invoice Preview Card */}
          <View style={styles.card}>
            {/* Header Badge */}
            <View style={styles.headerBadge}>
              <View style={styles.badge}>
                <Text>Payment - {invoiceData.invoiceNumber}</Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountSection}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'baseline', 
                justifyContent: 'center'
              }}>
                <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                <Text style={styles.amount}>{invoiceData.grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Client Info */}
            <View style={styles.clientSection}>
              <View style={styles.clientLeft}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(invoiceData.clientName)}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>
                    {invoiceData.clientName}
                  </Text>
                  <Text style={styles.clientDate}>
                    {new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.dueSection}>
                <Text style={styles.dueLabel}>Due</Text>
                <Text style={styles.dueValue}>{getDaysUntilDue()}</Text>
              </View>
            </View>

            {/* Invoice Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Invoice Details</Text>

              {/* Items */}
              {invoiceData.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemDescription}>
                    {item.quantity} {item.description}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.currencySymbolSmall}>{currencySymbol}</Text>
                    <Text style={styles.itemPrice}>{item.lineTotal.toFixed(2)}</Text>
                  </View>
                </View>
              ))}

              {/* Subtotal and Tax Section (only show if tax exists) */}
              {invoiceData.taxTotal > 0 && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={styles.currencySymbolSmall}>{currencySymbol}</Text>
                      <Text style={styles.totalValue}>{invoiceData.subtotal.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={styles.currencySymbolSmall}>{currencySymbol}</Text>
                      <Text style={styles.totalValue}>{invoiceData.taxTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Total Section */}
              <View style={styles.grandTotalSeparator} />
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.currencySymbolSmall}>{currencySymbol}</Text>
                  <Text style={styles.grandTotalValue}>{invoiceData.grandTotal.toFixed(2)}</Text>
                </View>
              </View>

              {/* Notes Section */}
              {invoiceData.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Notes:</Text>
                  <Text style={styles.notesText}>{invoiceData.notes}</Text>
                </View>
              )}

              {/* Payment Methods Section */}
              {invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0 && (
                <View style={styles.paymentSection}>
                  <Text style={[styles.paymentTitle, { 
                    textAlign: 'center', 
                    fontSize: 10, 
                    fontWeight: 'bold',
                    color: '#16a34a',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8
                  }]}>
                    Payment Information
                  </Text>
                  
                  {invoiceData.paymentMethods.map((method, index) => {
                      const details = method.details as any
                      return (
                        <View key={index} style={{ 
                          marginBottom: 6, 
                          marginTop: index > 0 ? 6 : 0,
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 6,
                          padding: 6
                        }}>
                          {/* Method Header */}
                          <View style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: 4,
                            paddingBottom: 4,
                            borderBottom: '1px solid #bbf7d0'
                          }}>
                            <Text style={{ 
                              fontSize: 11, 
                              fontWeight: 'bold', 
                              color: '#166534'
                            }}>
                              {method.label}
                            </Text>
                            {method.isDefault && (
                              <Text style={{
                                fontSize: 8,
                                fontWeight: 'bold',
                                color: '#16a34a',
                                backgroundColor: '#bbf7d0',
                                padding: '2px 6px',
                                borderRadius: 4,
                                textTransform: 'uppercase'
                              }}>
                                Default
                              </Text>
                            )}
                          </View>

                          {/* Method Details */}
                          <View>
                            {method.type === 'bank_local_us' && (
                              <View>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Bank:</Text> {details.bankName}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Account:</Text> {details.accountName} ({details.accountType})</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Account #:</Text> {details.accountNumber}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Routing #:</Text> {details.routingNumber}</Text>
                              </View>
                            )}
                            {method.type === 'bank_local_ng' && (
                              <View>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Bank:</Text> {details.bankName}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Account Name:</Text> {details.accountName}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Account #:</Text> {details.accountNumber}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Bank Code:</Text> {details.bankCode}</Text>
                              </View>
                            )}
                            {method.type === 'bank_international' && (
                              <View>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Bank:</Text> {details.bankName}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Beneficiary:</Text> {details.accountName}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>IBAN:</Text> {details.iban}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>SWIFT:</Text> {details.swiftCode}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Address:</Text> {details.bankAddress}, {details.bankCity}, {details.bankCountry}</Text>
                              </View>
                            )}
                            {method.type === 'paypal' && (
                              <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>PayPal Email:</Text> {details.email}</Text>
                            )}
                            {method.type === 'crypto' && (
                              <View>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Network:</Text> {details.network}</Text>
                                <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Address:</Text> {details.walletAddress}</Text>
                              </View>
                            )}
                            {method.type === 'other' && (
                              <Text style={[styles.paymentText, { fontSize: 9 }]}><Text style={{ fontWeight: 'bold' }}>Instructions:</Text> {details.instructions}</Text>
                            )}
                          </View>
                        </View>
                      )
                    })}
                    
                  <Text style={{
                    fontSize: 8,
                    color: '#6b7280',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    marginTop: 8
                  }}>
                    Please use any of the above payment methods to complete your payment
                  </Text>
                </View>
              )}

              {/* Disclaimer */}
              <View style={styles.disclaimerSection}>
                <Text style={styles.disclaimerText}>
                  Generated by InvoiceIt
                </Text>
                <Text style={styles.disclaimerSubtext}>
                  Thanks for doing business with us
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

