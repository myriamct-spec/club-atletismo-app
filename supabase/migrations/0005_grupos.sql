-- Sustituye la asignación directa entrenador↔atleta por un modelo de grupos:
-- un entrenador se asigna a uno o varios grupos, y un atleta pertenece a un
-- grupo por categoría de edad (automático, según fecha de nacimiento) o por
-- grupo de entrenamiento (manual, para la categoría Absoluto).

create table grupos (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('categoria_edad', 'entrenamiento')),
  -- solo relevante si tipo = 'categoria_edad'; una de las categorías que
  -- calcula categoria_atleta() más abajo (Absoluto queda fuera a propósito).
  categoria text check (
    categoria is null or categoria in ('Benjamín','Alevín','Infantil','Cadete','Juvenil','Junior','Promesa')
  ),
  check (
    (tipo = 'categoria_edad' and categoria is not null) or
    (tipo = 'entrenamiento' and categoria is null)
  ),
  unique (club_id, nombre)
);

create table entrenador_grupo (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos(id) on delete cascade,
  entrenador_id uuid not null references usuarios(id) on delete cascade,
  unique (grupo_id, entrenador_id)
);

-- Pertenencia manual, solo se usa para grupos de tipo 'entrenamiento'
-- (categoría Absoluto). Para grupos 'categoria_edad' la pertenencia se
-- calcula al vuelo comparando categoria_atleta(fecha_nacimiento).
create table atleta_grupo (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas(id) on delete cascade,
  grupo_id uuid not null references grupos(id) on delete cascade,
  unique (atleta_id, grupo_id)
);

-- Réplica en SQL de src/lib/categorias.ts (calcularCategoria). Si se toca un
-- lado hay que tocar el otro: aquí decide a quién ve cada entrenador (RLS),
-- allí decide qué se muestra en pantalla.
create or replace function categoria_atleta(p_fecha_nacimiento date, p_temporada int default extract(year from now())::int)
returns text
language sql immutable
as $$
  select case
    when (p_temporada - extract(year from p_fecha_nacimiento)::int) <= 10 then 'Benjamín'
    when (p_temporada - extract(year from p_fecha_nacimiento)::int) <= 12 then 'Alevín'
    when (p_temporada - extract(year from p_fecha_nacimiento)::int) <= 14 then 'Infantil'
    when (p_temporada - extract(year from p_fecha_nacimiento)::int) <= 16 then 'Cadete'
    when (p_temporada - extract(year from p_fecha_nacimiento)::int) <= 18 then 'Juvenil'
    when (p_temporada - extract(year from p_fecha_nacimiento)::int) <= 20 then 'Junior'
    when (p_temporada - extract(year from p_fecha_nacimiento)::int) <= 22 then 'Promesa'
    else 'Absoluto'
  end
$$;

-- Un atleta es visible si, o soy admin, o soy entrenador de algún grupo al
-- que pertenece: por categoría de edad (automático) o por asignación manual
-- en atleta_grupo (grupos de entrenamiento).
create or replace function atleta_visible(p_atleta_id uuid)
returns boolean
language sql security definer stable set search_path = public
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

-- La asignación entrenador-atleta directa queda sustituida por grupos.
drop policy if exists "entrenador_atleta_select" on entrenador_atleta;
drop policy if exists "entrenador_atleta_admin" on entrenador_atleta;
drop table if exists entrenador_atleta;

alter table grupos enable row level security;
alter table entrenador_grupo enable row level security;
alter table atleta_grupo enable row level security;

create policy "grupos_select" on grupos for select using (club_id = auth_club_id());
create policy "grupos_admin" on grupos for all
  using (club_id = auth_club_id() and auth_rol() = 'admin')
  with check (club_id = auth_club_id() and auth_rol() = 'admin');

create policy "entrenador_grupo_select" on entrenador_grupo for select using (
  exists (select 1 from grupos g where g.id = grupo_id and g.club_id = auth_club_id())
);
create policy "entrenador_grupo_admin" on entrenador_grupo for all
  using (
    auth_rol() = 'admin'
    and exists (select 1 from grupos g where g.id = grupo_id and g.club_id = auth_club_id())
  )
  with check (
    auth_rol() = 'admin'
    and exists (select 1 from grupos g where g.id = grupo_id and g.club_id = auth_club_id())
  );

create policy "atleta_grupo_select" on atleta_grupo for select using (
  exists (select 1 from atletas a where a.id = atleta_id and a.club_id = auth_club_id())
);
create policy "atleta_grupo_admin" on atleta_grupo for all
  using (
    auth_rol() = 'admin'
    and exists (select 1 from atletas a where a.id = atleta_id and a.club_id = auth_club_id())
  )
  with check (
    auth_rol() = 'admin'
    and exists (select 1 from atletas a where a.id = atleta_id and a.club_id = auth_club_id())
  );

grant select, insert, update, delete on grupos, entrenador_grupo, atleta_grupo to authenticated;
