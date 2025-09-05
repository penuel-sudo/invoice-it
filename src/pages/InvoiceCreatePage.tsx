import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react'
import { Layout } from '../components/layout'
import { Button, Input, Label, Textarea } from '../components/ui'
import { useInvoiceStore } from '../store'
import { brandColors, typographyPresets } from '../stylings'
import toast from 'react-hot-toast'

// Helper function to convert typography presets to inline styles
const getTypographyStyle = (preset: any) => ({
  fontSize: typeof preset.fontSize === 'string' ? preset.fontSize : (Array.isArray(preset.fontSize) ? preset.fontSize[0] : '1rem'),
  fontWeight: preset.fontWeight,
  lineHeight: preset.lineHeight,
  letterSpacing: preset.letterSpacing,
})

export default function InvoiceCreatePage() {
  const navigate = useNavigate()
  const { 
    formData, 
    setFormData, 
    addFormItem, 
    updateFormItem, 
    removeFormItem, 
    calculateTotals, 
    generateInvoiceNumber,
    isFormValid,
    resetForm
  } = useInvoiceStore()
  
  const [activeSection, setActiveSection] = useState('client')

  useEffect(() => {
    // Initialize form with generated invoice number
    if (!formData.invoiceNumber) {
      setFormData({ invoiceNumber: generateInvoiceNumber() })
    }
  }, [])

  useEffect(() => {
    // Recalculate totals when items change
    calculateTotals()
  }, [formData.items, calculateTotals])

  const handleInputChange = (field: string, value: string) => {
    setFormData({ [field]: value })
  }

  const handleItemChange = (id: string, field: string, value: string | number) => {
    const updates = { [field]: value }
    
    // Auto-calculate item total
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = formData.items.find(item => item.id === id)
      if (item) {
        const quantity = field === 'quantity' ? value as number : item.quantity
        const unitPrice = field === 'unitPrice' ? value as number : item.unitPrice
        const taxRate = field === 'taxRate' ? value as number : item.taxRate
        
        updates.total = quantity * unitPrice
      }
    }
    
    updateFormItem(id, updates)
  }

  const handleSaveDraft = async () => {
    try {
      // TODO: Save to Supabase
      toast.success('Invoice saved as draft')
    } catch (error) {
      toast.error('Failed to save invoice')
    }
  }

  const handlePreview = () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields')
      return
    }
    // TODO: Navigate to preview page
    toast.success('Preview functionality coming soon')
  }

  const handleSaveAndSend = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      // TODO: Save and send invoice
      toast.success('Invoice saved and sent')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Failed to save and send invoice')
    }
  }

  return (
    <Layout>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingBottom: '6rem' // Space for sticky buttons
      }}>
        {/* Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          border: `1px solid ${brandColors.neutral[200]}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: brandColors.neutral[600],
                borderRadius: '8px'
              }}
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 style={{
              ...getTypographyStyle(typographyPresets.h2),
              color: brandColors.neutral[900],
              margin: 0,
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              New Invoice
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: `1px solid ${brandColors.neutral[300]}`,
                color: brandColors.neutral[700],
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Save size={16} />
              Save Draft
            </Button>
            
            <Button
              onClick={handlePreview}
              disabled={!isFormValid()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isFormValid() ? brandColors.primary[600] : brandColors.neutral[300],
                color: isFormValid() ? brandColors.white : brandColors.neutral[500],
                border: 'none',
                borderRadius: '8px',
                cursor: isFormValid() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Eye size={16} />
              Preview
            </Button>
          </div>
        </div>

        {/* Form Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Client Information */}
          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              ...getTypographyStyle(typographyPresets.h3),
              color: brandColors.neutral[900],
              margin: '0 0 1.5rem',
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              1. Client Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <Label htmlFor="clientName" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Client Name *
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Enter client name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="clientEmail" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Client Email
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  placeholder="client@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="clientAddress" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Client Address
                </Label>
                <Textarea
                  id="clientAddress"
                  value={formData.clientAddress}
                  onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                  placeholder="Enter client address"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              ...getTypographyStyle(typographyPresets.h3),
              color: brandColors.neutral[900],
              margin: '0 0 1.5rem',
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              2. Invoice Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <Label htmlFor="invoiceNumber" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Invoice Number
                </Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="invoiceDate" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Invoice Date
                </Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                ...getTypographyStyle(typographyPresets.h3),
                color: brandColors.neutral[900],
                margin: 0,
                fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
              }}>
                3. Line Items
              </h3>
              
              <Button
                onClick={addFormItem}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: brandColors.primary[600],
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '14px'
                }}
              >
                <Plus size={16} />
                Add Item
              </Button>
            </div>
            
            {formData.items.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: brandColors.neutral[500]
              }}>
                <p style={{
                  ...getTypographyStyle(typographyPresets.body),
                  margin: 0
                }}>
                  No items added yet. Click "Add Item" to get started.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.items.map((item, index) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                    gap: '1rem',
                    alignItems: 'end',
                    padding: '1rem',
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '8px',
                    border: `1px solid ${brandColors.neutral[200]}`
                  }}>
                    <div>
                      <Label style={{
                        ...getTypographyStyle(typographyPresets.bodySmall),
                        color: brandColors.neutral[700],
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>
                        Description *
                      </Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label style={{
                        ...getTypographyStyle(typographyPresets.bodySmall),
                        color: brandColors.neutral[700],
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>
                        Qty *
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label style={{
                        ...getTypographyStyle(typographyPresets.bodySmall),
                        color: brandColors.neutral[700],
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>
                        Unit Price *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label style={{
                        ...getTypographyStyle(typographyPresets.bodySmall),
                        color: brandColors.neutral[700],
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>
                        Tax %
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${brandColors.neutral[300]}`,
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label style={{
                        ...getTypographyStyle(typographyPresets.bodySmall),
                        color: brandColors.neutral[700],
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>
                        Total
                      </Label>
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: brandColors.neutral[100],
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: brandColors.neutral[700],
                        textAlign: 'center'
                      }}>
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => removeFormItem(item.id)}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: brandColors.error[50],
                        color: brandColors.error[600],
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Terms */}
          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              ...getTypographyStyle(typographyPresets.h3),
              color: brandColors.neutral[900],
              margin: '0 0 1.5rem',
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              4. Notes & Terms
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <Label htmlFor="notes" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or comments"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="terms" style={{
                  ...getTypographyStyle(typographyPresets.bodySmall),
                  color: brandColors.neutral[700],
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Payment Terms
                </Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.value)}
                  placeholder="Payment terms and conditions"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{
            backgroundColor: brandColors.white,
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: `1px solid ${brandColors.neutral[200]}`
          }}>
            <h3 style={{
              ...getTypographyStyle(typographyPresets.h3),
              color: brandColors.neutral[900],
              margin: '0 0 1.5rem',
              fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
            }}>
              5. Summary
            </h3>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: brandColors.primary[50],
              borderRadius: '8px',
              border: `1px solid ${brandColors.primary[200]}`
            }}>
              <div>
                <p style={{
                  ...getTypographyStyle(typographyPresets.body),
                  color: brandColors.neutral[600],
                  margin: '0 0 0.5rem'
                }}>
                  Subtotal: ${formData.subtotal.toFixed(2)}
                </p>
                <p style={{
                  ...getTypographyStyle(typographyPresets.body),
                  color: brandColors.neutral[600],
                  margin: 0
                }}>
                  Tax: ${formData.taxAmount.toFixed(2)}
                </p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  ...getTypographyStyle(typographyPresets.h2),
                  color: brandColors.primary[700],
                  margin: 0,
                  fontFamily: 'Space Grotesk, Plus Jakarta Sans, Inter, system-ui, sans-serif'
                }}>
                  Total: ${formData.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Buttons */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: brandColors.white,
          borderTop: `1px solid ${brandColors.neutral[200]}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          boxShadow: '0 -1px 3px 0 rgb(0 0 0 / 0.1)',
          zIndex: 40
        }}>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'transparent',
              border: `1px solid ${brandColors.neutral[300]}`,
              color: brandColors.neutral[700],
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <Save size={16} />
            Save Draft
          </Button>
          
          <Button
            onClick={handleSaveAndSend}
            disabled={!isFormValid()}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: isFormValid() ? brandColors.primary[600] : brandColors.neutral[300],
              color: isFormValid() ? brandColors.white : brandColors.neutral[500],
              border: 'none',
              borderRadius: '8px',
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <Eye size={16} />
            Save & Send
          </Button>
        </div>
      </div>
    </Layout>
  )
}
