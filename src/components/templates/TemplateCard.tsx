import { useState, useEffect } from 'react'
import { Eye, Edit } from 'lucide-react'
import { brandColors } from '../../stylings'

interface TemplateCardProps {
  template: {
    id: string
    name: string
    description: string
    icon: React.ComponentType<any>
    color: string
    features: string[]
    preview: string
    PreviewComponent?: React.ComponentType<any>
  }
  onView?: (templateId: string) => void
  onEdit?: (templateId: string) => void
  style?: React.CSSProperties
}

export default function TemplateCard({ 
  template, 
  onView, 
  onEdit, 
  style 
}: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const IconComponent = template.icon
  const PreviewComponent = template.PreviewComponent

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div
      style={{
        backgroundColor: brandColors.white,
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.25rem' : '2rem',
        boxShadow: isHovered 
          ? `0 20px 40px rgba(0, 0, 0, 0.15)` 
          : `0 8px 25px rgba(0, 0, 0, 0.08)`,
        border: `2px solid ${isHovered ? template.color : 'transparent'}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: isMobile ? '100%' : '400px',
        width: '100%',
        ...style
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Template Preview */}
      <div style={{
        height: isMobile ? '160px' : '200px',
        backgroundColor: brandColors.neutral[50],
        borderRadius: isMobile ? '10px' : '12px',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px dashed ${brandColors.neutral[200]}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {PreviewComponent ? (
          <div style={{
            width: '100%',
            height: '100%',
            transform: 'scale(0.3)',
            transformOrigin: 'top left',
            pointerEvents: 'none'
          }}>
            <PreviewComponent />
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: brandColors.neutral[500]
          }}>
            <IconComponent size={48} style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              {template.preview}
            </p>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.75rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            width: isMobile ? '10px' : '12px',
            height: isMobile ? '10px' : '12px',
            borderRadius: '50%',
            backgroundColor: template.color
          }} />
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0
          }}>
            {template.name}
          </h3>
        </div>
        <p style={{
          fontSize: isMobile ? '0.8125rem' : '0.875rem',
          color: brandColors.neutral[600],
          margin: isMobile ? '0 0 0.75rem 0' : '0 0 1rem 0',
          lineHeight: '1.5'
        }}>
          {template.description}
        </p>
        
        {/* Features */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {template.features.map((feature, index) => (
            <span
              key={index}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: brandColors.neutral[100],
                color: brandColors.neutral[700],
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.5rem' : '0.75rem',
        opacity: isMobile ? 1 : (isHovered ? 1 : 0),
        transform: isMobile ? 'translateY(0)' : (isHovered ? 'translateY(0)' : 'translateY(10px)'),
        transition: 'all 0.3s ease'
      }}>
        <button
          onClick={() => onView?.(template.id)}
          style={{
            flex: 1,
            padding: isMobile ? '0.875rem 1rem' : '0.75rem 1rem',
            minHeight: isMobile ? '48px' : 'auto',
            backgroundColor: 'transparent',
            color: template.color,
            border: `2px solid ${template.color}`,
            borderRadius: isMobile ? '8px' : '10px',
            fontSize: isMobile ? '0.8125rem' : '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = template.color
            e.currentTarget.style.color = brandColors.white
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = template.color
          }}
        >
          <Eye size={isMobile ? 18 : 16} />
          View
        </button>
        <button
          onClick={() => onEdit?.(template.id)}
          style={{
            flex: 1,
            padding: isMobile ? '0.875rem 1rem' : '0.75rem 1rem',
            minHeight: isMobile ? '48px' : 'auto',
            backgroundColor: template.color,
            color: brandColors.white,
            border: 'none',
            borderRadius: isMobile ? '8px' : '10px',
            fontSize: isMobile ? '0.8125rem' : '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.neutral[800]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = template.color
          }}
        >
          <Edit size={isMobile ? 18 : 16} />
          Edit
        </button>
      </div>
    </div>
  )
}
