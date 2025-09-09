/**
 * Client data storage utilities
 */

import { storage, STORAGE_KEYS } from './index'

export interface ClientData {
  id: string
  name: string
  email: string
  address: string
  phone?: string
  createdAt: string
  lastUsed: string
}

export const clientStorage = {
  /**
   * Get all recent clients
   */
  getRecentClients: (): ClientData[] => {
    return storage.getItem<ClientData[]>(STORAGE_KEYS.RECENT_CLIENTS) || []
  },

  /**
   * Add or update a client
   */
  addClient: (client: Omit<ClientData, 'id' | 'createdAt' | 'lastUsed'>): boolean => {
    const clients = clientStorage.getRecentClients()
    const now = new Date().toISOString()
    
    // Check if client already exists
    const existingClientIndex = clients.findIndex(c => 
      c.email === client.email || c.name === client.name
    )

    const clientData: ClientData = {
      ...client,
      id: existingClientIndex >= 0 ? clients[existingClientIndex].id : Date.now().toString(),
      createdAt: existingClientIndex >= 0 ? clients[existingClientIndex].createdAt : now,
      lastUsed: now
    }

    if (existingClientIndex >= 0) {
      // Update existing client
      clients[existingClientIndex] = clientData
    } else {
      // Add new client
      clients.unshift(clientData)
    }

    // Keep only the 20 most recent clients
    const recentClients = clients.slice(0, 20)
    
    return storage.setItem(STORAGE_KEYS.RECENT_CLIENTS, recentClients)
  },

  /**
   * Remove a client
   */
  removeClient: (clientId: string): boolean => {
    const clients = clientStorage.getRecentClients()
    const filteredClients = clients.filter(c => c.id !== clientId)
    return storage.setItem(STORAGE_KEYS.RECENT_CLIENTS, filteredClients)
  },

  /**
   * Clear all clients
   */
  clearClients: (): boolean => {
    return storage.removeItem(STORAGE_KEYS.RECENT_CLIENTS)
  },

  /**
   * Search clients by name or email
   */
  searchClients: (query: string): ClientData[] => {
    const clients = clientStorage.getRecentClients()
    const lowercaseQuery = query.toLowerCase()
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(lowercaseQuery) ||
      client.email.toLowerCase().includes(lowercaseQuery)
    )
  },

  /**
   * Get client suggestions for autocomplete
   */
  getSuggestions: (query: string, limit: number = 5): ClientData[] => {
    const results = clientStorage.searchClients(query)
    return results.slice(0, limit)
  }
}
