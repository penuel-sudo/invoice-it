-- ============================================
-- TEST RECURRING INVOICE GENERATION
-- ============================================
-- Use this SQL to test and debug the recurring invoice generation
-- Run each section step by step

-- ============================================
-- Step 1: Check if you have active recurring invoices
-- ============================================
SELECT 
  r.id as recurring_id,
  r.status,
  r.next_generation_date,
  r.auto_create,
  r.auto_send,
  r.frequency,
  r.total_generated_count,
  i.invoice_number as base_invoice_number,
  i.template,
  i.currency_code,
  -- Check if template_settings exists and has structure
  CASE 
    WHEN r.invoice_snapshot->>'template_settings' IS NULL THEN 'MISSING template_settings'
    WHEN r.invoice_snapshot->'template_settings'->>'template_settings' IS NULL THEN 'MISSING nested template_settings'
    ELSE 'OK - Has full structure'
  END as template_settings_status,
  -- Show template_settings structure
  r.invoice_snapshot->'template_settings' as template_settings_preview
FROM recurring_invoices r
JOIN invoices i ON i.id = r.base_invoice_id
WHERE r.status = 'active'
ORDER BY r.created_at DESC
LIMIT 5;

-- ============================================
-- Step 2: Check a specific recurring invoice's snapshot
-- ============================================
-- Replace 'your-recurring-id' with an actual recurring invoice ID
SELECT 
  id,
  invoice_snapshot->>'template' as template,
  invoice_snapshot->>'template_settings' as template_settings_full,
  invoice_snapshot->'template_settings'->>'company_name' as company_name,
  invoice_snapshot->'template_settings'->>'primary_color' as primary_color,
  invoice_snapshot->'template_settings'->'template_settings'->>'show_logo' as show_logo,
  invoice_snapshot->'template_settings'->'background_colors'->>'main_background' as main_bg,
  invoice_snapshot->>'currency_code' as currency,
  invoice_snapshot->>'base_invoice_number' as base_invoice,
  next_generation_date,
  status,
  auto_create,
  auto_send
FROM recurring_invoices
WHERE id = 'your-recurring-id'::UUID; -- Replace with actual ID

-- ============================================
-- Step 3: Set next_generation_date to today (for testing)
-- ============================================
-- Replace 'your-recurring-id' with an actual recurring invoice ID
UPDATE recurring_invoices
SET next_generation_date = CURRENT_DATE
WHERE id = 'your-recurring-id'::UUID
  AND status = 'active';

-- ============================================
-- Step 4: Run the generation function manually
-- ============================================
SELECT public.generate_recurring_invoices();

-- ============================================
-- Step 5: Check if new invoices were generated
-- ============================================
SELECT 
  i.id,
  i.invoice_number,
  i.template,
  i.status,
  i.created_at,
  i.currency_code,
  -- Check template_settings in generated invoice
  CASE 
    WHEN i.template_settings IS NULL THEN 'MISSING template_settings'
    WHEN i.template_settings->>'template_settings' IS NULL THEN 'MISSING nested template_settings'
    ELSE 'OK - Has full structure'
  END as template_settings_status,
  i.template_settings->>'company_name' as company_name,
  i.template_settings->>'primary_color' as primary_color,
  i.template_settings->'template_settings'->>'show_logo' as show_logo,
  i.recurring_invoice_id,
  c.name as client_name
FROM invoices i
JOIN clients c ON c.id = i.client_id
WHERE i.recurring_invoice_id IS NOT NULL
  AND i.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY i.created_at DESC;

-- ============================================
-- Step 6: Check if recurring invoice was updated
-- ============================================
SELECT 
  id,
  next_generation_date,
  total_generated_count,
  last_generated_at,
  status,
  updated_at
FROM recurring_invoices
WHERE id = 'your-recurring-id'::UUID; -- Replace with actual ID

-- ============================================
-- Step 7: Compare base invoice vs generated invoice template_settings
-- ============================================
-- This shows the original vs generated template_settings structure
SELECT 
  'BASE INVOICE' as source,
  i.id,
  i.invoice_number,
  i.template,
  i.template_settings->>'company_name' as company_name,
  i.template_settings->>'primary_color' as primary_color,
  i.template_settings->'template_settings'->>'show_logo' as show_logo,
  jsonb_pretty(i.template_settings) as full_template_settings
FROM invoices i
WHERE i.id = (SELECT base_invoice_id FROM recurring_invoices WHERE id = 'your-recurring-id'::UUID)

UNION ALL

SELECT 
  'GENERATED INVOICE' as source,
  i.id,
  i.invoice_number,
  i.template,
  i.template_settings->>'company_name' as company_name,
  i.template_settings->>'primary_color' as primary_color,
  i.template_settings->'template_settings'->>'show_logo' as show_logo,
  jsonb_pretty(i.template_settings) as full_template_settings
FROM invoices i
WHERE i.recurring_invoice_id = 'your-recurring-id'::UUID
  AND i.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY source, created_at DESC;

-- ============================================
-- Step 8: Check notifications
-- ============================================
SELECT 
  id,
  type,
  title,
  message,
  created_at,
  metadata
FROM notifications
WHERE created_at >= NOW() - INTERVAL '5 minutes'
  AND (
    metadata->>'auto_generated' = 'true'
    OR metadata->>'auto_sent' = 'true'
    OR metadata->>'recurring_invoice_id' IS NOT NULL
  )
ORDER BY created_at DESC;

-- ============================================
-- TROUBLESHOOTING:
-- ============================================
-- If template_settings is missing:
-- 1. Check if the base invoice has template_settings:
--    SELECT id, invoice_number, template_settings FROM invoices WHERE id = 'base-invoice-id'::UUID;
--
-- 2. If base invoice has template_settings but snapshot doesn't, the snapshot creation might have failed
--    Check the recurring_invoices table:
--    SELECT id, invoice_snapshot->>'template_settings' FROM recurring_invoices WHERE id = 'recurring-id'::UUID;
--
-- 3. If snapshot has template_settings but generated invoice doesn't, the cron function might have an issue
--    Check the cron function logs in Supabase Postgres Logs
--
-- 4. To manually fix a recurring invoice snapshot:
--    UPDATE recurring_invoices
--    SET invoice_snapshot = jsonb_set(
--      invoice_snapshot,
--      '{template_settings}',
--      (SELECT template_settings FROM invoices WHERE id = base_invoice_id)::jsonb
--    )
--    WHERE id = 'recurring-id'::UUID;

