# Auto-Send for Recurring Invoices - Complete Explanation

## Overview
This document explains how auto-send works for recurring invoices, including email sending and notifications.

---

## How It Works (Current Flow)

### When User Clicks Send (Manual):

1. **User clicks "Send" button** in the invoice preview
2. **Modal opens** - User can customize message
3. **Email is sent** via `/api/send-invoice-email` API
4. **Notification is created**:
   ```typescript
   addNotification({
     type: 'success',
     title: 'Invoice Sent',
     message: `Invoice #${invoiceNumber} sent to ${email}`,
     status: 'pending'
   })
   ```
5. **Notification appears**:
   - In app (notification dropdown)
   - In browser (if permission granted)

---

## How Auto-Send Works (Cron):

### Flow:

1. **Cron runs daily** at 2 AM UTC
2. **Finds recurring invoices** due for generation
3. **Creates new invoice** (same as before)
4. **If `auto_send = true`**:
   - Calls `send_recurring_invoice_email()` function
   - This function:
     - Fetches invoice data from database
     - Fetches client email from database
     - Fetches user profile data
     - Calls `/api/send-invoice-email` API (via HTTP)
     - Creates notification in database
5. **Notification appears**:
   - In app (notification dropdown)
   - In browser (if permission granted)

---

## Implementation Details

### 1. Email Sending Function

**File**: `database/recurring_invoices_auto_send.sql`

This function:
- Takes `invoice_id`, `user_id`, `client_id` as parameters
- Fetches all necessary data from database
- Calls your email API endpoint via HTTP
- Creates notification (success or error)

**Key Features**:
- Uses `pg_net` extension for HTTP calls (or Supabase Edge Functions)
- Handles errors gracefully
- Creates notifications for both success and failure

---

### 2. Updated Cron Function

**File**: `database/recurring_invoices_cron_updated.sql`

**Changes**:
- After creating invoice, checks `auto_send` flag
- If `true`: Calls `send_recurring_invoice_email()`
- If `false`: Still creates notification that invoice was generated

---

## Setup Instructions

### Step 1: Enable pg_net Extension

Run this in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**OR** use Supabase Edge Functions (see alternative below)

---

### Step 2: Set Your API URL

**Option A: Environment Variable** (Recommended)
- Go to Supabase Dashboard → Settings → Database → Connection Pooling
- Add custom setting: `app.email_api_url` = `https://your-app.vercel.app/api/send-invoice-email`

**Option B: Hardcode in SQL**
- Edit `recurring_invoices_auto_send.sql`
- Replace `'https://your-app-domain.vercel.app/api/send-invoice-email'` with your actual API URL

---

### Step 3: Create the Send Function

Run `database/recurring_invoices_auto_send.sql` in Supabase SQL Editor

---

### Step 4: Update Cron Function

Run `database/recurring_invoices_cron_updated.sql` in Supabase SQL Editor

This replaces the old cron function with the updated version.

---

## Alternative: Using Supabase Edge Functions

If you prefer Edge Functions instead of HTTP calls:

### Create Edge Function:

1. **Create function** in Supabase: `supabase/functions/send-recurring-invoice-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { invoice_id, user_id, client_id } = await req.json()

  // Fetch invoice, client, user data
  // Call your email API
  // Create notification
  // Return success/error

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

2. **Update cron function** to call Edge Function:
```sql
SELECT supabase.functions.invoke(
  'send-recurring-invoice-email',
  jsonb_build_object(
    'invoice_id', new_invoice_id,
    'user_id', recurring_record.user_id,
    'client_id', recurring_record.client_id
  )
);
```

---

## Notifications

### When Auto-Send is Enabled:

**Success Notification**:
- Type: `success`
- Title: "Invoice Sent"
- Message: "Invoice #INV-123 sent to client@email.com"
- Status: `pending`
- Metadata: `{ invoice_id, invoice_number, client_id, client_name, client_email, auto_sent: true }`

**Error Notification**:
- Type: `error`
- Title: "Auto-send Failed"
- Message: "Failed to send invoice #INV-123: [error message]"
- Status: `pending`
- Metadata: `{ invoice_id, invoice_number, client_id, error }`

### When Auto-Send is Disabled:

**Info Notification**:
- Type: `info`
- Title: "Invoice Generated"
- Message: "Invoice #INV-123 was automatically generated"
- Status: `pending`
- Metadata: `{ invoice_id, invoice_number, client_id, recurring_invoice_id, auto_generated: true }`

---

## Notification Display

### In App:
- Appears in notification dropdown
- Shows in notification list
- Can be marked as read
- Can be deleted

### In Browser:
- Browser push notification (if permission granted)
- Appears even when tab is not focused
- Clicking opens the app

**How it works**:
- When notification is created in database, frontend `NotificationContext` loads it
- If user has `push_enabled: true` and browser permission granted, shows browser notification
- Uses `Notification` Web API

---

## Testing

### Test Email Sending Function:

```sql
-- Test with a real invoice ID
SELECT public.send_recurring_invoice_email(
  'your-invoice-id'::UUID,
  'your-user-id'::UUID,
  'your-client-id'::UUID
);
```

### Test Full Cron Function:

```sql
-- This will generate invoices and send emails if auto_send is enabled
SELECT public.generate_recurring_invoices();
```

### Check Notifications:

```sql
-- Check if notifications were created
SELECT * FROM notifications 
WHERE metadata->>'auto_sent' = 'true' 
   OR metadata->>'auto_generated' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Email Not Sending:

1. **Check API URL**: Make sure `email_api_url` is set correctly
2. **Check pg_net**: Verify extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
3. **Check logs**: Look for errors in Supabase logs
4. **Check client email**: Verify client has email in database
5. **Check API response**: The function logs errors, check notifications table for error messages

### Notifications Not Appearing:

1. **Check database**: Verify notifications were inserted: `SELECT * FROM notifications ORDER BY created_at DESC;`
2. **Check frontend**: Verify `NotificationContext` is loading notifications
3. **Check browser permissions**: User must grant notification permission
4. **Check user preferences**: Verify `notification_preferences.push_enabled = true`

---

## Summary

✅ **Auto-Send**: When `auto_send = true`, cron automatically sends email to client  
✅ **Notifications**: Creates notifications in database (app + browser)  
✅ **Error Handling**: Creates error notifications if email fails  
✅ **Same as Manual**: Uses same email API endpoint as manual send  
✅ **User Control**: Users can enable/disable auto-send per recurring invoice  

---

## Files Created:

1. `database/recurring_invoices_auto_send.sql` - Email sending function
2. `database/recurring_invoices_cron_updated.sql` - Updated cron function
3. `AUTO_SEND_EXPLANATION.md` - This document

---

## Next Steps:

1. Run `recurring_invoices_auto_send.sql` to create send function
2. Update API URL in the function
3. Run `recurring_invoices_cron_updated.sql` to update cron function
4. Test with `SELECT public.generate_recurring_invoices();`
5. Check notifications in app and database

