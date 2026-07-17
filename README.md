# Club Atletismo Veloz Runners

App de gestión para club de atletismo — Hackathon Vibe Coding E6.

Gestión de atletas, resultados de competición, pruebas físicas y comentarios del entrenador, con informes de evolución de temporada. Construida con React + TypeScript + Vite (PWA instalable) y Supabase (base de datos, autenticación y almacenamiento).

## Puesta en marcha

1. Instala dependencias:
   ```
   npm install
   ```
2. Crea un proyecto en [Supabase](https://supabase.com) y ejecuta, en orden, las migraciones de `supabase/migrations/` en el SQL editor del proyecto.
3. Copia `.env.example` a `.env` y rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de tu proyecto.
4. Crea al primer usuario administrador:
   - Da de alta el club en la tabla `clubs`.
   - Crea el usuario en Supabase Auth (email/contraseña).
   - Inserta su fila correspondiente en `usuarios` con `rol = 'admin'` y el `club_id` del club creado.
5. Arranca el entorno de desarrollo:
   ```
   npm run dev
   ```

## Estado actual

- [x] Estructura del proyecto (Vite + React + TS + Tailwind, PWA)
- [x] Esquema de base de datos y políticas de seguridad (RLS) en Supabase
- [x] Login de entrenador/administrador
- [x] Layout de la app con logo del club editable por el administrador (`/ajustes`)
- [x] Alta, edición y ficha de atletas, con foto opcional y asignación de entrenadores (N:M)
- [x] Importación de atletas desde Excel (plantilla, vista previa con errores, log de importación)
- [x] Alta manual de competiciones, registro de resultados e importación masiva desde Excel
- [x] Registro de pruebas físicas (tipo, valor, unidad, protocolo)
- [x] Comentarios del entrenador (histórico fechado, por categoría)
- [ ] Informe de evolución del atleta

## Modelo de datos

Ver `supabase/migrations/0001_init.sql`. Puntos clave acordados durante la fase de ideación:

- Relación entrenador↔atleta es N:M (`entrenador_atleta`), gestionada solo por el administrador.
- `atletas.id_socio` sustituye al DNI como identificador único (no se almacenan datos de carácter especial).
- `atletas.observaciones_generales` es una nota libre sin fecha en la ficha; el histórico fechado de valoraciones del entrenador vive en `comentarios` y es lo que alimenta el informe de evolución.
- El logo del club (`clubs.logo_url`) se sube a Supabase Storage (`club-assets`) y es editable por el administrador desde `/ajustes`, sin necesidad de nuevo despliegue. El logo oficial del club (escudo con corredor alado) se sube así una vez desplegada la app; mientras tanto la interfaz usa un marcador con la inicial del club sobre la paleta marino/dorado real.
- El alta de atletas (manual o por Excel) la hace el administrador, que también gestiona qué entrenadores tiene asignados cada atleta; un entrenador solo ve y edita los atletas que tiene asignados (`atleta_visible()` en RLS).
- Alta de competiciones: formulario manual + importación masiva por Excel, en dos pasos (primero se crea la competición, luego se suben sus resultados). Sin integración automática con RFEA/FAMU en el MVP (ver historial de prompts para el análisis de viabilidad).
- La importación de resultados prioriza `ID_Socio` para identificar al atleta; si no se indica, cruza por nombre y apellidos y marca error si es ambiguo o no lo encuentra (no se descarta la fila en silencio).
- Pruebas físicas y comentarios quedan atribuidos a quien los registra: la política de alta exige `entrenador_id = auth.uid()` (`0003_autoria.sql`), no solo que el atleta sea visible para el usuario.
