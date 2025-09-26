import { pdf } from '@react-pdf/renderer'
import InvoicePDFTemplate from './InvoicePDFTemplate.js'
import React from 'react'
import { Buffer } from 'buffer' // Import Buffer just in case, though it's usually global

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
    
    // 2. AWAIT the conversion to get the raw data object
    const initialBuffer = await pdfDoc.toBuffer() 
    
    // 3. *** THE DEFINITIVE FIX ***
    // Create a NEW, native Node.js Buffer from the initial object. 
    // This forces the environment to recognize it as a standard binary object.
    const pdfBuffer = Buffer.from(initialBuffer) 

    console.log('PDF generated successfully')

    // 4. Set status and headers explicitly
    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`)

    // 5. Send the raw Buffer data using res.end()
    res.end(pdfBuffer) 

  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ 
      error: 'Failed to generate PDF on server',
      details: error.message
    })
  }
}