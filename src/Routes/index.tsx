import { createBrowserRouter } from 'react-router-dom'
import AuthPage from '../pages/AuthPage'
import DashboardPage from '../pages/DashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />
  },
  {
    path: '/auth',
    element: <AuthPage />
  },
  {
    path: '/dashboard',
    element: <DashboardPage />
  }
])

export default router
