-- ============================================
-- AUTO REMINDER SETUP (RUN ONCE IN SUPABASE)
-- ============================================

-- Ensure pg_cron is available (normally already enabled)
create extension if not exists pg_cron;

-- ============================================
-- Section 1: Tables & Triggers
-- ============================================

-- Workspace-level reminder defaults
create table if not exists public.auto_reminder_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  settings jsonb not null default jsonb_build_object(
    'enabled', false,
    'attachPdf', false,
    'schedule', jsonb_build_array('3_days_before', 'on_due_date', '7_days_after'),
    'tone', 'friendly'
  ),
  updated_at timestamptz not null default now()
);

create or replace function public.set_auto_reminder_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_auto_reminder_settings_updated on public.auto_reminder_settings;
create trigger trg_auto_reminder_settings_updated
before update on public.auto_reminder_settings
for each row execute function public.set_auto_reminder_settings_updated_at();

-- Invoice-level overrides
create table if not exists public.invoice_reminder_overrides (
  invoice_id uuid primary key references public.invoices(id) on delete cascade,
  use_workspace_defaults boolean not null default true,
  reminders_enabled boolean not null default true,
  schedule jsonb not null default jsonb_build_array(),
  tone text not null default 'friendly' check (tone in ('friendly','professional','firm')),
  attach_pdf boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_invoice_reminder_overrides_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_invoice_reminder_overrides_updated on public.invoice_reminder_overrides;
create trigger trg_invoice_reminder_overrides_updated
before update on public.invoice_reminder_overrides
for each row execute function public.set_invoice_reminder_overrides_updated_at();

-- Reminder log (prevents duplicates & supports auditing/UI)
create table if not exists public.invoice_reminder_log (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  reminder_key text not null check (reminder_key in ('3_days_before','on_due_date','7_days_after')),
  reminder_date date not null,
  status text not null default 'queued' check (status in ('queued','processing','sent','skipped','failed')),
  payload jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- Extend pending_email_requests to support reminder jobs (safe to run multiple times)
DO $$
BEGIN
  IF to_regclass('public.pending_email_requests') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pending_email_requests' AND column_name = 'request_type'
    ) THEN
      ALTER TABLE public.pending_email_requests
        ADD COLUMN request_type text NOT NULL DEFAULT 'recurring';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pending_email_requests' AND column_name = 'reminder_log_id'
    ) THEN
      ALTER TABLE public.pending_email_requests
        ADD COLUMN reminder_log_id uuid references public.invoice_reminder_log(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pending_email_requests' AND column_name = 'payload'
    ) THEN
      ALTER TABLE public.pending_email_requests
        ADD COLUMN payload jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    ALTER TABLE public.pending_email_requests
      ALTER COLUMN request_type SET DEFAULT 'recurring';

    ALTER TABLE public.pending_email_requests
      ALTER COLUMN payload SET DEFAULT '{}'::jsonb;

    UPDATE public.pending_email_requests
    SET request_type = 'recurring'
    WHERE request_type IS NULL;
  END IF;
END;
$$;

create unique index if not exists idx_invoice_reminder_log_unique
  on public.invoice_reminder_log(invoice_id, reminder_key, reminder_date);

create index if not exists idx_invoice_reminder_log_status
  on public.invoice_reminder_log(status, reminder_date);

-- ============================================
-- Section 2: Row-Level Security (optional but recommended)
-- ============================================

alter table public.auto_reminder_settings enable row level security;
alter table public.invoice_reminder_overrides enable row level security;
alter table public.invoice_reminder_log enable row level security;

create policy "Users read own auto reminders"
on public.auto_reminder_settings
for select using (auth.uid() = user_id);

create policy "Users upsert own auto reminders"
on public.auto_reminder_settings
for insert with check (auth.uid() = user_id);

create policy "Users update own auto reminders"
on public.auto_reminder_settings
for update using (auth.uid() = user_id);

create policy "Users read invoice overrides they own"
on public.invoice_reminder_overrides
for select using (
  auth.uid() = (select user_id from public.invoices where id = invoice_id)
);

create policy "Users upsert invoice overrides they own"
on public.invoice_reminder_overrides
for insert with check (
  auth.uid() = (select user_id from public.invoices where id = invoice_id)
);

create policy "Users update invoice overrides they own"
on public.invoice_reminder_overrides
for update using (
  auth.uid() = (select user_id from public.invoices where id = invoice_id)
);

create policy "Users read own reminder log entries"
on public.invoice_reminder_log
for select using (auth.uid() = user_id);

create policy "Users insert own reminder log entries"
on public.invoice_reminder_log
for insert with check (auth.uid() = user_id);

-- ============================================
-- Section 3: Reminder Queue Function
-- ============================================

create or replace function public.process_invoice_auto_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice record;
  v_defaults jsonb;
  v_enabled boolean;
  v_schedule text[];
  v_tone text;
  v_attach boolean;
  v_key text;
  v_target_date date;
  v_now timestamptz := now();
begin
  for v_invoice in
    select
      i.id as invoice_id,
      i.user_id,
      i.client_id,
      i.due_date::date as due_date,
      i.status,
      i.invoice_number,
      coalesce(o.use_workspace_defaults, true) as use_defaults,
      coalesce(o.reminders_enabled, true) as override_enabled,
      o.schedule as override_schedule,
      o.tone as override_tone,
      o.attach_pdf as override_attach
    from public.invoices i
      left join public.invoice_reminder_overrides o on o.invoice_id = i.id
    where i.due_date is not null
      and i.status = any('{pending,overdue}'::text[])
  loop
    select settings into v_defaults
    from public.auto_reminder_settings
    where user_id = v_invoice.user_id;

    if v_defaults is null then
      v_defaults := jsonb_build_object(
        'enabled', false,
        'attachPdf', false,
        'schedule', jsonb_build_array('3_days_before', 'on_due_date', '7_days_after'),
        'tone', 'friendly'
      );
    end if;

    if v_invoice.use_defaults then
      v_enabled := coalesce((v_defaults->>'enabled')::boolean, false);
      v_schedule := array(
        select value
        from jsonb_array_elements_text(coalesce(v_defaults->'schedule', '[]'::jsonb)) as value
        where value = any (array['3_days_before','on_due_date','7_days_after'])
        order by array_position(array['3_days_before','on_due_date','7_days_after'], value)
      );
      v_tone := coalesce(v_defaults->>'tone', 'friendly');
      v_attach := coalesce((v_defaults->>'attachPdf')::boolean, false);
    else
      v_enabled := coalesce(v_invoice.override_enabled, false);
      v_schedule := array(
        select value
        from jsonb_array_elements_text(coalesce(v_invoice.override_schedule, '[]'::jsonb)) as value
        where value = any (array['3_days_before','on_due_date','7_days_after'])
        order by array_position(array['3_days_before','on_due_date','7_days_after'], value)
      );
      v_tone := coalesce(v_invoice.override_tone, 'friendly');
      v_attach := coalesce(v_invoice.override_attach, false);
    end if;

    if not v_enabled or v_schedule is null or array_length(v_schedule, 1) is null then
      continue;
    end if;

    foreach v_key in array v_schedule loop
      if v_key = '3_days_before' then
        v_target_date := v_invoice.due_date - 3;
      elsif v_key = 'on_due_date' then
        v_target_date := v_invoice.due_date;
      elsif v_key = '7_days_after' then
        v_target_date := v_invoice.due_date + 7;
      else
        continue;
      end if;

      if v_target_date <> current_date then
        continue;
      end if;

      perform 1
      from public.invoice_reminder_log
      where invoice_id = v_invoice.invoice_id
        and reminder_key = v_key
        and reminder_date = v_target_date;

      if found then
        continue;
      end if;

      insert into public.invoice_reminder_log (
        invoice_id,
        user_id,
        client_id,
        reminder_key,
        reminder_date,
        status,
        payload,
        created_at
      )
      values (
        v_invoice.invoice_id,
        v_invoice.user_id,
        v_invoice.client_id,
        v_key,
        v_target_date,
        'queued',
        jsonb_build_object(
          'tone', v_tone,
          'attachPdf', v_attach,
          'scheduled_at', v_now
        ),
        v_now
      );
    end loop;
  end loop;
end;
$$;

comment on function public.process_invoice_auto_reminders() is
'Queues invoice reminders for today based on workspace defaults or invoice overrides. Actual email sending should process invoice_reminder_log rows with status = ''queued''.';

-- ============================================
-- Section 4a: Queue reminder emails via pg_net
-- ============================================

create or replace function public.queue_invoice_reminder_emails()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reminder_record record;
  invoice_record record;
  client_record record;
  user_profile record;
  user_email text;
  request_id bigint;
  api_url text := 'https://invoice-it.org/api/send-invoice-email';
  currency_code text;
  currency_symbol text;
  invoice_data jsonb;
  user_data jsonb;
  reminder_payload jsonb;
  tone_key text;
  attach_pdf boolean;
begin
  for reminder_record in
    select *
    from public.invoice_reminder_log
    where status = 'queued'
    order by created_at asc
  loop
    begin
      -- Fetch invoice details needed for the API call
      select
        i.id,
        i.invoice_number,
        i.issue_date,
        i.due_date,
        i.subtotal,
        i.tax_amount,
        i.total_amount,
        i.notes,
        i.template,
        i.template_data,
        i.template_settings,
        i.currency_code
      into invoice_record
      from public.invoices i
      where i.id = reminder_record.invoice_id;

      if not found then
        update public.invoice_reminder_log
        set status = 'failed',
            payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object('queue_error', 'Invoice not found')
        where id = reminder_record.id;
        continue;
      end if;

      -- Client information
      select email, name, company_name
      into client_record
      from public.clients
      where id = reminder_record.client_id;

      if not found or client_record.email is null then
        update public.invoice_reminder_log
        set status = 'failed',
            payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object('queue_error', 'Client email missing')
        where id = reminder_record.id;
        continue;
      end if;

      -- User / workspace owner information
      select 
        p.full_name,
        p.company_name,
        u.email
      into user_profile
      from public.profiles p
      inner join auth.users u on u.id = p.id
      where p.id = reminder_record.user_id;

      user_email := coalesce(user_profile.email, 'invoices@mail.invoice-it.org');

      currency_code := coalesce(invoice_record.currency_code, 'USD');
      currency_symbol := case currency_code
        when 'USD' then '$'
        when 'EUR' then '€'
        when 'GBP' then '£'
        when 'NGN' then '₦'
        when 'CAD' then 'C$'
        when 'AUD' then 'A$'
        when 'JPY' then '¥'
        when 'INR' then '₹'
        when 'ZAR' then 'R'
        else '$'
      end;

      invoice_data := jsonb_build_object(
        'invoiceNumber', invoice_record.invoice_number,
        'issueDate', invoice_record.issue_date,
        'dueDate', invoice_record.due_date,
        'subtotal', invoice_record.subtotal,
        'taxAmount', invoice_record.tax_amount,
        'total', invoice_record.total_amount,
        'grandTotal', invoice_record.total_amount,
        'currencyCode', currency_code,
        'currencySymbol', currency_symbol,
        'notes', coalesce(invoice_record.notes, ''),
        'clientName', client_record.name,
        'clientEmail', client_record.email,
        'template', coalesce(invoice_record.template, 'default'),
        'templateData', coalesce(invoice_record.template_data, '{}'::jsonb),
        'templateSettings', coalesce(invoice_record.template_settings, '{}'::jsonb)
      );

      user_data := jsonb_build_object(
        'id', reminder_record.user_id,
        'fullName', coalesce(user_profile.full_name, ''),
        'businessName', coalesce(user_profile.company_name, ''),
        'email', user_email
      );

      reminder_payload := coalesce(reminder_record.payload, '{}'::jsonb);
      tone_key := coalesce(reminder_payload->>'tone', 'friendly');
      attach_pdf := coalesce((reminder_payload->>'attachPdf')::boolean, false);

      -- Fire-and-forget HTTP request
      select net.http_post(
        url := api_url,
        body := jsonb_build_object(
          'type', 'reminder',
          'reminderContext', jsonb_build_object(
            'reminderKey', reminder_record.reminder_key,
            'tone', tone_key,
            'attachPdf', attach_pdf,
            'reminderLogId', reminder_record.id
          ),
          'to', client_record.email,
          'invoiceData', invoice_data,
          'userData', user_data,
          'clientName', client_record.name,
          'businessName', coalesce(user_profile.company_name, null),
          'userEmail', user_email
        ),
        headers := jsonb_build_object('Content-Type', 'application/json'),
        timeout_milliseconds := 30000
      ) into request_id;

      -- Record the request for later processing
      insert into public.pending_email_requests (
        invoice_id,
        user_id,
        client_id,
        request_id,
        invoice_number,
        client_email,
        client_name,
        created_at,
        request_type,
        reminder_log_id,
        payload
      ) values (
        reminder_record.invoice_id,
        reminder_record.user_id,
        reminder_record.client_id,
        request_id,
        invoice_record.invoice_number,
        client_record.email,
        client_record.name,
        now(),
        'reminder',
        reminder_record.id,
        jsonb_build_object(
          'reminderKey', reminder_record.reminder_key,
          'tone', tone_key,
          'attachPdf', attach_pdf
        )
      );

      update public.invoice_reminder_log
      set status = 'processing',
          payload = reminder_payload || jsonb_build_object('queued_at', now(), 'request_id', request_id)
      where id = reminder_record.id;

    exception when others then
      update public.invoice_reminder_log
      set status = 'failed',
          payload = coalesce(reminder_record.payload, '{}'::jsonb) || jsonb_build_object('queue_error', SQLERRM, 'failed_at', now())
      where id = reminder_record.id;
    end;
  end loop;
end;
$$;

-- ============================================
-- Section 4b: Cron Schedule for reminder queue
-- ============================================

do $$
begin
  if exists (select 1 from cron.job where jobname = 'queue-invoice-reminder-emails') then
    perform cron.unschedule('queue-invoice-reminder-emails');
  end if;
end;
$$;

select cron.schedule(
  'queue-invoice-reminder-emails',
  '*/10 * * * *',
  $$
    select public.queue_invoice_reminder_emails();
  $$
);

-- ============================================
-- Section 4: Cron Schedule (hourly at minute 10)
-- ============================================

do $$
begin
  if exists (select 1 from cron.job where jobname = 'auto-reminders-hourly') then
    perform cron.unschedule('auto-reminders-hourly');
  end if;
end;
$$;

select cron.schedule(
  'auto-reminders-hourly',
  '10 * * * *',
  $$
    select public.process_invoice_auto_reminders();
  $$
);

