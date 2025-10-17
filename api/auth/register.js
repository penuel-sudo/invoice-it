import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      email, 
      password, 
      name, 
      countryCode, 
      phoneNumber, 
      countryName, 
      phonePrefix, 
      languageCode, 
      currencyCode, 
      timezone 
    } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Create user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          country_code: countryCode || '',
          phone: phoneNumber || '',
          country_name: countryName || '',
          phone_prefix: phonePrefix || '',
          language_code: languageCode || '',
          currency_code: currencyCode || '',
          timezone: timezone || ''
        }
      }
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Return success response
    return res.status(200).json({
      success: true,
      user: data.user,
      session: data.session,
      message: 'Account created successfully! Please check your email to verify your account.'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
