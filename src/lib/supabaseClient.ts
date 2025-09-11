import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if(!supabaseUrl){
    throw new Error("Missing Environment Variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Enhanced session persistence for PWA
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key)
        } catch (error) {
          console.error('Error getting item from localStorage:', error)
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          console.error('Error setting item in localStorage:', error)
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.error('Error removing item from localStorage:', error)
        }
      }
    },
    // Extend session duration
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'invoice-it-app'
    }
  }
});
