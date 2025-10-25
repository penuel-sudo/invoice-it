import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface CustomizationData {
  // Company Details
  company_name: string
  website: string
  tax_id: string
  tagline: string
  business_type: string
  registration_number: string
  
  // Branding
  logo_url: string
  primary_color: string
  accent_color: string
  font_family: string
  
  // Background Colors
  background_colors: {
    main_background: string
    card_background: string
    section_background: string
    header_background: string
    form_background: string
  }
  
  // Template Settings
  template_settings: {
    show_logo: boolean
    show_tagline: boolean
    show_website: boolean
    show_tax_id: boolean
    show_registration: boolean
  }
}

interface UseTemplateCustomizationProps {
  template: string
  user: any
}

export const useTemplateCustomization = ({ template, user }: UseTemplateCustomizationProps) => {
  const [templateSettings, setTemplateSettings] = useState<CustomizationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load template settings with priority: localStorage -> database -> default
  const loadTemplateSettings = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // First try to load from localStorage for unsaved invoices
      const localStorageKey = `${template}_template_customizations`
      const savedCustomizations = localStorage.getItem(localStorageKey)
      
      if (savedCustomizations) {
        const customizations = JSON.parse(savedCustomizations)
        setTemplateSettings(customizations)
        setIsLoading(false)
        return
      }

      // If no localStorage, try to load from database
      const { data, error } = await supabase
        .from('invoices')
        .select('template_settings')
        .eq('user_id', user.id)
        .eq('template', template)
        .not('template_settings', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (data?.template_settings) {
        setTemplateSettings(data.template_settings)
      }
    } catch (error) {
      console.error('Error loading template settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Save customizations to localStorage immediately
  const saveCustomizations = (customizations: CustomizationData) => {
    const localStorageKey = `${template}_template_customizations`
    localStorage.setItem(localStorageKey, JSON.stringify(customizations))
    setTemplateSettings(customizations)
  }

  // Clear customizations from localStorage
  const clearCustomizations = () => {
    const localStorageKey = `${template}_template_customizations`
    localStorage.removeItem(localStorageKey)
    setTemplateSettings(null)
  }

  // Load settings on mount and when user changes
  useEffect(() => {
    loadTemplateSettings()
  }, [user, template])

  return {
    templateSettings,
    isLoading,
    loadTemplateSettings,
    saveCustomizations,
    clearCustomizations
  }
}
