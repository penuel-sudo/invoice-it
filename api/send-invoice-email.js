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
      clientName,
      greetingMessage,
      businessName
    } = req.body

    // Debug logging
    console.log('Received data:', {
      to: !!to,
      invoiceData: !!invoiceData,
      userData: !!userData,
      clientName: !!clientName,
      greetingMessage: !!greetingMessage,
      businessName: !!businessName,
      toValue: to,
      clientNameValue: clientName,
      greetingMessageValue: greetingMessage,
      businessNameValue: businessName
    })

    // Validate required fields
    if (!to || !invoiceData) {
      const missing = []
      if (!to) missing.push('to')
      if (!invoiceData) missing.push('invoiceData')
      
      return res.status(400).json({ 
        error: `Missing required fields: ${missing.join(', ')}`,
        received: { to: !!to, invoiceData: !!invoiceData }
      })
    }

    // Generate PDF (you'll need to implement this)
    // const pdfBuffer = await generateInvoicePDF(invoiceData)

    // Create clean, minimal email template
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
            .greeting {
              font-size: 16px;
              color: #1a202c;
              margin-bottom: 24px;
              line-height: 1.5;
            }
            .invoice-card {
              background: white;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
              max-width: 400px;
              margin: 0 auto;
            }
            .invoice-number {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 16px;
              font-weight: 500;
            }
            .invoice-amount {
              font-size: 32px;
              font-weight: bold;
              color: #16a34a;
              margin-bottom: 16px;
              text-align: center;
            }
            .due-date {
              font-size: 14px;
              color: #64748b;
              text-align: center;
              margin-bottom: 24px;
            }
            .button-group {
              width: 100%;
              margin-top: 16px;
            }
            .btn {
              padding: 8px 16px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 500;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s;
              display: inline-block;
              text-align: center;
              width: 100%;
              box-sizing: border-box;
            }
            .btn-primary {
              background: #16a34a !important;
              color: white !important;
              border: none !important;
            }
            .btn-secondary {
              background: transparent !important;
              color: #16a34a !important;
              border: 1px solid #bbf7d0 !important;
            }
            .btn:hover {
              transform: translateY(-1px);
            }
            .btn-primary:hover {
              background: #15803d;
            }
            .btn-secondary:hover {
              background: #f0fdf4;
              border-color: #86efac;
            }
            .view-text {
              font-size: 12px;
              color: #64748b;
              text-align: center;
              margin-top: 16px;
              font-style: italic;
            }
            .footer {
              margin-top: 32px;
              text-align: center;
              font-size: 14px;
              color: #64748b;
            }
            @media (max-width: 600px) {
              .button-group {
                flex-direction: column;
              }
              .btn {
                width: 100%;
                justify-content: center;
              }
            }
          </style>
        </head>
        <body>
          <!-- Greeting Message -->
          <div class="greeting">
            ${greetingMessage || `Hi ${clientName || 'Client'},`}
          </div>

          <!-- Small Focused Card -->
          <div class="invoice-card">
            <!-- Top-left: Invoice Number -->
            <div class="invoice-number">
              Payment ${invoiceData.invoiceNumber}
            </div>

            <!-- Prominent: Total Amount -->
            <div class="invoice-amount">
              $${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)}
            </div>

            <!-- Due Date -->
            <div class="due-date">
              Due: ${new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            <!-- Action Buttons -->
            <table class="button-group" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="48%" align="left">
                  <a href="#" class="btn btn-secondary">
                    View Invoice
                  </a>
                </td>
                <td width="4%">&nbsp;</td>
                <td width="48%" align="right">
                  <a href="#" class="btn btn-primary">
                    Pay Now
                  </a>
                </td>
              </tr>
            </table>

          </div>

          <!-- Business Footer -->
          <div class="footer">
            <strong>${businessName || userData?.businessName || userData?.fullName || 'Your Business'}</strong> - Thank you for your business
          </div>
        </body>
      </html>
    `

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${businessName || userData?.businessName || userData?.fullName || 'Your Business'} <noreply@resend.dev>`,
      to: [to],
      subject: `Invoice #${invoiceData.invoiceNumber} - $${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)}`,
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
      
      // Check for Resend domain validation error
      if (error.statusCode === 403 && error.name === 'validation_error') {
        const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || 'your verified email'
        return res.status(403).json({ 
          error: 'Email sending is restricted in test mode',
          message: `Resend only allows sending to your verified email address (${verifiedEmail}) in test mode. To send to other recipients, please verify a domain at resend.com/domains and update the "from" address to use your verified domain.`,
          type: 'domain_verification_required',
          verifiedEmail: verifiedEmail,
          helpUrl: 'https://resend.com/domains'
        })
      }
      
      // Generic error
      return res.status(500).json({ 
        error: error.message || 'Failed to send email',
        details: error
      })
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
