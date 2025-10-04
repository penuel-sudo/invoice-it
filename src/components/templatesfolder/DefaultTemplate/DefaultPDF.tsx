import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceData } from '../../../lib/storage/invoiceStorage'
import { getCurrencySymbol } from '../../../lib/currencyUtils'

// PDF-specific styles matching the preview layout
const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#f0fdf4', // Light green background like preview
    fontFamily: 'Helvetica',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    width: '100%',
    maxWidth: 400,
    margin: 'auto'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    position: 'relative'
  },
  headerBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
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
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center'
  },
  amount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#111827', // neutral[900]
    marginBottom: 8
  },
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  detailsSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center'
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
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
    marginTop: 12,
    paddingTop: 12
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
    lineHeight: 1.4
  },
  disclaimerSection: {
    borderTop: '1px solid #e5e7eb',
    marginTop: 12,
    paddingTop: 12,
    textAlign: 'center'
  },
  disclaimerText: {
    fontSize: 9,
    color: '#d1d5db',
    marginBottom: 4
  },
  disclaimerSubtext: {
    fontSize: 8,
    color: '#d1d5db',
    fontStyle: 'italic'
  },
  paymentSection: {
    borderTop: '1px solid #e5e7eb',
    marginTop: 12,
    paddingTop: 12
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  paymentText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: 3
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

  // Get currency symbol
  const currencySymbol = invoiceData.currencySymbol || getCurrencySymbol(invoiceData.currency || 'USD')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
              <Text style={styles.amount}>
                {currencySymbol}{invoiceData.grandTotal.toFixed(2)}
              </Text>
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
                  <Text style={styles.itemPrice}>
                    {currencySymbol}{item.lineTotal.toFixed(2)}
                  </Text>
                </View>
              ))}

              {/* Subtotal and Tax Section (only show if tax exists) */}
              {invoiceData.taxTotal > 0 && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>
                      {currencySymbol}{invoiceData.subtotal.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax</Text>
                    <Text style={styles.totalValue}>
                      {currencySymbol}{invoiceData.taxTotal.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}

              {/* Total Section */}
              <View style={styles.grandTotalSeparator} />
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                <Text style={styles.grandTotalValue}>
                  {currencySymbol}{invoiceData.grandTotal.toFixed(2)}
                </Text>
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
                  <Text style={styles.paymentTitle}>Payment Methods:</Text>
                  {invoiceData.paymentMethods.map((method, index) => {
                      const details = method.details as any
                      return (
                        <View key={index} style={{ marginBottom: 8, marginTop: index > 0 ? 8 : 0 }}>
                          <Text style={[styles.paymentText, { fontWeight: 'bold', marginBottom: 4 }]}>
                            {method.label}:
                          </Text>
                          {method.type === 'bank_local_us' && (
                            <>
                              <Text style={styles.paymentText}>Bank: {details.bankName}</Text>
                              <Text style={styles.paymentText}>Account: {details.accountName} ({details.accountType})</Text>
                              <Text style={styles.paymentText}>Acct #: {details.accountNumber}</Text>
                              <Text style={styles.paymentText}>Routing: {details.routingNumber}</Text>
                            </>
                          )}
                          {method.type === 'bank_local_ng' && (
                            <>
                              <Text style={styles.paymentText}>Bank: {details.bankName}</Text>
                              <Text style={styles.paymentText}>Account Name: {details.accountName}</Text>
                              <Text style={styles.paymentText}>Account #: {details.accountNumber}</Text>
                              <Text style={styles.paymentText}>Bank Code: {details.bankCode}</Text>
                            </>
                          )}
                          {method.type === 'bank_international' && (
                            <>
                              <Text style={styles.paymentText}>Bank: {details.bankName}</Text>
                              <Text style={styles.paymentText}>Beneficiary: {details.accountName}</Text>
                              <Text style={styles.paymentText}>IBAN: {details.iban}</Text>
                              <Text style={styles.paymentText}>SWIFT: {details.swiftCode}</Text>
                              <Text style={styles.paymentText}>Address: {details.bankAddress}, {details.bankCity}, {details.bankCountry}</Text>
                            </>
                          )}
                          {method.type === 'paypal' && (
                            <Text style={styles.paymentText}>Email: {details.email}</Text>
                          )}
                          {method.type === 'crypto' && (
                            <>
                              <Text style={styles.paymentText}>Network: {details.network}</Text>
                              <Text style={styles.paymentText}>Address: {details.walletAddress}</Text>
                            </>
                          )}
                          {method.type === 'other' && (
                            <Text style={styles.paymentText}>{details.instructions}</Text>
                          )}
                        </View>
                      )
                    })}
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

