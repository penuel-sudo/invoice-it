import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { 
  ArrowLeft, 
  Save, 
  Eye,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  StickyNote,
  User,
  CreditCard,
  Receipt,
  CheckCircle,
  Upload,
  X,
  Image
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useLoading } from '../contexts/LoadingContext'

interface ExpenseFormData {
  description: string
  category: string
  amount: string
  expense_date: string
  notes: string
  client_id?: string
  payment_method: string
  is_tax_deductible: boolean
  tax_rate: string
  receipt_file?: File
  receipt_url?: string
  receipt_filename?: string
}

interface Client {
  id: string
  name: string
  email?: string
  company_name?: string
}

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel & Transportation', 
  'Marketing & Advertising',
  'Software & Subscriptions',
  'Meals & Entertainment',
  'Utilities & Bills',
  'Professional Services',
  'Equipment & Hardware',
  'Other'
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
]

export default function ExpenseCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { loading, setLoading: setGlobalLoading } = useLoading()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
    client_id: '',
    payment_method: 'cash',
    is_tax_deductible: false,
    tax_rate: '0',
    receipt_file: undefined,
    receipt_url: '',
    receipt_filename: ''
  })
  const [errors, setErrors] = useState<Partial<ExpenseFormData>>({})
  const [clients, setClients] = useState<Client[]>([])

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
    if (user) {
      loadClients()
    }
  }, [user])

  const loadClients = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, company_name')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        console.error('Error loading clients:', error)
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ExpenseFormData> = {}

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number'
      }
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Expense date is required'
    } else {
      const selectedDate = new Date(formData.expense_date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      if (selectedDate > today) {
        newErrors.expense_date = 'Expense date cannot be in the future'
      }
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required'
    }

    if (formData.is_tax_deductible && formData.tax_rate) {
      const taxRate = parseFloat(formData.tax_rate)
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        newErrors.tax_rate = 'Tax rate must be between 0 and 100'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ExpenseFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF) or PDF file')
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    setFormData(prev => ({
      ...prev,
      receipt_file: file,
      receipt_filename: file.name
    }))
  }

  const removeReceipt = () => {
    setFormData(prev => ({
      ...prev,
      receipt_file: undefined,
      receipt_url: '',
      receipt_filename: ''
    }))
  }

  const handleSave = async () => {
    if (!user) return

    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    try {
      setGlobalLoading(true)

      let receiptUrl = null
      let receiptFilename = null

      // Upload receipt if provided
      if (formData.receipt_file) {
        const fileExt = formData.receipt_file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        console.log('Uploading receipt:', fileName)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(fileName, formData.receipt_file)

        if (uploadError) {
          console.error('Error uploading receipt:', uploadError)
          toast.error('Failed to upload receipt: ' + uploadError.message)
          return
        }

        console.log('Receipt uploaded successfully:', uploadData)

        // Get the public URL (works for public buckets)
        const { data: urlData } = supabase.storage
          .from('expense-receipts')
          .getPublicUrl(fileName)

        console.log('Receipt URL:', urlData.publicUrl)
        receiptUrl = urlData.publicUrl
        receiptFilename = formData.receipt_file.name
      }

      const expenseData = {
        user_id: user.id,
        description: formData.description.trim(),
        category: formData.category,
        amount: parseFloat(formData.amount),
        status: 'spent',
        expense_date: formData.expense_date,
        notes: formData.notes.trim() || null,
        client_id: formData.client_id || null,
        payment_method: formData.payment_method,
        is_tax_deductible: formData.is_tax_deductible,
        tax_rate: formData.is_tax_deductible ? parseFloat(formData.tax_rate) : 0,
        tax_amount: formData.is_tax_deductible ? (parseFloat(formData.amount) * parseFloat(formData.tax_rate) / 100) : 0,
        receipt_url: receiptUrl,
        receipt_filename: receiptFilename,
        receipt_size: formData.receipt_file?.size || null
      }

      console.log('Saving expense with data:', expenseData)

      const { error } = await supabase
        .from('expenses')
        .insert(expenseData)

      if (error) {
        console.error('Error saving expense:', error)
        toast.error('Failed to save expense: ' + error.message)
        return
      }

      toast.success('Expense saved successfully!')
      navigate('/invoices')
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error('Failed to save expense')
    } finally {
      setGlobalLoading(false)
    }
  }

  const handlePreview = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before previewing')
      return
    }

    // Navigate to preview with form data
    navigate('/expense/preview', { 
      state: { expenseData: formData } 
    })
  }

  if (!user) return null

  return (
    <Layout hideBottomNav={true}>
      <div style={{
        paddingBottom: isMobile ? '0.5rem' : '0.5rem',
        backgroundColor: brandColors.white,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Header - Match InvoiceCreatePage exactly */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={20} color={brandColors.neutral[600]} />
          </button>
          
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            margin: 0
          }}>
            New Expense
          </h1>
          
          <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Form Content */}
        <div style={{ padding: isMobile ? '0.875rem' : '1rem' }}>
          {/* Basic Information Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '1.25rem' : '1.5rem',
            marginBottom: isMobile ? '1rem' : '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <FileText size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Basic Information
              </h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="What did you purchase?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.description ? brandColors.error[300] : brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[900],
                    backgroundColor: brandColors.white,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = brandColors.primary[400]
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.description ? brandColors.error[300] : brandColors.neutral[300]
                  }}
                />
                {errors.description && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.error[600],
                    margin: '0.25rem 0 0 0'
                  }}>
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.category ? brandColors.error[300] : brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[900],
                    backgroundColor: brandColors.white,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = brandColors.primary[400]
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.category ? brandColors.error[300] : brandColors.neutral[300]
                  }}
                >
                  <option value="">Select a category</option>
                  {EXPENSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.error[600],
                    margin: '0.25rem 0 0 0'
                  }}>
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.amount ? brandColors.error[300] : brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[900],
                    backgroundColor: brandColors.white,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = brandColors.primary[400]
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.amount ? brandColors.error[300] : brandColors.neutral[300]
                  }}
                />
                {errors.amount && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.error[600],
                    margin: '0.25rem 0 0 0'
                  }}>
                    {errors.amount}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Expense Date *
                </label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => handleInputChange('expense_date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.expense_date ? brandColors.error[300] : brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[900],
                    backgroundColor: brandColors.white,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = brandColors.primary[400]
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.expense_date ? brandColors.error[300] : brandColors.neutral[300]
                  }}
                />
                {errors.expense_date && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.error[600],
                    margin: '0.25rem 0 0 0'
                  }}>
                    {errors.expense_date}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Client Information Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <CreditCard size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Payment & Client Information
              </h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Payment Method *
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.payment_method ? brandColors.error[300] : brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[900],
                    backgroundColor: brandColors.white,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = brandColors.primary[400]
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.payment_method ? brandColors.error[300] : brandColors.neutral[300]
                  }}
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                {errors.payment_method && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.error[600],
                    margin: '0.25rem 0 0 0'
                  }}>
                    {errors.payment_method}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Client (Optional)
                </label>
                <select
                  value={formData.client_id || ''}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: brandColors.neutral[900],
                    backgroundColor: brandColors.white,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = brandColors.primary[400]
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = brandColors.neutral[300]
                  }}
                >
                  <option value="">No client selected</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company_name && `(${client.company_name})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tax Information Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Receipt size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Tax Information
              </h2>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Tax Deductible Checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <input
                  type="checkbox"
                  id="tax_deductible"
                  checked={formData.is_tax_deductible}
                  onChange={(e) => handleInputChange('is_tax_deductible', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="tax_deductible" style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={16} />
                  This expense is tax deductible
                </label>
              </div>

              {/* Tax Rate (only show if tax deductible) */}
              {formData.is_tax_deductible && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[700],
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax_rate}
                      onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: `1px solid ${errors.tax_rate ? brandColors.error[300] : brandColors.neutral[300]}`,
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        color: brandColors.neutral[900],
                        backgroundColor: brandColors.white,
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = brandColors.primary[400]
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.tax_rate ? brandColors.error[300] : brandColors.neutral[300]
                      }}
                    />
                    {errors.tax_rate && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: brandColors.error[600],
                        margin: '0.25rem 0 0 0'
                      }}>
                        {errors.tax_rate}
                      </p>
                    )}
                  </div>
                  
                  {/* Tax Amount Display */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'end'
                  }}>
                    <div style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      backgroundColor: brandColors.neutral[50],
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      color: brandColors.neutral[600]
                    }}>
                      Tax Amount: ${formData.is_tax_deductible && formData.amount && formData.tax_rate 
                        ? (parseFloat(formData.amount) * parseFloat(formData.tax_rate) / 100).toFixed(2)
                        : '0.00'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 1rem 0'
            }}>
              Additional Notes
            </h2>
            
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional details about this expense..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[200]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: brandColors.neutral[900],
                backgroundColor: brandColors.white,
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = brandColors.primary[400]
              }}
              onBlur={(e) => {
                e.target.style.borderColor = brandColors.neutral[300]
              }}
            />
          </div>

          {/* Receipt Upload Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Upload size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Receipt Upload (Optional)
              </h2>
            </div>
            
            {!formData.receipt_file ? (
              <div style={{
                border: `2px dashed ${brandColors.neutral[300]}`,
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: brandColors.neutral[50]
              }}
              onClick={() => document.getElementById('receipt-upload')?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColors.primary[400]
                e.currentTarget.style.backgroundColor = brandColors.primary[50]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brandColors.neutral[300]
                e.currentTarget.style.backgroundColor = brandColors.neutral[50]
              }}>
                <Upload size={32} color={brandColors.neutral[400]} style={{ marginBottom: '0.5rem' }} />
                <p style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600],
                  margin: '0 0 0.25rem 0'
                }}>
                  Click to upload receipt
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[500],
                  margin: 0
                }}>
                  Supports: JPEG, PNG, GIF, PDF (Max 5MB)
                </p>
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptUpload}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: brandColors.neutral[50],
                borderRadius: '12px',
                border: `1px solid ${brandColors.neutral[200]}`
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: brandColors.primary[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Image size={20} color={brandColors.primary[600]} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[900],
                    margin: '0 0 0.25rem 0'
                  }}>
                    {formData.receipt_filename}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.neutral[500],
                    margin: 0
                  }}>
                    {(formData.receipt_file?.size || 0 / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={removeReceipt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: brandColors.error[600],
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = brandColors.error[50]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Action Buttons - Match InvoiceCreatePage exactly */}
        <div style={{
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: brandColors.white,
            padding: '0.75rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`,
            maxWidth: '100%',
            overflowX: 'auto'
          }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.neutral[100],
                color: brandColors.neutral[600],
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Save size={16} />
              Save
            </button>
            
            <button
              onClick={handlePreview}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
