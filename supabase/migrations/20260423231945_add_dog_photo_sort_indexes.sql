create index if not exists dog_photos_dog_id_sort_order_idx
  on public.dog_photos (dog_id, sort_order);

create index if not exists dog_photos_dog_id_created_at_idx
  on public.dog_photos (dog_id, created_at desc);
