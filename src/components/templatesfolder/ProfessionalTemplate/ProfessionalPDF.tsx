import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { ProfessionalInvoiceFormData } from './ProfessionalTemplateSave'

// @react-pdf/renderer natively supports these fonts:
// - Helvetica (regular, bold, oblique)
// - Times-Roman (regular, bold, italic)
// - Courier (regular, bold, oblique)
// No font registration needed for built-in fonts

// Font mapping function - ensures only supported fonts are used
const getPDFFont = (fontFamily?: string): string => {
  if (!fontFamily) return 'Helvetica'
  
  // Only allow native PDF fonts
  const supportedFonts: Record<string, string> = {
    'Helvetica': 'Helvetica',
    'Times-Roman': 'Times-Roman',
    'Courier': 'Courier'
  }
  
  // Return mapped font or fallback to Helvetica
  return supportedFonts[fontFamily] || 'Helvetica'
}

// PDF-specific styles matching ProfessionalPreview exactly
const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0fdf4', // Matches preview gradient background
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    maxWidth: '100%'
  },
  
  // Header Section
  headerSection: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #e5e7eb'
  },
  headerCenter: {
    textAlign: 'center',
    marginBottom: 12
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 4
  },
  tagline: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 4
  },
  headerInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  logo: {
    maxHeight: 50,
    maxWidth: 50,
    borderRadius: 25,
    objectFit: 'cover'
  },
  
  // Invoice Details Bar
  detailsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 15
  },
  detailItem: {
    minWidth: 100,
    flex: 1
  },
  detailLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  detailValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827'
  },
  dueDateValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  
  // Bill To & Ship To
  addressSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15
  },
  addressColumn: {
    flex: 1
  },
  addressTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  addressCard: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb'
  },
  addressCardShip: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    border: '1px solid #bbf7d0'
  },
  clientName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8
  },
  clientInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4
  },
  
  // Items Table
  itemsSection: {
    marginBottom: 20
  },
  itemsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  table: {
    width: '100%'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '2px solid #cbd5e1',
    paddingTop: 8,
    paddingBottom: 8
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 4,
    paddingRight: 4
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingTop: 8,
    paddingBottom: 8
  },
  tableCell: {
    fontSize: 9,
    color: '#111827',
    paddingLeft: 4,
    paddingRight: 4
  },
  tableCellBold: {
    fontWeight: 'bold'
  },
  tableCellDiscount: {
    color: '#dc2626'
  },
  
  // Totals Section
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30
  },
  totalsCard: {
    minWidth: 250,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 15,
    border: '1px solid #e5e7eb'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 9,
    color: '#475569'
  },
  totalRowDiscount: {
    color: '#dc2626'
  },
  totalRowSuccess: {
    color: '#059669'
  },
  totalDivider: {
    borderTop: '2px solid #cbd5e1',
    paddingTop: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827'
  },
  balanceDue: {
    borderTop: '2px solid #16a34a',
    paddingTop: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  
  // Payment Methods Section
  paymentSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    border: '1px solid #e5e7eb'
  },
  paymentTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  paymentTerms: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: 10
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  paymentMethodCard: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    minWidth: 120,
    flex: 1
  },
  paymentMethodLabel: {
    fontWeight: 'bold',
    color: '#111827',
    fontSize: 9,
    marginBottom: 4
  },
  paymentMethodDetails: {
    fontSize: 7,
    color: '#6b7280',
    lineHeight: 1.4
  },
  
  // Notes Section
  notesSection: {
    textAlign: 'center',
    marginBottom: 20
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.6
  }
})

interface ProfessionalPDFProps {
  invoiceData: ProfessionalInvoiceFormData
  user: any
  templateSettings?: any
}

export default function ProfessionalPDF({ invoiceData, user, templateSettings }: ProfessionalPDFProps) {
  const hasShipTo = invoiceData.shipToName || invoiceData.shipToAddress
  
  // Get the mapped font for PDF (with fallback migration for old font names)
  const pdfFont = getPDFFont(templateSettings?.font_family)
  
  // Apply customizations if available
  const pageStyle = templateSettings?.background_colors?.main_background 
    ? { ...styles.page, backgroundColor: templateSettings.background_colors.main_background, fontFamily: pdfFont }
    : { ...styles.page, fontFamily: pdfFont }
  
  // Log font being used for debugging
  console.log('📝 PDF Font:', pdfFont, 'from:', templateSettings?.font_family)
    
  const containerStyle = templateSettings?.background_colors?.card_background
    ? { ...styles.container, backgroundColor: templateSettings.background_colors.card_background }
    : styles.container
  
  // Get company details from templateSettings or user
  const companyName = templateSettings?.company_name || user?.user_metadata?.full_name || 'INVOICE'
  const companyTagline = templateSettings?.tagline || ''
  const companyWebsite = templateSettings?.website || ''
  const companyTaxId = templateSettings?.tax_id || ''
  const companyRegistration = templateSettings?.registration_number || ''
  const logoUrl = templateSettings?.logo_url || user?.user_metadata?.avatar_url || ''
  
  // Get payment methods from user profile
  const paymentMethods = user?.payment_methods || []
  
  return (
    <Document>
      <Page size="A4" style={pageStyle}>
        <View style={containerStyle}>
          
          {/* Header Section - Centered title, info left, logo right (NO STATUS) */}
          <View style={styles.headerSection}>
            {/* Centered Company Name */}
            <View style={styles.headerCenter}>
              <Text style={{
                ...styles.companyName,
                color: templateSettings?.primary_color || '#15803d',
                fontFamily: pdfFont
              }}>
                {companyName}
              </Text>
              {companyTagline && templateSettings?.template_settings?.show_tagline !== false && (
                <Text style={styles.tagline}>{companyTagline}</Text>
              )}
            </View>
            
            {/* Bottom Row: Info Left, Logo Right */}
            <View style={styles.headerBottom}>
              {/* Left - Company Info */}
              <View style={styles.headerLeft}>
                {companyWebsite && templateSettings?.template_settings?.show_website !== false && (
                  <Text style={styles.headerInfo}>{companyWebsite}</Text>
                )}
                {companyTaxId && templateSettings?.template_settings?.show_tax_id !== false && (
                  <Text style={styles.headerInfo}>Tax ID: {companyTaxId}</Text>
                )}
                {companyRegistration && templateSettings?.template_settings?.show_registration !== false && (
                  <Text style={styles.headerInfo}>Reg: {companyRegistration}</Text>
                )}
              </View>
              
              {/* Right - Logo (NO STATUS BADGE) */}
              <View style={styles.headerRight}>
                {logoUrl && templateSettings?.template_settings?.show_logo !== false && (
                  <Image src={logoUrl} style={styles.logo} />
                )}
              </View>
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
            <View style={styles.addressColumn}>
              <Text style={styles.addressTitle}>Bill To</Text>
              <View style={styles.addressCard}>
                <Text style={styles.clientName}>{invoiceData.clientName}</Text>
                {invoiceData.clientCompanyName && (
                  <Text style={styles.clientInfo}>
                    🏢 {invoiceData.clientCompanyName}
                  </Text>
                )}
                {invoiceData.clientEmail && (
                  <Text style={styles.clientInfo}>
                    ✉️ {invoiceData.clientEmail}
                  </Text>
                )}
                {invoiceData.clientPhone && (
                  <Text style={styles.clientInfo}>
                    📞 {invoiceData.clientPhone}
                  </Text>
                )}
                {invoiceData.clientAddress && (
                  <Text style={styles.clientInfo}>
                    📍 {invoiceData.clientAddress}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Ship To */}
            {hasShipTo && (
              <View style={styles.addressColumn}>
                <Text style={styles.addressTitle}>Ship To</Text>
                <View style={styles.addressCardShip}>
                  <Text style={styles.clientName}>
                    🚚 {invoiceData.shipToName}
                  </Text>
                  {invoiceData.shipToAddress && (
                    <Text style={{ fontSize: 9, color: '#374151', marginBottom: 2 }}>
                      {invoiceData.shipToAddress}
                    </Text>
                  )}
                  {(invoiceData.shipToCity || invoiceData.shipToState || invoiceData.shipToZip) && (
                    <Text style={{ fontSize: 9, color: '#374151' }}>
                      {[invoiceData.shipToCity, invoiceData.shipToState, invoiceData.shipToZip]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  )}
                  {invoiceData.shipToCountry && (
                    <Text style={{ fontSize: 9, color: '#374151' }}>
                      {invoiceData.shipToCountry}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* Line Items Table */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Items</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.tableHeaderCell, flex: 3, textAlign: 'left' }}>Description</Text>
                <Text style={{ ...styles.tableHeaderCell, flex: 1, textAlign: 'center' }}>Qty</Text>
                <Text style={{ ...styles.tableHeaderCell, flex: 1, textAlign: 'right' }}>Unit Price</Text>
                {invoiceData.items.some(item => item.discount > 0) && (
                  <Text style={{ ...styles.tableHeaderCell, flex: 1, textAlign: 'center' }}>Disc %</Text>
                )}
                {invoiceData.items.some(item => item.taxRate > 0) && (
                  <Text style={{ ...styles.tableHeaderCell, flex: 1, textAlign: 'center' }}>Tax %</Text>
                )}
                <Text style={{ ...styles.tableHeaderCell, flex: 1, textAlign: 'right' }}>Total</Text>
              </View>
              
              {/* Table Rows */}
              {invoiceData.items.filter(item => 
                item.description.trim() !== '' || item.quantity > 0 || item.unitPrice > 0
              ).map((item, index) => (
                <View key={item.id || index} style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, flex: 3, textAlign: 'left' }}>{item.description}</Text>
                  <Text style={{ ...styles.tableCell, flex: 1, textAlign: 'center' }}>
                    {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...styles.tableCell, flex: 1, textAlign: 'right' }}>
                    {invoiceData.currencySymbol}{item.unitPrice.toFixed(2)}
                  </Text>
                  {invoiceData.items.some(i => i.discount > 0) && (
                    <Text style={{ 
                      ...styles.tableCell, 
                      ...(item.discount > 0 ? styles.tableCellDiscount : {}),
                      flex: 1, 
                      textAlign: 'center' 
                    }}>
                      {item.discount > 0 ? `${item.discount}%` : '-'}
                    </Text>
                  )}
                  {invoiceData.items.some(i => i.taxRate > 0) && (
                    <Text style={{ ...styles.tableCell, flex: 1, textAlign: 'center' }}>
                      {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                    </Text>
                  )}
                  <Text style={{ ...styles.tableCell, ...styles.tableCellBold, flex: 1, textAlign: 'right' }}>
                    {invoiceData.currencySymbol}{item.lineTotal.toFixed(2)}
                  </Text>
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
                <View style={{ ...styles.totalRow, ...styles.totalRowDiscount }}>
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
                  <View style={{ ...styles.totalRow, ...styles.totalRowSuccess, marginTop: 8 }}>
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
          
          {/* Payment Terms & Information */}
          {(paymentMethods.length > 0 || invoiceData.termsAndConditions) && (
            <View style={styles.paymentSection} wrap={false}>
              <Text style={styles.paymentTitle}>Payment Terms & Information</Text>
              
              {invoiceData.termsAndConditions && (
                <Text style={styles.paymentTerms}>{invoiceData.termsAndConditions}</Text>
              )}
              
              {/* Payment Methods */}
              {paymentMethods.length > 0 && (
                <View style={styles.paymentMethodsGrid}>
                  {paymentMethods.map((method: any) => {
                    const details = method.details || {}
                    return (
                      <View key={method.id} style={styles.paymentMethodCard}>
                        <Text style={styles.paymentMethodLabel}>{method.label}</Text>
                        <View style={styles.paymentMethodDetails}>
                          {method.type === 'bank_local_us' && (
                            <>
                              <Text>Bank: {details.bankName}</Text>
                              <Text>Account: {details.accountNumber}</Text>
                              {details.accountType && <Text>Type: {details.accountType}</Text>}
                              <Text>Routing: {details.routingNumber}</Text>
                            </>
                          )}
                          {method.type === 'bank_local_ng' && (
                            <>
                              <Text>Bank: {details.bankName}</Text>
                              <Text>Account: {details.accountNumber}</Text>
                              <Text>Bank Code: {details.bankCode}</Text>
                            </>
                          )}
                          {method.type === 'bank_international' && (
                            <>
                              <Text>Bank: {details.bankName}</Text>
                              <Text>SWIFT: {details.swiftCode}</Text>
                              <Text>IBAN: {details.iban}</Text>
                            </>
                          )}
                          {method.type === 'paypal' && (
                            <Text>PayPal: {details.email}</Text>
                          )}
                          {method.type === 'crypto' && (
                            <>
                              <Text>{details.currency || 'Crypto'}: {details.walletAddress}</Text>
                              <Text>Network: {details.network}</Text>
                            </>
                          )}
                          {method.type === 'other' && (
                            <Text>{details.instructions}</Text>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}
          
          {/* Notes */}
          {invoiceData.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoiceData.notes}</Text>
            </View>
          )}
          
        </View>
      </Page>
    </Document>
  )
}
