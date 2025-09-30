import { useSearchParams } from 'react-router-dom'
import { getTemplateComponent } from '../lib/templateRouter'

export default function InvoicePreviewPage() {
  const [searchParams] = useSearchParams()
  
  // Get template from URL parameter, default to 'default'
  const template = searchParams.get('template') || 'default'
  
  // Get the appropriate template component
  const TemplateComponent = getTemplateComponent(template, 'Preview')
  
  // Render the template component
  return <TemplateComponent />
}
