# Fix: Recurring Invoice Template Settings

## Issues Fixed

1. **Template Settings Not Fully Preserved**: The snapshot was not deep-cloning the `template_settings` structure, which could cause nested objects to be lost or corrupted.

2. **Cron Function Missing Null Checks**: The cron function wasn't handling cases where `template_settings` might be missing from the snapshot.

## Changes Made

### 1. Frontend Fix: `src/lib/recurring/recurringService.ts`

**Before:**
```typescript
template_settings: invoice.template_settings || null,
```

**After:**
```typescript
// Deep copy template_settings to ensure full structure is preserved
const templateSettings = invoice.template_settings 
  ? JSON.parse(JSON.stringify(invoice.template_settings)) // Deep clone
  : null

template_settings: templateSettings, // Full structure with nested template_settings
```

**Why:** This ensures the complete nested structure (including `template_settings.template_settings`) is preserved when creating the snapshot.

### 2. Database Fix: `database/COMPLETE_RECURRING_SETUP.sql`

**Before:**
```sql
recurring_record.invoice_snapshot->'template_settings',
```

**After:**
```sql
COALESCE(recurring_record.invoice_snapshot->'template_settings', '{}'::jsonb), -- Preserves full nested structure
```

**Why:** 
- Added `COALESCE` to handle null values gracefully
- Ensures the JSONB structure is properly extracted and preserved
- Falls back to empty JSONB object if missing (prevents errors)

## How to Test

### Step 1: Update Existing Recurring Invoices (if needed)

If you have existing recurring invoices with incomplete `template_settings`, you can fix them:

```sql
-- Fix a specific recurring invoice's snapshot
UPDATE recurring_invoices
SET invoice_snapshot = jsonb_set(
  invoice_snapshot,
  '{template_settings}',
  (SELECT template_settings FROM invoices WHERE id = base_invoice_id)::jsonb
)
WHERE id = 'your-recurring-id'::UUID;
```

### Step 2: Test Manual Generation

1. Set a recurring invoice's `next_generation_date` to today:
```sql
UPDATE recurring_invoices
SET next_generation_date = CURRENT_DATE
WHERE id = 'your-recurring-id'::UUID
  AND status = 'active';
```

2. Run the function manually:
```sql
SELECT public.generate_recurring_invoices();
```

3. Check the generated invoice:
```sql
SELECT 
  i.id,
  i.invoice_number,
  i.template,
  -- Check if template_settings has full structure
  i.template_settings->>'company_name' as company_name,
  i.template_settings->>'primary_color' as primary_color,
  i.template_settings->'template_settings'->>'show_logo' as show_logo,
  -- Full structure
  jsonb_pretty(i.template_settings) as full_template_settings
FROM invoices i
WHERE i.recurring_invoice_id = 'your-recurring-id'::UUID
  AND i.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY i.created_at DESC;
```

### Step 3: Verify Template Settings Structure

The generated invoice should have:
```json
{
  "company_name": "...",
  "website": "...",
  "tax_id": "...",
  "tagline": "...",
  "primary_color": "...",
  "accent_color": "...",
  "font_family": "...",
  "background_colors": {
    "main_background": "...",
    "card_background": "...",
    "section_background": "...",
    "header_background": "...",
    "form_background": "..."
  },
  "template_settings": {
    "show_logo": true,
    "show_tagline": true,
    "show_website": true,
    "show_tax_id": true,
    "show_registration": true
  }
}
```

## Complete Test Script

See `database/TEST_RECURRING_FUNCTION.sql` for a complete testing script with all steps.

## What to Do Next

1. **Update the cron function** in Supabase:
   - Run the updated `COMPLETE_RECURRING_SETUP.sql` file
   - This will update the `generate_recurring_invoices()` function

2. **Test manually** using the test script

3. **Fix existing recurring invoices** (if needed) using the UPDATE query above

4. **Verify** that new invoices generated have the complete `template_settings` structure

## Troubleshooting

### If template_settings is still missing:

1. **Check the base invoice** has template_settings:
```sql
SELECT id, invoice_number, template_settings 
FROM invoices 
WHERE id = 'base-invoice-id'::UUID;
```

2. **Check the recurring invoice snapshot**:
```sql
SELECT 
  id,
  invoice_snapshot->>'template_settings' as has_template_settings,
  jsonb_pretty(invoice_snapshot->'template_settings') as template_settings_preview
FROM recurring_invoices 
WHERE id = 'recurring-id'::UUID;
```

3. **Check Postgres logs** in Supabase for any errors during generation

### If the function isn't running:

1. **Check if cron is scheduled**:
```sql
SELECT * FROM cron.job WHERE jobname = 'generate-recurring-invoices-daily';
```

2. **Reschedule if needed**:
```sql
SELECT cron.unschedule('generate-recurring-invoices-daily');
SELECT cron.schedule(
  'generate-recurring-invoices-daily',
  '0 2 * * *',
  $$SELECT public.generate_recurring_invoices()$$
);
```

## Notes

- The snapshot now preserves the **complete** `template_settings` structure
- The cron function now handles missing/null values gracefully
- All nested objects (including `template_settings.template_settings`) are preserved
- The function will work correctly even if some fields are missing

