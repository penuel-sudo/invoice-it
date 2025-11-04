-- ============================================
-- RECURRING INVOICES SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates the recurring_invoices table and related schema

-- 1. Create recurring_invoices table
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  
  -- Recurring settings
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = never ends
  max_occurrences INTEGER, -- NULL = unlimited
  next_generation_date DATE NOT NULL,
  
  -- Auto actions
  auto_create BOOLEAN DEFAULT true,
  auto_send BOOLEAN DEFAULT false, -- Auto-send email (requires auto_create)
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  
  -- Invoice data snapshots (to recreate the invoice)
  invoice_snapshot JSONB NOT NULL, -- Stores: template, template_data, template_settings, currency_code, notes, selected_payment_method_ids, payment_terms_days, amounts
  items_snapshot JSONB NOT NULL, -- Array of invoice items: [{description, quantity, unit_price, tax_rate, discount, line_total}, ...]
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  total_generated_count INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT unique_base_invoice UNIQUE (base_invoice_id) -- Prevent duplicate recurring setup
);

-- 2. Add recurring_invoice_id to invoices table (to track which recurring invoice generated this)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS recurring_invoice_id UUID REFERENCES public.recurring_invoices(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON public.recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client_id ON public.recurring_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_base_invoice_id ON public.recurring_invoices(base_invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_generation ON public.recurring_invoices(next_generation_date) 
WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_status ON public.recurring_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_invoice_id ON public.invoices(recurring_invoice_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Users can only see their own recurring invoices
CREATE POLICY "Users can view their own recurring invoices"
  ON public.recurring_invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recurring invoices
CREATE POLICY "Users can create their own recurring invoices"
  ON public.recurring_invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recurring invoices
CREATE POLICY "Users can update their own recurring invoices"
  ON public.recurring_invoices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own recurring invoices
CREATE POLICY "Users can delete their own recurring invoices"
  ON public.recurring_invoices
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- NOTES:
-- 1. This table stores a complete snapshot of invoice data
-- 2. The invoice_snapshot JSONB contains all invoice fields (template, settings, etc.)
-- 3. The items_snapshot JSONB contains all invoice items
-- 4. When a new invoice is generated, it uses these snapshots
-- 5. The UNIQUE constraint on base_invoice_id prevents duplicate recurring setup
-- ============================================

