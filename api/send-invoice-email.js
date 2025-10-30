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

Your invoice #${invoiceData.invoiceNumber}
for $${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)}
is ready from ${businessName || userData?.businessName || 'Your Business'}.

Please review the details and complete the payment.

Thank you for your business.
`;

    const htmlContent = `...`; // your existing html template

    const verifiedFromAddress = process.env.RESEND_FROM || 'invoices@mail.invoice-it.org';

    const { data, error } = await resend.emails.send({
      from: `${businessName || userData?.businessName || 'Your Business'} <${verifiedFromAddress}>`,
      to: [to],
      subject: `Invoice #${invoiceData.invoiceNumber} - $${(invoiceData.total || invoiceData.grandTotal || 0).toFixed(2)}`,
      text: textContent,
      html: htmlContent,
      headers: {
        'List-Unsubscribe': `<mailto:unsubscribe@mail.invoice-it.org>, <https://invoice-it.org/unsubscribe>`,
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Resend error:', error);
      if (error.statusCode === 403 && error.name === 'validation_error') {
        const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || verifiedFromAddress;
        return res.status(403).json({
          error: 'Email sending is restricted in test mode',
          message: `Resend only allows sending to your verified email (${verifiedEmail}) in test mode. To send to other recipients, verify your domain.`,
          type: 'domain_verification_required',
          verifiedEmail
        });
      }
      return res.status(500).json({ error: error.message || 'Failed to send email', details: error });
    }

    return res.status(200).json({ success: true, messageId: data.id, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
