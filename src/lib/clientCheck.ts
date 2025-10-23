import { supabase } from './supabaseClient'

export interface ClientFormData {
  name: string
  email?: string
  address?: string
  phone?: string
  company_name?: string
}

export interface ClientSaveResult {
  success: boolean
  clientId?: string
  isNewClient?: boolean
  isUpdated?: boolean
  error?: string
}

/**
 * CENTRALIZED CLIENT SAVING SERVICE
 * 
 * This is the ONLY component that handles client saving logic.
 * Any component that needs to save a client should use this service.
 * 
 * Features:
 * - Checks if client exists by name (case-insensitive)
 * - Updates existing client if found
 * - Creates new client if not found
 * - Handles all database operations
 * - Returns consistent results
 * 
 * @param clientData - The client data to save
 * @param userId - The current user's ID
 * @returns Promise<ClientSaveResult> - Result of the save operation
 */
export const saveClient = async (
  clientData: ClientFormData,
  userId: string
): Promise<ClientSaveResult> => {
  try {
    console.log('👤 [CLIENT SERVICE] Starting client save process:', {
      name: clientData.name,
      userId
    })

    // Step 1: Check if client already exists by name (CASE-INSENSITIVE)
    console.log('🔍 [CLIENT SERVICE] Checking if client exists...')
    const { data: existingClients, error: searchError } = await supabase
      .from('clients')
      .select('id, name, email, address, phone, company_name')
      .eq('user_id', userId)
      .ilike('name', clientData.name)

    if (searchError) {
      console.error('❌ [CLIENT SERVICE] Error searching for client:', searchError)
      return { 
        success: false, 
        error: 'Error searching for existing client' 
      }
    }

    // Find exact match (case-insensitive)
    const existingClient = existingClients?.find(client => 
      client.name.toLowerCase() === clientData.name.toLowerCase()
    )

    if (existingClient) {
      // Client exists - check if update is needed
      console.log('✅ [CLIENT SERVICE] Client exists, checking for updates...')
      
      const shouldUpdate = 
        existingClient.email !== (clientData.email || null) ||
        existingClient.address !== (clientData.address || null) ||
        existingClient.phone !== (clientData.phone || null) ||
        existingClient.company_name !== (clientData.company_name || null)

      if (shouldUpdate) {
        console.log('🔄 [CLIENT SERVICE] Updating existing client...')
        
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            email: clientData.email || null,
            address: clientData.address || null,
            phone: clientData.phone || null,
            company_name: clientData.company_name || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingClient.id)
          .eq('user_id', userId)

        if (updateError) {
          console.error('❌ [CLIENT SERVICE] Error updating client:', updateError)
          return { 
            success: false, 
            error: 'Failed to update client' 
          }
        }

        console.log('✅ [CLIENT SERVICE] Client updated successfully')
        return {
          success: true,
          clientId: existingClient.id,
          isNewClient: false,
          isUpdated: true
        }
      } else {
        console.log('✅ [CLIENT SERVICE] Client exists, no updates needed')
        return {
          success: true,
          clientId: existingClient.id,
          isNewClient: false,
          isUpdated: false
        }
      }
    } else {
      // Client doesn't exist - create new
      console.log('🆕 [CLIENT SERVICE] Creating new client...')
      
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: clientData.name.trim(),
          email: clientData.email?.trim() || null,
          address: clientData.address?.trim() || null,
          phone: clientData.phone?.trim() || null,
          company_name: clientData.company_name?.trim() || null
        })
        .select()
        .single()

      if (createError || !newClient) {
        console.error('❌ [CLIENT SERVICE] Error creating client:', createError)
        return { 
          success: false, 
          error: createError?.message || 'Failed to create client' 
        }
      }

      console.log('✅ [CLIENT SERVICE] New client created with ID:', newClient.id)
      return {
        success: true,
        clientId: newClient.id,
        isNewClient: true,
        isUpdated: false
      }
    }

  } catch (error) {
    console.error('❌ [CLIENT SERVICE] Unexpected error:', error)
    return { 
      success: false, 
      error: 'Unexpected error in client save process' 
    }
  }
}

