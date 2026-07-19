-- Sustituye la nomenclatura tradicional de categorías (Benjamín, Alevín...)
-- por la nomenclatura "sub-X" que usa el club, con dos categorías nuevas en
-- los extremos (Psicomotricidad para los más pequeños, Master para 35+) y un
-- cálculo de temporada real: el año deportivo va de septiembre a julio
-- (agosto no es hábil, no hay competición), y la categoría se calcula con la
-- edad que se cumple en el año natural que cae dentro de esa temporada — el
-- que contiene el grueso del calendario de competición. Réplica de
-- src/lib/categorias.ts (calcularCategoria/anoCategoria): si se toca un lado
-- hay que tocar el otro.
--
-- Equivalencia con las categorías tradicionales:
--   Sub-8 = Prebenjamín · Sub-10 = Benjamín · Sub-12 = Alevín ·
--   Sub-14 = Infantil · Sub-16 = Cadete · Sub-18 = Juvenil · Sub-20 = Junior ·
--   Sub-23 = Promesa · Absoluta = Senior · Master = Veterano (35+)

drop function if exists categoria_atleta(date, int);

create or replace function ano_categoria(p_fecha_referencia date default current_date)
returns int
language sql immutable
as $$
  select case
    when extract(month from p_fecha_referencia) >= 9
      then extract(year from p_fecha_referencia)::int + 1
    else extract(year from p_fecha_referencia)::int
  end
$$;

create or replace function categoria_atleta(p_fecha_nacimiento date, p_fecha_referencia date default current_date)
returns text
language sql immutable
as $$
  select case
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) < 3 then null
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 5 then 'Psicomotricidad'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 7 then 'Sub-8'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 9 then 'Sub-10'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 11 then 'Sub-12'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 13 then 'Sub-14'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 15 then 'Sub-16'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 17 then 'Sub-18'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 19 then 'Sub-20'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 22 then 'Sub-23'
    when (ano_categoria(p_fecha_referencia) - extract(year from p_fecha_nacimiento)::int) <= 34 then 'Absoluta'
    else 'Master'
  end
$$;

-- El check de grupos.categoria (0005_grupos.sql) solo permitía las
-- categorías tradicionales; se sustituye por la lista sub-X. Se busca el
-- constraint por nombre de columna en vez de asumir el nombre autogenerado,
-- para no depender de cómo lo haya nombrado Postgres en cada proyecto.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'grupos'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%categoria%'
  loop
    execute format('alter table grupos drop constraint %I', c.conname);
  end loop;
end $$;

alter table grupos add constraint grupos_categoria_check check (
  categoria is null or categoria in (
    'Psicomotricidad','Sub-8','Sub-10','Sub-12','Sub-14','Sub-16','Sub-18','Sub-20','Sub-23','Absoluta','Master'
  )
);
alter table grupos add constraint grupos_tipo_categoria_check check (
  (tipo = 'categoria_edad' and categoria is not null) or
  (tipo = 'entrenamiento' and categoria is null)
);

-- Remapea grupos "por categoría de edad" ya creados con la nomenclatura
-- tradicional a su equivalente sub-X.
update grupos set categoria = 'Sub-10' where categoria = 'Benjamín';
update grupos set categoria = 'Sub-12' where categoria = 'Alevín';
update grupos set categoria = 'Sub-14' where categoria = 'Infantil';
update grupos set categoria = 'Sub-16' where categoria = 'Cadete';
update grupos set categoria = 'Sub-18' where categoria = 'Juvenil';
update grupos set categoria = 'Sub-20' where categoria = 'Junior';
update grupos set categoria = 'Sub-23' where categoria = 'Promesa';
