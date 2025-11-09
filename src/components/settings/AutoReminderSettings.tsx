import { AutoReminderSettingsData, REMINDER_SCHEDULE_OPTIONS, REMINDER_TONE_PRESETS } from '../../types/autoReminders'
import { brandColors } from '../../stylings'

interface AutoReminderSettingsProps {
  settings: AutoReminderSettingsData
  onChange: (settings: AutoReminderSettingsData) => void
  onSave: () => Promise<void>
  saving: boolean
  hasChanges: boolean
}

export default function AutoReminderSettings({
  settings,
  onChange,
  onSave,
  saving,
  hasChanges
}: AutoReminderSettingsProps) {
  const currentTone = REMINDER_TONE_PRESETS[settings.tone]

  const handleToggle = (key: keyof AutoReminderSettingsData) => {
    onChange({
      ...settings,
      [key]: !settings[key]
    })
  }

  const handleScheduleToggle = (option: typeof REMINDER_SCHEDULE_OPTIONS[number]['key']) => {
    const exists = settings.schedule.includes(option)
    const updated = exists
      ? settings.schedule.filter(item => item !== option)
      : [...settings.schedule, option]

    onChange({
      ...settings,
      schedule: updated
    })
  }

  const handleToneChange = (toneKey: AutoReminderSettingsData['tone']) => {
    onChange({
      ...settings,
      tone: toneKey
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.5rem',
          borderRadius: '16px',
          border: `1px solid ${brandColors.neutral[200]}`,
          backgroundColor: brandColors.white
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: brandColors.neutral[900]
              }}
            >
              Auto Reminder Defaults
            </h2>
            <p
              style={{
                margin: '0.25rem 0 0 0',
                color: brandColors.neutral[600],
                fontSize: '0.875rem'
              }}
            >
              These settings apply to every invoice unless you turn reminders off for a specific one.
            </p>
          </div>
          <label
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '52px',
              height: '28px',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={() => handleToggle('enabled')}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.enabled ? brandColors.primary[600] : brandColors.neutral[300],
                borderRadius: '28px',
                transition: '0.3s'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  height: '20px',
                  width: '20px',
                  left: settings.enabled ? '28px' : '4px',
                  bottom: '4px',
                  backgroundColor: brandColors.white,
                  borderRadius: '50%',
                  transition: '0.3s'
                }}
              />
            </span>
          </label>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1.5rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          <section
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              backgroundColor: brandColors.white,
              opacity: settings.enabled ? 1 : 0.5,
              pointerEvents: settings.enabled ? 'auto' : 'none'
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 600,
                color: brandColors.neutral[900]
              }}
            >
              Reminder Timing
            </h3>
            <p
              style={{
                margin: '0.5rem 0 1rem 0',
                color: brandColors.neutral[600],
                fontSize: '0.875rem'
              }}
            >
              Choose when invoices should trigger reminder emails.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {REMINDER_SCHEDULE_OPTIONS.map(option => (
                <label
                  key={option.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1px solid ${
                      settings.schedule.includes(option.key) ? brandColors.primary[200] : brandColors.neutral[200]
                    }`,
                    backgroundColor: settings.schedule.includes(option.key)
                      ? brandColors.primary[50]
                      : brandColors.neutral[50],
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.schedule.includes(option.key)}
                    onChange={() => handleScheduleToggle(option.key)}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginTop: '0.25rem',
                      accentColor: brandColors.primary[600],
                      cursor: 'pointer'
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: brandColors.neutral[900],
                        marginBottom: '0.25rem'
                      }}
                    >
                      {option.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: brandColors.neutral[600]
                      }}
                    >
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {settings.schedule.length === 0 && (
              <p
                style={{
                  marginTop: '1rem',
                  backgroundColor: brandColors.error[50],
                  border: `1px solid ${brandColors.error[200]}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: brandColors.error[600]
                }}
              >
                Select at least one reminder timing.
              </p>
            )}
          </section>

          <section
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              backgroundColor: brandColors.white,
              opacity: settings.enabled ? 1 : 0.5,
              pointerEvents: settings.enabled ? 'auto' : 'none'
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 600,
                color: brandColors.neutral[900]
              }}
            >
              Email Tone
            </h3>
            <p
              style={{
                margin: '0.5rem 0 1rem 0',
                color: brandColors.neutral[600],
                fontSize: '0.875rem'
              }}
            >
              Pick the preset that matches how you want reminders to sound.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {Object.entries(REMINDER_TONE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleToneChange(key as AutoReminderSettingsData['tone'])}
                  type="button"
                  style={{
                    borderRadius: '12px',
                    padding: '1rem',
                    border: settings.tone === key
                      ? `2px solid ${brandColors.primary[500]}`
                      : `1px solid ${brandColors.neutral[200]}`,
                    backgroundColor: settings.tone === key ? brandColors.primary[50] : brandColors.neutral[50],
                    color: brandColors.neutral[900],
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <section
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              border: `1px solid ${brandColors.neutral[200]}`,
              backgroundColor: brandColors.white,
              opacity: settings.enabled ? 1 : 0.5,
              pointerEvents: settings.enabled ? 'auto' : 'none'
            }}
          >
            <label
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={settings.attachPdf}
                onChange={() => handleToggle('attachPdf')}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: brandColors.primary[600],
                  cursor: 'pointer'
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: brandColors.neutral[900]
                  }}
                >
                  Attach invoice PDF to reminder emails
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: brandColors.neutral[600],
                    marginTop: '0.25rem'
                  }}
                >
                  Keep clients in the email experience—optional links in the message will still let them view or pay online.
                </div>
              </div>
            </label>
          </section>
        </div>

        <aside
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: `1px solid ${brandColors.neutral[200]}`,
            backgroundColor: brandColors.white
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: brandColors.neutral[900]
                }}
              >
                Preview
              </h3>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  color: brandColors.neutral[500],
                  fontSize: '0.8rem'
                }}
              >
                Placeholders will be filled with the invoice number, amount due, and due status.
              </p>
            </div>

            <div
              style={{
                borderRadius: '12px',
                border: `1px solid ${brandColors.neutral[200]}`,
                backgroundColor: brandColors.neutral[50],
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: brandColors.primary[600]
                }}
              >
                {currentTone.subject.replace('{{invoiceNumber}}', '#INV-1024')}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: brandColors.neutral[700],
                  lineHeight: 1.6
                }}
              >
                {currentTone.intro
                  .replace('{{invoiceNumber}}', '#INV-1024')
                  .replace('{{amountDue}}', '$1,240.00')
                  .replace('{{statusTrigger}}', 'coming up soon')}
              </div>
              {currentTone.followUp && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: brandColors.neutral[600],
                    lineHeight: 1.6
                  }}
                >
                  {currentTone.followUp}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !hasChanges || (settings.enabled && settings.schedule.length === 0)}
          style={{
            padding: '0.875rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderRadius: '10px',
            border: 'none',
            cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
            backgroundColor:
              saving || !hasChanges || (settings.enabled && settings.schedule.length === 0)
                ? brandColors.neutral[300]
                : brandColors.primary[600],
            color: brandColors.white,
            transition: 'background-color 0.2s ease',
            minWidth: '160px'
          }}
        >
          {saving ? 'Saving...' : 'Save defaults'}
        </button>
      </div>
    </div>
  )
}

