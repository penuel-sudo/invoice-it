import { useParams, useSearchParams } from 'react-router-dom'
import DefaultCreate from '../components/templatesfolder/DefaultTemplate/DefaultCreate'

export default function InvoiceCreatePage() {
  const { template } = useParams<{ template: string }>()
  const [searchParams] = useSearchParams()
  
  // Get template from URL parameter, default to 'default'
  const templateName = template || 'default'
  
  // Simple template routing - direct component import
  const getTemplateComponent = (template: string) => {
    switch (template) {
      case 'default':
        return DefaultCreate
      // Future templates will be added here
      // case 'professional':
      //   return ProfessionalCreate
      // case 'creative':
      //   return CreativeCreate
      default:
        return DefaultCreate // fallback to default
    }
  }
  
  // Get the appropriate template component
  const TemplateComponent = getTemplateComponent(templateName)
  
  // Render the template component
  return <TemplateComponent />
}
