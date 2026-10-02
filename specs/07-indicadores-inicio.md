# SPEC 07 - Inicio: indicadores

> **Estado:** Aprobado
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 03 (`03-shell-y-navegacion.md`, INT03 pendiente), SPEC 05 (`05-conductores-listado-estados.md`, INT05 pendiente).
> **Patron de referencia:** SPEC 04 (`04-configuracion-empresa.md`) y SPEC 06 (`06-conductor-detalle-vehiculo.md`).
> **Contrato externo:** `../backend/specs/11-tarifario-dashboard.md` seccion 3.6, y `../docs/ROADMAP_FRONTEND.md:414-459`.
> **Fecha:** 2026-10-02
> **Objetivo:** Corregir el nombre del cuarto indicador y construir la pantalla de Inicio con las cuatro tarjetas de `GET /api/dashboard/indicadores`, refresco automatico cada 15 s y estados de error que no se confundan con ceros reales.

## Contexto y fuentes

La pantalla ya existe y ya consulta el endpoint correcto, pero declara un tipo local duplicado que no compila contra el contrato: `src/pages/Home.tsx:4-9` llama `solicitudesCompletadas` al campo que el backend llama `solicitudesCompletadasHoy`. Como `src/api/types.ts:47-52` ya declara el DTO correcto, TypeScript no detecta la divergencia y en runtime la cuarta tarjeta cae al `?? 0` de `src/pages/Home.tsx:37`, mostrando **0 aunque el backend devuelva el conteo real**. Esta spec cierra tambien el pendiente de adopcion del tipo central que el Modulo 1 dejo abierto para `Home.tsx`.

Ademas, la pantalla trata cualquier fallo de red como cuatro ceros validos y no aporta nada del prototipo mas alla del titulo y el subtitulo.

| Fuente | Contexto verificado |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:414-459` | Modulo 7: endpoint 11, contrato verificado, trabajo pendiente y criterios de aceptacion. |
| `../docs/ROADMAP_FRONTEND.md:45-49` | Las 4 operaciones sin query aplican `z.object({}).strict()`: cualquier query string responde `400`. |
| `../docs/ROADMAP_FRONTEND.md:39-43` | Formato de error `{ error: { code, message } }` y codigos observados. |
| `../docs/ROADMAP_FRONTEND.md:31-34` | `/api/dashboard/indicadores` es `requireAdmin`. |
| `../docs/ROADMAP_FRONTEND.md:51-55` | Modulos 1-10 usan polling; Realtime es solo del Modulo 11 y no aplica aqui. |
| `../docs/REGLAS_DE_NEGOCIO.md` | Sin regla directa aplicable: los conteos los decide el backend. |
| `../backend/specs/11-tarifario-dashboard.md` seccion 3.6 | DTO, transaccion `RepeatableRead` y reglas de los 4 conteos. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:77-80` | Seccion 5.3: 4 tarjetas, sin graficos complejos ni analitica historica. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:110-116` | Seccion 6: reportes historicos, exportacion y analitica avanzada fuera de alcance. |
| `references/pantallas/inicio.html:8,13,18` | El prototipo es un shell; todo el DOM de Inicio lo genera `homePage()`. |
| `references/pantallas/app.js:100-110` | Encabezado, 4 tarjetas con su anatomia y secciones posteriores. |
| `references/pantallas/app.js:91,148` | `refreshButton()` con etiqueta `Actualizar` / `Actualizando...` y `dateLabel` en `es-BO`. |
| `src/pages/Home.tsx:1-44` | Pantalla actual: tipo local duplicado, `refetchInterval: 15_000`, `isPending` y `?? 0`. |
| `src/api/types.ts:47-52` | `Indicadores` central, con `solicitudesCompletadasHoy`. |
| `src/api/client.ts:15-24,26-52,56-65` | `apiFetch` acepta `RequestInit`, propaga `options.signal` y expone `ApiError` con `status` y `message`. `http.get` no reenvia opciones. |
| `src/lib/conductores.ts:86` | `intervaloRefresco({ visible, hayTransicionEnCurso })`: patron de pausa por visibilidad. |
| `src/lib/conductores.ts:88`, `src/lib/configuracion.ts:41` | `puedeDispararRefresco` y `puedeDispararReintento`: guardas de lectura manual. |
| `src/lib/conductores.ts:15-17`, `src/lib/configuracion.ts:45-49` | `retryConductores` y `retryConfiguracion`: reintentan solo `5xx` y `TypeError`. |
| `src/lib/conductores.ts:19-28`, `src/lib/configuracion.ts:51-79` | `informacionErrorConductores` e `informacionErrorConfiguracion`: `{ mensaje, recuperable }` por status. |
| `src/lib/conductores.test.ts`, `src/lib/configuracion.test.ts` | Convenciones de unitarios: helpers puros, `it.each` con casos etiquetados, sin render. |
| `src/router.tsx:24` | `Home` es la ruta indice del layout protegido, path `/`. |
| `src/components/Layout.tsx:78` | Entrada de navegacion `Inicio` con `end: true` hacia `/`. |
| `src/context/AuthContext.tsx:18-25` | Logout: `cancelQueries()` sincrono seguido de `clear()`. |
| `src/index.css:3-27` | Tokens Tailwind v4: `--color-ink-950`, `--color-gris`, `--color-font-display`, `--color-taxi`, `--color-azul`, `--color-verde`, `--color-ambar`. |
| `src/pages/Mapa.tsx:4-5`, `src/pages/Tarifas.tsx:4-5` | Patron de encabezado `h1 font-display text-2xl font-bold text-ink-950` + `p mt-1 text-sm text-gris`. |

Las specs locales 01-06 se revisaron. No existia una SPEC 07 frontend al preparar este documento.
`specs/.spec-config.yml` ya existe y no se modifica.
La rama activa es `spec-06-conductor-detalle-vehiculo`; su opcion `AutoCreateBranch` no se ejecuta en esta entrega documental.

## Alcance

### Requisitos fijos del roadmap y del contrato

- Corregir el nombre del cuarto campo a `solicitudesCompletadasHoy` en toda la pantalla.
- Importar `Indicadores` desde `src/api/types.ts` y eliminar la interface local duplicada.
- Mantener `['indicadores']` como query key, sin renombrarla (el Modulo 11 la invalidaria).
- Presentar cuatro tarjetas: disponibles, en servicio, solicitudes activas y completadas hoy.
- Conservar `refetchInterval: 15_000` como refresco automatico del resumen.
- Mostrar `–` mientras la carga inicial esta pendiente y `0` cuando el conteo real sea cero.
- No enviar query string: la ruta aplica un esquema de query estrictamente vacio.
- No escribir, mutar ni abrir endpoints adicionales desde esta pantalla.

### Decisiones de UX aprobadas

Respondidas expresamente por el usuario durante la definicion de esta spec.
D6 a D9 son ajustes posteriores de revision, tambien aprobados por el usuario.

| ID | Tema | Decision aprobada | Alternativa descartada y motivo |
|---|---|---|---|
| D1 | Alcance visual | Solo encabezado y las 4 tarjetas. | Descartado el panel «Tu flota en el mapa», el aviso de ubicaciones desactualizadas y la tabla «Solicitudes activas» del prototipo: son trabajo de los Modulos 8 y 9. «Por revisar» duplicaria la consulta `['conductores', { estado: 'pendiente' }]` del Modulo 5. |
| D2 | Anatomia de tarjeta | Completa del prototipo: titulo, icono decorativo, valor y pie con punto de color y nota real. | Descartado el titulo mas valor minimos actuales y la variante sin pie. |
| D3 | Refresco | Polling de 15 s, boton `Actualizar` y pausa cuando la pestana no esta visible. | Descartado polling sin pausa (sigue consultando en segundo plano) y eliminar el polling, que rompe el criterio de aceptacion del roadmap. |
| D4 | Errores y cache | Nuevo `src/lib/indicadores.ts` con retry, informacion de error y fecha; conservar la ultima lectura confirmada con aviso no bloqueante y `Reintentar`. | Descartado el `?? 0` actual, que disfraza un fallo de red como cuatro ceros, y el simple uso del `retry: 1` global. |
| D5 | Fecha y rotulos | Rotulos del roadmap y fecha real del navegador en `es-BO`/`America/La_Paz` para el pie de la cuarta tarjeta, con fallback `Fecha no disponible`. | Descartado «Completadas hoy» sin fecha y la fecha real con el rotulo abreviado del prototipo, que deja la ventana temporal sin explicar. |
| D6 | Titulo de la pagina | El `h1` dice **`Inicio`**, en coherencia con la entrada del menu lateral. | Descartado `Resumen de la operacion` del prototipo, que obligaria a cambiar tambien el menu lateral, fuera de alcance de esta spec. |
| D7 | Boton `Actualizar` | **Si se implementa**, junto al titulo, con las etiquetas `Actualizar` / `Actualizando...`. Convive con el polling, no lo reemplaza. | Descartado omitirlo: el roadmap no lo exige, pero da control manual al admin ante un resumen que se siente congelado. |
| D8 | Punto de color del pie | `aria-hidden="true"` explicito, igual que los iconos decorativos. | Descartado dejarlo sin marcar: es decorativo y su significado ya esta en el titulo y la nota. |
| D9 | Contador `undefined` | `console.warn` con la clave afectada antes del `?? 0`, como senal de diagnostico de una regresion futura del contrato. | Descartado el silencio: el `?? 0` es una red de seguridad que enmascara un bug del backend si nadie lo ve. |

### Fuera de alcance

- Reproducir `home-middle`, `notice` ni `section.panel` de `references/pantallas/app.js:106-109`.
- Consultar `conductores-mapa`, `solicitudes-activas`, `conductores` o `tarifas` desde esta pantalla.
- Graficos, series historicas, tendencias, comparativas, exportacion o analitica avanzada.
- Cualquier accion de mutacion, aprobacion, rechazo o reasignacion.
- Realtime, WebSockets o suscripcion `postgres_changes`, incluso como disparador de invalidacion.
- Mover, renombrar o dividir `src/pages/Home.tsx`; ni crear `Home/Inicio.tsx`.
- Cambios de backend, contratos, base de datos, seeds, migraciones o entorno.
- Modificar `src/api/types.ts`, `src/api/client.ts`, `AuthContext`, `QueryClient`, `router.tsx`, `package.json` ni `specs/.spec-config.yml`.
- Refactorizar `antiguedadParaMostrar` de `src/lib/conductores.ts:57` ni unificar la formateacion de fechas de SPEC 06.
- Cerrar INT01, INT03, INT04, INT05 o INT06, ni ejecutar peticiones reales contra el backend.
- Implementar codigo durante esta entrega documental.

## Modelo de datos y contratos

Esta spec no introduce entidades persistentes, DTO de lectura nuevos ni migraciones.
Reutiliza `Indicadores` de `src/api/types.ts:47-52` y los cuatro campos exactos del backend.

### Lectura

`GET /api/dashboard/indicadores` requiere administrador y devuelve el DTO **directamente**, sin envoltorio `data` y sin campos adicionales: ni `fecha`, ni `actualizadoEn`, ni timestamp.

| Campo | Tipo | Regla de calculo en el backend |
|---|---|---|
| `conductoresDisponibles` | `number` entero >= 0 | `estadoDisponibilidad: 'disponible'`, **sin** filtro por `estado: 'aprobado'`. |
| `conductoresEnServicio` | `number` entero >= 0 | `estadoDisponibilidad: 'en_servicio'`. |
| `solicitudesActivas` | `number` entero >= 0 | Los 6 estados no terminales de `solicitudes`. |
| `solicitudesCompletadasHoy` | `number` entero >= 0 | `estado: 'finalizada'` con `finalizadaEn` dentro del dia de `America/La_Paz`, en intervalo semiabierto. |

Los cuatro se resuelven en una sola transaccion `RepeatableRead`, asi que comparten una instantanea coherente: los cuatro valores de una misma respuesta son consistentes entre si.
Los cuatro exigen `eliminadoEn: null`; un usuario eliminado logicamente **no** excluye del conteo.
La ruta envia `Cache-Control: no-store` y aplica un esquema de query estrictamente vacio.

### Mapas de presentacion

Estos mapas son de UI, no contratos nuevos. Viven en `src/lib/indicadores.ts` para que sean testeables sin render.

```ts
type ClaveIndicador =
  | 'conductoresDisponibles'
  | 'conductoresEnServicio'
  | 'solicitudesActivas'
  | 'solicitudesCompletadasHoy'

type PieTarjeta = { color: 'verde' | 'azul' | 'ambar' | 'gris'; texto: string }

const TARJETAS: { clave: ClaveIndicador; titulo: string; icono: NombreIcono; pie: PieTarjeta }[]
```

| Orden | `clave` | Titulo visible | Color del punto | Nota del pie |
|---|---|---|---|---|
| 1 | `conductoresDisponibles` | Conductores disponibles | verde | Disponibilidad registrada |
| 2 | `conductoresEnServicio` | Conductores en servicio | azul | Atendiendo un viaje |
| 3 | `solicitudesActivas` | Solicitudes activas | ambar | En el flujo de atencion |
| 4 | `solicitudesCompletadasHoy` | Solicitudes completadas hoy | gris | Fecha local del navegador |

El titulo de la cuarta tarjeta es el del roadmap y el del tipo central, **no** el abreviado `Completadas hoy` del prototipo.
La nota de la primera tarjeta es `Disponibilidad registrada` porque el conteo no filtra por aprobacion: afirmar que estan «Listos para recibir solicitudes», como hace el prototipo, seria una equivalencia que el endpoint no garantiza y que SPEC 06 prohibe expresamente.
El orden y los colores provienen de `references/pantallas/app.js:105`.
Los iconos son los del prototipo (`car`, `pin`, `requests`, `checkCircle`) dibujados como SVG inline decorativos, con `aria-hidden="true"`; no se instala ninguna libreria de iconos.

### Helpers puros nuevos

`src/lib/indicadores.ts` no introduce datos nuevos; encapsula las decisiones D4 y D5 para que la pantalla quede declarativa.

| Export | Firma | Proposito |
|---|---|---|
| `CLAVE_INDICADORES` | `['indicadores'] as const` | Query key unica, compatible con la invalidacion futura del Modulo 11. |
| `TARJETAS` | tabla de las 4 tarjetas | Orden, titulo, icono, color y nota fija de cada contador. |
| `retryIndicadores` | `(failureCount: number, error: unknown) => boolean` | Reintenta solo `5xx` y `TypeError`, nunca `4xx`, y como maximo una vez. |
| `informacionErrorIndicadores` | `(error: unknown) => { mensaje: string; recuperable: boolean }` | Traduce `ApiError.status` a un mensaje y a si conviene ofrecer `Reintentar`. Sin parsear texto. |
| `intervaloRefrescoIndicadores` | `({ visible, enCurso }: { visible: boolean; enCurso: boolean }) => number \| false` | `15_000` cuando la pestana esta visible y no hay lectura manual en curso; `false` en cualquier otro caso. |
| `puedeDispararRefrescoIndicadores` | `(enCurso: boolean) => boolean` | Evita dos lecturas manuales simultaneas. |
| `fechaIndicadoresParaMostrar` | `(fecha: Date) => string` | Fecha en `es-BO` con zona `America/La_Paz` para el pie de la cuarta tarjeta. |

`fechaIndicadoresParaMostrar` es el **primer formateador absoluto de fecha de `src/`**: hasta ahora solo existe `antiguedadParaMostrar` (`src/lib/conductores.ts:57`), que es relativo y manual.
Debe usar `Intl.DateTimeFormat` con `timeZone: 'America/La_Paz'` y las opciones de `dateLabel` de `references/pantallas/app.js:148`.
Se queda **local a este modulo**: no se extrae un `src/lib/fechas.ts` generico ni se toca el formateo de SPEC 06. Si otra pantalla lo necesita, se generaliza en su propia spec.

## Presentacion y comportamiento

### Encabezado

Conservar el patron de las otras pantallas: `h1` con `font-display text-2xl font-bold text-ink-950` y subtitulo con `mt-1 text-sm text-gris`.
El prototipo anade un eyebrow `Centro de operaciones`, una etiqueta de fecha y el boton `Actualizar` (`app.js:104`).

| Elemento | Decision |
|---|---|
| Titulo | **`Inicio`**, igual que la entrada del menu lateral (`Layout.tsx:78`). Se descarta `Resumen de la operacion` del prototipo: el titulo de la pagina y el del menu deben coincidir, y cambiar el menu esta fuera de alcance de esta spec. |
| Subtitulo | `Todo lo que necesitas para supervisar tu flota, en un solo lugar.` del prototipo. |
| Eyebrow | Se omite: es decoracion y ninguna otra pantalla del shell lo usa. |
| Etiqueta de fecha | No se implementa aqui. La fecha aparece en el pie de la cuarta tarjeta, unica vez y junto al dato del dia. |
| `Actualizar` | **Si se implementa.** Da control manual al admin y no reemplaza el polling: conviven. Etiquetas `Actualizar` / `Actualizando...` de `refreshButton()` (`app.js:91`). Se ubica en el encabezado, junto al titulo. |

Las tarjetas se agrupan en un contenedor con `aria-label="Indicadores del dia"`, como en `app.js:105`.
El valor usa `font-display text-4xl font-extrabold text-ink-950`, coherente con la pantalla actual.
La rejilla mantiene `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`, que ya es responsiva y no requiere CSS nuevo.
No se crea `src/pages/Home.css`: la pantalla se resuelve con utilidades Tailwind y tokens existentes, como hoy.
Los puntos de color usan `--color-verde`, `--color-azul`, `--color-ambar` y `--color-gris` de `src/index.css:7-10`; el color nunca es el unico portador de significado, cada tarjeta tiene titulo y nota de texto.

### Lectura, estados y refresco (D3, D4)

| Situacion | Comportamiento requerido |
|---|---|
| Carga inicial pendiente | Las cuatro tarjetas muestran `–`. No se inventan ceros ni numeros de ejemplo. |
| Lectura correcta | Cada tarjeta muestra su contador; un conteo real de `0` se muestra como `0`, distinguible del `–` de carga. |
| Refresco en vuelo con datos previos | Se conservan los valores confirmados y no se vuelve a `–`. El boton queda en `Actualizando...`. |
| Error de red o `5xx` con datos previos | Se conservan los valores confirmados y se muestra un aviso no bloqueante de posible desactualizacion, mas `Reintentar`. |
| Error de red o `5xx` sin datos previos | Estado de error con `Reintentar`. No se presenta como cuatro ceros. |
| `403` o `401` | Mostrar el `message` del backend. El `401` conserva el cierre de sesion y la redireccion existentes en `client.ts:42-44`; la pantalla no bloquea ni suprime ese comportamiento. El `403` no cierra sesion. |
| `404` de ruta | Mostrar el mensaje recibido. No se implementa ninguna recuperacion especifica: es un caso de despliegue, no de pantalla. |
| Peticion cancelada por React Query | No debe mostrarse como error al usuario. |

El aviso de desactualizacion usa `role="status"` y el error usa `role="alert"`.
`Reintentar` y `Actualizar` comparten la guarda `puedeDispararRefrescoIndicadores` para no disparar dos lecturas simultaneas.
El aviso de error incluye un `Reintentar` que usa el patron de `puedeDispararReintento` de `src/lib/configuracion.ts:41`.
Ningun control de la pantalla se marca `aria-busy` de forma permanente: la actividad deliberada se anuncia solo durante la lectura manual.
No se usa actualizacion optimista: los contadores son agregados del backend y no se editan.

### Visibilidad de la pestana

`intervaloRefrescoIndicadores` replica el patron ya probado en SPEC 05 (`src/lib/conductores.ts:86`) sin importarlo, porque alli la condicion segunda es una transicion en curso y aqui es una lectura manual.
Se apoya en el hook de visibilidad ya usado por el listado; si el hook existente no fuera reutilizable, se usa `document.visibilityState` con listener propio en `Home.tsx`.
El polling es la **unica** actualizacion: no hay Realtime, ni siquiera como invalidacion del Modulo 11 (`ROADMAP_FRONTEND.md:449-450`).

### Numero de tarjeta

`data?.[clave] ?? 0` se conserva **solo** para el caso en que existe una lectura confirmada cuyo contador es `undefined`, que el contrato no permite pero que no debe romper el render.
La distincion se hace por estado, no por valor: `isPending` sin datos muestra `–`; con datos, un valor no numerico se muestra `–` y no `0`.
No aplicar `Number(...)`, redondeos ni unidades: el backend entrega enteros y la pantalla los muestra tal cual.
No formatear con separadores de miles: el prototipo muestra `0` y `4`, no `1.234`.

Cuando una lectura confirmada tenga un contador `undefined` o no numerico, la pantalla emite un `console.warn` con la clave afetada antes de cair al `?? 0`.
Es una senal de diagnostico para detectar una regresion futura del contrato del backend, no un mensaje para el usuario: no altera el texto de ninguna tarjeta.
El aviso debe ser inequivoco (por ejemplo, indicando el nombre del campo) y no debe incluir la respuesta completa ni datos del servidor.
No se registra en consola ningun token, cabecera, credencial ni cuerpo de respuesta.
Este `console.warn` no sustituye los unitarios de U01, que fijan los cuatro nombres exactos del DTO.

## Errores

`ApiError` expone solo `status` y `message`. Los codigos del backend se documentan como contrato, pero no se asume una propiedad `error.code` en el cliente y **no** se deduce el comportamiento parseando el texto del mensaje.

| HTTP / codigo backend | Mensaje exacto | Comportamiento de la pantalla |
|---|---|---|
| 400 `VALIDATION_ERROR` | `Entrada invalida` | Solo posible si se envia un query string, que esta spec prohibe. Mostrar el mensaje; no reintentar. |
| 401 `UNAUTHORIZED` | `Credenciales invalidas` | Cierre de sesion y redireccion existentes en `client.ts:42-44`. La pantalla no anade logica propia. |
| 403 `FORBIDDEN` | `Permiso denegado` | Aviso con el mensaje; `recuperable: false`; no cerrar sesion; no ofrecer `Reintentar` automatico. |
| 404 `NOT_FOUND` | `Ruta inexistente` | Mostrar el mensaje. Sin `Reintentar` automatico. |
| `5xx` `INTERNAL_ERROR` | `No se pudo completar la operacion` | Aviso recuperable con `Reintentar`. |
| Red (`TypeError`) | Error de transporte | Aviso recuperable con `Reintentar`. |

`informacionErrorIndicadores` decide por `status`, nunca por texto, igual que `informacionErrorConductores` e `informacionErrorConfiguracion`.
No se escribe en pantalla ningun codigo interno: solo el mensaje recibido y la distincion recuperable / no recuperable.

## Cache, concurrencia y sesion

- La query key es exactamente `['indicadores']`, la definida en el Modulo 1 y la que invalidaria el Modulo 11. No se renombra.
- No hay mutaciones en esta pantalla, asi que no hay publicacion optimista, ni `setQueryData`, ni reconciliacion tras escrituras.
- Con datos previos, un fallo conserva la ultima lectura confirmada en cache: React Query mantiene `data` y expone `isError` por separado. La pantalla no borra la cache para «limpiar» el error.
- Un `refetch` fallido posterior a una lectura correcta no debe vaciar las tarjetas.
- La pantalla es de solo lectura: no altera el contenido de `['configuracion']` ni de ninguna otra clave.
- Cerrar sesion limpia la cache por el camino ya existente en `AuthContext.tsx:18-25`; no se anade limpieza propia.
- Una respuesta tardia de la sesion A no debe pintarse en la sesion B: `client.ts:50-52` ya convierte el desfase de `sessionId` en `AbortError`, y React Query descarta la query cancelada. La pantalla no debe distinguir ni mostrar ese `AbortError` como fallo.
- No se persisten contadores, ni una copia de la ultima lectura, ni nada en `localStorage`.
- El backend no ofrece version, `ETag` ni precondiciones sobre estos agregados. Dos lecturas consecutivas pueden diferir por operaciones concurrentes; es esperado y no se mitiga.

## Accesibilidad y movil

- Un unico `h1` por pantalla y el contenedor de tarjetas con `aria-label="Indicadores del dia"`.
- Cada tarjeta es un `article` con su propio encabezado legible: titulo en texto y valor asociado. El valor no se marca `aria-live` para no anunciar un nuevo valor cada 15 s.
- Los iconos son decorativos: `aria-hidden="true"` y `focusable="false"`.
- El punto de color del pie tambien es decorativo y lleva `aria-hidden="true"` explicito, igual que los iconos. No aporta informacion que el titulo o la nota no digan ya en texto.
- `Reintentar` y `Actualizar` son botones nativos con foco visible y alcanzables por teclado.
- El error se anuncia con `role="alert"`; la desactualizacion y la confirmacion de refresco con `role="status"`.
- Sin scroll horizontal a 320 px ni con zoom 200 %. Las cuatro tarjetas caen a una columna por debajo de `sm`.
- La rejilla existente ya resuelve el comportamiento responsivo; no se introducen breakpoints nuevos que contradigan el shell de 1024 px.
- Textos largos de notas y fechas deben caber en una linea sin desbordar la tarjeta.
- No se ejecuto lector de pantalla en esta entrega; si la implementacion tampoco lo hace, debe declararse como limitacion, no como criterio cumplido.

## Archivos previstos

| Archivo | Cambio |
|---|---|
| `specs/07-indicadores-inicio.md` | Este documento. |
| `src/lib/indicadores.ts` | Nuevo: `CLAVE_INDICADORES`, `TARJETAS`, `retryIndicadores`, `informacionErrorIndicadores`, `intervaloRefrescoIndicadores`, `puedeDispararRefrescoIndicadores`, `fechaIndicadoresParaMostrar`. |
| `src/lib/indicadores.test.ts` | Nuevo: unitarios de los helpers puros. |
| `src/pages/Home.tsx` | Importar `Indicadores` de `src/api/types.ts`, eliminar la interface local, usar los helpers nuevos, renderizar encabezado y 4 tarjetas con la anatomia del prototipo, mas `Actualizar`, `Reintentar` y aviso de desactualizacion. |

No se prevén cambios en `src/api/types.ts`, `src/api/client.ts`, `src/context/AuthContext.tsx`, `src/App.tsx`, `src/router.tsx`, `src/components/Layout.tsx`, `package.json` ni `specs/.spec-config.yml`.
No se crea `src/pages/Home.css` salvo que la comparacion con el prototipo demuestre que Tailwind no basta; en ese caso debe justificarse antes de escribirlo.
No se crean componentes, hooks ni genericos nuevos para logica de un solo uso.
`../docs/ROADMAP_FRONTEND.md` no se modifica en esta entrega. Su actualizacion corresponde a la fase de implementacion y solo con evidencia, nunca con intenciones.

## Plan de implementacion

Cada paso deja el sistema ejecutable y es commiteable por separado.

1. Crear `src/lib/indicadores.ts` con `CLAVE_INDICADORES`, `TARJETAS` y los helpers de presentacion. Manual: `npm run test:unit` sigue en verde.
2. Anadir `src/lib/indicadores.test.ts` con los casos de los helpers puros, incluidos limites de fecha y zona horaria. Manual: `npm run test:unit` en verde.
3. Corregir `src/pages/Home.tsx`: importar `Indicadores` de `src/api/types.ts`, borrar la interface local y renombrar el cuarto campo a `solicitudesCompletadasHoy`. Incorporar tambien el `console.warn` de D9 ante contador `undefined` o no numerico. Manual: `npm run build` sin errores y la cuarta tarjeta muestra el conteo real.
4. Sustituir la tarjeta minima por la anatomia completa del prototipo: icono SVG inline decorativo, valor y pie con punto de color y nota real. Aplicar D8 (`aria-hidden` en el punto). Manual: comparacion visual contra `app.js:105`.
5. Conectar `retryIndicadores`, `informacionErrorIndicadores` y los estados de carga, error con `Reintentar` y desactualizacion con datos previos. Manual: `–` en carga, `0` real visible, error sin datos en `role="alert"`, error con datos en `role="status"`.
6. Anadir `Actualizar` y la pausa del polling con la visibilidad de la pestana, con las guardas de lectura simultanea. Manual: una lectura por pulsacion, y ninguna con la pestana oculta.
7. Ajustar encabezado y notas al texto aprobado en D5 y D6, incluido el formateador `es-BO`/`America/La_Paz` y su fallback `Fecha no disponible`. Manual: la cuarta tarjeta muestra la fecha local y su nota no afirma elegibilidad.
8. Registrar evidencia por criterio, marcar las casillas verificadas y dejar INT07 y las integraciones anteriores pendientes.

Las pruebas acompanian cada incremento; no se posponen todas al ultimo paso.
El primer incremento es logica pura sin tocar la pantalla; el ultimo es evidencia, no funcionalidad nueva.

## Criterios de aceptacion

Las casillas se marcan solo con evidencia registrada en la seccion final. Ninguna casilla local acredita integracion real.

### Contrato y datos

- [x] La pantalla importa `Indicadores` desde `src/api/types.ts` y no declara ninguna interface local de datos del servidor.
- [x] Las cuatro tarjetas leen `conductoresDisponibles`, `conductoresEnServicio`, `solicitudesActivas` y `solicitudesCompletadasHoy` con esos nombres exactos.
- [x] No aparece en el codigo el nombre `solicitudesCompletadas`.
- [x] La query se ejecuta contra `/api/dashboard/indicadores` sin query string ni parametros.
- [x] La query key es exactamente `['indicadores']`.
- [x] Un contador real de `0` se muestra como `0` y no como `–` ni como error.
- [x] Un contador `undefined` o no numerico en una lectura confirmada emite un `console.warn` con la clave y renderiza `–`, sin alterar el texto de la tarjeta.

### Presentacion

- [x] La pantalla reproduce la anatomia de `article.stat` del prototipo: titulo, icono decorativo, valor y pie con punto de color y nota.
- [x] El `h1` de la pagina dice `Inicio`, igual que la entrada del menu lateral, y el subtitulo es el del prototipo.
- [x] El titulo de la cuarta tarjeta es `Solicitudes completadas hoy` y su pie es la fecha real del navegador, no el texto fijo del prototipo.
- [x] El pie de la primera tarjeta no afirma que los conductores esten listos para recibir solicitudes.
- [x] Los cuatro colores del prototipo se obtienen de los tokens de `src/index.css`, sin colores hexadecimales nuevos.
- [x] Los iconos son SVG inline decorativos con `aria-hidden="true"`; no se instalo ninguna libreria de iconos.
- [x] El punto de color del pie lleva `aria-hidden="true"` explicito y el significado no depende solo del color.
- [x] Los colores coinciden con los del prototipo en el mismo orden: verde, azul, ambar, gris.
- [x] No hay scroll horizontal a 320 px ni con zoom 200 %, y las cuatro tarjetas caen a una columna en movil.

### Refresco

- [x] Las tarjetas se actualizan solas cada 15 s mientras la pestana esta visible.
- [x] Con la pestana oculta no se ejecutan lecturas periodicas.
- [x] `Actualizar` ejecuta exactamente una lectura por pulsacion, convive con el polling de 15 s y muestra `Actualizando...` mientras dura.
- [x] `Actualizar` y `Reintentar` no pueden dispararse simultaneamente.
- [x] Durante un refresco con datos previos no se vuelve a mostrar `–`.

### Errores

- [x] Un error de red o `5xx` sin datos previos muestra un estado de error con `Reintentar` y **no** cuatro ceros.
- [x] Un error de red o `5xx` con datos previos conserva la ultima lectura confirmada y anade un aviso no bloqueante de desactualizacion.
- [x] `informacionErrorIndicadores` decide por `ApiError.status` y no parsea el texto del mensaje.
- [x] Un `403` muestra `Permiso denegado` sin cerrar sesion.
- [x] Un `401` conserva el cierre de sesion y la redireccion a `/login` ya existentes, sin logica duplicada.
- [x] `retryIndicadores` reintenta `5xx` y `TypeError`, nunca `4xx`, y como maximo una vez.
- [x] Una peticion cancelada por React Query no se muestra como error al usuario.

### Alcance y no regresiones

- [x] La pantalla no consulta `conductores-mapa`, `solicitudes-activas`, `conductores` ni `tarifas`.
- [x] No hay graficos, series historicas, tendencias ni acciones de mutacion.
- [x] No se modificaron `src/api/types.ts`, `src/api/client.ts`, `AuthContext`, `QueryClient`, `router.tsx`, `Layout.tsx` ni `package.json`.
- [x] No hay codigo de Realtime, WebSocket ni suscripcion `postgres_changes`.
- [x] No se creo `src/pages/Home.css` sin justificacion documentada.
- [ ] `npm run test:unit` y `npm run build` terminan correctamente.
- [x] El navegador verifica los casos anteriores con todas las llamadas API interceptadas y sin trafico real accidental.
- [ ] INT07: `GET /api/dashboard/indicadores` autenticado verificado contra el backend en `:3001`, con permiso real de administrador. **Pendiente.**

## Estrategia de pruebas

Reutilizar Vitest y las herramientas de navegador ya usadas en SPEC 04, 05 y 06, sin instalar dependencias.
No se ejecutan pruebas para aprobar este documento; se ejecutan durante la implementacion autorizada.

| Grupo | Casos previstos |
|---|---|
| U01 Tarjetas | Las 4 claves existen en `Indicadores`, en el orden del prototipo, con titulo, color e icono; ningun titulo afirma elegibilidad; el cuarto titulo es el del roadmap. |
| U02 Retry | `5xx` y `TypeError` reintentan una vez; `400`, `401`, `403`, `404` no reintentan; `failureCount` alto no reintenta. |
| U03 Errores | Mocks de los mensajes exactos de la tabla de errores; `recuperable` correcto por status; ninguna rama parsea texto. |
| U04 Intervalo | Visible y sin lectura en curso devuelve `15_000`; pestana oculta, lectura en curso o ambasDevuelven `false`. |
| U05 Guardas | `puedeDispararRefrescoIndicadores` con y sin lectura en curso. |
| U06 Fecha | Fecha en `es-BO`/`America/La_Paz`; instante a medianoche local; fecha no representable devuelve `Fecha no disponible`; nunca `Invalid Date`. |
| Q01 Lectura | Carga con `–` en las 4; exito con ceros reales; exito con valores altos; refresco con datos previos sin volver a `–`. |
| Q02 Refresco | Una lectura por pulsacion de `Actualizar`; etiqueta `Actualizando...`; pausa real con la pestana oculta; React Query recibe `refetchInterval: false`. |
| Q03 Errores | `5xx` sin datos, `5xx` con datos previos, `403`, `401` y red; `role="alert"` frente a `role="status"`; `Reintentar` recupera. |
| Q04 Alcance | Unica peticion a `/api/dashboard/indicadores`; ninguna otra ruta API; query string vacio. |
| Q05 Diagnostico | Contador `undefined` o no numerico en lectura confirmada: emite `console.warn` con la clave, renderiza `–` y no altera el texto de la tarjeta; sin datos sensibles en el aviso; un contador real de `0` no emite nada. |
| V01 Visual | Comparacion con `app.js:100-105`; `h1` igual al menu lateral; 1280 px, 1024 px, 768 px y 320 px; zoom 200 %; notas y fecha largas. |
| A01 Accesibilidad | Un solo `h1`; `aria-label` del grupo; iconos y punto de color con `aria-hidden`; foco visible en `Actualizar` y `Reintentar`; orden de tabulacion; teclado completo sin raton. |
| R01 Regresion | Navegacion `Inicio`, `Conductores`, `Mapa`, `Solicitudes`, `Tarifas` y `Configuracion` intactas; logout y `auth:unauthorized` intactos; polling de SPEC 05 intacto. |
| INT07 Integracion | GET autenticado con Bearer de administrador, permiso real, valores reales y `Cache-Control: no-store` en entorno autorizado. |

Los unitarios de helpers no acreditan render, foco, responsive ni anuncios.
Interceptar todas las rutas API antes de navegar, incluidas `Login`, `configuracion` y `conductores` si se visitan.
Usar datos ficticios; no crear cuentas, seeds ni migraciones para desbloquear pruebas.
No incluir mocks en codigo de produccion.
Limpiar interceptores y estado de navegador al terminar, incluso ante fallos.
Registrar fecha, resultado y evidencia saneada sin tokens, credenciales ni datos personales.

INT07 queda pendiente hasta autorizacion especifica de entorno y cuenta reales.
Mocks no acreditan autorizacion, disponibilidad de backend, CORS ni `Cache-Control: no-store`.
INT01, INT03, INT04, INT05 e INT06 conservan su estado pendiente y no se cierran con esta spec.

## Decisiones establecidas y alternativas

### Establecido por contrato o por decisiones previas

- Si: `Indicadores` central de `src/api/types.ts` y query key `['indicadores']`; evitar duplicacion de DTO y renombrar la key.
- Si: los cuatro campos son los del backend, sin envoltura y sin fecha; el backend es la autoridad.
- Si: polling de 15 s y sin Realtime; es la decision del roadmap y de la especificacion.
- Si: `requireAdmin` y el `401` existente; no duplicar la expulsion de sesion.
- Si: el esquema de query es estrictamente vacio; no anadir paginacion, orden ni filtros.
- Si: la 4.a tarjeta se rotula como el roadmap, no como el prototipo abreviado.
- No: `solicitudesCompletadas` como nombre de campo; no existe en el contrato.
- No: inferir `estado: 'aprobado'` en el frontend; los conteos los decide el backend.
- No: `Number()`, redondeos, separadores de miles o unidades; el backend entrega enteros.

### Aprobado en esta revision

- D1 a D9 quedan cerradas en la tabla de decisiones de UX aprobadas.
- Se descartan el panel de mapa, el aviso de ubicaciones, la tabla de solicitudes y «Por revisar» del prototipo.
- Se descarta el `?? 0` actual como unico tratamiento del error.
- D6 a D9 son ajustes posteriores de revision: `h1` coherente con el menu, `Actualizar` confirmado, `aria-hidden` en el punto de color y `console.warn` ante contador `undefined`. Ninguno abre alcance nuevo ni toca archivos fuera de los previstos.
- Se descarta la fecha como etiqueta de encabezado y el formateo generico de fechas compartido.
- Se descarta `src/pages/Home.css` salvo justificacion.
- No quedan preguntas abiertas de definicion para esta spec.

### Diferido

- Realtime como invalidacion: pertenece al Modulo 11 y no aplica a agregados sin eventos de base de datos.
- Historico de indicadores, tendencias y comparativas: excluidas por la especificacion seccion 6.
- Unificar la formateacion de fechas de SPEC 06 con este helper: deuda tecnica no bloqueante, en su propia spec.

## Riesgos

| Riesgo | Mitigacion o limite |
|---|---|
| El conteo de disponibles se lee como elegibilidad | Pie `Disponibilidad registrada` y prohibicion explicita de afirmar disponibilidad para recibir solicitudes; el filtro por `estado` lo decide el backend. |
| Un fallo se presenta como cuatro ceros | `informacionErrorIndicadores` mas estado de error o aviso; `?? 0` solo aplica con lectura confirmada. |
| La cuarta tarjeta sigue mostrando 0 tras corregir el nombre | El criterio de aceptacion exige `0` real distinguible de `–`, y los unitarios de U01 fijan los cuatro nombres exactos. |
| Consultar con la pestana en segundo plano | `intervaloRefrescoIndicadores` devuelve `false` sin visibilidad, replicando el patron de SPEC 05. |
| Un refetch fallido vacia las tarjetas | Nunca se borra la cache para limpiar el error; se conservan `data` y `isError` por separado. |
| Un `AbortError` de desfase de sesion se ve como error | La pantalla distingue cancelacion de fallo y no anuncia el descarte logico de `client.ts:50-52`. |
| La fecha del navegador discrepa del dia de `America/La_Paz` | Se formatea con `timeZone: 'America/La_Paz'`, no con la zona local del equipo. Riesgo residual: el instante de corte del backend no se conoce; se acepta que el pie sea informativo. |
| Codigo duplicado entre SPEC 06 y esta pantalla en fecha y errores | Ambas pantallas usan el DTO central y el `ApiError` existente; solo la fecha se duplica, de forma deliberada y documentada. |
| Sobrecarga del endpoint por polling adicional | Un unico endpoint, 15 s, pausado sin visibilidad; no hay refetch en multiples tarjetas. |
| Ampliar el alcance hacia Modulos 8 y 9 durante la implementacion | Fuera de alcance explicito y checklist de alcance con las rutas prohibidas. |

## Que NO forma parte de esta especificacion

- Implementar codigo o aportar evidencia de funcionamiento en esta entrega documental.
- El panel de mapa, el aviso de ubicaciones desactualizadas, la tabla de solicitudes activas y «Por revisar».
- Consultar cualquier endpoint distinto de `GET /api/dashboard/indicadores`.
- Graficos, historico, tendencias, exportacion, analitica avanzada o comparativas.
- Acciones de mutacion, aprobacion, rechazo, suspension o reasignacion.
- Realtime, WebSockets o `postgres_changes`, incluso como disparador de invalidacion.
- Mover o renombrar `src/pages/Home.tsx`, y crear `Home/Inicio.tsx`.
- Modificar `src/api/types.ts`, `src/api/client.ts`, `AuthContext`, `QueryClient`, `router.tsx`, `Layout.tsx`, `package.json` o `specs/.spec-config.yml`.
- Unificar la formateacion de fechas de SPEC 06 en un modulo compartido de fechas.
- Cambios de backend, contratos, base de datos, seeds, migraciones, entorno o dependencias.
- Modificar `../docs/ROADMAP_FRONTEND.md` con intenciones; su actualizacion requiere evidencia.
- Cerrar INT01, INT03, INT04, INT05, INT06 o INT07 con mocks.

Cada uno de esos, si aterriza, va en su propia spec.

## Registro de evidencia

**Fecha: 2026-10-02.** Entrega de implementacion ejecutada en la rama `spec-07-indicadores-inicio` sobre el working tree existente. Este registro reemplaza la nota de entrega documental del borrador: esta vez si se implemento, se ejecutaron pruebas, `npm run test:unit`, `npm run build` y un recorrido de navegador.

### 1. Que se implemento

| Archivo | Cambio |
| --- | --- |
| `src/lib/indicadores.ts` | Nuevo: `TARJETAS`, `CLAVE_INDICADORES`, `retryIndicadores`, `informacionErrorIndicadores`, `intervaloRefrescoIndicadores`, `puedeDispararRefrescoIndicadores`, `fechaIndicadoresParaMostrar` y los tipos que consumen. |
| `src/lib/indicadores.test.ts` | Nuevo: 46 pruebas en los grupos U01-U06. |
| `src/pages/Home.tsx` | Reescrito dentro del mismo archivo y la misma ruta (sin mover ni renombrar, sin `Home.css`). |

Decisiones relevantes:

- `CLAVE_INDICADORES = ['indicadores'] as const` se usa directamente como `queryKey` y en `useIsFetching`, de modo que la clave es exactamente `['indicadores']` y mantiene identidad estable entre renders. La unica ruta consultada es `/api/dashboard/indicadores`, sin parametros.
- La cuarta tarjeta se titula `Solicitudes completadas hoy` y su pie es `Fecha local del navegador: 02 oct 2026`, calculada con `Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz' })` sobre `new Date()` en render.
- El pie de la primera tarjeta dice `Disponibilidad registrada`, sin afirmar que los conductores esten listos para recibir solicitudes.
- `hayLecturaConfirmada` se define como `data !== undefined`, no por `isSuccess`: distingue la primera carga fallida de un refresco con datos previos. Sin lectura confirmada el error va en `role="alert"`; con lectura previa se conserva la ultima lectura y se anade un aviso `role="status"` no bloqueante con `Reintentar` cuando el error es recuperable.
- Las cancelaciones (`AbortError` y el `CancelledError` de TanStack Query) se filtran antes de decidir el estado visible, para que una peticion cancelada no se presente como error.
- La pantalla no maneja `401`: el cierre de sesion y la redireccion a `/login` siguen siendo los ya existentes en `src/api/client.ts` y `AuthContext`, sin logica duplicada. Un `403` produce `Permiso denegado` sin cerrar sesion.
- Guardas de lectura manual en dos capas: `puedeDispararRefrescoIndicadores(enCurso)` para el caso asincrono y un ref `lecturaBloqueada` que se activa de forma sincrona al pulsar, de modo que tres clics en el mismo tick producen una sola lectura. El boton queda en `disabled` mientras dura la lectura y muestra `Actualizando...`.
- `refetchInterval` se resuelve por funcion con `intervaloRefrescoIndicadores({ visible, enCurso })`: 15 s solo con la pestana visible y sin lectura en curso; `false` en cualquier otro caso, incluidos los refrescos iniciados por el usuario.
- Iconos SVG inline con `aria-hidden="true"` y `focusable="false"`; el punto de color del pie tambien lleva `aria-hidden="true"` y el significado se apoya en texto. Los colores salen de los tokens `bg-verde`, `bg-azul`, `bg-ambar` y `bg-gris` de `src/index.css`.

### 2. Pruebas unitarias

`npm run test:unit` (vitest 4.1.11), ultima ejecucion a las 12:09:33:

```
Test Files  8 passed (8)
     Tests  322 passed (322)
  Duration  1.18s
```

Desglose obtenido con el reporter JSON:

| Archivo de pruebas | Pruebas |
| --- | --- |
| `src/lib/indicadores.test.ts` | 46 (U01-U06) |
| `src/lib/configuracion.test.ts` | 86 |
| `src/lib/configuracionForm.test.ts` | 59 |
| `src/lib/vehiculoForm.test.ts` | 47 |
| `src/lib/conductores.test.ts` | 48 |
| `src/api/client.test.ts` | 29 |
| `src/hooks/use-mobile.test.ts` | 5 |
| `src/lib/conductorQueries.test.ts` | 2 (SPEC 06) |

### 3. Build

`npm run build` ejecuta `tsc -b && vite build`. La etapa de tipos falla, por lo que `vite build` no llega a ejecutarse dentro de ese comando:

```
src/pages/Conductores/Detalle.tsx(52,9): error TS6133: 'botonCancelar' is declared but its value is never read.
src/pages/Conductores/Detalle.tsx(53,9): error TS6133: 'botonDescartar' is declared but its value is never read.
src/pages/Conductores/Detalle.tsx(54,9): error TS6133: 'botonCerrar' is declared but its value is never read.
```

- Los tres errores pertenecen al trabajo sin commit de SPEC 06 en `src/pages/Conductores/Detalle.tsx`, archivo excluido del alcance de esta spec, por lo que no se tocaron ni se revirtieron.
- `npx tsc -b --force` devuelve exactamente los mismos tres errores y ninguno pertenece a SPEC 07.
- `npx vite build` aislado termina correctamente: 183 modulos en 3.15 s, con el aviso preexistente de un chunk superior a 500 kB (503.86 kB).
- `package.json` no define script de lint, asi que no hay lint que ejecutar.
- `git diff --check` no reporta errores de espacios.

### 4. Navegador

Todas las llamadas se sirvieron con mocks: se instalo `context.route('**/*')` antes de cualquier navegacion, se bloquearon los service workers, se abortaron los origenes externos y se usaron contextos aislados por escenario con datos ficticios. Ninguna peticion real alcanzo la red y en ningun momento se conecto al backend de `:3001`. Playwright se ejecuto desde la cache temporal con el Chrome ya instalado en el sistema, sin tocar dependencias del proyecto.

Resultado de la corrida completa: **12 escenarios, 12 PASS, 0 FAIL**.

| Escenario | Resultado |
| --- | --- |
| Q01/Q02 lectura, cero real, valores altos y refresco con datos previos | PASS |
| Q02 una lectura por pulsacion y guardas Actualizar/Reintentar | PASS |
| Q02 polling cada 15 s con pestana visible y pausa real con pestana oculta | PASS |
| Q03 5xx sin datos previos, con datos previos, 403, red y 401 | PASS |
| Q03 error de red sin datos previos muestra alerta con Reintentar | PASS |
| Q03 403 en carga inicial muestra el mensaje sin cerrar sesion | PASS |
| Q03 peticion cancelada por React Query no se muestra como error | PASS |
| Q04 una unica ruta API y sin query string | PASS |
| Q05 contador no numerico avisa y renderiza guion; un 0 real no avisa | PASS |
| V01 anatomia, colores, responsive 1280/1024/768/320 y zoom 200 % | PASS |
| A01 h1 unico, aria-label, aria-hidden, teclado y foco visible | PASS |
| R01 navegacion, logout, auth:unauthorized y polling de SPEC 05 | PASS |

En V01 la pausa del polling se comprobo de forma directa, no por suposicion: se registro la programacion de temporizadores de `window.setTimeout` en el rango de 14-16 s y se exigio que no hubiera ninguno con la pestana oculta. Las capturas (`home-1280.png`, `home-1024.png`, `home-768.png`, `home-320.png`, `home-zoom200.png`) quedaron fuera del repositorio, en el directorio temporal de la sesion.

### 5. Incidencias y correcciones

1. La primera corrida aborto por un fallo del propio arnes, `ReferenceError: state is not defined` por alcance incorrecto en el helper de escenario. Se corrigio el arnes; la aplicacion no estaba afectada.
2. La segunda corrida fallo en la guarda de lectura manual: tres clics rapidos en el mismo tick produjeron tres lecturas. Esta vez si era un defecto real de la pantalla, porque el estado `disabled` de React no se actualiza hasta el siguiente render. Se anadio el ref sincrono `lecturaBloqueada` y el escenario paso a PASS.
3. La emulacion de zoom con la propiedad CSS `zoom` no reproducia el escalado real del navegador. Se sustituyo por un viewport de 640 px CSS con `deviceScaleFactor: 2`; el escenario paso a PASS.
4. El foco programatico con `.focus()` no activaba `:focus-visible` en Chromium headless, por lo que la asercion de foco visible era falsa. Se cambio la navegacion a pulsaciones reales de `Tab`; el escenario paso a PASS.
5. Tres expectativas erroneas del arnes: el aviso con datos previos se comprobaba como `alert` cuando es `role="status"`, y en R01 se programaba el `401` antes de la carga inicial de Inicio, lo que cerraba la sesion antes de poder medir nada. Tambien se corrigio el mensaje que devolvia un mock. Eran fallos de la prueba, no del codigo.

### 6. Criterios que quedan sin marcar

- `npm run test:unit` y `npm run build` terminan correctamente: las unitarias pasan (322/322), pero el build falla por los tres errores TS6133 de SPEC 06 descritos arriba. La casilla queda sin marcar de forma deliberada.
- INT07: sigue pendiente. Exige `GET /api/dashboard/indicadores` autenticado contra el backend real en `:3001` con permiso de administrador, y en esta entrega todo el trafico fue simulado.

### 7. Riesgos y limitaciones

- **Ambiguedad del requisito D9.** El enunciado pide conservar `data?.[clave] ?? 0` y, a la vez, renderizar `–` ante valores no numericos. No se pueden cumplir las dos cosas: con `?? 0` un `undefined` se muestra como `0`. Se implemento el comportamento verificable, el que exigen el criterio de aceptacion y el escenario Q05: si el valor no es un `number`, se emite `console.warn` con la clave exacta y se renderiza `–`; un `0` real se muestra como `0` y no genera aviso.
- **Comparacion visual no pixel a pixel.** La revision contra el prototipo se hizo por estructura del DOM, estilos computados, colores resueltos desde los tokens, numero de columnas y deteccion de desbordamiento horizontal, no por comparacion de imagenes. Conviene una revision visual humana de las capturas si el diseno pixel-exacto es un requisito duro.
- **Sin lector de pantalla.** No se ejecuto ninguna prueba con lector de pantalla, segun lo indicado. La accesibilidad quedo cubierta solo por DOM, navegacion con teclado, foco visible y roles.
- El polling de 15 s y la pausa por pestana oculta se validaron con ventanas cortas de observacion y con inspeccion de temporizadores, no esperando el ciclo completo de 15 s en cada iteracion.
- `403` y `404` comparten tratamiento (mensaje del servidor, no recuperable). Si el backend distingue ambos casos en el texto, esa distincion llega desde `ApiError.message` sin logica adicional aqui.
