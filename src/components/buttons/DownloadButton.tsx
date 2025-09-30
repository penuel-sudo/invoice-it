import React from 'react'
import { Download } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'
import { pdf } from '@react-pdf/renderer'
import { getPDFTemplate } from '../../lib/templateRegistry'
import type { InvoiceData } from '../../lib/storage/invoiceStorage'
import { supabase } from '../../lib/supabaseClient'

interface DownloadButtonProps {
  invoiceData: InvoiceData
  user: any
  template?: string
  onDownload?: () => void
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function DownloadButton({ 
  invoiceData, 
  user,
  template = 'default',
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
      
      // Update invoice status to 'pending' if it's not already pending (for saved invoices)
      // Query to find if this invoice exists in the database
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('invoice_number', invoiceData.invoiceNumber)
        .eq('user_id', user.id)
        .single()
      
      // If invoice exists and status is 'draft', update to 'pending'
      if (existingInvoice && existingInvoice.status === 'draft') {
        await supabase
          .from('invoices')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvoice.id)
          .eq('user_id', user.id)
      }
      
      // Get the correct PDF template based on template name
      const PDFTemplate = getPDFTemplate(template)
      
      // Generate PDF blob using client-side rendering
      const blob = await pdf(<PDFTemplate invoiceData={invoiceData} />).toBlob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceData.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Success feedback
      toast.success('PDF downloaded successfully!', { id: 'pdf-generation' })
      
      // Call optional callback
      if (onDownload) {
        onDownload()
      }
      
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-generation' })
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
