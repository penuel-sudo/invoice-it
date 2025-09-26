// api/generate-pdf.js

import { pdf } from '@react-pdf/renderer'
import InvoicePDFTemplate from './InvoicePDFTemplate.js'
import React from 'react'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { invoiceData, user } = req.body

    if (!invoiceData) {
      return res.status(400).json({ error: 'Invoice data is required' })
    }

    console.log('Generating PDF for invoice:', invoiceData.invoiceNumber)

    const pdfDoc = pdf(
      React.createElement(InvoicePDFTemplate, { 
        data: { invoiceData, user } 
      })
    )
    
    // ----------------------------------------------------
    // *** CRITICAL FIX: Explicitly create a native Buffer ***
    const initialBuffer = await pdfDoc.toBuffer() 
    const pdfBuffer = Buffer.from(initialBuffer) // <-- GUARANTEES a standard Node.js Buffer
    // ----------------------------------------------------

    console.log('PDF generated successfully')

    // Set status and headers explicitly
    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`)

    // Use res.end() to send the raw Buffer (as established in previous step)
    res.end(pdfBuffer) 

  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ 
      error: 'Failed to generate PDF on server',
      details: error.message
    })
  }
}