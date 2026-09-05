-- Permite dar de baja (desactivar el acceso) a un entrenador o administrador
-- sin borrar su fila: así los comentarios y pruebas físicas que ya firmó
-- conservan la autoría (comentarios.entrenador_id / pruebas_fisicas.entrenador_id
-- no tienen "on delete cascade" desde usuarios, así que un borrado físico
-- fallaría igualmente si el usuario tiene historial).
alter table usuarios add column if not exists activo boolean not null default true;
