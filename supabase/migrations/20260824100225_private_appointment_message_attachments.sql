alter table public.appointment_messages
  add column if not exists attachment_storage_path text;

update public.appointment_messages
set attachment_storage_path = regexp_replace(
  split_part(
    attachment_url,
    '/storage/v1/object/public/appointment-message-attachments/',
    2
  ),
  '\?.*$',
  ''
)
where attachment_storage_path is null
  and attachment_url like '%/storage/v1/object/public/appointment-message-attachments/%';

create index if not exists appointment_messages_attachment_storage_path_idx
  on public.appointment_messages (attachment_storage_path)
  where attachment_storage_path is not null;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'appointment-message-attachments',
  'appointment-message-attachments',
  false,
  209715200,
  array[
    'application/pdf',
    'image/heic',
    'image/heif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
