export const REMINDER_MESSAGES = {
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
};

