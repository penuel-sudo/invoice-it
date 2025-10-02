import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      to, 
      invoiceData, 
      userData, 
      clientName 
    } = req.body

    // Validate required fields
    if (!to || !invoiceData || !userData || !clientName) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, invoiceData, userData, clientName' 
      })
    }

    // Generate PDF (you'll need to implement this)
    // const pdfBuffer = await generateInvoicePDF(invoiceData)

    // Create email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoiceData.invoiceNumber}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
              background-color: #f8fafc;
            }
            .email-card {
              background: white;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
            }
            .greeting {
              font-size: 18px;
              color: #1a202c;
              margin-bottom: 24px;
            }
            .invoice-header {
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              color: white;
              padding: 24px;
              border-radius: 8px;
              margin: 24px 0;
              text-align: center;
            }
            .invoice-number {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .invoice-amount {
              font-size: 32px;
              font-weight: bold;
              margin: 16px 0;
            }
            .button-group {
              display: flex;
              gap: 16px;
              margin: 32px 0;
              flex-wrap: wrap;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              text-align: center;
              transition: all 0.2s;
              flex: 1;
              min-width: 140px;
            }
            .btn-primary {
              background: #16a34a;
              color: white;
            }
            .btn-secondary {
              background: #ffffff;
              color: #16a34a;
              border: 2px solid #16a34a;
            }
            .btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
            }
            .btn-primary:hover {
              background: #15803d;
            }
            .btn-secondary:hover {
              background: #f0fdf4;
            }
            .footer {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .button-group {
                flex-direction: column;
              }
              .btn {
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-card">
            <div class="greeting">
              Hi ${clientName},<br><br>
              Please find your invoice from ${userData.businessName || userData.fullName} attached below.
            </div>

            <div class="invoice-header">
              <div class="invoice-number">Invoice #${invoiceData.invoiceNumber}</div>
              <div class="invoice-amount">$${invoiceData.total.toFixed(2)}</div>
              <div style="font-size: 16px; opacity: 0.9;">
                Due: ${new Date(invoiceData.dueDate).toLocaleDateString()}
              </div>
            </div>

            <div class="button-group">
              <a href="#" class="btn btn-primary">Pay Now</a>
              <a href="#" class="btn btn-secondary">Download PDF</a>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p><strong>${userData.businessName || userData.fullName}</strong></p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${userData.businessName || userData.fullName} <noreply@resend.dev>`,
      to: [to],
      subject: `Invoice #${invoiceData.invoiceNumber} - $${invoiceData.total.toFixed(2)}`,
      html: emailHtml,
      // attachments: [
      //   {
      //     filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
      //     content: pdfBuffer
      //   }
      // ]
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    return res.status(200).json({ 
      success: true, 
      messageId: data.id,
      message: 'Email sent successfully' 
    })

  } catch (error) {
    console.error('Email send error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}
