import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AuthWrapper from '../components/AuthWrapper'

// Only lazy load the HEAVIEST pages
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const TransactionPage = lazy(() => import('../pages/TransactionPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))

// Import others normally (they're small)
import OnboardingPage from '../pages/OnboardingPage'
import AuthPage from '../pages/AuthPage'
import InvoiceCreatePage from '../pages/InvoiceCreatePage'
import InvoicePreviewPage from '../pages/InvoicePreviewPage'
import ExpenseCreatePage from '../pages/ExpenseCreatePage'
import ExpensePreviewPage from '../pages/ExpensePreviewPage'
import TemplateGalleryPage from '../pages/TemplateGalleryPage'
import ResetPasswordPage from '../pages/reset-password'
import ProfilePage from '../pages/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'

// Loading component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <OnboardingPage />
  },
  {
    path: '/dashboard',
    element: (
      <AuthWrapper requireAuth={true}>
        <Suspense fallback={<LoadingFallback />}>
          <DashboardPage />
        </Suspense>
      </AuthWrapper>
    )
  },
  {
    path: '/auth',
    element: (
      <AuthWrapper requireAuth={false}>
        <AuthPage />
      </AuthWrapper>
    )
  },
  {
    path: '/invoice/create/:template',
    element: (
      <AuthWrapper requireAuth={true}>
        <InvoiceCreatePage />
      </AuthWrapper>
    )
  },
  {
    path: '/invoice/preview/:template',
    element: (
      <AuthWrapper requireAuth={true}>
        <InvoicePreviewPage />
      </AuthWrapper>
    )
  },
  {
    path: '/invoices',
    element: (
      <AuthWrapper requireAuth={true}>
        <Suspense fallback={<LoadingFallback />}>
          <TransactionPage />
        </Suspense>
      </AuthWrapper>
    )
  },
  {
    path: '/expense/new',
    element: (
      <AuthWrapper requireAuth={true}>
        <ExpenseCreatePage />
      </AuthWrapper>
    )
  },
  {
    path: '/expense/preview',
    element: (
      <AuthWrapper requireAuth={true}>
        <ExpensePreviewPage />
      </AuthWrapper>
    )
  },
  {
    path: '/templates',
    element: (
      <AuthWrapper requireAuth={true}>
        <TemplateGalleryPage />
      </AuthWrapper>
    )
  },
  {
    path: '/profile',
    element: (
      <AuthWrapper requireAuth={true}>
        <ProfilePage />
      </AuthWrapper>
    )
  },
  {
    path: '/settings',
    element: (
      <AuthWrapper requireAuth={true}>
        <Suspense fallback={<LoadingFallback />}>
          <SettingsPage />
        </Suspense>
      </AuthWrapper>
    )
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

export default router
