# Ki<i — SHORTCUTS (carga rápida)

> Versión 1.0 · 30/10/2026 · Complementa a `TECH_SPEC.md` §9
> Disponible a partir de la versión **v1** (los endpoints `/api/v1/*` se implementan en esa etapa).

Esta guía arma los botones de "un toque" para cargar cosas sin abrir la app:

| Atajo | Para | Qué hace | Endpoint |
|---|---|---|---|
| 💭 **Pensé en vos** | Kiki (iOS) · Facu (Android) | Un toque y le llega al otro | `POST /api/v1/thoughts` |
| 💭 **Pensé en vos + mensaje** | Kiki · Facu | Igual, con un textito | `POST /api/v1/thoughts` |
| 📸 **Nuevo date** | Kiki (iOS) | Foto + lugar cercano → date guardado | `POST /api/v1/dates` |
| 🚕 **Auto amarillo** | Kiki · Facu | +1 al contador eterno | `POST /api/v1/counter/auto-amarillo` |
| 🖼️ **Compartir → Ki<i** | Kiki (iOS) | Desde Fotos, sube las elegidas | `POST /api/v1/media` |
| 🔌 **Probar conexión** | los dos | Verifica que el token ande | `GET /api/v1/ping` |

---

## 0. Antes de empezar

1. **Generar un token** en la app: *Ajustes → Atajos → Nuevo token* (por ejemplo, "iPhone de Kiki"). Se muestra **una sola vez**: copialo.
   Formato: `kk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`.
2. URL base: `https://kikina-app.vercel.app`
3. Todas las llamadas llevan el header:
   ```
   Authorization: Bearer kk_XXXXXXXX…
   ```
4. Todas las respuestas traen un campo `message` listo para mostrar ("Listo 💭", "Date guardado 📸", "🚕 47").

> **Si un token se pierde o se filtra:** *Ajustes → Atajos → Revocar* y generás otro. Los atajos dejan de andar hasta que pegues el nuevo.

### ¿Dónde se arman los atajos de iPhone?
Facu usa Android, así que los atajos de iOS hay que armarlos **en el iPhone de Kiki** (lo ideal: el día que se la des, juntos, ~15 minutos) **o** en cualquier iPhone/Mac y después compartirlos por link de iCloud. Si los compartís por link, usá la opción **"Preguntas de configuración"** (*Detalles del atajo → Configurar al importar*) para que al importarlo le pida el token a quien lo instala; así el mismo link sirve para cualquiera de los dos.

---

## 1. iPhone (app Atajos)

Nombres de acciones en castellano (iOS en español). Entre paréntesis, el nombre en inglés por si el celular está en otro idioma.

### 1.1 🔌 Probar conexión
1. **Texto** (*Text*): `kk_XXXXXXXX…` → renombrar la variable a `Token` (tocá el resultado → *Renombrar*).
2. **Obtener contenido de URL** (*Get Contents of URL*)
   - URL: `https://kikina-app.vercel.app/api/v1/ping`
   - Método: `GET`
   - Encabezados: `Authorization` = `Bearer ` + variable **Token**
3. **Obtener valor del diccionario** (*Get Dictionary Value*): clave `user`.
4. **Mostrar notificación** (*Show Notification*): `Conectado como ` + **Valor del diccionario**.

Si dice "Conectado como Kiki", el token anda. La primera vez, iOS pregunta si permitís conectarte a `kikina-app.vercel.app` → **Permitir siempre**.

### 1.2 💭 Pensé en vos (un toque)
1. **Texto**: token → `Token`.
2. **Obtener contenido de URL**
   - URL: `https://kikina-app.vercel.app/api/v1/thoughts`
   - Método: `POST`
   - Encabezados: `Authorization` = `Bearer ` + **Token**
   - Cuerpo de la solicitud: **JSON** → sin campos (o `message` vacío).
3. **Obtener valor del diccionario**: clave `message`.
4. **Mostrar notificación**: **Valor del diccionario** (va a decir "Listo 💭").

Ícono sugerido: burbuja de pensamiento, color terracota.

### 1.3 💭 Pensé en vos + mensaje
Igual que 1.2, con un paso más al principio:
1. **Solicitar entrada** (*Ask for Input*): tipo *Texto*, pregunta "¿Algo cortito?".
2. **Texto**: token → `Token`.
3. **Obtener contenido de URL** (como 1.2), pero en el cuerpo **JSON** agregar campo:
   - `message` (Texto) = **Entrada proporcionada** (*Provided Input*).
4. **Obtener valor del diccionario** `message` → **Mostrar notificación**.

Máximo 140 caracteres (el servidor corta lo que sobre).

### 1.4 🚕 Auto amarillo
1. **Texto**: token → `Token`.
2. **Obtener contenido de URL**
   - URL: `https://kikina-app.vercel.app/api/v1/counter/auto-amarillo`
   - Método: `POST`
   - Encabezados: `Authorization` = `Bearer ` + **Token**
   - Cuerpo: **JSON** → `delta` (Número) = `1`
3. **Obtener valor del diccionario** `message` → **Mostrar notificación** ("🚕 48").

El punto se suma a quien es dueño del token. Para anular un punto, se hace desde la app (mantener apretado).

### 1.5 📸 Nuevo date
El más largo, pero se arma una sola vez. Objetivo: tap → foto → elegir lugar de una lista → listo.

1. **Elegir del menú** (*Choose from Menu*) — pregunta "Foto":
   - Opción **"Sacar foto"** → **Tomar foto** (*Take Photo*), desactivar *Mostrar vista previa*.
   - Opción **"De la galería"** → **Seleccionar fotos** (*Select Photos*), *Seleccionar varias* desactivado.
   - (Al terminar el menú, la variable de salida es la foto.)
2. **Redimensionar imagen** (*Resize Image*): ancho `1600`, alto `Automático`.
3. **Convertir imagen** (*Convert Image*): a **JPEG**, calidad `0.8`, *Conservar metadatos* activado.
   → Renombrar el resultado a `Foto`. (Esto mantiene la foto por debajo del límite de 4.5 MB de Vercel.)
4. **Obtener ubicación actual** (*Get Current Location*).
5. **Elegir del menú** — pregunta "¿Qué es?":
   - "Restaurante o bar" → **Texto** `restaurante`
   - "Café" → **Texto** `café`
   - "Otro lugar" → **Texto** `lugar`
   → Renombrar la salida del menú a `Busqueda`.
6. **Buscar negocios locales** (*Search Local Businesses*): buscar **Busqueda** cerca de **Ubicación actual**, radio `0.3` km.
7. **Elegir de la lista** (*Choose from List*): pregunta "¿Dónde están?".
   - Si no aparece: agregar antes un **Si** (*If*) "Negocios locales no tiene ningún valor" → **Solicitar entrada** "¿Cómo se llama el lugar?" y usar eso como nombre.
8. **Obtener detalles de negocios locales** (*Get Details of Local Businesses*) cuatro veces (o una por propiedad):
   - *Nombre* → `Lugar`
   - *Latitud* → `Lat`
   - *Longitud* → `Lng`
   - *Dirección* → `Direccion`
9. **Texto**: token → `Token`.
10. **Obtener contenido de URL**
    - URL: `https://kikina-app.vercel.app/api/v1/dates`
    - Método: `POST`
    - Encabezados: `Authorization` = `Bearer ` + **Token**
    - Cuerpo de la solicitud: **Formulario** (*Form*):
      | Clave | Tipo | Valor |
      |---|---|---|
      | `photo` | Archivo | **Foto** |
      | `place_name` | Texto | **Lugar** |
      | `lat` | Texto | **Lat** |
      | `lng` | Texto | **Lng** |
      | `address` | Texto | **Direccion** |
11. **Obtener valor del diccionario** `message` → **Mostrar notificación** ("Date guardado 📸").

Puntajes, qué comieron, etc. se completan después en la app (si tienen ganas).

### 1.6 🖼️ Compartir → Ki<i (desde la app Fotos)
1. En *Detalles del atajo* (ícono ⓘ): activar **Mostrar en la hoja de compartir** y en *Tipos* dejar solo **Imágenes**.
2. El atajo recibe **Entrada del atajo** (*Shortcut Input*). Si no hay entrada: *Pedir fotos*.
3. **Texto**: token → `Token`.
4. **Repetir con cada** (*Repeat with Each*) elemento de **Entrada del atajo**:
   1. **Obtener detalles de imágenes** (*Get Details of Images*): *Fecha de captura* → **Formatear fecha** (*Format Date*) personalizado `yyyy-MM-dd` → `Fecha`.
   2. **Redimensionar imagen**: ancho `1600`.
   3. **Convertir imagen**: JPEG, calidad `0.8`, *Conservar metadatos* activado.
   4. **Obtener contenido de URL**
      - URL: `https://kikina-app.vercel.app/api/v1/media`
      - Método: `POST`
      - Encabezados: `Authorization` = `Bearer ` + **Token**
      - Cuerpo: **Formulario** → `files` (Archivo) = **Imagen convertida**, `date` (Texto) = **Fecha**
5. **Contar** (*Count*) elementos de **Entrada del atajo** → **Mostrar notificación** `Subí ` + **Cantidad** + ` fotos`.

Uso: en Fotos, seleccionar → *Compartir* → **Ki<i**. (Una foto por request: es más lento con muchas, pero no falla por tamaño. Para precargas grandes, usar la pantalla *Importar* de la app.)

### 1.7 ¿Desde dónde se disparan? (iPhone)
| Disparador | Cómo se configura | Ideal para |
|---|---|---|
| **Ícono en la pantalla de inicio** | Atajo → *Compartir* → *Agregar a pantalla de inicio* | Nuevo date, Pensé en vos |
| **Widget de Atajos** | Mantener apretada la pantalla de inicio → *+* → *Atajos* → widget mediano (4 atajos) → elegir carpeta "Ki<i" | Todos juntos en un solo widget |
| **Botón de Acción** (iPhone 15 Pro y posteriores) | *Ajustes → Botón de Acción → Atajo* → "Pensé en vos" | Pensé en vos |
| **Toque atrás** (casi cualquier iPhone) | *Ajustes → Accesibilidad → Tocar → Toque atrás → Doble toque* → atajo | Pensé en vos o Auto amarillo |
| **Siri** | Se dice el nombre del atajo: "Oye Siri, pensé en vos" | Manos ocupadas |
| **Pantalla bloqueada** | Mantener apretada la pantalla bloqueada → *Personalizar* → widgets → Atajos | Auto amarillo |

Sugerencia: crear una **carpeta "Ki<i"** en la app Atajos con los 6 atajos y usar el widget de esa carpeta.

---

## 2. Android (Facu)

### 2.1 Compartir → Ki<i (nativo)
1. Abrir `https://kikina-app.vercel.app` en **Chrome** → menú ⋮ → **Instalar app**.
2. Listo: en la galería o Google Fotos, *Compartir* → aparece **Ki<i**. Abre la pantalla de subida con las fotos (fecha leída del EXIF).
   (Funciona por *Web Share Target*; no necesita token.)

### 2.2 Botones de un toque con **HTTP Shortcuts**
App gratuita y de código abierto (*HTTP Shortcuts*, de Waboodoo, en Play Store / F-Droid).

**Configuración común (una vez):**
1. *Variables* → nueva variable **Constante** `kk_token` = tu token.
2. *Variables* → nueva variable **Constante** `kk_base` = `https://kikina-app.vercel.app`.

**💭 Pensé en vos**
- Nuevo atajo → *Solicitud HTTP normal*.
- Método `POST`, URL `{{kk_base}}/api/v1/thoughts`.
- *Encabezados*: `Authorization: Bearer {{kk_token}}`.
- *Cuerpo*: tipo *JSON personalizado* → `{}`.
- *Manejo de respuesta*: *Mostrar como toast* → contenido: script
  ```js
  showToast(JSON.parse(response.body).message);
  ```
  (o simplemente "Mostrar respuesta: toast").

**💭 Pensé en vos + mensaje**
- Igual, más una variable *Entrada de texto* `mensaje` ("¿Algo cortito?") y cuerpo:
  ```json
  { "message": "{{mensaje}}" }
  ```

**🚕 Auto amarillo**
- `POST {{kk_base}}/api/v1/counter/auto-amarillo`, cuerpo `{ "delta": 1 }`, toast con `message`.

**¿Desde dónde se disparan? (Android)**
| Disparador | Cómo |
|---|---|
| Ícono en el escritorio | Mantener apretado el atajo → *Colocar en pantalla de inicio* |
| Widget | Widgets → HTTP Shortcuts → elegir atajo |
| **Ajustes rápidos** (cortina) | En el atajo: *Ajustes → Mostrar en Ajustes rápidos*; después agregar la tile desde la edición de la cortina |
| Asistente | "Ok Google, abrí Pensé en vos" (abre el atajo) |

Ideal: **tile de Ajustes rápidos para "Pensé en vos"** y **"Auto amarillo"** (se dispara sin desbloquear del todo).

---

## 3. Referencia rápida de la API

| Método y ruta | Cuerpo | Respuesta OK |
|---|---|---|
| `GET /api/v1/ping` | — | `{"ok":true,"user":"Kiki"}` |
| `POST /api/v1/thoughts` | JSON `{"message"?: "…"}` | `{"ok":true,"message":"Listo 💭"}` |
| `POST /api/v1/dates` | form-data: `photo`, `place_name`, `lat?`, `lng?`, `address?`, `occurred_at?` | `{"ok":true,"id":"…","message":"Date guardado 📸"}` |
| `POST /api/v1/media` | form-data: `files` (1..n), `date?` (YYYY-MM-DD) | `{"ok":true,"count":1,"message":"1 foto subida"}` |
| `POST /api/v1/counter/:slug` | JSON `{"delta": 1 \| -1}` | `{"ok":true,"total":48,"message":"🚕 48"}` |

Prueba desde la compu:
```bash
curl -s https://kikina-app.vercel.app/api/v1/ping -H "Authorization: Bearer kk_XXXX"
curl -s -X POST https://kikina-app.vercel.app/api/v1/thoughts \
  -H "Authorization: Bearer kk_XXXX" -H "Content-Type: application/json" \
  -d '{"message":"probando"}'
```

---

## 4. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No autorizado" / 401 | Token mal copiado, sin `Bearer `, o revocado | Volver a pegar el token; revisar el espacio después de `Bearer` |
| 413 o "La foto es muy pesada" | La foto pasó 4.5 MB | Bajar el ancho a `1280` en *Redimensionar imagen* |
| El atajo queda "cargando" mucho | Supabase está pausado (plan gratis, 7 días sin uso) | Reactivar el proyecto desde el panel de Supabase |
| No aparece "Ki<i" en Compartir (iPhone) | No está activado *Mostrar en la hoja de compartir* o el tipo no es Imágenes | Revisar ⓘ del atajo; en la hoja de compartir, *Editar acciones* y agregarlo |
| No aparece "Ki<i" en Compartir (Android) | La PWA no está instalada desde Chrome | Instalarla desde Chrome (no desde otro navegador) |
| "Buscar negocios locales" no encuentra el lugar | Radio chico o categoría equivocada | Elegir "Otro lugar" o escribir el nombre a mano |
| La fecha de las fotos queda mal | La foto vino de WhatsApp (sin EXIF) | Corregir la fecha en la app |
| No llega la notificación de "pensé en vos" | El otro no activó notificaciones o en iPhone no instaló la app | *Ajustes → Notificaciones → Activar* desde la app instalada |
