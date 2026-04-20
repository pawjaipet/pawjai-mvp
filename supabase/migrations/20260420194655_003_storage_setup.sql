insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-pictures', 'profile-pictures', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('dog-photos', 'dog-photos', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('identity-documents', 'identity-documents', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('application-documents', 'application-documents', false, 15728640, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "public_read_profile_pictures"
on storage.objects
for select
to public
using (bucket_id = 'profile-pictures');

create policy "owners_manage_profile_pictures"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "public_read_dog_photos"
on storage.objects
for select
to public
using (bucket_id = 'dog-photos');

create policy "shelter_staff_manage_dog_photos"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'dog-photos'
  and (
    exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
    or exists (
      select 1
      from public.dogs d
      join public.shelter_users su
        on su.shelter_id = d.shelter_id
      where d.id::text = (storage.foldername(name))[1]
        and su.profile_id = auth.uid()
        and su.role in ('owner', 'staff')
    )
  )
)
with check (
  bucket_id = 'dog-photos'
  and (
    exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
    or exists (
      select 1
      from public.dogs d
      join public.shelter_users su
        on su.shelter_id = d.shelter_id
      where d.id::text = (storage.foldername(name))[1]
        and su.profile_id = auth.uid()
        and su.role in ('owner', 'staff')
    )
  )
);

create policy "owners_manage_identity_documents"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'identity-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
  )
)
with check (
  bucket_id = 'identity-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
  )
);

create policy "related_parties_manage_application_documents"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'application-documents'
  and (
    exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
    or exists (
      select 1
      from public.applications app
      join public.adopters a
        on a.id = app.adopter_id
      where app.id::text = (storage.foldername(name))[1]
        and a.profile_id = auth.uid()
    )
    or exists (
      select 1
      from public.applications app
      join public.shelter_users su
        on su.shelter_id = app.shelter_id
      where app.id::text = (storage.foldername(name))[1]
        and su.profile_id = auth.uid()
    )
  )
)
with check (
  bucket_id = 'application-documents'
  and (
    exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
    or exists (
      select 1
      from public.applications app
      join public.adopters a
        on a.id = app.adopter_id
      where app.id::text = (storage.foldername(name))[1]
        and a.profile_id = auth.uid()
    )
    or exists (
      select 1
      from public.applications app
      join public.shelter_users su
        on su.shelter_id = app.shelter_id
      where app.id::text = (storage.foldername(name))[1]
        and su.profile_id = auth.uid()
    )
  )
);
