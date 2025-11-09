import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { brandColors } from '../../stylings'
import toast from 'react-hot-toast'
import { useNotification } from '../../contexts/NotificationContext'
import { supabase } from '../../lib/supabaseClient'
import CustomizeMessageModal from '../CustomizeMessageModal'
import { saveInvoiceToDatabase } from '../templatesfolder/DefaultTemplate/DefaultTemplateSave'
import { saveProfessionalInvoice } from '../templatesfolder/ProfessionalTemplate/ProfessionalTemplateSave'
import { invoiceStorage } from '../../lib/storage/invoiceStorage'

interface SendButtonProps {
  invoiceData: any
  userData?: any
  template?: string
  templateSettings?: any
  onSend?: () => void
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function SendButton({ 
  invoiceData, 
  userData,
  template,
  templateSettings,
  onSend,
  style,
  size = 'md',
  variant = 'primary'
}: SendButtonProps) {
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotification()

  // Fetch user profile data for "Name at Business" format
  const fetchUserProfile = async () => {
    if (!userData?.id) return { full_name: '', business_name: '' }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', userData.id)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return { full_name: '', business_name: '' }
      }
      
      return {
        full_name: data?.full_name || '',
        business_name: data?.company_name || ''
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { full_name: '', business_name: '' }
    }
  }

  const handleSend = async () => {
    // Check if client email exists
    if (!invoiceData.clientEmail) {
      toast.error('Client email is required to send invoice')
      return
    }

    // Show customize message modal
    setShowCustomizeModal(true)
  }

  const sendInvoiceEmail = async (email: string, messageData: any) => {
    setIsLoading(true)
    
    // Fetch profile data for proper "Name at Business" format
    const profile = await fetchUserProfile()
    
    // Debug logging
    console.log('Sending email with data:', {
      to: email,
      invoiceData: invoiceData,
      userData: userData,
      messageData: messageData,
      profile: profile
    })
    
    try {
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          invoiceData: invoiceData || {},
          userData: {
            ...(userData || { id: '' }),
            fullName: profile.full_name,
          businessName: profile.business_name
          },
        userEmail: userData?.email || userData?.user_metadata?.email || null,
          clientName: messageData.clientName || invoiceData?.clientName || 'Client',
          greetingMessage: messageData.greetingMessage || null,
          businessName: messageData.businessName || null
        })
      })

      // Parse response
      const result = await response.json()

      // Check if response is ok
      if (!response.ok) {
        // Check for domain verification error
        if (result.type === 'domain_verification_required') {
          throw {
            type: 'domain_verification_required',
            message: result.message || 'Please verify your domain at resend.com/domains to send emails to clients'
          }
        }
        throw new Error(result.error || result.message || `Server error: ${response.status}`)
      }

      if (result.success) {
        toast.success('Invoice sent successfully!')
        
        // Update invoice status from draft to pending if needed
        await updateInvoiceStatus()
        
        // Add notification
        addNotification({
          type: 'success',
          title: 'Invoice Sent',
          message: `Invoice #${invoiceData.invoiceNumber} sent to ${email}`,
          status: 'pending'
        })
        
        // Dispatch event to update UI immediately
        if (template === 'professional') {
          window.dispatchEvent(new CustomEvent('invoiceStatusChanged'))
          window.dispatchEvent(new CustomEvent('invoiceSaved'))
        }
    
        if (onSend) {
          onSend()
        }
      } else {
        throw new Error(result.error || result.message || 'Failed to send email')
      }
    } catch (error: any) {
      console.error('Send email error:', error)
      
      // Check if it's a domain verification error
      if (error.type === 'domain_verification_required' || (error.message && (error.message.includes('domain') || error.message.includes('verified') || error.message.includes('test mode')))) {
        const message = error.type === 'domain_verification_required' 
          ? error.message 
          : 'To send invoices to clients, please verify your domain at resend.com/domains'
        
        toast.error(message, {
          duration: 10000, // Show longer for important message
          style: {
            maxWidth: '500px',
            fontSize: '14px',
            whiteSpace: 'normal'
          }
        })
      } else {
        toast.error(error.message || 'Failed to send invoice. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateInvoiceStatus = async () => {
    console.log('🔄 [SEND BUTTON] Starting status update...')
    console.log('📊 [SEND BUTTON] Current invoiceData:', {
      invoiceNumber: invoiceData.invoiceNumber,
      status: invoiceData.status,
      user_id: invoiceData.user_id || userData?.id
    })

    try {
      // Use template-specific save function
      console.log('📋 [SEND BUTTON] Using template-specific save function for status update...')
      
      let result
      const isProfessional = template === 'professional' || invoiceData.template === 'professional'
      if (isProfessional) {
        result = await saveProfessionalInvoice(
          invoiceData,
          userData,
          templateSettings,
          { status: 'pending', updateStatus: true }
        )
      } else {
        // For default template, pass undefined for templateSettings to use options correctly
        result = await saveInvoiceToDatabase(
          invoiceData,
          userData,
          undefined,
          { status: 'pending', updateStatus: true }
        )
      }
      
      if (result.success) {
        console.log('✅ [SEND BUTTON] Invoice saved successfully via shared function')
        // Update the invoiceData object with new IDs
        invoiceData.id = result.invoiceId
        invoiceData.clientId = result.clientId
        invoiceData.status = 'pending'
        
        // Update local storage with new status
        const updatedData = { ...invoiceData, status: 'pending' }
        invoiceStorage.saveDraft(updatedData)
        console.log('✅ [SEND BUTTON] Local storage updated with pending status')
      } else {
        console.error('❌ [SEND BUTTON] Failed to save invoice:', result.error)
        toast.error(`Failed to save invoice: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ [SEND BUTTON] Error updating invoice status:', error)
      toast.error('Failed to update invoice status')
    }
  }


  const handleCustomizeSubmit = (messageData: any) => {
    setShowCustomizeModal(false)
    sendInvoiceEmail(invoiceData.clientEmail, messageData)
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
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    <button
      onClick={handleSend}
        disabled={isLoading}
      style={{
        ...getSizeStyles(),
        ...getVariantStyles(),
        borderRadius: '12px',
        fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        flex: 1,
        maxWidth: '100px',
          opacity: isLoading ? 0.7 : 1,
        ...style
      }}
      onMouseEnter={(e) => {
          if (isLoading) return
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[700]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[200]
        }
      }}
      onMouseLeave={(e) => {
          if (isLoading) return
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = brandColors.primary[600]
        } else {
          e.currentTarget.style.backgroundColor = brandColors.primary[100]
        }
      }}
    >
        {isLoading ? (
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid transparent',
            borderTop: '2px solid currentColor',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        ) : (
      <Send size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        )}
        {size !== 'sm' && <span>{isLoading ? 'Sending...' : 'Send'}</span>}
    </button>

      {/* Customize Message Modal */}
      <CustomizeMessageModal
        isVisible={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onSend={handleCustomizeSubmit}
        defaultBusinessName={userData?.businessName || userData?.fullName || ''}
        defaultClientName={invoiceData?.clientName || invoiceData?.client?.name || ''}
      />
    </>
  )
}
