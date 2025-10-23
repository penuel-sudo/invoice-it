/**
 * CLIENT SERVICE USAGE EXAMPLES
 * 
 * This file shows how to use the centralized client saving service
 * in different components throughout the application.
 */

import { saveClient } from '../lib/clientCheck'

// Example 1: Invoice Template (DefaultCreate, ProfessionalCreate)
export const saveClientInInvoice = async (clientData: any, userId: string) => {
  const result = await saveClient({
    name: clientData.clientName,
    email: clientData.clientEmail,
    address: clientData.clientAddress,
    phone: clientData.clientPhone,
    company_name: clientData.clientCompanyName
  }, userId)

  if (result.success) {
    console.log('Client saved successfully:', result.clientId)
    
    // Show appropriate message to user
    if (result.isNewClient) {
      console.log('✅ New client created')
    } else if (result.isUpdated) {
      console.log('🔄 Existing client updated')
    } else {
      console.log('ℹ️ Using existing client')
    }
    
    return result.clientId
  } else {
    console.error('❌ Failed to save client:', result.error)
    throw new Error(result.error)
  }
}

// Example 2: Client Page (ClientPage.tsx)
export const saveClientInClientPage = async (formData: any, userId: string) => {
  const result = await saveClient({
    name: formData.name,
    email: formData.email,
    address: formData.address,
    phone: formData.phone,
    company_name: formData.company_name
  }, userId)

  if (result.success) {
    // Handle success based on what happened
    if (result.isNewClient) {
      console.log('✅ New client created')
    } else if (result.isUpdated) {
      console.log('🔄 Client updated')
    } else {
      console.log('ℹ️ Client already exists')
    }
    
    return result
  } else {
    console.error('❌ Failed to save client:', result.error)
    return result
  }
}

// Example 3: Any other component that needs to save clients
export const saveClientAnywhere = async (clientData: {
  name: string
  email?: string
  address?: string
  phone?: string
  company_name?: string
}, userId: string) => {
  
  // Just call the service - it handles everything!
  const result = await saveClient(clientData, userId)
  
  // The service automatically:
  // 1. Checks if client exists by name (case-insensitive)
  // 2. Updates existing client if found and data changed
  // 3. Creates new client if not found
  // 4. Returns consistent result object
  
  return result
}

/**
 * BENEFITS OF THIS APPROACH:
 * 
 * 1. 🎯 SINGLE SOURCE OF TRUTH - All client saving logic in one place
 * 2. 🛡️ DUPLICATE PREVENTION - Automatically checks for existing clients
 * 3. 🔄 SMART UPDATES - Only updates fields that have changed
 * 4. 📝 CONSISTENT API - Same interface across all components
 * 5. 🧹 DRY CODE - No duplicate client saving logic
 * 6. 🔧 EASY TO MAINTAIN - Changes in one place affect all components
 * 7. ⚡ SIMPLE TO USE - Just call saveClient() with data and userId
 * 8. 📊 RICH RESULTS - Know exactly what happened (new/updated/existing)
 */
