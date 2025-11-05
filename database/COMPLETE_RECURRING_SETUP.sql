-- ============================================
-- COMPLETE RECURRING INVOICES SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This includes:
-- 1. pg_net extension setup with proper permissions
-- 2. Auto-send email function
-- 3. Cron function for generating recurring invoices
-- ============================================

-- Step 1: Enable pg_net extension and grant permissions
-- Note: pg_net may need to be enabled in Supabase Dashboard first
-- Go to Database > Extensions and enable "pg_net" if it's not already enabled

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions to use pg_net
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA net GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA net GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA net GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Verify pg_net is installed and check available functions
-- Run this to check: SELECT * FROM pg_extension WHERE extname = 'pg_net';
-- If pg_net is not available, you may need to use Supabase Edge Functions instead

-- ============================================
-- Step 2: Auto-Send Email Function
-- ============================================

CREATE OR REPLACE FUNCTION public.send_recurring_invoice_email(
  p_invoice_id UUID,
  p_user_id UUID,
  p_client_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invoice_record RECORD;
  client_record RECORD;
  user_profile RECORD;
  email_api_url TEXT;
  email_response JSONB;
  client_email TEXT;
  invoice_data JSONB;
  user_data JSONB;
  http_status_code INTEGER;
  http_content TEXT;
  notification_prefs JSONB;
  should_notify BOOLEAN;
BEGIN
  -- Get email API URL from environment or use default
  email_api_url := COALESCE(
    current_setting('app.email_api_url', true),
    'https://invoice-it.org/api/send-invoice-email' -- UPDATE THIS WITH YOUR API URL
  );

  -- Fetch invoice data
  SELECT 
    i.*,
    i.template_data,
    i.template_settings,
    i.currency_code
  INTO invoice_record
  FROM public.invoices i
  WHERE i.id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Invoice % not found', p_invoice_id;
    RETURN;
  END IF;

  -- Fetch client data (for email)
  SELECT email, name, company_name
  INTO client_record
  FROM public.clients
  WHERE id = p_client_id;

  IF NOT FOUND OR client_record.email IS NULL THEN
    RAISE WARNING 'Client % not found or has no email', p_client_id;
    -- Still create notification that email failed (always create errors)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      status,
      is_read,
      metadata
    ) VALUES (
      p_user_id,
      'error',
      'Auto-send Failed',
      'Failed to send invoice: Client email not found',
      'pending',
      false,
      jsonb_build_object(
        'invoice_id', p_invoice_id,
        'client_id', p_client_id,
        'error', 'client_email_missing'
      )
    );
    RETURN;
  END IF;

  client_email := client_record.email;

  -- Fetch user profile data and notification preferences
  SELECT full_name, company_name, notification_preferences
  INTO user_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check notification preferences
  notification_prefs := COALESCE(user_profile.notification_preferences, '{"enabled": true, "invoice_sent": true}'::jsonb);
  -- Check if notifications are enabled and invoice_sent preference is enabled
  should_notify := COALESCE((notification_prefs->>'enabled')::boolean, true) 
                   AND COALESCE((notification_prefs->>'invoice_sent')::boolean, true);

  -- Build invoice data for API
  invoice_data := jsonb_build_object(
    'invoiceNumber', invoice_record.invoice_number,
    'issueDate', invoice_record.issue_date,
    'dueDate', invoice_record.due_date,
    'subtotal', invoice_record.subtotal,
    'taxAmount', invoice_record.tax_amount,
    'totalAmount', invoice_record.total_amount,
    'currencyCode', invoice_record.currency_code,
    'notes', invoice_record.notes,
    'clientName', client_record.name,
    'clientEmail', client_email,
    'template', invoice_record.template,
    'templateData', invoice_record.template_data,
    'templateSettings', invoice_record.template_settings
  );

  -- Build user data for API
  user_data := jsonb_build_object(
    'id', p_user_id,
    'fullName', COALESCE(user_profile.full_name, ''),
    'businessName', COALESCE(user_profile.company_name, '')
  );

  -- Call email API via HTTP (using pg_net)
  BEGIN
    -- pg_net.http_post returns a table with: id, status_code, content, headers, created
    -- Note: Check if pg_net is enabled in Supabase Dashboard > Database > Extensions
    -- If pg_net is not available, this will fail and create an error notification
    SELECT status_code, content
    INTO http_status_code, http_content
    FROM net.http_post(
      email_api_url,  -- url (text)
      jsonb_build_object(
        'Content-Type', 'application/json'
      ),  -- headers (jsonb)
      jsonb_build_object(
        'to', client_email,
        'invoiceData', invoice_data,
        'userData', user_data,
        'clientName', client_record.name,
        'greetingMessage', NULL,
        'businessName', COALESCE(user_profile.company_name, '')
      )::text  -- body (text)
    );

    -- Parse the response content as JSON
    IF http_status_code = 200 THEN
      -- Try to parse as JSON, fallback to text if not JSON
      BEGIN
        email_response := http_content::jsonb;
      EXCEPTION WHEN OTHERS THEN
        email_response := jsonb_build_object('success', true, 'message', http_content);
      END;
    ELSE
      -- Error response
      email_response := jsonb_build_object(
        'statusCode', http_status_code,
        'error', http_content,
        'success', false
      );
    END IF;

    -- Check if email was sent successfully
    IF http_status_code = 200 OR (email_response->>'success')::boolean = true THEN
      -- Email sent successfully - create success notification (if preference enabled)
      IF should_notify THEN
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          status,
          is_read,
          metadata
        ) VALUES (
          p_user_id,
          'success',
          'Invoice Sent',
          format('Invoice #%s sent to %s', invoice_record.invoice_number, client_email),
          'pending',
          false,
          jsonb_build_object(
            'invoice_id', p_invoice_id,
            'invoice_number', invoice_record.invoice_number,
            'client_id', p_client_id,
            'client_name', client_record.name,
            'client_email', client_email,
            'auto_sent', true
          )
        );
      END IF;
    ELSE
      -- Email failed - create error notification (always create errors)
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        status,
        is_read,
        metadata
      ) VALUES (
        p_user_id,
        'error',
        'Auto-send Failed',
        format('Failed to send invoice #%s: %s', invoice_record.invoice_number, COALESCE(email_response->>'error', 'Unknown error')),
        'pending',
        false,
        jsonb_build_object(
          'invoice_id', p_invoice_id,
          'invoice_number', invoice_record.invoice_number,
          'client_id', p_client_id,
          'error', email_response
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- HTTP call failed - create error notification (always create errors)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      status,
      is_read,
      metadata
    ) VALUES (
      p_user_id,
      'error',
      'Auto-send Failed',
      format('Failed to send invoice #%s: %s', invoice_record.invoice_number, SQLERRM),
      'pending',
      false,
      jsonb_build_object(
        'invoice_id', p_invoice_id,
        'invoice_number', invoice_record.invoice_number,
        'client_id', p_client_id,
        'error', SQLERRM
      )
    );
  END;
END;
$$;

-- ============================================
-- Step 3: Cron Function for Generating Invoices
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_recurring_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recurring_record RECORD;
  new_invoice_id UUID;
  new_invoice_number TEXT;
  new_issue_date DATE;
  new_due_date DATE;
  invoice_item RECORD;
  sequence_num INTEGER;
  year_str TEXT;
  month_str TEXT;
  invoice_template TEXT;
  base_invoice_num TEXT;
  invoice_prefix TEXT;
  invoice_format TEXT;
  date_part TEXT;
  timestamp_part TEXT;
  notification_prefs JSONB;
  should_notify_created BOOLEAN;
  item_json JSONB;
BEGIN
  -- Find all active recurring invoices due for generation today
  FOR recurring_record IN
    SELECT 
      r.id,
      r.user_id,
      r.base_invoice_id,
      r.client_id,
      r.frequency,
      r.start_date,
      r.end_date,
      r.max_occurrences,
      r.next_generation_date,
      r.auto_create,
      r.auto_send,
      r.status,
      r.invoice_snapshot::jsonb as invoice_snapshot,
      r.items_snapshot::jsonb as items_snapshot,
      r.created_at,
      r.updated_at,
      r.last_generated_at,
      r.total_generated_count,
      i.subtotal,
      i.tax_amount,
      i.total_amount
    FROM public.recurring_invoices r
    INNER JOIN public.invoices i ON i.id = r.base_invoice_id
    WHERE r.status = 'active'
      AND r.next_generation_date <= CURRENT_DATE
      AND r.auto_create = true
      AND (r.end_date IS NULL OR r.next_generation_date <= r.end_date)
      AND (r.max_occurrences IS NULL OR r.total_generated_count < r.max_occurrences)
  LOOP
    BEGIN
      -- Get template from snapshot (dynamic - whatever template was stored)
      invoice_template := recurring_record.invoice_snapshot->>'template';
      
      -- If template is NULL, use default (fallback only)
      IF invoice_template IS NULL OR invoice_template = '' THEN
        invoice_template := 'default';
      END IF;
      
      -- Generate new invoice number using the same format as base invoice
      -- Get base invoice number from snapshot
      base_invoice_num := recurring_record.invoice_snapshot->>'base_invoice_number';
      
      -- Detect format pattern from base invoice number
      IF base_invoice_num LIKE 'INV-%' AND base_invoice_num ~ '^INV-\d+$' THEN
        -- Professional format: INV-{timestamp} (e.g., INV-706319)
        -- Generate new timestamp-based number (last 6 digits of current timestamp)
        timestamp_part := SUBSTRING(FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT FROM '\d{6}$');
        new_invoice_number := 'INV-' || timestamp_part;
      ELSIF base_invoice_num ~ '^\d{8}-\d+$' THEN
        -- Default format: YYYYMMDD-{timestamp} (e.g., 20241225-123456)
        -- Extract date part (YYYYMMDD) from generation date
        date_part := TO_CHAR(recurring_record.next_generation_date, 'YYYYMMDD');
        -- Generate timestamp part (last 6 digits of current timestamp)
        timestamp_part := SUBSTRING(FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT FROM '\d{6}$');
        new_invoice_number := date_part || '-' || timestamp_part;
      ELSIF base_invoice_num LIKE 'INV-%-%-%' THEN
        -- Format: INV-YYYY-MM-#### (old pattern format)
        year_str := EXTRACT(YEAR FROM recurring_record.next_generation_date)::TEXT;
        month_str := LPAD(EXTRACT(MONTH FROM recurring_record.next_generation_date)::TEXT, 2, '0');
        
        -- Get sequence number (count of invoices generated this month for this user)
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '(\d+)$') AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM public.invoices
        WHERE user_id = recurring_record.user_id
          AND invoice_number LIKE 'INV-' || year_str || '-' || month_str || '-%';
        
        new_invoice_number := 'INV-' || year_str || '-' || month_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
      ELSE
        -- Fallback: Use timestamp-based format (Professional style)
        timestamp_part := SUBSTRING(FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT FROM '\d{6}$');
        new_invoice_number := 'INV-' || timestamp_part;
      END IF;
      
      -- Set dates
      new_issue_date := recurring_record.next_generation_date;
      new_due_date := new_issue_date + (recurring_record.invoice_snapshot->>'payment_terms_days')::INTEGER * INTERVAL '1 day';
      
      -- Create new invoice (template is dynamic - from snapshot)
      -- Extract template_settings as JSONB (preserves full nested structure)
      INSERT INTO public.invoices (
        user_id,
        client_id,
        invoice_number,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_amount,
        total_amount,
        notes,
        template,
        template_data,
        template_settings,
        currency_code,
        selected_payment_method_ids,
        recurring_invoice_id,
        created_at,
        updated_at
      ) VALUES (
        recurring_record.user_id,
        recurring_record.client_id,
        new_invoice_number,
        'pending',
        new_issue_date,
        new_due_date,
        (recurring_record.invoice_snapshot->>'subtotal')::NUMERIC(10, 2),
        COALESCE((recurring_record.invoice_snapshot->>'tax_amount')::NUMERIC(10, 2), 0),
        (recurring_record.invoice_snapshot->>'total_amount')::NUMERIC(10, 2),
        COALESCE(recurring_record.invoice_snapshot->>'notes', ''),
        invoice_template,
        COALESCE(recurring_record.invoice_snapshot->'template_data', '{}'::jsonb),
        COALESCE(recurring_record.invoice_snapshot->'template_settings', '{}'::jsonb), -- Preserves full nested structure
        COALESCE(recurring_record.invoice_snapshot->>'currency_code', 'USD'),
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(recurring_record.invoice_snapshot->'selected_payment_method_ids')),
          ARRAY[]::TEXT[]
        ),
        recurring_record.id,
        NOW(),
        NOW()
      )
      RETURNING id INTO new_invoice_id;
      
      -- Create invoice items from snapshot
      FOR item_json IN
        SELECT value FROM jsonb_array_elements(recurring_record.items_snapshot)
      LOOP
        INSERT INTO public.invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          tax_rate,
          discount,
          line_total,
          created_at
        ) VALUES (
          new_invoice_id,
          item_json->>'description',
          (item_json->>'quantity')::NUMERIC(10, 2),
          (item_json->>'unit_price')::NUMERIC(10, 2),
          COALESCE((item_json->>'tax_rate')::NUMERIC(5, 2), 0),
          COALESCE((item_json->>'discount')::NUMERIC(5, 2), 0),
          (item_json->>'line_total')::NUMERIC(10, 2),
          NOW()
        );
      END LOOP;
      
      -- Update recurring invoice
      UPDATE public.recurring_invoices
      SET 
        last_generated_at = NOW(),
        total_generated_count = total_generated_count + 1,
        next_generation_date = CASE recurring_record.frequency
          WHEN 'daily' THEN next_generation_date + INTERVAL '1 day'
          WHEN 'weekly' THEN next_generation_date + INTERVAL '1 week'
          WHEN 'monthly' THEN next_generation_date + INTERVAL '1 month'
          WHEN 'quarterly' THEN next_generation_date + INTERVAL '3 months'
          WHEN 'yearly' THEN next_generation_date + INTERVAL '1 year'
        END,
        updated_at = NOW()
      WHERE id = recurring_record.id;
      
      -- Check user notification preferences for invoice_created
      SELECT notification_preferences
      INTO notification_prefs
      FROM public.profiles
      WHERE id = recurring_record.user_id;
      
      notification_prefs := COALESCE(notification_prefs, '{"enabled": true, "invoice_created": true}'::jsonb);
      should_notify_created := COALESCE((notification_prefs->>'enabled')::boolean, true) 
                               AND COALESCE((notification_prefs->>'invoice_created')::boolean, true);
      
      -- Auto-send email if enabled
      IF recurring_record.auto_send = true THEN
        PERFORM public.send_recurring_invoice_email(
          new_invoice_id,
          recurring_record.user_id,
          recurring_record.client_id
        );
        -- Note: send_recurring_invoice_email() will create notification if invoice_sent preference enabled
      ELSE
        -- Even if auto-send is disabled, create a notification that invoice was generated (if preference enabled)
        IF should_notify_created THEN
          INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            status,
            is_read,
            metadata
          ) VALUES (
            recurring_record.user_id,
            'info',
            'Invoice Generated',
            format('Invoice #%s was automatically generated', new_invoice_number),
            'pending',
            false,
            jsonb_build_object(
              'invoice_id', new_invoice_id,
              'invoice_number', new_invoice_number,
              'client_id', recurring_record.client_id,
              'recurring_invoice_id', recurring_record.id,
              'auto_generated', true
            )
          );
        END IF;
      END IF;
      
      -- Check if recurring should be cancelled
      IF (recurring_record.end_date IS NOT NULL AND recurring_record.next_generation_date > recurring_record.end_date)
         OR (recurring_record.max_occurrences IS NOT NULL AND recurring_record.total_generated_count >= recurring_record.max_occurrences) THEN
        UPDATE public.recurring_invoices
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = recurring_record.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with next recurring invoice
      RAISE WARNING 'Error generating recurring invoice %: %', recurring_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================
-- Step 4: Schedule the Cron Job
-- ============================================

-- Schedule the cron job (runs every 2 minutes for testing)
-- Note: Make sure pg_cron extension is enabled in Supabase
-- TODO: Change back to daily schedule: '0 2 * * *' (2 AM UTC daily) after testing
SELECT cron.schedule(
  'generate-recurring-invoices-daily',
  '*/2 * * * *', -- Every 2 minutes (for testing)
  $$SELECT public.generate_recurring_invoices()$$
);

-- ============================================
-- NOTES:
-- ============================================
-- 1. The function runs every 2 minutes (for testing) - Change to '0 2 * * *' for daily at 2 AM UTC
-- 2. It generates invoices for all active recurring invoices where next_generation_date <= today
-- 3. Template is read dynamically from invoice_snapshot (not hardcoded)
-- 4. Invoice number format is detected from base_invoice_number and replicated
-- 5. New invoices are created with status 'pending'
-- 6. All data types match exact schema (NUMERIC(10,2), NUMERIC(5,2), etc.)
-- 7. User notification preferences are respected:
--    - invoice_created: Controls if "Invoice Generated" notification is created
--    - invoice_sent: Controls if "Invoice Sent" notification is created (via send function)
--    - Error notifications are always created (important for user awareness)
-- 8. If auto_send is enabled, it calls the email API and creates notification (if preference enabled)
-- 9. If auto_send is disabled, it creates "Invoice Generated" notification (if preference enabled)
-- 10. The function automatically calculates the next generation date based on frequency
-- 11. Replicates frontend behavior: Same API endpoint, same notification structure, same data
-- ============================================

-- To test the function manually:
-- SELECT public.generate_recurring_invoices();

-- To test the send function manually:
-- SELECT public.send_recurring_invoice_email(
--   'invoice-id'::UUID,
--   'user-id'::UUID,
--   'client-id'::UUID
-- );

-- To unschedule the cron job:
-- SELECT cron.unschedule('generate-recurring-invoices-daily');

