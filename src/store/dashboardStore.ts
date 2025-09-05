import { create } from 'zustand'

export interface DashboardStats {
  totalRevenue: number
  outstandingAmount: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalClients: number
}

interface DashboardStore {
  // State
  stats: DashboardStats
  loading: boolean
  error: string | null
  lastUpdated: string | null

  // Actions
  setStats: (stats: DashboardStats) => void
  updateStats: (updates: Partial<DashboardStats>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastUpdated: (date: string) => void
  
  // Actions
  refreshStats: () => Promise<void>
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  stats: {
    totalRevenue: 0,
    outstandingAmount: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalClients: 0
  },
  loading: false,
  error: null,
  lastUpdated: null,

  // Actions
  setStats: (stats) => set({ stats }),
  
  updateStats: (updates) => set((state) => ({
    stats: { ...state.stats, ...updates }
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastUpdated: (date) => set({ lastUpdated: date }),

  // Actions
  refreshStats: async () => {
    set({ loading: true, error: null })
    
    try {
      // This will be implemented when we connect to Supabase
      // For now, we'll use mock data
      const mockStats: DashboardStats = {
        totalRevenue: 4200,
        outstandingAmount: 1800,
        totalInvoices: 12,
        paidInvoices: 8,
        pendingInvoices: 4,
        overdueInvoices: 0,
        totalClients: 5
      }
      
      set({ 
        stats: mockStats, 
        loading: false, 
        lastUpdated: new Date().toISOString() 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        loading: false 
      })
    }
  }
}))
