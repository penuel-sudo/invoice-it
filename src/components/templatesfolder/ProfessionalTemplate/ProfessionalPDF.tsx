import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ProfessionalInvoiceFormData } from './ProfessionalTemplateSave'

// PDF-specific styles for Professional Template
const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#f8fafc', // Light gray background
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #e2e8f0'
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a', // Primary green
    marginBottom: 8
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20
  },
  
  // Invoice details bar
  detailsBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 6,
    marginBottom: 25
  },
  detailItem: {
    flex: 1,
    marginRight: 15
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  dueDateValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626' // Red for due date
  },
  
  // Bill To & Ship To
  addressSection: {
    flexDirection: 'row',
    marginBottom: 30
  },
  billTo: {
    flex: 1,
    marginRight: 20
  },
  shipTo: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green background
    padding: 15,
    borderRadius: 6,
    border: '1px solid #bbf7d0'
  },
  addressTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  addressCard: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 6,
    border: '1px solid #e2e8f0'
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8
  },
  clientInfo: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  clientAddress: {
    fontSize: 10,
    color: '#475569',
    marginTop: 8,
    lineHeight: 1.3
  },
  
  // Items table
  itemsSection: {
    marginBottom: 25
  },
  itemsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    borderBottom: '2px solid #cbd5e1'
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0'
  },
  tableCell: {
    padding: 10,
    fontSize: 10,
    color: '#0f172a'
  },
  tableCellCenter: {
    textAlign: 'center'
  },
  tableCellRight: {
    textAlign: 'right'
  },
  tableCellBold: {
    fontWeight: 'bold'
  },
  discountCell: {
    color: '#dc2626' // Red for discounts
  },
  
  // Totals section
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30
  },
  totalsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 15,
    border: '1px solid #e2e8f0',
    minWidth: 300
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 10,
    color: '#475569'
  },
  totalRowDiscount: {
    color: '#dc2626' // Red for discount
  },
  totalRowPaid: {
    color: '#059669' // Green for paid amount
  },
  totalDivider: {
    borderTop: '2px solid #cbd5e1',
    paddingTop: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  balanceDue: {
    borderTop: '2px solid #16a34a',
    paddingTop: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  
  // Notes section
  notesSection: {
    flexDirection: 'row',
    marginBottom: 30
  },
  notesColumn: {
    flex: 1,
    marginRight: 20
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  notesContent: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4
  },
  
  // Footer
  footer: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: 15,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8'
  }
})

interface ProfessionalPDFProps {
  invoiceData: ProfessionalInvoiceFormData
  user: any
}

export default function ProfessionalPDF({ invoiceData, user }: ProfessionalPDFProps) {
  const hasShipTo = invoiceData.shipToName || invoiceData.shipToAddress
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>INVOICE</Text>
              <Text style={styles.subtitle}>Professional Invoice Template</Text>
            </View>
          </View>

          {/* Invoice Details Bar */}
          <View style={styles.detailsBar}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Invoice Number</Text>
              <Text style={styles.detailValue}>{invoiceData.invoiceNumber}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Issue Date</Text>
              <Text style={styles.detailValue}>
                {new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.dueDateValue}>
                {new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            
            {invoiceData.poNumber && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PO Number</Text>
                <Text style={styles.detailValue}>{invoiceData.poNumber}</Text>
              </View>
            )}
            
            {invoiceData.taxId && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tax ID / VAT</Text>
                <Text style={styles.detailValue}>{invoiceData.taxId}</Text>
              </View>
            )}
          </View>

          {/* Bill To & Ship To */}
          <View style={styles.addressSection}>
            {/* Bill To */}
            <View style={styles.billTo}>
              <Text style={styles.addressTitle}>Bill To</Text>
              <View style={styles.addressCard}>
                <Text style={styles.clientName}>{invoiceData.clientName}</Text>
                {invoiceData.clientCompanyName && (
                  <Text style={styles.clientInfo}>🏢 {invoiceData.clientCompanyName}</Text>
                )}
                {invoiceData.clientEmail && (
                  <Text style={styles.clientInfo}>✉️ {invoiceData.clientEmail}</Text>
                )}
                {invoiceData.clientPhone && (
                  <Text style={styles.clientInfo}>📞 {invoiceData.clientPhone}</Text>
                )}
                {invoiceData.clientAddress && (
                  <Text style={styles.clientAddress}>📍 {invoiceData.clientAddress}</Text>
                )}
              </View>
            </View>

            {/* Ship To (if provided) */}
            {hasShipTo && (
              <View style={styles.shipTo}>
                <Text style={styles.addressTitle}>Ship To</Text>
                <Text style={styles.clientName}>🚚 {invoiceData.shipToName}</Text>
                {invoiceData.shipToAddress && (
                  <Text style={styles.clientAddress}>{invoiceData.shipToAddress}</Text>
                )}
                {(invoiceData.shipToCity || invoiceData.shipToState || invoiceData.shipToZip) && (
                  <Text style={styles.clientAddress}>
                    {[invoiceData.shipToCity, invoiceData.shipToState, invoiceData.shipToZip]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                )}
                {invoiceData.shipToCountry && (
                  <Text style={styles.clientAddress}>{invoiceData.shipToCountry}</Text>
                )}
              </View>
            )}
          </View>

          {/* Line Items Table */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Items</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Description</Text>
                  <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Qty</Text>
                  <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Unit Price</Text>
                  {invoiceData.items.some(item => item.discount > 0) && (
                    <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Disc %</Text>
                  )}
                  {invoiceData.items.some(item => item.taxRate > 0) && (
                    <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Tax %</Text>
                  )}
                  <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Total</Text>
                </View>
              </View>
              
              {invoiceData.items.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.tableCell, { width: '35%' }]}>{item.description}</Text>
                    <Text style={[styles.tableCell, styles.tableCellCenter, { width: '12%' }]}>
                      {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, { width: '15%' }]}>
                      {invoiceData.currencySymbol}{item.unitPrice.toFixed(2)}
                    </Text>
                    {invoiceData.items.some(item => item.discount > 0) && (
                      <Text style={[styles.tableCell, styles.tableCellCenter, styles.discountCell, { width: '10%' }]}>
                        {item.discount > 0 ? `${item.discount}%` : '-'}
                      </Text>
                    )}
                    {invoiceData.items.some(item => item.taxRate > 0) && (
                      <Text style={[styles.tableCell, styles.tableCellCenter, { width: '10%' }]}>
                        {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                      </Text>
                    )}
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { width: '15%' }]}>
                      {invoiceData.currencySymbol}{item.lineTotal.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text>Subtotal:</Text>
                <Text>{invoiceData.currencySymbol}{invoiceData.subtotal.toFixed(2)}</Text>
              </View>

              {invoiceData.discountAmount > 0 && (
                <View style={[styles.totalRow, styles.totalRowDiscount]}>
                  <Text>Discount:</Text>
                  <Text>-{invoiceData.currencySymbol}{invoiceData.discountAmount.toFixed(2)}</Text>
                </View>
              )}

              {invoiceData.shippingCost > 0 && (
                <View style={styles.totalRow}>
                  <Text>Shipping:</Text>
                  <Text>{invoiceData.currencySymbol}{invoiceData.shippingCost.toFixed(2)}</Text>
                </View>
              )}

              {invoiceData.taxTotal > 0 && (
                <View style={styles.totalRow}>
                  <Text>Tax:</Text>
                  <Text>{invoiceData.currencySymbol}{invoiceData.taxTotal.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.totalDivider}>
                <Text>Total:</Text>
                <Text>{invoiceData.currencySymbol}{invoiceData.grandTotal.toFixed(2)}</Text>
              </View>

              {invoiceData.amountPaid > 0 && (
                <>
                  <View style={[styles.totalRow, styles.totalRowPaid]}>
                    <Text>Amount Paid:</Text>
                    <Text>-{invoiceData.currencySymbol}{invoiceData.amountPaid.toFixed(2)}</Text>
                  </View>

                  <View style={styles.balanceDue}>
                    <Text>Balance Due:</Text>
                    <Text>{invoiceData.currencySymbol}{invoiceData.balanceDue.toFixed(2)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Notes & Terms */}
          {(invoiceData.notes || invoiceData.termsAndConditions) && (
            <View style={styles.notesSection}>
              {invoiceData.notes && (
                <View style={styles.notesColumn}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <View style={styles.notesContent}>
                    <Text>{invoiceData.notes}</Text>
                  </View>
                </View>
              )}

              {invoiceData.termsAndConditions && (
                <View style={styles.notesColumn}>
                  <Text style={styles.notesTitle}>Terms & Conditions</Text>
                  <View style={styles.notesContent}>
                    <Text>{invoiceData.termsAndConditions}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Thank you for your business! • Generated by InvoiceIt</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
