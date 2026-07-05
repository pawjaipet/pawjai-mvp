-- Supabase advisor security fixes.
-- Public buckets can serve public URLs without broad object-listing SELECT policies.

alter function public.set_updated_at()
set search_path = '';

alter function public.sync_dog_cover_photo()
set search_path = '';

drop policy if exists "public_read_dog_photos" on storage.objects;
drop policy if exists "public_read_profile_pictures" on storage.objects;
drop policy if exists "shelter_assets_public_select" on storage.objects;
