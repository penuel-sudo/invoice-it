-- Create currency_rates table for caching exchange rates
-- This table stores exchange rates to minimize API calls

CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate DECIMAL(15, 6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_currency_rates_lookup 
ON currency_rates(base_currency, target_currency);

-- Enable Row Level Security
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read currency rates (public data)
CREATE POLICY "Currency rates are publicly readable"
ON currency_rates
FOR SELECT
TO public
USING (true);

-- RLS Policy: Authenticated users can insert/update rates (for caching)
CREATE POLICY "Authenticated users can manage currency rates"
ON currency_rates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE currency_rates IS 'Cached exchange rates to minimize API calls. Rates are updated daily.';

