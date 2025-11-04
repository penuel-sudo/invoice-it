-- ============================================
-- RECURRING INVOICES AUTO-GENERATION FUNCTION
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates the function that generates recurring invoices daily

-- 1. Create the function to generate recurring invoices
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
BEGIN
  -- Find all active recurring invoices due for generation today
  FOR recurring_record IN
    SELECT 
      r.*,
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
      
      -- Generate new invoice number
      -- Format: INV-YYYY-MM-####
      year_str := EXTRACT(YEAR FROM recurring_record.next_generation_date)::TEXT;
      month_str := LPAD(EXTRACT(MONTH FROM recurring_record.next_generation_date)::TEXT, 2, '0');
      
      -- Get sequence number (count of invoices generated this month for this user)
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '(\d+)$') AS INTEGER)), 0) + 1
      INTO sequence_num
      FROM public.invoices
      WHERE user_id = recurring_record.user_id
        AND invoice_number LIKE 'INV-' || year_str || '-' || month_str || '-%';
      
      new_invoice_number := 'INV-' || year_str || '-' || month_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
      
      -- Set dates
      new_issue_date := recurring_record.next_generation_date;
      new_due_date := new_issue_date + (recurring_record.invoice_snapshot->>'payment_terms_days')::INTEGER || ' days'::INTERVAL;
      
      -- Create new invoice (template is dynamic - from snapshot)
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
        template, -- Uses variable (dynamic)
        template_data, -- From snapshot
        template_settings, -- From snapshot
        currency_code,
        selected_payment_method_ids,
        recurring_invoice_id,
        created_at,
        updated_at
      ) VALUES (
        recurring_record.user_id,
        recurring_record.client_id,
        new_invoice_number,
        'pending', -- New invoices start as pending
        new_issue_date,
        new_due_date,
        (recurring_record.invoice_snapshot->>'subtotal')::NUMERIC,
        (recurring_record.invoice_snapshot->>'tax_amount')::NUMERIC,
        (recurring_record.invoice_snapshot->>'total_amount')::NUMERIC,
        recurring_record.invoice_snapshot->>'notes',
        invoice_template, -- Dynamic variable (not hardcoded)
        recurring_record.invoice_snapshot->'template_data',
        recurring_record.invoice_snapshot->'template_settings',
        recurring_record.invoice_snapshot->>'currency_code',
        ARRAY(SELECT jsonb_array_elements_text(recurring_record.invoice_snapshot->'selected_payment_method_ids')),
        recurring_record.id,
        NOW(),
        NOW()
      )
      RETURNING id INTO new_invoice_id;
      
      -- Create invoice items from snapshot
      FOR invoice_item IN
        SELECT * FROM jsonb_array_elements(recurring_record.items_snapshot) AS item
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
          invoice_item->>'description',
          (invoice_item->>'quantity')::NUMERIC,
          (invoice_item->>'unit_price')::NUMERIC,
          (invoice_item->>'tax_rate')::NUMERIC,
          (invoice_item->>'discount')::NUMERIC,
          (invoice_item->>'line_total')::NUMERIC,
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
      
      -- Auto-send email if enabled (trigger notification for email service)
      IF recurring_record.auto_send = true THEN
        PERFORM pg_notify('recurring_invoice_generated', json_build_object(
          'invoice_id', new_invoice_id,
          'user_id', recurring_record.user_id,
          'client_id', recurring_record.client_id,
          'template', invoice_template -- Pass template dynamically
        )::text);
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

-- 2. Schedule the cron job (runs daily at 2 AM UTC)
-- Note: Make sure pg_cron extension is enabled in Supabase
SELECT cron.schedule(
  'generate-recurring-invoices-daily',
  '0 2 * * *', -- 2 AM UTC daily
  $$SELECT public.generate_recurring_invoices()$$
);

-- ============================================
-- NOTES:
-- 1. The function runs daily at 2 AM UTC
-- 2. It generates invoices for all active recurring invoices where next_generation_date <= today
-- 3. Template is read dynamically from invoice_snapshot (not hardcoded)
-- 4. New invoices are created with status 'pending'
-- 5. If auto_send is enabled, it triggers a notification (you'll need to handle email sending)
-- 6. The function automatically calculates the next generation date based on frequency
-- ============================================

-- To test the function manually:
-- SELECT public.generate_recurring_invoices();

-- To unschedule the cron job:
-- SELECT cron.unschedule('generate-recurring-invoices-daily');

