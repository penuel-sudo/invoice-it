import { pdf } from '@react-pdf/renderer'
import InvoicePDFTemplate from './InvoicePDFTemplate.js'
import React from 'react'
import { Buffer } from 'buffer' 

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

    // 1. Create the PDF Document instance
    const pdfDoc = pdf(
      React.createElement(InvoicePDFTemplate, { 
        data: { invoiceData, user } 
      })
    )
    
    // 2. Await the buffer and immediately force conversion to a native Node.js Buffer
    // This removes the intermediate variable confusion
    const pdfBuffer = Buffer.from(await pdfDoc.toBuffer()) 

    console.log('PDF generated successfully')

    // 3. Set status and headers explicitly
    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`)

    // 4. Send the raw Buffer data using res.end()
    res.end(pdfBuffer) 

  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ 
      error: 'Failed to generate PDF on server',
      details: error.message
    })
  }
}