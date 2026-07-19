-- atleta_visible() estaba marcada STABLE: Postgres usa entonces una foto fija
-- de la base de datos tomada al principio de la sentencia. En un
-- "INSERT ... RETURNING" esa foto se toma antes de insertar la fila, así que
-- la comprobación de RLS para el RETURNING no veía la fila recién creada y
-- rechazaba la inserción con "new row violates row-level security policy"
-- aunque el INSERT en sí fuera válido (confirmado: sin RETURNING funcionaba).
-- VOLATILE obliga a reevaluar siempre contra el estado actual.

create or replace function atleta_visible(p_atleta_id uuid)
returns boolean
language sql security definer volatile set search_path = public
as $$
  select exists (
    select 1 from atletas a
    where a.id = p_atleta_id
      and a.club_id = auth_club_id()
      and (
        auth_rol() = 'admin'
        or exists (
          select 1
          from entrenador_grupo eg
          join grupos g on g.id = eg.grupo_id
          where eg.entrenador_id = auth.uid()
            and g.club_id = a.club_id
            and (
              (g.tipo = 'categoria_edad' and g.categoria = categoria_atleta(a.fecha_nacimiento))
              or (
                g.tipo = 'entrenamiento'
                and exists (select 1 from atleta_grupo ag where ag.atleta_id = a.id and ag.grupo_id = g.id)
              )
            )
        )
      )
  )
$$;
