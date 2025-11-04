# Recurring Invoices - Complete System Explanation

## Overview
This document explains how the recurring invoice system works end-to-end: from frontend setup, data storage, to backend auto-generation, and how it creates invoices exactly as if a human created them.

---

## 1. Frontend: Data Source & Display

### Invoice Number Display

**Source**: The invoice number shown in the recurring list comes from **the original base invoice** (the invoice that was set as recurring).

**How it works:**

1. **Database Query** (`getRecurringInvoices` in `recurringService.ts`):
   ```typescript
   invoices!recurring_invoices_base_invoice_id_fkey (
     invoice_number,
     currency_code  // ← ALSO FETCHED NOW
   )
   ```
   - Joins `recurring_invoices` table with `invoices` table
   - Uses foreign key: `base_invoice_id` → `invoices.id`
   - Fetches both `invoice_number` AND `currency_code` from the original invoice

2. **Display Logic** (Line 311 in `RecurringInvoicesPage.tsx`):
   ```typescript
   const baseInvoiceNumber = (invoice as any).invoices?.invoice_number || 
                             invoiceSnapshot.base_invoice_number || 
                             'N/A'
   ```
   - **First priority**: Gets from joined `invoices` table (direct from database)
   - **Second priority**: Falls back to `invoiceSnapshot.base_invoice_number` (stored when creating recurring)
   - **Final fallback**: Shows 'N/A'

**Answer**: Yes, the invoice number comes from the main transaction invoice item (the base invoice that was set as recurring).

---

### Currency Symbol Display (FIXED)

**Source**: The currency symbol now comes from **the original base invoice's currency_code** directly from the database, NOT from the snapshot.

**How it works:**

1. **Database Query** (Updated):
   ```typescript
   invoices!recurring_invoices_base_invoice_id_fkey (
     invoice_number,
     currency_code  // ← NOW FETCHED FROM BASE INVOICE
   )
   ```

2. **Display Logic** (Line 308 in `RecurringInvoicesPage.tsx`):
   ```typescript
   // Get currency_code from joined base invoice (preferred) or fallback to snapshot
   const currencyCode = (invoice as any).invoices?.currency_code || 
                        invoiceSnapshot.currency_code || 
                        'USD'
   const currencySymbol = getCurrencySymbol(currencyCode)
   ```
   - **First priority**: Gets from joined `invoices` table (direct from database - the actual invoice's currency)
   - **Second priority**: Falls back to `invoiceSnapshot.currency_code` (stored when creating recurring)
   - **Final fallback**: Shows 'USD'

**This matches TransactionPage behavior**:
- TransactionPage uses: `formatAmount(transaction.total_amount, transaction.type, transaction.currency_code)`
- Where `transaction.currency_code` comes directly from the `invoices` table
- Now RecurringInvoicesPage does the same - gets currency directly from the base invoice

**Answer**: Currency symbol is now dynamically retrieved from the main transaction invoice item's currency_code (just like TransactionPage), NOT hardcoded.

---

## 2. Backend: How Cron Creates Invoices (Like a Human)

### Complete Invoice Recreation Process

The cron function (`generate_recurring_invoices()`) creates new invoices **exactly as if a human created them** by:

1. **Using the Original Invoice as Blueprint**
   - Fetches the `recurring_invoices` record
   - Gets ALL data from `invoice_snapshot` JSONB field
   - Gets ALL items from `items_snapshot` JSONB field

2. **Template Type (Dynamic)**
   ```sql
   invoice_template := recurring_record.invoice_snapshot->>'template';
   -- Could be 'default' or 'professional' or any future template
   ```
   - Reads template type from snapshot (not hardcoded)
   - Supports any template type (default, professional, future templates)

3. **Template Customization (Professional Template)**
   ```sql
   template_data, -- From snapshot (contains all customization)
   template_settings, -- From snapshot (template-specific settings)
   ```
   - **`template_data`**: Stores all invoice customization data (colors, fonts, layout, etc.)
   - **`template_settings`**: Stores template-specific settings (logo, company info, etc.)
   - Both are stored as JSONB, preserving all customization
   - When creating new invoice, these are copied exactly as stored

4. **Client Information**
   ```sql
   client_id, -- From recurring_record.client_id
   ```
   - Uses the same client from the recurring setup
   - Links to the correct client record

5. **Currency**
   ```sql
   currency_code, -- From snapshot
   ```
   - Gets currency from `invoice_snapshot.currency_code`
   - Preserves the original invoice's currency (EUR, USD, GBP, etc.)

6. **Invoice Items**
   ```sql
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
     ) VALUES (...)
   END LOOP;
   ```
   - Recreates ALL items from the original invoice
   - Preserves descriptions, quantities, prices, taxes, discounts

7. **Amounts**
   ```sql
   subtotal, -- From snapshot
   tax_amount, -- From snapshot
   total_amount, -- From snapshot
   ```
   - Uses the same amounts from the original invoice

8. **Payment Methods**
   ```sql
   selected_payment_method_ids, -- From snapshot
   ```
   - Preserves the payment methods selected in the original invoice

9. **Notes**
   ```sql
   notes, -- From snapshot
   ```
   - Copies any notes from the original invoice

10. **Dates**
    ```sql
    issue_date := recurring_record.next_generation_date;
    due_date := new_issue_date + payment_terms_days;
    ```
    - Issue date = next generation date
    - Due date = issue date + payment terms days (from original invoice)

11. **Invoice Number**
    ```sql
    new_invoice_number := 'INV-' || year_str || '-' || month_str || '-' || sequence_num;
    ```
    - Generates a new unique invoice number
    - Format: `INV-YYYY-MM-####`

12. **Status**
    ```sql
    status := 'pending'; -- New invoices start as pending
    ```
    - New invoices are created with status 'pending'
    - Same as when a human creates a new invoice

---

### Complete SQL Flow (Cron Function)

```sql
1. FIND RECURRING INVOICES DUE TODAY
   WHERE status = 'active'
     AND next_generation_date <= CURRENT_DATE
     AND auto_create = true

2. FOR EACH RECURRING INVOICE:
   
   a. GET TEMPLATE TYPE
      invoice_template := invoice_snapshot->>'template'
   
   b. GENERATE NEW INVOICE NUMBER
      Format: INV-YYYY-MM-####
   
   c. CREATE NEW INVOICE
      INSERT INTO invoices (
        user_id,                    -- From recurring_record
        client_id,                  -- From recurring_record (same client)
        invoice_number,             -- New unique number
        status,                     -- 'pending'
        issue_date,                  -- next_generation_date
        due_date,                    -- issue_date + payment_terms_days
        subtotal,                    -- From snapshot
        tax_amount,                  -- From snapshot
        total_amount,                -- From snapshot
        notes,                       -- From snapshot
        template,                    -- From snapshot (dynamic)
        template_data,               -- From snapshot (ALL customization)
        template_settings,           -- From snapshot (template-specific)
        currency_code,              -- From snapshot (EUR, USD, etc.)
        selected_payment_method_ids, -- From snapshot
        recurring_invoice_id,        -- Link back to recurring setup
        created_at,                  -- NOW()
        updated_at                   -- NOW()
      )
   
   d. CREATE INVOICE ITEMS
      FOR EACH ITEM IN items_snapshot:
        INSERT INTO invoice_items (
          invoice_id,    -- New invoice ID
          description,   -- From snapshot
          quantity,      -- From snapshot
          unit_price,    -- From snapshot
          tax_rate,      -- From snapshot
          discount,      -- From snapshot
          line_total     -- From snapshot
        )
   
   e. UPDATE RECURRING INVOICE
      - Increment total_generated_count
      - Set last_generated_at = NOW()
      - Calculate next_generation_date based on frequency
      - Update status if max occurrences reached
   
   f. AUTO-SEND EMAIL (if enabled)
      - Trigger notification for email service
```

---

## 3. How Professional Template Customization Works

### When Creating Recurring Invoice:

1. **User creates invoice with Professional template**
   - Customizes colors, fonts, logo, company info, etc.
   - All customization stored in `template_data` and `template_settings` JSONB fields

2. **User sets invoice as recurring**
   - System stores snapshot:
     ```typescript
     invoiceSnapshot = {
       template: 'professional',
       template_data: invoice.template_data,     // ALL customization data
       template_settings: invoice.template_settings, // Template-specific settings
       // ... other fields
     }
     ```

### When Cron Generates New Invoice:

1. **Cron reads snapshot**
   ```sql
   template := invoice_snapshot->>'template';           -- 'professional'
   template_data := invoice_snapshot->'template_data';     -- JSONB object (all customization)
   template_settings := invoice_snapshot->'template_settings'; -- JSONB object (template settings)
   ```

2. **Cron creates new invoice with same customization**
   ```sql
   INSERT INTO invoices (
     template,           -- 'professional'
     template_data,      -- Same JSONB (all customization preserved)
     template_settings,  -- Same JSONB (template settings preserved)
     -- ... other fields
   )
   ```

3. **Result**
   - New invoice has EXACT same customization as original
   - Same colors, fonts, logo, company info
   - Looks identical to the original invoice
   - As if a human copied the original invoice and created a new one

---

## 4. Database Schema Support

### Tables Used:

1. **`recurring_invoices`**
   - Stores recurring invoice configuration
   - `invoice_snapshot` (JSONB): All invoice data (template, customization, amounts, currency, etc.)
   - `items_snapshot` (JSONB): All invoice items
   - `base_invoice_id`: Links to original invoice
   - `client_id`: Links to client

2. **`invoices`**
   - Regular invoices table
   - `template`: Template type ('default', 'professional', etc.)
   - `template_data` (JSONB): Customization data
   - `template_settings` (JSONB): Template-specific settings
   - `currency_code`: Currency code (EUR, USD, etc.)
   - `recurring_invoice_id`: Links back to recurring setup (for generated invoices)

3. **`invoice_items`**
   - Invoice line items
   - Created from `items_snapshot` when generating new invoice

4. **`clients`**
   - Client information
   - Linked via `client_id` in both recurring_invoices and invoices

---

## 5. Complete Flow Example

### Setup Phase:

```
1. User creates invoice:
   - Template: Professional
   - Customization: Colors, fonts, logo, company info
   - Currency: EUR
   - Items: Item 1, Item 2, Item 3
   - Amounts: Subtotal, Tax, Total
   - Client: ABC Company
   - Invoice Number: 20240115-123456

2. User clicks "Make Recurring"
   - Modal opens
   - User sets frequency: Monthly
   - User sets start date: 2024-02-01
   - User enables auto-send

3. System creates recurring_invoices record:
   - base_invoice_id: [original invoice ID]
   - client_id: [ABC Company ID]
   - frequency: 'monthly'
   - start_date: '2024-02-01'
   - next_generation_date: '2024-02-01'
   - invoice_snapshot: {
       template: 'professional',
       template_data: { /* all customization */ },
       template_settings: { /* template settings */ },
       currency_code: 'EUR',
       subtotal: '1000.00',
       tax_amount: '200.00',
       total_amount: '1200.00',
       notes: '...',
       selected_payment_method_ids: [...],
       payment_terms_days: 30,
       base_invoice_number: '20240115-123456'
     }
   - items_snapshot: [
       { description: 'Item 1', quantity: '1', unit_price: '500.00', ... },
       { description: 'Item 2', quantity: '1', unit_price: '300.00', ... },
       { description: 'Item 3', quantity: '1', unit_price: '200.00', ... }
     ]
```

### Display Phase (RecurringInvoicesPage):

```
1. User navigates to Recurring Invoices page

2. System fetches recurring invoices:
   - Query joins with invoices table
   - Gets invoice_number: '20240115-123456'
   - Gets currency_code: 'EUR'

3. System displays:
   - Invoice #: 20240115-123456 (from base invoice)
   - Currency: € (from base invoice's currency_code)
   - Amount: €1,200.00
   - Client: ABC Company
   - Status: Active
   - Next Generation: 2024-02-01
```

### Generation Phase (Cron):

```
1. Cron runs daily at 2 AM UTC

2. On 2024-02-01:
   - Finds recurring invoice (next_generation_date = 2024-02-01)
   - Status = 'active'
   - auto_create = true

3. Cron creates new invoice:
   - invoice_number: 'INV-2024-02-0001' (new unique number)
   - template: 'professional' (from snapshot)
   - template_data: { /* same customization as original */ }
   - template_settings: { /* same settings as original */ }
   - currency_code: 'EUR' (from snapshot)
   - client_id: [ABC Company ID]
   - subtotal: 1000.00
   - tax_amount: 200.00
   - total_amount: 1200.00
   - notes: '...' (same as original)
   - selected_payment_method_ids: [...] (same as original)
   - issue_date: 2024-02-01
   - due_date: 2024-03-01 (issue_date + 30 days)
   - status: 'pending'
   - recurring_invoice_id: [recurring invoice ID]

4. Cron creates invoice items:
   - Item 1: description, quantity, unit_price, tax_rate, discount, line_total
   - Item 2: description, quantity, unit_price, tax_rate, discount, line_total
   - Item 3: description, quantity, unit_price, tax_rate, discount, line_total

5. Cron updates recurring invoice:
   - total_generated_count: 1
   - last_generated_at: 2024-02-01 02:00:00
   - next_generation_date: 2024-03-01 (monthly frequency)
```

### Display Phase (TransactionPage):

```
1. User navigates to Transaction page

2. System fetches all invoices:
   - Includes generated invoice (recurring_invoice_id is set)
   - Invoice number: INV-2024-02-0001
   - Currency: EUR
   - Amount: €1,200.00
   - Client: ABC Company
   - Template: Professional
   - Status: Pending
   - Issue Date: 2024-02-01
   - Due Date: 2024-03-01

3. Invoice appears like any other invoice
   - Can be identified by recurring_invoice_id (if needed for filtering)
   - Looks identical to original invoice (same customization)
   - Same currency, amounts, items, client
```

---

## 6. Key Points

### Currency Display:
- **RecurringInvoicesPage**: Gets currency from base invoice (via JOIN) - same as TransactionPage
- **TransactionPage**: Gets currency from invoice directly - `transaction.currency_code`
- **Both use**: `getCurrencySymbol(currencyCode)` to display correct symbol

### Invoice Number Display:
- **RecurringInvoicesPage**: Shows base invoice number (the original invoice)
- **Generated Invoices**: Get new unique numbers (INV-YYYY-MM-####)

### Template Customization:
- All customization stored in `template_data` and `template_settings` JSONB
- Cron copies these exactly when generating new invoice
- Result: New invoice looks identical to original

### Complete Invoice Recreation:
- Cron creates invoices with ALL data from snapshot
- Same template, customization, currency, amounts, items, client, notes
- Only changes: invoice number, dates, status (pending)
- As if a human copied the original invoice and created a new one

---

## 7. SQL to Run

The cron function is already correct and handles:
- Dynamic template types
- Template customization (template_data, template_settings)
- Currency from snapshot
- All invoice items
- All invoice amounts
- Client linking
- Payment methods
- Notes

**The SQL file is at**: `database/recurring_invoices_cron.sql`

**To update the cron function** (if needed), run the SQL in Supabase SQL Editor.

**To test manually**:
```sql
SELECT public.generate_recurring_invoices();
```

---

## Summary

✅ **Currency Display**: Fixed - Now gets from base invoice (like TransactionPage)  
✅ **Invoice Number**: Gets from base invoice via JOIN  
✅ **Cron Function**: Already correct - Creates invoices with all customization  
✅ **Template Support**: Dynamic - Supports any template type  
✅ **Customization**: Preserved - All customization copied to new invoices  
✅ **Complete Recreation**: New invoices are identical to original (except number/dates)

