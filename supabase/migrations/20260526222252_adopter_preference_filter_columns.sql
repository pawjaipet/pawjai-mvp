alter table public.adopter_preferences
  add column if not exists preferred_breeds text[] not null default '{}'::text[],
  add column if not exists preferred_age_min_months integer,
  add column if not exists preferred_age_max_months integer,
  add column if not exists preferred_protectiveness text[] not null default '{}'::text[],
  add column if not exists preferred_affection_styles text[] not null default '{}'::text[],
  add column if not exists preferred_training_preferences text[] not null default '{}'::text[],
  add column if not exists preferred_people_friendliness text[] not null default '{}'::text[],
  add column if not exists preferred_special_needs text[] not null default '{}'::text[];

alter table public.adopter_preferences
  drop constraint if exists adopter_preferences_age_min_non_negative,
  drop constraint if exists adopter_preferences_age_max_non_negative,
  drop constraint if exists adopter_preferences_age_range_valid;

alter table public.adopter_preferences
  add constraint adopter_preferences_age_min_non_negative
    check (preferred_age_min_months is null or preferred_age_min_months >= 0),
  add constraint adopter_preferences_age_max_non_negative
    check (preferred_age_max_months is null or preferred_age_max_months >= 0),
  add constraint adopter_preferences_age_range_valid
    check (
      preferred_age_min_months is null
      or preferred_age_max_months is null
      or preferred_age_max_months >= preferred_age_min_months
    );

create index if not exists adopter_preferences_preferred_breeds_idx
  on public.adopter_preferences using gin (preferred_breeds);

create index if not exists adopter_preferences_preferred_protectiveness_idx
  on public.adopter_preferences using gin (preferred_protectiveness);

create index if not exists adopter_preferences_preferred_affection_styles_idx
  on public.adopter_preferences using gin (preferred_affection_styles);

create index if not exists adopter_preferences_preferred_training_preferences_idx
  on public.adopter_preferences using gin (preferred_training_preferences);

create index if not exists adopter_preferences_preferred_people_friendliness_idx
  on public.adopter_preferences using gin (preferred_people_friendliness);

create index if not exists adopter_preferences_preferred_special_needs_idx
  on public.adopter_preferences using gin (preferred_special_needs);

create index if not exists adopter_preferences_preferred_age_range_idx
  on public.adopter_preferences (preferred_age_min_months, preferred_age_max_months);
