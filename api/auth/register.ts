import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
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
    } = await req.json()

    if (!email || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email, password, and name are required' })
      }
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must be at least 6 characters' })
      }
    }

    // Initialize Supabase client with server-side credentials
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message })
      }
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: data.user,
        session: data.session,
        message: 'Account created successfully! Please check your email to verify your account.'
      })
    }

  } catch (error: any) {
    console.error('Registration error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
