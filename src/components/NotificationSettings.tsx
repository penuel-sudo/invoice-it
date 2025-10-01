import { brandColors } from '../stylings'

interface NotificationPreferences {
  enabled: boolean
  push_enabled: boolean
  email_enabled: boolean
  invoice_sent: boolean
  payment_received: boolean
  payment_overdue: boolean
  invoice_created: boolean
  status_changed: boolean
}

interface NotificationSettingsProps {
  preferences: NotificationPreferences
  onChange: (preferences: NotificationPreferences) => void
}

export default function NotificationSettings({ preferences, onChange }: NotificationSettingsProps) {
  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] }
    onChange(newPrefs)
  }

  const ToggleSwitch = ({ checked, disabled, onClick }: { checked: boolean; disabled?: boolean; onClick: () => void }) => (
    <label style={{
      position: 'relative',
      display: 'inline-block',
      width: '44px',
      height: '24px',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onClick}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: 'absolute',
        cursor: disabled ? 'not-allowed' : 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked ? brandColors.primary[600] : brandColors.neutral[300],
        transition: '0.3s',
        borderRadius: '24px'
      }}>
        <span style={{
          position: 'absolute',
          content: '',
          height: '16px',
          width: '16px',
          left: checked ? '24px' : '4px',
          bottom: '4px',
          backgroundColor: 'white',
          transition: '0.3s',
          borderRadius: '50%'
        }} />
      </span>
    </label>
  )

  const MasterToggle = () => (
    <label style={{
      position: 'relative',
      display: 'inline-block',
      width: '52px',
      height: '28px',
      cursor: 'pointer'
    }}>
      <input
        type="checkbox"
        checked={preferences.enabled}
        onChange={() => handleToggle('enabled')}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: preferences.enabled ? brandColors.primary[600] : brandColors.neutral[300],
        transition: '0.3s',
        borderRadius: '28px'
      }}>
        <span style={{
          position: 'absolute',
          content: '',
          height: '20px',
          width: '20px',
          left: preferences.enabled ? '28px' : '4px',
          bottom: '4px',
          backgroundColor: 'white',
          transition: '0.3s',
          borderRadius: '50%'
        }} />
      </span>
    </label>
  )

  const notificationTypes = [
    { key: 'invoice_sent' as const, label: 'Invoice Sent', desc: 'When an invoice is sent to a client' },
    { key: 'payment_received' as const, label: 'Payment Received', desc: 'When a payment is received' },
    { key: 'payment_overdue' as const, label: 'Payment Overdue', desc: 'When an invoice becomes overdue' },
    { key: 'invoice_created' as const, label: 'Invoice Created', desc: 'When a new invoice is created' },
    { key: 'status_changed' as const, label: 'Status Changed', desc: 'When invoice status changes' }
  ]

  return (
    <div>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: brandColors.neutral[900],
        marginBottom: '0.5rem'
      }}>
        Notification Settings
      </h2>
      <p style={{
        fontSize: '0.875rem',
        color: brandColors.neutral[600],
        marginBottom: '2rem'
      }}>
        Control how and when you receive notifications
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Master Toggle */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: brandColors.primary[50],
          borderRadius: '12px',
          border: `2px solid ${brandColors.primary[200]}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: '0 0 0.25rem 0'
              }}>
                Enable Notifications
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[600],
                margin: 0
              }}>
                Turn all notifications on or off
              </p>
            </div>
            <MasterToggle />
          </div>
        </div>

        {/* Notification Channels */}
        <div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            marginBottom: '1rem'
          }}>
            Notification Channels
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Push Notifications */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: brandColors.neutral[50],
              borderRadius: '8px',
              opacity: preferences.enabled ? 1 : 0.5
            }}>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.25rem 0'
                }}>
                  Push Notifications
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  margin: 0
                }}>
                  Receive browser notifications
                </p>
              </div>
              <ToggleSwitch 
                checked={preferences.push_enabled} 
                disabled={!preferences.enabled}
                onClick={() => handleToggle('push_enabled')}
              />
            </div>

            {/* Email Notifications */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: brandColors.neutral[50],
              borderRadius: '8px',
              opacity: preferences.enabled ? 1 : 0.5
            }}>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[900],
                  margin: '0 0 0.25rem 0'
                }}>
                  Email Notifications
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  margin: 0
                }}>
                  Receive notifications via email
                </p>
              </div>
              <ToggleSwitch 
                checked={preferences.email_enabled} 
                disabled={!preferences.enabled}
                onClick={() => handleToggle('email_enabled')}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: brandColors.neutral[900],
            marginBottom: '1rem'
          }}>
            Notification Types
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notificationTypes.map((item) => (
              <div key={item.key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: brandColors.white,
                border: `1px solid ${brandColors.neutral[200]}`,
                borderRadius: '8px',
                opacity: preferences.enabled ? 1 : 0.5
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: brandColors.neutral[900],
                    margin: '0 0 0.25rem 0'
                  }}>
                    {item.label}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: brandColors.neutral[600],
                    margin: 0
                  }}>
                    {item.desc}
                  </p>
                </div>
                <ToggleSwitch 
                  checked={preferences[item.key]} 
                  disabled={!preferences.enabled}
                  onClick={() => handleToggle(item.key)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

