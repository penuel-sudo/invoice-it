import { RouterProvider } from 'react-router-dom'
import { router } from './Routes'
import { NotificationProvider } from './contexts/NotificationContext'
import { LoadingProvider } from './contexts/LoadingContext'
import PageLoader from './components/PageLoader'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <NotificationProvider>
      <LoadingProvider>
        <RouterProvider router={router} />
        <PageLoader />
        <Toaster position="top-right" />
      </LoadingProvider>
    </NotificationProvider>
  )
}

export default App
