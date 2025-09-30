import { brandColors } from '../../stylings'

interface TemplateGalleryProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  style?: React.CSSProperties
}

export default function TemplateGallery({ 
  children, 
  title = "Choose Your Template",
  subtitle = "Select the perfect template for your invoice. Each template is designed to make your invoices look professional and stand out.",
  style 
}: TemplateGalleryProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${brandColors.primary[50]} 0%, ${brandColors.neutral[50]} 100%)`,
      padding: '2rem',
      ...style
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: brandColors.neutral[900],
            marginBottom: '1rem',
            background: `linear-gradient(135deg, ${brandColors.primary[600]} 0%, ${brandColors.success[600]} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: brandColors.neutral[600],
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            {subtitle}
          </p>
        </div>

        {/* Template Grid */}
        {children}

        {/* Footer Info */}
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: brandColors.white,
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            marginBottom: '0.5rem'
          }}>
            Need Help Choosing?
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: brandColors.neutral[600],
            margin: 0,
            lineHeight: '1.5'
          }}>
            Click "View" to see a preview of each template, or "Edit" to start creating your invoice with that template.
          </p>
        </div>
      </div>
    </div>
  )
}
