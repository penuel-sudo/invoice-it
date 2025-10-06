import { useState, useRef } from 'react'
import { Pencil, Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { brandColors } from '../stylings'
import { useAuth } from '../lib/useAuth'
import toast from 'react-hot-toast'

interface AvatarUploadProps {
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

export default function AvatarUpload({ 
  size = 'lg', 
  showHoverEffect = true,
  className = '',
  style = {}
}: AvatarUploadProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const uploadAvatar = async (file: File) => {
    if (!user) return

    try {
      setIsUploading(true)
      
      // Create unique file path: user_id/timestamp_filename
      const filePath = `${user.id}/${Date.now()}_${file.name}`

      const { error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // allow replacing old file
        })

      if (error) {
        console.error('Upload failed:', error.message)
        toast.error('Upload failed: ' + error.message)
        return
      }

      toast.success('Avatar updated successfully!')
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('avatarChanged'))

    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload image: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image')
      return
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB')
      return
    }

    await uploadAvatar(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // Clear file input
    }
  }

  const sizeStyles = sizeMap[size]

  return (
    <div 
      style={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: '50%',
        overflow: 'hidden',
        ...sizeStyles,
        ...style
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {/* Use AvatarDisplay component internally */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: brandColors.primary[200],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%'
      }}>
        <Upload size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 30 : 40} color={brandColors.primary[600]} />
      </div>

      {isUploading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          zIndex: 10
        }}>
          <Loader2 size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 30 : 40} className="animate-spin" color="white" />
        </div>
      )}

      {showHoverEffect && !isUploading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
            borderRadius: '50%',
            zIndex: 5
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Pencil size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 30 : 40} color="white" />
        </div>
      )}
    </div>
  )
}
