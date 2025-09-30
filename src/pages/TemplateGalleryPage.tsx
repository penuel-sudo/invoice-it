import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { brandColors } from '../stylings'
import { Layout as LayoutComponent } from '../components/layout'
import { TemplateGallery, TemplateGrid, TemplateCard } from '../components/templates'
import DefaultCreate from '../components/templatesfolder/DefaultTemplate/DefaultCreate'
import DefaultPreview from '../components/templatesfolder/DefaultTemplate/DefaultPreview'

export default function TemplateGalleryPage() {
  const navigate = useNavigate()

  // Real template data for the default template
  const templates = [
    {
      id: 'default',
      name: 'Default Template',
      description: 'Simple, professional design perfect for any business. Clean layout with modern typography and intuitive user experience.',
      icon: FileText,
      color: brandColors.primary[600],
      features: ['Clean Layout', 'Professional Design', 'Easy to Read', 'Modern Typography', 'Responsive'],
      preview: 'Clean and minimal invoice design with professional typography and modern layout',
      // Template components
      CreateComponent: DefaultCreate,
      PreviewComponent: DefaultPreview
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
    </LayoutComponent>
  )
}
