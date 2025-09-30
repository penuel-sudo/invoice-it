/**
 * Template Registry
 * Central registry for all invoice templates and their PDF components
 * 
 * This provides a scalable way to manage templates:
 * - Add new templates by simply registering them here
 * - Type-safe template management
 * - Easy to maintain and extend
 */

import DefaultPDF from '../components/templatesfolder/DefaultTemplate/DefaultPDF'
// Import future templates here
// import ModernPDF from '../components/templatesfolder/ModernTemplate/ModernPDF'
// import ClassicPDF from '../components/templatesfolder/ClassicTemplate/ClassicPDF'

export const PDF_TEMPLATES = {
  default: DefaultPDF,
  // Add more templates as you create them
  // modern: ModernPDF,
  // classic: ClassicPDF,
} as const

// Type-safe template names
export type TemplateName = keyof typeof PDF_TEMPLATES

// Helper function to get PDF template component
export const getPDFTemplate = (templateName: string) => {
  // Use type assertion to handle dynamic keys
  const template = PDF_TEMPLATES[templateName as TemplateName]
  
  // Fallback to default if template not found
  return template || PDF_TEMPLATES.default
}

// Helper function to check if template exists
export const isValidTemplate = (templateName: string): templateName is TemplateName => {
  return templateName in PDF_TEMPLATES
}

// Get list of all available templates
export const getAvailableTemplates = (): TemplateName[] => {
  return Object.keys(PDF_TEMPLATES) as TemplateName[]
}

