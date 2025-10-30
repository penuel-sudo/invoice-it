import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      to, 
      invoiceData, 
      userData, 
      clientName,
      greetingMessage,
      businessName
    } = req.body;

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
    });

    if (!to || !invoiceData) {
      const missing = [];
      if (!to) missing.push('to');
      if (!invoiceData) missing.push('invoiceData');
      return res.status(400).json({ 
        error: `Missing required fields: ${missing.join(', ')}`,
        received: { to: !!to, invoiceData: !!invoiceData }
      });
    }

    const textContent = `
Hi ${clientName || 'there'},

Your invoice #${invoiceData.invoiceNumber} for $${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)} is ready.

Please review the details and complete the payment at your convenience.

Thank you for your business,
${businessName || userData?.businessName || 'Your Business'}
    `;

    // Format sender info early for use in HTML template
    const userFullName_ = userData?.fullName || userData?.full_name || ''
    const businessName_ = businessName || userData?.businessName || userData?.company_name || ''
    const displayBusinessName = businessName_ || 'Invoice It'
    const displaySenderName = userFullName_ ? `${userFullName_} at ${displayBusinessName}` : displayBusinessName

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Invoice ${invoiceData.invoiceNumber}</title>
          <style>
            body {
              margin: 0;
              background: #f6f9fc;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif;
              color: #0f172a;
            }
            .container { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
            .header {
              background: #ffffff;
              border-bottom: 1px solid #e5e7eb;
              border-radius: 12px 12px 0 0;
              padding: 20px 24px;
              text-align: left;
            }
            .brand {
              display: inline-block;
              font-weight: 700; font-size: 18px; color: #16a34a;
            }
            .card {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 12px 12px;
              padding: 24px;
              box-shadow: 0 1px 2px rgba(16,24,40,0.04);
            }
            .greeting { font-size: 16px; margin: 0 0 16px 0; color: #111827; }
            .lead { font-size: 14px; margin: 0 0 20px 0; color: #374151; }
            .meta {
              background: #f9fafb; border: 1px solid #eef2f7; border-radius: 10px; padding: 16px; margin: 12px 0 20px 0;
            }
            .meta-row { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; font-size: 14px; color: #111827; }
            .meta-key { color: #6b7280; }
            .amount { font-size: 28px; font-weight: 800; color: #16a34a; margin: 4px 0 0 0; }
            .cta {
              display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;
            }
            .btn { display: inline-block; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 600; font-size: 14px; }
            .btn-primary { background: #16a34a; color: #ffffff; }
            .btn-muted { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 18px 8px; }
            @media (max-width: 480px) { .meta-row { flex-direction: column; gap: 4px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="brand">${displayBusinessName}</span>
            </div>
            <div class="card">
              <p class="greeting">${greetingMessage || `Hi ${clientName || 'there'},`}</p>
              <p class="lead">Your invoice is ready. Please review the details below and complete the payment at your convenience.</p>

              <div class="meta">
                <div class="meta-row">
                  <span class="meta-key">Invoice</span>
                  <span>#${invoiceData.invoiceNumber}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-key">Amount due</span>
                  <span class="amount">$${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-key">Due date</span>
                  <span>${new Date(invoiceData.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <div class="cta">
                <a class="btn btn-primary" href="#">Pay now</a>
                <a class="btn btn-muted" href="#">View invoice</a>
              </div>
            </div>
            <div class="footer">
              Thank you for your business. If you have any questions, just reply to this email.
            </div>
          </div>
        </body>
      </html>
    `;

    const verifiedFromAddress = process.env.RESEND_FROM || 'invoices@mail.invoice-it.org';

    const { data, error } = await resend.emails.send({
      from: `${displaySenderName} <${verifiedFromAddress}>`,
      replyTo: verifiedFromAddress,
      to: [ to ],
      subject: `Invoice #${invoiceData.invoiceNumber} - $${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)}`,
      text: textContent,
      html: emailHtml,
      headers: {
        'List-Unsubscribe': `<mailto:unsubscribe@mail.invoice-it.org>, <https://invoice-it.org/unsubscribe>`,
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Resend error:', error);
      if (error.statusCode === 403 && error.name === 'validation_error') {
        const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || verifiedFromAddress || 'your verified email';
        return res.status(403).json({
          error: 'Email sending is restricted in test mode',
          message: `Resend only allows sending to your verified email address (${verifiedEmail}) in test mode. To send to other recipients, please verify a domain at resend.com/domains and update the "from" address to use your verified domain.`,
          type: 'domain_verification_required',
          verifiedEmail,
          helpUrl: 'https://resend.com/domains'
        });
      }
      return res.status(500).json({
        error: error.message || 'Failed to send email',
        details: error
      });
    }

    return res.status(200).json({
      success: true,
      messageId: data.id,
      message: 'Email sent successfully'
    });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
}
