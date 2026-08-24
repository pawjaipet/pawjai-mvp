alter table public.donation_intents
  drop constraint if exists donation_intents_proof_image_mime_type;

alter table public.donation_intents
  add constraint donation_intents_proof_image_mime_type
  check (
    proof_mime_type is null
    or proof_mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')
  ) not valid;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-slips',
  'donation-slips',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
