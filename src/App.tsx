import { RouterProvider } from 'react-router-dom'
import { router } from './Routes'
import PWAInstallPrompt from './components/PWAInstallPrompt'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
    </>
  )
}

export default App
