-- ============================================
-- RECURRING INVOICES AUTO-SEND FUNCTION
-- ============================================
-- This creates a function that sends emails and creates notifications
-- for auto-generated recurring invoices
-- 
-- REQUIREMENTS:
-- 1. Enable pg_net extension in Supabase (for HTTP calls)
-- 2. Set your email API endpoint URL in environment variables or hardcode
-- 3. This function will be called by the cron job after generating invoices
-- ============================================

-- Enable pg_net extension (run this first in Supabase SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send email and create notification for auto-generated invoice
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
BEGIN
  -- Get email API URL from environment or use default
  -- You can set this in Supabase: Settings > Database > Connection Pooling
  -- Or hardcode your API endpoint URL here
  email_api_url := COALESCE(
    current_setting('app.email_api_url', true),
    'https://your-app-domain.vercel.app/api/send-invoice-email' -- UPDATE THIS WITH YOUR API URL
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
    -- Still create notification that email failed
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      status,
      metadata
    ) VALUES (
      p_user_id,
      'error',
      'Auto-send Failed',
      'Failed to send invoice: Client email not found',
      'pending',
      jsonb_build_object(
        'invoice_id', p_invoice_id,
        'client_id', p_client_id,
        'error', 'client_email_missing'
      )
    );
    RETURN;
  END IF;

  client_email := client_record.email;

  -- Fetch user profile data
  SELECT full_name, company_name
  INTO user_profile
  FROM public.profiles
  WHERE id = p_user_id;

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
  -- Note: This requires pg_net extension to be enabled
  BEGIN
    SELECT content::jsonb INTO email_response
    FROM net.http_post(
      url := email_api_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'to', client_email,
        'invoiceData', invoice_data,
        'userData', user_data,
        'clientName', client_record.name,
        'greetingMessage', NULL,
        'businessName', user_profile.company_name
      )::text
    );

    -- Check if email was sent successfully
    IF email_response->>'statusCode' = '200' OR (email_response->>'success')::boolean = true THEN
      -- Email sent successfully - create success notification
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        status,
        metadata
      ) VALUES (
        p_user_id,
        'success',
        'Invoice Sent',
        format('Invoice #%s sent to %s', invoice_record.invoice_number, client_email),
        'pending',
        jsonb_build_object(
          'invoice_id', p_invoice_id,
          'invoice_number', invoice_record.invoice_number,
          'client_id', p_client_id,
          'client_name', client_record.name,
          'client_email', client_email,
          'auto_sent', true
        )
      );
    ELSE
      -- Email failed - create error notification
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        status,
        metadata
      ) VALUES (
        p_user_id,
        'error',
        'Auto-send Failed',
        format('Failed to send invoice #%s: %s', invoice_record.invoice_number, COALESCE(email_response->>'error', 'Unknown error')),
        'pending',
        jsonb_build_object(
          'invoice_id', p_invoice_id,
          'invoice_number', invoice_record.invoice_number,
          'client_id', p_client_id,
          'error', email_response
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- HTTP call failed - create error notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      status,
      metadata
    ) VALUES (
      p_user_id,
      'error',
      'Auto-send Failed',
      format('Failed to send invoice #%s: %s', invoice_record.invoice_number, SQLERRM),
      'pending',
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
-- ALTERNATIVE: Use Supabase Edge Function
-- ============================================
-- If you prefer to use Supabase Edge Functions instead of HTTP calls:
-- 1. Create an Edge Function that handles email sending and notifications
-- 2. Call it from the cron function using supabase.functions.invoke()
-- 
-- Example Edge Function call:
-- SELECT supabase.functions.invoke(
--   'send-recurring-invoice-email',
--   jsonb_build_object(
--     'invoice_id', p_invoice_id,
--     'user_id', p_user_id,
--     'client_id', p_client_id
--   )
-- );
-- ============================================

