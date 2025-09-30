import { Eye, Edit } from 'lucide-react'
import { brandColors } from '../../stylings'

interface TemplateActionsProps {
  template: {
    id: string
    color: string
  }
  onView?: (templateId: string) => void
  onEdit?: (templateId: string) => void
  isVisible?: boolean
  style?: React.CSSProperties
}

export default function TemplateActions({ 
  template, 
  onView, 
  onEdit, 
  isVisible = false,
  style 
}: TemplateActionsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 0.3s ease',
      ...style
    }}>
      <button
        onClick={() => onView?.(template.id)}
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          backgroundColor: 'transparent',
          color: template.color,
          border: `2px solid ${template.color}`,
          borderRadius: '10px',
          fontSize: '0.875rem',
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
        <Eye size={16} />
        View
      </button>
      <button
        onClick={() => onEdit?.(template.id)}
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          backgroundColor: template.color,
          color: brandColors.white,
          border: 'none',
          borderRadius: '10px',
          fontSize: '0.875rem',
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
        <Edit size={16} />
        Edit
      </button>
    </div>
  )
}
