# Ki<i — ROADMAP

> Versión 1.0 · 30/10/2026 · Complementa a `PRD.md`, `TECH_SPEC.md`, `DESIGN.md`
> Ritmo previsto: **3–5 h por semana**. Cada tarea está pensada para **una sesión con Claude Code de 20–60 min** (el tiempo es tuyo: pedir, revisar, probar en el celu).

---

## Vista general

| Hito | Qué tenés | Horas acumuladas | A ~4 h/semana |
|---|---|---|---|
| **A · "Ya la usamos"** | Login, app instalable, dates con foto y lugar, feed, truco, preguntas | ~11 h | **semana 3** |
| **B · Ki<i Lite completa** | + inicio, chinchón, scrabble, código secreto, auto amarillo, marcadores, Discreción (dados + cartas) | ~18 h | semana 5 |
| **C · MVP completo** | + álbum (capítulos/calendario/mapa), precarga, pensé en vos con push, sobres, estadísticas, export… | ~38 h | semana 10 |
| **v1** | Atajos, viajes, cartas para abrir cuando…, "hace X tiempo", backup a Drive… | ~52 h | — |
| **v2 / algún día** | Resumen semestral, modo aniversario, logros… | — | sin fecha |

> Corrección honesta respecto del PRD: la Lite completa (Hito B) son ~18 h, no 12. Por eso partí la Lite en dos: el **Hito A** ya es usable en ~3 semanas con lo que más querés (partidos, dates, preguntas). Discreción llega en el Hito B; si la querés antes, se puede adelantar (L-21 a L-23 no dependen de nada más que L-01/L-03).

**Regla:** no se empieza una tarea del hito siguiente hasta que el hito actual está deployado y probado en los dos celulares.

---

## Cómo trabajar cada tarea con Claude Code

1. Abrí Claude Code en el repo (lee `CLAUDE.md` solo).
2. Pedí una tarea por vez, por ID:
   > *"Implementá **L-08** del ROADMAP. Antes de codear, decime el plan en 5 bullets. Respetá CLAUDE.md y DESIGN.md."*
3. Revisá el plan → OK → que implemente.
4. Probá en el navegador (y en el celu si la tarea toca UI).
5. Commit con el ID: `feat(L-08): nuevo date en una pantalla`.
6. Tildá la tarea acá.

### Definición de "terminado" (para todas las tareas)
- [ ] Hace lo que dice el criterio de la tarea.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` y **`pnpm build`** pasan.
- [ ] Probado en el celular (si es UI) en modo claro y oscuro.
- [ ] Sin claves ni datos sensibles en el código.
- [ ] Commit con el ID de la tarea.

---

## Etapa 0 · Setup (~2,5 h)

| ID | Tarea | Criterio de terminado | ⏱ |
|---|---|---|---|
| ☐ E0-01 | Crear repo: Next.js (App Router) + TypeScript estricto + Tailwind + ESLint/Prettier + Vitest + pnpm. Copiar `docs/` y `CLAUDE.md`. | `pnpm dev` levanta una página "Ki<i" y `pnpm test` corre. Repo privado en GitHub. | 30' |
| ☑ E0-02 | Proyecto Supabase: deshabilitar signups, crear los 2 usuarios (mails confirmados), plantilla de mail con `{{ .Token }}` sin link. | Desde el dashboard se puede mandar un OTP a cada mail y llega el código. | 30' |
| ☑ E0-03 | Supabase CLI: `supabase link`, migración `0001_init.sql` (de TECH_SPEC §4), `supabase gen types` → `src/types/database.ts`. | `supabase db push` sin errores; tipos generados. | 30' |
| ☑ E0-04 | Seed: `couple`, `profiles`, juegos base y `scripts/seed.ts` para preguntas y Discreción (JSON en `supabase/seed-data/`). | Tablas con 400 preguntas, 60 caras, 200 cartas, 80 ideas, 5 juegos. | 30' |
| ☑ E0-05 | Deploy en Vercel (`kikina-app.vercel.app`), variables de entorno, `robots.txt` + meta `noindex`. | La URL pública carga; no aparece en buscadores. | 30' |

---

## Etapa 1 · Ki<i Lite

### 🅰️ Hito A — "Ya la usamos" (~8,5 h después del setup)

| ID | Tarea | Criterio de terminado | ⏱ |
|---|---|---|---|
| ☑ L-01 | Tokens de diseño: CSS vars (claro/oscuro/Discreción), Tailwind theme, fuentes (Fraunces, Instrument Sans, Young Serif) con `next/font`. | Página de muestra `/dev/ui` con colores, tipografías y botones. | 30' |
| ☑ L-02 | Login con OTP: mail → código de 6 dígitos → sesión; middleware de `@supabase/ssr`; redirect a `/inicio`. | Los dos pueden entrar; un mail no autorizado ve "Ese mail no tiene acceso"; la sesión persiste al cerrar y abrir. | 45' |
| ☑ L-03 | Layout de la app: barra inferior (Inicio, Recuerdos, +, Juegos, Juntos) + sheet "+" con sus opciones (las que no existen todavía, deshabilitadas). Safe areas de iOS. | Navegación funciona en celular; el sheet abre y cierra. | 45' |
| ☑ L-04 | PWA: `manifest.ts`, íconos del koala (192/512/maskable/apple-touch), Serwist con SW básico, guía "Agregar a inicio" en iPhone. | Se instala en iPhone y Android con ícono y splash correctos; abre a pantalla completa. | 45' |
| ☑ L-06 | Pipeline de imagen: `exifr` → compresión WebP (2048 + thumb 480) → upload a `media/{couple}/{yyyy}/{mm}/` → fila en `media`. | Subir una foto desde el celu deja dos archivos livianos en Storage y la fila con `taken_at`. | 45' |
| ☑ L-07 | PlacePicker con proveedor Photon (abstracción `PlaceSearchProvider`), lugares ya usados primero, upsert en `places`. | Buscar "La Mezzetta" sugiere resultados; elegir uno crea/reusa el `place`. | 45' |
| ☑ L-08 | Nuevo date en una pantalla: foto + lugar obligatorios, fecha "Hoy", acordeón opcional (comida, tipo, mi puntaje, ¿volveríamos?, nota). Guarda `entries` + `date_details` + `date_ratings`. | Cargar un date con foto y lugar en < 10 s; aparece en el feed. | 45' |
| ☑ L-09 | Feed de recuerdos: MemoryCard, separadores de mes, URLs firmadas en lote, scroll infinito simple. | Se ven los dates con foto, lugar, fecha y puntajes. | 45' |
| ☑ L-11 | Scorer **truco** (reducer puro + tests): a 30, sin flor, deshacer. | Tests: 29→30 gana, deshacer, no pasa de 30. | 30' |
| ☑ L-14 | Infra de partida: crear `match`, guardar estado (localStorage inmediato + upsert con debounce), retomar partida en curso, terminar → `winner_id` + `match_scores`. | Cerrar la app a mitad de partida y volver la retoma igual. | 45' |
| ☑ L-15 | UI anotador **truco**: dos columnas de fosforitos (SVG, cuadrados de 5, línea en 15), tocar = +1, UndoBar, pantalla de ganador con "Revancha". | Se juega una partida entera en el celu y queda en el historial. | 45' |
| ☑ L-20 | Preguntas: dado con animación, filtro por categoría, sin repetir (`question_draws`), "Otra". | Tirar 10 veces no repite; el filtro funciona. | 30' |
| ☑ A-✔ | **Prueba real del Hito A** en los dos celulares + arreglos. | Una salida real cargada y un truco real anotado. | 30' |

### 🅱️ Hito B — Lite completa (~7 h)

| ID | Tarea | Criterio de terminado | ⏱ |
|---|---|---|---|
| ☑ L-05 | Inicio: contador de días (alterna 16/11/2024 ↔ 25/5/2025), accesos rápidos, "Seguir partida" si hay una abierta, último recuerdo. | Se ve como el mockup de DESIGN §8.3. | 30' |
| ☐ L-10 | Detalle de recuerdo: carrusel, puntajes de los dos, "Poner mi puntaje", editar, borrar lógico (con confirmación). | Cada uno edita solo su puntaje; borrar lo saca del feed. | 30' |
| ☑ L-12 | Scorer **chinchón** + tests: mano por mano, "−10" como atajo, "¡Chinchón!" gana directo, pierde quien pasa 101. | Tests: 101 exacto sigue, 102 pierde, chinchón gana, −10 y 3 en la misma mano. | 30' |
| ☑ L-16 | UI anotador **chinchón**: tabla aireada de manos, BottomSheet con NumberPad, botones especiales, aviso cerca de 101. | Partida completa jugada en el celu. | 30' |
| ☑ L-13 | Scorer **scrabble** (turnos, palabra opcional, terminar, alternancia, extra best_word/best_turn) + tests. **+ scorer `winner_only` + tests (Código Secreto).** | Tests de total, mejor palabra y ganador. Scorer `winner_only`: gana cada jugador, no acepta eventos post-fin, deshacer. | 30' |
| ☑ L-17 | UI anotador **scrabble** (turnos alternados, sheet con NumberPad+WordInput, Terminar doble toque). **+ UI Código Secreto + habilitarlo en /juegos.** | Guarda en el historial. UI CS: dos botones enormes + confirmación. | 30' |
| ☑ L-18 | **Auto amarillo**: `counter_events`, botones +1 en la tarjeta del juego, mantener apretado = anular último, total eterno. | Sumar y anular funcionan; total correcto en los dos celulares. | 20' |
| ☐ L-19 | Pantalla **Juegos** (tarjetas con marcador total "Facu 12 – Kiki 15", partida en curso) + **detalle de juego** con historial. | Marcadores coinciden con el historial. | 45' |
| ☑ L-21 | **Discreción** base: layout siempre oscuro, LevelPicker (4 niveles), home con modos. | Entrar a Discreción cambia todo a oscuro, sin importar el modo del celu. | 20' |
| ☑ L-22 | Discreción **dados**: 3 dados con caras por nivel (peso 60% al nivel elegido), animación, resultado como frase. | En Chispa nunca sale una cara de nivel 3–4. | 30' |
| ☐ L-23 | Discreción **cartas**: turno alternado ("Kiki → Facu"), verdad/reto alternados, "Pasar", "subir de nivel cada 5". | Una sesión de 20 cartas sin repetir y respetando el nivel. | 45' |
| ☐ L-24 | Pulido Lite: estados vacíos, microcopy (DESIGN §10), modo oscuro, prueba en ambos celulares. | Checklist de DESIGN §11 cumplido. | 60' |
| ☐ B-✔ | **Entrega posible**: precargar algunos dates del pasado a mano y dársela. 🎁 | — | — |

> **Nota (fuera del ROADMAP):** Se agregó "Descartar partida" (⋯) en el header de todos los anotadores (truco, chinchón, scrabble, código secreto). Muestra confirmación antes de llamar `match.abandon()`. Las partidas `abandoned` no cuentan en marcadores ni en "Seguir partida". MatchResumeScreen también clarifica con "Descartar y empezar de cero".

---

## Etapa 2 · MVP completo (~20 h)

Ordenadas por valor. Se pueden reordenar.

| ID | Tarea | ⏱ |
|---|---|---|
| ☐ M-01 | Push: claves VAPID, handlers `push`/`notificationclick` en el SW, `/api/push/subscribe`, botón "Activar avisos" con guía para iPhone. | 60' |
| ☐ M-02 | **Pensé en vos**: botón + mensajito, `/api/thoughts/notify`, ThoughtToast en Inicio, "Yo también 💭". | 60' |
| ☐ M-03 | Historial de "pensé en vos" por mes. | 30' |
| ☐ M-04 | **Sobres**: escribir, bandeja, sobre cerrado en Inicio, animación de apertura. | 45' |
| ☐ M-05 | Recuerdos en **capítulos por mes** con portada automática y página de capítulo. | 60' |
| ☐ M-06 | Vista **calendario**. | 45' |
| ☐ M-07 | Vista **mapa** (MapLibre + OpenFreeMap, clusters, mini tarjeta). | 60' |
| ☐ M-08 | Fotos sueltas y varias fotos por recuerdo (carrusel, elegir portada). | 45' |
| ☐ M-09 | **Importar** masivo: cola con concurrencia, agrupación por día, "Sin fecha" con fecha por lote. | 60' |
| ☐ M-10 | Importar: reintentos, progreso y UX en compu. | 45' |
| ☐ M-11 | Ranking de restaurantes. | 30' |
| ☐ M-12 | Estadísticas de juegos (rachas, goleadas, récords, gráfico mensual, campeón del año). | 60' |
| ☐ M-13 | Nuevo juego con plantillas + scorer `rounds` (+ tests). | 60' |
| ☐ M-14 | Apuestas por partida + pantalla de deudas. | 45' |
| ☐ M-15 | Discreción **¿Lo probamos?** (votos privados, `discretion_matches()`, pendientes tachables). | 60' |
| ☐ M-16 | Discreción: mazo propio, "nunca", favoritas. | 45' |
| ☐ M-17 | Discreción: desbloqueo (passkey con fallback PIN, 15 min). | 45' |
| ☐ M-18 | Primeras veces ✨ (marcar + vista). | 30' |
| ☐ M-19 | Reacciones y comentarios. | 45' |
| ☐ M-20 | Búsqueda global (tsvector + lugares). | 45' |
| ☐ M-21 | **Exportar todo** (ZIP en el navegador con `client-zip`). | 60' |
| ☐ M-22 | Ajustes: uso de almacenamiento, perfil, acerca de (atribución del koala). | 20' |
| ☐ M-23 | Vista de compu (720 px, grillas de 3–4 columnas). | 45' |
| ☐ M-24 | (Opcional) Proveedor Google Places si Photon no alcanza. | 30' |
| ☐ C-✔ | Prueba de punta a punta + export abierto en la compu para verificar. | 60' |

---

## v1 (~14 h)

| ID | Tarea | ⏱ |
|---|---|---|
| ☐ V1-01 | Tokens de Atajos (Ajustes: generar/revocar) + `lib/api-auth.ts` + rate limit. | 60' |
| ☐ V1-02 | Endpoints `/api/v1/ping`, `/thoughts`, `/counter/:slug`. | 45' |
| ☐ V1-03 | Endpoints `/api/v1/dates` y `/media` con `sharp` + matcheo de lugar por cercanía. | 60' |
| ☐ V1-04 | Share Target en Android (`/compartir`). | 45' |
| ☐ V1-05 | Armar los atajos en el iPhone de Kiki y HTTP Shortcuts en tu Android (SHORTCUTS.md). | 60' |
| ☐ V1-06 | **Viajes**: planificador (ideas, reservas, pendientes) → historial (álbum del viaje). | 3 h |
| ☐ V1-07 | **Cartas para abrir cuando…** (condición y/o fecha, `locked_envelopes()`). | 60' |
| ☐ V1-08 | **"Hace X tiempo"** en Inicio (mismo día de años/meses anteriores). | 45' |
| ☐ V1-09 | **Sorpresas**: ocultar un date/viaje hasta una fecha. | 45' |
| ☐ V1-10 | Bucket list + restaurantes "para ir" (cumplir → recuerdo). | 90' |
| ☐ V1-11 | Países y ciudades visitados. | 45' |
| ☐ V1-12 | Backup mensual: GitHub Action + `scripts/backup.ts` → Google Drive. | 2 h |

## v2 (sin fecha)

| ID | Tarea | Compl. |
|---|---|---|
| ☐ V2-01 | **Resumen semestral** tipo Wrapped (16/11 y 25/5): dates, lugares, partidas, campeón, primeras veces, "pensé en vos". | L |
| ☐ V2-02 | Modo aniversario (portada y recap el 16/11 y 25/5). | M |
| ☐ V2-03 | "Nuestra historia": libro de hitos. | M |
| ☐ V2-04 | Ruleta de decisiones. | S |
| ☐ V2-05 | Ficha del otro (talles, pedidos, ideas de regalo). | S |
| ☐ V2-06 | Ideas de dates + "sorprendeme". | M |
| ☐ V2-07 | Series "al mejor de 5". | S |
| ☐ V2-08 | Logros. | M |
| ☐ V2-09 | "¿Cuánto me conocés?" con las 400 preguntas. | M |
| ☐ V2-10 | Reto sellado de Discreción. | S |

## Algún día
Libro impreso (PDF) · "Mismo lugar, otro año" · Notas de voz · Pregunta compartida con revelado · Importar álbum de Google Fotos.

---

## Plan semana a semana (a ~4 h/semana)

| Semana | Tareas | Resultado |
|---|---|---|
| 1 | E0-01 → E0-05, L-01, L-02 | Deploy con login funcionando |
| 2 | L-03, L-04, L-06, L-07, L-08 | Cargar dates desde el celu, app instalada |
| 3 | L-09, L-11, L-14, L-15, L-20, A-✔ | **🅰️ Ya la usan:** feed, truco y preguntas |
| 4 | L-05, L-10, L-12, L-16, L-13, L-17 | Todos los anotadores |
| 5 | L-18, L-19, L-21, L-22, L-23, L-24 | **🅱️ Lite completa** → se la podés dar 🎁 |
| 6 | M-01, M-02, M-03, M-04 | Pensé en vos con push + sobres |
| 7 | M-05, M-06, M-07, M-08 | Álbum con capítulos, calendario y mapa |
| 8 | M-09, M-10, M-11, M-12 | Precarga del pasado + estadísticas |
| 9 | M-13 → M-17 | Juegos nuevos, apuestas, Discreción completa |
| 10 | M-18 → M-23, C-✔ | **MVP completo** + export verificado |

Si una semana tenés más tiempo, seguí con la próxima tarea; si tenés menos, no pasa nada: cada tarea deja la app en un estado usable.
