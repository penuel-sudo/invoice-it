import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to } = req.body

    if (!to) {
      return res.status(400).json({ error: 'Email address required' })
    }

    const { data, error } = await resend.emails.send({
      from: 'Invoice App <noreply@resend.dev>',
      to: [to],
      subject: 'Test Email from Invoice App',
      html: '<h1>Hello!</h1><p>This is a test email from your Invoice App.</p>'
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    return res.status(200).json({ 
      success: true, 
      messageId: data.id 
    })

  } catch (error) {
    console.error('Test email error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
