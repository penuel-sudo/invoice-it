import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import { getProfilePictureUrl, uploadProfilePicture, deleteProfilePicture } from '../lib/profilePicture'

export function useProfilePicture() {
  const { user } = useAuth()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Load profile picture on mount
  useEffect(() => {
    if (user) {
      loadProfilePicture()
    }
  }, [user])

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      if (user) {
        loadProfilePicture()
      }
    }

    window.addEventListener('profilePictureChanged', handleProfilePictureUpdate)
    return () => window.removeEventListener('profilePictureChanged', handleProfilePictureUpdate)
  }, [user])

  const loadProfilePicture = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const url = await getProfilePictureUrl(user.id)
      setProfilePictureUrl(url)
    } catch (error) {
      console.error('Error loading profile picture:', error)
      setProfilePictureUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadPicture = async (file: File) => {
    if (!user) return

    try {
      setIsUploading(true)
      const result = await uploadProfilePicture({ file, userId: user.id })
      
      if (result.success && result.url) {
        setProfilePictureUrl(result.url)
        
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('profilePictureChanged'))
        
        return result.url
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const deletePicture = async () => {
    if (!user) return

    try {
      setIsUploading(true)
      await deleteProfilePicture(user.id)
      setProfilePictureUrl(null)
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('profilePictureChanged'))
    } catch (error) {
      console.error('Error deleting profile picture:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return {
    profilePictureUrl,
    isLoading,
    isUploading,
    uploadPicture,
    deletePicture,
    loadProfilePicture
  }
}
