import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and password are required' })
      }
    }

    // Initialize Supabase client with server-side credentials
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: error.message })
      }
    }

    // Return success response with user data
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: data.user,
        session: data.session
      })
    }

  } catch (error: any) {
    console.error('Login error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
