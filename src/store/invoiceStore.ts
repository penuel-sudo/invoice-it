import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  clientEmail: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
}

export interface InvoiceFormData {
  clientName: string
  clientEmail: string
  clientAddress: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  items: InvoiceItem[]
  notes: string
  terms: string
  subtotal: number
  taxAmount: number
  total: number
}

interface InvoiceStore {
  // State
  invoices: Invoice[]
  currentInvoice: Invoice | null
  formData: InvoiceFormData
  loading: boolean
  error: string | null

  // Actions
  setInvoices: (invoices: Invoice[]) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  setCurrentInvoice: (invoice: Invoice | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Form Actions
  setFormData: (data: Partial<InvoiceFormData>) => void
  resetForm: () => void
  addFormItem: () => void
  updateFormItem: (id: string, updates: Partial<InvoiceItem>) => void
  removeFormItem: (id: string) => void
  calculateTotals: () => void
  generateInvoiceNumber: () => string
  
  // Computed
  getInvoicesByStatus: (status: Invoice['status']) => Invoice[]
  getTotalRevenue: () => number
  getOutstandingAmount: () => number
  isFormValid: () => boolean
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      invoices: [],
      currentInvoice: null,
      formData: {
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        items: [],
        notes: '',
        terms: '',
        subtotal: 0,
        taxAmount: 0,
        total: 0
      },
      loading: false,
      error: null,

      // Actions
      setInvoices: (invoices) => set({ invoices }),
      
      addInvoice: (invoice) => set((state) => ({
        invoices: [...state.invoices, invoice]
      })),
      
      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map(invoice =>
          invoice.id === id ? { ...invoice, ...updates } : invoice
        )
      })),
      
      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(invoice => invoice.id !== id)
      })),
      
      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Form Actions
      setFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
      })),
      
      resetForm: () => set({
        formData: {
          clientName: '',
          clientEmail: '',
          clientAddress: '',
          invoiceNumber: get().generateInvoiceNumber(),
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: [],
          notes: '',
          terms: '',
          subtotal: 0,
          taxAmount: 0,
          total: 0
        }
      }),
      
      addFormItem: () => set((state) => ({
        formData: {
          ...state.formData,
          items: [
            ...state.formData.items,
            {
              id: Date.now().toString(),
              description: '',
              quantity: 1,
              unitPrice: 0,
              taxRate: 0,
              total: 0
            }
          ]
        }
      })),
      
      updateFormItem: (id, updates) => set((state) => ({
        formData: {
          ...state.formData,
          items: state.formData.items.map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
        }
      })),
      
      removeFormItem: (id) => set((state) => ({
        formData: {
          ...state.formData,
          items: state.formData.items.filter(item => item.id !== id)
        }
      })),
      
      calculateTotals: () => set((state) => {
        const subtotal = state.formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        const taxAmount = state.formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0)
        const total = subtotal + taxAmount
        
        return {
          formData: {
            ...state.formData,
            subtotal,
            taxAmount,
            total
          }
        }
      }),
      
      generateInvoiceNumber: () => {
        const count = get().invoices.length + 1
        return `#INV-${count.toString().padStart(3, '0')}`
      },

      // Computed
      getInvoicesByStatus: (status) => {
        return get().invoices.filter(invoice => invoice.status === status)
      },
      
      getTotalRevenue: () => {
        return get().invoices
          .filter(invoice => invoice.status === 'paid')
          .reduce((total, invoice) => total + invoice.total, 0)
      },
      
      getOutstandingAmount: () => {
        return get().invoices
          .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
          .reduce((total, invoice) => total + invoice.total, 0)
      },
      
      isFormValid: () => {
        const { formData } = get()
        return (
          formData.clientName.trim() !== '' &&
          formData.items.length > 0 &&
          formData.items.every(item => 
            item.description.trim() !== '' && 
            item.quantity > 0 && 
            item.unitPrice > 0
          )
        )
      }
    }),
    {
      name: 'invoice-store',
      partialize: (state) => ({
        invoices: state.invoices,
        currentInvoice: state.currentInvoice
      })
    }
  )
)
