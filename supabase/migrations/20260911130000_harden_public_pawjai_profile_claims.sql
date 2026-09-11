-- Public About content must publish only verified partner and contact claims.
update public.pawjai_profile
set
  hero_slogan = 'Dog adoption and shelter matching in Thailand',
  mission_body = 'PawJai helps people discover dogs available for adoption through participating shelters in Thailand. People can review dog profiles, save their preferences, and request an in-person shelter visit. Adoption decisions and paperwork remain with each shelter.',
  partner_shelters = coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'name', entry->>'name',
        'detail', 'Dog adoption visits · Confirmed partner',
        'logo_url', entry->'logo_url',
        'confirmed', true
      )
      order by ordinal
    )
    from jsonb_array_elements(partner_shelters) with ordinality as partners(entry, ordinal)
    where lower(entry->>'name') = 'the voice foundation'
  ), '[]'::jsonb),
  contact_items = '[
    {"type":"email","label":"pawjaipet@gmail.com","href":"mailto:pawjaipet@gmail.com"},
    {"type":"website","label":"pawjaipet.com","href":"https://www.pawjaipet.com"}
  ]'::jsonb
where id = 'default';
