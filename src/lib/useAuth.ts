import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { initializeCountryCache, clearCountryCache } from './countryCache'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          console.log('Initial session loaded:', session ? 'User logged in' : 'No session')
          // Initialize country cache if user is already logged in
          if (session?.user) {
            console.log('User already logged in, initializing country cache')
            initializeCountryCache()
          }
        }
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false
        })
      } catch (error) {
        console.error('Failed to get initial session:', error)
        setAuthState({
          user: null,
          session: null,
          loading: false
        })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'User logged in' : 'User logged out')
        
        // Handle token refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          clearCountryCache()
        }
        
        // Initialize country cache when user logs in
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, initializing country cache')
          initializeCountryCache()
        }
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name?: string, profileData?: {
    countryCode?: string
    phoneNumber?: string
    countryName?: string
    phonePrefix?: string
    languageCode?: string
    currencyCode?: string
    timezone?: string
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
            country_code: profileData?.countryCode || '',
            phone: profileData?.phoneNumber || '',
            country_name: profileData?.countryName || '',
            phone_prefix: profileData?.phonePrefix || '',
            language_code: profileData?.languageCode || '',
            currency_code: profileData?.currencyCode || '',
            timezone: profileData?.timezone || ''
          }
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as any }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as any }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-redirect`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as any }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as any }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as any }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as any }
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Session refresh failed:', error)
        return { error }
      }
      console.log('Session refreshed successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Session refresh exception:', error)
      return { error: error as any }
    }
  }

  const checkSessionStatus = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Session check failed:', error)
        return { session: null, error }
      }
      
      if (session) {
        const expiresAt = new Date(session.expires_at! * 1000)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        
        console.log('Session status:', {
          isValid: session.expires_at! > now.getTime() / 1000,
          expiresAt: expiresAt.toLocaleString(),
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60) + ' minutes'
        })
      }
      
      return { session, error: null }
    } catch (error) {
      console.error('Session status check failed:', error)
      return { session: null, error: error as any }
    }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut,
    refreshSession,
    checkSessionStatus
  }
}
