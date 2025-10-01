import { useState } from 'react'
import { brandColors } from '../stylings'
import { Plus, Trash2, Star, Check, X, Building2, Globe, CreditCard, Coins, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PaymentMethod, PaymentMethodType } from '../lib/storage/invoiceStorage'

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[]
  onAdd: (method: PaymentMethod) => void
  onDelete: (methodId: string) => void
  onSetDefault: (methodId: string) => void
  onUpdate: (method: PaymentMethod) => void
}

const PAYMENT_METHOD_TYPES = [
  { value: 'bank_local_us' as const, label: 'Bank Transfer (US)', IconComponent: Building2 },
  { value: 'bank_local_ng' as const, label: 'Bank Transfer (Nigeria)', IconComponent: Building2 },
  { value: 'bank_international' as const, label: 'International Wire', IconComponent: Globe },
  { value: 'paypal' as const, label: 'PayPal', IconComponent: CreditCard },
  { value: 'crypto' as const, label: 'Cryptocurrency', IconComponent: Coins },
  { value: 'other' as const, label: 'Other', IconComponent: FileText },
]

export default function PaymentMethodManager({
  paymentMethods,
  onAdd,
  onDelete,
  onSetDefault,
  onUpdate
}: PaymentMethodManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('bank_local_us')
  const [formData, setFormData] = useState<any>({})
  const [methodLabel, setMethodLabel] = useState('')

  const handleAddMethod = () => {
    if (!methodLabel.trim()) {
      toast.error('Please enter a label for this payment method')
      return
    }

    // Validate required fields based on type
    const isValid = validateMethodDetails(selectedType, formData)
    if (!isValid) {
      return
    }

    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      type: selectedType,
      label: methodLabel,
      isDefault: paymentMethods.length === 0,
      details: formData
    }

    onAdd(newMethod)
    setIsAdding(false)
    setFormData({})
    setMethodLabel('')
    setSelectedType('bank_local_us')
    toast.success('Payment method added successfully!')
  }

  const validateMethodDetails = (type: PaymentMethodType, details: any): boolean => {
    switch (type) {
      case 'bank_local_us':
        if (!details.bankName || !details.accountName || !details.accountNumber || !details.routingNumber) {
          toast.error('Please fill in all required fields for US bank transfer')
          return false
        }
        return true
      case 'bank_local_ng':
        if (!details.bankName || !details.accountName || !details.accountNumber || !details.bankCode) {
          toast.error('Please fill in all required fields for Nigerian bank transfer')
          return false
        }
        return true
      case 'bank_international':
        if (!details.bankName || !details.accountName || !details.iban || !details.swiftCode || !details.bankAddress) {
          toast.error('Please fill in all required fields for international wire transfer')
          return false
        }
        return true
      case 'paypal':
        if (!details.email) {
          toast.error('Please enter PayPal email')
          return false
        }
        return true
      case 'crypto':
        if (!details.walletAddress || !details.network) {
          toast.error('Please enter wallet address and network')
          return false
        }
        return true
      case 'other':
        if (!details.instructions) {
          toast.error('Please enter payment instructions')
          return false
        }
        return true
      default:
        return true
    }
  }

  const renderFormFields = () => {
    switch (selectedType) {
      case 'bank_local_us':
        return (
          <>
            <input
              type="text"
              placeholder="Bank Name (e.g., Chase Bank)"
              value={formData.bankName || ''}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Account Name"
              value={formData.accountName || ''}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Account Number"
              value={formData.accountNumber || ''}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Routing Number (9 digits)"
              value={formData.routingNumber || ''}
              onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <select
              value={formData.accountType || 'checking'}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              <option value="checking">Checking Account</option>
              <option value="savings">Savings Account</option>
            </select>
          </>
        )

      case 'bank_local_ng':
        return (
          <>
            <input
              type="text"
              placeholder="Bank Name (e.g., GTBank)"
              value={formData.bankName || ''}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Account Name"
              value={formData.accountName || ''}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Account Number (10 digits)"
              value={formData.accountNumber || ''}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Bank Code (e.g., 058 for GTBank)"
              value={formData.bankCode || ''}
              onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </>
        )

      case 'bank_international':
        return (
          <>
            <input
              type="text"
              placeholder="Bank Name"
              value={formData.bankName || ''}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Account Name / Beneficiary"
              value={formData.accountName || ''}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="IBAN (e.g., GB29 NWBK 6016 1331 9268 19)"
              value={formData.iban || ''}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="SWIFT/BIC Code (e.g., CHASUS33)"
              value={formData.swiftCode || ''}
              onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Bank Address"
              value={formData.bankAddress || ''}
              onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Bank City"
                value={formData.bankCity || ''}
                onChange={(e) => setFormData({ ...formData, bankCity: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${brandColors.neutral[300]}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
              <input
                type="text"
                placeholder="Bank Country"
                value={formData.bankCountry || ''}
                onChange={(e) => setFormData({ ...formData, bankCountry: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${brandColors.neutral[300]}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </>
        )

      case 'paypal':
        return (
          <input
            type="email"
            placeholder="PayPal Email (e.g., payments@business.com)"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}
          />
        )

      case 'crypto':
        return (
          <>
            <input
              type="text"
              placeholder="Wallet Address"
              value={formData.walletAddress || ''}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            />
            <select
              value={formData.network || 'BTC'}
              onChange={(e) => setFormData({ ...formData, network: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="USDT">Tether (USDT)</option>
              <option value="USDC">USD Coin (USDC)</option>
            </select>
          </>
        )

      case 'other':
        return (
          <textarea
            placeholder="Enter payment instructions..."
            value={formData.instructions || ''}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${brandColors.neutral[300]}`,
              borderRadius: '8px',
              fontSize: '0.875rem',
              resize: 'vertical'
            }}
          />
        )
    }
  }

  const renderMethodDetails = (method: PaymentMethod) => {
    const details = method.details as any
    
    switch (method.type) {
      case 'bank_local_us':
        return (
          <div style={{ fontSize: '0.8rem', color: brandColors.neutral[600], lineHeight: '1.6' }}>
            <div>{details.bankName}</div>
            <div>{details.accountName} • {details.accountType}</div>
            <div>Acct: {details.accountNumber}</div>
            <div>Routing: {details.routingNumber}</div>
          </div>
        )
      case 'bank_local_ng':
        return (
          <div style={{ fontSize: '0.8rem', color: brandColors.neutral[600], lineHeight: '1.6' }}>
            <div>{details.bankName}</div>
            <div>{details.accountName}</div>
            <div>Acct: {details.accountNumber}</div>
            <div>Bank Code: {details.bankCode}</div>
          </div>
        )
      case 'bank_international':
        return (
          <div style={{ fontSize: '0.8rem', color: brandColors.neutral[600], lineHeight: '1.6' }}>
            <div>{details.bankName}</div>
            <div>{details.accountName}</div>
            <div>IBAN: {details.iban}</div>
            <div>SWIFT: {details.swiftCode}</div>
            <div>{details.bankCity}, {details.bankCountry}</div>
          </div>
        )
      case 'paypal':
        return (
          <div style={{ fontSize: '0.8rem', color: brandColors.neutral[600] }}>
            {details.email}
          </div>
        )
      case 'crypto':
        return (
          <div style={{ fontSize: '0.8rem', color: brandColors.neutral[600], lineHeight: '1.6' }}>
            <div>{details.network}</div>
            <div style={{ wordBreak: 'break-all' }}>{details.walletAddress}</div>
          </div>
        )
      case 'other':
        return (
          <div style={{ fontSize: '0.8rem', color: brandColors.neutral[600] }}>
            {details.instructions}
          </div>
        )
    }
  }

  return (
    <div>
      {/* Saved Payment Methods List */}
      {paymentMethods.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            marginBottom: '1rem'
          }}>
            Your Payment Methods
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                style={{
                  padding: '1rem',
                  backgroundColor: brandColors.neutral[50],
                  borderRadius: '12px',
                  border: `1px solid ${brandColors.neutral[200]}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {(() => {
                        const methodType = PAYMENT_METHOD_TYPES.find(t => t.value === method.type)
                        const Icon = methodType?.IconComponent
                        return Icon ? <Icon size={18} color={brandColors.primary[600]} /> : null
                      })()}
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900]
                      }}>
                        {method.label}
                      </span>
                      {method.isDefault && (
                        <span style={{
                          fontSize: '0.7rem',
                          backgroundColor: brandColors.primary[100],
                          color: brandColors.primary[700],
                          padding: '0.125rem 0.5rem',
                          borderRadius: '8px',
                          fontWeight: '600'
                        }}>
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {renderMethodDetails(method)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!method.isDefault && (
                      <button
                        onClick={() => {
                          onSetDefault(method.id)
                          toast.success('Default payment method updated')
                        }}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s ease'
                        }}
                        title="Set as default"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandColors.neutral[100]}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Star size={16} color={brandColors.neutral[400]} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(method.id)
                        toast.success('Payment method deleted')
                      }}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s ease'
                      }}
                      title="Delete"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandColors.error[50]}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={16} color={brandColors.error[500]} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Payment Method */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: brandColors.primary[50],
            border: `2px dashed ${brandColors.primary[300]}`,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: brandColors.primary[600],
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.primary[100]
            e.currentTarget.style.borderColor = brandColors.primary[400]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.primary[50]
            e.currentTarget.style.borderColor = brandColors.primary[300]
          }}
        >
          <Plus size={20} />
          Add Payment Method
        </button>
      ) : (
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          border: `2px solid ${brandColors.primary[300]}`,
          borderRadius: '12px'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            marginBottom: '1rem'
          }}>
            Add New Payment Method
          </h4>

          {/* Method Label */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '0.5rem'
            }}>
              Method Label (e.g., "My Business Bank Account")
            </label>
            <input
              type="text"
              value={methodLabel}
              onChange={(e) => setMethodLabel(e.target.value)}
              placeholder="Enter a label for this payment method"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Payment Type Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: brandColors.neutral[700],
              marginBottom: '0.5rem'
            }}>
              Payment Method Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as PaymentMethodType)
                setFormData({}) // Reset form when type changes
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {PAYMENT_METHOD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Form Fields Based on Type */}
          <div style={{ marginBottom: '1rem' }}>
            {renderFormFields()}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleAddMethod}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.primary[600],
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Check size={16} />
              Add Method
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setFormData({})
                setMethodLabel('')
              }}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                backgroundColor: brandColors.neutral[100],
                color: brandColors.neutral[700],
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

