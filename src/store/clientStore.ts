import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Client {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  createdAt: string
  updatedAt: string
}

interface ClientStore {
  // State
  clients: Client[]
  currentClient: Client | null
  loading: boolean
  error: string | null

  // Actions
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void
  setCurrentClient: (client: Client | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getClientById: (id: string) => Client | undefined
  searchClients: (query: string) => Client[]
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      // Initial state
      clients: [],
      currentClient: null,
      loading: false,
      error: null,

      // Actions
      setClients: (clients) => set({ clients }),
      
      addClient: (client) => set((state) => ({
        clients: [...state.clients, client]
      })),
      
      updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map(client =>
          client.id === id ? { ...client, ...updates } : client
        )
      })),
      
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(client => client.id !== id)
      })),
      
      setCurrentClient: (client) => set({ currentClient: client }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Computed
      getClientById: (id) => {
        return get().clients.find(client => client.id === id)
      },
      
      searchClients: (query) => {
        const lowercaseQuery = query.toLowerCase()
        return get().clients.filter(client =>
          client.name.toLowerCase().includes(lowercaseQuery) ||
          client.email.toLowerCase().includes(lowercaseQuery) ||
          (client.company && client.company.toLowerCase().includes(lowercaseQuery))
        )
      }
    }),
    {
      name: 'client-store',
      partialize: (state) => ({
        clients: state.clients,
        currentClient: state.currentClient
      })
    }
  )
)
