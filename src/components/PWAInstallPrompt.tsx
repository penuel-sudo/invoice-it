import { useState, useEffect } from 'react'
import { brandColors } from '../stylings'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }
      
      // Check if running in PWA mode on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkIfInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Don't prevent default - let browser show its own prompt first
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if we should show our custom prompt
      const hasSeenPrompt = localStorage.getItem('pwa-install-seen')
      const hasDismissedPermanently = localStorage.getItem('pwa-install-dismissed-permanent')
      
      // Show our custom prompt if:
      // 1. User hasn't seen it before, OR
      // 2. User dismissed it but hasn't dismissed permanently
      if (!hasSeenPrompt || (!hasDismissedPermanently && hasSeenPrompt)) {
        // Show after a delay to let browser prompt show first
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 2000)
      }
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      // Clear any dismiss flags since app is now installed
      localStorage.removeItem('pwa-install-dismissed-permanent')
      localStorage.removeItem('pwa-install-seen')
    }

    // Listen for custom trigger event from settings
    const handleTriggerInstall = () => {
      if (deferredPrompt && !isInstalled) {
        setShowInstallPrompt(true)
      } else if (!deferredPrompt && !isInstalled) {
        // If no deferred prompt available, show a message
        alert('App installation is not available right now. Please try:\n\n1. Using your browser\'s install option (usually in the address bar)\n2. Refreshing the page and trying again\n3. Making sure you\'re using a supported browser (Chrome, Edge, Safari)')
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('trigger-install-prompt', handleTriggerInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('trigger-install-prompt', handleTriggerInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        // Mark as seen and clear dismiss flags
        localStorage.setItem('pwa-install-seen', 'true')
        localStorage.removeItem('pwa-install-dismissed-permanent')
      } else {
        console.log('User dismissed the install prompt')
        // Mark as seen but don't dismiss permanently yet
        localStorage.setItem('pwa-install-seen', 'true')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Mark as seen
    localStorage.setItem('pwa-install-seen', 'true')
  }

  const handleDismissPermanently = () => {
    setShowInstallPrompt(false)
    // Mark as permanently dismissed
    localStorage.setItem('pwa-install-dismissed-permanent', 'true')
    localStorage.setItem('pwa-install-seen', 'true')
  }

  // Don't show if already installed
  if (isInstalled) {
    return null
  }

  // Don't show if permanently dismissed
  if (localStorage.getItem('pwa-install-dismissed-permanent')) {
    return null
  }

  // Don't show if no prompt available
  if (!showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      right: '1rem',
      backgroundColor: brandColors.white,
      borderRadius: '16px',
      padding: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      border: `1px solid ${brandColors.neutral[200]}`,
      zIndex: 1000,
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: brandColors.primary[100],
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Download size={20} color={brandColors.primary[600]} />
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: '0 0 0.25rem 0'
          }}>
            Install Invoice-It
          </h3>
          <p style={{
            fontSize: '0.75rem',
            color: brandColors.neutral[600],
            margin: '0 0 0.75rem 0',
            lineHeight: '1.4'
          }}>
            Install our app for quick access and offline functionality
          </p>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <button
              onClick={handleInstallClick}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[600]
              }}
            >
              Install
            </button>
            
            <button
              onClick={handleDismissPermanently}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'transparent',
                color: brandColors.neutral[500],
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.neutral[100]
                e.currentTarget.style.color = brandColors.neutral[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = brandColors.neutral[500]
              }}
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
