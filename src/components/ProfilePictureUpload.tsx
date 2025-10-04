import { useRef, useState } from 'react'
import { Pencil, Upload, X, Loader2 } from 'lucide-react'
import { useProfilePicture } from '../hooks/useProfilePicture'
import ProfilePicture from './ProfilePicture'
import { brandColors } from '../stylings'
import toast from 'react-hot-toast'

interface ProfilePictureUploadProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showHoverEffect?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function ProfilePictureUpload({ 
  size = 'lg', 
  showHoverEffect = true,
  className = '',
  style = {}
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const { profilePictureUrl, isUploading, uploadPicture, deletePicture } = useProfilePicture()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      await uploadPicture(file)
      toast.success('Profile picture updated!')
    } catch (error) {
      toast.error('Failed to upload profile picture')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    try {
      await deletePicture()
      toast.success('Profile picture removed!')
    } catch (error) {
      toast.error('Failed to remove profile picture')
    }
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

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
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={() => showHoverEffect && setIsHovered(true)}
        onMouseLeave={() => showHoverEffect && setIsHovered(false)}
        onClick={handleClick}
      >
        <ProfilePicture 
          size={size}
          showBorder={true}
          className={className}
          style={style}
        />

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
            {profilePictureUrl ? (
              <Pencil size={20} color="white" />
            ) : (
              <Upload size={20} color="white" />
            )}
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

      {/* Delete button (only show if picture exists) */}
      {profilePictureUrl && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            backgroundColor: brandColors.error[500],
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.error[600]
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.error[500]
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
