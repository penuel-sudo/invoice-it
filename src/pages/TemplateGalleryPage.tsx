import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, X } from 'lucide-react'
import { brandColors } from '../stylings'
import { Layout as LayoutComponent } from '../components/layout'
import { TemplateGallery, TemplateGrid, TemplateCard } from '../components/templates'

// Dynamic imports for heavy template components
const DefaultCreate = lazy(() => import('../components/templatesfolder/DefaultTemplate/DefaultCreate'))
const DefaultPreviewStatic = lazy(() => import('../components/templatesfolder/DefaultTemplate/DefaultPreviewStatic'))
const ProfessionalCreate = lazy(() => import('../components/templatesfolder/ProfessionalTemplate/ProfessionalCreate'))
const ProfessionalPreviewStatic = lazy(() => import('../components/templatesfolder/ProfessionalTemplate/ProfessionalPreviewStatic'))

export default function TemplateGalleryPage() {
  const navigate = useNavigate()
  const [previewOverlay, setPreviewOverlay] = useState<{
    isOpen: boolean
    template: any
  }>({
    isOpen: false,
    template: null
  })

  // Real template data for all templates
  const templates = [
    {
      id: 'default',
      name: 'Default Template',
      description: 'Simple, professional design perfect for any business. Clean layout with modern typography and intuitive user experience.',
      icon: FileText,
      color: brandColors.primary[600],
      features: ['Clean Layout', 'Professional Design', 'Easy to Read', 'Modern Typography', 'Responsive'],
      preview: 'Clean and minimal invoice design with professional typography and modern layout',
      CreateComponent: DefaultCreate,
      PreviewComponent: DefaultPreviewStatic
    },
    {
      id: 'professional',
      name: 'Professional Template',
      description: 'Comprehensive business invoice with advanced fields. Perfect for B2B transactions with PO numbers, tax IDs, shipping, and detailed line items.',
      icon: FileText,
      color: brandColors.primary[700],
      features: ['PO Numbers', 'Tax ID Support', 'Ship To Address', 'Line Item Discounts', 'Balance Due', 'Terms & Conditions'],
      preview: 'Corporate-grade invoice with all business fields and professional layout',
      CreateComponent: ProfessionalCreate,
      PreviewComponent: ProfessionalPreviewStatic
    }
  ]

  const handleViewTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setPreviewOverlay({
        isOpen: true,
        template: template
      })
    }
  }

  const closePreviewOverlay = () => {
    setPreviewOverlay({
      isOpen: false,
      template: null
    })
  }

  const handleEditTemplate = (templateId: string) => {
    navigate(`/invoice/create/${templateId}`)
  }

  return (
    <LayoutComponent>
      <TemplateGallery>
        <TemplateGrid>
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onView={handleViewTemplate}
              onEdit={handleEditTemplate}
            />
          ))}
        </TemplateGrid>
      </TemplateGallery>

      {/* Preview Overlay */}
      {previewOverlay.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Close Button */}
            <button
              onClick={closePreviewOverlay}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                zIndex: 10000,
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={20} color={brandColors.neutral[600]} />
            </button>

            {/* Template Preview */}
            <div style={{
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              {previewOverlay.template?.PreviewComponent && (
                <Suspense fallback={
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '400px',
                    fontSize: '16px',
                    color: '#666'
                  }}>
                    Loading preview...
                  </div>
                }>
                <previewOverlay.template.PreviewComponent />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      )}
    </LayoutComponent>
  )
}
