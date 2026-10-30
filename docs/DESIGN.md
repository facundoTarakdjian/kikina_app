# Kikiña — DESIGN

> Versión 1.0 · 30/10/2026 · Complementa a `PRD.md` y `TECH_SPEC.md`

---

## 1. Dirección estética: "álbum cálido moderno"

Kikiña se tiene que sentir como **un buen álbum de fotos**, no como una tarjeta de San Valentín ni como una base de datos.

| Sí | No |
|---|---|
| Fotos grandes y protagonistas | Corazones decorativos, stickers, brillitos |
| Fondo crema con textura de papel muy sutil | Rosa chicle, gradientes, glassmorphism |
| Serif editorial sobria en títulos | Letra cursiva o "manuscrita" |
| Mucho aire, pocas cosas por pantalla | Tablas, grillas densas, formularios largos a la vista |
| Un toque analógico **solo en Recuerdos** (borde tipo polaroid, fecha como sello) | Skeuomorfismo en toda la app |
| Microcopy cálido y corto, rioplatense | Frases cursis ("nuestro amor infinito ✨💕") |

**Regla de oro:** cargar es un formulario; mirar nunca parece una tabla.

### Tres "climas"
1. **Kikiña claro** (default de día): papel crema, tinta marrón, acento terracota.
2. **Kikiña oscuro** (sigue al sistema): papel de noche, mismo espíritu.
3. **Discreción** (siempre oscuro, independiente del sistema): luz baja, vino y rojo profundo. Se siente "otra habitación" de la casa.

---

## 2. Marca

### Logo: Ki<i + koala
- **Ícono de la app:** el **koala de Noto Emoji** (Google, licencia Apache 2.0) centrado sobre fondo crema `#F7F2EA`, ocupando ~65% del cuadrado (deja margen para la máscara de Android).
  - Fuente: `https://github.com/googlefonts/noto-emoji/blob/main/svg/emoji_u1f428.svg` → se descarga una sola vez a `public/brand/koala.svg` y se exportan los PNG desde ahí (no se linkea en vivo).
  - **No usar el koala de Apple** (es arte de Apple, no se puede redistribuir). En los textos de la app, el emoji 🐨 sí se puede usar: cada celular lo dibuja con su propio set.
  - Atribución en Ajustes → Acerca de: "Koala: Noto Emoji, © Google, Apache License 2.0".
- **Wordmark "Ki<i"** (encabezado, login, splash): tipografía **Young Serif** (Google Fonts, OFL), un solo peso. El `<` es el **glifo nativo de la fuente** (mismo peso que las letras), en terracota `#C2643C`; el resto en tinta. Mayúscula solo la K: `Ki<i`.
- Variantes a exportar: `icon-192.png`, `icon-512.png`, `maskable-512.png` (koala al 55% para la zona segura), `apple-touch-icon.png` (180, sin transparencia), favicon (koala SVG).
- **Splash iOS:** fondo crema, koala chico arriba y wordmark "Ki<i" debajo.

---

## 3. Paleta (tokens)

Todos los colores se definen como variables CSS en `src/app/globals.css` y se exponen a Tailwind (`bg-paper`, `text-ink`, etc.). Contrastes verificados (WCAG AA).

### Kikiña claro
| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--paper` | `#F7F2EA` | Fondo de la app | — |
| `--paper-2` | `#EFE7DA` | Fondos secundarios, chips | — |
| `--card` | `#FFFDF9` | Tarjetas, sheets | — |
| `--line` | `#E3D8C8` | Bordes, separadores | — |
| `--ink` | `#2A211C` | Texto principal | 14.1:1 sobre paper |
| `--ink-2` | `#6B5D53` | Texto secundario, fechas | 5.7:1 |
| `--accent` | `#A9512D` | Botón primario, links, texto de acento | 4.8:1 sobre paper · blanco encima 5.4:1 |
| `--accent-deco` | `#C2643C` | Íconos grandes, el `<` del logo, pins del mapa (no para texto chico) | — |
| `--accent-soft` | `#F1DCCF` | Fondos de acento suaves, selección | — |
| `--facu` | `#3F5A73` | Color de Facu en marcadores | 6.5:1 |
| `--kiki` | `#A9512D` | Color de Kiki en marcadores | 4.8:1 |
| `--ok` | `#5E7D5A` | Confirmaciones | — |
| `--danger` | `#B03A2E` | Errores, borrar | — |

### Kikiña oscuro
| Token | Hex |
|---|---|
| `--paper` | `#1B1613` |
| `--paper-2` | `#231D19` |
| `--card` | `#2A231E` |
| `--line` | `#3A302A` |
| `--ink` | `#F2EAE0` (15:1) |
| `--ink-2` | `#B5A799` (7.6:1) |
| `--accent` | `#E07B4F` (6.1:1; texto encima en `--paper`) |
| `--accent-deco` | `#E07B4F` |
| `--accent-soft` | `#3A2519` |
| `--facu` | `#7FA3C2` (6.8:1) |
| `--kiki` | `#E07B4F` |

### Discreción (siempre)
| Token | Hex | Uso |
|---|---|---|
| `--d-bg` | `#120A0B` | Fondo |
| `--d-surface` | `#1E1012` | Cartas, dados |
| `--d-line` | `#3A1E22` | Bordes |
| `--d-ink` | `#F3E6E3` | Texto (16:1) |
| `--d-ink-2` | `#B9A7A3` | Secundario (8.5:1) |
| `--d-accent` | `#B3243A` | Botones (blanco encima 6.5:1) |
| `--d-glow` | `#E8475F` | Brillo de dados, foco (5.1:1) |
| Nivel 1 · Chispa | `#E8A0A0` | Chip y borde de carta |
| Nivel 2 · Calentito | `#E46A5E` | |
| Nivel 3 · Fuego | `#D6342F` | |
| Nivel 4 · Sin discreción | `#9B1B30` + borde `#E8475F` | |

### Textura de papel
SVG de ruido (`feTurbulence`) al 3–4% de opacidad sobre `--paper`, fijo (no scrollea). Desactivado en modo oscuro y en Discreción.

---

## 4. Tipografía

| Rol | Fuente | Detalles |
|---|---|---|
| Títulos y números grandes | **Fraunces** (variable, Google Fonts) | `opsz` automático, `SOFT` 50, pesos 400–600. Nunca itálica decorativa. |
| Wordmark "Ki<i" (solo el logo) | **Young Serif** (Google Fonts) | Un peso. El `<` nativo de la fuente. |
| UI y texto | **Instrument Sans** (Google Fonts) | Pesos 400/500/600. `font-variant-numeric: tabular-nums` en marcadores y puntajes. |

Cargar con `next/font/google` (subset `latin`, `display: swap`).

### Escala
| Token | Tamaño / interlínea | Uso |
|---|---|---|
| `display` | Fraunces 40/44, 500 | Contador de días, ganador de partida |
| `h1` | Fraunces 30/36, 500 | Título de pantalla |
| `h2` | Fraunces 22/28, 500 | Título de capítulo, de recuerdo |
| `h3` | Instrument Sans 17/24, 600 | Títulos de sección |
| `body` | Instrument Sans 16/24, 400 | Texto |
| `small` | Instrument Sans 14/20, 400 | Metadatos |
| `caption` | Instrument Sans 12/16, 500, mayúsculas, tracking +6% | Fechas tipo sello, etiquetas |
| `score` | Fraunces 56/60, 500, tabular | Marcadores en vivo |

Respetar el tamaño de texto del sistema: usar `rem`, sin `maximum-scale` en el viewport.

---

## 5. Espaciado, forma y movimiento

- **Grilla:** múltiplos de 4 px. Margen lateral 20 px en celular, contenido máximo 720 px en compu.
- **Radios:** tarjetas 20 px · botones 14 px · chips y avatares redondos · fotos dentro de tarjetas 14 px.
- **Sombras:** casi nada. `--shadow-1: 0 1px 2px rgb(42 33 28 / .06), 0 4px 16px rgb(42 33 28 / .05)` para sheets y tarjetas flotantes.
- **Áreas táctiles:** mínimo 44×44 px; los botones de anotadores, mínimo 64 px de alto.
- **Movimiento:** sutil y con propósito.
  - Transiciones de pantalla 200 ms `ease-out`.
  - Dado: 600 ms de rodado + rebote corto.
  - Sobre: 700 ms (solapa que se abre, papel que sube).
  - Nuevo recuerdo: la tarjeta entra desde arriba en el feed.
  - `prefers-reduced-motion`: sin rodado ni rebotes (aparece directo).
- **Hápticos** (Android, `navigator.vibrate`): 10 ms al sumar un punto, 30 ms al ganar. iOS no lo soporta en web: se omite sin romper nada.

---

## 6. Navegación

**Barra inferior con 5 posiciones**, la del medio es el botón de carga:

```
 ┌──────────────────────────────────────────────┐
 │  Inicio   Recuerdos   [ + ]   Juegos   Juntos │
 └──────────────────────────────────────────────┘
```
- **Inicio:** el "hoy" de la pareja.
- **Recuerdos:** el álbum.
- **[ + ]:** abre el sheet de carga (círculo terracota de 56 px, sobresale un poco de la barra).
- **Juegos:** marcadores y anotadores.
- **Juntos:** lo que se usa estando juntos (Preguntas, Discreción, Sobres/Cartas).
- **Ajustes:** avatar arriba a la derecha en Inicio.

**Sheet "+"** (de abajo, ordenado por frecuencia):
`📸 Date` · `🖼️ Fotos` · `💭 Pensé en vos` · `✉️ Sobre` · `🎲 Partida` · `🚕 +1 auto amarillo`

---

## 7. Componentes clave

| Componente | Descripción |
|---|---|
| **MemoryCard** | Foto a sangre (proporción 4:5), debajo: lugar (h3), fecha como `caption` tipo sello, puntajes chiquitos si es date (●7 ●9 con colores de cada uno). Marca ✨ si es primera vez. Reacciones abajo a la derecha. |
| **PolaroidCard** | Variante solo para capítulos y resúmenes: borde blanco 10 px (28 px abajo), leve rotación aleatoria ±1.5°, sombra 1. Texto de abajo en Instrument Sans (no manuscrita). |
| **ChapterHeader** | Foto de portada a lo ancho con degradé inferior, título del mes en Fraunces ("Noviembre 2024"), subtítulo con conteo ("4 dates · 23 fotos · 1 viaje"). |
| **DayCounter** | `display` "718" + `caption` "DÍAS JUNTOS". Tocarlo alterna: días / desde el 16/11/2024 / desde el 25/5/2025. |
| **ScoreBoard** | Dos columnas (Facu / Kiki) con su color, número `score`, avatar arriba. Línea "Historial: 12 – 15". |
| **MatchstickColumn** (truco) | Fosforitos dibujados en SVG, en cuadrados de 5 (4 lados + diagonal). Línea divisoria en 15 con etiquetas "malas" / "buenas". Tocar la columna suma 1. |
| **RoundInput** (chinchón/scrabble) | Teclado numérico grande para cargar la mano o el turno; botones especiales ("Cortó −10", "¡Chinchón!", "Palabra"). |
| **UndoBar** | Barra fija abajo en anotadores: "Deshacer" + texto del último evento ("+1 Kiki"). |
| **Die** (preguntas/Discreción) | Cubo con caras de texto; en preguntas, color crema; en Discreción, `--d-surface` con brillo `--d-glow`. |
| **Envelope** | Sobre cerrado (SVG) con el nombre del remitente; al tocar se abre y se ve el papel con la frase en Fraunces. |
| **ThoughtToast** | Al abrir la app con "pensé en vos" nuevos: tarjeta pequeña arriba "💭 Facu pensó en vos · hace 2 h" + botón "Yo también". |
| **PlacePicker** | Buscador con sugerencias: primero lugares ya usados cerca (por ubicación), luego resultados del proveedor. Un tap = elegido. |
| **PhotoPicker** | Dos botones grandes: "Sacar foto" / "Elegir de la galería". Vista previa inmediata. |
| **LevelPicker** (Discreción) | 4 chips grandes con nombre y 1–4 ajíes 🌶️; el seleccionado brilla con su color. |
| **EmptyState** | Ilustración mínima (línea fina en `--ink-2`) + una frase + un botón. |

### Íconos
Lucide (trazo 1.75 px, esquinas redondeadas) para UI. Emojis solo como identidad de juegos/tipos (🃏 🚕 📸 💭 ✉️), nunca decorativos.

---

## 8. Pantallas

Marcadas con **[E1]** (Etapa 1 · Lite) o **[E2]** (Etapa 2 · MVP completo).

### 8.1 Login [E1]
- Koala + wordmark "Ki<i" centrados, fondo papel.
- Paso 1: campo mail + "Mandame el código".
- Paso 2: 6 casillas de dígitos (autocompletado `one-time-code`), "Entrar". Link "Reenviar".
- Error genérico si el mail no está autorizado: "Ese mail no tiene acceso".

### 8.2 Bienvenida / Instalar [E1]
- Solo si en iPhone no está instalada: 3 pasos ilustrados ("Tocá Compartir → Agregar a inicio → Abrí Kikiña desde ahí").
- Primera vez de Kiki (opcional, E2): una carta de bienvenida de Facu en un sobre.

### 8.3 Inicio [E1, se enriquece en E2]
De arriba hacia abajo:
1. Header: wordmark "Ki<i" chico + avatar (→ Ajustes).
2. **DayCounter**.
3. [E2] **Sobres nuevos** (si hay) y **ThoughtToast**.
4. [E2] Botón grande "💭 Pensé en vos".
5. [v1] "Hace un año hoy" (tarjeta con foto).
6. **Último recuerdo** (MemoryCard).
7. Accesos rápidos en fila: "Tirar pregunta", "Seguir partida" (si hay una abierta), "Discreción".

### 8.4 Sheet "+" [E1]
Ver sección 6.

### 8.5 Nuevo date [E1]
**Una sola pantalla**, dos bloques obligatorios arriba y un acordeón opcional:
1. PhotoPicker (si ya hay foto, se ve grande).
2. PlacePicker.
3. Fecha (chip "Hoy" editable).
4. Botón **Guardar** fijo abajo, habilitado apenas hay foto + lugar.
5. "Agregar detalles (opcional)" colapsado: qué comieron · tipo (chips) · mi puntaje (1–10, slider de puntos) · ¿volveríamos? (Sí / Tal vez / No) · nota.

Nunca se muestra "incompleto". El puntaje del otro no se edita desde acá.

### 8.6 Detalle de recuerdo [E1]
- Foto(s) a lo ancho (carrusel con indicadores).
- Lugar (tocable → mapa [E2]), fecha, tipo.
- Puntajes de los dos lado a lado con su color; si falta el mío: botón chico "Poner mi puntaje" (no es un recordatorio, es una acción disponible).
- Qué comieron, ¿volveríamos?, nota.
- [E2] ✨ primera vez · reacciones · comentarios.
- Menú ⋯: editar, cambiar portada, borrar (con confirmación).

### 8.7 Recuerdos
- **[E1] Feed:** lista de MemoryCards, lo último arriba, separadores de mes con `caption` ("OCTUBRE 2026").
- **[E2] Selector de vista** arriba (segmentado): **Capítulos · Calendario · Mapa**. Lupa → búsqueda global.
  - **Capítulos:** un ChapterHeader por mes, debajo una grilla suelta de PolaroidCards (2 columnas, alturas variadas). Tocar el header → página del capítulo.
  - **Calendario:** mes en grilla; los días con recuerdos muestran la miniatura; deslizar cambia de mes.
  - **Mapa:** pantalla completa, pins terracota con clusters; tocar → mini tarjeta → detalle.
- Filtro por tipo (chips): Todo · Dates · Fotos · Viajes · Primeras veces.

### 8.8 Importar fotos [E2]
- Arrastrar o elegir muchas fotos.
- Lista agrupada por día detectado; grupo "Sin fecha" arriba con "Asignar fecha a todas".
- Por grupo: "Crear un recuerdo por día" (default) o elegir un recuerdo existente.
- Barra de progreso, reintentar fallidas.

### 8.9 Ranking de restaurantes [E2]
- Dentro de Dates (tab "Ranking").
- Top 10 con promedio grande en Fraunces y los dos puntajes chicos.
- Sección "A los que no volvemos" (¿volveríamos? = No).

### 8.10 Juegos [E1]
- Lista de tarjetas por juego: emoji, nombre, **marcador total** "Facu 12 – Kiki 15" con colores, fecha de la última partida.
- Auto amarillo muestra el total eterno de cada uno y botones +1 directos en la tarjeta.
- Si hay partida abierta: banda arriba "Truco en curso · 18 a 22 → Seguir".
- [E2] Botón "Nuevo juego".

### 8.11 Detalle de juego [E1 básico, E2 estadísticas]
- ScoreBoard histórico.
- Botón grande "Nueva partida" (+ campo opcional de apuesta [E2]).
- Historial: lista de partidas (fecha, resultado, ganador con su color).
- [E2] Estadísticas: racha actual, mayor goleada, récord (Scrabble: mejor palabra), gráfico de barras por mes (dos colores), campeón del año.
- [E2] Deudas de apuestas pendientes.

### 8.12 Anotadores en vivo [E1]
Pantalla sin barra inferior (modo foco), botón ✕ arriba (la partida queda guardada), UndoBar abajo.
- **Truco:** dos MatchstickColumn ocupando toda la pantalla, nombre y número arriba de cada una. Tocar = +1. Al llegar a 30: pantalla de ganador.
- **Chinchón:** tabla de manos simple (es la única excepción "tabla", va en tipografía grande y aireada); "Nueva mano" abre RoundInput para cada uno; botones "Cortó −10" y "¡Chinchón!". Total acumulado arriba en `score`; aviso visual al acercarse a 101.
- **Scrabble:** total de cada uno arriba; abajo, turno actual ("Turno de Kiki"), RoundInput con puntos + campo opcional "palabra"; lista de turnos colapsable. "Terminar partida".
- **Código Secreto:** dos botones enormes "Ganó Facu" / "Ganó Kiki".
- **Auto amarillo:** dos botones enormes con el total eterno; mantener apretado = anular el último.
- **Ganador:** pantalla con `display` "¡Ganó Kiki!", marcador final, historial actualizado, [E2] apuesta a cobrar. Botones "Revancha" y "Listo".

### 8.13 Juntos [E1]
Hub con tres tarjetas grandes: **Preguntas** · **Discreción** (tarjeta oscura) · [E2] **Sobres y cartas**.

### 8.14 Preguntas [E1]
- Die grande en el centro; tocar para tirar.
- La pregunta aparece en Fraunces `h1`, centrada, con su categoría como `caption`.
- Chips de categoría arriba (multi-selección; "Todas" por default).
- "Otra" (tirar de nuevo). Contador discreto "Quedan 312 sin salir".

### 8.15 Discreción [E1 dados + cartas, E2 resto]
Tema oscuro forzado. [E2] Pantalla de desbloqueo (Face ID / huella / PIN).
- **Home:** título "Discreción" en Fraunces, LevelPicker, y modos: 🎲 Dados · 🃏 Cartas · [E2] 💘 ¿Lo probamos? · [E2] ✍️ Nuestro mazo.
- **Dados:** tres dados en fila (acción / zona / modo), botón "Tirar". El resultado se arma como frase: "**Besá lento** · **el cuello** · **con los ojos cerrados**".
- **Cartas:** carta grande centrada con borde del color del nivel; arriba "Turno de Kiki → Facu"; etiqueta VERDAD o RETO; botones "Listo" (siguiente) y "Pasar". [E2] ♥ favorita y "nunca" (⋯). Opción "subir de nivel cada 5 cartas".
- **¿Lo probamos? [E2]:** tarjetas de a una con Sí / Tal vez / No (swipe o botones); sección "Coincidencias" con las que salieron, tachables "¡Hecho!".
- **Nuestro mazo [E2]:** lista de cartas propias, agregar con nivel y verdad/reto.

### 8.16 Sobres y cartas [E2 sobres, v1 cartas]
- Bandeja: sobres cerrados arriba (Envelope), abiertos abajo como papelitos.
- "Escribir un sobre": textarea simple (máx. 280), "Dejar sobre".
- [v1] Cartas "para abrir cuando…": se muestran cerradas con su condición ("Para cuando me extrañes"); las de fecha muestran candado y fecha.

### 8.17 Pensé en vos [E2]
- Desde Inicio o el sheet "+": un sheet con botón grande "💭 Pensé en vos" y campo opcional "algo cortito…".
- Historial: lista simple por mes con el total ("Octubre · Kiki pensó en vos 47 veces").

### 8.18 Ajustes [E1 básico]
- Perfil (nombre, color).
- [E2] Notificaciones: estado + "Activar" (con guía para iPhone).
- [v1] Atajos: generar/revocar tokens, link a la guía de `SHORTCUTS.md`.
- [E2] Discreción: cambiar PIN / registrar Face ID.
- [E2] Exportar todo (+ "Incluir Discreción").
- [E2] Uso de almacenamiento (barra "312 MB de 1 GB").
- Cerrar sesión.

---

## 9. Flujos principales

### F1 · Cargar un date en menos de 10 segundos
```
Inicio ──tap [+]──► Sheet ──tap "📸 Date"──► Nuevo date
  (0 s)              (1 s)                      │
                                                ▼
                         tap "Sacar foto" → cámara → ✓   (≈4 s)
                                                │
                         PlacePicker ya muestra "cerca tuyo":
                         tap "La Mezzetta"               (≈7 s)
                                                │
                         tap [Guardar] → vuelve al feed, tarjeta nueva arriba  (≈8 s)
```
Claves: el PlacePicker pide la ubicación apenas se abre la pantalla (en paralelo con la cámara); los lugares ya visitados aparecen primero; el botón Guardar está siempre a mano.
**Vía Atajo (iOS):** tap en el atajo → cámara → elegir lugar de la lista de Apple Maps → "Date guardado 📸". Sin abrir la app.

### F2 · Mirar los recuerdos
```
Recuerdos (Capítulos) → scroll por meses → tap portada "Mayo 2025"
   → capítulo: polaroids del mes → tap foto → detalle → swipe lateral al siguiente recuerdo
   ↕ cambiar a Calendario o Mapa sin perder el mes en el que estaba
```
"Hace un año hoy" (v1) aparece en Inicio y lleva directo al detalle.

### F3 · Recibir un "pensé en vos" y un sobre
```
Facu toca "💭 Pensé en vos" (+ "te vi en la foto del viaje")
   → push en el iPhone de Kiki: "💭 Facu: te vi en la foto del viaje"
   → Kiki toca la notificación → se abre Inicio con el ThoughtToast resaltado
   → "Yo también 💭" (un tap) → a Facu le llega su push
Sobres: sin push. Kiki abre la app → arriba aparece "✉️ Tenés un sobre de Facu"
   → tap → animación de apertura → la frase en grande → queda en la bandeja.
```

### F4 · Anotar un truco
```
Juegos → Truco → "Nueva partida" → anotador
   tap columna Kiki (+1)… tap columna Facu (+1)…  (se guarda solo en cada tap)
   se bloquea el celular → al volver: "Truco en curso 18–22 → Seguir"
   llega a 30 → "¡Ganó Kiki!" → historial 12–16 → "Revancha" o "Listo"
```

### F5 · Una noche de Discreción
```
Juntos → Discreción → (desbloqueo) → nivel "Calentito" → Cartas
   carta: "Turno de Facu → Kiki · RETO · Besale el cuello bajando hasta el hombro"
   "Listo" → siguiente (turno de Kiki) … "Pasar" cuando no va
   cada 5 cartas: "¿Suben a Fuego?" → Sí / Seguimos acá
```

---

## 10. Voz y microcopy

Rioplatense, cálido, corto. Nada de cursilería ni de lenguaje de "app".

| Situación | ✅ Así | ❌ Así no |
|---|---|---|
| Guardar date | "Guardado" | "¡Tu hermoso recuerdo fue guardado con éxito! 💕" |
| Feed vacío | "Todavía no hay nada. Empecemos por la última salida." | "No hay entradas registradas." |
| Pensé en vos enviado | "Le llegó 💭" | "Notificación enviada correctamente." |
| Ganador | "¡Ganó Kiki!" | "Partida finalizada. Ganador: Kiki." |
| Borrar | "¿Borramos este recuerdo? No se puede deshacer." | "¿Está seguro?" |
| Error de red | "No hay conexión. Lo guardo y lo subo cuando vuelva." | "Error 503." |
| Discreción, pasar | "Pasar" | "Saltar desafío" |
| Pregunta | "Otra" | "Generar nueva pregunta" |
| Sobre nuevo | "Tenés un sobre de Facu" | "Nuevo mensaje recibido" |

Fechas: formato `es-AR` ("sábado 25 de mayo de 2025", corto "25 may 2025"). Relativas para lo reciente ("hace 2 h", "ayer").

---

## 11. Accesibilidad y calidad
- Contraste AA en todos los textos (ver tabla de paleta).
- Áreas táctiles ≥ 44 px; anotadores ≥ 64 px.
- `alt` de fotos: "<tipo> en <lugar>, <fecha>".
- Foco visible (anillo `--accent` / `--d-glow`).
- `prefers-reduced-motion` respetado.
- Safe areas de iOS (`env(safe-area-inset-*)`) en barra inferior, sheets y anotadores.
- Orientación vertical; en compu, contenido centrado a 720 px y grillas de 3–4 columnas en Recuerdos.
