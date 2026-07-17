-- Bucket para fotos de atleta, subidas por cualquier entrenador o admin del club
-- (a diferencia del logo del club, que solo puede tocar el admin).

insert into storage.buckets (id, name, public)
values ('atleta-fotos', 'atleta-fotos', true)
on conflict (id) do nothing;

create policy "atleta_fotos_public_read" on storage.objects
  for select using (bucket_id = 'atleta-fotos');

create policy "atleta_fotos_club_write" on storage.objects
  for insert with check (
    bucket_id = 'atleta-fotos'
    and auth_rol() in ('admin', 'entrenador')
    and (storage.foldername(name))[1] = auth_club_id()::text
  );

create policy "atleta_fotos_club_update" on storage.objects
  for update using (
    bucket_id = 'atleta-fotos'
    and auth_rol() in ('admin', 'entrenador')
    and (storage.foldername(name))[1] = auth_club_id()::text
  );
