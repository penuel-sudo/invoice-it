export type ReminderScheduleKey = '3_days_before' | 'on_due_date' | '7_days_after'

export type ReminderToneKey = 'friendly' | 'professional' | 'firm'

export interface AutoReminderSettingsData {
  enabled: boolean
  attachPdf: boolean
  schedule: ReminderScheduleKey[]
  tone: ReminderToneKey
}

export const DEFAULT_AUTO_REMINDER_SETTINGS: AutoReminderSettingsData = {
  enabled: false,
  attachPdf: false,
  schedule: ['3_days_before', 'on_due_date', '7_days_after'],
  tone: 'friendly'
}

export const REMINDER_SCHEDULE_SEQUENCE: ReminderScheduleKey[] = [
  '3_days_before',
  'on_due_date',
  '7_days_after'
]

export const REMINDER_SCHEDULE_OPTIONS: Array<{
  key: ReminderScheduleKey
  label: string
  description: string
}> = [
  {
    key: '3_days_before',
    label: '3 days before due date',
    description: 'Send a heads-up before the invoice is due'
  },
  {
    key: 'on_due_date',
    label: 'On the due date',
    description: 'Send a reminder on the day payment is due'
  },
  {
    key: '7_days_after',
    label: '7 days after due date',
    description: 'Follow up a week after the due date if unpaid'
  }
]

export const REMINDER_SCHEDULE_SHORT_LABELS: Record<ReminderScheduleKey, string> = {
  '3_days_before': '3 days before due',
  'on_due_date': 'On due date',
  '7_days_after': '7 days after due'
}

export const REMINDER_TONE_PRESETS: Record<
  ReminderToneKey,
  {
    label: string
    subject: string
    intro: string
    followUp?: string
  }
> = {
  friendly: {
    label: 'Friendly',
    subject: 'Friendly reminder: Invoice #{{invoiceNumber}}',
    intro: 'Hope you’re doing well! This is a friendly reminder that invoice #{{invoiceNumber}} for {{amountDue}} is {{statusTrigger}}.',
    followUp: 'Let us know if you need anything from us—we’re happy to help.'
  },
  professional: {
    label: 'Professional',
    subject: 'Payment reminder for invoice #{{invoiceNumber}}',
    intro: 'This is a quick reminder that invoice #{{invoiceNumber}} for {{amountDue}} is {{statusTrigger}}.',
    followUp: 'We appreciate your prompt attention. Please reach out if there are any questions.'
  },
  firm: {
    label: 'Firm',
    subject: 'Action required: Invoice #{{invoiceNumber}}',
    intro: 'Invoice #{{invoiceNumber}} totaling {{amountDue}} is currently {{statusTrigger}}. Please take care of this payment as soon as possible.',
    followUp: 'If payment has already been sent, please disregard this reminder. Otherwise, kindly confirm the expected payment date.'
  }
}

