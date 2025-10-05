import { useRef, useState } from 'react'
import { Pencil, Upload, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { brandColors } from '../stylings'
import { useAuth } from '../lib/useAuth'
import toast from 'react-hot-toast'

interface ProfilePictureUploadProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showHoverEffect?: boolean
  className?: string
  style?: React.CSSProperties
}

const sizeMap = {
  sm: { width: '32px', height: '32px', fontSize: '0.75rem' },
  md: { width: '40px', height: '40px', fontSize: '0.875rem' },
  lg: { width: '80px', height: '80px', fontSize: '1.5rem' },
  xl: { width: '120px', height: '120px', fontSize: '2.5rem' }
}

export default function ProfilePictureUpload({ 
  size = 'lg', 
  showHoverEffect = true,
  className = '',
  style = {}
}: ProfilePictureUploadProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const uploadProfilePicture = async (file: File, userId: string) => {
    if (!file || !userId) return

    // Create unique file path: userId + timestamp
    const filePath = `${userId}/${Date.now()}_${file.name}`

    const { error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // allow replacing old file
      })

    if (error) {
      console.error('Upload failed:', error.message)
      throw error
    }

    console.log('✅ File uploaded! The DB trigger will now update profiles.image_url automatically.')
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setIsUploading(true)
      await uploadProfilePicture(file, user.id)
      toast.success('Profile picture updated!')
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('profilePictureChanged'))
    } catch (error) {
      toast.error('Failed to upload profile picture')
    } finally {
      setIsUploading(false)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const sizeStyles = sizeMap[size]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Profile Picture with hover effect */}
      <div
        style={{
          position: 'relative',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          opacity: isUploading ? 0.7 : 1,
          transition: 'opacity 0.2s ease',
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: '50%',
          overflow: 'hidden',
          ...style
        }}
        onMouseEnter={() => showHoverEffect && setIsHovered(true)}
        onMouseLeave={() => showHoverEffect && setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Placeholder avatar */}
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: brandColors.primary[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: sizeStyles.fontSize,
          fontWeight: '600',
          color: brandColors.primary[700]
        }}>
          {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
        </div>

        {/* Hover overlay */}
        {showHoverEffect && isHovered && !isUploading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease'
          }}>
            <Pencil size={20} color="white" />
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Loader2 size={20} className="animate-spin" color={brandColors.primary[600]} />
          </div>
        )}
      </div>
    </div>
  )
}