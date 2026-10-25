begin;
do $$
declare test_adopter uuid;
begin
  select adopter_id into test_adopter from public.adopter_preferences limit 1;
  if test_adopter is null then raise exception 'No preference row available for rollback test'; end if;
  update public.adopter_preferences set
    preferred_protectiveness = array['Highly protective'],
    preferred_affection_styles = array['Subtle'],
    preferred_training_preferences = array['Dogs still in training'],
    preferred_people_friendliness = array['Takes time to get to know new people'],
    filter_answers = '{"answers":{"0":["Small","Medium"],"3":["Low","Medium"],"8":["Okay with other dogs but not too social"]}}'::jsonb
  where adopter_id = test_adopter;
  if not exists (select 1 from public.adopter_preferences where adopter_id=test_adopter
    and preferred_protectiveness=array['Highly protective']
    and preferred_affection_styles=array['Subtle']
    and preferred_training_preferences=array['Dogs still in training']
    and preferred_people_friendliness=array['Takes time to get to know new people']
    and jsonb_array_length(filter_answers->'answers'->'3')=2) then
    raise exception 'Matching preferences failed to round-trip';
  end if;
end $$;
rollback;
select 'Matching preferences round-trip passed; test changes rolled back' as result;
