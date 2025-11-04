# Invoice Number Format Update

## Issue
Auto-generated recurring invoices were using a hardcoded format (`INV-YYYY-MM-####`) instead of matching the base invoice's format.

## Solution
The cron function now detects the format of the base invoice number and generates new invoice numbers using the same format.

## Supported Formats

### 1. Professional Template Format
**Pattern:** `INV-{timestamp}` (e.g., `INV-706319`)
- Detects: Base invoice starts with `INV-` followed by digits only
- Generates: New timestamp-based number using last 6 digits of current timestamp

### 2. Default Template Format
**Pattern:** `YYYYMMDD-{timestamp}` (e.g., `20241225-123456`)
- Detects: Base invoice matches pattern `^\d{8}-\d+$`
- Generates: Date part from generation date (YYYYMMDD) + timestamp part (last 6 digits)

### 3. Old Pattern Format (Legacy)
**Pattern:** `INV-YYYY-MM-####` (e.g., `INV-2024-12-0001`)
- Detects: Base invoice matches pattern `INV-%-%-%`
- Generates: Sequential number based on month and year

### 4. Fallback
**Pattern:** `INV-{timestamp}`
- Used when format cannot be detected
- Same as Professional format

## How It Works

1. **Read Base Invoice Number**: Gets `base_invoice_number` from the `invoice_snapshot` JSONB
2. **Detect Format**: Uses pattern matching to identify the format type
3. **Generate New Number**: Creates a new invoice number using the same format pattern

## Code Changes

### Before:
```sql
-- Hardcoded format
new_invoice_number := 'INV-' || year_str || '-' || month_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
```

### After:
```sql
-- Detect format from base invoice
base_invoice_num := recurring_record.invoice_snapshot->>'base_invoice_number';

IF base_invoice_num LIKE 'INV-%' AND base_invoice_num ~ '^INV-\d+$' THEN
  -- Professional format: INV-{timestamp}
  timestamp_part := SUBSTRING(FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT FROM '\d{6}$');
  new_invoice_number := 'INV-' || timestamp_part;
ELSIF base_invoice_num ~ '^\d{8}-\d+$' THEN
  -- Default format: YYYYMMDD-{timestamp}
  date_part := TO_CHAR(recurring_record.next_generation_date, 'YYYYMMDD');
  timestamp_part := SUBSTRING(FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT FROM '\d{6}$');
  new_invoice_number := date_part || '-' || timestamp_part;
-- ... other formats
END IF;
```

## Testing

### Test Professional Format
```sql
-- Base invoice: INV-706319
-- Should generate: INV-{new_timestamp}
```

### Test Default Format
```sql
-- Base invoice: 20241225-123456
-- Should generate: {YYYYMMDD}-{new_timestamp}
```

### Test Manual Generation
1. Set `next_generation_date` to today:
```sql
UPDATE recurring_invoices
SET next_generation_date = CURRENT_DATE
WHERE id = 'your-recurring-id'::UUID;
```

2. Run the function:
```sql
SELECT public.generate_recurring_invoices();
```

3. Check generated invoice number:
```sql
SELECT 
  invoice_number,
  template,
  created_at
FROM invoices
WHERE recurring_invoice_id = 'your-recurring-id'::UUID
  AND created_at >= NOW() - INTERVAL '5 minutes';
```

## Notes

- The function automatically detects the format from the base invoice number
- Each generated invoice uses a unique timestamp to ensure uniqueness
- The format is preserved across all recurring generations
- No manual configuration needed - it works automatically

