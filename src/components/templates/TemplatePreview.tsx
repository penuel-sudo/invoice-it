import { brandColors } from '../../stylings'

interface TemplatePreviewProps {
  template: {
    id: string
    name: string
    icon: React.ComponentType<any>
    preview: string
  }
  style?: React.CSSProperties
}

export default function TemplatePreview({ template, style }: TemplatePreviewProps) {
  const IconComponent = template.icon

  return (
    <div style={{
      height: '200px',
      backgroundColor: brandColors.neutral[50],
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `2px dashed ${brandColors.neutral[200]}`,
      position: 'relative',
      ...style
    }}>
      <div style={{
        textAlign: 'center',
        color: brandColors.neutral[500]
      }}>
        <IconComponent size={48} style={{ marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.875rem', margin: 0 }}>
          {template.preview}
        </p>
      </div>
    </div>
  )
}
