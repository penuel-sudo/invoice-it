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
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    // Check if user has complete profile (especially phone number)
    let hasCompleteProfile = false
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', data.user.id)
        .single()
      
      hasCompleteProfile = !profileError && profile?.phone
    } catch (profileCheckError) {
      console.log('Profile check failed:', profileCheckError)
      hasCompleteProfile = false
    }

    // Return success response with user data and profile status
    return res.status(200).json({
      success: true,
      user: data.user,
      session: data.session,
      hasCompleteProfile,
      redirectTo: hasCompleteProfile ? '/dashboard' : '/settings'
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
