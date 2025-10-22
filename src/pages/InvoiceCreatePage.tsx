import { useParams, useSearchParams } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Dynamic imports for template components
const DefaultCreate = lazy(() => import('../components/templatesfolder/DefaultTemplate/DefaultCreate'))
const ProfessionalCreate = lazy(() => import('../components/templatesfolder/ProfessionalTemplate/ProfessionalCreate'))

export default function InvoiceCreatePage() {
  const { template } = useParams<{ template: string }>()
  const [searchParams] = useSearchParams()
  
  // Get template from URL parameter, default to 'default'
  const templateName = template || 'default'
  
  // Simple template routing with dynamic imports
  const getTemplateComponent = (template: string) => {
    switch (template) {
      case 'default':
        return DefaultCreate
      case 'professional':
        return ProfessionalCreate
      // Future templates will be added here
      // case 'creative':
      //   return lazy(() => import('../components/templatesfolder/CreativeTemplate/CreativeCreate'))
      default:
        return DefaultCreate // fallback to default
    }
  }
  
  // Get the appropriate template component
  const TemplateComponent = getTemplateComponent(templateName)
  
  // Render the template component with loading fallback
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading template...
      </div>
    }>
      <TemplateComponent />
    </Suspense>
  )
}
