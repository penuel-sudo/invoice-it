import { brandColors } from '../stylings'
import type {
  AutoReminderSettingsData,
  ReminderScheduleKey
} from '../types/autoReminders'
import {
  REMINDER_SCHEDULE_SHORT_LABELS,
  REMINDER_TONE_PRESETS
} from '../types/autoReminders'

interface InvoiceAutoReminderToggleProps {
  enabled: boolean
  onToggle: (value: boolean) => void
  defaults: AutoReminderSettingsData | null
  loading: boolean
  onOpenSettings: () => void
}

const scheduleLabel = (schedule: ReminderScheduleKey[]) => {
  if (!schedule.length) {
    return 'No reminders scheduled'
  }
  return schedule
    .map((key) => REMINDER_SCHEDULE_SHORT_LABELS[key] || key.replace(/_/g, ' '))
    .join(' • ')
}

export function InvoiceAutoReminderToggle({
  enabled,
  onToggle,
  defaults,
  loading,
  onOpenSettings
}: InvoiceAutoReminderToggleProps) {
  const toneKey = defaults?.tone || 'friendly'
  const tonePreset = REMINDER_TONE_PRESETS[toneKey]

  return (
    <div
      style={{
        backgroundColor: brandColors.white,
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: `1px solid ${brandColors.neutral[200]}`,
        boxShadow: '0 2px 8px rgba(15, 118, 110, 0.04)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: brandColors.neutral[900],
              margin: 0
            }}
          >
            Auto Reminders
          </h2>
          <p
            style={{
              margin: '0.4rem 0 0 0',
              color: brandColors.neutral[600],
              fontSize: '0.85rem',
              lineHeight: 1.5
            }}
          >
            Automatically nudge clients when invoices are due or overdue. This
            uses your workspace defaults unless you turn it off here.
          </p>
        </div>

        <label
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '52px',
            height: '28px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          <input
            type="checkbox"
            checked={enabled}
            disabled={loading}
            onChange={(event) => onToggle(event.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: enabled ? brandColors.primary[600] : brandColors.neutral[300],
              borderRadius: '28px',
              transition: '0.3s'
            }}
          >
            <span
              style={{
                position: 'absolute',
                height: '20px',
                width: '20px',
                left: enabled ? '28px' : '4px',
                bottom: '4px',
                backgroundColor: brandColors.white,
                borderRadius: '50%',
                transition: '0.3s'
              }}
            />
          </span>
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1rem'
        }}
      >
        <div
          style={{
            borderRadius: '12px',
            border: `1px solid ${brandColors.neutral[200]}`,
            backgroundColor: brandColors.neutral[50],
            padding: '1rem',
            opacity: enabled ? 1 : 0.65
          }}
        >
          {loading ? (
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: brandColors.neutral[600]
              }}
            >
              Loading reminder defaults…
            </p>
          ) : defaults?.enabled ? (
            <>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: brandColors.neutral[800],
                  marginBottom: '0.35rem'
                }}
              >
                Schedule
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: brandColors.neutral[600]
                }}
              >
                {scheduleLabel(defaults.schedule)}
              </p>

              <div
                style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9999px',
                    backgroundColor: brandColors.primary[50],
                    border: `1px solid ${brandColors.primary[200]}`,
                    color: brandColors.primary[700],
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  Tone: {tonePreset.label}
                </span>
                {defaults.attachPdf && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '9999px',
                      backgroundColor: brandColors.success[50],
                      border: `1px solid ${brandColors.success[200]}`,
                      color: brandColors.success[700],
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    PDF attached
                  </span>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: brandColors.neutral[600]
                }}
              >
                Reminders are currently off in workspace settings. Toggle them
                on in settings to use the defaults here.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            border: `1px solid ${brandColors.primary[300]}`,
            backgroundColor: brandColors.primary[50],
            color: brandColors.primary[700],
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Adjust workspace defaults
        </button>
      </div>
    </div>
  )
}


