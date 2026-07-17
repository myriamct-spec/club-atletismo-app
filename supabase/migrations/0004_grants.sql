-- Las políticas de RLS ya estaban bien (filtran filas), pero faltaba el
-- permiso de tabla básico que Postgres exige antes de mirar RLS siquiera:
-- sin este GRANT, cualquier consulta del rol "authenticated" falla con
-- "permission denied for table X", da igual lo que digan las políticas.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  clubs, usuarios, atletas, entrenador_atleta, disciplinas,
  competiciones, resultados, pruebas_fisicas, comentarios, importacion_logs
to authenticated;

-- Por si se añaden tablas nuevas más adelante y se nos olvida el grant explícito.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
