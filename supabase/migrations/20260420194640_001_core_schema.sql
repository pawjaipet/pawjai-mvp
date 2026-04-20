create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;

create type public.app_role as enum ('adopter', 'shelter_admin', 'admin');
create type public.shelter_membership_role as enum ('owner', 'staff', 'viewer');
create type public.availability_type as enum ('available', 'unavailable');
create type public.dog_gender as enum ('male', 'female', 'unknown');
create type public.dog_size as enum ('small', 'medium', 'large', 'extra_large');
create type public.dog_adoption_status as enum ('draft', 'available', 'reserved', 'adopted', 'unavailable');
create type public.dog_energy_level as enum ('low', 'medium', 'high');
create type public.application_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn');
create type public.application_document_type as enum ('house_image', 'income_statement', 'id_copy', 'other');
create type public.appointment_status as enum ('requested', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.question_type as enum ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'boolean', 'number', 'date');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    role,
    full_name,
    phone_number,
    profile_picture_url
  )
  values (
    new.id,
    'adopter',
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone_number', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'profile_picture_url', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'adopter',
  full_name text,
  phone_number text,
  profile_picture_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.adopters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  first_name text,
  last_name text,
  email extensions.citext,
  phone_number text,
  occupation text,
  address_line text,
  subdistrict text,
  district text,
  province text,
  country text,
  postal_code text,
  id_passport_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index adopters_email_unique_idx
  on public.adopters (email)
  where email is not null;

create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text,
  email extensions.citext,
  address_line text,
  subdistrict text,
  district text,
  province text,
  country text,
  postal_code text,
  shelter_size integer,
  shelter_type text,
  hygiene_rating integer,
  professionalism_rating integer,
  description text,
  website_url text,
  facebook_url text,
  instagram_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint shelters_shelter_size_positive check (shelter_size is null or shelter_size >= 0),
  constraint shelters_hygiene_rating_valid check (hygiene_rating is null or hygiene_rating between 1 and 5),
  constraint shelters_professionalism_rating_valid check (professionalism_rating is null or professionalism_rating between 1 and 5)
);

create unique index shelters_email_unique_idx
  on public.shelters (email)
  where email is not null;

create table public.shelter_users (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.shelter_membership_role not null default 'staff',
  created_at timestamptz not null default timezone('utc', now()),
  unique (shelter_id, profile_id)
);

create table public.shelter_availability (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  availability_type public.availability_type not null,
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint shelter_availability_date_range_valid check (end_date >= start_date)
);

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  name text not null,
  background text,
  breed text,
  gender public.dog_gender not null default 'unknown',
  age_months integer,
  weight_kg numeric(5,2),
  size public.dog_size,
  sterilized boolean not null default false,
  adoption_status public.dog_adoption_status not null default 'draft',
  special_needs text,
  energy_level public.dog_energy_level,
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  house_trained boolean,
  leash_trained boolean,
  human_friendly boolean,
  dog_friendly boolean,
  animal_friendly boolean,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint dogs_age_months_positive check (age_months is null or age_months >= 0),
  constraint dogs_weight_positive check (weight_kg is null or weight_kg >= 0)
);

create table public.dog_photos (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  storage_path text not null,
  public_url text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint dog_photos_sort_order_non_negative check (sort_order >= 0)
);

create unique index dog_photos_one_cover_per_dog_idx
  on public.dog_photos (dog_id)
  where is_cover = true;

create table public.dog_traits (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  trait_type text not null,
  trait_value text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (dog_id, trait_type, trait_value)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  adopter_id uuid not null references public.adopters (id) on delete cascade,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  status public.application_status not null default 'draft',
  notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (dog_id, adopter_id)
);

create table public.application_details (
  application_id uuid primary key references public.applications (id) on delete cascade,
  purpose text,
  living_condition text,
  housing_type text,
  living_size_sqm numeric(8,2),
  family_size integer,
  monthly_salary_thb numeric(12,2),
  dogs_count integer,
  cats_count integer,
  other_pets_count integer,
  experience_with_pets text,
  daily_routine text,
  preferred_traits text,
  location_subdistrict text,
  location_district text,
  location_province text,
  location_country text,
  location_postal_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint application_details_living_size_positive check (living_size_sqm is null or living_size_sqm >= 0),
  constraint application_details_family_size_positive check (family_size is null or family_size >= 0),
  constraint application_details_salary_positive check (monthly_salary_thb is null or monthly_salary_thb >= 0),
  constraint application_details_dogs_count_positive check (dogs_count is null or dogs_count >= 0),
  constraint application_details_cats_count_positive check (cats_count is null or cats_count >= 0),
  constraint application_details_other_pets_count_positive check (other_pets_count is null or other_pets_count >= 0)
);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  document_type public.application_document_type not null,
  storage_path text not null,
  public_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  adopter_id uuid not null references public.adopters (id) on delete cascade,
  dog_id uuid references public.dogs (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  status public.appointment_status not null default 'requested',
  visitor_note text,
  shelter_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index appointments_schedule_idx
  on public.appointments (shelter_id, appointment_date, appointment_time);

create table public.wishlists (
  adopter_id uuid not null references public.adopters (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (adopter_id, dog_id)
);

create table public.questionnaire_templates (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.questionnaire_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.questionnaire_templates (id) on delete cascade,
  question_text text not null,
  question_type public.question_type not null,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  constraint questionnaire_questions_options_is_array check (jsonb_typeof(options) = 'array'),
  constraint questionnaire_questions_sort_order_non_negative check (sort_order >= 0)
);

create table public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  question_id uuid not null references public.questionnaire_questions (id) on delete cascade,
  answer_text text,
  answer_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (application_id, question_id)
);

create index shelter_users_profile_id_idx on public.shelter_users (profile_id);
create index shelter_availability_shelter_id_idx on public.shelter_availability (shelter_id);
create index shelter_availability_dates_idx on public.shelter_availability (start_date, end_date);
create index dogs_shelter_id_idx on public.dogs (shelter_id);
create index dogs_status_idx on public.dogs (adoption_status);
create index dogs_name_idx on public.dogs (name);
create index dog_photos_dog_id_idx on public.dog_photos (dog_id);
create index dog_traits_dog_id_idx on public.dog_traits (dog_id);
create index dog_traits_type_value_idx on public.dog_traits (trait_type, trait_value);
create index applications_dog_id_idx on public.applications (dog_id);
create index applications_adopter_id_idx on public.applications (adopter_id);
create index applications_shelter_id_idx on public.applications (shelter_id);
create index applications_status_idx on public.applications (status);
create index application_documents_application_id_idx on public.application_documents (application_id);
create index appointments_adopter_id_idx on public.appointments (adopter_id);
create index appointments_application_id_idx on public.appointments (application_id);
create index questionnaire_templates_shelter_id_idx on public.questionnaire_templates (shelter_id);
create index questionnaire_questions_template_id_idx on public.questionnaire_questions (template_id);
create index application_answers_application_id_idx on public.application_answers (application_id);
create index application_answers_question_id_idx on public.application_answers (question_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_adopters_updated_at
before update on public.adopters
for each row
execute function public.set_updated_at();

create trigger set_shelters_updated_at
before update on public.shelters
for each row
execute function public.set_updated_at();

create trigger set_dogs_updated_at
before update on public.dogs
for each row
execute function public.set_updated_at();

create trigger set_applications_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

create trigger set_application_details_updated_at
before update on public.application_details
for each row
execute function public.set_updated_at();

create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();
