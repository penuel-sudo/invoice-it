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

// PDF Template Component using React.createElement
const InvoicePDFTemplate = ({ data }) => {
  const { invoiceData, user } = data
  
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, "Invoice Details")
      ),

      // Invoice Details
      React.createElement(View, { style: styles.invoiceDetails },
        React.createElement(View, { style: styles.invoiceInfo },
          React.createElement(Text, { style: styles.invoiceNumber }, `Payment - ${invoiceData.invoiceNumber}`),
          React.createElement(Text, { style: styles.invoiceDate },
            `${formatDate(invoiceData.invoiceDate)} • Due: ${formatDate(invoiceData.dueDate)}`
          )
        ),
        React.createElement(View, { style: styles.statusContainer },
          React.createElement(Text, { style: styles.statusLabel }, "Status:"),
          React.createElement(View, { style: [styles.statusButton, styles.statusPending] },
            React.createElement(Text, null, "Pending")
          )
        )
      ),

      // Total Amount
      React.createElement(View, { style: styles.totalAmount },
        React.createElement(Text, { style: styles.totalAmountText },
          formatAmount(invoiceData.grandTotal)
        )
      ),

      // Issuer Info
      React.createElement(View, { style: styles.issuerSection },
        React.createElement(View, { style: styles.issuerAvatar },
          React.createElement(Text, { style: styles.issuerInitials }, getUserInitials(user))
        ),
        React.createElement(View, { style: styles.issuerInfo },
          React.createElement(Text, { style: styles.issuerName },
            user?.user_metadata?.full_name || user?.name || 'Your Name'
          ),
          React.createElement(Text, { style: styles.issuerEmail },
            user?.email || 'your.email@example.com'
          )
        )
      ),

      // Client Info
      React.createElement(View, { style: styles.clientSection },
        React.createElement(Text, { style: styles.clientHeader }, "Bill To:"),
        React.createElement(View, { style: styles.clientLayout },
          // Left Column - Name and Company
          React.createElement(View, { style: styles.clientLeft },
            React.createElement(Text, { style: styles.clientName }, invoiceData.clientName),
            invoiceData.clientCompanyName && React.createElement(Text, { style: styles.clientCompany }, invoiceData.clientCompanyName)
          )
        )
      ),

      // Service Items
      React.createElement(View, { style: styles.itemsSection },
        React.createElement(Text, { style: styles.itemsHeader }, "Service Items:"),
        ...invoiceData.items.map((item, index) =>
          React.createElement(View, { key: item.id || index, style: styles.itemRow },
            React.createElement(Text, { style: styles.itemDescription },
              `${item.quantity} ${item.description}`
            ),
            React.createElement(Text, { style: styles.itemPrice },
              formatAmount(item.lineTotal)
            )
          )
        )
      ),

      // Totals
      React.createElement(View, { style: styles.totalsSection },
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Subtotal:"),
          React.createElement(Text, { style: styles.totalValue }, formatAmount(invoiceData.subtotal))
        ),
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Tax:"),
          React.createElement(Text, { style: styles.totalValue }, formatAmount(invoiceData.taxTotal))
        ),
        React.createElement(View, { style: styles.grandTotalRow },
          React.createElement(Text, { style: styles.grandTotalLabel }, "Total:"),
          React.createElement(Text, { style: styles.grandTotalValue }, formatAmount(invoiceData.grandTotal))
        )
      ),

      // Notes
      invoiceData.notes && React.createElement(View, { style: styles.notesSection },
        React.createElement(Text, { style: styles.notesLabel }, "Notes:"),
        React.createElement(Text, { style: styles.notesText }, invoiceData.notes)
      ),

      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, "Generated by InvoiceIt"),
        React.createElement(Text, { style: styles.footerSubtext }, "Thanks for doing business with us")
      )
    )
  )
}

export default InvoicePDFTemplate