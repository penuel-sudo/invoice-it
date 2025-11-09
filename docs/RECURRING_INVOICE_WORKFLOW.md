## Recurring Invoice Workflow

### High-Level Overview
- The frontend lets a user configure a base invoice and enable recurring options (`public.recurring_invoices`).
- Automated cron jobs in Postgres (via `pg_cron`) orchestrate three steps:
  1. Generate new invoices from active recurring plans.
  2. Queue outbound invoice emails using `pg_net`.
  3. Poll for HTTP responses and update invoice/email status.
- Row Level Security (RLS) keeps user-specific data scoped, while SECURITY DEFINER functions perform work on behalf of the system.

### Key Tables
- `public.recurring_invoices`: Stores the master schedule and JSON snapshots used when cloning invoices/items.
- `public.pending_email_requests`: Tracks each asynchronous HTTP request sent via `pg_net`.
- `public.invoices`: Receives the newly generated invoice records (initial status `draft`).
- `public.invoice_items`: Cloned line items for each generated invoice.
- `public.notifications`: Stores success/failure notifications according to user preferences.
- `auth.users` and `public.profiles`: Provide user metadata and notification settings.

### SQL Components
`database/COMPLETE_RECURRING_SETUP.sql` encapsulates everything required in the database:

1. **Extension & RLS Setup**
   - Ensures `pg_net` is enabled and grants usage.
   - Creates `pending_email_requests` with RLS policies so users see only their entries, while cron functions (SECURITY DEFINER) can process all rows.

2. **Utility Removals**
   - Drops legacy functions so the new logic is the only active workflow.

3. **Generation Function** – `public.generate_recurring_invoices()`
   - Finds `recurring_invoices` due on the current day.
   - Reconstructs invoice numbers based on the stored snapshot pattern.
   - Copies totals, dates, currency, template data, and items into `public.invoices` / `public.invoice_items`.
   - Sets status to `draft` and updates `recurring_invoices` metadata (`last_generated_at`, `next_generation_date`, etc.).
   - Sends an optional “Invoice Generated” notification if the user’s preferences allow it.
   - Cancels schedules that exhausted occurrences or passed `end_date`.

4. **Email Queue Function** – `public.send_recurring_invoice_emails()`
   - Selects draft invoices tied to an active recurring schedule with `auto_send = true`.
   - Loads client info; skips if missing email.
   - Pulls user profile + primary email (`auth.users`) to set the reply-to address.
   - Builds a payload that mirrors the frontend’s `/api/send-invoice-email` call, including the correct currency symbol.
   - Executes `net.http_post` (asynchronous, 30s timeout) and records the `request_id` in `pending_email_requests`.
   - Moves invoices to a temporary `sending` status.
   - Logs an error notification if the HTTP call itself fails.

5. **Response Processor** – `public.process_email_responses()`
   - Iterates over unprocessed `pending_email_requests` from the last hour.
   - Reads `net._http_response` using each stored `request_id`.
   - On HTTP `200` with a successful payload:
     - Sets invoice status to `pending`.
     - Sends a “Invoice Sent” notification when allowed.
   - On failure or missing success indicators:
     - Reverts invoice to `draft`.
     - Creates an error notification detailing status code and message.
   - Marks the request row as processed.
   - Cleans up processed rows older than 24 hours and times out entries older than one hour with a dedicated notification.

6. **Cron Scheduling**
   - `generate-recurring-invoices-daily`: runs at `0 2 * * *` (2 AM UTC).
   - `send-recurring-invoice-emails`: runs every five minutes (`*/5 * * * *`).
   - `process-email-responses`: runs every five minutes (`*/5 * * * *`).

### End-to-End Flow
1. A recurring plan is configured in the app, storing JSON snapshots of the invoice and item data.
2. At 2 AM UTC, `generate_recurring_invoices()`:
   - Clones base data into `invoices`/`invoice_items`.
   - Sets status `draft`, logs notifications, and advances schedule metadata.
3. Every five minutes, `send_recurring_invoice_emails()`:
   - Grabs recent draft invoices with `auto_send = true`.
   - Calls the API via `pg_net` and writes to `pending_email_requests`.
   - Sets invoice status to `sending`.
4. Every five minutes, `process_email_responses()`:
   - Polls `net._http_response` for each pending request.
   - Updates invoice status (`pending` on success / `draft` on failure).
   - Inserts success/error/timeout notifications.
   - Cleans up old request rows.

### Frontend Integration Notes
- Manual sends (via `SendButton`) call the same `/api/send-invoice-email` endpoint. The SQL-build payload now mirrors that structure to keep behavior consistent.
- Reply-to uses the authenticated user’s email, so client replies route to the business owner.
- Currency symbol calculation is shared: both the frontend and SQL fallback to a common mapping.
- Invoice states match the UI expectations: `draft` (not yet sent), `sending` (queued), `pending` (email sent).

### Operational Tips
- **Testing:** Run each function manually (`SELECT public.generate_recurring_invoices();` etc.) after deploying the SQL script.
- **Monitoring:** Check Supabase logs for warnings emitted by the functions and view `pending_email_requests` for stuck records.
- **Common Issues:**
  - Missing client email prevents auto-send (logged as warning).
  - Domain verification or API failures show up as error notifications and keep invoice in `draft`.
  - If `pg_net` responses don’t arrive, a timeout notification triggers after one hour and resets status.

### Deployment Checklist
- Run `database/COMPLETE_RECURRING_SETUP.sql` in Supabase SQL editor.
- Ensure `pg_cron` extension is enabled in the project.
- Confirm environment variables for `/api/send-invoice-email` (e.g., `RESEND_API_KEY`, `RESEND_FROM`) are set in the hosting environment.
- Verify cron jobs are present (`SELECT * FROM cron.job;`) and remove any obsolete schedules if needed.





