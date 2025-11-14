-- Add expense_number column to expenses table
-- This allows expenses to have a human-readable identifier like invoices
-- Format: EXP-001, EXP-002, etc.

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS expense_number TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_expense_number ON public.expenses USING btree (expense_number) TABLESPACE pg_default;

-- Function to generate expense number
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  max_num INTEGER;
BEGIN
  -- Get the highest number from existing expense numbers
  SELECT COALESCE(MAX(CAST(SUBSTRING(expense_number FROM 'EXP-(\d+)') AS INTEGER)), 0)
  INTO max_num
  FROM expenses
  WHERE expense_number ~ '^EXP-\d+$';
  
  -- Generate next number
  new_number := 'EXP-' || LPAD((max_num + 1)::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate expense_number on insert
CREATE OR REPLACE FUNCTION set_expense_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
    NEW.expense_number := generate_expense_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_expense_number ON expenses;
CREATE TRIGGER trigger_set_expense_number
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_expense_number();

-- Update existing expenses that don't have expense_number
-- This will assign numbers to existing expenses
DO $$
DECLARE
  expense_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR expense_record IN 
    SELECT id FROM expenses WHERE expense_number IS NULL OR expense_number = ''
    ORDER BY created_at ASC
  LOOP
    UPDATE expenses
    SET expense_number = 'EXP-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = expense_record.id;
    
    counter := counter + 1;
  END LOOP;
END $$;

-- Add comment
COMMENT ON COLUMN expenses.expense_number IS 'Human-readable expense identifier (e.g., EXP-001). Auto-generated on insert.';

