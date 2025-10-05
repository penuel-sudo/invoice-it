import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProfileImage(userId: string): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    async function fetchImage() {
      const { data, error } = await supabase
        .from('profiles')
        .select('image_url')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching image:', error)
        return
      }

      setImageUrl(data?.image_url || null)
    }

    fetchImage()

    // Listen for profile picture updates
    const handleProfilePictureUpdate = () => {
      fetchImage()
    }

    window.addEventListener('profilePictureChanged', handleProfilePictureUpdate)
    return () => window.removeEventListener('profilePictureChanged', handleProfilePictureUpdate)
  }, [userId])

  return imageUrl
}