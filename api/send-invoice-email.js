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

    // Helper function to get currency symbol (if not available in data)
    function getCurrencySymbol(code) {
      const symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'NGN': '₦', 'CAD': 'C$',
        'AUD': 'A$', 'JPY': '¥', 'INR': '₹', 'ZAR': 'R'
      }
      return symbols[code] || '$'
    }
    
    // Format sender info early for use in HTML template
    const userFullName_ = userData?.fullName || userData?.full_name || ''
    const businessName_ = businessName || userData?.businessName || userData?.company_name || ''
    const displayBusinessName = businessName_ || 'Invoice It'
    // Simplified sender name - just business name for better deliverability
    const displaySenderName = displayBusinessName
    const fullClientName = clientName || 'there'
    
    // Get currency symbol from invoice data or default to $
    const currencySymbol = invoiceData?.currencySymbol 
      ? invoiceData.currencySymbol 
      : (invoiceData?.currency_code 
        ? getCurrencySymbol(invoiceData.currency_code) 
        : '$')
    
    // Default greeting with full client name
    const defaultGreeting = `Hi ${fullClientName},`
    const finalGreeting = greetingMessage || defaultGreeting

    const textContent = `
${finalGreeting}

Your invoice #${invoiceData.invoiceNumber} for ${currencySymbol}${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)} is ready.

Please review the details and complete the payment at your convenience.

Thank you for your business,
${displayBusinessName}
    `;

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
            .greeting { font-size: 16px; margin: 0 0 12px 0; color: #111827; }
            .lead { font-size: 14px; margin: 0 0 20px 0; color: #374151; line-height: 1.6; }
            .meta {
              background: #f9fafb; border: 1px solid #eef2f7; border-radius: 10px; padding: 20px; margin: 16px 0 20px 0;
            }
            .meta-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 12px 0; font-size: 14px; }
            .meta-key { color: #9ca3af; font-size: 13px; font-weight: 500; }
            .invoice-number-row { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .invoice-number-value { color: #9ca3af; font-size: 12px; font-weight: 400; text-align: left; }
            .amount-row { margin: 24px 0; text-align: center; }
            .amount { font-size: 36px; font-weight: 800; color: #16a34a; text-align: center; display: block; margin: 0; }
            .due-date-row { margin-top: 20px; display: flex; justify-content: flex-end; }
            .due-date-label { color: #6b7280; font-size: 12px; font-weight: 400; margin-right: 8px; }
            .due-date-value { color: #111827; font-size: 13px; font-weight: 500; text-align: right; }
            .cta-wrapper { margin-top: 24px; }
            .cta-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0 auto;
            }
            .cta-table td { padding: 0; text-align: center; }
            .cta-table td:first-child { padding-right: 8px; }
            .cta-table td:last-child { padding-left: 8px; }
            .btn { 
              display: inline-block; 
              text-decoration: none; 
              padding: 12px 24px; 
              border-radius: 8px; 
              font-weight: 600; 
              font-size: 14px;
              width: 100%;
              box-sizing: border-box;
              text-align: center;
            }
            .btn-primary { background: #16a34a; color: #ffffff !important; }
            .btn-secondary { background: transparent; color: #16a34a !important; border: 2px solidrgb(136, 243, 175); }
            .footer { 
              text-align: center; 
              color: #6b7280; 
              font-size: 12px; 
              padding: 24px 8px 8px 8px;
              line-height: 1.6;
            }
            @media (max-width: 480px) { 
              .invoice-number-row { flex-direction: column; gap: 8px; align-items: flex-start; }
              .invoice-number-value { text-align: left; }
              .due-date-value { text-align: left; }
              .amount-row { margin: 20px 0; }
              .amount { font-size: 32px; }
              .cta-table td:first-child { padding-right: 6px; }
              .cta-table td:last-child { padding-left: 6px; }
              .btn { padding: 10px 16px; font-size: 13px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="brand">${displayBusinessName}</span>
            </div>
            <div class="card">
              <p class="greeting">${finalGreeting}</p>
              <p class="lead">Your invoice is ready for review.</p>

              <div class="meta">
                <div class="invoice-number-row">
                  <span class="invoice-number-value">#${invoiceData.invoiceNumber}</span>
                  <span class="due-date-value">${new Date(invoiceData.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="amount-row">
                  <span class="amount">${currencySymbol}${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div class="cta-wrapper">
                <table class="cta-table" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="48%">
                      <a class="btn btn-secondary" href="#">View Invoice</a>
                    </td>
                    <td width="4%">&nbsp;</td>
                    <td width="48%">
                      <a class="btn btn-primary" href="#">Pay Now</a>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">Thank you for your business. If you have any questions, please reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const verifiedFromAddress = process.env.RESEND_FROM || 'invoices@mail.invoice-it.org';
    // Subject line without payment-related words - just indicates it's from the business
    const invoiceSubject = `Invoice #${invoiceData.invoiceNumber} from ${displayBusinessName}`;
    
    // Generate a unique list ID for mailing list header (format similar to example)
    const listId = `${invoiceData.invoiceNumber || Date.now()}-${displayBusinessName.toLowerCase().replace(/\s+/g, '-')}.list-id.mail.invoice-it.org`
    
    const { data, error } = await resend.emails.send({
      from: `${displayBusinessName} <${verifiedFromAddress}>`,
      replyTo: [ to ],
      to: [ to ],
      subject: invoiceSubject,
      text: textContent,
      html: emailHtml,
      headers: {
        'List-Unsubscribe': '<mailto:unsubscribe@mail.invoice-it.org>, <https://invoice-it.org/unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-Id': `<${listId}>`,
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'All'
      },
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
