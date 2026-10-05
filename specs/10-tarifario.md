# SPEC 10 - Tarifario

> **Estado:** Draft
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 02 (`02-autenticacion-admin.md`, INT01 pendiente), SPEC 03 (`03-shell-y-navegacion.md`, INT03 pendiente).
> **Patron de referencia:** SPEC 05 (`05-conductores-listado-estados.md`), SPEC 06 (`06-conductor-detalle-vehiculo.md`), SPEC 08 (`08-mapa-administrativo.md`) y SPEC 09 (`09-solicitudes-activas.md`).
> **Contrato externo:** `../backend/specs/11-tarifario-dashboard.md`, seccion 3.3, y `../docs/ROADMAP_FRONTEND.md:571-634`.
> **Fecha:** 2026-10-05
> **Revision:** 2026-10-05, correccion de tipografia y fijacion de los textos exactos de la interfaz. Sigue en `Draft`; la aprobacion y la implementacion quedan pendientes.
> **Objetivo:** Reemplazar el stub de `/tarifas` por una pantalla que lista las tarifas vigentes del tarifario oficial y permite registrar y editar la descripcion y el monto de cada tarifa sin alterar su vigencia.

> **Actualizacion de implementacion (2026-10-05):** El usuario autorizo expresamente implementar esta spec pese al estado documental Draft. La implementacion frontend y su verificacion local estan realizadas; consultar el registro final y las casillas con evidencia. Las prohibiciones de implementar y las afirmaciones de trabajo pendiente en la entrega documental se conservan como historial, no como restricciones de esta fase. INT10 permanece pendiente.

## Estado de la definicion

Las fases de investigacion y de preguntas quedaron cerradas. El usuario confirmo D1-D9 y las desviaciones respecto del prototipo antes de redactar este documento.
No queda ninguna decision pendiente de respuesta: las nueve decisiones aprobadas estan escritas con su alternativa descartada y su motivo.
Las verificaciones estaticas a-f quedan documentadas en su seccion y permiten cerrar la definicion, pero no certifican cambios que aun no existen.
Las rutas de fuentes y codigo se expresan respecto de `frontEnd/`, salvo los nombres de specs locales del encabezado.
No se ejecutaron pruebas, build, peticiones al backend, commit, rama ni push en esta entrega.
Estar listo para implementar no acredita funcionamiento ni autoriza ejecutar el plan.

## Contexto y fuentes

`src/pages/Tarifas.tsx` es un stub de diez lineas sin consulta de datos: solo un `h1` y un parrafo con la fuente.
El tipo `Tarifa` ya existe en el contrato central con los cuatro campos exactos.
La ruta protegida y la entrada de navegacion ya estan registradas.
El prototipo de `references/pantallas/tarifas.html` existe, pero su contenido se genera desde `references/pantallas/app.js` y contiene desviaciones frente al contrato del backend.

| Fuente | Referencia relevante |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:571-634` | Alcance del modulo 10, columnas, alta y edicion, aviso de monto aproximado y polling sugerido. |
| `../docs/ROADMAP_FRONTEND.md:585-587` | `GET /api/tarifas` exige `requireN8nOrAdmin`; es la unica de las dieciseis operaciones con ese middleware. |
| `../docs/ROADMAP_FRONTEND.md:607` | Estas rutas no emiten `Cache-Control: no-store`, a diferencia del dashboard. |
| `../docs/ROADMAP_FRONTEND.md:623-624` | Exige el aviso de importe aproximado, no precio garantizado. |
| `../backend/specs/11-tarifario-dashboard.md` seccion 3.3 | Contrato del recurso de tarifas: DTO, esquemas, estados de error y permisos. |
| `../backend/src/app.ts:30` y `../backend/src/modules/tarifario/tarifario.router.ts:13-16` | Rutas montadas `GET`, `POST` y `PATCH /api/tarifas` con sus middlewares. |
| `../backend/src/modules/tarifario/tarifario.service.ts:5-6,28-35,40-47` | Zona `America/La_Paz`, filtro de vigencia y eliminados, `toFixed(2)` y orden `descripcion ASC, id ASC`. |
| `../backend/src/modules/tarifario/tarifario.schema.ts:18-21` | `actualizarTarifaSchema` es `.strict()` y no incluye `vigenciaDesde`. |
| `../backend/src/middlewares/error-handler.ts:18,24` y `../backend/src/middlewares/auth.ts:20-21` | Mensajes exactos de 400, 500, 401 y 403. |
| `../backend/src/modules/tarifario/tarifario.controller.ts:6` | Mensaje 404 `Tarifa no encontrada`. |
| `../docs/REGLAS_DE_NEGOCIO.md:21` | Regla 14 literal: la IA nunca calcula ni inventa tarifas, siempre consulta el tarifario oficial. |
| `../docs/MODELO_DE_DATOS.md:157,163` | La IA solo consulta el tarifario; el monto se almacena como `Decimal(10,2)`, nunca `Float`. |
| `references/pantallas/tarifas.html` | Contenedor del prototipo; el contenido del listado y del dialogo se genera en `app.js`. |
| `references/pantallas/app.js:151,212,267` | Listado, dialogo, `input type="number"` con `Number()` y `toFixed(2)`. |
| `src/api/types.ts:77-82` | `Tarifa` central con `id`, `descripcion`, `monto: string` y `vigenciaDesde: string`. |
| `src/router.tsx:29` y `src/components/Layout.tsx:82` | Ruta protegida `/tarifas` y entrada de menu con icono `wallet` ya registradas. |
| `src/api/client.ts` | `ApiError` con `status` y `message`, `apiFetch`, evento global 401 y conservacion del 403. |
| `src/lib/configuracion.ts:9` y `src/lib/solicitudes.ts:4` | Convencion de claves `as const` en `src/lib/`. |
| `src/lib/configuracionForm.ts` y `src/pages/Configuracion.tsx` | Patron de formulario RHF + Zod, bloqueo de envios y bandas de resultado. |
| `src/lib/conductorQueries.ts:1-15` | `filtroEscrituraConductor` como patron de bloqueo de mutaciones. |
| `src/pages/Conductores/Detalle.tsx:395-439` | Dialog de Radix con foco inicial y de retorno, `Dialog.Title` y `Dialog.Description`. |
| `src/pages/Solicitudes.tsx` y `src/lib/solicitudes.ts` | Patron de polling de 15 s, `useIsFetching` y guardas de solapamiento. |
| `tests/browser/spec06.browser.js`, `spec08`, `spec09` | Convencion de escenarios de navegador con API interceptada. |
| `specs/01-fundacion-y-contratos.md:326` | La clave `['tarifas']` ya esta reservada y no tiene helper. |

### Discrepancias que no deben copiarse

1. El prototipo usa `input type="number"` con `Number()` y `toFixed(2)` (`references/pantallas/app.js:212,267`). Es incompatible con la regex del backend: un input numerico puede emitir notacion exponencial o coma decimal, y el servidor responde 400. La especificacion lo reemplaza por `type="text"` con `inputmode="decimal"`.
2. El prototipo permite editar `vigencia_desde` dentro del dialogo. El `PATCH` es estricto y rechaza ese campo con 400. La especificacion lo vuelve de solo lectura durante la edicion.
3. El prototipo tiene una columna `Estado` con badges `Vigente` en verde y `Programada` en ambar. El backend oculta toda tarifa con `vigenciaDesde` futura, de modo que `Programada` es inalcanzable desde esta pantalla. La especificacion elimina la columna.
4. El prototipo no tiene aviso de importe aproximado, pero el roadmap si lo exige (`../docs/ROADMAP_FRONTEND.md:623-624`) y la Regla 14 lo sustenta. La especificacion lo anade.
5. `../docs/ROADMAP_ENDPOINTS.md` numera las rutas de tarifas como 25 y 26, no 14, 15 y 16. La numeracion 14-16 pertenece a `../docs/ROADMAP_FRONTEND.md`. Prevalece el contrato de la spec del backend.
6. El subtitulo del stub actual dice "Valores fijos vigentes" y el del prototipo es distinto. La especificacion define el texto final en la seccion de alcance.

## Alcance

### Dentro de alcance

- Sustituir por completo el stub de `src/pages/Tarifas.tsx`, conservando la ruta `/tarifas`.
- Consumir exclusivamente `GET /api/tarifas` para los datos de esta pantalla, sin query string.
- Importar `Tarifa` desde `src/api/types.ts:77-82` sin duplicar el DTO.
- Presentar en tabla las cuatro columnas del prototipo menos `Estado`: descripcion, monto, vigencia desde y acciones.
- Crear tarifas con `POST /api/tarifas` exigiendo descripcion, monto y vigencia desde.
- Editar tarifas con `PATCH /api/tarifas/:id` enviando unicamente descripcion y monto.
- Replicar en Zod la misma regex de monto y el mismo formato de fecha que aplica el backend.
- Distinguir carga inicial, respuesta vacia, error inicial, fallo con datos previos y error de escritura.
- Mostrar el aviso azul de que el asistente consulta el tarifario y de que las tarifas son fijas.
- Mostrar el aviso de que el monto informado es aproximado y no un precio garantizado.
- Cumplir los requisitos de accesibilidad y de comportamiento en movil descritos mas abajo.
- Invalidar la clave `['tarifas']` tras cada alta o edicion correcta.

### Decisiones de UX aprobadas

D1-D9 fueron aprobadas expresamente por el usuario antes de redactar este documento.
Sus criterios y pasos son obligatorios para la implementacion futura.

| ID | Tema | Decision aprobada | Alternativa descartada y motivo |
|---|---|---|---|
| D1 | Forma del formulario | Un unico dialogo de Radix que sirve para alta y edicion, cambiando solo el titulo, el texto del boton y el valor inicial de los campos. | Panel inline como `Configuracion.tsx`: el prototipo usa `<dialog>`, `Conductores/Detalle.tsx:395-439` ya usa Radix Dialog con foco inicial y de retorno, y un solo formulario evita duplicar validaciones. |
| D2 | Captura de `monto` | `input type="text"` con `inputmode="decimal"`, validado con la misma regex del backend replicada en Zod y enviado como string. | `type="number"` como el prototipo: puede producir notacion exponencial o coma decimal, el backend rechaza ambos con 400, y la regex evita cualquier conversion numerica y redondeo. |
| D3 | Columna de estado | No existe columna de estado. Cada fila listada esta vigente por garantia del backend. | Incluirla siempre en verde: el badge tendria un unico valor posible y sugeriria un estado que la pantalla nunca muestra. |
| D4 | Vigencia en edicion | `vigenciaDesde` visible y de solo lectura al editar, con una nota que explica que no se cambia desde aqui. | Ocultarlo por completo en edicion: el administrador ve la vigencia vigente sin volver a la tabla y la nota evita que el campo desaparezca sin explicacion. |
| D5 | Refresco | Polling de 15 s, pausado mientras el dialogo esta abierto. | Sin polling, que es lo que sugeria el roadmap sin pedirlo, y polling siempre activo que cerraria el dialogo si cambia la fila: se busca consistencia con SPEC 08 y SPEC 09, pero una lectura que llega con el formulario abierto no debe descartar lo escrito y el `PATCH` de solo `descripcion` y `monto` no depende de la fila mostrada. |
| D6 | Bloqueo de envios | `isSubmitting`, `<fieldset disabled>` y guarda sincrona contra doble clic o Enter repetido. | Solo deshabilitar el boton: es el patron ya probado en `src/pages/Configuracion.tsx`. |
| D7 | Aviso de monto aproximado | Linea bajo la tabla que aclara que el monto es aproximado y no un precio garantizado. | Sin aviso: el roadmap lo pide y la Regla 14 establece que la IA solo cita el tarifario oficial; es un texto neutral de una linea que el administrador nunca edita desde aqui. |
| D8 | Controles de consulta | Sin busqueda, sin filtros y sin ordenacion local. La fila respeta el orden que entrega el backend. | Busqueda por descripcion como en Solicitudes: el roadmap solo pide descripcion, monto y vigencia, el backend ya ordena por `descripcion ASC, id ASC` y no pagina. |
| D9 | Lectura sin permiso | El 403 se muestra con el mensaje del backend y no cierra sesion. | No anadir logica porque el cliente ya la tiene: el `GET` usa `requireN8nOrAdmin` y es alcanzable con un token de rol `conductor`, asi que merece un texto propio y verificable, coherente con U01 de SPEC 09. |

### Textos exactos de la interfaz

Estos textos son parte del criterio de aceptacion: la implementacion los usa literalmente y las pruebas de navegador los localizan por texto exacto. No se parafrasean, no se traducen y no se reescriben durante la implementacion. Si el proyecto tiene ya un componente de boton o de aviso, se reutiliza conservando estas cadenas.

| Elemento | Texto exacto | Notas de uso |
|---|---|---|
| Titulo de pagina (`h1`) | `Tarifas` | Unico `h1` de la pantalla. |
| Subtitulo de pagina | `Administra los valores oficiales que se informan a los pasajeros.` | Sustituye al subtitulo del stub, "Valores fijos vigentes. Fuente: `GET /api/tarifas`." |
| Boton de alta | `Nueva tarifa` | Unico en la pantalla. Abre el dialogo en modo alta con `vigenciaDesde` en hoy. |
| Boton de editar por fila | `Editar` | Con `aria-label` que incluya la descripcion, por ejemplo `Editar Tarifa base diurna`. |
| Titulo del panel | `Tarifario de la empresa` | `h2` sobre la tabla. |
| Subtitulo del panel | `{N} tarifas vigentes · Montos en bolivianos (Bs)` | `{N}` es el numero de filas recibidas, sin filtrar. Con cero filas se muestra `0 tarifas vigentes · Montos en bolivianos (Bs)`. |
| Pastilla del panel | `Valores fijos` | Decorativa, no interactiva. |
| Columna 1 | `Descripcion` | |
| Columna 2 | `Monto` | |
| Columna 3 | `Vigencia desde` | |
| Columna 4 | `Acciones` | Sustituye a la columna `Estado` del prototipo (D3). |
| Aviso azul (asistente y fijas) | `El asistente consulta este tarifario para responder a los pasajeros. Las tarifas son fijas; no se calculan automaticamente por kilometro.` | Banner informativo con `role="status"`, debajo del panel y encima de la tabla. Es el texto del prototipo, conservado. |
| Aviso de monto aproximado | `El monto informado es aproximado y no es un precio garantizado. El asistente solo cita estos valores del tarifario oficial.` | Banner informativo con `role="status"`, debajo de la tabla. Texto neutral que apoya la Regla 14 (D7). El administrador nunca lo edita desde aqui. |
| Titulo del dialogo en alta | `Nueva tarifa` | `Dialog.Title`. |
| Titulo del dialogo en edicion | `Editar tarifa` | `Dialog.Title`. |
| Descripcion del dialogo | `Define un valor fijo del tarifario oficial.` | `Dialog.Description`. Igual en alta y en edicion. |
| Etiqueta campo descripcion | `Descripcion` | |
| Placeholder descripcion | `Ej. Tarifa base diurna` | |
| Texto de ayuda descripcion | `Entre 1 y 255 caracteres.` | Refleja `z.string().trim().min(1).max(255)`. |
| Etiqueta campo monto | `Monto en bolivianos` | |
| Placeholder monto | `0.00` | Con `inputmode="decimal"` y `type="text"` (D2). Sufijo visual `Bs`. |
| Texto de ayuda monto | `Dos decimales exactos, sin comas ni signo. El minimo es 0.01 y el maximo 99999999.99.` | Explica el formato antes de que el administrador falle, sin convertir el campo a numero. |
| Etiqueta campo vigencia (alta) | `Vigencia desde` | `type="date"`, valor por defecto hoy. |
| Etiqueta campo vigencia (edicion) | `Vigencia desde` | Visible y de solo lectura (D4). |
| Nota de vigencia inmutable | `La vigencia no se puede cambiar desde aqui.` | Solo en edicion, junto al campo deshabilitado. |
| Boton cancelar | `Cancelar` | Cierra sin escribir. |
| Boton de envio en alta | `Agregar tarifa` | |
| Boton de envio en edicion | `Guardar cambios` | Habilitado solo si hay diferencias efectivas (D6). |
| Texto de exito en alta | `Tarifa agregada.` | Banner `role="status"`. Sustituye al toast del prototipo. |
| Texto de exito en edicion | `Cambios guardados.` | Banner `role="status"`. Mismo criterio que `Configuracion.tsx`. |
| Estado vacio | `No hay tarifas vigentes` | Distinguible del error. |
| Ayuda del estado vacio | `Registra la primera tarifa con el boton Nueva tarifa.` | Solo cuando el GET devuelve `200 []`. |
| Titulo del error de lectura | `No se pudieron cargar las tarifas` | |
| Boton de reintento | `Reintentar` | Solo en error inicial. En error con datos previos tambien, sobre el aviso de desactualizacion. |
| Aviso de datos desactualizados | `No se pudieron actualizar las tarifas. Se muestran los ultimos datos cargados.` | `role="status"`, nunca `role="alert"`, porque hay contenido util en pantalla. |
| Texto de 403 en lectura | `Tu usuario no tiene permiso para consultar las tarifas.` | Sin cierre de sesion (D9). El mensaje del backend se muestra aparte cuando exista. |

Formato del monto: el backend ya entrega `monto` como string canonico de dos decimales, por ejemplo `"15.00"`. La celda lo muestra **tal cual** con el sufijo `Bs` visible en el prototipo, es decir `15.00 Bs`. No se parsea a numero, no se agrupan miles con separador y no se usa `toFixed`, porque cualquier conversion puede producir notacion exponencial o una coma y el backend rechazaria el valor. Un `monto` que no cumpla el formato canonico se muestra con el texto de reserva `Monto no disponible` en lugar de intentar repararlo.

Los textos de los errores de validacion de campo los define `src/lib/tarifasForm.ts` en un objeto de mensajes, siguiendo `MENSAJES` de `configuracionForm.ts:25-31`. Los que deben existir como minimo son: descripcion vacia, descripcion larga, monto vacio, monto con formato invalido, monto por debajo del minimo, monto por encima del maximo y fecha invalida.

### Fuera de alcance

- Borrar tarifas, restaurarlas, duplicarlas o gestionarlas por historial.
- Versionado, vigencia multiple, precios por kilometro, recargos, turno o zona.
- Cambiar `vigenciaDesde` por `PATCH` o desde el navegador.
- Busqueda, filtros, ordenacion local o paginacion de tarifas.
- Mapa, geolocalizacion, rutas o datos que el recurso no publica.
- Realtime, WebSockets y cambios del modulo 11.
- Editar tarifas desde la IA o desde n8n.
- Tocar el backend, el modelo de datos, `Decimal(10,2)` o la Regla 14.
- Cambiar `src/router.tsx`, `src/components/Layout.tsx` o el shell.
- Cambiar `src/api/types.ts` o `src/api/client.ts`.
- Agregar dependencias, claves `as const` nuevas fuera de `src/lib/` o CSS global.
- Resolver errores preexistentes de otros modulos o cerrar INT01, INT03, INT04, INT05, INT06, INT07, INT08 o INT09.
- Implementar codigo en la entrega de este documento.

## Modelo de datos y contratos

No se introduce ninguna entidad persistente ni DTO nuevo.
Se reutiliza `Tarifa` de `src/api/types.ts:77-82` tal cual, con sus cuatro campos exactos.

### Lectura

`GET /api/tarifas` devuelve `Tarifa[]` directamente, sin envoltorio.
Una respuesta correcta sin tarifas es `200 []`.
Requiere Bearer y el middleware `requireN8nOrAdmin`: un token de rol `conductor` recibe 403.
Estas rutas no emiten `Cache-Control: no-store`; esa diferencia con el dashboard no autoriza a suponer cache propia.

| Campo | Tipo publicado | Presentacion prevista |
|---|---|---|
| `id` | `string` UUID | No se presenta. Clave estable de fila, de tarjeta y de payload de edicion. |
| `descripcion` | `string` | Columna Descripcion, texto completo con ajuste de linea. |
| `monto` | `string` | Columna Monto, tal cual lo entrega el backend con sufijo `Bs`. Nunca se reformatea ni se parsea. |
| `vigenciaDesde` | `string` `YYYY-MM-DD` | Columna Vigencia desde como fecha de calendario en `es-BO`. Nunca se presenta como instante. |

El DTO tiene cuatro campos exactos: no existen `creadoEn` ni `eliminadoEn` en la respuesta.
El servicio filtra `eliminadoEn: null` y ordena por `descripcion ASC, id ASC`.
El servicio ademas descarta toda tarifa cuya `vigenciaDesde` sea posterior al inicio del dia siguiente en `America/La_Paz` (`DESPLAZAMIENTO_LA_PAZ_MS = 4h`).
Consecuencia directa: **una tarifa con fecha futura no se lista y no se puede ver ni editar desde esta pantalla.**

### Escrituras

| Operacion | Metodo y ruta | Campos admitidos | Respuesta |
|---|---|---|---|
| Alta | `POST /api/tarifas` | `descripcion`, `monto`, `vigenciaDesde`, los tres obligatorios | `201` con la tarifa creada |
| Edicion | `PATCH /api/tarifas/:id` | Solo `descripcion` y `monto`, ambos opcionales y por separado | Tarifa actualizada |

`POST` exige `requireAdmin`. `PATCH` exige `requireAdmin` y su esquema es `.strict()`, por lo que enviar `{}` o incluir `vigenciaDesde` produce 400.
No hay respuesta 409 en este modulo. Ese caso no se inventa ni se maneja.
`monto` es string en la entrada y en la salida; el servicio lo normaliza con `toFixed(2)`.
`vigenciaDesde` es siempre `"YYYY-MM-DD"` a medianoche UTC, nunca un datetime.
Cualquier query string en el `GET` produce 400 porque el esquema de consulta es un objeto vacio estricto.

### Esquemas que se replican en el cliente

```ts
const descripcionSchema = z.string().trim().min(1).max(255);
const montoSchema = z.string().regex(/^(?:0|[1-9][0-9]{0,7})\.[0-9]{2}$/)
  .refine((value) => value !== "0.00" && value === value.trim());
const vigenciaDesdeSchema = z.iso.date();
```

`monto` rechaza `"5"`, `"5.0"`, `"5.000"`, `" 5.00"`, `"5.00 "`, `"-1.00"`, `"05.00"`, `"0.00"`, `"1e5"`, `"1,50"` y cualquier numero JSON.
El minimo real es `0.01` y el maximo es `99999999.99`. No se redondea ni se normaliza antes de enviar.
`vigenciaDesde` rechaza datetime; solo admite `YYYY-MM-DD`.

### Tipos de payload del formulario

Son tipos del formulario, no DTO de servidor, y viven en `src/lib/tarifasForm.ts`.

- `PayloadCrearTarifa` contiene `descripcion`, `monto` y `vigenciaDesde`.
- `PayloadEditarTarifa` contiene `descripcion` y `monto` como unicos campos admitidos.
- **Regla dura:** `PayloadEditarTarifa` nunca incluye `vigenciaDesde`, en ninguna rama del formulario ni del payload construido.

### Invariantes

- `monto` siempre es string canonico de dos decimales. Nunca es un numero en el cliente.
- No hay conversion numerica, parseo ni redondeo de `monto` en ninguna parte del camino del navegador.
- El `PATCH` envia solo las claves con diferencias efectivas respecto de la fila mostrada. Si no hay cambios, no se emite la peticion.
- La clave de consulta es `['tarifas']`, ya reservada en `specs/01-fundacion-y-contratos.md:326`.
- Una lectura correcta posterior reemplaza el conjunto anterior; no se conserva como vigente una tarifa ausente de la respuesta.
- No hay actualizacion optimista. La tabla refleja la ultima lectura confirmada.

### Formateo de presentacion

- `monto` se muestra tal cual lo entrega el backend, con sufijo `Bs`. No se reformatea, no se agrupa y no se redondea.
- `vigenciaDesde` se presenta como fecha de calendario en `es-BO`, sin hora ni zona. No se convierte a `Date` ni se le aplica desplazamiento.
- El campo de formulario de `vigenciaDesde` es `type="date"`, con hoy como valor por defecto en el alta.
- El subtitulo del panel muestra el numero de tarifas recibidas con el texto `{N} tarifas vigentes · Montos en bolivianos (Bs)`.
- Un valor no interpretable se muestra con un texto de reserva propio, nunca con una fecha inventada.

### Mensajes del backend

| Situacion | Mensaje literal | Fuente |
|---|---|---|
| 400 de entrada invalida | `Entrada invalida` | `../backend/src/middlewares/error-handler.ts:18` |
| 401 | `Credenciales invalidas` | `../backend/src/middlewares/auth.ts:20` |
| 403 | `Permiso denegado` | `../backend/src/middlewares/auth.ts:21` |
| 404 en edicion | `Tarifa no encontrada` | `../backend/src/modules/tarifario/tarifario.controller.ts:6` |
| 500 | `Error interno del servidor` | `../backend/src/middlewares/error-handler.ts:24` |
| 404 de ruta inexistente | `Ruta inexistente` | Enrutador global |

El formato de error es `{ error: { code, message } }`. La UI clasifica por `ApiError.status` y muestra `message`, nunca parseando texto.

## Verificaciones estaticas previas (2026-10-05)

Estas comprobaciones permiten cerrar la definicion. No certifican cambios que aun no existen.

| Punto | Evidencia inspeccionada | Conclusion y limite |
|---|---|---|
| a. Esquema Zod real del backend | `../backend/src/modules/tarifario/tarifario.schema.ts` define `descripcionSchema` como `z.string().trim().min(1).max(255)`, `montoSchema` como la regex `/^(?:0\|[1-9][0-9]{0,7})\.[0-9]{2}$/` mas el refinamiento que excluye `"0.00"` y exige `value === value.trim()`, y `vigenciaDesdeSchema` como `z.iso.date()`. `actualizarTarifaSchema` es `.strict()` y contiene solo `descripcion` y `monto`. `tarifaQuerySchema` es `z.object({}).strict()`. | La regex se replica literalmente en el cliente, sin ampliarla ni simplificarla. El limite es que se replico la lectura del archivo, no su comportamiento en ejecucion: la unica prueba real de que coinciden es comparar casos contra el backend. |
| b. Mensajes exactos de error | `../backend/src/middlewares/error-handler.ts:18` produce `Entrada invalida`, la linea 24 produce `Error interno del servidor`; `../backend/src/middlewares/auth.ts:20-21` produce `Credenciales invalidas` y `Permiso denegado`; `tarifario.controller.ts:6` produce `Tarifa no encontrada`. El formato es `{ error: { code, message } }`. | Los textos que se muestran al usuario salen del backend cuando existen. La UI no reconstruye el mensaje a partir del status, y `ApiError` no expone `code`, por lo que ninguna logica puede depender de el. |
| c. Estado real del frontend | `src/pages/Tarifas.tsx` tiene diez lineas y solo un `h1` y un `p`. `src/api/types.ts:77-82` ya declara `Tarifa` con `id`, `descripcion`, `monto: string` y `vigenciaDesde: string`, exactamente los cuatro campos del DTO. | El stub se reemplaza completo y el tipo se reutiliza. No se declara un DTO nuevo ni se edita `src/api/types.ts`. No se ha escrito codigo del modulo, por lo que no hay nada que verificar en ejecucion. |
| d. Ruta y navegacion | `src/router.tsx:29` registra la ruta dentro de `ProtectedLayout`. `src/components/Layout.tsx:82` ya tiene la entrada con icono `wallet`. | No hay que registrar nada: ruta y menu se conservan intactos. El shell sigue haciendo su propia consulta de configuracion, que no forma parte de esta pantalla. |
| e. Patrones de formulario y de dialogo | `src/pages/Configuracion.tsx` con schema en `src/lib/configuracionForm.ts` usa `useForm({ resolver: zodResolver(esquema) })`, `register`, `aria-invalid`, `aria-describedby`, `<p role="alert">` por error de campo, `<fieldset disabled>` mas `aria-busy` e `isSubmitting`, guarda sincrona `enviadoRef` contra doble clic, banda `role="status"` de exito y `<Alert>` para fallo, clasificando por `ApiError.status`. `src/pages/Conductores/Detalle.tsx:395-439` usa `Dialog.Root`, `Dialog.Portal`, `Dialog.Overlay` y `Dialog.Content` con foco inicial y de retorno, `Dialog.Title` y `Dialog.Description`. | Los dos patrones existen y son compatibles con D1 y D6. El limite es que son referencias de estilo y estructura: replicarlos exige escribir el codigo y probarlo, y no se deduce de la lectura que el el dialogo se comporte bien a 320 px ni con zoom. |
| f. Patron de polling | `src/pages/Solicitudes.tsx` usa `useIsFetching` y guardas de solapamiento definidas en `src/lib/solicitudes.ts`. `src/main.tsx` monta con `StrictMode`, por lo que en desarrollo cada montaje puede emitir dos `GET`. | El polling de 15 s con pausa por dialogo sigue el mismo patron. Las pruebas no pueden fijar una multiplicidad exacta de peticiones: deben medir de forma relativa, como se registro en la evidencia de SPEC 09. |

No se ejecuto build, `tsc`, pruebas unitarias, escenarios de navegador ni peticiones al backend en esta fase.
Ninguna de estas filas certifica que el modulo funcione: certifican que el contrato, los tipos y los patrones de referencia estan donde se afirma.

## Puntos de integracion

| Pieza existente | Uso previsto en la implementacion |
|---|---|
| `src/api/types.ts` | Importar `Tarifa` desde `src/api/types.ts:77-82`. Sin cambios en el archivo. |
| `src/api/client.ts` | Usar `apiFetch` con el signal de la consulta y `http.post` / `http.patch` para las escrituras. `ApiError.status` es la unica base de clasificacion. El evento 401 y el 403 conservado ya estan resueltos: no se duplican. |
| `src/router.tsx` | Conservar la ruta `/tarifas:29`. No se registra ni se cambia ninguna ruta. |
| `src/components/Layout.tsx` | Conservar la entrada `Tarifas:82`. No se cambia el menu ni el shell. |
| `src/lib/` | Crear `src/lib/tarifas.ts` con la clave `CLAVE_TARIFAS` y helpers puros, y `src/lib/tarifasForm.ts` con los esquemas y los tipos de payload. Convencion de un archivo por dominio, como `configuracion.ts` mas `configuracionForm.ts`. |
| `src/pages/Conductores/Detalle.tsx` | Referencia del dialogo de Radix con `Dialog.Root`, `Portal`, `Overlay`, `Content`, `Title`, `Description` y foco inicial y de retorno. No se modifica. |
| `src/pages/Configuracion.tsx` | Referencia del formulario RHF + Zod, del bloqueo de envios y de las bandas de resultado. No se modifica. |
| `src/pages/Solicitudes.tsx` | Referencia del polling de 15 s con `useIsFetching` y pausa. No se modifica. |
| `src/lib/solicitudes.ts` | Referencia de las guardas contra solapamiento y reintento. No se modifica ni se importan sus helpers de otro dominio. |
| `src/lib/conductorQueries.ts` | `filtroEscrituraConductor:1-15` es el patron de bloqueo de mutaciones a replicar. No se modifica. |
| `src/components/ui/button.tsx` y `alert.tsx` | Reutilizar controles y avisos del sistema visual. |

La restriccion de una unica ruta de lectura se refiere a las consultas iniciadas por esta pantalla.
No prohibe el `GET` de configuracion que el shell ya realiza.

## Lectura, errores y sesion

| Situacion | Comportamiento |
|---|---|
| Primera lectura pendiente | Mensaje de carga. Sin filas ficticias ni contador cero antes de recibir datos. |
| Exito con `200 []` | Vacio legitimo: mensaje de que aun no hay tarifas registradas y el boton de alta disponible. No es un error y no ofrece Reintentar. |
| Exito con datos | Filas en el orden recibido, que es `descripcion ASC, id ASC`. |
| Fallo de la lectura inicial | Error con `role="alert"` y boton Reintentar. Sin tabla. |
| Red o `5xx` con datos previos | Conservar la ultima lectura completa y mostrar aviso `role="status"` de que los datos pueden estar desactualizados, con recuperacion manual. |
| `400` en lectura o escritura | Mostrar el mensaje del backend tal cual. Nunca parsear su texto para deducir la causa. |
| `401` | Reutilizar el cierre de sesion y la redireccion globales ya existentes. No se anade logica ni se intenta impedir el cierre. |
| `403` en lectura | Mostrar el mensaje del backend sin cerrar sesion (D9). Texto propio y distinguible de un error recuperable. |
| `403` en escritura | El alta y la edicion exigen `requireAdmin`. Mostrar el mensaje del backend sin cerrar sesion. |
| `404` en `PATCH` | Mostrar `Tarifa no encontrada`. El dialogo explica que la tarifa ya no existe y ofrece recargar la lista; no reintenta el envio. |
| Respuesta tardia de una sesion anterior | Se descarta con las protecciones existentes del cliente y de `AuthContext`, y no se anuncia como error de usuario. |
| Polling con el dialogo abierto | No se emite lectura periodica mientras hay un dialogo abierto (D5). El `PATCH` de solo `descripcion` y `monto` no depende de la fila mostrada, por lo que nada se descarta. |
| Refetch en curso | Conservar los datos anteriores; no volver al esqueleto. |

**No hay 409 en este modulo.** Ningun camino de esta pantalla trata un conflicto de version o una concurrencia optimista porque el contrato no lo publica y el cliente no lo envia.
Un 409 recibido en el futuro debe tratarse como error generico con el mensaje del backend, no como un caso de diseno.

Los errores se clasifican por `ApiError.status`, nunca analizando palabras del mensaje.
Se conserva como maximo un reintento automatico por fallo de red o `5xx`, nunca por `4xx`, igual que en SPEC 09.
No se persisten tarifas, formularios ni mensajes de error en almacenamiento del navegador.
No hay actualizacion optimista ni escrituras en claves de cache distintas de `['tarifas']`.

## Accesibilidad y movil

- Un unico `h1` (`Tarifas`) y controles nativos con nombres accesibles y foco visible.
- Tabla real con `<thead>`, `<th scope="col">` y celdas asociadas en escritorio.
- Tarjetas bajo el breakpoint que el proyecto ya usa en otras pantallas, con etiqueta visible de cada uno de los tres campos.
- Las dos representaciones no coexisten simultaneamente en el arbol accesible.
- El dialogo de Radix declara `Dialog.Title` y `Dialog.Description`, y tiene foco inicial en el primer campo y retorno del foco al elemento que lo abrio.
- `aria-invalid` y `aria-describedby` en cada campo con error, y `<p role="alert">` por error de campo.
- `role="status"` para el exito de una escritura y para los avisos no criticos; `role="alert"` para errores de lectura y de escritura.
- Al cerrarse el dialogo, el foco vuelve al elemento de origen; la tabla es el destino de foco para las lecturas reintentadas.
- El dialogo no debe tragerse la pagina: el contenido de fondo queda disponible para lectura tras cerrarse y el `ScrollLock` no altera el desplazamiento permanentemente.
- A 320 px no hay desbordamiento horizontal de pagina; los textos largos de descripcion se ajustan en varias lineas.
- Con zoom al 200 % el dialogo no se corta y sus acciones siguen siendo alcanzables.
- Iconos decorativos con `aria-hidden`; el estado de las tarifas se expresa en texto.
- Actualizar el listado por polling no anuncia toda la tabla como region viva ni mueve el foco.
- **Limite declarado:** si no se usa lector de pantalla ni telefono fisico, esa limitacion se registra expresamente en la evidencia de verificacion en lugar de darse por verificada. El zoom se ejercera con el mecanismo que declare esa evidencia.

## Archivos previstos

Esta es una prevision de impacto, no una lista de archivos implementados.
El unico archivo creado en esta entrega es esta especificacion.

| Archivo | Cambio previsto |
|---|---|
| `src/pages/Tarifas.tsx` | Reemplazo completo del stub: consulta, tabla y tarjetas, dialogo unico de alta y edicion, avisos, estados y controles. |
| `src/lib/tarifas.ts` | Nuevo: `CLAVE_TARIFAS` en `as const`, funciones de lectura contra `GET /api/tarifas`, guardas de solapamiento, pausa del polling con el dialogo abierto y formateo de presentacion sin parseo. |
| `src/lib/tarifasForm.ts` | Nuevo: esquemas Zod que replican la regex de monto, el rango de descripcion y el formato `YYYY-MM-DD`, mas `PayloadCrearTarifa` y `PayloadEditarTarifa`. |
| `src/lib/tarifas.test.ts` | Nuevo: unitarios de helpers, clave, pausa del polling y formato. |
| `src/lib/tarifasForm.test.ts` | Nuevo: unitarios de la regex, del formato de fecha y de la construccion del payload de `PATCH`. |
| `tests/browser/spec10.browser.js` | Nuevo: escenarios de navegador con API interceptada, siguiendo la convencion de `spec06`, `spec08` y `spec09`. |
| `specs/10-tarifario.md` | Esta definicion. En una implementacion futura se registraria evidencia real por criterio. |

**Archivos que NO se tocan:** `src/api/types.ts`, `src/api/client.ts`, `src/router.tsx`, `src/components/Layout.tsx`, cualquier archivo del backend y `package.json`.
Tampoco se modifican `src/context/AuthContext.tsx`, `src/App.tsx`, `src/main.tsx`, `src/index.css` ni specs anteriores.
No se agregan dependencias, ni CSS propio nuevo, ni hooks o componentes genericos para logica de una sola pantalla.
No se modifica el roadmap ni ningun indice en esta entrega.

## Plan de implementacion

La implementacion permanece pendiente. No ejecutar estos pasos durante la entrega documental.
Cada incremento debe dejar el sistema funcional y su verificacion asociada.
Si un incremento excede 30-50 lineas de cambio, dividirlo en pasos ejecutables mas pequenos.

1. Registrar la linea base antes de editar codigo: `npx tsc -b --force`, `npm run test:unit` y `npm run build`. Distinguir fallos heredados de los nuevos y no corregir otros modulos de forma implicita.
2. Crear `src/lib/tarifasForm.ts` con los tres esquemas que replican el backend y los dos tipos de payload, con la regla dura de que `PayloadEditarTarifa` no admite `vigenciaDesde`. Anadir `tarifasForm.test.ts` con todos los rechazos y aceptaciones de la regex, el rechazo de datetime y la construccion del payload de `PATCH` sin vigencia.
3. Crear `src/lib/tarifas.ts` con `CLAVE_TARIFAS` en `as const`, la lectura contra `GET /api/tarifas` sin query string, la guarda de solapamiento y la funcion que indica si el polling puede correr con el dialogo abierto. Anadir `tarifas.test.ts`.
4. Sustituir el stub de `src/pages/Tarifas.tsx` por la consulta con su signal, los estados de carga, error inicial y vacio legitimo, y el encabezado con el boton de alta. Verificar que el conteo mostrado coincide con la respuesta.
5. Renderizar la rejilla de cuatro columnas con el orden recibido, el monto tal cual con sufijo `Bs`, la fecha de calendario sin conversion y el boton Editar por fila. Verificar `200 []` como vacio y la coincidencia de orden con el backend.
6. Implementar el dialogo de alta: `Dialog.Root` a `Portal`, `Overlay` y `Content`, `Dialog.Title`, `Dialog.Description`, foco inicial en Descripcion y retorno del foco al boton de origen. Campos Descripcion, Monto con `type="text"` e `inputmode="decimal"`, y Vigencia desde con hoy por defecto. Confirmar que el `POST` sale con los tres campos como string.
7. Incorporar el patron de formulario de `Configuracion.tsx`: `zodResolver`, `register`, `aria-invalid`, `aria-describedby`, `<p role="alert">` por error, banda `role="status"` de exito y `<Alert>` para fallo, clasificado por `ApiError.status`.
8. Anadir `<fieldset disabled>`, `aria-busy`, `isSubmitting` y la guarda sincrona contra doble clic o Enter repetido (D6). Verificar que tres clics en un tick producen un unico `POST`.
9. Implementar el dialogo de edicion con los mismos componentes: precargar los valores de la fila, dejar `vigenciaDesde` de solo lectura con su nota (D4) y calcular el `PATCH` solo con las claves que cambiaron de forma efectiva. Confirmar que el `PATCH` nunca incluye `vigenciaDesde` y que sin cambios no sale peticion.
10. Incorporar los estados de error de escritura: `400` con el mensaje del backend, `404` con la explicacion de que la tarifa ya no existe y la opcion de recargar, `403` sin cierre de sesion y `500` con reintento manual. Verificar que el dialogo permanece abierto en cada fallo.
11. Incorporar el polling de 15 s con la pausa mientras el dialogo esta abierto (D5), la conservacion de la ultima lectura ante fallo de red o `5xx` con aviso de desactualizacion, y el `Reintentar` del error inicial. Verificar que ninguna lectura periodica llega con el formulario abierto.
12. Invalidar `['tarifas']` tras cada alta y edicion correctas, sin actualizacion optimista, y confirmar que la tabla no vuelve al esqueleto.
13. Anadir los dos avisos: el azul de que el asistente consulta el tarifario y que las tarifas son fijas, y la linea de monto aproximado bajo la tabla (D7).
14. Aplicar la version movil: tarjetas bajo el breakpoint del proyecto con los mismos campos, sin desbordamiento a 320 px y con el dialogo usable a zoom 200 %.
15. Escribir `tests/browser/spec10.browser.js` con la API interceptada antes de navegar, medicion de forma relativa por `StrictMode` y bloqueo de hosts externos.
16. Registrar evidencia por criterio y sus limites, sin atribuir mocks a integracion real, y dejar INT10 sin marcar.

Las pruebas acompanian los incrementos; no se dejan todas para el ultimo paso.
El ultimo paso es evidencia: documentar resultados y limites, no hacer un ajuste de estilo ni agregar funcionalidad fuera del alcance.

## Criterios de aceptacion

Las casillas marcadas corresponden a la evidencia local registrada el 2026-10-05 al final del documento, no a integracion real.
La aprobacion de D1-D9 y las verificaciones estaticas a-f por si solas no acreditan funcionamiento. C14 e INT10 siguen pendientes por depender del backend real autorizado.

### Confirmados por contrato y alcance

- [x] C01: `/tarifas` usa `Tarifa` de `src/api/types.ts:77-82` sin declarar un DTO de servidor duplicado.
- [x] C02: La pantalla consulta solo `GET /api/tarifas`, sin query string y con la clave `['tarifas']`.
- [x] C03: La rejilla tiene cuatro columnas: descripcion, monto, vigencia desde y acciones. No existe columna de estado ni badge `Programada` (D3).
- [x] C04: `monto` se muestra tal cual lo entrega el backend, con sufijo `Bs` y dos decimales, sin reformateo, parseo ni redondeo.
- [x] C05: El campo de captura de `monto` es `type="text"` con `inputmode="decimal"` y nunca un input numerico (D2).
- [x] C06: `vigenciaDesde` se presenta como fecha de calendario en `es-BO`, sin hora, sin zona y sin conversion a instante.
- [x] C07: El orden de las filas es el entregado por el backend, `descripcion ASC, id ASC`, sin ordenacion local.
- [x] C08: Una respuesta `200 []` se presenta como vacio legitimo, no como error, y no ofrece Reintentar.
- [x] C09: El alta envia `descripcion`, `monto` y `vigenciaDesde`, con `monto` como string, y responde 201.
- [x] C10: La edicion envia por `PATCH` solo `descripcion` y `monto`, y nunca `vigenciaDesde`; una edicion sin cambios no emite peticion.
- [x] C11: `vigenciaDesde` es de solo lectura durante la edicion y no hay ninguna via del navegador para cambiarlo.
- [x] C12: No hay coordenadas, importes calculados, precios por kilometro ni ningun dato que el recurso no publique.
- [x] C13: No existen controles de borrado, restauracion, duplicacion ni historial de tarifas.
- [ ] C14: El backend no expone una tarifa con vigencia futura a esta pantalla y el cliente no intenta deducirla ni anticiparla.

### UX y robustez aprobados

- [x] D1-A: El alta y la edicion comparten un unico dialogo de Radix que cambia titulo, texto del boton y valores iniciales, con `Dialog.Title` y `Dialog.Description`.
- [x] D2-A: La regex de monto del backend esta replicada literalmente en Zod y rechaza `"5"`, `"5.0"`, `"5.000"`, `" 5.00"`, `"5.00 "`, `"-1.00"`, `"05.00"`, `"0.00"`, `"1e5"`, `"1,50"` y cualquier numero; acepta `"0.01"` y `"99999999.99"`.
- [x] D3-A: No existe columna de estado ni ningun badge de vigencia en la rejilla.
- [x] D4-A: Al editar, `vigenciaDesde` se ve pero no se puede cambiar, con una nota que explica que no se modifica desde aqui.
- [x] D5-A: Hay polling de 15 s que se pausa mientras el dialogo esta abierto y se reanuda al cerrarlo, sin descartar lo escrito.
- [x] D6-A: Dos clics o dos pulsaciones de Enter sobre un formulario valido producen una unica peticion de escritura.
- [x] D7-A: Bajo la tabla aparece el aviso de que el monto es aproximado y no un precio garantizado, y el aviso de que el asistente consulta el tarifario y las tarifas son fijas.
- [x] D8-A: No hay busqueda, filtros, ordenacion local ni paginacion, y ningun control de la pantalla emite peticiones adicionales.
- [x] D9-A: Un 403 en lectura muestra el mensaje del backend con texto propio y verificable, y no cierra sesion.
- [x] T01: Cada texto de la seccion "Textos exactos de la interfaz" aparece literalmente en la pantalla correspondiente, sin parafrasis ni tradccion.
- [x] T02: El monto se muestra tal cual lo entrega el backend con el sufijo `Bs`, sin parseo, sin agrupacion de miles y sin redondeo; un valor no canonico muestra `Monto no disponible`.
- [x] T03: La celda de vigencia presenta la fecha de calendario en `es-BO` sin conversion a instante ni desplazamiento de zona.
- [x] T04: Una respuesta `200 []` muestra `No hay tarifas vigentes` con su ayuda, distinto del error de lectura.
- [x] T05: El error de lectura con datos previos se anuncia como aviso de desactualizacion y nunca como error critico.
- [x] U01: Un 401 mantiene el cierre de sesion y la redireccion existentes, sin logica duplicada ni nueva.
- [x] U02: Una respuesta tardia de una sesion anterior no se pinta en la actual y las cancelaciones no se anuncian como error.
- [x] U03: Un fallo de red o `5xx` con datos previos conserva la ultima lectura y muestra aviso de desactualizacion con recuperacion manual.
- [x] U04: Un 404 en `PATCH` muestra `Tarifa no encontrada`, explica que la tarifa ya no existe y ofrece recargar la lista.
- [x] U05: No se persisten tarifas, formularios, mensajes de error ni borradores en almacenamiento local.
- [x] U06: La pantalla no introduce regresiones en las pantallas existentes ni en los estados de otros modulos; los botones y avisos reutilizados conservan su comportamiento.
- [x] U07: La pantalla no altera el menu, el logout, el polling de Solicitudes ni los estados compartidos de los otros modulos.

### Verificacion y cierre

- [x] V01: `npm run test:unit` termina correctamente, con evidencia y sin atribuir mocks a integracion.
- [x] V02: `npm run build` termina correctamente. Si falla por otro modulo, registrar el bloqueo y dejar esta casilla sin marcar.
- [x] V03: Los escenarios de navegador se ejecutan con API interceptada y datos ficticios, sin trafico real accidental.
- [ ] INT10: `GET`, `POST` y `PATCH /api/tarifas` verificados contra backend real con administrador autorizado, incluyendo el 403 real de un token de rol `conductor`, el 404 de edicion, el 400 por `vigenciaDesde` y la ausencia de `Cache-Control: no-store`.

## Estrategia de verificacion

Seguir las SPEC 08 y 09: Vitest para helpers y navegador para render, interaccion y responsive.
No instalar dependencias para esta entrega.

| Grupo | Casos a verificar en la implementacion futura |
|---|---|
| Unitarios: regex de monto | Rechaza `"5"`, `"5.0"`, `"5.000"`, `" 5.00"`, `"5.00 "`, `"-1.00"`, `"05.00"`, `"0.00"`, `"1e5"`, `"1,50"` y el numero `5`. Acepta `"0.01"` y `"99999999.99"`. Casos con espacios externos, mas de ocho digitos enteros, tres decimales, signo mas y texto vacio. |
| Unitarios: descripcion | Rechaza cadena vacia, solo espacios, mas de 255 caracteres; acepta 255 y aplica el recorte externo del backend. |
| Unitarios: fecha | Acepta `"YYYY-MM-DD"` valido. Rechaza datetime con hora, con zona, con separador distinto y fechas imposibles como mes 13 o dia 32. |
| Unitarios: payload de `PATCH` | Nunca incluye `vigenciaDesde`; un objeto vacio se bloquea antes de enviar; con un solo campo cambiado sale exactamente una clave; sin cambios no se construye peticion. |
| Unitarios: helpers de lectura | Clave exacta `['tarifas']`, sin query string, guarda de solapamiento, condicion de pausa del polling con el dialogo abierto y formato de monto y fecha sin parseo numerico. |
| Navegador: lectura y orden | Varias filas con `descripcion` repetida para comprobar `descripcion ASC, id ASC`, montos con ceros a la izquierda en la cadena, descripcion larga y su ajuste de linea. |
| Navegador: vacio | `200 []` muestra vacio legitimo, sin error, sin Reintentar y con el boton de alta disponible. |
| Navegador: alta | Alta correcta sin recarga manual de pagina, con fila nueva en su posicion de orden y foco devuelto al elemento de origen. |
| Navegador: edicion | Edicion correcta sin recarga, con la fila actualizada segun el orden que devuelve el servidor. |
| Navegador: `PATCH` minimo | Editar un solo campo emite solo esa clave; cambiar descripcion y monto emite las dos; `vigenciaDesde` nunca aparece en el cuerpo. |
| Navegador: fecha inmutable | El campo de vigencia no es editable en edicion y su valor no cambia aunque se intente. |
| Navegador: errores | 400 del backend visible con su mensaje; 404 en `PATCH` con su explicacion y recarga; 403 sin cierre de sesion; 401 con cierre de sesion y redireccion; 500 con reintento manual. |
| Navegador: polling | Ciclo de 15 s medido de forma relativa, pausa con el dialogo abierto, reanudacion al cerrarlo, tres clics en un tick equivalentes a una lectura y refetch sin esqueleto. |
| Navegador: degradado | Fallo de red y 5xx con y sin datos previos, offline con y sin datos, recuperacion manual que conserva la ultima lectura y una lectura tardia de sesion anterior que no se pinta. |
| Navegador: envios | Doble clic y Enter repetido bloqueados en alta y en edicion; `<fieldset disabled>` durante el envio; doble envio imposible tras respuesta lenta. |
| Navegador: foco y teclado | Foco inicial en Descripcion, `Escape` cierra y devuelve el foco al boton de origen, la tabla es el destino de foco al cerrarse, navegacion por teclado completa y foco visible. |
| Navegador: responsive | 320, 768, 1024 y 1280 px sin desbordamiento horizontal; tarjetas con los tres campos bajo el breakpoint; zoom 200 % sin cortar el dialogo. |
| Navegador: sin escrituras | Durante toda la lectura y el polling no se emite ninguna peticion a `POST` ni a `PATCH`. |
| Regresion | Menu, ruta `/tarifas`, logout y polling de Solicitudes sin alteraciones. Los badges compartidos de Conductores intactos. |
| Integracion INT10 | Backend real autorizado: Bearer admin, 403 real de conductor, DTO de cuatro campos, orden, ocultamiento de vigencias futuras, 201 y PATCH parcial, 400 por `vigenciaDesde` y ausencia de `Cache-Control: no-store`. No acreditar reglas del servidor solo con mocks. |

Interceptar todas las rutas API antes de navegar, incluidas login y la configuracion que pide el shell.
Usar datos ficticios y no agregar mocks al codigo de produccion.
Cerrar contextos e interceptores al terminar.
Los montos semilla del prototipo (`10.00`, `15.00`, `30.00`) son ficticios y no son un fallback permitido en el codigo.
No fijar multiplicidad exacta de peticiones: `StrictMode` duplica el montaje en desarrollo y la medicion es relativa.
No crear cuentas, seeds ni migraciones para desbloquear las pruebas.
Registrar evidencia saneada sin tokens, credenciales ni informacion personal.

INT10 requiere autorizacion especifica de entorno y cuenta antes de hacer peticiones reales.
INT01, INT03, INT04, INT05, INT06, INT07, INT08 e INT09 conservan su estado documental; esta spec no los cierra.

## Decisiones establecidas y alternativas

### Confirmadas por fuentes existentes

- Si: el backend es la unica autoridad del tarifario y de la vigencia de cada tarifa.
- Si: reutilizar `Tarifa` de `src/api/types.ts`, la clave reservada `['tarifas']` y un `GET` sin parametros.
- Si: conservar ruta y entrada de menu ya registradas.
- Si: replicar literalmente la regex de monto y el formato `YYYY-MM-DD` del backend, sin ampliarlos.
- Si: enviar `monto` como string en la entrada y no parsear nunca el valor recibido.
- No: convertir `vigenciaDesde` a `Date`, ni aplicar el desplazamiento de `America/La_Paz` a una fecha de calendario.
- No: calcular importes por kilometro, por zona, por turno, ni derivar una tarifa que el servidor no publico.
- No: leer la base de datos, otros endpoints ni datos que el recurso no expone.
- No: inventar numeros de tarifa, identificadores cortos ni coordenadas.

### Aprobadas en esta revision

| ID | Decision | Alternativa descartada | Motivo |
|---|---|---|---|
| D1 | Formulario en un unico modal de Radix Dialog. | Panel inline como `Configuracion.tsx`. | El prototipo usa `<dialog>`, `Conductores/Detalle.tsx:395-439` ya resuelve foco inicial y de retorno, y un solo formulario cubre el alta y la edicion sin duplicar validaciones. |
| D2 | `monto` con `type="text"` e `inputmode="decimal"`, validado con la regex replicada. | `type="number"` como el prototipo. | El input numerico puede emitir notacion exponencial o coma decimal, el backend responde 400, y la regex evita toda conversion y todo redondeo. |
| D3 | Sin columna de estado. | Incluirla siempre en verde. | El backend garantiza que toda fila listada esta vigente: el badge tendria un unico valor posible y sugeriria un estado que la pantalla nunca muestra. |
| D4 | `vigenciaDesde` visible pero de solo lectura al editar. | Ocultarlo por completo en edicion. | El admin ve la vigencia vigente sin volver a la tabla y la nota explica por que no puede cambiarse, en vez de que el campo desaparezca sin explicacion. |
| D5 | Polling de 15 s pausado con el dialogo abierto. | Sin polling, o polling siempre activo que cierra el dialogo si cambia la fila. | Se busca consistencia con SPEC 08 y SPEC 09, pero una lectura que llega con el formulario abierto no debe descartar lo escrito y el `PATCH` no depende de la fila mostrada. |
| D6 | `isSubmitting`, `<fieldset disabled>` y guarda sincrona. | Solo deshabilitar el boton. | Es el patron ya probado en `Configuracion.tsx`, que cubre el Enter repetido ademas del doble clic. |
| D7 | Aviso de monto aproximado bajo la tabla. | Sin aviso. | El roadmap lo exige en `ROADMAP_FRONTEND.md:623-624` y la Regla 14 establece que la IA solo cita el tarifario oficial. El texto es neutral y no lo edita el administrador. |
| D8 | Sin busqueda, filtros ni ordenacion local. | Busqueda por descripcion como en Solicitudes. | El roadmap solo pide descripcion, monto y vigencia; el backend ya ordena y no pagina. |
| D9 | El 403 en lectura se muestra con el mensaje del backend sin cerrar sesion. | No anadir logica porque el cliente ya la tiene. | El `GET` usa `requireN8nOrAdmin` y es alcanzable con rol `conductor`, asi que merece un texto propio y verificable, coherente con U01 de SPEC 09. |

### Apartarse del prototipo

| # | Desviacion | Motivo |
|---|---|---|
| 1 | `type="text"` con `inputmode="decimal"` en lugar de `input type="number"` con `Number()` y `toFixed(2)`. | Incompatible con la regex del backend; el input numerico puede emitir notacion exponencial o coma decimal y el servidor responde 400. |
| 2 | `vigenciaDesde` de solo lectura en edicion. | El `PATCH` es estricto y rechaza ese campo con 400. |
| 3 | Se elimina la columna `Estado` y sus badges `Vigente` y `Programada`. | El backend oculta toda tarifa con vigencia futura, de modo que `Programada` es inalcanzable desde esta pantalla. |
| 4 | Se anade el aviso de monto aproximado, ausente en el prototipo. | `ROADMAP_FRONTEND.md:623-624` lo exige y se apoya en la Regla 14. |
| 5 | Prevalece la numeracion de rutas del contrato de la spec del backend sobre la de `ROADMAP_ENDPOINTS.md`. | `ROADMAP_ENDPOINTS.md` numera estas rutas como 25 y 26; la numeracion 14-16 pertenece a `ROADMAP_FRONTEND.md`. El contrato manda. |
| 6 | El subtitulo final es el definido en esta especificacion. | El del stub y el del prototipo difieren; esta spec fija el texto final. |

### El 409 no se trata

El modulo no publica un 409 en ninguna de sus tres operaciones y el cliente no envia version ni `If-Match`.
Disenar un caso de conflicto de version seria inventar un requisito del contrato y abrir una pantalla que el backend no puede satisfacer.
La consecuencia asumida es deliberada: si dos administradores editan la misma tarifa a la vez, el ultimo `PATCH` que llegue gana, y no hay deteccion. Se acepta como limite conocido, no como error de diseno.

La autorizacion actual cubre solo este documento. Implementar y verificar siguen pendientes.

## Riesgos

| Riesgo | Mitigacion o limite |
|---|---|
| El input numerico del navegador rompe la regex y produce 400. | D2: `type="text"` con `inputmode="decimal"` y la misma regex en Zod; prueba unitaria con `"1e5"`, `"1,50"` y el numero `5`. |
| Un `PATCH` con `vigenciaDesde` produce 400. | `PayloadEditarTarifa` sin ese campo, D4 con el campo de solo lectura, y escenario de navegador que inspecciona el cuerpo enviado. |
| Una lectura de polling pisa lo que el administrador esta escribiendo. | D5: la pausa con el dialogo abierto; ademas el `PATCH` de solo `descripcion` y `monto` no depende de la fila mostrada. |
| Alguien parsea `monto` a numero para formatearlo. | El tipo es `string` y el valor se muestra tal cual con sufijo `Bs`; no hay `Number()`, `parseFloat` ni `toFixed` en el camino del navegador. |
| Una conversion de zona horaria convierte la fecha de calendario en un instante desplazado. | `vigenciaDesde` se formatea como fecha de calendario en `es-BO`, sin `new Date()` con desplazamiento ni hora visible; prueba unitaria con el mismo valor en dias distintos. |
| Un token de rol `conductor` recibe 403 en el `GET`. | D9: mensaje propio con el texto del backend, sin cierre de sesion, coherente con U01 de SPEC 09. |
| No existe 409 y podria tratarse como si lo hubiera. | Se declara explicitamente que no se maneja y que el ultimo `PATCH` que llega gana, como limite asumido. |
| El polling consume lecturas que el roadmap no pide. | D5 lo reduce a una cadencia aprobada por el usuario, con pausa por pestana oculta y por dialogo abierto; se mide de forma relativa en las pruebas. |
| El monto canonico del backend tiene ceros a la izquierda y una pantalla los "normaliza" al presentarlos. | Se muestra la cadena recibida sin reformatear, agrupar ni rellenar; prueba de navegador con un valor de la base. |
| El dialogo de Radix deja el fondo bloqueado o el foco perdido. | Reutilizar el patron de `Conductores/Detalle.tsx:395-439` y verificar foco inicial, foco de retorno y `Escape` en navegador. |
| La tabla con descripciones largas desborda a 320 px. | Ajuste de linea en descripcion y tarjetas bajo el breakpoint del proyecto; verificar 320 px y zoom 200 %. |
| Un texto de la interfaz se reescribe durante la implementacion y las pruebas de navegador no coinciden con el contrato. | La seccion "Textos exactos de la interfaz" es normativa: los criterios T01 a T05 la verifican por coincidencia literal en navegador. |
| El aviso de monto aproximado se reduce a una linea generica y pierde el sentido de la Regla 14. | El texto esta fijado literalmente y T01 lo exige. |
| El formulario parece permitir cambiar la vigencia y falla al guardar. | D4: solo lectura visible con nota explicativa, nunca un control deshabilitado sin explicacion. |
| Se confunde la aprobacion documental con el funcionamiento del modulo. | Estado `Draft`, todas las casillas sin marcar, `INT10` abierto y una seccion final que resalta lo que no se hizo. |

## Registro de esta entrega

**2026-10-05: definicion inicial en estado Draft.**
Se completo la investigacion con el contrato del backend, el roadmap, el prototipo, el codigo existente y las specs de referencia.
El usuario confirmo D1-D9 y las desviaciones 1 a 6 respecto del prototipo.
Se creo unicamente `specs/10-tarifario.md`.

Lo que NO se hizo en esta entrega:

- No se escribio codigo de implementacion: ni `src/pages/Tarifas.tsx`, ni `src/lib/tarifas.ts`, ni `src/lib/tarifasForm.ts`.
- No se escribieron tests unitarios ni escenarios de navegador.
- No se ejecutaron `tsc`, `npm run test:unit`, `npm run build` ni peticiones al backend.
- No se modifico el backend, su esquema de datos ni `Decimal(10,2)`.
- No se modificaron `src/api/types.ts`, `src/api/client.ts`, `src/router.tsx`, `src/components/Layout.tsx` ni `package.json`.

**2026-10-05: correccion de tipografia y fijacion de los textos, sin cambiar el alcance.**
Se corrigieron erratas de este documento: `Cumuir` a `Cumplir`, `urno` a `turno` en sus tres apariciones, `medianza` a `medicion`, `contoles` a `controles`, `recalla` a `resalta`, `Convention` a `Convencion`, `shortcuts` a `cortos` y una frase en ingles por su equivalente en espanol.
Se observo que `tragarse la pagina` no era una errata: las specs del repositorio se escriben sin tildes, igual que `movil`, `dialogo` y `exito`, asi que se mantiene `pagina`.
Se anadio la seccion normativa "Textos exactos de la interfaz", que fija literalmente el titulo, el subtitulo, los botones, los dos avisos, las cuatro columnas, los titulos y las etiquetas del dialogo, los mensajes de exito, el estado vacio y los textos de error.
Se fijo tambien el formato del monto, que se muestra tal cual lo entrega el backend con el sufijo `Bs`, con `Monto no disponible` como reserva.
Se anadieron los criterios T01 a T05, que verifican esos textos y el formato por coincidencia literal, y dos riesgos nuevos sobre la reescritura de textos.
No se modifico ninguna decision D1-D9, ni el alcance, ni los criterios existentes, ni `INT10`, que sigue sin marcar. La implementacion no se ha iniciado.
- No se hizo commit, ni rama, ni push.
- No se modifico `specs/.spec-config.yml` ni ningun spec anterior.
- No se cerro INT10 ni ninguna integracion pendiente de specs previas.

No hay criterios de implementacion marcados ni resultados de ejecucion presentados como evidencia.

## Que NO forma parte de esta especificacion

- Implementar el modulo. Esta entrega es solo la definicion.
- Tratar la aprobacion de esta spec o de D1-D9 como evidencia de funcionamiento.
- Borrar, restaurar, duplicar, versionar ni historiar tarifas.
- Cambiar `vigenciaDesde` por `PATCH` o por cualquier via del navegador.
- Calcular precios por kilometro, zona, turno, horario o recargo.
- Anadir busqueda, filtros, ordenacion local, paginacion, exportacion o mapa.
- Incorporar Realtime, WebSockets o sockets de actualizacion.
- Tocar el backend, el modelo de datos, la Regla 14, el shell, el router, el menu o las dependencias.
- Cerrar INT01, INT03, INT04, INT05, INT06, INT07, INT08 o INT09.
- Tratar un 409 que el contrato no publica.

La definicion esta lista para implementar sobre la evidencia estatica registrada.
La implementacion y `INT10` quedan pendientes.

## Implementacion y evidencia local (2026-10-05)

Esta seccion registra la fase expresamente autorizada por el usuario despues de la entrega documental. No reinterpreta los mocks como integracion real ni modifica specs anteriores.

### Preparacion y tareas

- [x] Leidas las 573 lineas originales, incluidas las posteriores a 488; inspeccionados DTO, cliente, Solicitudes, Configuracion, Dialog de Detalle, componentes UI y escenarios de SPEC 09.
- [x] Revisado `git status --short` antes de editar: solo `?? specs/10-tarifario.md`; conservado ese documento ajeno y su historial, con actualizaciones de evidencia autorizadas.
- [x] Intentada la invocacion explicita `skill("spec-impl")`: herramienta responde `Skill "spec-impl" not found`. Git tambien advierte de la referencia rota `.claude/skills/spec-impl/`. No se reparo configuracion fuera del alcance; se siguio el plan de esta spec con la autorizacion expresa.
- [x] Cargada `context7-mcp`; consultadas las referencias de TanStack Query y Zod 3. No hay `AGENTS.md` en el workspace. Se preservaron dependencias y archivos excluidos.
- [x] Linea base, implementacion, unitarios, navegador interceptado, regresion y verificaciones finales completados.

### Archivos realmente afectados

`src/pages/Tarifas.tsx`, `src/lib/tarifas.ts`, `src/lib/tarifasForm.ts`, `src/lib/tarifas.test.ts`, `src/lib/tarifasForm.test.ts`, `tests/browser/spec10.browser.js` y esta spec. Ningun otro archivo fuente, spec previa, archivo backend o dependencia fue modificado.

Se reutilizan `Tarifa`, `apiFetch`, `http.post`, `http.patch`, `Button`, `Input`, `Label` y `Alert`. Un unico Dialog Radix usa RHF/Zod y conserva el borrador separado de la cache. La guarda sincrona se adquiere antes de la validacion asincrona; `isSubmitting`, estado de envio y fieldset bloquean los controles. El PATCH se construye con claves explicitas y nunca incluye vigencia, ni siquiera si se altera el objeto de valores. No hay actualizacion optimista.

Zod instalado es 3.25: se usa `z.string().date()`, equivalente de formato calendario al `z.iso.date()` del contrato. Se verifican dias imposibles y bisiestos sin conversion a instante. `hoyTarifa` convierte solamente el reloj actual a fecha de calendario en America/La_Paz; nunca interpreta `vigenciaDesde` con `Date`. El formato de presentacion es `DD/MM/YYYY`.

### Comandos y resultados

| Verificacion | Linea base antes de editar | Resultado final |
|---|---|---|
| `npx tsc -b --force` | Exit 0, sin errores | Exit 0, sin errores |
| `npm run test:unit` | 10 archivos, 430 pruebas PASS | 12 archivos, 476 pruebas PASS; 46 nuevas |
| `npm run build` | Exit 0; JS 683.49 kB, gzip 206.22 kB | Exit 0; JS 694.39 kB, gzip 208.89 kB |
| `git diff --check` | No aplica | Sin errores de whitespace; Git informa normalizacion LF/CRLF |
| Playwright `browser_run_code_unsafe`, `tests/browser/spec10.browser.js` | No ejecutado en linea base | 21 escenarios PASS en ejecucion final |
| Playwright `browser_run_code_unsafe`, `tests/browser/spec09.browser.js` sin modificar | No ejecutado en linea base | 14 escenarios PASS de regresion |

El aviso de Vite por chunk mayor de 500 kB ya existia en la linea base y sigue presente. No hubo errores heredados de TypeScript, unitarios o build que requirieran tocar otros modulos.

### Evidencia por criterio

| Criterios | Evidencia concreta y limite |
|---|---|
| C01, C02 | Importacion del DTO central, helper `leerTarifas` y unitario de clave, URL sin query y signal. Interceptor rechaza APIs no previstas; cero APIs inesperadas en los escenarios. |
| C03-C07, D2-A, D3-A, T02, T03 | Unitarios de strings, calendario y reservas; navegador comprueba cuatro cabeceras exactas, orden recibido incluyendo descripciones repetidas, `15.00 Bs`, `99999999.99 Bs`, `01/01/2026`, input text/decimal y reserva para `05.00`. La regex normativa rechaza ceros enteros iniciales: `05.00` no se normaliza a `5.00`. No se certifica el ordenamiento del servidor con mocks. |
| C08, T04 | `200 []` muestra los dos textos exactos, alta disponible y sin Reintentar. GET retenido muestra carga, sin falso contador cero ni vacio. |
| C09 | Interceptor recibe exactamente los tres strings y devuelve 201 simulado; aparece `Tarifa agregada.`, se observa nuevo GET por invalidacion y la nueva fila sin recarga de pagina. El 201 real pertenece a INT10. |
| C10, C11, D4-A | Unitarios de PATCH vacio, descripcion recortada, una clave, ambas claves y vigencia manipulada. Navegador verifica no-op sin peticion, nota literal, readonly resistente al teclado y cuerpos exactos de PATCH sin fecha. No se pretende impedir peticiones artesanales fuera de esta UI. |
| C12, C13, D8-A | Inspeccion del JSX y helpers: no calculos, coordenadas, ordenacion, filtros, busqueda, paginacion o acciones fuera de alcance. Lectura y polling no producen escrituras. |
| C14 | Pendiente: el cliente no agrega ni anticipa filas, y una lectura reemplaza la anterior. La exclusion de vigencias futuras en el servidor no se acredita con interceptores. |
| D1-A, T01 | Un solo Dialog con Title/Description; pruebas por nombres/textos exactos de titulos, etiquetas, ayudas, placeholders, contador, botones, avisos y resultados; inspeccion de cadenas normativas del JSX. |
| D5-A | Reloj Playwright: ciclo relativo de 15 s, 31 s sin GET con dialogo abierto ni perdida del borrador, reanudacion al cerrar, pausa por visibilidad y offline, lectura retenida sin solapamiento ni esqueleto. |
| D6-A | Alta y edicion lentas: tres clics en un tick, Enter repetido y `requestSubmit` repetido generan una sola escritura. Fieldset e inputs deshabilitados durante el transporte. |
| D7-A | Ambos avisos literales presentes; azul sobre la tabla y aproximado debajo, con role status. |
| D9-A | GET 403 simulado presenta texto propio y `Permiso denegado`, sin logout ni retry automatico. |
| T05, U03 | Cuatro escenarios de red/500 inicial y con cache, roles alert/status correctos, conservacion de filas, un retry automatico maximo y recuperacion manual con triple clic sin solapamiento. Dos escenarios adicionales offline inicial/con cache y reconexion. |
| U01, U02 | GET y POST 401 simulados redirigen al login usando cliente/auth existentes. GET retenido de sesion A, logout, login B y liberacion tardia: solo B visible, sin AbortError/CancelledError anunciados. Unitario de cancelacion silenciosa. |
| U04 | PATCH 404 muestra mensaje y explicacion, mantiene dialogo, bloquea nuevo envio y permite recargar; se observa GET y foco en region de resultados. |
| U05 | Inspeccion sin persistencia y comprobacion de localStorage/sessionStorage vacios tras alta. |
| U06, U07 | 430 pruebas previas siguen pasando; SPEC 09 completa pasa sus 14 escenarios, incluidos polling, logout, badges en Lista/Detalle, responsive y sesiones tardias. Shell, router y componentes compartidos intactos. Esto no sustituye una certificacion exhaustiva de todas las pantallas o dispositivos. |
| V01-V03 | Comandos y ejecuciones anteriores. Contextos aislados, service workers bloqueados, rutas interceptadas antes de navegar, API desconocida/hosts externos abortados, datos ficticios y contextos cerrados en finally. Sin peticiones al backend real. |
| INT10 | Pendiente y sin ejecutar: falta autorizacion especifica de entorno/cuenta. No se verificaron middleware real, DTO real, filtro futuro, 201/404/400 reales ni Cache-Control. |

### Accesibilidad, incidencias y limites

- Se verificaron 320, 768, 1024 y 1280 px sin overflow horizontal; tabla accesible desde `lg` y tarjetas debajo, sin ambas representaciones expuestas simultaneamente. Tres etiquetas visibles por tarjeta y ajuste de descripcion larga.
- Foco inicial en Descripcion, anillo focus-visible por box-shadow del Input compartido, Tab contenido en el dialogo, Escape y Cancelar con retorno al origen, retorno tras POST/PATCH y foco en resultados tras recarga de 404. Polling no mueve foco ni convierte tabla en region viva. El cierre libera scroll lock.
- Zoom ejercido con `document.documentElement.style.zoom = '2'` en Chromium automatizado, no zoom nativo del navegador. La primera ejecucion detecto acciones recortadas con altura en dvh; se cambio a altura maxima porcentual del viewport y la prueba final verifica botones alcanzables por scroll y dentro del area visible. No se usaron lector de pantalla ni telefono fisico; tampoco se certifican otros motores de navegador.
- Dos aserciones iniciales del harness se corrigieron: los controles compartidos usan ring/box-shadow, no outline; el atributo disabled del fieldset se inspecciona en DOM y se confirma en un input descendiente, no con `isDisabled()` sobre el fieldset. No se alteraron componentes compartidos para adaptar las pruebas.
- PATCH/POST 400, 403 y 500 conservan el borrador y permiten reintento manual; 404 de PATCH ofrece recarga, sin reenvio. No se agrego tratamiento especial de 409.
- Pendientes de cierre: C14 e INT10 contra backend autorizado; validacion humana con lector de pantalla, telefono fisico y zoom nativo. Ultimo PATCH gana por contrato, sin versionado. El aviso previo de tamano del bundle y la skill `spec-impl` ausente quedan documentados sin arreglos fuera de alcance.
- No se instalaron dependencias ni se crearon cuentas, seeds o migraciones. No hubo commit ni push. Ninguna integracion de specs anteriores cambia de estado.
