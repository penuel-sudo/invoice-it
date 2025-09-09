import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { invoiceStorage } from '../lib/storage/invoiceStorage'
import type { InvoiceFormData, InvoiceItem } from '../lib/storage/invoiceStorage'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2,
  Calendar,
  User,
  Mail,
  MapPin,
  FileText,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'


export default function InvoiceCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Initialize form data from location state or localStorage
  const getInitialFormData = (): InvoiceFormData => {
    if (location.state?.invoiceData) {
      return location.state.invoiceData
    }
    
    return invoiceStorage.getDraftWithFallback()
  }
  
  const [formData, setFormData] = useState<InvoiceFormData>(getInitialFormData())

  const [isSaving, setIsSaving] = useState(false)

  // Calculate totals whenever items change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.lineTotal, 0)
    const taxTotal = formData.items.reduce((sum, item) => sum + (item.lineTotal * item.taxRate / 100), 0)
    const grandTotal = subtotal + taxTotal

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxTotal,
      grandTotal
    }))
  }, [formData.items])

  // Auto-save form data to localStorage
  useEffect(() => {
    invoiceStorage.saveDraftDebounced(formData)
  }, [formData])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      lineTotal: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (id: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          // Recalculate line total
          updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleSave = async () => {
    if (!formData.clientName.trim()) {
      toast.error('Client name is required')
      return
    }

    if (formData.items.some(item => !item.description.trim())) {
      toast.error('All items must have a description')
      return
    }

    setIsSaving(true)
    try {
      // TODO: Save to database
      console.log('Saving invoice:', formData)
      
      // Clear the draft from localStorage after successful save
      invoiceStorage.clearDraft()
      
      toast.success('Invoice saved successfully!')
    } catch (error) {
      toast.error('Failed to save invoice')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    if (!formData.clientName.trim()) {
      toast.error('Client name is required')
      return
    }

    if (formData.items.some(item => !item.description.trim())) {
      toast.error('All items must have a description')
      return
    }

    // Navigate to preview with form data
    navigate('/invoice/preview', { 
      state: { invoiceData: formData } 
    })
  }

  if (!user) { return null }

  return (
    <Layout>
      <div style={{
        paddingBottom: '4rem',
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
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderBottom: `1px solid ${brandColors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              New Invoice
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.neutral[100],
                color: brandColors.neutral[600],
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={handlePreview}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: brandColors.primary[600],
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div style={{ padding: '1rem' }}>
          {/* Client Information Card */}
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
              <User size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Client Information
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
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Enter client name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Address
                </label>
                <textarea
                  value={formData.clientAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                  placeholder="Enter client address"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900],
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Invoice Details Card */}
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
              <FileText size={20} color={brandColors.primary[600]} />
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Invoice Details
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
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: brandColors.white,
                    color: brandColors.neutral[900]
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: brandColors.white,
                      color: brandColors.neutral[900],
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[700],
                    marginBottom: '0.5rem'
                  }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: brandColors.white,
                      color: brandColors.neutral[900],
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Card */}
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
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color={brandColors.primary[600]} />
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900],
                  margin: 0
                }}>
                  Line Items
                </h2>
              </div>
              
              <button
                onClick={addItem}
                style={{
                  padding: '0.5rem',
                  backgroundColor: brandColors.primary[100],
                  color: brandColors.primary[600],
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.items.map((item, index) => (
                <div key={item.id} style={{
                  padding: '1rem',
                  backgroundColor: brandColors.neutral[50],
                  borderRadius: '12px',
                  border: `1px solid ${brandColors.neutral[200]}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[700]
                    }}>
                      Item {index + 1}
                    </span>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} color={brandColors.error[500]} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: brandColors.neutral[600],
                        marginBottom: '0.25rem'
                      }}>
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Enter item description"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${brandColors.neutral[200]}`,
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          backgroundColor: brandColors.white,
                          color: brandColors.neutral[900]
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: brandColors.neutral[600],
                          marginBottom: '0.25rem'
                        }}>
                          Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            backgroundColor: brandColors.white,
                            color: brandColors.neutral[900]
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: brandColors.neutral[600],
                          marginBottom: '0.25rem'
                        }}>
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            backgroundColor: brandColors.white,
                            color: brandColors.neutral[900]
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: brandColors.neutral[600],
                          marginBottom: '0.25rem'
                        }}>
                          Tax %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e) => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${brandColors.neutral[200]}`,
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            backgroundColor: brandColors.white,
                            color: brandColors.neutral[900]
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      paddingTop: '0.5rem',
                      borderTop: `1px solid ${brandColors.neutral[200]}`
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900]
                      }}>
                        Subtotal: ${item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
              Notes / Terms
            </h2>
            
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter payment terms or additional notes..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[200]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: brandColors.white,
                color: brandColors.neutral[900],
                resize: 'vertical'
              }}
            />
          </div>

          {/* Summary Card */}
          <div style={{
            backgroundColor: brandColors.white,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: brandColors.neutral[900],
              margin: '0 0 1rem 0'
            }}>
              Summary
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600]
                }}>
                  Subtotal
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[900]
                }}>
                  ${formData.subtotal.toFixed(2)}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: brandColors.neutral[600]
                }}>
                  Tax
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[900]
                }}>
                  ${formData.taxTotal.toFixed(2)}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: `1px solid ${brandColors.neutral[200]}`
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: brandColors.neutral[900]
                }}>
                  Total
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: brandColors.primary[600]
                }}>
                  ${formData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
