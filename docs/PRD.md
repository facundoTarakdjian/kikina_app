# Kikiña — PRD (Product Requirements Document)

> Versión 1.0 · 30/10/2026 · Autor: Facundo
> Logo: **Ki<i** + koala 🐨 · Plataforma: PWA (iPhone + Android)

---

## 1. Visión

Kikiña es el lugar donde vive la historia de Facu y Kiki. **En el día a día** es un hilo directo entre los dos: anotar el truco de anoche, cargar la cena del sábado, tirar una pregunta o un dado de Discreción. **Dentro de cinco años** es un álbum vivo que se recorre, que sorprende solo ("hace un año hoy…") y donde se puede encontrar cualquier momento.

**Kikiña no es un registro: es nuestra vida en recuerdos.**

### Qué tiene que sentir uno al abrirla
- **Hoy:** cercanía y complicidad. "El otro está acá".
- **En 5 años:** emoción al mirar hacia atrás, como un buen álbum de fotos.

### Anti-objetivos
- ❌ Que parezca una app de productividad o una base de datos (anti-referencia: Notion).
- ❌ Que sea cursi o empalagosa: es de recuerdos, no "el acto de amor más grande del mundo".
- ❌ Que genere obligaciones: nada de rachas que den culpa ni recordatorios de "completá esto".

---

## 2. Usuarios

| Usuario | Dispositivo | Uso principal |
|---|---|---|
| **Kiki** | iPhone | Carga dates/cenas y fotos. Necesita el flujo más rápido desde el iPhone (Atajos). |
| **Facu** | Android | Juegos, Discreción, preguntas, precarga del pasado, administración. |

- Son **exactamente dos cuentas**. No existe el registro público.
- Uso esperado: 1–2 veces por semana cuando se ven, más "pensé en vos" esporádicos.
- **Es una sorpresa:** Facu la construye y precarga parte del pasado (desde el 16/11/2024) antes de dársela.

### Fechas que la app conoce
- **16/11/2024:** se conocieron (inicio del contador de días).
- **25/05/2025:** se pusieron de novios.

---

## 3. Principios de producto

1. **Cargar en menos de 10 segundos.** Lo mínimo obligatorio es siempre lo mínimo posible (ej. date = foto + lugar). Todo lo demás es opcional y se completa *si quieren*.
2. **Nunca insistir.** La app no recuerda completar nada. Una entrada con solo foto y lugar está perfecta.
3. **Cargar es un formulario; mirar nunca parece una tabla.** Las vistas de recuerdos son visuales: fotos grandes, capítulos, mapa.
4. **Lo picante queda en Discreción.** Nada de Discreción aparece en el timeline, en "hace X tiempo" ni en resúmenes.
5. **Los datos son nuestros y duran.** Siempre se pueden exportar completos en formato abierto. Ninguna dependencia de proveedor puede hacer perder un recuerdo.
6. **Para cuando estamos juntos.** Juegos, preguntas y Discreción se usan en persona. Solo "pensé en vos" notifica a distancia.
7. **Simple antes que completo.** Ante la duda, la versión más simple que sea útil.

---

## 4. Alcance por etapas (MoSCoW)

### 🟢 MUST — Etapa 1: "Ki<i Lite" (~18 h con setup · ~5 semanas; usable desde el Hito A, ~semana 3)
Lo que se necesita para empezar a usarla ya. Ver `ROADMAP.md` para el orden (Hito A: login, dates, feed, truco, preguntas; Hito B: el resto de la Lite).

| # | Funcionalidad |
|---|---|
| M1 | Login con código de 6 dígitos por mail, sesión persistente, solo 2 cuentas |
| M2 | PWA instalable (iPhone y Android) con diseño base (paleta, tipografía, Ki<i) |
| M3 | **Dates:** crear con foto + lugar (búsqueda de lugar); opcionales: fecha, qué comieron, puntaje de cada uno, ¿volveríamos?, nota, tipo de salida |
| M4 | **Feed de recuerdos** simple (cronológico, lo último arriba) con dates y fotos |
| M5 | **Juegos con anotador en vivo:** Scrabble, Truco, Chinchón, Código Secreto, Auto amarillo |
| M6 | **Historial de partidas** + marcador general "Facu X – Kiki Y" por juego |
| M7 | **Preguntas:** dado con las 400 preguntas, filtro por categoría |
| M8 | **Discreción:** dados y cartas "Hacele…" con 4 niveles, siempre en modo oscuro |
| M9 | Inicio con contador de días juntos y accesos rápidos |

### 🔵 SHOULD — Etapa 2: MVP completo (~25–30 h adicionales)
| # | Funcionalidad |
|---|---|
| S1 | Timeline en **capítulos por mes** con portada automática + vista **calendario** + vista **mapa** |
| S2 | Fotos sueltas y **precarga masiva** (lee fecha EXIF; fecha por lote para fotos de WhatsApp) |
| S3 | Compresión de imágenes en el cliente (WebP/AVIF) |
| S4 | **"Pensé en vos"** con mensajito opcional + respuesta "yo también 💭" + **notificación push** (única notificación de la app) |
| S5 | **Sobres:** frases que el otro dejó, que aparecen cerradas al abrir la app |
| S6 | Ranking de restaurantes dentro de Dates |
| S7 | Estadísticas completas de juegos: récords, rachas, mayor goleada, gráfico mensual, campeón del año |
| S8 | **Nuevo juego** con plantillas de anotador |
| S9 | Apuestas opcionales por partida + cuenta de deudas |
| S10 | Discreción: modo **"¿Lo probamos?"**, mazo propio, límites "nunca", favoritas, desbloqueo extra |
| S11 | Primeras veces ✨, reacciones y comentarios en recuerdos |
| S12 | Búsqueda global |
| S13 | **Exportar todo** (ZIP: JSON + CSV + fotos originales por fecha) |

### 🟡 COULD — v1 / v2 (sin fecha)
**v1:** Viajes (planificador + historial), cartas "para abrir cuando…", "hace X tiempo", Atajos de iOS, backup mensual a Google Drive, sorpresas ocultas hasta una fecha, bucket list, restaurantes "para ir", países y ciudades visitados.

**v2:** Resumen tipo Wrapped cada 16/11 y 25/5, modo aniversario, "Nuestra historia" (libro de hitos), ruleta de decisiones, ficha del otro, ideas de dates + "sorprendeme", series al mejor de 5, logros, "¿Cuánto me conocés?", reto sellado de Discreción.

**Algún día:** libro impreso (PDF), "mismo lugar, otro año", notas de voz, pregunta compartida con revelado, importar álbum de Google Fotos.

### 🔴 WON'T (fuera de alcance)
- Canciones nuestras / integración con Spotify.
- IA que invente preguntas.
- Guardar respuestas a las preguntas.
- Notificaciones de cualquier cosa que no sea "pensé en vos".
- Fotos en Discreción (no guarda ninguna imagen).
- Contenido de Discreción con terceros o con dolor.
- Apodos, chistes internos o rituales en la UI (salvo el nombre "Discreción").
- Estado de ánimo en las entradas.
- Borradores privados.
- Dominio propio (por ahora `kikina-app.vercel.app`).
- Registro público o más de dos usuarios.

---

## 5. User stories y criterios de aceptación

### Etapa 1 — Lite

**US-01 · Entrar a la app**
*Como Kiki, quiero entrar una sola vez y no volver a loguearme, para que abrir la app no sea un problema.*
- [ ] Ingreso mi mail, recibo un código de 6 dígitos y lo escribo dentro de la app (no hay link que abra Safari).
- [ ] Solo los dos mails autorizados pueden pedir código; cualquier otro mail recibe un error genérico.
- [ ] La sesión persiste indefinidamente en la PWA instalada (refresh token).
- [ ] Si cambio de celular, vuelvo a pedir el código y listo.

**US-02 · Instalar la app**
*Como Kiki, quiero tener Kikiña en mi pantalla de inicio como una app más.*
- [ ] En iPhone, la app muestra una guía de "Compartir → Agregar a inicio" si no está instalada.
- [ ] Instalada, abre a pantalla completa con ícono del koala y splash crema.
- [ ] En Android se ofrece el prompt nativo de instalación.

**US-03 · Cargar un date en menos de 10 segundos**
*Como Kiki, quiero cargar la cena de hoy con una foto y el lugar, sin completar nada más.*
- [ ] Botón "+" siempre visible → "Date".
- [ ] Obligatorio: una foto (cámara o galería) y un lugar (buscador con sugerencias).
- [ ] La fecha se completa sola con hoy (editable).
- [ ] Guardar es un toque; el date aparece arriba del feed al instante.
- [ ] Se puede cargar sin conexión y se sube cuando vuelve la conexión (o, como mínimo, muestra un error claro y no pierde la foto).

**US-04 · Completar un date (si quiero)**
*Como cualquiera de los dos, quiero agregar detalles a un date cuando tenga ganas.*
- [ ] Campos opcionales: qué comieron, puntaje de Facu (1–10), puntaje de Kiki (1–10), ¿volveríamos? (sí / no / tal vez), nota, tipo (cena, cine, plan en casa, evento, otro).
- [ ] Cada uno puede cargar o editar su propio puntaje sin pisar el del otro.
- [ ] La app nunca muestra recordatorios ni marcas de "incompleto".

**US-05 · Ver el feed**
*Como cualquiera, quiero ver lo que fuimos cargando, con las fotos protagonistas.*
- [ ] Lista cronológica (lo último arriba) de tarjetas con foto grande, lugar y fecha.
- [ ] Tocar una tarjeta abre el detalle.
- [ ] Nada de Discreción aparece en el feed.

**US-06 · Anotar un partido en vivo**
*Como Facu, quiero anotar el truco mientras jugamos y que al terminar quede en el historial.*
- [ ] Elegir juego → abre su anotador.
- [ ] La partida en curso se guarda en todo momento (si se bloquea el celular o se cierra la app, se retoma).
- [ ] Botón deshacer en cada anotador.
- [ ] Al terminar, se muestra el ganador y se guarda en el historial con fecha.
- [ ] Reglas por juego:
  - **Scrabble:** turnos alternados; se cargan puntos por turno y, opcionalmente, la palabra. Gana el de mayor total al cerrar la partida.
  - **Truco:** a 30, sin flor. Dos columnas con fosforitos (grupos de 5, "malas" hasta 15 y "buenas" de 16 a 30). Tocar la columna suma 1; gana el primero en 30.
  - **Chinchón:** se carga cuántos puntos hizo cada uno en la mano; botón "cortó en −10" (resta 10 al que cortó) y botón "¡Chinchón!" (gana la partida directo). Pierde quien supera 101. Sin reenganche.
  - **Código Secreto:** solo se elige quién ganó.
  - **Auto amarillo:** contador eterno por persona; un toque suma 1, mantener presionado permite anular el último punto.

**US-07 · Ver el marcador**
*Como cualquiera, quiero saber quién le gana a quién.*
- [ ] Pantalla de juegos con marcador total por juego ("Truco: Facu 12 – Kiki 15").
- [ ] Historial de partidas por juego con fecha y resultado.

**US-08 · Tirar una pregunta**
*Como cualquiera, quiero tirar el dado y que salga una pregunta para charlar.*
- [ ] Botón "Tirar" con animación de dado → muestra una pregunta al azar.
- [ ] Filtro opcional por categoría (gustos, dilemas, divertidas, profundas, pasado, futuro, nosotros, amor, picante).
- [ ] No repite preguntas hasta haber recorrido todas las del filtro activo.
- [ ] No se guardan respuestas.

**US-09 · Jugar Discreción**
*Como cualquiera de los dos, quiero un juego picante para cuando estamos juntos.*
- [ ] Entrada propia, siempre en modo oscuro.
- [ ] Elegir nivel: Chispa, Calentito, Fuego, Sin discreción.
- [ ] **Dados:** tres dados (acción, zona, modo) que solo muestran caras del nivel elegido o inferiores.
- [ ] **Cartas:** muestra de quién es el turno ("Kiki, hacele a Facu…"), alterna verdad y reto, siempre se puede **pasar**.
- [ ] El contenido nunca incluye terceros ni dolor (base precargada validada).

**US-10 · Inicio**
*Como cualquiera, quiero abrir la app y sentir que es nuestra.*
- [ ] Contador "X días juntos" (desde el 16/11/2024).
- [ ] Accesos rápidos: nuevo date, juegos, pregunta, Discreción.
- [ ] El último recuerdo cargado.

### Etapa 2 — MVP completo

**US-11 · Recorrer el álbum**
- [ ] Capítulos por mes con portada (la mejor foto o la elegida) y título editable ("Noviembre 2024").
- [ ] Selector de vista: capítulos / calendario / mapa.
- [ ] El calendario muestra miniaturas en los días con recuerdos.
- [ ] El mapa muestra un pin por cada lugar, agrupando cuando hay varios cerca.

**US-12 · Precargar el pasado**
- [ ] Subir muchas fotos a la vez desde la compu o el celular.
- [ ] Si la foto tiene fecha EXIF, se usa automáticamente.
- [ ] Si no tiene (WhatsApp), se asigna una fecha a todo el lote.
- [ ] Barra de progreso; si falla una foto, se puede reintentar sin repetir las demás.

**US-13 · Pensé en vos**
- [ ] Un botón grande "Pensé en vos" + mensajito opcional (máx. 140 caracteres).
- [ ] Al otro le llega una notificación ("Facu pensó en vos 💭").
- [ ] El que recibe puede responder "yo también 💭" con un toque.
- [ ] Se puede ver el historial ("pensaste en mí 47 veces en octubre").
- [ ] En iPhone, se explica que hay que instalar la app y aceptar notificaciones (requiere iOS 16.4+).

**US-14 · Sobres**
- [ ] Cualquiera puede dejar una frase para el otro.
- [ ] Al abrir la app, el que recibe ve un sobre cerrado; al tocarlo se abre con una animación y queda guardado.
- [ ] Las frases no generan notificación.

**US-15 · Ranking de restaurantes**
- [ ] Dentro de Dates, vista "Ranking": promedio de los dos puntajes, top 10, "a los que no volvemos".

**US-16 · Estadísticas y apuestas**
- [ ] Por juego: récord total, racha actual, mayor goleada, récord de puntaje (Scrabble: mejor palabra y mejor turno), gráfico de victorias por mes, campeón del año.
- [ ] Antes de empezar una partida se puede escribir una apuesta opcional ("el que pierde paga el helado").
- [ ] Pantalla "Deudas": apuestas pendientes de cada uno, marcables como cobradas.

**US-17 · Crear un juego nuevo**
- [ ] Nombre + emoji + plantilla de anotador: *solo ganador*, *puntos por ronda (gana mayor / menor / llega a X)*, *contador por toques*.
- [ ] Aparece en la lista de juegos con su marcador e historial.

**US-18 · Discreción completo**
- [ ] **¿Lo probamos?:** cada uno responde sí / tal vez / no en privado; solo se revelan coincidencias (sí+sí, sí+tal vez) en una lista de pendientes tachables.
- [ ] **Mazo propio:** agregar cartas con nivel y tipo.
- [ ] **Límites:** marcar una carta como "nunca" la excluye para siempre de los dos.
- [ ] **Favoritas** ♥.
- [ ] Desbloqueo extra al entrar (passkey / Face ID / huella, o PIN como alternativa).

**US-19 · Primeras veces, reacciones y comentarios**
- [ ] Cualquier recuerdo puede marcarse ✨ "primera vez" con un texto ("Primer viaje juntos").
- [ ] Vista de todas las primeras veces.
- [ ] Reacciones ❤️ 😂 😍 y comentarios cortos en cualquier recuerdo.

**US-20 · Buscar**
- [ ] Un buscador global encuentra recuerdos por lugar, texto de notas, tipo y fecha.

**US-21 · Exportar todo**
- [ ] Botón en Ajustes → genera un ZIP con:
  - `data/*.json` y `data/*.csv` (una tabla por archivo, campos legibles),
  - `fotos/AAAA/MM/AAAA-MM-DD_lugar_n.webp` (y originales si se guardaron),
  - `LEEME.txt` que explica la estructura.
- [ ] El export incluye Discreción solo si se tilda explícitamente.

---

## 6. Métricas (informales)
No es un producto comercial; "éxito" es:
- Los dos la abren al menos una vez por semana.
- Cada partida de los juegos frecuentes se anota.
- Kiki carga dates sin que Facu se lo pida.
- Dentro de un año, el export funciona y contiene todo.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Supabase gratis pausa el proyecto tras 7 días sin uso | Facu lo reactiva a mano desde el panel (decisión tomada). Los datos no se pierden. |
| Web Push en iPhone requiere app instalada + iOS 16.4+ | Onboarding claro; "pensé en vos" también se ve al abrir la app. |
| Límite de 1 GB de Storage | Compresión en el cliente (~300 KB/foto) → miles de fotos. Monitoreo en Ajustes. |
| Kiki no adopta la app | Carga mínima (foto + lugar), Atajos de iOS, cero insistencia. |
| Pérdida de datos por proveedor | Export abierto + backup mensual a Google Drive (v1). |
| Contenido de Discreción incómodo | Niveles, "pasar" siempre, límites "nunca", sin terceros ni dolor. |
| SMTP revocado (contraseña de app de Gmail) → nadie puede pedir el código | Regenerar contraseña de app en la cuenta de Google en < 5 min; o migrar a Resend (dominio verificado, sin depender de una cuenta personal). |

---

## 8. Material ya generado
- `preguntas_kikina.json`: 400 preguntas en 9 categorías (seed de la tabla de preguntas).
- `discrecion_base.json`: 60 caras de dados, 200 cartas (4 niveles, verdad/reto), 80 ideas para "¿Lo probamos?".

## 9. Documentos relacionados
`TECH_SPEC.md` · `DESIGN.md` · `SHORTCUTS.md` · `ROADMAP.md` · `CLAUDE.md`
