import { pdf } from '@react-pdf/renderer'
import InvoicePDFTemplate from '../src/components/InvoicePDFTemplate'
import React from 'react'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { invoiceData, user } = req.body

    if (!invoiceData) {
      return res.status(400).json({ error: 'Invoice data is required' })
    }

    // Generate PDF using the template
    const pdfDoc = pdf(React.createElement(InvoicePDFTemplate, { invoiceData, user }) as any)
    const pdfBuffer = await pdfDoc.toBuffer()

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`)

    // Send PDF
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
}
