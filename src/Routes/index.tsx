import { createBrowserRouter } from 'react-router-dom'
import AuthWrapper from '../components/AuthWrapper'

// Import all pages normally to avoid dynamic import issues
import OnboardingPage from '../pages/OnboardingPage'
import AuthPage from '../pages/AuthPage'
import DashboardPage from '../pages/DashboardPage'
import TransactionPage from '../pages/TransactionPage'
import InvoiceCreatePage from '../pages/InvoiceCreatePage'
import InvoicePreviewPage from '../pages/InvoicePreviewPage'
import ExpenseCreatePage from '../pages/ExpenseCreatePage'
import ExpensePreviewPage from '../pages/ExpensePreviewPage'
import TemplateGalleryPage from '../pages/TemplateGalleryPage'
import ResetPasswordPage from '../pages/reset-password'
import ProfilePage from '../pages/ProfilePage'
import SettingsPage from '../pages/SettingsPage'
import NotFoundPage from '../pages/NotFoundPage'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <OnboardingPage />
  },
  {
    path: '/dashboard',
    element: (
      <AuthWrapper requireAuth={true}>
        <DashboardPage />
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
        <TransactionPage />
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
        <SettingsPage />
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
