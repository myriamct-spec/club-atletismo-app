-- Autorregistro público como entrenador (pendiente de aprobación del admin).
--
-- Un usuario recién autenticado (tras supabase.auth.signUp, sin fila
-- todavía en `usuarios`) no cumple ninguna política RLS existente para
-- insertar en `usuarios` (usuarios_insert_admin exige ya ser admin del
-- club). Esta función, con security definer, hace exactamente una cosa
-- muy acotada: crea la fila del propio usuario que llama, siempre como
-- entrenador y siempre inactiva (activo = false), del único club del
-- proyecto. No permite autoasignarse rol de admin ni activarse a sí
-- mismo: el admin aprueba después desde /usuarios (activar = dar acceso).
create or replace function registrar_entrenador(p_nombre text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid;
begin
  select id into v_club_id from clubs limit 1;

  insert into usuarios (id, club_id, nombre, email, rol, activo)
  values (auth.uid(), v_club_id, p_nombre, auth.jwt() ->> 'email', 'entrenador', false)
  on conflict (id) do nothing;
end;
$$;

grant execute on function registrar_entrenador(text) to authenticated;
