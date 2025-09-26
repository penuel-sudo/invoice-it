import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 12,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
  },
  invoiceInfo: {
    flexDirection: 'column',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    border: '1px solid #FCD34D',
  },
  totalAmount: {
    textAlign: 'center',
    marginBottom: 20,
  },
  totalAmountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 5,
  },
  issuerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
  },
  issuerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  issuerInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  issuerInfo: {
    flex: 1,
  },
  issuerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  issuerEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  clientSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
  },
  clientHeader: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientLayout: {
    flexDirection: 'row',
    gap: 20,
  },
  clientLeft: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  clientCompany: {
    fontSize: 12,
    fontWeight: 'medium',
    color: '#374151',
    marginBottom: 5,
  },
  clientMiddle: {
    flex: 1,
  },
  clientRight: {
    flex: 1,
  },
  clientContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    fontSize: 12,
    color: '#6B7280',
  },
  clientAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottom: '1px solid #E5E7EB',
  },
  itemDescription: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 'medium',
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1px solid #E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #E5E7EB',
  },
  grandTotalLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1px solid #E5E7EB',
  },
  notesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1px solid #E5E7EB',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 3,
  },
  footerSubtext: {
    fontSize: 9,
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
})

// Helper functions
const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const formatAmount = (amount) => {
  return `$${amount.toFixed(2)}`
}

const getUserInitials = (user) => {
  const name = user?.user_metadata?.full_name || user?.name || 'User'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

// PDF Template Component
const InvoicePDFTemplate = ({ data }) => {
  const { invoiceData, user } = data
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invoice Details</Text>
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>Payment - {invoiceData.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              {formatDate(invoiceData.invoiceDate)} • Due: {formatDate(invoiceData.dueDate)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.statusButton, styles.statusPending]}>
              <Text>Pending</Text>
            </View>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.totalAmount}>
          <Text style={styles.totalAmountText}>
            {formatAmount(invoiceData.grandTotal)}
          </Text>
        </View>

        {/* Issuer Info */}
        <View style={styles.issuerSection}>
          <View style={styles.issuerAvatar}>
            <Text style={styles.issuerInitials}>{getUserInitials(user)}</Text>
          </View>
          <View style={styles.issuerInfo}>
            <Text style={styles.issuerName}>
              {user?.user_metadata?.full_name || user?.name || 'Your Name'}
            </Text>
            <Text style={styles.issuerEmail}>
              {user?.email || 'your.email@example.com'}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <Text style={styles.clientHeader}>Bill To:</Text>
          <View style={styles.clientLayout}>
            {/* Left Column - Name and Company */}
            <View style={styles.clientLeft}>
              <Text style={styles.clientName}>{invoiceData.clientName}</Text>
              {invoiceData.clientCompanyName && (
                <Text style={styles.clientCompany}>{invoiceData.clientCompanyName}</Text>
              )}
            </View>
            
            {/* Middle Column - Contact */}
            <View style={styles.clientMiddle}>
              {invoiceData.clientEmail && (
                <View style={styles.clientContact}>
                  <Text>📧 {invoiceData.clientEmail}</Text>
                </View>
              )}
              {invoiceData.clientPhone && (
                <View style={styles.clientContact}>
                  <Text>📞 {invoiceData.clientPhone}</Text>
                </View>
              )}
            </View>
            
            {/* Right Column - Address */}
            <View style={styles.clientRight}>
              {invoiceData.clientAddress && (
                <View style={styles.clientAddress}>
                  <Text>📍 {invoiceData.clientAddress}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Service Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsHeader}>Service Items:</Text>
          {invoiceData.items.map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <Text style={styles.itemDescription}>
                {item.quantity} {item.description}
              </Text>
              <Text style={styles.itemPrice}>
                {formatAmount(item.lineTotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(invoiceData.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{formatAmount(invoiceData.taxTotal)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatAmount(invoiceData.grandTotal)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoiceData.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{invoiceData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by InvoiceIt</Text>
          <Text style={styles.footerSubtext}>Thanks for doing business with us</Text>
        </View>
      </Page>
    </Document>
  )
}

export default InvoicePDFTemplate
