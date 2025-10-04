import { supabase } from './supabaseClient'

export interface ProfilePictureUpload {
  file: File
  userId: string
}

export interface ProfilePictureResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload a profile picture to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user's ID
 * @returns Promise with upload result
 */
export async function uploadProfilePicture({ file, userId }: ProfilePictureUpload): Promise<ProfilePictureResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    // Create file path: profile-pictures/{userId}/avatar.{extension}
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)
    
    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

/**
 * Get profile picture URL with fallback to Google avatar
 * @param userId - The user's ID
 * @returns Promise with profile picture URL
 */
export async function getProfilePictureUrl(userId: string): Promise<string> {
  try {
    // Call the Supabase function to get profile picture URL
    const { data, error } = await supabase.rpc('get_profile_picture_url', {
      user_id: userId
    })

    if (error) {
      console.error('Error getting profile picture:', error)
      return ''
    }

    return data || ''
  } catch (error) {
    console.error('Error getting profile picture:', error)
    return ''
  }
}

/**
 * Delete a profile picture from Supabase Storage
 * @param userId - The user's ID
 * @returns Promise with deletion result
 */
export async function deleteProfilePicture(userId: string): Promise<ProfilePictureResult> {
  try {
    // List files in user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('profile-pictures')
      .list(userId)

    if (listError) {
      console.error('List error:', listError)
      return { success: false, error: listError.message }
    }

    // Delete all files in user's folder
    const filePaths = files.map(file => `${userId}/${file.name}`)
    
    if (filePaths.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove(filePaths)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        return { success: false, error: deleteError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete image' }
  }
}

/**
 * Get user's display name from metadata
 * @param user - Supabase user object
 * @returns Display name
 */
export function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || 
         user?.user_metadata?.name || 
         user?.email?.split('@')[0] || 
         'User'
}

/**
 * Get user's initial for avatar fallback
 * @param user - Supabase user object
 * @returns First letter of name or email
 */
export function getUserInitial(user: any): string {
  const name = getUserDisplayName(user)
  return name.charAt(0).toUpperCase()
}

/**
 * Get user's profile picture URL from storage or fallback to Google avatar
 * @param user - Supabase user object
 * @returns Profile picture URL or null
 */
export async function getUserProfilePictureUrl(user: any): Promise<string | null> {
  try {
    if (!user?.id) return null

    // First, check if user has a custom profile picture in storage
    const { data: files, error } = await supabase.storage
      .from('profile-pictures')
      .list(user.id, {
        limit: 1,
        offset: 0
      })

    if (error) {
      console.error('Error checking profile picture:', error)
    } else if (files && files.length > 0) {
      // User has a custom profile picture
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(`${user.id}/${files[0].name}`)
      
      // Add cache-busting parameter to ensure fresh image
      const url = new URL(data.publicUrl)
      url.searchParams.set('t', Date.now().toString())
      return url.toString()
    }

    // Fallback to Google avatar if available
    const googleAvatarUrl = user?.user_metadata?.avatar_url
    if (googleAvatarUrl) {
      return googleAvatarUrl
    }

    return null
  } catch (error) {
    console.error('Error getting profile picture URL:', error)
    return null
  }
}
