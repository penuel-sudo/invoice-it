import { create } from 'zustand'

// Invoice item type
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// Invoice type
export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes?: string
}

// Invoice store state
interface InvoiceStore {
  invoices: Invoice[]
  currentInvoice: Invoice | null
  isLoading: boolean
  
  // Actions
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  setCurrentInvoice: (invoice: Invoice | null) => void
  setLoading: (loading: boolean) => void
  
  // Computed values
  getInvoiceById: (id: string) => Invoice | undefined
  getInvoicesByStatus: (status: Invoice['status']) => Invoice[]
}

// Create the store
export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  currentInvoice: null,
  isLoading: false,
  
  addInvoice: (invoice) => 
    set((state) => ({ 
      invoices: [...state.invoices, invoice] 
    })),
    
  updateInvoice: (id, updates) =>
    set((state) => ({
      invoices: state.invoices.map(inv => 
        inv.id === id ? { ...inv, ...updates } : inv
      ),
      currentInvoice: state.currentInvoice?.id === id 
        ? { ...state.currentInvoice, ...updates }
        : state.currentInvoice
    })),
    
  deleteInvoice: (id) =>
    set((state) => ({
      invoices: state.invoices.filter(inv => inv.id !== id),
      currentInvoice: state.currentInvoice?.id === id ? null : state.currentInvoice
    })),
    
  setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  getInvoiceById: (id) => get().invoices.find(inv => inv.id === id),
  getInvoicesByStatus: (status) => get().invoices.filter(inv => inv.status === status),
}))
