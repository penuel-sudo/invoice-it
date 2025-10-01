-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "enabled": true,
  "push_enabled": true,
  "email_enabled": true,
  "invoice_sent": true,
  "payment_received": true,
  "payment_overdue": true,
  "invoice_created": true,
  "status_changed": true
}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification preferences including in-app, push, and email notifications';

