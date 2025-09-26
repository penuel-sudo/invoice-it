import { pdf } from '@react-pdf/renderer'
import InvoicePDFTemplate from './InvoicePDFTemplate.js'
import React from 'react' // Keep the .js extension for the template file

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
    
    // 2. AWAIT the asynchronous conversion to get the raw Buffer data
    const pdfBuffer = await pdfDoc.toBuffer()
    
    console.log('PDF generated successfully')

    // 3. Set status and headers explicitly
    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`)

    // 4. *** THE FINAL FIX ***
    // Use res.end() to write the raw Buffer data to the response stream
    // This bypasses the Vercel helper function that incorrectly throws ERR_INVALID_ARG_TYPE.
    res.end(pdfBuffer) 

  } catch (error) {
    console.error('Error generating PDF:', error)
    // Send back a proper JSON error response
    res.status(500).json({ 
      error: 'Failed to generate PDF on server',
      details: error.message
    })
  }
}