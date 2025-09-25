const { pdf } = require('@react-pdf/renderer');
const InvoicePDFTemplate = require('./InvoicePDFTemplate');
const React = require('react');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoiceData, user } = req.body;

    if (!invoiceData) {
      return res.status(400).json({ error: 'Invoice data is required' });
    }

    console.log('Generating PDF for invoice:', invoiceData.invoiceNumber);

    // Generate PDF using the template
    const pdfDoc = pdf(
      React.createElement(InvoicePDFTemplate, { 
        data: { invoiceData, user } 
      })
    );
    
    const pdfBuffer = await pdfDoc.toBuffer();

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
};
