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
- [x] Informe de evolución del atleta (resultados + pruebas físicas + comentarios, por rango de fechas)
- [x] Alta de entrenadores y gestión de grupos (por categoría de edad o de entrenamiento), sustituyendo la asignación directa entrenador↔atleta

## Modelo de datos

Ver `supabase/migrations/0001_init.sql`. Puntos clave acordados durante la fase de ideación:

- La relación entrenador↔atleta ya no es directa: un entrenador se asigna a uno o varios **grupos** (`0005_grupos.sql`), y un atleta pertenece a un grupo de dos formas — por **categoría de edad** (automático, calculado desde `fecha_nacimiento` con `categoria_atleta()` en SQL, réplica de `calcularCategoria()` en `lib/categorias.ts`; hay que mantener ambas en sync si se toca una) o por **grupo de entrenamiento** (manual, solo para la categoría Absoluto, tabla `atleta_grupo`). La gestión de grupos y entrenadores la hace solo el administrador.
- Dar de alta un entrenador crea también su usuario de Supabase Auth vía `auth.signUp()` con un cliente aislado (`lib/supabaseAdmin.ts`) para no cerrar la sesión del admin — es la única vía practicable sin exponer una clave de servicio en el cliente. Si el proyecto tiene "Confirm email" activado, el entrenador no puede entrar hasta confirmar el correo (o hasta que se confirme a mano desde el dashboard).
- `atletas.id_socio` sustituye al DNI como identificador único (no se almacenan datos de carácter especial).
- `atletas.observaciones_generales` es una nota libre sin fecha en la ficha; el histórico fechado de valoraciones del entrenador vive en `comentarios` y es lo que alimenta el informe de evolución.
- El logo del club (`clubs.logo_url`) se sube a Supabase Storage (`club-assets`) y es editable por el administrador desde `/ajustes`, sin necesidad de nuevo despliegue. El logo oficial del club (escudo con corredor alado) se sube así una vez desplegada la app; mientras tanto la interfaz usa un marcador con la inicial del club sobre la paleta marino/dorado real.
- El alta de atletas (manual o por Excel) la hace el administrador; un entrenador solo ve y edita los atletas de sus grupos (`atleta_visible()` en RLS, redefinida en `0005_grupos.sql`). La importación de atletas ya no pide entrenadores: la pertenencia a grupo se resuelve después, desde `/grupos`.
- Alta de competiciones: formulario manual + importación masiva por Excel, en dos pasos (primero se crea la competición, luego se suben sus resultados). Sin integración automática con RFEA/FAMU en el MVP (ver historial de prompts para el análisis de viabilidad).
- La importación de resultados prioriza `ID_Socio` para identificar al atleta; si no se indica, cruza por nombre y apellidos y marca error si es ambiguo o no lo encuentra (no se descarta la fila en silencio).
- Pruebas físicas y comentarios quedan atribuidos a quien los registra: la política de alta exige `entrenador_id = auth.uid()` (`0003_autoria.sql`), no solo que el atleta sea visible para el usuario.
- El informe de evolución (`/atletas/:id/informe`) no persiste nada: cruza en el cliente resultados, pruebas físicas y comentarios ya cargados, filtrados por rango de fechas (por defecto, la temporada en curso). Solo vista en pantalla en el MVP; exportar a PDF queda para una fase posterior.
- La tipografía de titulares (`font-display`) es Anton autoalojada en `public/fonts/` en vez de Impact/Arial Black: esas fuentes de sistema no vienen instaladas en la mayoría de Linux y varios navegadores, así que sin autoalojarla el titular se veía en fuente fina por defecto en lugar de condensada/negrita.
