# Auto Reminder Workflow

## Overview
- Automatic reminders reuse the existing async email pipeline while adding dedicated tables, settings, and cron jobs.
- Workspaces configure global defaults in the Settings → Auto Reminders tab; each invoice can optionally override those defaults from the transaction list.
- Supabase cron jobs evaluate eligible invoices, queue reminder logs, and hand off email delivery to the shared `pending_email_requests` queue.
- Reminder content is generated from curated tone presets so users never have to author custom copy.

## Frontend Touchpoints
- `src/pages/SettingsPage.tsx`
  - Adds the “Auto Reminders” tab and keeps it in sync with the URL query param.
  - Loads and saves workspace defaults through the shared settings service.
- `src/components/settings/AutoReminderSettings.tsx`
  - Responsive layout that lets users toggle reminders, pick timing (`3_days_before`, `on_due_date`, `7_days_after`), choose tone (friendly/professional/firm), and opt to attach the PDF.
  - Emits `settings` as a JSON shape compatible with `auto_reminder_settings.settings`.
- `src/pages/TransactionPage.tsx`
  - Extends each invoice’s actions menu with “Auto Reminders”.
  - Passes invoice data to the override modal and refreshes on save so the UI reflects overrides immediately.
- `src/components/autoreminder/AutoReminderInvoiceModal.tsx`
  - Allows toggling `use_workspace_defaults` on/off.
  - When overrides are enabled, exposes timing, tone, and PDF attachment controls that map directly to `invoice_reminder_overrides` columns.
- `src/components/OverdueDetector.tsx`
  - Now read-only. Overdue status updates moved to the backend cron so the UI no longer mutates invoice state locally.

## Backend Schema
- `public.auto_reminder_settings`
  - One row per workspace (`user_id`), storing the JSON defaults consumed by the settings tab.
- `public.invoice_reminder_overrides`
  - Per-invoice flags for using defaults vs custom schedule/tone/attachment.
- `public.invoice_reminder_log`
  - History of every reminder attempt with status, payload metadata, and sent timestamp.
- `public.pending_email_requests`
  - Extended with `request_type`, `reminder_log_id`, and `payload` so reminders coexist with recurring sends.
- RLS policies ensure end users see only their rows, while SECURITY DEFINER functions can operate across workspaces.

## Core Functions
- `public.process_invoice_auto_reminders()`
  - Executes every two minutes during QA (production cadence: every hour at minute 10).
  - Builds the effective reminder configuration by merging workspace defaults with invoice overrides.
  - Evaluates each scheduled key:
    - `3_days_before`: queues only when today exactly matches due date minus three days.
    - `on_due_date`: queues when `current_date >= due_date`, allowing catch-up for invoices that are already overdue.
    - `7_days_after`: queues when `current_date >= due_date + 7`.
  - Skips disabled reminders, empty schedules, or invoices that already have a log entry for the same `invoice_id + reminder_key + reminder_date`.
  - Inserts a log row with status `queued`, tone/attach settings, and timestamps.
- `public.queue_invoice_reminder_emails()`
  - Runs on its own cron (QA: every two minutes, production: every ten minutes).
  - Loads queued reminder logs, fetches invoice/client/user context, and builds the API payload.
  - Calls `/api/send-invoice-email` via `net.http_post` with `type='reminder'` and writes the job to `pending_email_requests` (linking `reminder_log_id`).
  - Marks the log row `processing` and captures the request id.
- `public.process_email_responses()` (defined in `database/COMPLETE_RECURRING_SETUP.sql`)
  - Now branches on `pending_email_requests.request_type`:
    - `recurring`: preserves the original behavior (status transitions, recurring notifications).
    - `reminder`: updates `invoice_reminder_log` to `sent`/`failed` and creates a “Reminder Sent” notification without touching invoice status.

## Email Rendering
- `/api/send-invoice-email` accepts a `reminderContext` blob that includes `reminderKey`, `tone`, `attachPdf`, and `reminderLogId`.
- `api/reminderMessages.js` exports `REMINDER_MESSAGES`, a tone → reminder key map of predefined subjects/intro/follow-up copy.
- The handler selects the correct template, replaces placeholders (`clientName`, `invoiceNumber`, `amountDue`, `dueDate`, etc.), and formats the HTML/text bodies.
- Reply-to defaults to the workspace owner’s email so client responses route correctly.

## End-to-End Flow
1. User enables auto reminders globally and optionally customizes an invoice override.
2. `process_invoice_auto_reminders()` cron computes which reminders are due and inserts log rows (`queued`).
3. `queue_invoice_reminder_emails()` cron issues the HTTP request, updates the log row to `processing`, and records the job in `pending_email_requests` with `request_type='reminder'`.
4. pg_net processes the HTTP response; `process_email_responses()` sets the log row to `sent`/`failed`, writes notifications, and archives the pending request.
5. The frontend surfaces reminder history and notifications alongside existing invoice activity.

## Testing Checklist
- Run `SELECT public.process_invoice_auto_reminders();` and inspect `invoice_reminder_log` for expected rows.
- Run `SELECT public.queue_invoice_reminder_emails();` to ensure jobs enter `pending_email_requests`.
- Verify `public.process_email_responses();` promotes logs to `sent` and that notifications appear.
- Confirm reminder emails respect tone, schedule, and PDF attachment settings across both workspace defaults and overrides.

## Maintenance Notes
- After QA, revert cron schedules to production cadences noted above.
- Keep `REMINDER_MESSAGES` in sync with the product copy requirements; API consumers rely on those keys.
- Monitor the `payload` column in `invoice_reminder_log` for error metadata (e.g., missing client email, HTTP failures).
- Any changes to `/api/send-invoice-email` should preserve the `reminderContext` contract so legacy reminder logs remain processable.
