# Recurring Invoices - Frontend Flow Explanation

## Overview
This document explains how the recurring invoice system works from the frontend perspective, including data flow, display logic, and action button workflows.

---

## 1. Data Source & Display Logic

### Invoice Number Display

**Source**: The invoice number shown in the recurring list comes from **the original base invoice** (the invoice that was set as recurring).

**How it works:**

1. **Database Query** (`getRecurringInvoices` in `recurringService.ts`):
   ```typescript
   .select(`
     *,
     invoices!recurring_invoices_base_invoice_id_fkey (
       invoice_number
     )
   `)
   ```
   - This joins the `recurring_invoices` table with the `invoices` table
   - Uses the foreign key relationship: `base_invoice_id` → `invoices.id`
   - Fetches the `invoice_number` from the original invoice

2. **Display Logic** (Line 310 in `RecurringInvoicesPage.tsx`):
   ```typescript
   const baseInvoiceNumber = (invoice as any).invoices?.invoice_number || 
                             invoiceSnapshot.base_invoice_number || 
                             'N/A'
   ```
   - **First priority**: Gets from joined `invoices` table (`invoices.invoice_number`)
   - **Second priority**: Falls back to `invoiceSnapshot.base_invoice_number` (stored when creating recurring)
   - **Final fallback**: Shows 'N/A' if neither exists

**Answer**: Yes, the invoice number comes from the main transaction invoice item (the base invoice that was set as recurring).

---

### Currency Symbol Display

**Source**: The currency symbol comes from **the original base invoice's currency code**.

**How it works:**

1. **Storage** (when creating recurring invoice):
   ```typescript
   const invoiceSnapshot = {
     currency_code: invoice.currency_code || 'USD', // From original invoice
     // ... other fields
   }
   ```
   - When user sets up recurring, the system stores the original invoice's `currency_code` in the snapshot

2. **Display Logic** (Lines 307-308, 387 in `RecurringInvoicesPage.tsx`):
   ```typescript
   const currencyCode = invoiceSnapshot.currency_code || 'USD'
   const currencySymbol = getCurrencySymbol(currencyCode)
   // ...
   {currencySymbol}{totalAmount.toFixed(2)}
   ```
   - Gets `currency_code` from `invoiceSnapshot` (stored from original invoice)
   - Uses `getCurrencySymbol()` utility to convert code to symbol (€, £, ₦, $, etc.)
   - Displays the correct symbol

**Answer**: Yes, the currency symbol is dynamically retrieved from the main transaction invoice item's currency code, NOT hardcoded. If you're seeing a hardcoded dollar sign, it might be cached data - refresh the page.

---

## 2. Action Buttons Workflow

### Button States & Visibility

Each recurring invoice list item shows different action buttons based on status:

#### **Active Status** (status = 'active')
- **Pause Button** (Yellow/Warning) - Visible
- **Resume Button** - Hidden
- **View Generated Button** - Visible
- **Cancel Button** - Visible

#### **Paused Status** (status = 'paused')
- **Pause Button** - Hidden
- **Resume Button** (Green/Success) - Visible
- **View Generated Button** - Visible
- **Cancel Button** - Visible

#### **Cancelled Status** (status = 'cancelled')
- **Pause Button** - Hidden
- **Resume Button** - Hidden
- **View Generated Button** - Visible
- **Cancel Button** - Hidden

---

### Action Button Functions

#### 1. **Pause Button** (`handlePause`)

**What it does:**
- Sets recurring invoice status to `'paused'`
- Calls `updateRecurringStatus(recurringId, 'paused')`

**Backend Impact:**
- Updates `recurring_invoices.status = 'paused'` in database
- **Cron job effect**: The SQL cron job (`generate_recurring_invoices()`) checks `WHERE status = 'active'`
- Since status is now 'paused', the cron job **skips this recurring invoice**
- **No new invoices will be generated** until status is changed back to 'active'

**Frontend Effect:**
- Button switches from "Pause" to "Resume"
- Status badge changes from "Active" to "Paused"
- Page refreshes to show updated status

**Code Flow:**
```
User clicks Pause
  ↓
handlePause(recurringId)
  ↓
updateRecurringStatus(recurringId, 'paused')
  ↓
Supabase UPDATE: status = 'paused'
  ↓
loadRecurringInvoices() [refresh list]
  ↓
UI updates: Pause button → Resume button
```

---

#### 2. **Resume Button** (`handleResume`)

**What it does:**
- Sets recurring invoice status to `'active'`
- Calls `updateRecurringStatus(recurringId, 'active')`

**Backend Impact:**
- Updates `recurring_invoices.status = 'active'` in database
- **Cron job effect**: The SQL cron job will now **include this recurring invoice** in its daily check
- **New invoices will be generated** on the next `next_generation_date` when cron runs

**Frontend Effect:**
- Button switches from "Resume" to "Pause"
- Status badge changes from "Paused" to "Active"
- Page refreshes to show updated status

**Code Flow:**
```
User clicks Resume
  ↓
handleResume(recurringId)
  ↓
updateRecurringStatus(recurringId, 'active')
  ↓
Supabase UPDATE: status = 'active'
  ↓
loadRecurringInvoices() [refresh list]
  ↓
UI updates: Resume button → Pause button
```

---

#### 3. **Cancel/Terminate Button** (`handleCancel`)

**What it does:**
- Shows confirmation dialog: "Are you sure you want to cancel this recurring invoice?"
- If confirmed, sets recurring invoice status to `'cancelled'`
- Calls `cancelRecurringInvoice(recurringId)`

**Backend Impact:**
- Updates `recurring_invoices.status = 'cancelled'` in database
- **Cron job effect**: The SQL cron job checks `WHERE status = 'active'`
- Since status is now 'cancelled', the cron job **permanently skips this recurring invoice**
- **No new invoices will EVER be generated** (cancelled is permanent)
- **Existing generated invoices remain** in the database (they're not deleted)

**Frontend Effect:**
- Cancel button disappears (only shown for active/paused status)
- Status badge changes to "Cancelled"
- Pause/Resume buttons disappear
- Only "View Generated" button remains
- Page refreshes to show updated status

**Code Flow:**
```
User clicks Cancel
  ↓
window.confirm("Are you sure...?")
  ↓ (if confirmed)
handleCancel(recurringId)
  ↓
cancelRecurringInvoice(recurringId)
  ↓
Supabase UPDATE: status = 'cancelled'
  ↓
loadRecurringInvoices() [refresh list]
  ↓
UI updates: Cancel button disappears, status → "Cancelled"
```

---

#### 4. **View Generated Button**

**What it does:**
- Navigates to `/invoices?recurring={recurringId}`
- This would show all invoices generated from this recurring invoice

**Backend Impact:**
- None (read-only action)
- The page would query: `SELECT * FROM invoices WHERE recurring_invoice_id = {recurringId}`

**Note**: This feature may need implementation in the invoices/transaction page to filter by `recurring_invoice_id`.

---

## 3. Complete Frontend Flow

### **Setting Up Recurring Invoice:**

```
Transaction Page
  ↓
User clicks "Make Recurring" on an invoice
  ↓
MakeRecurringModal opens
  ↓
User fills form (frequency, dates, auto-send)
  ↓
createRecurringInvoice(invoiceId, clientId, userId, settings)
  ↓
Backend:
  1. Fetches original invoice & items
  2. Stores snapshot (template, currency, amounts, items)
  3. Calculates next_generation_date
  4. Inserts into recurring_invoices table
  ↓
Modal closes, success toast
  ↓
User navigates to Recurring Invoices page
  ↓
Page loads: getRecurringInvoices(userId)
  ↓
Displays list with:
  - Invoice # from base invoice (via JOIN)
  - Currency symbol from snapshot (from original invoice)
  - Status badge
  - Action buttons
```

### **Viewing Recurring Invoices:**

```
RecurringInvoicesPage loads
  ↓
useEffect triggers loadRecurringInvoices()
  ↓
getRecurringInvoices(userId)
  ↓
Supabase query:
  - Joins with invoices table (for invoice_number)
  - Joins with clients table (for client name)
  - Fetches all recurring_invoices records
  ↓
Data transforms:
  - Extracts invoice_number from joined invoices
  - Extracts currency_code from invoice_snapshot
  - Gets currency symbol via getCurrencySymbol()
  ↓
Renders list items with:
  - Invoice # (from base invoice)
  - Client name (from joined clients)
  - Total amount (from snapshot)
  - Currency symbol (from snapshot currency_code)
  - Status badge
  - Action buttons (based on status)
```

### **Managing Recurring Invoice:**

```
User clicks action button (Pause/Resume/Cancel)
  ↓
Handler function called (handlePause/handleResume/handleCancel)
  ↓
Service function called (updateRecurringStatus/cancelRecurringInvoice)
  ↓
Supabase UPDATE query
  ↓
Success → loadRecurringInvoices() [refresh]
  ↓
UI updates:
  - Status badge changes
  - Action buttons change visibility
  - List refreshes
```

---

## 4. Backend Communication Summary

### **Status Changes & Cron Job Impact:**

| Action | Status Change | Cron Job Effect | Can Generate New Invoices? |
|--------|--------------|-----------------|---------------------------|
| **Pause** | `active` → `paused` | Skips this recurring invoice | ❌ No (until resumed) |
| **Resume** | `paused` → `active` | Includes this recurring invoice | ✅ Yes (on next_generation_date) |
| **Cancel** | `active/paused` → `cancelled` | Permanently skips | ❌ No (permanent) |

### **Cron Job Logic (SQL):**

The backend cron job runs daily and checks:
```sql
WHERE status = 'active'
  AND next_generation_date <= CURRENT_DATE
  AND auto_create = true
```

So:
- **Paused**: Status ≠ 'active' → Cron skips → No generation
- **Resumed**: Status = 'active' → Cron includes → Generation resumes
- **Cancelled**: Status ≠ 'active' → Cron skips → No generation (permanent)

---

## 5. Key Takeaways

1. **Invoice Number**: Comes from the **original base invoice** via database JOIN
2. **Currency Symbol**: Comes from the **original invoice's currency_code** stored in snapshot (NOT hardcoded)
3. **Pause**: Temporarily stops generation (can resume)
4. **Resume**: Restarts generation (cron will pick it up)
5. **Cancel**: Permanently stops generation (cannot resume)
6. **Status controls generation**: Only `status = 'active'` recurring invoices generate new invoices

---

## 6. Troubleshooting

**If invoice number shows pattern instead of actual number:**
- Check if JOIN is working: `invoices.invoice_number` should exist
- Check fallback: `invoiceSnapshot.base_invoice_number` should be set when creating recurring

**If currency shows dollar sign for non-USD:**
- Check `invoiceSnapshot.currency_code` in database
- Verify `getCurrencySymbol()` utility is working
- Clear browser cache and refresh

**If action buttons don't work:**
- Check browser console for errors
- Verify Supabase connection
- Check if user has permissions to update `recurring_invoices` table

