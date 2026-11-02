# CLAUDE.md — Ki<i

Ki<i (Kikiña) es una PWA privada para **dos personas**: Facu (Android) y Kiki (iPhone). Es el lugar donde vive su historia: dates, fotos, viajes, partidos de juegos, preguntas para charlar y un módulo picante (**Discreción**). Hoy es un hilo directo entre los dos; en 5 años, un álbum hermoso.

**Kikiña no es un registro: es nuestra vida en recuerdos.**

## Documentos (leelos antes de tocar algo relacionado)
| Doc | Para qué |
|---|---|
| `docs/PRD.md` | Qué se construye, alcance por etapas, user stories y criterios de aceptación |
| `docs/TECH_SPEC.md` | Arquitectura, SQL completo + RLS, Storage, push, API de Atajos, estructura, env vars, backup |
| `docs/DESIGN.md` | Estética, tokens, tipografías, componentes, pantallas, flujos, microcopy |
| `docs/SHORTCUTS.md` | Atajos de iOS y HTTP Shortcuts de Android (contrato de `/api/v1`) |
| `docs/ROADMAP.md` | Tareas con ID (E0-xx, L-xx, M-xx, V1-xx), orden y definición de terminado |

Si algo de lo que te piden contradice estos documentos, **avisá antes de implementar**. Si se decide cambiar, actualizá el doc correspondiente en el mismo commit.

## Cómo trabajar
1. Te van a pedir **una tarea por ID** del ROADMAP. Antes de codear, respondé con un **plan de ≤ 5 bullets** (archivos a tocar, enfoque, riesgos) y esperá OK.
2. Hacé **solo esa tarea**. Nada de refactors ni features "de paso"; si ves algo para mejorar, anotalo al final de tu respuesta.
3. Al terminar: corré `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, tildá la tarea en `docs/ROADMAP.md` y proponé el mensaje de commit (`feat(L-08): …`).
4. Si una decisión no está en los docs y cambia el comportamiento o el modelo de datos, **preguntá**. Si es un detalle de implementación, elegí lo más simple y decilo.

## Stack
Next.js (App Router) · React · TypeScript **strict** · Tailwind · Supabase (`@supabase/ssr`, Auth OTP, Postgres + RLS, Storage) · Serwist (PWA) · `web-push` · `exifr` + `browser-image-compression` · MapLibre + OpenFreeMap · `date-fns` (locale `es`) · `zod` · `motion` · Vitest · Playwright · **pnpm**. Deploy en Vercel (Hobby). Todo en planes gratuitos.

## Comandos
```bash
pnpm dev                 # desarrollo
pnpm build && pnpm start # build de producción
pnpm typecheck           # tsc --noEmit
pnpm lint                # eslint
pnpm test                # vitest
pnpm test:e2e            # playwright (smoke)
pnpm seed                # tsx scripts/seed.ts (preguntas + Discreción)
supabase db push         # aplicar migraciones al proyecto linkeado
supabase migration new <nombre>
pnpm db:types            # supabase gen types typescript --linked > src/types/database.ts
```

## Estructura (resumen; detalle en TECH_SPEC §11)
```
src/app/(auth)/login · src/app/(app)/{inicio,recuerdos,dates,juegos,preguntas,sobres,ajustes}
src/app/discrecion/*        (layout propio, siempre oscuro)
src/app/api/{push,thoughts,v1}/*
src/components/{ui,memories,games,discretion,questions,thoughts}
src/lib/{supabase,scorers,images,places,push,export}
supabase/migrations · supabase/seed-data · scripts/
```

## Convenciones de código
- **Idioma:** identificadores, tipos, nombres de archivos de código y tablas en **inglés**; **rutas de la app y todo el texto visible en castellano rioplatense**; comentarios en castellano, solo cuando aportan.
- Server Components por defecto; `"use client"` solo donde hay interacción.
- Datos: lecturas y escrituras normales **desde el cliente/servidor con la sesión del usuario** (RLS hace la seguridad). El **service role** solo en Route Handlers (`/api/*`) y `scripts/`, importado desde `src/lib/supabase/admin.ts`. **Nunca** en código cliente.
- Toda fila de contenido lleva `couple_id` (= `my_couple_id()`); nunca confíes en un `couple_id` que venga del cliente en endpoints con service role: tomalo del perfil.
- Validá inputs con `zod` en todo Route Handler.
- Tipos de la base desde `src/types/database.ts` (regeneralos después de cada migración).
- Nada de `any`. Nada de `// @ts-ignore` sin comentario explicando por qué.
- Componentes chicos; lógica pura en `src/lib`, testeable.
- Fechas: guardar en UTC (`timestamptz`) o `date`; mostrar con `date-fns` en `es` y zona `America/Argentina/Buenos_Aires`.
- Commits: `tipo(ID): descripción` (`feat`, `fix`, `chore`, `docs`, `test`).

## Base de datos
- **Nunca** edites una migración ya aplicada: creá una nueva (`supabase migration new`).
- Toda tabla nueva: `enable row level security` + políticas por `couple_id` (patrón de TECH_SPEC §4). Sin RLS no se mergea.
- Recuerdos se borran con `deleted_at` (borrado lógico), nunca `delete`.
- Funciones `security definer` siempre con `set search_path = public`.
- Después de cada migración: `pnpm db:types`.

## Juegos (anotadores)
- Cada juego es un **reducer puro** en `src/lib/scorers/<scorer>.ts` con la interfaz `Scorer` de TECH_SPEC §5. El estado guarda `events[]`; todo lo demás se deriva (deshacer = recalcular sin el último evento).
- **Tests obligatorios** por scorer en `__tests__/` (victoria, límites, deshacer, casos especiales).
- Reglas de la casa (no cambiar sin preguntar):
  - **Truco:** a 30, sin flor, malas/buenas en 15, se suma tocando (+1).
  - **Chinchón:** se cargan los puntos de la mano; cortar = −10 al que cortó; chinchón = gana directo; pierde quien **supera** 101; sin reenganche.
  - **Código Secreto:** solo se registra el ganador.
  - **Auto amarillo:** contador eterno en `counter_events` (no usa `matches`).
- La partida en curso se persiste en cada evento (localStorage inmediato + upsert con debounce de 800 ms) y se retoma al volver.

## Imágenes
- Pipeline en el cliente: **leer EXIF primero** (`exifr`) → comprimir a WebP (lado mayor 2048, q 0.8) + miniatura (480, q 0.7) → subir a `media/{couple_id}/{yyyy}/{mm}/{id}.webp` → fila en `media`.
- Bucket privado: mostrar con `createSignedUrls` en lote. Nunca hacer público el bucket.
- Videos: sin transcodificar, máx. 25 MB / 30 s.

## Diseño (DESIGN.md manda)
- Colores **solo vía tokens** (`bg-paper`, `text-ink`, `bg-accent`…). Nada de hex sueltos en componentes.
- Tipografías: Fraunces (títulos y números), Instrument Sans (UI), Young Serif **solo** para el wordmark "Ki<i" (con el `<` nativo en terracota).
- Ícono: koala de **Noto Emoji** (Apache 2.0). **Nunca** usar arte de emojis de Apple en assets.
- Estética "álbum cálido moderno": fotos protagonistas, mucho aire. **Prohibido:** stickers, corazones decorativos, cursiva/manuscrita, gradientes, rosa chicle, tablas para *mirar* recuerdos.
- **Cargar en < 10 segundos:** date = foto + lugar; todo lo demás opcional. **Nunca** mostrar "incompleto" ni recordatorios de completar.
- Áreas táctiles ≥ 44 px (anotadores ≥ 64 px), contraste AA, safe areas de iOS, `prefers-reduced-motion`.
- **Microcopy** rioplatense, corto, cálido, sin cursilería ("Guardado", "Le llegó 💭", "¡Ganó Kiki!"). Ver tabla en DESIGN §10.

## Discreción (reglas duras)
- Rutas `/discrecion/*`, tema **siempre oscuro** (independiente del sistema).
- **Contenido:** nada con terceros, nada de dolor. Picante, juguetón, entre dos. Cualquier carta nueva que se agregue a la base debe cumplirlo.
- **No guarda fotos.** Nunca.
- Nada de Discreción aparece en el timeline, búsqueda, "hace X tiempo", resúmenes ni notificaciones.
- "¿Lo probamos?": los votos son **privados**; solo se revelan coincidencias vía `discretion_matches()`.
- El export incluye Discreción solo si se tilda explícitamente.

## Notificaciones
- **La única notificación de la app es "pensé en vos"** (y su respuesta "yo también"). No agregar push para nada más sin preguntar.
- iOS: solo PWA instalada, iOS 16.4+, permiso pedido desde un tap, cada push muestra notificación, borrar suscripciones que devuelven 404/410.

## Auth
- OTP de 6 dígitos que se **escribe en la app** (`verifyOtp`). **No** usar magic links (en iOS la PWA no comparte sesión con Safari).
- `shouldCreateUser: false`. Signups deshabilitados. Solo existen dos usuarios.

## Durabilidad
- Los datos tienen que sobrevivir años: formatos abiertos, Postgres estándar, fotos WebP con rutas legibles.
- Cualquier tabla nueva con contenido de usuario **tiene que entrar en el export** (`src/lib/export`) en el mismo PR.

## Nunca
- Exponer `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY` o tokens en el cliente o en el repo.
- Crear tablas sin RLS.
- Agregar dependencias pesadas sin preguntar (y nunca servicios pagos).
- Indexar la app en buscadores (mantener `noindex`).
- Agregar analytics, trackers o servicios de terceros que reciban datos de la pareja.
- Cambiar las reglas de los juegos, los niveles de Discreción o la paleta sin que lo pida Facu.
