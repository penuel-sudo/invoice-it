import React from 'react'
import { Download } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'
import { pdf } from '@react-pdf/renderer'
import { getPDFTemplate } from '../../lib/templateRegistry'
import type { InvoiceData } from '../../lib/storage/invoiceStorage'
import { supabase } from '../../lib/supabaseClient'
import { saveInvoiceToDatabase } from '../templatesfolder/DefaultTemplate/DefaultTemplateSave'
import { saveProfessionalInvoice } from '../templatesfolder/ProfessionalTemplate/ProfessionalTemplateSave'

interface DownloadButtonProps {
  invoiceData: InvoiceData
  user: any
  template?: string
  templateSettings?: any
  onDownload?: () => void
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function DownloadButton({ 
  invoiceData, 
  user,
  template = 'default',
  templateSettings,
  onDownload,
  style,
  size = 'md',
  variant = 'primary'
}: DownloadButtonProps) {
  const handleDownload = async () => {
    if (!invoiceData || !user) {
      toast.error('Invoice data not available')
      return
    }

    try {
      // Show loading state
      toast.loading('Generating PDF...', { id: 'pdf-generation' })
      
      // Update invoice status to 'pending' using shared save function
      console.log('🔄 [DOWNLOAD BUTTON] Starting status update...')
      console.log('📊 [DOWNLOAD BUTTON] Current invoiceData:', {
        invoiceNumber: invoiceData.invoiceNumber,
        status: (invoiceData as any).status,
        user_id: user.id
      })

      // Use template-specific save function
      console.log('📋 [DOWNLOAD BUTTON] Using template-specific save function for status update...')
      
      let result
      if (template === 'professional') {
        result = await saveProfessionalInvoice(invoiceData, user, templateSettings, { 
          status: 'pending',
          updateStatus: true 
        })
      } else {
        result = await saveInvoiceToDatabase(invoiceData, user, { 
          status: 'pending',
          updateStatus: true 
        })
      }
      
      if (result.success) {
        console.log('✅ [DOWNLOAD BUTTON] Invoice saved successfully via shared function')
        // Update the invoiceData object with new IDs
        ;(invoiceData as any).id = result.invoiceId
        ;(invoiceData as any).clientId = result.clientId
        ;(invoiceData as any).status = 'pending'
      } else {
        console.error('❌ [DOWNLOAD BUTTON] Failed to save invoice:', result.error)
        toast.error(`Failed to save invoice: ${result.error}`)
      }
      
      // Get the correct PDF template based on template name
      const PDFTemplate = getPDFTemplate(template)
      
      if (!PDFTemplate) {
        throw new Error(`PDF template '${template}' not found`)
      }
      
      console.log('📄 [DOWNLOAD BUTTON] Generating PDF with template:', template)
      console.log('📊 [DOWNLOAD BUTTON] Invoice data for PDF:', {
        invoiceNumber: invoiceData.invoiceNumber,
        clientName: invoiceData.clientName,
        grandTotal: invoiceData.grandTotal,
        items: invoiceData.items?.length || 0,
        currency: invoiceData.currency,
        currencySymbol: invoiceData.currencySymbol
      })
      
      // Validate required fields
      if (!invoiceData.invoiceNumber) {
        throw new Error('Invoice number is required')
      }
      if (!invoiceData.clientName) {
        throw new Error('Client name is required')
      }
      if (typeof invoiceData.grandTotal !== 'number') {
        throw new Error('Grand total must be a number')
      }
      
      // Generate PDF blob using client-side rendering
      console.log('🔄 [DOWNLOAD BUTTON] Creating PDF document...')
      const blob = await pdf(<PDFTemplate invoiceData={invoiceData} user={user} templateSettings={templateSettings} />).toBlob()
      
      console.log('✅ [DOWNLOAD BUTTON] PDF generated successfully, size:', blob.size)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceData.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('✅ [DOWNLOAD BUTTON] PDF download initiated')
      
      // Success feedback
      toast.success('PDF downloaded successfully!', { id: 'pdf-generation' })
      
      // Call optional callback
      if (onDownload) {
        onDownload()
      }
      
    } catch (error) {
      console.error('❌ [DOWNLOAD BUTTON] PDF download error:', error)
      console.error('❌ [DOWNLOAD BUTTON] Error details:', {
        message: error.message,
        stack: error.stack,
        invoiceData: {
          invoiceNumber: invoiceData.invoiceNumber,
          clientName: invoiceData.clientName,
          grandTotal: invoiceData.grandTotal
        }
      })
      toast.error(`Failed to generate PDF: ${error.message}`, { id: 'pdf-generation' })
    }
  }


  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          gap: '0.25rem'
        }
      case 'lg':
        return {
          padding: '1rem 2rem',
          fontSize: '1rem',
          gap: '0.5rem'
        }
      default: // md
        return {
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          gap: '0.375rem'
        }
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: brandColors.primary[100],
          color: brandColors.primary[700],
          border: 'none'
        }
      default: // primary
        return {
          backgroundColor: brandColors.primary[600],
          color: brandColors.white,
          border: 'none'
        }
    }
  }

  return (
    <button
      onClick={handleDownload}
      style={{
        ...getSizeStyles(),
        ...getVariantStyles(),
        borderRadius: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        flex: 1,
        maxWidth: '100px',
        ...style
      }}
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[700]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[200]
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[600]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[100]
        }
      }}
    >
      <Download size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      {size !== 'sm' && <span>PDF</span>}
    </button>
  )
}
