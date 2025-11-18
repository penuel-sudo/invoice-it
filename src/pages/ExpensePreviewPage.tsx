import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import StatusButton from '../components/StatusButton'
import { useGlobalCurrency } from '../hooks/useGlobalCurrency'
import { getCurrencySymbol } from '../lib/currencyUtils'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  FileText,
  Tag,
  StickyNote,
  ArrowDownRight,
  CreditCard,
  User,
  Receipt,
  CheckCircle,
  Download,
  Share2,
  Save
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useLoading } from '../contexts/LoadingContext'
import { expenseStorage } from '../lib/storage/expenseStorage'
// StatusLogic removed - StatusButton handles validation internally

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
]

interface Expense {
  id: string
  expense_number?: string
  description: string
  category: string
  amount: number
  status: 'spent' | 'expense'
  expense_date: string
  notes?: string
  client_id?: string
  client_name?: string
  payment_method: string
  is_tax_deductible: boolean
  tax_rate: number
  tax_amount: number
  currency_code?: string
  receipt_url?: string
  receipt_filename?: string
  receipt_size?: number
  created_at: string
  updated_at?: string
}

export default function ExpensePreviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { loading: globalLoading, setLoading: setGlobalLoading } = useLoading()
  const { currencySymbol: userDefaultCurrencySymbol } = useGlobalCurrency()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loadingExpense, setLoadingExpense] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      setAuthLoading(false)
      if (!user) {
        navigate('/auth/login')
        return
      }

      loadExpenseData()
    }, 100)

    return () => clearTimeout(timer)
  }, [user, navigate, searchParams, setGlobalLoading])

  const loadExpenseData = async () => {
    if (!user) return

    // Priority 1: Check if data is passed from Create page via state
    if ((location.state as any)?.expenseData) {
      console.log('✅ [EXPENSE PREVIEW] Found expense data in state (from create page)')
      const stateData = (location.state as any).expenseData
      const expenseNumber = stateData.expense_number || `EXP-${Date.now()}`
      
      const transformedExpense: Expense = {
        id: 'preview-draft',
        expense_number: expenseNumber,
        description: stateData.description,
        category: stateData.category,
        amount: parseFloat(stateData.amount),
        status: 'spent',
        expense_date: stateData.expense_date,
        notes: stateData.notes,
        client_id: stateData.client_id,
        client_name: undefined,
        payment_method: stateData.payment_method,
        is_tax_deductible: stateData.is_tax_deductible,
        tax_rate: parseFloat(stateData.tax_rate),
        tax_amount: stateData.is_tax_deductible ? (parseFloat(stateData.amount) * parseFloat(stateData.tax_rate) / 100) : 0,
        currency_code: stateData.currency_code,
        receipt_url: stateData.receipt_url,
        receipt_filename: stateData.receipt_filename,
        receipt_size: stateData.receipt_size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setExpense(transformedExpense)
      setGlobalLoading(false)
      return
    }

    // Get expense_number from URL params (for transaction page navigation)
    const expenseNumber = searchParams.get('number')
    
    if (!expenseNumber) {
      console.error('❌ [EXPENSE PREVIEW] No expense number in URL params or state')
      toast.error('Expense number not found')
      navigate('/expenses/create')
      return
    }

    console.log('🔍 [EXPENSE PREVIEW] Loading expense from URL params:', expenseNumber)

    // Priority 2: Check localStorage for draft with this expense_number
    const savedDraft = expenseStorage.getDraft(expenseNumber)
    if (savedDraft) {
      console.log('✅ [EXPENSE PREVIEW] Found draft in localStorage:', expenseNumber)
      const transformedExpense: Expense = {
        id: 'draft-preview',
        expense_number: expenseNumber,
        description: savedDraft.description,
        category: savedDraft.category,
        amount: parseFloat(savedDraft.amount),
        status: 'spent',
        expense_date: savedDraft.expense_date,
        notes: savedDraft.notes,
        client_id: savedDraft.client_id,
        client_name: undefined,
        payment_method: savedDraft.payment_method,
        is_tax_deductible: savedDraft.is_tax_deductible,
        tax_rate: parseFloat(savedDraft.tax_rate),
        tax_amount: savedDraft.is_tax_deductible ? (parseFloat(savedDraft.amount) * parseFloat(savedDraft.tax_rate) / 100) : 0,
        currency_code: savedDraft.currency_code,
        receipt_url: savedDraft.receipt_url,
        receipt_filename: savedDraft.receipt_filename,
        receipt_size: savedDraft.receipt_size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setExpense(transformedExpense)
      setGlobalLoading(false)
      return
    }

    // Priority 3: Query database for saved expense by expense_number
    console.log('📥 [EXPENSE PREVIEW] Draft not found, checking database...')
    await loadExpenseByNumber(expenseNumber)
  }

  const loadExpenseByNumber = async (expenseNumber: string) => {
    if (!user) return

    try {
      setLoadingExpense(true)
      setGlobalLoading(true)
      
      console.log('📥 [EXPENSE PREVIEW] Loading expense from DB by number:', expenseNumber)
      
      // Query expenses table by expense_number
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('expense_number', expenseNumber)
        .eq('user_id', user.id)
        .single()

      if (expenseError || !expenseData) {
        console.error('❌ [EXPENSE PREVIEW] Expense not found in database:', expenseNumber)
        toast.error('Expense not found. Returning to create page.')
        // Redirect back to create page
        navigate('/expenses/create')
        return
      }

      console.log('✅ [EXPENSE PREVIEW] Expense loaded successfully:', expenseData.expense_number)

      // Load client name if client_id exists
      let clientName: string | undefined = undefined
      if (expenseData.client_id) {
        try {
          const { data: clientData } = await supabase
            .from('clients')
            .select('name, company_name')
            .eq('id', expenseData.client_id)
            .eq('user_id', user.id)
            .single()
          
          if (clientData) {
            clientName = clientData.name || clientData.company_name || undefined
          }
        } catch (clientError) {
          console.warn('Could not load client name:', clientError)
        }
      }

      // Transform the data to match Expense interface
      const transformedExpense: Expense = {
        id: expenseData.id,
        expense_number: expenseData.expense_number,
        description: expenseData.description,
        category: expenseData.category,
        amount: parseFloat(expenseData.amount.toString()),
        status: expenseData.status as 'spent' | 'expense',
        expense_date: expenseData.expense_date,
        notes: expenseData.notes || undefined,
        client_id: expenseData.client_id || undefined,
        client_name: clientName,
        payment_method: expenseData.payment_method,
        is_tax_deductible: expenseData.is_tax_deductible,
        tax_rate: parseFloat(expenseData.tax_rate?.toString() || '0'),
        tax_amount: parseFloat(expenseData.tax_amount?.toString() || '0'),
        currency_code: expenseData.currency_code || undefined,
        receipt_url: expenseData.receipt_url || undefined,
        receipt_filename: expenseData.receipt_filename || undefined,
        receipt_size: expenseData.receipt_size || undefined,
        created_at: expenseData.created_at,
        updated_at: expenseData.updated_at || undefined
      }

      setExpense(transformedExpense)
    } catch (error) {
      console.error('Error loading expense:', error)
      toast.error('Failed to load expense')
      navigate('/invoices')
    } finally {
      setLoadingExpense(false)
      setGlobalLoading(false)
    }
  }

  const loadExpense = async (expenseId: string) => {
    if (!user) {
      console.error('❌ [EXPENSE PREVIEW] No user, cannot load expense')
      return
    }

    try {
      setLoadingExpense(true)
      setGlobalLoading(true)
      
      console.log('📥 [EXPENSE PREVIEW] Loading expense from DB:', expenseId)
      
      // Query expenses table directly
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .single()

      if (expenseError) {
        console.error('❌ [EXPENSE PREVIEW] Error loading expense:', expenseError)
        toast.error('Failed to load expense: ' + expenseError.message)
        navigate('/invoices')
        return
      }

      if (!expenseData) {
        console.error('❌ [EXPENSE PREVIEW] Expense not found in database')
        toast.error('Expense not found')
        navigate('/invoices')
        return
      }

      console.log('✅ [EXPENSE PREVIEW] Expense loaded successfully:', expenseData.id)

      // Load client name if client_id exists
      let clientName: string | undefined = undefined
      if (expenseData.client_id) {
        try {
          const { data: clientData } = await supabase
            .from('clients')
            .select('name, company_name')
            .eq('id', expenseData.client_id)
            .eq('user_id', user.id)
            .single()
          
          if (clientData) {
            clientName = clientData.name || clientData.company_name || undefined
          }
        } catch (clientError) {
          console.warn('Could not load client name:', clientError)
          // Continue without client name
        }
      }

      // Transform the data to match Expense interface
      const transformedExpense: Expense = {
        id: expenseData.id,
        expense_number: expenseData.expense_number,
        description: expenseData.description,
        category: expenseData.category,
        amount: parseFloat(expenseData.amount.toString()),
        status: expenseData.status as 'spent' | 'expense',
        expense_date: expenseData.expense_date,
        notes: expenseData.notes || undefined,
        client_id: expenseData.client_id || undefined,
        client_name: clientName,
        payment_method: expenseData.payment_method,
        is_tax_deductible: expenseData.is_tax_deductible,
        tax_rate: parseFloat(expenseData.tax_rate?.toString() || '0'),
        tax_amount: parseFloat(expenseData.tax_amount?.toString() || '0'),
        currency_code: expenseData.currency_code || undefined,
        receipt_url: expenseData.receipt_url || undefined,
        receipt_filename: expenseData.receipt_filename || undefined,
        receipt_size: expenseData.receipt_size || undefined,
        created_at: expenseData.created_at,
        updated_at: expenseData.updated_at || undefined
      }

      setExpense(transformedExpense)
    } catch (error) {
      console.error('Error loading expense:', error)
      toast.error('Failed to load expense')
      navigate('/invoices')
    } finally {
      setLoadingExpense(false)
      setGlobalLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!expense || !user) return

    const confirmed = window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeleting(true)

      // Handle delete action directly
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)
        .eq('user_id', user.id)

      const result = {
        success: !error,
        message: error ? 'Failed to delete expense' : 'Expense deleted successfully'
      }

      if (result.success) {
        toast.success('Expense deleted successfully')
        navigate('/invoices')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!expense || !user) return

    try {
      setGlobalLoading(true)

      const expenseData = {
        user_id: user.id,
        expense_number: expense.expense_number,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        status: expense.status || 'spent',
        expense_date: expense.expense_date,
        notes: expense.notes || null,
        client_id: expense.client_id || null,
        payment_method: expense.payment_method,
        is_tax_deductible: expense.is_tax_deductible,
        tax_rate: expense.tax_rate || 0,
        tax_amount: expense.tax_amount || 0,
        currency_code: expense.currency_code || 'USD',
        receipt_url: expense.receipt_url || null,
        receipt_filename: expense.receipt_filename || null,
        receipt_size: expense.receipt_size || null
      }

      console.log('💾 [EXPENSE PREVIEW] Saving expense:', expenseData)

      const { data: savedExpense, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select('id, expense_number')
        .single()

      if (error) {
        console.error('❌ [EXPENSE PREVIEW] Error saving expense:', error)
        toast.error('Failed to save expense: ' + error.message)
        return
      }

      console.log('✅ [EXPENSE PREVIEW] Expense saved successfully:', savedExpense.expense_number)

      // Clear localStorage draft after successful save
      if (expense.expense_number) {
        expenseStorage.clearDraft(expense.expense_number)
        console.log('🗑️ [EXPENSE PREVIEW] Cleared draft from localStorage')
      }

      toast.success('Expense saved successfully!')
      navigate('/expenses')
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error('Failed to save expense')
    } finally {
      setGlobalLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    const expenseCurrency = expense?.currency_code
    const symbol = expenseCurrency ? getCurrencySymbol(expenseCurrency) : userDefaultCurrencySymbol
    return `${symbol}${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  if (authLoading) {
    return (
      <Layout>
        <div style={{
          padding: '2rem',
          backgroundColor: brandColors.white,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '1rem',
            color: brandColors.neutral[600]
          }}>
            Loading...
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) return null

  // Don't show "not found" while still loading
  if (!expense && !authLoading && !loadingExpense) {
    return (
      <Layout>
        <div style={{
          padding: '2rem',
          backgroundColor: brandColors.white,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              marginBottom: '0.5rem'
            }}>
              Expense Not Found
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: brandColors.neutral[600],
              marginBottom: '1rem'
            }}>
              The expense you're looking for doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => navigate('/invoices')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Back to Transactions
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{
        padding: '1rem',
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Header - Simplified Design */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          padding: isMobile ? '0.875rem 1rem' : '1rem 2rem',
          paddingBottom: isMobile ? '0.875rem' : '1rem',
          backgroundColor: 'white',
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </button>

          <h1 style={{
            fontSize: isMobile ? '1.125rem' : '1.5rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0,
            textAlign: 'center',
            flex: 1
          }}>
            Expense Receipt
          </h1>

          <div style={{ width: isMobile ? '36px' : '40px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Main Content - Clean Card Layout */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          {/* Expense Summary Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: isMobile ? '12px' : '16px',
            border: `1px solid ${brandColors.neutral[200]}`,
            padding: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center'
          }}>
            {/* Expense Icon & Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: brandColors.error[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowDownRight size={28} color={brandColors.error[600]} />
              </div>
              <StatusButton status={expense.status} size="lg" />
            </div>

            {/* Description */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 0.5rem 0'
            }}>
              {expense.description}
            </h2>

            {/* Amount */}
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: brandColors.error[600],
              margin: '0 0 0.5rem 0'
            }}>
              {formatAmount(expense.amount)}
            </div>

            {/* Category */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: brandColors.neutral[100],
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700]
            }}>
              <Tag size={16} />
              {expense.category}
            </div>
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem'
          }}>
            {/* Payment Information */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: isMobile ? '12px' : '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              padding: isMobile ? '1.25rem' : '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CreditCard size={20} />
                Payment Details
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    margin: '0 0 0.25rem 0'
                  }}>
                    Payment Method
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: brandColors.neutral[900],
                    margin: 0
                  }}>
                    {PAYMENT_METHODS.find(m => m.value === expense.payment_method)?.label || expense.payment_method}
                  </p>
                </div>
                
                {expense.client_name && (
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[700],
                      margin: '0 0 0.25rem 0'
                    }}>
                      Client
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      color: brandColors.neutral[900],
                      margin: 0
                    }}>
                      {expense.client_name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tax Information */}
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: isMobile ? '12px' : '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              padding: isMobile ? '1.25rem' : '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Receipt size={20} />
                Tax Information
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle 
                    size={16} 
                    color={expense.is_tax_deductible ? brandColors.success[600] : brandColors.neutral[400]} 
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    color: expense.is_tax_deductible ? brandColors.success[700] : brandColors.neutral[600]
                  }}>
                    {expense.is_tax_deductible ? 'Tax Deductible' : 'Not Tax Deductible'}
                  </span>
                </div>
                
                {expense.is_tax_deductible && expense.tax_rate && expense.tax_rate > 0 && (
                  <>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        margin: '0 0 0.25rem 0'
                      }}>
                        Tax Rate
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        color: brandColors.neutral[900],
                        margin: 0
                      }}>
                        {expense.tax_rate}%
                      </p>
                    </div>
                    
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: brandColors.neutral[700],
                        margin: '0 0 0.25rem 0'
                      }}>
                        Tax Amount
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        color: brandColors.neutral[900],
                        margin: 0
                      }}>
                        {formatAmount(expense.tax_amount || 0)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {expense.notes && (
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: isMobile ? '12px' : '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              padding: isMobile ? '1.25rem' : '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <StickyNote size={20} />
                Notes
              </h3>
              
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[700],
                margin: 0,
                lineHeight: '1.6'
              }}>
                {expense.notes}
              </p>
            </div>
          )}

          {/* Receipt Section - Only show if receipt exists */}
          {expense.receipt_url && (
            <div style={{
              backgroundColor: brandColors.white,
              borderRadius: isMobile ? '12px' : '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              padding: isMobile ? '1.25rem' : '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Receipt size={20} />
                Receipt
              </h3>
              
              {/* Receipt Preview - Show image/PDF inline */}
              <div style={{
                backgroundColor: brandColors.neutral[50],
                borderRadius: isMobile ? '10px' : '12px',
                border: `1px solid ${brandColors.neutral[200]}`,
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                {expense.receipt_filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  // Display image
                  <img 
                    src={expense.receipt_url} 
                    alt="Receipt"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      maxHeight: isMobile ? '400px' : '600px',
                      objectFit: 'contain'
                    }}
                    onClick={() => window.open(expense.receipt_url, '_blank')}
                  />
                ) : expense.receipt_filename?.match(/\.pdf$/i) ? (
                  // Display PDF
                  <iframe
                    src={expense.receipt_url}
                    style={{
                      width: '100%',
                      height: isMobile ? '400px' : '600px',
                      border: 'none'
                    }}
                    title="Receipt PDF"
                  />
                ) : (
                  // Fallback for other file types
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: brandColors.neutral[600]
                  }}>
                    <Receipt size={48} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                      {expense.receipt_filename || 'Receipt file'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: brandColors.neutral[500] }}>
                      Preview not available for this file type
                    </p>
                  </div>
                )}
              </div>

              {/* File Info and Download Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '0.875rem' : '1rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: isMobile ? '8px' : '10px',
                border: `1px solid ${brandColors.neutral[200]}`
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[900],
                    margin: '0 0 0.25rem 0'
                  }}>
                    {expense.receipt_filename || 'Receipt'}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.neutral[500],
                    margin: 0
                  }}>
                    {expense.receipt_size ? `${(expense.receipt_size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                  </p>
                </div>
                <button
                  onClick={() => window.open(expense.receipt_url, '_blank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: isMobile ? '0.625rem 1rem' : '0.5rem 1rem',
                    backgroundColor: brandColors.primary[600],
                    color: brandColors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.primary[700]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.primary[600]
                  }}
                >
                  <Download size={16} />
                  {isMobile ? 'Open' : 'Open in New Tab'}
                </button>
              </div>
            </div>
          )}

          {/* Footer Information */}
          <div style={{
            backgroundColor: brandColors.neutral[50],
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: brandColors.neutral[500],
              margin: 0
            }}>
              Created on {formatDate(expense.created_at)} • {expense.expense_number || `ID: ${expense.id.slice(0, 8).toUpperCase()}`}
            </p>
          </div>

          {/* Action Buttons - Below Preview Card */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '1rem' : '0',
            position: 'sticky',
            bottom: isMobile ? '0' : 'auto',
            backgroundColor: isMobile ? brandColors.white : 'transparent',
            borderTop: isMobile ? `1px solid ${brandColors.neutral[200]}` : 'none',
            margin: isMobile ? '0 -1rem' : '0',
            paddingBottom: isMobile ? '1.5rem' : '0'
          }}>
            {/* Save Button - Only show if expense is unsaved (draft) */}
            {expense.id === 'draft-preview' && (
              <button
                onClick={handleSave}
                disabled={globalLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  flex: 1,
                  padding: isMobile ? '1rem' : '0.875rem 1.5rem',
                  minHeight: isMobile ? '52px' : 'auto',
                  backgroundColor: brandColors.success[600],
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: isMobile ? '12px' : '10px',
                  fontSize: isMobile ? '0.9375rem' : '0.875rem',
                  fontWeight: '600',
                  cursor: globalLoading ? 'not-allowed' : 'pointer',
                  opacity: globalLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!globalLoading) e.currentTarget.style.backgroundColor = brandColors.success[700]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.success[600]
                }}
              >
                <Save size={isMobile ? 20 : 16} />
                {globalLoading ? 'Saving...' : 'Save Expense'}
              </button>
            )}

            <button
              onClick={() => navigate('/expense/new', { state: { expenseData: expense } })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flex: 1,
                padding: isMobile ? '1rem' : '0.875rem 1.5rem',
                minHeight: isMobile ? '52px' : 'auto',
                backgroundColor: 'transparent',
                color: brandColors.primary[600],
                border: `2px solid ${brandColors.primary[600]}`,
                borderRadius: isMobile ? '12px' : '10px',
                fontSize: isMobile ? '0.9375rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[50]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Edit size={isMobile ? 20 : 16} />
              Edit Expense
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flex: 1,
                padding: isMobile ? '1rem' : '0.875rem 1.5rem',
                minHeight: isMobile ? '52px' : 'auto',
                backgroundColor: brandColors.error[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: isMobile ? '12px' : '10px',
                fontSize: isMobile ? '0.9375rem' : '0.875rem',
                fontWeight: '600',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: deleting ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = brandColors.error[700]
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = brandColors.error[600]
                }
              }}
            >
              <Trash2 size={isMobile ? 20 : 16} />
              {deleting ? 'Deleting...' : 'Delete Expense'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
