-- Add currency_code column to expenses table
-- This allows expenses to have their own currency, defaulting to user's default currency

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT NULL;

-- Update existing expenses to use user's default currency
-- This is a one-time migration for existing data
UPDATE expenses e
SET currency_code = COALESCE(
  (SELECT currency_code FROM profiles WHERE id = e.user_id),
  'USD'
)
WHERE currency_code IS NULL;

-- Add comment
COMMENT ON COLUMN expenses.currency_code IS 'Currency code for the expense (e.g., USD, EUR, GBP). Defaults to user default currency if not specified.';

