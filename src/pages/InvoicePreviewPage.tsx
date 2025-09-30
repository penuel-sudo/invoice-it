import { useParams, useSearchParams } from 'react-router-dom'
import DefaultPreview from '../components/templatesfolder/DefaultTemplate/DefaultPreview'

export default function InvoicePreviewPage() {
  const { template } = useParams<{ template: string }>()
  const [searchParams] = useSearchParams()
  
  // Get template from URL parameter, default to 'default'
  const templateName = template || 'default'
  
  // Simple template routing - direct component import
  const getTemplateComponent = (template: string) => {
    switch (template) {
      case 'default':
        return DefaultPreview
      // Future templates will be added here
      // case 'professional':
      //   return ProfessionalPreview
      // case 'creative':
      //   return CreativePreview
      default:
        return DefaultPreview // fallback to default
    }
  }
  
  // Get the appropriate template component
  const TemplateComponent = getTemplateComponent(templateName)
  
  // Render the template component
  return <TemplateComponent />
}
