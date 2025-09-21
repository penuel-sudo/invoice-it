import { createBrowserRouter } from 'react-router-dom'
import OnboardingPage from '../pages/OnboardingPage'
import AuthPage from '../pages/AuthPage'
import DashboardPage from '../pages/DashboardPage'
import InvoiceCreatePage from '../pages/InvoiceCreatePage'
import InvoicePreviewPage from '../pages/InvoicePreviewPage'
import TransactionPage from '../pages/TransactionPage'
import ExpenseCreatePage from '../pages/ExpenseCreatePage'
import ExpensePreviewPage from '../pages/ExpensePreviewPage'
import ResetPasswordPage from '../pages/reset-password'
import ProfilePage from '../pages/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'
import AuthWrapper from '../components/AuthWrapper'

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
    path: '/invoice/new',
    element: (
      <AuthWrapper requireAuth={true}>
        <InvoiceCreatePage />
      </AuthWrapper>
    )
  },
  {
    path: '/invoice/preview',
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
    path: '/profile',
    element: (
      <AuthWrapper requireAuth={true}>
        <ProfilePage />
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
