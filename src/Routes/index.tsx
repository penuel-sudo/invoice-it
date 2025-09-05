import { createBrowserRouter } from 'react-router-dom'
import AuthPage from '../pages/AuthPage'
import DashboardPage from '../pages/DashboardPage'
import InvoiceCreatePage from '../pages/InvoiceCreatePage'
import AuthWrapper from '../components/AuthWrapper'

export const router = createBrowserRouter([
  {
    path: '/',
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
    path: '/dashboard',
    element: (
      <AuthWrapper requireAuth={true}>
        <DashboardPage />
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
  }
])

export default router
