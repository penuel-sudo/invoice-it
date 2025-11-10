import { supabase } from '../lib/supabaseClient'
import {
  AutoReminderSettingsData,
  DEFAULT_AUTO_REMINDER_SETTINGS,
  REMINDER_SCHEDULE_SEQUENCE,
  normalizeReminderSchedule,
  type ReminderScheduleKey,
  type InvoiceReminderOverrideData
} from '../types/autoReminders'

const TABLE_NAME = 'auto_reminder_settings'

interface SettingsRow {
  user_id: string
  settings: AutoReminderSettingsData
  updated_at: string
}

export async function fetchAutoReminderSettings(userId: string): Promise<AutoReminderSettingsData> {
  const { data, error } = await supabase
    .from<SettingsRow>(TABLE_NAME)
    .select('settings')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings row yet – return defaults
      return DEFAULT_AUTO_REMINDER_SETTINGS
    }
    console.error('[AutoReminderService] Failed to load settings', error)
    throw error
  }

  if (!data?.settings) {
    return DEFAULT_AUTO_REMINDER_SETTINGS
  }

  const normalizedSchedule = normalizeReminderSchedule(
    Array.isArray(data.settings.schedule) ? data.settings.schedule : []
  )

  return {
    ...DEFAULT_AUTO_REMINDER_SETTINGS,
    ...data.settings,
    schedule: normalizedSchedule.length
      ? normalizedSchedule
      : DEFAULT_AUTO_REMINDER_SETTINGS.schedule
  }
}

export async function saveAutoReminderSettings(userId: string, settings: AutoReminderSettingsData) {
  const scheduleSet = new Set<ReminderScheduleKey>(settings.schedule as ReminderScheduleKey[])
  const normalizedSchedule = REMINDER_SCHEDULE_SEQUENCE.filter((key) => scheduleSet.has(key))

  const payload: SettingsRow = {
    user_id: userId,
    settings: {
      ...settings,
      schedule: normalizedSchedule.length ? normalizedSchedule : DEFAULT_AUTO_REMINDER_SETTINGS.schedule
    },
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    console.error('[AutoReminderService] Failed to save settings', error)
    throw error
  }
}

interface InvoiceReminderOverrideRow {
  invoice_id: string
  use_workspace_defaults: boolean | null
  reminders_enabled: boolean | null
  schedule: ReminderScheduleKey[] | null
  tone: string | null
  attach_pdf: boolean | null
  created_at?: string
  updated_at?: string
}

const OVERRIDES_TABLE = 'invoice_reminder_overrides'

export async function fetchInvoiceReminderOverride(
  invoiceId: string
): Promise<InvoiceReminderOverrideData | null> {
  const { data, error } = await supabase
    .from<InvoiceReminderOverrideRow>(OVERRIDES_TABLE)
    .select('*')
    .eq('invoice_id', invoiceId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[AutoReminderService] Failed to load invoice override', error)
    throw error
  }

  if (!data || data.use_workspace_defaults) {
    return null
  }

  const schedule = normalizeReminderSchedule(data.schedule || [])

  return {
    remindersEnabled: data.reminders_enabled ?? true,
    schedule: schedule.length ? schedule : DEFAULT_AUTO_REMINDER_SETTINGS.schedule,
    tone: (data.tone as any) || DEFAULT_AUTO_REMINDER_SETTINGS.tone,
    attachPdf: data.attach_pdf ?? false
  }
}

export async function saveInvoiceReminderOverride(
  invoiceId: string,
  override: InvoiceReminderOverrideData
) {
  const normalizedSchedule = normalizeReminderSchedule(override.schedule)

  const { error } = await supabase.from(OVERRIDES_TABLE).upsert(
    {
      invoice_id: invoiceId,
      use_workspace_defaults: false,
      reminders_enabled: override.remindersEnabled,
      schedule: normalizedSchedule,
      tone: override.tone,
      attach_pdf: override.attachPdf,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'invoice_id' }
  )

  if (error) {
    console.error('[AutoReminderService] Failed to save invoice override', error)
    throw error
  }
}

export async function deleteInvoiceReminderOverride(invoiceId: string) {
  const { error } = await supabase.from(OVERRIDES_TABLE).delete().eq('invoice_id', invoiceId)

  if (error) {
    console.error('[AutoReminderService] Failed to delete invoice override', error)
    throw error
  }
}

