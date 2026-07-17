-- Una prueba física o un comentario solo lo puede registrar quien lo firma:
-- evita que un entrenador pueda insertar una fila atribuida a otro entrenador_id.

drop policy "pruebas_fisicas_insert" on pruebas_fisicas;
create policy "pruebas_fisicas_insert" on pruebas_fisicas
  for insert with check (atleta_visible(atleta_id) and entrenador_id = auth.uid());

drop policy "comentarios_insert" on comentarios;
create policy "comentarios_insert" on comentarios
  for insert with check (atleta_visible(atleta_id) and entrenador_id = auth.uid());
