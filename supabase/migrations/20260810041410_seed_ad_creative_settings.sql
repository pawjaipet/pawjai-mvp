insert into public.site_settings (key, value)
values (
  'ads_creative_specs',
  '{
    "width": 370,
    "height": 560,
    "maxVideoSeconds": 10,
    "maxUploadMb": 50
  }'::jsonb
)
on conflict (key) do update
set value = public.site_settings.value || excluded.value,
    updated_at = now();
