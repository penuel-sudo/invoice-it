import { useEffect, useMemo, useState } from 'react'
import { X, Clock, Loader2, SlidersHorizontal, Sliders } from 'lucide-react'
import toast from 'react-hot-toast'
import { brandColors } from '../../stylings'
import {
  DEFAULT_AUTO_REMINDER_SETTINGS,
  DEFAULT_INVOICE_REMINDER_OVERRIDE,
  REMINDER_SCHEDULE_OPTIONS,
  REMINDER_TONE_PRESETS,
  type AutoReminderSettingsData,
  type InvoiceReminderOverrideData,
  type ReminderScheduleKey,
  type ReminderToneKey
} from '../../types/autoReminders'
import {
  deleteInvoiceReminderOverride,
  fetchAutoReminderSettings,
  fetchInvoiceReminderOverride,
  saveInvoiceReminderOverride
} from '../../services/autoReminderService'

interface AutoReminderInvoiceModalProps {
  isOpen: boolean
  invoiceId: string
  invoiceNumber?: string
  userId: string
  onClose: () => void
  onOpenSettings: () => void
}

type OverrideFormState = InvoiceReminderOverrideData

export default function AutoReminderInvoiceModal({
  isOpen,
  invoiceId,
  invoiceNumber,
  userId,
  onClose,
  onOpenSettings
}: AutoReminderInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [defaults, setDefaults] = useState<AutoReminderSettingsData>(DEFAULT_AUTO_REMINDER_SETTINGS)
  const [initialOverride, setInitialOverride] = useState<InvoiceReminderOverrideData | null>(null)
  const [useDefaults, setUseDefaults] = useState(true)
  const [overrideState, setOverrideState] =
    useState<OverrideFormState>(DEFAULT_INVOICE_REMINDER_OVERRIDE)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      const [settings, override] = await Promise.all([
        fetchAutoReminderSettings(userId),
        fetchInvoiceReminderOverride(invoiceId)
      ])

      setDefaults(settings)
      setInitialOverride(override)
      setUseDefaults(!override)
      setOverrideState(
        override ?? {
          remindersEnabled: settings.enabled,
          schedule: settings.schedule,
          tone: settings.tone,
          attachPdf: settings.attachPdf
        }
      )
    } catch (error) {
      console.error('Failed to load reminder details', error)
      toast.error('Unable to load reminder preferences')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const defaultsSummary = useMemo(() => {
    const scheduleLabels = defaults.schedule
      .map((key) => {
        const option = REMINDER_SCHEDULE_OPTIONS.find((opt) => opt.key === key)
        return option ? option.label : key
      })
      .join(' • ')

    return {
      schedule: scheduleLabels || 'No reminders scheduled',
      tone: REMINDER_TONE_PRESETS[defaults.tone]?.label || 'Friendly',
      attach: defaults.attachPdf
    }
  }, [defaults])

  const currentSummary = useMemo(() => {
    const scheduleLabels = overrideState.schedule
      .map((key) => {
        const option = REMINDER_SCHEDULE_OPTIONS.find((opt) => opt.key === key)
        return option ? option.label : key
      })
      .join(' • ')

    return {
      schedule: scheduleLabels || 'No reminders scheduled',
      tone: REMINDER_TONE_PRESETS[overrideState.tone]?.label || 'Friendly',
      attach: overrideState.attachPdf
    }
  }, [overrideState])

  const currentOverride = useDefaults ? null : overrideState

  const hasChanges =
    JSON.stringify(currentOverride) !== JSON.stringify(initialOverride ?? null)

  const handleScheduleToggle = (key: ReminderScheduleKey) => {
    setOverrideState((prev) => {
      const exists = prev.schedule.includes(key)
      const updated = exists
        ? prev.schedule.filter((item) => item !== key)
        : [...prev.schedule, key]
      return {
        ...prev,
        schedule: updated
      }
    })
  }

  const handleToneSelect = (tone: ReminderToneKey) => {
    setOverrideState((prev) => ({
      ...prev,
      tone
    }))
  }

  const handleSave = async () => {
    if (saving) return

    if (!useDefaults && overrideState.remindersEnabled && overrideState.schedule.length === 0) {
      toast.error('Select at least one reminder timing or disable reminders for this invoice.')
      return
    }

    setSaving(true)
    try {
      if (useDefaults) {
        await deleteInvoiceReminderOverride(invoiceId)
        setInitialOverride(null)
      } else {
        await saveInvoiceReminderOverride(invoiceId, overrideState)
        setInitialOverride(overrideState)
      }
      toast.success('Auto reminder preferences updated')
      onClose()
    } catch (error: any) {
      console.error('Failed to save invoice reminder override', error)
      toast.error(error.message || 'Failed to save reminder preferences')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 11000,
        padding: '1rem'
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: brandColors.white,
          borderRadius: '18px',
          boxShadow: '0 24px 48px rgba(15, 118, 110, 0.18)'
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            borderBottom: `1px solid ${brandColors.neutral[200]}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: brandColors.primary[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Clock size={18} color={brandColors.primary[600]} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: brandColors.neutral[900]
                }}
              >
                Auto Reminders
              </h2>
              {invoiceNumber && (
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.85rem',
                    color: brandColors.neutral[500]
                  }}
                >
                  Invoice {invoiceNumber}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '10px',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
              opacity: saving ? 0.6 : 1
            }}
            onMouseEnter={(event) => {
              if (saving) return
              event.currentTarget.style.backgroundColor = brandColors.neutral[100]
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
            disabled={saving}
          >
            <X size={20} color={brandColors.neutral[600]} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 0',
                gap: '0.75rem',
                color: brandColors.neutral[500]
              }}
            >
              <Loader2 size={32} className="animate-spin" />
              <span style={{ fontSize: '0.9rem' }}>Loading reminder details…</span>
            </div>
          ) : (
            <>
              <section
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: `1px solid ${brandColors.neutral[200]}`,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  backgroundColor: brandColors.neutral[50]
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: brandColors.neutral[900]
                      }}
                    >
                      Use workspace defaults
                    </h3>
                    <p
                      style={{
                        margin: '0.35rem 0 0 0',
                        fontSize: '0.85rem',
                        color: brandColors.neutral[600],
                        maxWidth: '420px'
                      }}
                    >
                      {defaults.enabled
                        ? 'Keep this invoice following your workspace reminder schedule.'
                        : 'Workspace reminders are currently off. Turn them on in settings to use defaults.'}
                    </p>
                  </div>
                  <label
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '56px',
                      height: '30px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={useDefaults}
                      onChange={(event) => {
                        const next = event.target.checked
                        setUseDefaults(next)
                        if (!next && !initialOverride) {
                          setOverrideState({
                            remindersEnabled: defaults.enabled,
                            schedule: defaults.schedule,
                            tone: defaults.tone,
                            attachPdf: defaults.attachPdf
                          })
                        }
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: useDefaults ? brandColors.primary[500] : brandColors.neutral[300],
                        borderRadius: '30px',
                        transition: '0.3s'
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          height: '22px',
                          width: '22px',
                          left: useDefaults ? '30px' : '4px',
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  <SummaryCard
                    label="Schedule"
                    value={useDefaults ? defaultsSummary.schedule : currentSummary.schedule}
                  />
                  <SummaryCard
                    label="Tone"
                    value={useDefaults ? defaultsSummary.tone : currentSummary.tone}
                  />
                  <SummaryCard
                    label="Attachment"
                    value={
                      (useDefaults ? defaultsSummary.attach : currentSummary.attach)
                        ? 'PDF attached'
                        : 'No attachment'
                    }
                  />
                </div>

                {!defaults.enabled && useDefaults && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: brandColors.warning[600],
                      backgroundColor: brandColors.warning[50],
                      border: `1px solid ${brandColors.warning[200]}`,
                      borderRadius: '10px',
                      padding: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    Workspace reminders are currently disabled.
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: brandColors.primary[600],
                        color: brandColors.white,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Open settings
                    </button>
                  </div>
                )}
              </section>

              {!useDefaults && (
                <section
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    border: `1px solid ${brandColors.neutral[200]}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: brandColors.white
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: brandColors.neutral[900]
                        }}
                      >
                        Custom reminder rules
                      </h3>
                      <p
                        style={{
                          margin: '0.35rem 0 0 0',
                          fontSize: '0.85rem',
                          color: brandColors.neutral[600]
                        }}
                      >
                        Tailor the timing and tone just for this invoice.
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '9999px',
                        backgroundColor: brandColors.primary[50],
                        color: brandColors.primary[700],
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      <SlidersHorizontal size={14} />
                      Custom override
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      borderRadius: '14px',
                      padding: '1rem',
                      backgroundColor: brandColors.neutral[50]
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: brandColors.neutral[800]
                          }}
                        >
                          Reminders enabled
                        </div>
                        <p
                          style={{
                            margin: '0.25rem 0 0 0',
                            fontSize: '0.8rem',
                            color: brandColors.neutral[600]
                          }}
                        >
                          Turn off to skip reminders for this invoice only.
                        </p>
                      </div>
                      <label
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '56px',
                          height: '30px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={overrideState.remindersEnabled}
                          onChange={(event) =>
                            setOverrideState((prev) => ({
                              ...prev,
                              remindersEnabled: event.target.checked
                            }))
                          }
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: overrideState.remindersEnabled
                              ? brandColors.success[500]
                              : brandColors.neutral[300],
                            borderRadius: '30px',
                            transition: '0.3s'
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              height: '22px',
                              width: '22px',
                              left: overrideState.remindersEnabled ? '30px' : '4px',
                              bottom: '4px',
                              backgroundColor: brandColors.white,
                              borderRadius: '50%',
                              transition: '0.3s'
                            }}
                          />
                        </span>
                      </label>
                    </div>

                    {overrideState.remindersEnabled && overrideState.schedule.length === 0 && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: brandColors.error[600],
                          backgroundColor: brandColors.error[50],
                          border: `1px solid ${brandColors.error[200]}`,
                          borderRadius: '10px',
                          padding: '0.75rem'
                        }}
                      >
                        Select at least one reminder timing.
                      </div>
                    )}
                  </div>

                  {overrideState.remindersEnabled && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              color: brandColors.neutral[900]
                            }}
                          >
                            Reminder timing
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: brandColors.neutral[500] }}>
                            Choose one or multiple
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {REMINDER_SCHEDULE_OPTIONS.map((option) => {
                            const checked = overrideState.schedule.includes(option.key)
                            return (
                              <label
                                key={option.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.75rem',
                                  padding: '0.85rem 1rem',
                                  borderRadius: '12px',
                                  border: `1px solid ${
                                    checked ? brandColors.primary[300] : brandColors.neutral[200]
                                  }`,
                                  backgroundColor: checked ? brandColors.primary[50] : brandColors.white,
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleScheduleToggle(option.key)}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    marginTop: '0.2rem',
                                    accentColor: brandColors.primary[600],
                                    cursor: 'pointer'
                                  }}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontSize: '0.9rem',
                                      fontWeight: 600,
                                      color: brandColors.neutral[900]
                                    }}
                                  >
                                    {option.label}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: '0.25rem',
                                      fontSize: '0.8rem',
                                      color: brandColors.neutral[600]
                                    }}
                                  >
                                    {option.description}
                                  </div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              color: brandColors.neutral[900]
                            }}
                          >
                            Email tone
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: brandColors.neutral[500] }}>
                            Applies to all reminders
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '0.75rem'
                          }}
                        >
                          {Object.entries(REMINDER_TONE_PRESETS).map(([key, preset]) => {
                            const selected = overrideState.tone === key
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleToneSelect(key as ReminderToneKey)}
                                style={{
                                  borderRadius: '12px',
                                  padding: '0.9rem',
                                  border: selected
                                    ? `2px solid ${brandColors.primary[500]}`
                                    : `1px solid ${brandColors.neutral[200]}`,
                                  backgroundColor: selected ? brandColors.primary[50] : brandColors.white,
                                  color: brandColors.neutral[800],
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div style={{ marginBottom: '0.35rem' }}>{preset.label}</div>
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: brandColors.neutral[500],
                                    fontWeight: 400,
                                    lineHeight: 1.4
                                  }}
                                >
                                  {preset.subject.replace('{{invoiceNumber}}', '#INV-1024')}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: `1px solid ${brandColors.neutral[200]}`,
                      backgroundColor: brandColors.neutral[50],
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={overrideState.attachPdf}
                      onChange={(event) =>
                        setOverrideState((prev) => ({
                          ...prev,
                          attachPdf: event.target.checked
                        }))
                      }
                      style={{
                        width: '18px',
                        height: '18px',
                        marginTop: '0.2rem',
                        accentColor: brandColors.primary[600]
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: brandColors.neutral[900]
                        }}
                      >
                        Attach invoice PDF to reminder emails
                      </div>
                      <div
                        style={{
                          marginTop: '0.35rem',
                          fontSize: '0.8rem',
                          color: brandColors.neutral[600]
                        }}
                      >
                        Clients can still use the “View” or “Pay now” buttons—this only adds the PDF as an
                        optional download.
                      </div>
                    </div>
                  </label>
                </section>
              )}
            </>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderTop: `1px solid ${brandColors.neutral[200]}`
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (!saving) {
                onOpenSettings()
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.1rem',
              borderRadius: '10px',
              border: `1px solid ${brandColors.primary[200]}`,
              backgroundColor: brandColors.primary[50],
              color: brandColors.primary[700],
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
            disabled={saving}
          >
            <Sliders size={15} />
            Edit defaults
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                border: `1px solid ${brandColors.neutral[300]}`,
                backgroundColor: brandColors.white,
                color: brandColors.neutral[600],
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor:
                  saving || !hasChanges
                    ? brandColors.neutral[300]
                    : brandColors.primary[600],
                color: brandColors.white,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s ease'
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving…
                </>
              ) : (
                'Save preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: string
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div
      style={{
        padding: '0.85rem 1rem',
        borderRadius: '12px',
        border: `1px solid ${brandColors.neutral[200]}`,
        backgroundColor: brandColors.white,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem'
      }}
    >
      <span style={{ fontSize: '0.75rem', color: brandColors.neutral[500], textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: brandColors.neutral[800] }}>{value}</span>
    </div>
  )
}

