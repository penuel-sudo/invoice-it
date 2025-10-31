import { useParams, useSearchParams } from 'react-router-dom'
import DefaultPreview from '../components/templatesfolder/DefaultTemplate/DefaultPreview'
import ProfessionalPreview from '../components/templatesfolder/ProfessionalTemplate/ProfessionalPreview'

export default function InvoicePreviewPage() {
  const { template } = useParams<{ template: string }>()
  const [searchParams] = useSearchParams()
  
  console.log('🔍 DEBUGGING: InvoicePreviewPage loaded')
  console.log('  - URL template param:', template)
  console.log('  - Search params:', Object.fromEntries(searchParams.entries()))
  
  // Get template from URL parameter, default to 'default'
  const templateName = template 
  console.log('  - Final template name:', templateName)
  
  // Simple template routing with dynamic imports
  const getTemplateComponent = (template: string) => {
    console.log('  - Getting template component for:', template)
    switch (template) {
      case 'default':
        console.log('  - Loading DefaultPreview component')
        return DefaultPreview
      case 'professional':
        console.log('  - Loading ProfessionalPreview component')
        return ProfessionalPreview
      // Future templates will be added here
      // case 'creative':
      //   return lazy(() => import('../components/templatesfolder/CreativeTemplate/CreativePreview'))
    }
  }
  
  // Get the appropriate template component
  const TemplateComponent = getTemplateComponent(templateName)
  
  // Render the template component directly
  return <TemplateComponent />
}
