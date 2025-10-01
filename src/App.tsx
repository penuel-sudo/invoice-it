import { RouterProvider } from 'react-router-dom'
import { router } from './Routes'
import { NotificationProvider } from './contexts/NotificationContext'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </NotificationProvider>
  )
}

export default App
