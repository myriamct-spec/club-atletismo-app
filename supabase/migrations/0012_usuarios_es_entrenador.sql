-- "rol" (admin/entrenador) controla el acceso al panel de administración.
-- "es_entrenador" es independiente: dice si esa persona puede aparecer como
-- responsable asignable de un grupo. Todo entrenador lo es por definición;
-- un admin puede además entrenar (o no) — por defecto un admin nuevo NO
-- aparece en la lista de responsables, salvo que se marque explícitamente.
alter table usuarios add column if not exists es_entrenador boolean not null default false;

update usuarios set es_entrenador = true where rol = 'entrenador';

-- El autorregistro (0011) también debe marcar es_entrenador = true, ya que
-- crea siempre una fila con rol = 'entrenador'.
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

  insert into usuarios (id, club_id, nombre, email, rol, activo, es_entrenador)
  values (auth.uid(), v_club_id, p_nombre, auth.jwt() ->> 'email', 'entrenador', false, true)
  on conflict (id) do nothing;
end;
$$;
