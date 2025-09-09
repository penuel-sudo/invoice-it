/**
 * Service Worker for Invoice-It PWA
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'invoice-it-v1'
const STATIC_CACHE = 'invoice-it-static-v1'
const DYNAMIC_CACHE = 'invoice-it-dynamic-v1'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/Routes/index.tsx',
  '/src/pages/DashboardPage.tsx',
  '/src/pages/AuthPage.tsx',
  '/src/pages/InvoiceCreatePage.tsx',
  '/src/pages/InvoicePreviewPage.tsx',
  '/src/pages/ProfilePage.tsx',
  '/src/components/layout/Layout.tsx',
  '/src/components/layout/BottomNav.tsx',
  '/src/components/layout/Sidebar.tsx',
  '/src/components/SettingsPanel.tsx',
  '/src/components/NotificationDropdown.tsx',
  '/src/lib/supabaseClient.ts',
  '/src/lib/useAuth.ts',
  '/src/lib/storage/invoiceStorage.ts',
  '/src/stylings.ts',
  '/src/index.css',
  '/src/styles/responsive.css',
  '/logo_web_app_256x256.png',
  '/logo_web_app_128x128.png',
  '/logo_web_app_64x64.png',
  '/logo_favicon_32x32.png',
  '/logo_favicon_16x16.png'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests (Supabase, Google Fonts, etc.)
  if (url.origin !== location.origin) {
    return
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url)
          return cachedResponse
        }

        // Otherwise, fetch from network and cache dynamic content
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // If network fails and no cache, show offline page for navigation
            if (request.destination === 'document') {
              return caches.match('/index.html')
            }
          })
      })
  )
})

// Background sync for offline invoice creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'invoice-sync') {
    console.log('Service Worker: Background sync triggered')
    event.waitUntil(syncInvoices())
  }
})

// Sync offline invoices when back online
async function syncInvoices() {
  try {
    // Get offline invoices from IndexedDB or localStorage
    const offlineInvoices = await getOfflineInvoices()
    
    for (const invoice of offlineInvoices) {
      try {
        // Attempt to sync with server
        await syncInvoiceToServer(invoice)
        // Remove from offline storage if successful
        await removeOfflineInvoice(invoice.id)
      } catch (error) {
        console.error('Service Worker: Failed to sync invoice', invoice.id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Helper functions for offline sync
async function getOfflineInvoices() {
  // This would integrate with your offline storage
  // For now, return empty array
  return []
}

async function syncInvoiceToServer(invoice) {
  // This would integrate with your Supabase client
  // For now, just log
  console.log('Service Worker: Syncing invoice to server', invoice)
}

async function removeOfflineInvoice(invoiceId) {
  // This would remove from offline storage
  console.log('Service Worker: Removing offline invoice', invoiceId)
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Invoice-It',
    icon: '/logo_web_app_128x128.png',
    badge: '/logo_favicon_32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Invoice',
        icon: '/logo_web_app_64x64.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo_web_app_64x64.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Invoice-It', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
