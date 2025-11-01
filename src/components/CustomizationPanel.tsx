import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Palette, Type, Save, Loader2 } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { brandColors } from '../stylings'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'
import toast from 'react-hot-toast'

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

interface CustomizationPanelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CustomizationData) => void
  initialData?: Partial<CustomizationData>
  template?: string
}

const FONTS = [
  { value: 'Helvetica', label: 'Helvetica', preview: 'Helvetica' },
  { value: 'Times-Roman', label: 'Times Roman', preview: 'Times-Roman' },
  { value: 'Courier', label: 'Courier', preview: 'Courier' }
]

export default function CustomizationPanel({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = {} 
}: CustomizationPanelProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null)
  const [formData, setFormData] = useState<CustomizationData>({
    company_name: '',
    website: '',
    tax_id: '',
    tagline: '',
    business_type: '',
    registration_number: '',
    logo_url: '',
    primary_color: brandColors.primary[600],
    accent_color: brandColors.primary[500],
    font_family: 'Helvetica',
    background_colors: {
      main_background: brandColors.primary[50],
      card_background: brandColors.white,
      section_background: brandColors.neutral[50],
      header_background: brandColors.white,
      form_background: brandColors.white
    },
    template_settings: {
      show_logo: true,
      show_tagline: true,
      show_website: true,
      show_tax_id: true,
      show_registration: true
    },
    ...initialData
  })

  // Load initial data and avatar_url
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
    
    // Load user data from profiles table
    const loadUserData = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, company_name, website, tax_id, tagline, business_type, registration_number')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            logo_url: data.avatar_url || prev.logo_url,
            company_name: data.company_name || prev.company_name,
            website: data.website || prev.website,
            tax_id: data.tax_id || prev.tax_id,
            tagline: data.tagline || prev.tagline,
            business_type: data.business_type || prev.business_type,
            registration_number: data.registration_number || prev.registration_number
          }))
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }
    
    loadUserData()
  }, [initialData, user])

  const handleInputChange = (field: keyof CustomizationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTemplateSettingChange = (field: keyof CustomizationData['template_settings'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      template_settings: {
        ...prev.template_settings,
        [field]: value
      }
    }))
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!user) {
      toast.error('Please log in to upload files')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      // Use same bucket as profile pictures
      const filePath = `${user.id}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload logo')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)

      // Update avatar_url in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        toast.error('Failed to save logo')
        return
      }

      handleInputChange('logo_url', publicUrl)
      toast.success('Logo uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // For unsaved invoices, save to localStorage and pass to parent
      // The parent component will handle applying the customizations
      onSave(formData)
      toast.success('Customizations saved successfully!')
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save customizations')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '400px',
              height: '100vh',
              backgroundColor: brandColors.white,
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
              zIndex: 1001,
              overflowY: 'auto',
              padding: '2rem'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: `1px solid ${brandColors.neutral[200]}`
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Customize Invoice
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  color: brandColors.neutral[500],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Company Details Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[800],
                marginBottom: '1rem'
              }}>
                Company Details
              </h3>
              
              {/* Company Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Enter company name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Website */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Tax ID */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Tax ID / VAT Number
                </label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                  placeholder="Enter tax ID or VAT number"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Tagline */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Company Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="Your company tagline or slogan"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Branding Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[800],
                marginBottom: '1rem'
              }}>
                Branding
              </h3>

              {/* Logo Upload */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Company Logo
                </label>
                <div style={{
                  border: `2px dashed ${brandColors.neutral[300]}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                    disabled={isUploading}
                  />
                  {formData.logo_url ? (
                    <div>
                      <img
                        src={formData.logo_url}
                        alt="Company logo"
                        style={{
                          maxWidth: '100px',
                          maxHeight: '100px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                      <p style={{
                        fontSize: '0.75rem',
                        color: brandColors.neutral[600],
                        marginTop: '0.5rem'
                      }}>
                        Click to change logo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} color={brandColors.neutral[400]} />
                      <p style={{
                        fontSize: '0.875rem',
                        color: brandColors.neutral[600],
                        marginTop: '0.5rem'
                      }}>
                        {isUploading ? 'Uploading...' : 'Click to upload logo'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Color */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Primary Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => setActiveColorPicker(activeColorPicker === 'primary' ? null : 'primary')}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: formData.primary_color,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `2px solid ${brandColors.neutral[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brandColors.white,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {formData.primary_color}
                  </div>
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    placeholder="#3B82F6"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {activeColorPicker === 'primary' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <HexColorPicker
                      color={formData.primary_color}
                      onChange={(color) => handleInputChange('primary_color', color)}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Accent Color */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => setActiveColorPicker(activeColorPicker === 'accent' ? null : 'accent')}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: formData.accent_color,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `2px solid ${brandColors.neutral[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brandColors.white,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {formData.accent_color}
                  </div>
                  <input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => handleInputChange('accent_color', e.target.value)}
                    placeholder="#10B981"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {activeColorPicker === 'accent' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <HexColorPicker
                      color={formData.accent_color}
                      onChange={(color) => handleInputChange('accent_color', color)}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Font Family */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Font Family
                </label>
                <select
                  value={formData.font_family}
                  onChange={(e) => handleInputChange('font_family', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white
                  }}
                >
                  {FONTS.map(font => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Background Colors Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[800],
                marginBottom: '1rem'
              }}>
                Background Colors
              </h3>

              {/* Main Background */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Main Background
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => setActiveColorPicker(activeColorPicker === 'main_bg' ? null : 'main_bg')}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: formData.background_colors.main_background,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `2px solid ${brandColors.neutral[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brandColors.white,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {formData.background_colors.main_background}
                  </div>
                  <input
                    type="text"
                    value={formData.background_colors.main_background}
                    onChange={(e) => handleInputChange('background_colors', {
                      ...formData.background_colors,
                      main_background: e.target.value
                    })}
                    placeholder="#F8FAFC"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {activeColorPicker === 'main_bg' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <HexColorPicker
                      color={formData.background_colors.main_background}
                      onChange={(color) => handleInputChange('background_colors', { ...formData.background_colors, main_background: color })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Card Background */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Card Background
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => setActiveColorPicker(activeColorPicker === 'card_bg' ? null : 'card_bg')}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: formData.background_colors.card_background,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `2px solid ${brandColors.neutral[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brandColors.white,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {formData.background_colors.card_background}
                  </div>
                  <input
                    type="text"
                    value={formData.background_colors.card_background}
                    onChange={(e) => handleInputChange('background_colors', {
                      ...formData.background_colors,
                      card_background: e.target.value
                    })}
                    placeholder="#FFFFFF"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {activeColorPicker === 'card_bg' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <HexColorPicker
                      color={formData.background_colors.card_background}
                      onChange={(color) => handleInputChange('background_colors', { ...formData.background_colors, card_background: color })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Section Background */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Section Background
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => setActiveColorPicker(activeColorPicker === 'section_bg' ? null : 'section_bg')}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: formData.background_colors.section_background,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `2px solid ${brandColors.neutral[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brandColors.white,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {formData.background_colors.section_background}
                  </div>
                  <input
                    type="text"
                    value={formData.background_colors.section_background}
                    onChange={(e) => handleInputChange('background_colors', {
                      ...formData.background_colors,
                      section_background: e.target.value
                    })}
                    placeholder="#F8FAFC"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {activeColorPicker === 'section_bg' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <HexColorPicker
                      color={formData.background_colors.section_background}
                      onChange={(color) => handleInputChange('background_colors', { ...formData.background_colors, section_background: color })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Header Background */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Header Background
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => setActiveColorPicker(activeColorPicker === 'header_bg' ? null : 'header_bg')}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: formData.background_colors.header_background,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `2px solid ${brandColors.neutral[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brandColors.white,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {formData.background_colors.header_background}
                  </div>
                  <input
                    type="text"
                    value={formData.background_colors.header_background}
                    onChange={(e) => handleInputChange('background_colors', {
                      ...formData.background_colors,
                      header_background: e.target.value
                    })}
                    placeholder="#FFFFFF"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {activeColorPicker === 'header_bg' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <HexColorPicker
                      color={formData.background_colors.header_background}
                      onChange={(color) => handleInputChange('background_colors', { ...formData.background_colors, header_background: color })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Form Background */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Form Background
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => setActiveColorPicker(activeColorPicker === 'form_bg' ? null : 'form_bg')}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: formData.background_colors.form_background,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: `2px solid ${brandColors.neutral[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brandColors.white,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {formData.background_colors.form_background}
                  </div>
                  <input
                    type="text"
                    value={formData.background_colors.form_background}
                    onChange={(e) => handleInputChange('background_colors', {
                      ...formData.background_colors,
                      form_background: e.target.value
                    })}
                    placeholder="#FFFFFF"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${brandColors.neutral[300]}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {activeColorPicker === 'form_bg' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <HexColorPicker
                      color={formData.background_colors.form_background}
                      onChange={(color) => handleInputChange('background_colors', { ...formData.background_colors, form_background: color })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Template Settings */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[800],
                marginBottom: '1rem'
              }}>
                Display Options
              </h3>

              {Object.entries(formData.template_settings).map(([key, value]) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    color: brandColors.neutral[700],
                    textTransform: 'capitalize'
                  }}>
                    {key.replace('show_', '').replace('_', ' ')}
                  </label>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleTemplateSettingChange(key as keyof CustomizationData['template_settings'], e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: formData.primary_color
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: formData.primary_color,
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Customizations
                </>
              )}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
