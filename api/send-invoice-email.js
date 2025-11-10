import { Resend } from 'resend';
import { REMINDER_MESSAGES } from '../src/types/autoReminders';

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const splitLines = (lines) =>
  lines
    .flatMap((line) =>
      String(line || '')
        .split(/\r?\n/)
        .map((segment) => segment.trim())
        .filter(Boolean)
    );

const formatHtmlParagraphs = (lines) =>
  splitLines(lines)
    .map((line, idx, arr) => {
      const marginBottom = idx === arr.length - 1 ? 28 : 16;
      return `<p style="margin: 0 0 ${marginBottom}px 0; font-size: 15px; color: #4b5563; line-height: 1.7;">${escapeHtml(line)}</p>`;
    })
    .join('');

const formatTemplate = (template, values) => {
  if (!template) return '';
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), val ?? ''),
    template
  );
};

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
      businessName,
      userEmail,
      type = 'invoice',
      reminderContext
    } = req.body;

    // Validation
    if (!to || !invoiceData) {
      const missing = [];
      if (!to) missing.push('to');
      if (!invoiceData) missing.push('invoiceData');
      return res.status(400).json({ 
        error: `Missing required fields: ${missing.join(', ')}`,
        received: { to: !!to, invoiceData: !!invoiceData }
      });
    }

    // Helper function to get currency symbol
    function getCurrencySymbol(code) {
      const symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'NGN': '₦', 'CAD': 'C$',
        'AUD': 'A$', 'JPY': '¥', 'INR': '₹', 'ZAR': 'R'
      };
      return symbols[code] || '$';
    }
    
    // Format sender info
    const userFullName = userData?.fullName || userData?.full_name || '';
    const businessName_ = businessName || userData?.businessName || userData?.company_name || '';
    const displayBusinessName = businessName_ || 'Invoice It';
    const fullClientName = clientName || 'there';
    
    // Get currency symbol
    const currencySymbol = invoiceData?.currencySymbol 
      ? invoiceData.currencySymbol 
      : getCurrencySymbol(invoiceData?.currencyCode || invoiceData?.currency_code || 'USD');
    
    // Default greeting
    const defaultGreeting = `Hi ${fullClientName},`;
    const finalGreeting = greetingMessage || defaultGreeting;

    // Format due date
    const formattedDueDate = new Date(invoiceData.dueDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Format amount
    const totalAmount = (invoiceData.total || invoiceData.grandTotal || 0).toFixed(2);

    const placeholders = {
      clientName: fullClientName,
      invoiceNumber: invoiceData.invoiceNumber,
      amountDue: `${currencySymbol}${totalAmount}`,
      dueDate: formattedDueDate,
      businessName: displayBusinessName
    };

    const isReminder = type === 'reminder';
    const reminderKey = reminderContext?.reminderKey || 'on_due_date';
    const reminderTone = reminderContext?.tone || 'friendly';

    let messageLines = [];
    let emailSubject = `Invoice #${invoiceData.invoiceNumber} from ${displayBusinessName}`;

    if (isReminder) {
      const tonePresets = REMINDER_MESSAGES[reminderTone] || REMINDER_MESSAGES.friendly;
      const messageTemplate = tonePresets[reminderKey] || tonePresets['on_due_date'];
      const introLine = formatTemplate(messageTemplate.intro, placeholders);
      const followUpLine = messageTemplate.followUp ? formatTemplate(messageTemplate.followUp, placeholders) : '';
      messageLines = [introLine];
      if (followUpLine) {
        messageLines.push(followUpLine);
      }
      emailSubject = formatTemplate(messageTemplate.subject, placeholders);
    } else {
      const defaultInvoiceMessage = 'Your invoice is ready for review. We appreciate your business and look forward to continuing our partnership.';
      messageLines = [defaultInvoiceMessage];
    }

    if (!messageLines.length) {
      messageLines = [
        'Your invoice is ready for review. We appreciate your business and look forward to continuing our partnership.'
      ];
    }

    const messageHtml = formatHtmlParagraphs(messageLines);

    const textSections = [
      finalGreeting,
      '',
      ...splitLines(messageLines)
    ];

    textSections.push(
      '',
      `Amount Due: ${currencySymbol}${totalAmount}`,
      `Due Date: ${formattedDueDate}`,
      '',
      'Thank you for your business,',
      displayBusinessName
    );

    const textContent = textSections.join('\n');

    // Bulletproof HTML email template (100% compatible with all email clients)
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Invoice ${invoiceData.invoiceNumber}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4;">
    <tr>
      <td style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 16px;" align="center">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #16a34a; padding: 32px 32px 28px 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${displayBusinessName}</h1>
                    <p style="margin: 0; font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, 0.9); text-transform: uppercase; letter-spacing: 0.5px;">Professional Invoicing</p>
                  </td>
                </tr>
              </table>
              <!-- Header accent line -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px;">
                <tr>
                  <td style="height: 4px; background-color: #22c55e;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              
              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">${finalGreeting}</p>
                    ${messageHtml}
                  </td>
                </tr>
              </table>
              
              <!-- Invoice Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; margin-bottom: 32px;">
                <!-- Card top accent -->
                <tr>
                  <td colspan="2" style="height: 4px; background-color: #22c55e; border-radius: 10px 10px 0 0;"></td>
                </tr>
                <!-- Card content -->
                <tr>
                  <td style="padding: 24px 28px;">
                    
                    <!-- Invoice Header Row -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                      <tr>
                        <td style="vertical-align: middle;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(22, 163, 74, 0.1); border: 1px solid rgba(22, 163, 74, 0.2); border-radius: 6px; padding: 6px 12px;">
                                <span style="font-size: 14px; font-weight: 600; color: #16a34a;">#${invoiceData.invoiceNumber}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="text-align: right; vertical-align: middle;">
                          <span style="font-size: 13px; color: #6b7280;">Due: </span>
                          <span style="font-size: 13px; font-weight: 600; color: #111827;">${formattedDueDate}</span>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Amount Section -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding: 24px 0;">
                          <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">Amount Due</p>
                          <p style="margin: 0; font-size: 48px; font-weight: 900; color: #16a34a; letter-spacing: -1px; line-height: 1;">${currencySymbol}${totalAmount}</p>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
              
              <!-- CTA Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <!-- View Invoice Button -->
                  <td width="48%" style="padding-right: 6px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="background-color: #ffffff; border: 2px solid #86efac; border-radius: 10px; text-align: center;">
                          <a href="#" style="display: block; padding: 14px 20px; font-size: 15px; font-weight: 600; color: #16a34a; text-decoration: none;">View Invoice</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <!-- Spacer -->
                  <td width="4%"></td>
                  
                  <!-- Pay Now Button -->
                  <td width="48%" style="padding-left: 6px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="background-color: #16a34a; border-radius: 10px; text-align: center;">
                          <a href="#" style="display: block; padding: 14px 20px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">Pay Now</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td style="height: 1px; background-color: #e5e7eb;"></td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Need Help?</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">If you have any questions about this invoice, please don't hesitate to reply to this email. We're here to help!</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; line-height: 1.7;">
                Thank you for your business. This is an automated invoice notification.<br>
                If you have any questions, please reply to this email.
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">Powered by Invoice It</p>
            </td>
          </tr>
          
        </table>
        <!-- End Main Container -->
        
      </td>
    </tr>
  </table>
  <!-- End Wrapper -->
  
</body>
</html>
    `;

    // Email configuration
    const verifiedFromAddress = process.env.RESEND_FROM || 'invoices@mail.invoice-it.org';
    
    // List ID for email headers
    const listId = `${invoiceData.invoiceNumber || Date.now()}-${displayBusinessName.toLowerCase().replace(/\s+/g, '-')}.list-id.mail.invoice-it.org`;
    
    // Reply-to email
    const replyToEmail = userData?.email || userData?.user?.email || userEmail || verifiedFromAddress;
    
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${displayBusinessName} <${verifiedFromAddress}>`,
      replyTo: [replyToEmail],
      to: [to],
      subject: emailSubject,
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
        const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || verifiedFromAddress;
        return res.status(403).json({
          error: 'Email sending is restricted in test mode',
          message: `Resend only allows sending to your verified email address (${verifiedEmail}) in test mode. To send to other recipients, verify a domain at resend.com/domains.`,
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