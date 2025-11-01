# Template Wiring Guide

A comprehensive guide for creating and wiring new invoice templates in the Invoice-It application.

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Core Files Required](#core-files-required)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Routing Configuration](#routing-configuration)
6. [State Management & Data Flow](#state-management--data-flow)
7. [Testing Checklist](#testing-checklist)

---

## Overview

Every invoice template in this application consists of **4 main components**:

1. **Create Page** (`Create.tsx`) - Form for creating/editing invoices
2. **Preview Page** (`Preview.tsx`) - Display-only view of invoices
3. **PDF Component** (`PDF.tsx`) - PDF generation for downloads
4. **Save Module** (`Save.ts`) - Database persistence and localStorage handling

These components work together to provide:
- ✅ Invoice creation and editing
- ✅ Live preview
- ✅ LocalStorage draft saving
- ✅ Database persistence
- ✅ PDF generation
- ✅ Transaction listing
- ✅ Navigation from transactions page

---

## File Structure

Create your template files in this structure:

```
src/components/templatesfolder/[TemplateName]/
├── [TemplateName]Create.tsx       # Create/Edit form component
├── [TemplateName]Preview.tsx      # Preview/display component
├── [TemplateName]PDF.tsx          # PDF generation component
└── [TemplateName]Save.ts          # Save logic module
```

**Example:**
```
src/components/templatesfolder/MinimalTemplate/
├── MinimalTemplateCreate.tsx
├── MinimalTemplatePreview.tsx
├── MinimalTemplatePDF.tsx
└── MinimalTemplateSave.ts
```

---

## Core Files Required

### 1. Create Page (`[TemplateName]Create.tsx`)

#### Required Imports

```typescript
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
import { getCurrencySymbol } from '../../../lib/currencyUtils'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import { saveInvoiceToDatabase } from './[TemplateName]Save'
import type { YourTemplateFormData } from './[TemplateName]Save'
import toast from 'react-hot-toast'
```

#### Critical Functions

**A. Load Invoice Data on Mount**
```typescript
useEffect(() => {
  const loadInvoiceData = async () => {
    const invoiceNumber = getInvoiceFromUrl(searchParams)
    
    if (invoiceNumber) {
      setLoading(true)
      try {
        // Load from database
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('invoice_number', invoiceNumber)
          .eq('user_id', user?.id)
          .single()

        if (error) {
          // Fallback to localStorage
          const savedData = invoiceStorage.getDraft[TemplateName]()
          if (savedData && savedData.invoiceNumber === invoiceNumber) {
            setFormData(savedData)
            return
          }
          
          // Fallback to state
          if (location.state?.invoiceData?.invoiceNumber === invoiceNumber) {
            setFormData(location.state.invoiceData)
            return
          }
          
          navigate('/invoice/create/[templatename]')
          return
        }

        // Convert database data to form data format
        if (data) {
          // Transform database fields to your form data structure
          setFormData(transformedFormData)
        }
      } catch (error) {
        console.error('Error loading invoice:', error)
        toast.error('Error loading invoice')
      } finally {
        setLoading(false)
      }
    } else if (location.state?.invoiceData) {
      // Load from navigation state
      setFormData(location.state.invoiceData)
    }
  }

  if (user) {
    loadInvoiceData()
  }
}, [searchParams, location.state, navigate, user])
```

**B. Auto-Save Draft to LocalStorage**
```typescript
useEffect(() => {
  if (formData.invoiceNumber) {
    const timer = setTimeout(() => {
      invoiceStorage.saveDraft[TemplateName](formData)
    }, 1000) // Debounce 1 second

    return () => clearTimeout(timer)
  }
}, [formData])
```

**C. Navigation to Preview**
```typescript
const handlePreview = () => {
  navigate('/invoice/preview/[templatename]', {
    state: { invoiceData: formData }
  })
}
```

**D. Save to Database**
```typescript
const handleSave = async () => {
  if (!user) return
  
  const result = await saveInvoiceToDatabase(
    formData,
    user,
    templateSettings, // optional customizations
    { status: 'draft' }
  )
  
  if (result.success) {
    toast.success('Invoice saved successfully!')
    navigate('/invoice/preview/[templatename]', {
      state: { invoiceData: formData }
    })
  }
}
```

---

### 2. Preview Page (`[TemplateName]Preview.tsx`)

#### Required Imports

```typescript
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../lib/useAuth'
import { supabase } from '../../../lib/supabaseClient'
import { getInvoiceFromUrl } from '../../../lib/urlUtils'
import { getCurrencySymbol } from '../../../lib/currencyUtils'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import type { YourTemplateFormData } from './[TemplateName]Save'
import toast from 'react-hot-toast'
// Reusable buttons
import StatusButton from '../../StatusButton'
import SendButton from '../../buttons/SendButton'
import EditButton from '../../buttons/EditButton'
import DownloadButton from '../../buttons/DownloadButton'
```

#### Critical Functions

**A. Load Invoice Data - THREE SOURCES (Priority Order)**

```typescript
useEffect(() => {
  const loadInvoiceData = async () => {
    const invoiceNumber = getInvoiceFromUrl(searchParams)
    
    // PRIORITY 1: Load from database if invoice number in URL
    if (invoiceNumber) {
      setLoading(true)
      try {
        const { data: invoiceData, error } = await supabase
          .from('invoices')
          .select(`
            *,
            clients!invoices_client_id_fkey (
              name, email, address, phone, company_name
            ),
            invoice_items!invoice_items_invoice_id_fkey (
              id, description, quantity, unit_price, discount, tax_rate, line_total
            )
          `)
          .eq('invoice_number', invoiceNumber)
          .eq('user_id', user?.id)
          .single()

        if (error) {
          // PRIORITY 2: Check location.state
          if (location.state?.invoiceData?.invoiceNumber === invoiceNumber) {
            setInvoiceData(location.state.invoiceData)
            setIsFromDatabase(false)
            return
          }
          
          // PRIORITY 3: Check localStorage
          const savedData = invoiceStorage.getDraft[TemplateName]()
          if (savedData && savedData.invoiceNumber === invoiceNumber) {
            setInvoiceData(savedData)
            setIsFromDatabase(false)
            setDbStatus('draft')
            return
          }
          
          // Not found anywhere
          toast.error('Invoice not found')
          navigate('/invoices')
          return
        }

        // Database found - transform to form data
        if (invoiceData) {
          const transformedData = transformDatabaseToFormData(invoiceData)
          setInvoiceData(transformedData)
          setDbStatus(invoiceData.status || 'draft')
          setIsFromDatabase(true)
        }
      } catch (error) {
        console.error('Error loading invoice:', error)
        toast.error('Error loading invoice')
        navigate('/invoices')
      } finally {
        setLoading(false)
      }
    } 
    // PRIORITY 2: Load from navigation state (create → preview flow)
    else if (location.state?.invoiceData) {
      setInvoiceData(location.state.invoiceData)
      setIsFromDatabase(false)
      setDbStatus('draft')
    } 
    // NO DATA - redirect
    else {
      toast.error('No invoice data found')
      navigate('/invoices')
    }
  }

  if (user) {
    loadInvoiceData()
  }
}, [searchParams, location.state, navigate, user])
```

**B. Edit Navigation**
```typescript
const handleEdit = () => {
  if (invoiceData) {
    navigate('/invoice/create/[templatename]', { 
      state: { invoiceData } 
    })
  }
}
```

**C. Status Change Detection**
```typescript
useEffect(() => {
  const handleStatusChange = () => {
    const savedInvoice = localStorage.getItem('[templatename]_invoice_saved')
    if (savedInvoice) {
      const invoiceData = JSON.parse(savedInvoice)
      if (invoiceData.status && invoiceData.status !== 'draft') {
        setDbStatus(invoiceData.status)
        setIsFromDatabase(true)
        localStorage.removeItem('[templatename]_invoice_saved')
      }
    }
  }

  window.addEventListener('invoiceStatusChanged', handleStatusChange)
  window.addEventListener('invoiceSaved', handleStatusChange)
  handleStatusChange()
  
  return () => {
    window.removeEventListener('invoiceStatusChanged', handleStatusChange)
    window.removeEventListener('invoiceSaved', handleStatusChange)
  }
}, [])
```

---

### 3. Save Module (`[TemplateName]Save.ts`)

#### Required Structure

```typescript
import { supabase } from '../../../lib/supabaseClient'
import { invoiceStorage } from '../../../lib/storage/invoiceStorage'
import { saveClient } from '../../../lib/clientCheck'
import toast from 'react-hot-toast'

interface SaveResult {
  success: boolean
  invoiceId?: string
  clientId?: string
  error?: string
}

// Define your template-specific form data interface
export interface YourTemplateFormData {
  // Database IDs
  id?: string
  clientId?: string
  status?: string
  template?: string
  
  // Client Information
  clientName: string
  clientEmail: string
  clientAddress: string
  clientPhone: string
  clientCompanyName: string
  
  // Invoice Metadata
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  
  // Line Items
  items: YourInvoiceItem[]
  
  // Calculations
  subtotal: number
  taxTotal: number
  totalAmount: number // or grandTotal
  
  // Currency & Payment
  currency?: string
  currencySymbol?: string
  selectedPaymentMethodIds?: string[]
  
  // Template-specific fields (add as needed)
  // notes?: string
  // terms?: string
  // customField?: any
}

// Save debouncing mechanism
const saveInProgress = new Set<string>()

export const saveInvoiceToDatabase = async (
  formData: YourTemplateFormData,
  user: any,
  templateSettings?: any,
  options: {
    updateStatus?: boolean
    status?: 'draft' | 'pending'
  } = {}
): Promise<SaveResult> => {
  const saveKey = `${user.id}-${formData.invoiceNumber}`
  
  // Prevent duplicate saves
  if (saveInProgress.has(saveKey)) {
    return { success: false, error: 'Save already in progress' }
  }
  
  saveInProgress.add(saveKey)
  
  try {
    // STEP 1: Save/Match Client
    const clientId = await saveClient({
      name: formData.clientName,
      email: formData.clientEmail,
      address: formData.clientAddress,
      phone: formData.clientPhone,
      company_name: formData.clientCompanyName
    }, user.id)
    
    // STEP 2: Save Invoice to Database
    let invoiceId: string
    
    // Check if invoice exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', formData.invoiceNumber)
      .eq('user_id', user.id)
      .single()
    
    if (existingInvoice) {
      // Update existing
      const { data: updatedInvoice } = await supabase
        .from('invoices')
        .update({
          client_id: clientId,
          issue_date: formData.invoiceDate,
          due_date: formData.dueDate,
          subtotal: formData.subtotal,
          tax_amount: formData.taxTotal,
          total_amount: formData.totalAmount,
          status: options.status || existingInvoice.status,
          template: '[templatename]',
          currency_code: formData.currency || 'USD',
          selected_payment_method_ids: formData.selectedPaymentMethodIds || null,
          template_data: {}, // Add template-specific data here
          template_settings: templateSettings || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvoice.id)
        .select()
        .single()
      
      invoiceId = updatedInvoice.id
    } else {
      // Create new
      const { data: newInvoice } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: clientId,
          invoice_number: formData.invoiceNumber,
          issue_date: formData.invoiceDate,
          due_date: formData.dueDate,
          subtotal: formData.subtotal,
          tax_amount: formData.taxTotal,
          total_amount: formData.totalAmount,
          status: options.status || 'draft',
          template: '[templatename]',
          currency_code: formData.currency || 'USD',
          selected_payment_method_ids: formData.selectedPaymentMethodIds || null,
          template_data: {}, // Add template-specific data here
          template_settings: templateSettings || {}
        })
        .select()
        .single()
      
      invoiceId = newInvoice.id
    }
    
    // STEP 3: Save Invoice Items
    // Clear old items if updating
    if (existingInvoice) {
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)
    }
    
    // Insert new items
    if (formData.items && formData.items.length > 0) {
      const itemsToSave = formData.items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount || 0,
        tax_rate: item.taxRate || 0,
        line_total: item.lineTotal
      }))
      
      await supabase
        .from('invoice_items')
        .insert(itemsToSave)
    }
    
    // STEP 4: Clear localStorage Draft
    invoiceStorage.clearDraft[TemplateName]()
    
    saveInProgress.delete(saveKey)
    
    toast.success('Invoice saved successfully!')
    
    return { 
      success: true, 
      invoiceId,
      clientId 
    }
    
  } catch (error: any) {
    console.error('Save error:', error)
    toast.error('An unexpected error occurred: ' + error.message)
    saveInProgress.delete(saveKey)
    return { success: false, error: error.message }
  }
}
```

---

### 4. PDF Component (`[TemplateName]PDF.tsx`)

#### Required Imports

```typescript
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { YourTemplateFormData } from './[TemplateName]Save'

// Register fonts if using custom fonts
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf'
})

Font.register({
  family: 'RobotoBold',
  src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc4.ttf'
})
```

#### PDF Structure

```typescript
const PDFStyles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 40,
  },
  // Add your styles
})

export const YourTemplatePDF: React.FC<{ data: YourTemplateFormData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={PDFStyles.page}>
      {/* Your PDF layout here */}
      {/* Use data fields from YourTemplateFormData */}
    </Page>
  </Document>
)
```

---

## Routing Configuration

### Add Routes in `src/Routes/index.tsx`

```typescript
{
  path: '/invoice/create/[templatename]',
  element: <YourTemplateCreate />
},
{
  path: '/invoice/preview/[templatename]',
  element: <InvoicePreviewPage /> // Gateway component
}
```

### Update Gateway in `src/pages/InvoicePreviewPage.tsx`

```typescript
import YourTemplatePreview from '../components/templatesfolder/[TemplateName]/[TemplateName]Preview'

const getTemplateComponent = (template: string) => {
  switch (template) {
    case 'default':
      return DefaultPreview
    case 'professional':
      return ProfessionalPreview
    case '[templatename]': // ADD YOUR TEMPLATE HERE
      return YourTemplatePreview
    default:
      return DefaultPreview
  }
}
```

### Update Template Gallery (Optional)

In your template gallery or selector, add your new template option.

---

## State Management & Data Flow

### Flow Diagram

```
USER CREATES INVOICE
  ↓
[TemplateName]Create.tsx
  ↓ (auto-save every 1s)
invoiceStorage.saveDraft[TemplateName](formData)
  ↓
USER CLICKS "Preview"
  ↓
navigation: /invoice/preview/[templatename] + state: { invoiceData }
  ↓
InvoicePreviewPage (gateway)
  ↓ (routes based on template param)
[TemplateName]Preview.tsx
  ↓ (loads from location.state or localStorage)
DISPLAY PREVIEW
  ↓
USER CLICKS "Save"/"Send"/"Download"
  ↓
saveInvoiceToDatabase()
  ↓
Database: invoices table + invoice_items table + clients table
  ↓
invoiceStorage.clearDraft[TemplateName]() ← LOCALSTORAGE CLEARED
  ↓
SUCCESS → Redirect to preview with updated data

---

USER CLICKS "View" FROM TRANSACTIONS PAGE
  ↓
navigate: /invoice/preview/[templatename]?invoice=INV-123
  ↓
[TemplateName]Preview.tsx
  ↓ (extracts invoice number from URL)
Query Database: WHERE invoice_number = 'INV-123'
  ↓
Loads invoice data
  ↓
DISPLAY PREVIEW
```

---

## Database Schema Requirements

Your template must store data in these tables:

### `invoices` Table
- `id` (UUID)
- `user_id` (UUID)
- `client_id` (UUID)
- `invoice_number` (TEXT, UNIQUE)
- `issue_date` (DATE)
- `due_date` (DATE)
- `subtotal` (DECIMAL)
- `tax_amount` (DECIMAL)
- `total_amount` (DECIMAL)
- `status` (TEXT: 'draft', 'pending', 'paid', 'overdue')
- `template` (TEXT) ← **MUST BE '[templatename]'**
- `currency_code` (TEXT)
- `selected_payment_method_ids` (JSONB)
- `template_data` (JSONB) ← **For template-specific fields**
- `template_settings` (JSONB)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `invoice_items` Table
- `id` (UUID)
- `invoice_id` (UUID, FK to invoices)
- `description` (TEXT)
- `quantity` (DECIMAL)
- `unit_price` (DECIMAL)
- `discount` (DECIMAL)
- `tax_rate` (DECIMAL)
- `line_total` (DECIMAL)
- `created_at` (TIMESTAMP)

### `clients` Table
- `id` (UUID)
- `user_id` (UUID)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `company_name` (TEXT)

---

## LocalStorage Integration

### Add Your Template to `invoiceStorage`

In `src/lib/storage/invoiceStorage.ts`:

```typescript
import type { YourTemplateFormData } from '../components/templatesfolder/[TemplateName]/[TemplateName]Save'

const STORAGE_KEYS = {
  DRAFT_DEFAULT: 'draft_invoice_default',
  DRAFT_PROFESSIONAL: 'draft_invoice_professional',
  DRAFT_YOUR_TEMPLATE: 'draft_invoice_[templatename]' // ADD THIS
}

// Add these methods:
export const saveDraftYourTemplate = (data: YourTemplateFormData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT_YOUR_TEMPLATE, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving draft:', error)
  }
}

export const getDraftYourTemplate = (): YourTemplateFormData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFT_YOUR_TEMPLATE)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
}

export const clearDraftYourTemplate = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DRAFT_YOUR_TEMPLATE)
  } catch (error) {
    console.error('Error clearing draft:', error)
  }
}

// Export in invoiceStorage object
export const invoiceStorage = {
  saveDraftDefault,
  getDraftDefault,
  clearDraftDefault,
  saveDraftProfessional,
  getDraftProfessional,
  clearDraftProfessional,
  saveDraftYourTemplate,      // ADD THIS
  getDraftYourTemplate,        // ADD THIS
  clearDraftYourTemplate       // ADD THIS
}
```

---

## Testing Checklist

### ✅ Create Flow
- [ ] Can create new invoice
- [ ] Form auto-saves to localStorage (check after 1 second)
- [ ] Preview button navigates correctly
- [ ] Save button persists to database

### ✅ Edit Flow
- [ ] Can edit existing invoice from database
- [ ] Changes auto-save to localStorage
- [ ] Preview reflects changes
- [ ] Save updates database correctly

### ✅ Preview Flow (from Create)
- [ ] Loads invoice from location.state
- [ ] Display all invoice data correctly
- [ ] Edit button navigates back to create
- [ ] Send button updates status
- [ ] Download generates PDF

### ✅ Preview Flow (from Transactions)
- [ ] Loads invoice from database via URL parameter
- [ ] URL format: `/invoice/preview/[templatename]?invoice=INV-123`
- [ ] Fallback to localStorage if DB fails
- [ ] Fallback to state if localStorage fails
- [ ] Shows "Invoice not found" if none exist
- [ ] Edit button hides for sent/paid invoices

### ✅ Transaction Page Integration
- [ ] Invoice appears in transactions list
- [ ] Template badge displays correctly
- [ ] "View" button navigates to correct preview
- [ ] TransactionService loads invoice with template field

### ✅ Database Integration
- [ ] Invoice saved with correct `template: '[templatename]'`
- [ ] All fields mapped correctly
- [ ] Invoice items saved correctly
- [ ] Client matched/created correctly
- [ ] Template-specific data in `template_data` column

### ✅ LocalStorage Cleanup
- [ ] Draft cleared after successful database save
- [ ] Draft persists on browser refresh (if not saved)
- [ ] No localStorage pollution between sessions

### ✅ PDF Generation
- [ ] PDF generates without errors
- [ ] All data renders correctly
- [ ] Layout matches preview
- [ ] Downloads successfully

---

## Common Pitfalls & Solutions

### ❌ Issue: "Invoice not found" when clicking from transactions
**Solution:** Ensure your Preview component is checking the database with:
```typescript
.eq('invoice_number', invoiceNumber)
.eq('user_id', user?.id)
.single()
```

### ❌ Issue: localStorage not clearing after save
**Solution:** Verify you're calling:
```typescript
invoiceStorage.clearDraft[TemplateName]()
```
after successful database save in your Save module.

### ❌ Issue: Template not showing in transaction list
**Solution:** Ensure invoice is saved with:
```typescript
template: '[templatename]' // lowercase, no spaces, exact match
```

### ❌ Issue: Navigation from transactions fails
**Solution:** Verify routing in `InvoicePreviewPage.tsx` includes your template case in the switch statement.

### ❌ Issue: Form state not persisting
**Solution:** Check that your auto-save useEffect has proper dependencies and debouncing.

---

## Summary

To wire a new template successfully:

1. ✅ Create 5 files: Create, Preview, PDF, Save, static
2. ✅ Define YourTemplateFormData interface
3. ✅ Implement localStorage methods in invoiceStorage
4. ✅ Add routes in Routes/index.tsx
5. ✅ Add routing case in InvoicePreviewPage.tsx
6. ✅ Ensure database schema matches your data structure
7. ✅ Test all flows: Create, Edit, Preview, Transactions, PDF
8.     add the statis component of the preview to the view btn in the template gllery, so users can quickly view how the template design looks like before they use it

Follow this guide, and your template will be fully integrated into the Invoice-It ecosystem! 🎉

