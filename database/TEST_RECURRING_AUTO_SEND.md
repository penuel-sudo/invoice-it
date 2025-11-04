# How to Test Recurring Invoice Auto-Send Manually

## Prerequisites

1. ✅ You have created a recurring invoice (with `auto_send = true`)
2. ✅ The function `send_recurring_invoice_email` is created in your database
3. ✅ You have an invoice ID, user ID, and client ID ready

---

## Step 1: Get Test Data

First, get the IDs you need from your database:

```sql
-- Get a recurring invoice ID
SELECT 
  r.id as recurring_id,
  r.user_id,
  r.client_id,
  r.base_invoice_id,
  r.auto_send,
  r.status
FROM recurring_invoices r
WHERE r.status = 'active'
  AND r.auto_send = true
LIMIT 1;

-- Or get an invoice ID that was generated from a recurring invoice
SELECT 
  i.id as invoice_id,
  i.user_id,
  i.client_id,
  i.invoice_number,
  i.recurring_invoice_id
FROM invoices i
WHERE i.recurring_invoice_id IS NOT NULL
ORDER BY i.created_at DESC
LIMIT 1;
```

---

## Step 2: Test the Send Function Directly

### Option A: Test with Existing Generated Invoice

```sql
-- Replace with your actual IDs from Step 1
SELECT public.send_recurring_invoice_email(
  'your-invoice-id-here'::UUID,  -- Invoice ID (from generated invoice)
  'your-user-id-here'::UUID,      -- User ID
  'your-client-id-here'::UUID    -- Client ID
);
```

### Option B: Test with Base Invoice (Before Generation)

```sql
-- Get base invoice data
SELECT 
  r.base_invoice_id,
  r.user_id,
  r.client_id,
  i.invoice_number
FROM recurring_invoices r
JOIN invoices i ON i.id = r.base_invoice_id
WHERE r.id = 'your-recurring-id-here'::UUID;

-- Then test (but this won't work if invoice doesn't exist yet)
-- Better to wait for cron to generate invoice first
```

---

## Step 3: Check Results

### Check if Email Was Sent (Notifications)

```sql
-- Check for success notification
SELECT 
  id,
  type,
  title,
  message,
  status,
  created_at,
  metadata
FROM notifications
WHERE metadata->>'auto_sent' = 'true'
  OR metadata->>'invoice_id' = 'your-invoice-id-here'
ORDER BY created_at DESC
LIMIT 5;
```

### Check for Errors

```sql
-- Check for error notifications
SELECT 
  id,
  type,
  title,
  message,
  metadata->>'error' as error_details,
  created_at
FROM notifications
WHERE type = 'error'
  AND title = 'Auto-send Failed'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Step 4: Test Full Flow (Generate + Send)

### Test the Full Cron Function

```sql
-- This will:
-- 1. Generate invoices for recurring invoices due today
-- 2. Send emails if auto_send = true
-- 3. Create notifications
SELECT public.generate_recurring_invoices();
```

### Check Generated Invoices

```sql
-- See newly generated invoices
SELECT 
  i.id,
  i.invoice_number,
  i.status,
  i.created_at,
  i.recurring_invoice_id,
  c.name as client_name,
  c.email as client_email
FROM invoices i
JOIN clients c ON c.id = i.client_id
WHERE i.recurring_invoice_id IS NOT NULL
  AND i.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY i.created_at DESC;
```

### Check Notifications

```sql
-- See all notifications from auto-generation
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.created_at,
  n.metadata
FROM notifications n
WHERE n.created_at >= NOW() - INTERVAL '1 hour'
  AND (
    n.metadata->>'auto_sent' = 'true'
    OR n.metadata->>'auto_generated' = 'true'
  )
ORDER BY n.created_at DESC;
```

---

## Step 5: Verify Email Was Actually Sent

### Check Your Email API Logs

- Go to your email service (Resend, SendGrid, etc.)
- Check the "Sent" or "Activity" tab
- Look for emails sent in the last hour
- Verify the recipient email address

### Check Client's Email

- Ask the client to check their inbox
- Check spam folder if needed
- Verify the email content matches the invoice

---

## Troubleshooting

### Error: "Function net.http_post does not exist"

**Solution**: Enable `pg_net` extension:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

If this doesn't work, Supabase may not support `pg_net`. Use Supabase Edge Functions instead (see alternative below).

### Error: "Client email not found"

**Solution**: Make sure the client has an email:

```sql
SELECT id, name, email 
FROM clients 
WHERE id = 'your-client-id-here'::UUID;
```

If email is NULL, add it:

```sql
UPDATE clients 
SET email = 'client@example.com' 
WHERE id = 'your-client-id-here'::UUID;
```

### Error: "Invoice not found"

**Solution**: Make sure the invoice exists:

```sql
SELECT id, invoice_number, status 
FROM invoices 
WHERE id = 'your-invoice-id-here'::UUID;
```

### No Notification Created

**Solution**: Check if function executed without errors:

```sql
-- Check Postgres logs for warnings
-- In Supabase: Dashboard > Logs > Postgres Logs
-- Look for WARNING messages from the function
```

### Email Not Actually Sent

**Solution**: 
1. Check API URL is correct in the function
2. Check API endpoint is accessible (not behind auth)
3. Check API logs for errors
4. Verify API key is valid

---

## Alternative: Test Without pg_net

If `pg_net` doesn't work in Supabase, you can test the notification creation part separately:

```sql
-- Test notification creation (without email)
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  status,
  metadata
) VALUES (
  'your-user-id-here'::UUID,
  'success',
  'Invoice Sent',
  'Invoice #TEST-123 sent to test@example.com',
  'pending',
  jsonb_build_object(
    'invoice_id', 'your-invoice-id-here'::UUID,
    'invoice_number', 'TEST-123',
    'client_id', 'your-client-id-here'::UUID,
    'auto_sent', true
  )
);

-- Then check if it appears in your app
SELECT * FROM notifications 
WHERE metadata->>'auto_sent' = 'true' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Quick Test Checklist

- [ ] Function exists: `SELECT proname FROM pg_proc WHERE proname = 'send_recurring_invoice_email';`
- [ ] pg_net enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
- [ ] Have invoice ID: `SELECT id FROM invoices WHERE id = '...'::UUID;`
- [ ] Have client email: `SELECT email FROM clients WHERE id = '...'::UUID;`
- [ ] API URL is correct in function
- [ ] Test function: `SELECT public.send_recurring_invoice_email(...);`
- [ ] Check notification: `SELECT * FROM notifications WHERE ...;`
- [ ] Check email was sent (in your email service dashboard)

---

## Example Test Query (Complete)

```sql
-- Complete test example (replace with your actual IDs)
DO $$
DECLARE
  test_invoice_id UUID := 'your-invoice-id-here'::UUID;
  test_user_id UUID := 'your-user-id-here'::UUID;
  test_client_id UUID := 'your-client-id-here'::UUID;
BEGIN
  -- Test the function
  PERFORM public.send_recurring_invoice_email(
    test_invoice_id,
    test_user_id,
    test_client_id
  );
  
  -- Check results
  RAISE NOTICE 'Function executed. Check notifications table for results.';
END $$;

-- Then check notifications
SELECT * FROM notifications 
WHERE metadata->>'invoice_id' = 'your-invoice-id-here'
ORDER BY created_at DESC 
LIMIT 1;
```

