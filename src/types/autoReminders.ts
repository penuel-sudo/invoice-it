export type ReminderScheduleKey = '3_days_before' | 'on_due_date' | '7_days_after'

export type ReminderToneKey = 'friendly' | 'professional' | 'firm'

export interface AutoReminderSettingsData {
  enabled: boolean
  attachPdf: boolean
  schedule: ReminderScheduleKey[]
  tone: ReminderToneKey
}

export interface InvoiceReminderOverrideData {
  remindersEnabled: boolean
  schedule: ReminderScheduleKey[]
  tone: ReminderToneKey
  attachPdf: boolean
}

export const DEFAULT_AUTO_REMINDER_SETTINGS: AutoReminderSettingsData = {
  enabled: false,
  attachPdf: false,
  schedule: ['3_days_before', 'on_due_date', '7_days_after'],
  tone: 'friendly'
}

export const DEFAULT_INVOICE_REMINDER_OVERRIDE: InvoiceReminderOverrideData = {
  remindersEnabled: true,
  schedule: ['3_days_before', 'on_due_date', '7_days_after'],
  tone: 'friendly',
  attachPdf: false
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

export const REMINDER_MESSAGES: Record<
  ReminderToneKey,
  Record<
    ReminderScheduleKey,
    {
      subject: string
      intro: string
      followUp?: string
    }
  >
> = {
  friendly: {
    '3_days_before': {
      subject: 'Upcoming payment reminder: Invoice #{{invoiceNumber}}',
      intro: 'Hi {{clientName}}, just a friendly heads-up that invoice #{{invoiceNumber}} for {{amountDue}} is due on {{dueDate}}.',
      followUp: 'Feel free to reach out if you need anything ahead of the due date.'
    },
    'on_due_date': {
      subject: 'Invoice #{{invoiceNumber}} is due today',
      intro: 'Hi {{clientName}}, this is a quick reminder that invoice #{{invoiceNumber}} for {{amountDue}} is due today ({{dueDate}}).',
      followUp: 'Thanks so much for taking care of it when you can.'
    },
    '7_days_after': {
      subject: 'Friendly follow-up: Invoice #{{invoiceNumber}}',
      intro: 'Hi {{clientName}}, we noticed that invoice #{{invoiceNumber}} for {{amountDue}} is still outstanding.',
      followUp: 'Please let us know if you need us to resend the invoice or if you have any questions.'
    }
  },
  professional: {
    '3_days_before': {
      subject: 'Reminder: Invoice #{{invoiceNumber}} due {{dueDate}}',
      intro: 'Hello {{clientName}}, this is a reminder that invoice #{{invoiceNumber}} for {{amountDue}} is due on {{dueDate}}.',
      followUp: 'Kindly let us know if there are any issues impacting payment.'
    },
    'on_due_date': {
      subject: 'Invoice #{{invoiceNumber}} is due today',
      intro: 'Hello {{clientName}}, invoice #{{invoiceNumber}} for {{amountDue}} falls due today ({{dueDate}}).',
      followUp: 'We appreciate your prompt attention. Please reach out with any questions.'
    },
    '7_days_after': {
      subject: 'Past due notice: Invoice #{{invoiceNumber}}',
      intro: 'Hello {{clientName}}, according to our records invoice #{{invoiceNumber}} for {{amountDue}} is now 7 days past due.',
      followUp: 'Kindly advise on the expected payment date or let us know if we can assist.'
    }
  },
  firm: {
    '3_days_before': {
      subject: 'Action required soon: Invoice #{{invoiceNumber}}',
      intro: '{{clientName}}, this is a reminder that invoice #{{invoiceNumber}} for {{amountDue}} becomes due on {{dueDate}}.',
      followUp: 'Please ensure payment is arranged to avoid any delays.'
    },
    'on_due_date': {
      subject: 'Immediate attention needed: Invoice #{{invoiceNumber}}',
      intro: '{{clientName}}, invoice #{{invoiceNumber}} for {{amountDue}} is due today ({{dueDate}}).',
      followUp: 'Kindly process the payment without delay or confirm the schedule.'
    },
    '7_days_after': {
      subject: 'Overdue: Invoice #{{invoiceNumber}} requires payment',
      intro: '{{clientName}}, invoice #{{invoiceNumber}} for {{amountDue}} remains unpaid and is now overdue.',
      followUp: 'Please settle the balance immediately or contact us with an update.'
    }
  }
}

export const normalizeReminderSchedule = (
  schedule: ReminderScheduleKey[] | undefined | null
): ReminderScheduleKey[] => {
  const input = Array.isArray(schedule) ? schedule : []
  return REMINDER_SCHEDULE_SEQUENCE.filter((key) => input.includes(key))
}

