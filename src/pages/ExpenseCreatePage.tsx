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
  StickyNote
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'

interface ExpenseFormData {
  description: string
  category: string
  amount: string
  expense_date: string
  notes: string
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

export default function ExpenseCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0], // Today's date
    notes: ''
  })
  const [errors, setErrors] = useState<Partial<ExpenseFormData>>({})

  useEffect(() => {
    if (!user) {
      navigate('/auth')
    }
  }, [user, navigate])

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSave = async (status: 'spent' | 'expense') => {
    if (!user) return

    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description: formData.description.trim(),
          category: formData.category,
          amount: parseFloat(formData.amount),
          status: status,
          expense_date: formData.expense_date,
          notes: formData.notes.trim() || null
        })

      if (error) {
        console.error('Error saving expense:', error)
        toast.error('Failed to save expense: ' + error.message)
        return
      }

      const successMessage = status === 'spent' 
        ? 'Expense saved successfully' 
        : 'Expense categorized successfully'
      
      toast.success(successMessage)
      navigate('/invoices')
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error('Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

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
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${brandColors.neutral[200]}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => navigate('/invoices')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                e.currentTarget.style.borderColor = brandColors.neutral[400]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = brandColors.neutral[300]
              }}
            >
              <ArrowLeft size={20} color={brandColors.neutral[600]} />
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: 0
            }}>
              Create Expense
            </h1>
          </div>
        </div>

        {/* Form */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '0.5rem'
            }}>
              <FileText size={16} />
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What did you purchase?"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `1px solid ${errors.description ? brandColors.error[300] : brandColors.neutral[300]}`,
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

          {/* Category */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '0.5rem'
            }}>
              <Tag size={16} />
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `1px solid ${errors.category ? brandColors.error[300] : brandColors.neutral[300]}`,
                borderRadius: '12px',
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

          {/* Amount */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '0.5rem'
            }}>
              <DollarSign size={16} />
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
                padding: '0.875rem 1rem',
                border: `1px solid ${errors.amount ? brandColors.error[300] : brandColors.neutral[300]}`,
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

          {/* Expense Date */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '0.5rem'
            }}>
              <Calendar size={16} />
              Expense Date *
            </label>
            <input
              type="date"
              value={formData.expense_date}
              onChange={(e) => handleInputChange('expense_date', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `1px solid ${errors.expense_date ? brandColors.error[300] : brandColors.neutral[300]}`,
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

          {/* Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '0.5rem'
            }}>
              <StickyNote size={16} />
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional details about this expense..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '12px',
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

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => navigate('/invoices')}
              disabled={loading}
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: 'transparent',
                color: brandColors.neutral[600],
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                  e.currentTarget.style.borderColor = brandColors.neutral[400]
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = brandColors.neutral[300]
                }
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={() => handleSave('spent')}
              disabled={loading}
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = brandColors.primary[700]
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = brandColors.primary[600]
                }
              }}
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
