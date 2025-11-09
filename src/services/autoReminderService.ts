import { supabase } from '../lib/supabaseClient'
import {
  AutoReminderSettingsData,
  DEFAULT_AUTO_REMINDER_SETTINGS,
  REMINDER_SCHEDULE_SEQUENCE,
  type ReminderScheduleKey
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

  const scheduleFromDb = Array.isArray(data.settings.schedule) ? data.settings.schedule : []
  const normalizedSchedule = REMINDER_SCHEDULE_SEQUENCE.filter((key) =>
    scheduleFromDb.includes(key)
  ) as ReminderScheduleKey[]

  return {
    ...DEFAULT_AUTO_REMINDER_SETTINGS,
    ...data.settings,
    schedule: normalizedSchedule.length
      ? normalizedSchedule
      : DEFAULT_AUTO_REMINDER_SETTINGS.schedule
  }
}

export async function saveAutoReminderSettings(userId: string, settings: AutoReminderSettingsData) {
  const payload: SettingsRow = {
    user_id: userId,
    settings,
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

