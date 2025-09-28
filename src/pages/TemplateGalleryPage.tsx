import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Eye, Edit, Palette, FileText, Sparkles } from 'lucide-react'
import { brandColors } from '../stylings'
import { Layout as LayoutComponent } from '../components/layout'

export default function TemplateGalleryPage() {
  const navigate = useNavigate()
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  const templates = [
    {
      id: 'default',
      name: 'Clean & Minimal',
      description: 'Simple, professional design perfect for any business',
      icon: FileText,
      color: brandColors.primary[600],
      features: ['Clean Layout', 'Professional', 'Easy to Read'],
      preview: 'Clean and minimal invoice design with professional typography'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Corporate-style template with enhanced branding',
      icon: Layout,
      color: brandColors.success[600],
      features: ['Corporate Design', 'Enhanced Branding', 'Business Ready'],
      preview: 'Professional corporate invoice with enhanced branding elements'
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Modern, creative design for creative professionals',
      icon: Sparkles,
      color: brandColors.warning[600],
      features: ['Modern Design', 'Creative Layout', 'Eye-catching'],
      preview: 'Creative and modern invoice design with artistic elements'
    }
  ]

  const handleViewTemplate = (templateId: string) => {
    navigate(`/invoice/preview?template=${templateId}&sample=true`)
  }

  const handleEditTemplate = (templateId: string) => {
    navigate(`/invoice/create?template=${templateId}`)
  }

  return (
    <LayoutComponent>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${brandColors.primary[50]} 0%, ${brandColors.neutral[50]} 100%)`,
        padding: '2rem'
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
              Choose Your Template
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: brandColors.neutral[600],
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Select the perfect template for your invoice. Each template is designed to make your invoices look professional and stand out.
            </p>
          </div>

          {/* Template Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {templates.map((template) => {
              const IconComponent = template.icon
              const isHovered = hoveredTemplate === template.id
              
              return (
                <div
                  key={template.id}
                  style={{
                    backgroundColor: brandColors.white,
                    borderRadius: '20px',
                    padding: '2rem',
                    boxShadow: isHovered 
                      ? `0 20px 40px rgba(0, 0, 0, 0.15)` 
                      : `0 8px 25px rgba(0, 0, 0, 0.08)`,
                    border: `2px solid ${isHovered ? template.color : 'transparent'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  {/* Template Preview */}
                  <div style={{
                    height: '200px',
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px dashed ${brandColors.neutral[200]}`,
                    position: 'relative'
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

                  {/* Template Info */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: template.color
                      }} />
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900],
                        margin: 0
                      }}>
                        {template.name}
                      </h3>
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: brandColors.neutral[600],
                      margin: '0 0 1rem 0',
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
                    gap: '0.75rem',
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.3s ease'
                  }}>
                    <button
                      onClick={() => handleViewTemplate(template.id)}
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
                      onClick={() => handleEditTemplate(template.id)}
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
                </div>
              )
            })}
          </div>

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
    </LayoutComponent>
  )
}
