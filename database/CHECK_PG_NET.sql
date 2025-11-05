-- ============================================
-- CHECK IF PG_NET IS AVAILABLE
-- ============================================
-- Run this first to check if pg_net extension is installed

-- Check if extension exists
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Check if http_post function exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'http_post' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'net');

-- List all functions in net schema
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'net')
ORDER BY proname;

-- ============================================
-- IF PG_NET IS NOT AVAILABLE:
-- ============================================
-- Option 1: Enable pg_net in Supabase Dashboard
--   1. Go to Database > Extensions
--   2. Search for "pg_net"
--   3. Click "Enable"
--
-- Option 2: Use Supabase Edge Functions instead
--   You would need to create an Edge Function that calls your API,
--   then invoke it from the database function using:
--   SELECT supabase.functions.invoke('function-name', '{...}'::jsonb);
--
-- Option 3: Temporarily disable auto-send and handle email sending
--   separately through your application

