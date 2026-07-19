-- Rediseño del informe de evolución: resultados gana los campos que
-- necesita el formulario de registro en dos niveles (rápido + ampliado),
-- deja de depender obligatoriamente de una competición (para poder
-- registrar tests de control), y las disciplinas se clasifican por
-- familia para adaptar KPIs y gráficas. Se añade también un registro
-- simple de asistencia.

-- ── resultados ───────────────────────────────────────────
-- competicion_id pasa a opcional: un resultado de tipo 'test_control' no
-- pertenece a ninguna competición. fecha se traslada al propio resultado
-- (antes se leía siempre de la competición vinculada) para que exista
-- también en resultados sin competición.
alter table resultados
  alter column competicion_id drop not null,
  add column fecha date,
  add column tipo text not null default 'competicion' check (tipo in ('competicion', 'test_control')),
  add column validez text not null default 'valido' check (validez in ('valido', 'nulo', 'no_presentado')),
  add column condiciones text,
  add column intentos jsonb,
  add column parciales jsonb,
  add column ritmo_por_km jsonb,
  add column percepcion_esfuerzo smallint check (percepcion_esfuerzo is null or percepcion_esfuerzo between 1 and 10),
  add column nota text;

update resultados r set fecha = c.fecha
from competiciones c
where r.competicion_id = c.id and r.fecha is null;

alter table resultados alter column fecha set not null;

-- Los formularios existentes (alta manual e importación desde Excel en la
-- ficha de competición) no envían fecha explícita: siguen sin tener que
-- hacerlo, se rellena sola a partir de la competición.
create or replace function resultado_fecha_por_defecto()
returns trigger
language plpgsql
as $$
begin
  if new.fecha is null and new.competicion_id is not null then
    select fecha into new.fecha from competiciones where id = new.competicion_id;
  end if;
  return new;
end;
$$;

create trigger resultados_fecha_default
before insert on resultados
for each row execute function resultado_fecha_por_defecto();

-- ── disciplinas ──────────────────────────────────────────
alter table disciplinas add column familia text
  check (familia in ('sprint', 'fondo', 'saltos', 'lanzamientos', 'otra'));

update disciplinas set familia = 'sprint'
  where nombre in ('60m', '100m', '200m', '400m', '60m vallas', '100m vallas', '110m vallas', '400m vallas');
update disciplinas set familia = 'fondo'
  where nombre in ('800m', '1500m', '3000m', '5000m', '10000m', '3000m obstáculos', 'Marcha 5000m');
update disciplinas set familia = 'saltos'
  where nombre in ('Salto de longitud', 'Triple salto', 'Salto de altura', 'Salto con pértiga');
update disciplinas set familia = 'lanzamientos'
  where nombre in ('Lanzamiento de peso', 'Lanzamiento de disco', 'Lanzamiento de jabalina', 'Lanzamiento de martillo');
update disciplinas set familia = 'otra' where familia is null;

alter table disciplinas alter column familia set not null;
alter table disciplinas alter column familia set default 'otra';

-- ── asistencias ──────────────────────────────────────────
-- Registro simple: un atleta está presente o ausente en una fecha dada.
-- Mismo patrón de RLS que pruebas_fisicas/comentarios (atleta_visible).
create table asistencias (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas(id) on delete cascade,
  fecha date not null default current_date,
  presente boolean not null,
  unique (atleta_id, fecha)
);

alter table asistencias enable row level security;

create policy "asistencias_select" on asistencias for select using (atleta_visible(atleta_id));
create policy "asistencias_write" on asistencias for all
  using (atleta_visible(atleta_id))
  with check (atleta_visible(atleta_id));

grant select, insert, update, delete on asistencias to authenticated;
