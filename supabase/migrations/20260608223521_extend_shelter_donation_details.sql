alter table public.shelters
  add column if not exists promptpay_id text,
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_name text;

alter table public.shelters
  drop constraint if exists shelters_promptpay_id_format;

alter table public.shelters
  add constraint shelters_promptpay_id_format
  check (
    promptpay_id is null
    or promptpay_id ~ '^([0-9]{10}|[0-9]{13})$'
  );
