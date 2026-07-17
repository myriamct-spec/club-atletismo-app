create extension if not exists "pgcrypto";

-- ── Tablas ──────────────────────────────────────────────

create table clubs (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  club_id uuid not null references clubs(id) on delete cascade,
  nombre text not null,
  email text not null,
  rol text not null check (rol in ('admin','entrenador'))
);

create table atletas (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  nombre text not null,
  apellidos text not null,
  fecha_nacimiento date not null,
  genero text not null,
  id_socio text,
  fecha_alta date not null default current_date,
  foto_url text,
  lesionado boolean not null default false,
  observaciones_generales text,
  activo boolean not null default true,
  unique (club_id, id_socio)
);

create table entrenador_atleta (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas(id) on delete cascade,
  entrenador_id uuid not null references usuarios(id) on delete cascade,
  fecha_asignacion date not null default current_date,
  activo boolean not null default true,
  unique (atleta_id, entrenador_id)
);

create table disciplinas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  unidad_medida text not null check (unidad_medida in ('tiempo','distancia','altura','puntos'))
);

create table competiciones (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  nombre text not null,
  fecha date not null,
  lugar text,
  tipo text not null check (tipo in ('pista_aire_libre','pista_cubierta','campo_a_traves','ruta')),
  temporada text not null,
  origen text not null default 'manual' check (origen in ('manual','importado'))
);

create table resultados (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas(id) on delete cascade,
  competicion_id uuid not null references competiciones(id) on delete cascade,
  disciplina_id uuid not null references disciplinas(id),
  marca text not null,
  puesto int,
  viento numeric,
  es_marca_personal boolean not null default false,
  observaciones text
);

create table pruebas_fisicas (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas(id) on delete cascade,
  tipo text not null check (tipo in ('fuerza','velocidad','resistencia','flexibilidad','otra')),
  fecha date not null,
  valor numeric not null,
  unidad text not null,
  protocolo text,
  entrenador_id uuid not null references usuarios(id)
);

-- Histórico fechado de observaciones del entrenador (alimenta el informe de evolución).
-- Distinto de atletas.observaciones_generales, que es una nota libre sin fecha en la propia ficha.
create table comentarios (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas(id) on delete cascade,
  entrenador_id uuid not null references usuarios(id),
  fecha date not null default current_date,
  texto text not null,
  categoria text
);

create table importacion_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  tipo text not null check (tipo in ('atletas','resultados')),
  fecha timestamptz not null default now(),
  usuario_id uuid not null references usuarios(id),
  archivo_nombre text not null,
  filas_totales int not null,
  filas_ok int not null,
  filas_error int not null,
  detalle_errores text
);

-- ── Funciones de apoyo para RLS ─────────────────────────
-- security definer: evitan que las policies de "usuarios" se autorreferencien.

create or replace function auth_club_id()
returns uuid
language sql security definer stable set search_path = public
as $$
  select club_id from usuarios where id = auth.uid()
$$;

create or replace function auth_rol()
returns text
language sql security definer stable set search_path = public
as $$
  select rol from usuarios where id = auth.uid()
$$;

-- Un atleta es visible si pertenece a mi club y, o soy admin, o tengo una
-- asignación activa en entrenador_atleta (relación N:M confirmada con el club).
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
          select 1 from entrenador_atleta ea
          where ea.atleta_id = a.id and ea.entrenador_id = auth.uid() and ea.activo
        )
      )
  )
$$;

-- ── Row Level Security ──────────────────────────────────

alter table clubs enable row level security;
alter table usuarios enable row level security;
alter table atletas enable row level security;
alter table entrenador_atleta enable row level security;
alter table disciplinas enable row level security;
alter table competiciones enable row level security;
alter table resultados enable row level security;
alter table pruebas_fisicas enable row level security;
alter table comentarios enable row level security;
alter table importacion_logs enable row level security;

create policy "clubs_select" on clubs for select using (id = auth_club_id());
create policy "clubs_update_admin" on clubs for update using (id = auth_club_id() and auth_rol() = 'admin');

create policy "usuarios_select_club" on usuarios for select using (club_id = auth_club_id());
create policy "usuarios_insert_admin" on usuarios for insert with check (auth_rol() = 'admin' and club_id = auth_club_id());
create policy "usuarios_update_admin" on usuarios for update using (auth_rol() = 'admin' and club_id = auth_club_id());
create policy "usuarios_delete_admin" on usuarios for delete using (auth_rol() = 'admin' and club_id = auth_club_id());

-- El alta la hace el admin (que también gestiona las asignaciones en entrenador_atleta):
-- si un entrenador diera de alta un atleta sin tener aún una asignación, atleta_visible()
-- le impediría verlo justo después de crearlo.
create policy "atletas_select" on atletas for select using (atleta_visible(id));
create policy "atletas_insert_admin" on atletas for insert with check (club_id = auth_club_id() and auth_rol() = 'admin');
create policy "atletas_update" on atletas for update using (atleta_visible(id));
create policy "atletas_delete_admin" on atletas for delete using (club_id = auth_club_id() and auth_rol() = 'admin');

create policy "entrenador_atleta_select" on entrenador_atleta for select using (
  exists (select 1 from atletas a where a.id = atleta_id and a.club_id = auth_club_id())
);
create policy "entrenador_atleta_admin" on entrenador_atleta for all using (
  auth_rol() = 'admin'
  and exists (select 1 from atletas a where a.id = atleta_id and a.club_id = auth_club_id())
) with check (
  auth_rol() = 'admin'
  and exists (select 1 from atletas a where a.id = atleta_id and a.club_id = auth_club_id())
);

create policy "disciplinas_select_all" on disciplinas for select using (true);
create policy "disciplinas_insert_admin" on disciplinas for insert with check (auth_rol() = 'admin');

create policy "competiciones_select" on competiciones for select using (club_id = auth_club_id());
create policy "competiciones_insert" on competiciones for insert with check (club_id = auth_club_id());
create policy "competiciones_update" on competiciones for update using (club_id = auth_club_id());
create policy "competiciones_delete_admin" on competiciones for delete using (club_id = auth_club_id() and auth_rol() = 'admin');

create policy "resultados_select" on resultados for select using (atleta_visible(atleta_id));
create policy "resultados_insert" on resultados for insert with check (atleta_visible(atleta_id));
create policy "resultados_update" on resultados for update using (atleta_visible(atleta_id));
create policy "resultados_delete" on resultados for delete using (atleta_visible(atleta_id));

create policy "pruebas_fisicas_select" on pruebas_fisicas for select using (atleta_visible(atleta_id));
create policy "pruebas_fisicas_insert" on pruebas_fisicas for insert with check (atleta_visible(atleta_id));
create policy "pruebas_fisicas_update" on pruebas_fisicas for update using (atleta_visible(atleta_id));
create policy "pruebas_fisicas_delete" on pruebas_fisicas for delete using (atleta_visible(atleta_id));

create policy "comentarios_select" on comentarios for select using (atleta_visible(atleta_id));
create policy "comentarios_insert" on comentarios for insert with check (atleta_visible(atleta_id));
create policy "comentarios_update" on comentarios for update using (atleta_visible(atleta_id));
create policy "comentarios_delete" on comentarios for delete using (atleta_visible(atleta_id));

create policy "importacion_logs_select" on importacion_logs for select using (club_id = auth_club_id());
create policy "importacion_logs_insert" on importacion_logs for insert with check (club_id = auth_club_id());

-- ── Storage: logo del club, editable por el admin ───────

insert into storage.buckets (id, name, public)
values ('club-assets', 'club-assets', true)
on conflict (id) do nothing;

create policy "club_assets_public_read" on storage.objects
  for select using (bucket_id = 'club-assets');

create policy "club_assets_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'club-assets'
    and auth_rol() = 'admin'
    and (storage.foldername(name))[1] = auth_club_id()::text
  );

create policy "club_assets_admin_update" on storage.objects
  for update using (
    bucket_id = 'club-assets'
    and auth_rol() = 'admin'
    and (storage.foldername(name))[1] = auth_club_id()::text
  );

-- ── Catálogo inicial de disciplinas ─────────────────────

insert into disciplinas (nombre, unidad_medida) values
  ('60m', 'tiempo'), ('100m', 'tiempo'), ('200m', 'tiempo'), ('400m', 'tiempo'),
  ('800m', 'tiempo'), ('1500m', 'tiempo'), ('3000m', 'tiempo'), ('5000m', 'tiempo'), ('10000m', 'tiempo'),
  ('60m vallas', 'tiempo'), ('100m vallas', 'tiempo'), ('110m vallas', 'tiempo'), ('400m vallas', 'tiempo'),
  ('3000m obstáculos', 'tiempo'), ('Marcha 5000m', 'tiempo'),
  ('Salto de longitud', 'distancia'), ('Triple salto', 'distancia'),
  ('Salto de altura', 'altura'), ('Salto con pértiga', 'altura'),
  ('Lanzamiento de peso', 'distancia'), ('Lanzamiento de disco', 'distancia'),
  ('Lanzamiento de jabalina', 'distancia'), ('Lanzamiento de martillo', 'distancia'),
  ('Heptatlón', 'puntos'), ('Decatlón', 'puntos');
