-- Add only matching preferences; do not apply unrelated legacy migrations.
alter table public.adopter_preferences
  add column if not exists filter_answers jsonb not null default '{}'::jsonb,
  add column if not exists filter_summary text,
  add column if not exists preferred_breeds text[] not null default '{}'::text[],
  add column if not exists preferred_age_min_months integer check (preferred_age_min_months >= 0),
  add column if not exists preferred_age_max_months integer check (preferred_age_max_months >= 0),
  add column if not exists preferred_protectiveness text[] not null default '{}'::text[],
  add column if not exists preferred_affection_styles text[] not null default '{}'::text[],
  add column if not exists preferred_training_preferences text[] not null default '{}'::text[],
  add column if not exists preferred_people_friendliness text[] not null default '{}'::text[],
  add column if not exists preferred_special_needs text[] not null default '{}'::text[];
notify pgrst, 'reload schema';
