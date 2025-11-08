-- ============================================
-- COMPLETE RECURRING INVOICES SETUP (PRODUCTION)
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This includes:
-- 1. Cron function for generating recurring invoices
-- 2. Cron function for sending emails (fire-and-forget, no timeout)
-- 3. Cron function for processing email responses
-- ============================================

-- ============================================
-- Step 1: Enable pg_net extension (for email sending)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_net;

GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;

-- ============================================
-- Step 2: Create pending_email_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS public.pending_email_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  request_id BIGINT NOT NULL,
  invoice_number TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_email_requests_processed 
ON public.pending_email_requests(processed, created_at) 
WHERE processed = FALSE;

-- Enable Row Level Security
ALTER TABLE public.pending_email_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_email_requests table
-- Users can only see their own pending email requests
CREATE POLICY "Users can view their own pending email requests"
ON public.pending_email_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own pending email requests (though this is mainly for system use)
CREATE POLICY "Users can create their own pending email requests"
ON public.pending_email_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending email requests
CREATE POLICY "Users can update their own pending email requests"
ON public.pending_email_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own pending email requests
CREATE POLICY "Users can delete their own pending email requests"
ON public.pending_email_requests
FOR DELETE
USING (auth.uid() = user_id);

-- Note: The functions use SECURITY DEFINER, so they bypass RLS and can access all records
-- This is necessary for the cron jobs to process all pending requests

-- ============================================
-- Step 3: Remove old functions (if exist)
-- ============================================

DROP FUNCTION IF EXISTS public.send_recurring_invoice_email(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.send_recurring_invoice_emails();

-- ============================================
-- Step 4: Cron Function for Generating Invoices
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
        'draft',  -- Auto-generated invoices start as draft (matches human workflow)
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
      
      -- Create notification that invoice was generated (if preference enabled)
      IF should_notify_created THEN
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          is_read,
          metadata
        ) VALUES (
          recurring_record.user_id,
          'info',
          'Invoice Generated',
          format('Invoice #%s was automatically generated', new_invoice_number),
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
-- Step 5: Email Sending Function (Fire-and-Forget)
-- ============================================

CREATE OR REPLACE FUNCTION public.send_recurring_invoice_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invoice_record RECORD;
  client_record RECORD;
  user_profile RECORD;
  user_email TEXT;
  request_id BIGINT;
  api_url TEXT;
  invoice_data JSONB;
  user_data JSONB;
  currency_symbol TEXT;
  currency_code TEXT;
BEGIN
  -- Set your API URL (same as frontend uses)
  api_url := 'https://invoice-it.org/api/send-invoice-email';

  -- Find all draft invoices created by recurring invoices with auto_send = true
  FOR invoice_record IN
    SELECT 
      i.id as invoice_id,
      i.user_id,
      i.client_id,
      i.invoice_number,
      i.issue_date,
      i.due_date,
      i.subtotal,
      i.tax_amount,
      i.total_amount,
      i.notes,
      i.template,
      i.template_data,
      i.template_settings,
      i.currency_code,
      i.recurring_invoice_id
    FROM public.invoices i
    INNER JOIN public.recurring_invoices r ON r.id = i.recurring_invoice_id
    WHERE i.recurring_invoice_id IS NOT NULL
      AND i.status = 'draft'
      AND r.auto_send = true
      AND r.status = 'active'
  LOOP
    BEGIN
      -- Fetch client data (for email)
      SELECT email, name, company_name
      INTO client_record
      FROM public.clients
      WHERE id = invoice_record.client_id;

      IF NOT FOUND OR client_record.email IS NULL THEN
        RAISE WARNING 'Client % not found or has no email for invoice %', invoice_record.client_id, invoice_record.invoice_id;
        -- Skip this invoice, continue with next
        CONTINUE;
      END IF;

      -- Fetch user profile data and email
      SELECT 
        p.full_name, 
        p.company_name,
        u.email
      INTO user_profile
      FROM public.profiles p
      INNER JOIN auth.users u ON u.id = p.id
      WHERE p.id = invoice_record.user_id;

      -- Get user email (fallback to a default if not found)
      user_email := COALESCE(user_profile.email, 'invoices@mail.invoice-it.org');

      -- Get currency code and determine symbol
      currency_code := COALESCE(invoice_record.currency_code, 'USD');
      currency_symbol := CASE currency_code
        WHEN 'USD' THEN '$'
        WHEN 'EUR' THEN '€'
        WHEN 'GBP' THEN '£'
        WHEN 'NGN' THEN '₦'
        WHEN 'CAD' THEN 'C$'
        WHEN 'AUD' THEN 'A$'
        WHEN 'JPY' THEN '¥'
        WHEN 'INR' THEN '₹'
        WHEN 'ZAR' THEN 'R'
        ELSE '$'
      END;

      -- Build invoice data for API (same format as frontend)
      invoice_data := jsonb_build_object(
        'invoiceNumber', invoice_record.invoice_number,
        'issueDate', invoice_record.issue_date,
        'dueDate', invoice_record.due_date,
        'subtotal', invoice_record.subtotal,
        'taxAmount', invoice_record.tax_amount,
        'total', invoice_record.total_amount,
        'grandTotal', invoice_record.total_amount,
        'currencyCode', currency_code,
        'currencySymbol', currency_symbol,
        'notes', COALESCE(invoice_record.notes, ''),
        'clientName', client_record.name,
        'clientEmail', client_record.email,
        'template', COALESCE(invoice_record.template, 'default'),
        'templateData', COALESCE(invoice_record.template_data, '{}'::jsonb),
        'templateSettings', COALESCE(invoice_record.template_settings, '{}'::jsonb)
      );

      -- Build user data for API (same format as frontend)
      user_data := jsonb_build_object(
        'id', invoice_record.user_id,
        'fullName', COALESCE(user_profile.full_name, ''),
        'businessName', COALESCE(user_profile.company_name, ''),
        'email', user_email
      );

      -- Fire HTTP request (doesn't wait for response)
      BEGIN
        SELECT net.http_post(
          url := api_url,
          body := jsonb_build_object(
            'to', client_record.email,
            'invoiceData', invoice_data,
            'userData', user_data,
            'clientName', client_record.name,
            'greetingMessage', NULL,
            'businessName', COALESCE(user_profile.company_name, NULL),
            'userEmail', user_email
          ),
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          timeout_milliseconds := 30000  -- 30 seconds
        ) INTO request_id;

        -- Store request for later processing
        INSERT INTO public.pending_email_requests (
          invoice_id,
          user_id,
          client_id,
          request_id,
          invoice_number,
          client_email,
          client_name,
          created_at
        ) VALUES (
          invoice_record.invoice_id,
          invoice_record.user_id,
          invoice_record.client_id,
          request_id,
          invoice_record.invoice_number,
          client_record.email,
          client_record.name,
          NOW()
        );

        -- Update invoice to 'sending' status (temporary state)
        UPDATE public.invoices
        SET status = 'sending', updated_at = NOW()
        WHERE id = invoice_record.invoice_id;

      EXCEPTION WHEN OTHERS THEN
        -- HTTP call failed - create error notification immediately
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          is_read,
          metadata
        ) VALUES (
          invoice_record.user_id,
          'error',
          'Auto-send Failed',
          format('Failed to queue email for invoice #%s: %s', invoice_record.invoice_number, SQLERRM),
          false,
          jsonb_build_object(
            'invoice_id', invoice_record.invoice_id,
            'invoice_number', invoice_record.invoice_number,
            'client_id', invoice_record.client_id,
            'error', SQLERRM
          )
        );
      END;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with next invoice
      RAISE WARNING 'Error queuing email for invoice %: %', invoice_record.invoice_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================
-- Step 6: Email Response Processing Function
-- ============================================

CREATE OR REPLACE FUNCTION public.process_email_responses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_record RECORD;
  response_record RECORD;
  email_response JSONB;
  notification_prefs JSONB;
  should_notify BOOLEAN;
BEGIN
  -- Process pending email requests (only recent ones, within last hour)
  FOR pending_record IN
    SELECT * FROM public.pending_email_requests
    WHERE processed = FALSE
      AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Check if response is available
      SELECT status_code, content
      INTO response_record
      FROM net._http_response
      WHERE id = pending_record.request_id;

      IF FOUND AND response_record.status_code IS NOT NULL THEN
        -- We have a response, process it
        
        -- Get user notification preferences
        SELECT notification_preferences
        INTO notification_prefs
        FROM public.profiles
        WHERE id = pending_record.user_id;
        
        notification_prefs := COALESCE(notification_prefs, '{"enabled": true, "invoice_sent": true}'::jsonb);
        should_notify := COALESCE((notification_prefs->>'enabled')::boolean, true) 
                         AND COALESCE((notification_prefs->>'invoice_sent')::boolean, true);

        -- Parse response
        IF response_record.status_code = 200 THEN
          BEGIN
            email_response := response_record.content::jsonb;
          EXCEPTION WHEN OTHERS THEN
            email_response := jsonb_build_object('success', false, 'message', response_record.content);
          END;
        ELSE
          email_response := jsonb_build_object(
            'error', response_record.content,
            'success', false
          );
        END IF;

        -- Check if email was sent successfully
        IF response_record.status_code = 200 AND (
          (email_response->>'success')::boolean = true OR
          (email_response->>'messageId') IS NOT NULL OR
          (email_response->>'id') IS NOT NULL
        ) THEN
          -- Email sent successfully - update invoice status to 'pending'
          UPDATE public.invoices
          SET status = 'pending', updated_at = NOW()
          WHERE id = pending_record.invoice_id;

          -- Create success notification (if preference enabled)
          IF should_notify THEN
            INSERT INTO public.notifications (
              user_id,
              type,
              title,
              message,
              is_read,
              metadata
            ) VALUES (
              pending_record.user_id,
              'success',
              'Invoice Sent',
              format('Invoice #%s sent to %s', pending_record.invoice_number, pending_record.client_email),
              false,
              jsonb_build_object(
                'invoice_id', pending_record.invoice_id,
                'invoice_number', pending_record.invoice_number,
                'client_id', pending_record.client_id,
                'client_name', pending_record.client_name,
                'client_email', pending_record.client_email,
                'auto_sent', true
              )
            );
          END IF;
        ELSE
          -- Email failed - update invoice back to draft
          UPDATE public.invoices
          SET status = 'draft', updated_at = NOW()
          WHERE id = pending_record.invoice_id;

          -- Create error notification (always create errors)
          INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            is_read,
            metadata
          ) VALUES (
            pending_record.user_id,
            'error',
            'Auto-send Failed',
            format('Failed to send invoice #%s: HTTP %s - %s', 
              pending_record.invoice_number, 
              response_record.status_code,
              COALESCE(email_response->>'error', response_record.content, 'Unknown error')
            ),
            false,
            jsonb_build_object(
              'invoice_id', pending_record.invoice_id,
              'invoice_number', pending_record.invoice_number,
              'client_id', pending_record.client_id,
              'http_status_code', response_record.status_code,
              'http_content', response_record.content,
              'api_response', email_response,
              'error', COALESCE(email_response->>'error', response_record.content, 'Request failed')
            )
          );
        END IF;

        -- Mark as processed
        UPDATE public.pending_email_requests
        SET processed = TRUE, processed_at = NOW()
        WHERE id = pending_record.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with next request
      RAISE WARNING 'Error processing email response for invoice %: %', pending_record.invoice_id, SQLERRM;
    END;
  END LOOP;

  -- Clean up old processed requests (older than 24 hours)
  DELETE FROM public.pending_email_requests
  WHERE processed = TRUE
    AND processed_at < NOW() - INTERVAL '24 hours';

  -- Handle stale requests (older than 1 hour, still not processed)
  FOR pending_record IN
    SELECT * FROM public.pending_email_requests
    WHERE processed = FALSE
      AND created_at <= NOW() - INTERVAL '1 hour'
  LOOP
    BEGIN
      -- Update invoice back to draft
      UPDATE public.invoices
      SET status = 'draft', updated_at = NOW()
      WHERE id = pending_record.invoice_id;

      -- Create timeout notification
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        metadata
      ) VALUES (
        pending_record.user_id,
        'error',
        'Auto-send Timeout',
        format('Email sending timed out for invoice #%s', pending_record.invoice_number),
        false,
        jsonb_build_object(
          'invoice_id', pending_record.invoice_id,
          'invoice_number', pending_record.invoice_number,
          'client_id', pending_record.client_id,
          'error', 'Request timed out after 1 hour'
        )
      );

      -- Mark as processed
      UPDATE public.pending_email_requests
      SET processed = TRUE, processed_at = NOW()
      WHERE id = pending_record.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error handling timeout for invoice %: %', pending_record.invoice_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================
-- Step 7: Schedule the Cron Jobs (PRODUCTION)
-- ============================================

-- Cron Job 1: Generate Invoices (runs daily at 2 AM UTC)
-- This checks all recurring invoices and generates those due today
-- Works for all frequencies: daily, weekly, monthly, quarterly, yearly
SELECT cron.schedule(
  'generate-recurring-invoices-daily',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$SELECT public.generate_recurring_invoices()$$
);

-- Cron Job 2: Send Emails (runs every 5 minutes)
-- Finds draft invoices with auto_send = true and queues them
SELECT cron.schedule(
  'send-recurring-invoice-emails',
  '*/5 * * * *', -- Every 5 minutes
  $$SELECT public.send_recurring_invoice_emails()$$
);

-- Cron Job 3: Process Email Responses (runs every 5 minutes)
-- Checks for responses and updates invoice status accordingly
SELECT cron.schedule(
  'process-email-responses',
  '*/5 * * * *', -- Every 5 minutes
  $$SELECT public.process_email_responses()$$
);

-- ============================================
-- NOTES:
-- ============================================
-- 1. Invoice generation runs daily at 2 AM UTC
--    - Checks all recurring invoices and generates those due today
--    - Works for all frequencies (daily, weekly, monthly, quarterly, yearly)
-- 2. Email sending runs every 5 minutes (fire-and-forget, no timeout issues)
-- 3. A separate function processes email responses every 5 minutes
-- 4. Invoices go through states: draft → sending → pending (success) or draft (failure)
-- 5. The pending_email_requests table tracks all email requests
-- 6. Stale requests (>1 hour old) are automatically handled with timeout notifications
-- 7. User notification preferences are respected for success notifications
-- 8. Error notifications are always created (important for user awareness)
-- 9. Reply-to email is set to the business owner's email (from auth.users)
-- 10. Currency symbol is dynamically determined from invoice currency_code
-- ============================================

-- To test invoice generation manually:
-- SELECT public.generate_recurring_invoices();

-- To test email sending manually:
-- SELECT public.send_recurring_invoice_emails();

-- To test email response processing manually:
-- SELECT public.process_email_responses();

-- To view pending email requests:
-- SELECT * FROM public.pending_email_requests WHERE processed = FALSE;

-- To unschedule the cron jobs:
-- SELECT cron.unschedule('generate-recurring-invoices-daily');
-- SELECT cron.unschedule('send-recurring-invoice-emails');
-- SELECT cron.unschedule('process-email-responses');

