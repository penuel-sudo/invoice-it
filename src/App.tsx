//import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { InvoiceForm } from './components/InvoiceForm'

function App() {

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center space-x-8 mb-6">
            <a href="https://vite.dev" target="_blank" className="hover:scale-110 transition-transform">
              <img src={viteLogo} className="h-16 w-16" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" className="hover:scale-110 transition-transform">
              <img src={reactLogo} className="h-16 w-16" alt="React logo" />
            </a>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Invoice MVP</h1>
          <p className="text-xl text-gray-600">Professional Invoice Management System</p>
        </div>
        
        <InvoiceForm />
        
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Built with React, TypeScript, Tailwind CSS, and shadcn/ui
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
