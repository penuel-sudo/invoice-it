import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { brandColors, typographyPresets } from '../../stylings'
import { Button } from '../ui/button'
import ProfileDropdown from '../ProfileDropdown'

// Helper function to convert typography presets to inline styles
const getTypographyStyle = (preset: any) => ({
  fontSize: typeof preset.fontSize === 'string' ? preset.fontSize : (Array.isArray(preset.fontSize) ? preset.fontSize[0] : '1rem'),
  fontWeight: preset.fontWeight,
  lineHeight: preset.lineHeight,
  letterSpacing: preset.letterSpacing,
})

export default function Header() {
  const [isMobile, setIsMobile] = useState(false)

  return (
    <header style={{
      backgroundColor: brandColors.white,
      borderBottom: `1px solid ${brandColors.neutral[200]}`,
      padding: '1rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    }}>
      {/* Left Side - Logo/App Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <img 
          src="/logo_web_app_64x64.png" 
          alt="Invoice-It" 
          style={{ 
            width: '32px', 
            height: '32px',
            borderRadius: '8px'
          }}
        />
        <h1 style={{
          ...getTypographyStyle(typographyPresets.h3),
          color: brandColors.neutral[900],
          margin: 0,
          fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
        }}>
          Invoice-It
        </h1>
      </div>

      {/* Right Side - Notifications & Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: brandColors.neutral[600],
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.neutral[100]
            e.currentTarget.style.color = brandColors.neutral[900]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = brandColors.neutral[600]
          }}
        >
          <Bell size={20} />
        </Button>

        {/* Profile Dropdown */}
        <ProfileDropdown variant="header" showPlan={false} />
      </div>
    </header>
  )
}
