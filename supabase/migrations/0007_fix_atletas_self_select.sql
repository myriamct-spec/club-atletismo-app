-- El fix anterior (volatile) no era suficiente: la causa real es que
-- atleta_visible() hace una subconsulta que vuelve a mirar la tabla
-- "atletas" por su id. Cuando esa comprobación se dispara automáticamente
-- en un INSERT ... RETURNING (la política de SELECT se evalúa sobre la fila
-- recién creada), esa subconsulta no ve la fila que la propia sentencia
-- está insertando — es una particularidad real de Postgres con políticas
-- que se autoconsultan, no un problema de volatilidad de la función.
--
-- La solución: la política de "atletas" ya no necesita subconsulta, porque
-- las columnas que hacen falta (club_id, fecha_nacimiento, id) están en la
-- propia fila que se está evaluando. grupo_lo_incluye() recibe esos valores
-- directamente en vez de ir a buscarlos.

create or replace function grupo_lo_incluye(p_club_id uuid, p_fecha_nacimiento date, p_atleta_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1
    from entrenador_grupo eg
    join grupos g on g.id = eg.grupo_id
    where eg.entrenador_id = auth.uid()
      and g.club_id = p_club_id
      and (
        (g.tipo = 'categoria_edad' and g.categoria = categoria_atleta(p_fecha_nacimiento))
        or (
          g.tipo = 'entrenamiento'
          and exists (select 1 from atleta_grupo ag where ag.atleta_id = p_atleta_id and ag.grupo_id = g.id)
        )
      )
  )
$$;

drop policy "atletas_select" on atletas;
drop policy "atletas_update" on atletas;

create policy "atletas_select" on atletas for select using (
  club_id = auth_club_id()
  and (auth_rol() = 'admin' or grupo_lo_incluye(club_id, fecha_nacimiento, id))
);

create policy "atletas_update" on atletas for update using (
  club_id = auth_club_id()
  and (auth_rol() = 'admin' or grupo_lo_incluye(club_id, fecha_nacimiento, id))
);

-- atleta_visible() se mantiene tal cual para resultados/pruebas_fisicas/
-- comentarios: esas tablas solo tienen atleta_id (FK) y sí necesitan ir a
-- buscar el atleta a la tabla atletas, pero ese insert no modifica
-- "atletas" en la misma sentencia, así que no sufren este problema.
create or replace function atleta_visible(p_atleta_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from atletas a
    where a.id = p_atleta_id
      and a.club_id = auth_club_id()
      and (auth_rol() = 'admin' or grupo_lo_incluye(a.club_id, a.fecha_nacimiento, a.id))
  )
$$;
