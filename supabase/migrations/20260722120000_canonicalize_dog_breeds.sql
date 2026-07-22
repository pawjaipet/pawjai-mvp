create or replace function public.pawjai_canonical_dog_breed(raw_breed text)
returns text
language sql
immutable
as $$
  select case
    when raw_breed is null or btrim(raw_breed) = '' then null
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) = 'mixed breed' then 'Mixed Breed'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) in (
      'mixed',
      'mutt',
      'mongrel',
      'crossbreed',
      'cross breed',
      'thai mix',
      'thai mixed',
      'thai mixed breed',
      'thai mixed-breed',
      'poodle terrier mix'
    ) then 'Mixed Breed'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) like '% mix'
      or lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) like '% mixed'
      or lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) like '% mixed breed'
      then 'Mixed Breed'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) = 'thai dog' then 'Thai Dog'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) in (
      'thai local dog',
      'local thai dog',
      'thai street dog',
      'street dog'
    ) then 'Thai Dog'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) in ('thai bangkaew', 'thai bangkaew dog') then 'Thai Bangkaew'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) in ('ridgeback', 'thai ridgeback', 'thai ridgeback dog') then 'Thai Ridgeback'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) in ('husky', 'siberian husky') then 'Siberian Husky'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) in ('welsh corgi', 'pembroke welsh corgi', 'cardigan welsh corgi') then 'Corgi'
    when lower(btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))) in ('miniature schnauzer', 'standard schnauzer') then 'Schnauzer'
    else btrim(regexp_replace(raw_breed, '[[:space:]]+', ' ', 'g'))
  end
$$;

update public.dogs
set breed = public.pawjai_canonical_dog_breed(breed)
where breed is not null
  and breed is distinct from public.pawjai_canonical_dog_breed(breed);

update public.adopter_preferences
set preferred_breeds = coalesce(
  (
    select array_agg(distinct canonical_breed order by canonical_breed)
    from (
      select public.pawjai_canonical_dog_breed(value) as canonical_breed
      from unnest(preferred_breeds) as value
    ) normalized
    where canonical_breed = any (array[
      'Mixed Breed',
      'Thai Dog',
      'Thai Bangkaew',
      'Thai Ridgeback',
      'Golden Retriever',
      'Labrador Retriever',
      'German Shepherd',
      'Siberian Husky',
      'Poodle',
      'Shih Tzu',
      'Pomeranian',
      'Chihuahua',
      'Beagle',
      'Dachshund',
      'French Bulldog',
      'Bulldog',
      'Pug',
      'Yorkshire Terrier',
      'Cocker Spaniel',
      'Border Collie',
      'Australian Shepherd',
      'Rottweiler',
      'Doberman Pinscher',
      'Belgian Malinois',
      'Boxer',
      'Bull Terrier',
      'Shiba Inu',
      'Akita',
      'Corgi',
      'Schnauzer'
    ])
  ),
  '{}'::text[]
)
where preferred_breeds is not null;

drop function public.pawjai_canonical_dog_breed(text);
