# SPEC 05 - Conductores: listado y gestion de estados

> **Estado:** Implementado y verificado con mocks; INT05 pendiente.
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 02 (`02-autenticacion-admin.md`, INT01 pendiente) y SPEC 03 (`03-shell-y-navegacion.md`, INT03 pendiente).
> **Contrato externo:** `../backend/specs/06-conductores-vehiculos.md` (implementado).
> **Fecha:** 2026-09-30
> **Revisado por el usuario:** 2026-09-30. Las 13 preguntas de la seccion de preguntas abiertas quedaron respondidas y las decisiones D1-D5 confirmadas.
> **Objetivo:** Reemplazar el stub de `/conductores` por el listado real de conductores en cuatro pestañas por estado, con busqueda local y las cuatro transiciones de estado confirmadas por el administrador.

## Contexto y fuentes

Esta especificacion registra el alcance del modulo 5 del roadmap, las decisiones confirmadas
durante la revision, su implementacion autorizada posteriormente y el bloqueo de contrato diferido.
El prototipo orienta la presentacion; el contrato del backend define el comportamiento.

| Fuente | Uso |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:272-335` | Alcance, GET con `?estado=`, las cuatro transiciones, columnas, pestañas, diseno y criterios del modulo 5. |
| `../docs/ROADMAP_FRONTEND.md:729-732` | Modulos 2, 3 y 4 implementados con mocks; INT01, INT03 e INT04 siguen pendientes. |
| `../backend/specs/06-conductores-vehiculos.md:87-139,172-204` | Contrato del listado, transiciones estrictas, errores y decisiones descartadas. |
| `../backend/src/modules/conductores/conductores.service.ts:6-31,60-84` | Maquina de estados de fuente unica y lectura del listado. |
| `../backend/src/modules/conductores/conductores.controller.ts:43-70` | Validacion del filtro y respuestas HTTP de las transiciones. |
| `../backend/src/modules/conductores/conductores.router.ts:18-23` | Listado y transiciones exigen administrador. |
| `../docs/REGLAS_DE_NEGOCIO.md:19-20,25` | Reglas 12 y 13. |
| `references/pantallas/conductores.html` y `references/pantallas/app.js:120-132,228-232` | Composicion visual. Sus extras se descartan de forma expresa. |
| `src/pages/Conductores/Lista.tsx:1-10` | Stub a reemplazar; conserva su titulo y su descripcion. |
| `src/pages/Conductores/Detalle.tsx:1-10` | Stub del modulo 6; esta pantalla no lo implementa. |
| `src/router.tsx:23-26` | `/conductores` y `/conductores/:id` ya existen dentro del area protegida. |
| `src/api/types.ts:1-3,22-45` | Enums, `Vehiculo`, `ConductorListado` y `ConductorDetalle` ya definidos. |
| `src/api/client.ts:15-63` | Bearer, `ApiError` con `status` y `message`, PATCH sin body y aislamiento por sesion. |
| `src/context/AuthContext.tsx:18-33` | Cierre de sesion con `cancelQueries` + `clear` y correlacion del 401. |
| `src/components/EstadoBadge.tsx:1-34` | Badge compartido; faltan cuatro claves de jornada y disponibilidad. |
| `src/components/ui/button.tsx`, `src/components/ui/alert.tsx`, `src/hooks/use-mobile.ts:4-13` | Componentes y breakpoint movil existentes. |
| `src/App.tsx:6-10` | `retry: 1` y `refetchOnWindowFocus: false` globales. |
| `src/pages/Configuracion.tsx:205-240` | Patron de referencia: evitar efectos tardios entre sesiones y reconciliar cache tras una escritura. |
| `src/index.css:3-26` | Paleta TaxiSur, azul oscuro y Segoe UI. |
| `specs/03-shell-y-navegacion.md`, `specs/04-configuracion-empresa.md` | Convenciones, verificacion simulada e integraciones pendientes. |

La tabla de transiciones de `conductores.service.ts` y el contrato de `../backend/specs/06-conductores-vehiculos.md`
prevalecen sobre el diagrama ambiguo de `../docs/REGLAS_DE_NEGOCIO.md:25`
(`pendiente → aprobado / rechazado → suspendido`), que puede leerse como una cadena que pasa por `rechazado`.
La lectura vigente es la de fuente unica del servicio: `rechazado` no tiene transiciones de salida.

## Decisiones confirmadas por el usuario

El usuario confirmo D1-D5 el 2026-09-30 y completo las decisiones con sus 13 respuestas y
las mejoras descritas a continuacion. La aprobacion del documento no autoriza iniciar codigo.

| ID | Decision confirmada | Motivo | Alcance del cambio si se revisa |
|---|---|---|---|
| D1 | Busqueda local por nombre, telefono y placa, sin paginacion local ni contadores por estado o globales. Se permite el pie local `Mostrando X de Y`. | Alcance confirmado; el endpoint filtrado solo permite contar la lista recibida. | Una paginacion local seria una nueva decision de frontend; paginar desde el servidor requeriria ampliar el contrato. |
| D2 | Vista inicial en `Pendientes` con las cuatro pestanas obligatorias (Pendientes, Aprobados, Rechazados, Suspendidos) y sin pestana `Todos`. | El trabajo diario del administrador es revisar pendientes; el roadmap deja `Todos` como opcional. | Anadir `Todos` es un estado mas de la misma clave de consulta, sin endpoint nuevo. |
| D3 | Refresco automatico cada 15 s mientras la pantalla este visible, refresco tras cada transicion y boton `Actualizar`. Sin Realtime. | Las cuentas pendientes cambian por el registro publico y el administrador no debe recargar a mano. | El intervalo se ajusta en un solo lugar; Realtime pertenece al modulo 11. |
| D4 | Tarjetas en movil y tabla en escritorio, con los mismos datos y las mismas acciones, con breakpoint en 1024 px. En movil las acciones van en botonera al pie de la tarjeta, no en menu. | El prototipo no tiene version movil de esta tabla y el shell ya define 1024 px como breakpoint. Una botonera mantiene las acciones alcanzables a 320 px sin abrir un menu. | Es una decision de presentacion; los datos y las acciones no cambian. |
| D5 | Verificacion con unitarios y navegador usando respuestas simuladas; la integracion real queda registrada como INT05. | Mantiene el alcance de verificacion de SPEC 03 y SPEC 04 y no declara cierre de integracion. | Verificar contra el backend real exige entorno y cuenta autorizados. |

## Decisiones tecnicas adoptadas

Derivan del contrato verificado, de los patrones ya establecidos en SPEC 03 y SPEC 04 y de las
mejoras aceptadas por el usuario el 2026-09-30.

| ID | Decision | Motivo |
|---|---|---|
| T1 | Clave `['conductores', { estado }]` y siempre `?estado=` con uno de los cuatro valores. | Una clave por pestaña hace que cambiar de pestaña sea un cambio de key. Omitir el filtro devolveria los cuatro estados mezclados y no hay pestana que lo pida (D2). |
| T2 | Solo tras un `200`, retirar por id la fila de la cache de la pestana de origen con `setQueryData` y despues invalidar `['conductores']`. En error, invalidar sin retirar anticipadamente la fila. | Mejora (a): evita esperar al refetch para retirar una fila cuya transicion ya esta confirmada. No se inserta el `ConductorDetalle` en otras pestanas ni se fabrica cache ausente; el refetch reconcilia los datos. Cancelar o descartar lecturas anteriores antes de actualizar cache evita que repongan la fila. |
| T3 | Confirmacion nativa `window.confirm` con un texto por accion y el nombre del conductor. | El roadmap exige confirmacion nativa; el prototipo usa un modal propio que no se incorpora. Respuesta 10 de la revision: un texto especifico por accion, no uno generico. |
| T4 | Opciones locales de la consulta: `enabled: estaAutenticado`, `retry: retryConductores` (como maximo un reintento automatico y solo para red/5xx) y `refetchInterval` como funcion, con pausa por visibilidad y por transicion en curso. | Reutiliza el patron de `src/lib/configuracion.ts:45-49` sin cambiar los valores globales de `QueryClient`. Mejoras (b) y (e) del usuario. |
| T5 | La mutacion no tiene reintento automatico y no escribe cache de forma optimista. | Una transicion no debe repetirse sola; el 409 del servidor es la senal de que el estado real ya no es el esperado. |
| T6 | Logica pura y testeable en `src/lib/conductores.ts`: clave, ruta, reintento, error, normalizacion, filtro, matriz de acciones, textos de confirmacion y etiquetas. | Los helpers aislados cubren reglas deterministas; el comportamiento de React, foco y navegacion se verifica en navegador. |
| T7 | `EstadoBadge` se amplia con `no_iniciada`, `activa`, `no_disponible` y `solicitud_pendiente`. No se elimina ninguna clave existente. | Las claves actuales las usan los modulos 8, 9 y 10; quitarlas seria una regresion futura. |
| T8 | `403` muestra permiso denegado sin cerrar sesion; `401` conserva el cierre de sesion existente. | Mismo criterio que SPEC 03: solo el backend autoriza y el 401 es el unico que expulsa. |
| T9 | La pestana activa y el texto de busqueda viven en el estado del componente y no se persisten. | Respuesta 8 de la revision: confirmar que la busqueda se pierde al recargar. No existe versionado de preferencias y el roadmap no lo pide. |
| T10 | La tabla es HTML semantico dentro de `Lista.tsx`; no se agrega un componente `table` compartido. | Solo esta pantalla necesita tabla; los modulos 9 y 10 pueden reutilizar o extraer el patron mas adelante. |
| T11 | `nombreParaMostrar` devuelve `(sin nombre)` cuando `nombreCompleto` llega vacio, en blanco o ausente. | Mejora (c) del usuario. El contrato declara `nombreCompleto` como `z.string()` no nulo, pero la pantalla no debe renderizar una celda en blanco ni inventar un nombre. El mismo valor se usa en la tabla, la tarjeta, el `aria-label` de las acciones y los textos de confirmacion, para que la fila sea identificable por teclado. |
| T12 | El polling se detiene con `document.visibilityState !== 'visible'` y mientras haya alguna transicion en curso. Pausar tambien en `pagehide` y reevaluar en `pageshow` y `visibilitychange`. | Mejoras (b) y (e): usar las senales de visibilidad/ciclo de vida disponibles al bloquear el movil, sin prometer detectar directamente el bloqueo fisico. Reanudar solo con la pagina visible y sin mutaciones pendientes. La pausa no cancela por si sola lecturas ya iniciadas; estas se concilian segun T2. |
| T13 | `aria-busy` se aplica solo durante el refresco manual (`Actualizar` o `Reintentar`) y durante una transicion en curso. | Mejora (f) del usuario. El polling silencioso de 15 s no debe anunciar actividad ni interrumpir a quien esta leyendo o usando el teclado; el badge de recarga se reserva a la accion deliberada. |
| T14 | `intervaloRefresco({ visible, hayTransicionEnCurso })` y `quitarConductor(lista, id)` son funciones puras en `src/lib/conductores.ts`. | Las dos reglas nuevas de T2 y T12 son deterministas y deben quedar cubiertas por unitarios, no solo por observacion en navegador. |
| T15 | El punto (d) propuesto por el usuario no se implementa. Queda registrado como bloqueo de contrato en su propia seccion. | El contrato de lectura no expone si el `Usuario` esta eliminado logicamente. |

## Alcance

**Incluye:**

- Reemplazar el stub de `src/pages/Conductores/Lista.tsx` por el listado real.
- Cuatro pestañas por estado, con `Pendientes` como vista inicial.
- Lectura con `GET /api/conductores?estado=<estado>` y clave por pestana.
- Busqueda local por nombre, telefono y placa sobre la lista de la pestana activa.
- Las cuatro transiciones con confirmacion nativa, ejecucion sin body y refresco del listado.
- Presentacion de `estado`, `estadoJornada`, `estadoDisponibilidad` y placa con `EstadoBadge`.
- Columnas: nombre, telefono, estado, jornada, disponibilidad, vehiculo (placa) y acciones.
- Un nombre vacio se muestra como `(sin nombre)` en lugar de una celda en blanco.
- Estados de carga, error con reintento y vacio diferenciados, incluido el vacio por busqueda.
- Refresco periodico de 15 s con la pantalla visible, en pausa con la pantalla oculta y durante
  una transicion, refresco tras cada transicion y boton `Actualizar`.
- Pie de resultados con `Mostrando X de Y`, donde `X` son las filas visibles tras el filtro y `Y` las
  filas de la pestana activa. No es un total global.
- Un error de lectura conserva la lista previa en pantalla, acompanada de un aviso que la declara
  desactualizada.
- Movil: una tarjeta por conductor con las acciones en botonera al pie, sin menu desplegable.
- Pruebas unitarias de la logica pura y comprobaciones de navegador con respuestas simuladas.

**Fuera de alcance:**

- Modulo 6: detalle del conductor y edicion de vehiculo (`GET /api/conductores/:id`, `PATCH .../vehiculo`).
- Registro publico de conductores (`POST /api/conductores`) y cualquier alta desde el panel.
- Alta, edicion o baja de vehiculos; con `vehiculo: null` la pantalla solo informa que no hay vehiculo.
- Notificaciones reales, WhatsApp, push o n8n. El backend tiene un stub en `aprobar` y `rechazar`.
- Realtime, WebSocket o suscripcion a eventos (modulo 11).
- Paginacion, ordenamiento por columnas, filtros por jornada o disponibilidad y contadores por estado.
- Contar o totalizar los cuatro estados a la vez: el listado filtrado no permite conocer el total.
- Cambiar jornada o disponibilidad: el servicio solo actualiza `estado` (Regla 12 se cumple como cambio de estado).
- Finalizar servicios, interrumpir servicios en curso o cualquier otra accion operativa.
- Ubicaciones, mapa y columna `Unidad` del prototipo: no existen en `ConductorListado`.
- Enlace al detalle del conductor: el nombre se muestra como texto plano. Respuesta 6 de la
  revision: el enlace queda desactivado hasta que exista el modulo 6. Respuesta 7: cuando exista,
  sera solo el nombre y no la fila entera, para no interferir con el clic en las acciones.
- Enlace a edicion o alta de vehiculo desde `Sin vehiculo`. Respuesta 12: texto plano.
- Ocultar el telefono cuando el `Usuario` este eliminado logicamente. Ver la seccion de bloqueo de
  contrato; el frontend no dispone de la senal.
- Cambios en backend, esquema, seeds, migraciones, entorno o dependencias nuevas.
- Cerrar INT01, INT03, INT04 ni INT05. INT05 se registra en esta entrega.

## Bloqueo de contrato: usuario eliminado logicamente

El usuario propuso ocultar el telefono y mostrar `(usuario eliminado)` cuando el `Usuario` esta
eliminado logicamente, por no exponer datos de una cuenta dada de baja. **No es implementable en
esta entrega.** Se verifico el backend:

| Evidencia | Conclusion |
|---|---|
| `../backend/src/modules/conductores/conductores.service.ts:22` | `listarConductores` selecciona `usuario: { select: { telefono: true } }` sin filtro `eliminadoEn`, asi que el telefono se entrega tambien para un `Usuario` eliminado. |
| `../backend/src/modules/conductores/conductores.schema.ts:51` | `listadoConductorDtoSchema` es `conductorDetalleDtoSchema.omit({ usuarioId: true })`. No contiene ningun campo que indique si el `Usuario` esta eliminado. |
| `../backend/src/modules/conductores/conductores.service.ts:29-31` | El mapeo a DTO solo reordena campos; no anade ningun indicador de baja. |

El frontend no puede distinguir los dos casos con los datos disponibles. Se descarto la heuristica
por telefono vacio: `telefono: z.string()` admite una cadena vacia, pero esa cadena no prueba
que el usuario este eliminado. La heuristica daria una falsa sensacion de proteccion.

El usuario autorizo expresamente omitir (d) y documentar el bloqueo, sin modificar el backend.

**Consecuencia en esta entrega:** el telefono se muestra tal cual llega, tambien para un `Usuario`
eliminado logicamente. La mitigacion real es del lado del backend.

**Requisito para cerrarlo, fuera de este alcance:** acordar un cambio de contrato que permita
identificar la baja y suprima el telefono en el servidor para no exponerlo en la respuesta.
Un indicador como `usuarioEliminado` es una alternativa a evaluar, no un campo aprobado.

## Modelo de datos y contratos

No se agregan estructuras persistentes ni DTO nuevos.
Se reutilizan `ConductorListado`, `ConductorDetalle`, `Vehiculo` y los enums de `src/api/types.ts:1-3,22-45`.

### Lectura

`GET /api/conductores?estado=pendiente|aprobado|rechazado|suspendido` exige administrador y devuelve
`200` con `ConductorListado[]`, ordenado por `creadoEn` ascendente y sin desempate.

| Campo | Tipo | Presentacion |
|---|---|---|
| `id` | string (UUID) | No se muestra. Es el identificador de la ruta de transicion. |
| `nombreCompleto` | string | Columna principal. Si llega vacio, se muestra `(sin nombre)` (T11). No es un enlace mientras el modulo 6 no exista. |
| `telefono` | string | Se muestra tal cual, tambien si el `Usuario` esta eliminado logicamente. Ver el bloqueo de contrato. |
| `cedulaIdentidad` | string | No se muestra en el listado; pertenece al detalle del modulo 6. |
| `estado` | `EstadoConductor` | Badge de la pestana activa. |
| `estadoJornada` | `EstadoJornada` | Badge con etiqueta en espanol. |
| `estadoDisponibilidad` | `EstadoDisponibilidad` | Badge con etiqueta en espanol. |
| `creadoEn` | string ISO | No se muestra; el orden lo decide el servidor. |
| `vehiculo` | `Vehiculo \| null` | Placa; si es `null`, `Sin vehiculo` como texto plano, sin enlace a edicion. |

El listado no incluye `usuarioId` y la respuesta de una transicion si lo incluye.
Esa diferencia es la razon de T2: la cache del listado nunca recibe un `ConductorDetalle`.

El esquema de consulta del backend es estricto: enviar cualquier clave ademas de `estado` devuelve `400`.
Esta pantalla envia unicamente `estado`.

### Transiciones

Las cuatro rutas son `PATCH` sin body, exigen administrador y responden `200` con `ConductorDetalle`.
El cliente ya permite `PATCH` sin cuerpo mediante `http.patch<T>(path)`.

| Accion | Ruta | Desde | Hacia | Fila donde se ofrece |
|---|---|---|---|---|
| Aprobar | `/api/conductores/:id/aprobar` | `pendiente` | `aprobado` | Pendientes |
| Rechazar | `/api/conductores/:id/rechazar` | `pendiente` | `rechazado` | Pendientes |
| Suspender | `/api/conductores/:id/suspender` | `aprobado` | `suspendido` | Aprobados |
| Reactivar | `/api/conductores/:id/reactivar` | `suspendido` | `aprobado` | Suspendidos |

`rechazado` no ofrece ninguna accion: no existe reactivacion desde `rechazado` en el contrato.

| Respuesta | Comportamiento requerido |
|---|---|
| `200` | Retirar la fila de la cache de origen con `setQueryData`, confirmar visualmente la transicion e invalidar `['conductores']`. |
| `400` | No deberia ocurrir: la pantalla solo envia ids que ya estan en la lista. Mostrar `ApiError.message` si llegara. |
| `401` | Mantener el cierre de sesion y la redireccion existentes. |
| `403` | Mostrar permiso denegado con `ApiError.message`; no cerrar sesion ni reintentar. |
| `404` | El id no existe, esta eliminado o no tiene forma de UUID. Mostrar el mensaje del servidor y refrescar la lista. |
| `409` | Mostrar `ApiError.message`, que ya trae el estado actual interpolado, y refrescar la lista igualmente. |
| `5xx` o red | Mostrar error, conservar la fila en su estado actual y refrescar la lista. |

El 409 no es un fallo transitorio: significa que la vista esta desincronizada del servidor.
Por eso el refresco es obligatorio tambien en error.

### Estado de la interfaz

Tipos de estado local, no estructuras de negocio:

```ts
type Accion = 'aprobar' | 'rechazar' | 'suspender' | 'reactivar'
type ConductorFiltro = { texto: string }
```

La cache de React Query es la unica fuente de la lista en pantalla. `ConductorListado` no se copia
a un store local ni a `localStorage`.

### Funciones puras previstas

En `src/lib/conductores.ts`, sin dependencias de React:

| Funcion | Responsabilidad |
|---|---|
| `claveConductores(estado)` | Devuelve `['conductores', { estado }]`. |
| `rutaConductores(estado)` | Construye `/api/conductores?estado=<valor>`. |
| `rutaTransicion(id, accion)` | Construye `/api/conductores/:id/<accion>`. |
| `retryConductores(failureCount, error)` | Un reintento automatico solo para red y `>= 500`; ninguno para `401`, `403`, `409` u otros. |
| `informacionErrorConductores(error)` | Mensaje y si el error es recuperable, siguiendo `informacionErrorConfiguracion`. |
| `mensajeErrorTransicion(error)` | Mensaje de una transicion fallida, con el `409` y el `404` diferenciados. |
| `normalizarTexto(texto)` | Recorta y pasa a minusculas. Se usa para el nombre. |
| `normalizarDigitos(texto)` | Ademas quita espacios y guiones. Se usa para telefono y placa. |
| `hayTerminoBusqueda(termino)` | Distingue busqueda vacia de un termino real. |
| `filtrarConductores(lista, texto)` | Coincidencia por inclusion sobre `nombreCompleto` con `normalizarTexto` y sobre `telefono` y `vehiculo.placa` con `normalizarDigitos`. |
| `accionesPorEstado(estado)` | Devuelve las acciones disponibles para ese `estado`. |
| `textoConfirmacion(accion, nombre)` | Texto de `window.confirm` por accion, con el nombre del conductor. |
| `mensajeExitoTransicion(accion, nombre)` | Confirmacion visible de la transicion ejecutada. |
| `nombreParaMostrar(nombre)` | Nombre recortado o `(sin nombre)` (T11). |
| `etiquetaVehiculo(vehiculo)` | Placa o `Sin vehiculo`. |
| `mensajePestanaVacia(estado)` | Texto de la pestana vacia: `No hay conductores <estado en plural>`. |
| `mensajeBusquedaVacia(termino)` | Texto del vacio por busqueda, con el termino entrecomillado. |
| `resumenResultados(visibles, total)` | Pie `Mostrando X de Y` de la pestana activa. |
| `quitarConductor(lista, id)` | Retira la fila de la cache de la pestana (mejora a). |
| `intervaloRefresco({ visible, hayTransicionEnCurso })` | Devuelve `15_000` o `false` (mejoras b y e). |
| `puedeDispararRefresco(enCurso)` | Guarda compartida por `Actualizar` y `Reintentar`. |

`filtrarConductores` con texto vacio devuelve la lista completa sin reordenar.
No se ordena en el frontend: el orden por `creadoEn` ascendente es del servidor y no tiene desempate.

No se exige normalizacion de acentos en este alcance; las reglas confirmadas son las de la tabla.

## Comportamiento de la pantalla

### Estructura

1. Titulo `Conductores` y la descripcion actual del stub.
2. Fila de control: cuatro pestañas y, a la derecha, el boton `Actualizar`.
3. Campo de busqueda con etiqueta visible y placeholder que nombre los tres criterios.
4. Resultados: tabla en escritorio, tarjetas en movil, con los mismos datos y acciones.
5. Pie `Mostrando X de Y`: filas visibles tras el filtro frente a filas recibidas de la pestana activa.
   Se muestra tambien con cero coincidencias o lista vacia confirmada, pero no inventa un total
   durante carga inicial ni error sin datos.

Las cuatro pestañas se renderizan siempre, incluso con error o carga, para que el estado del filtro
sea visible. Sus textos son `Pendientes`, `Aprobados`, `Rechazados` y `Suspendidos`.
No hay contadores por pestana (D1).

### Matriz de estados y acciones

| `estado` | Badge | Acciones disponibles |
|---|---|---|
| `pendiente` | Pendiente | Aprobar, Rechazar |
| `aprobado` | Aprobado | Suspender |
| `rechazado` | Rechazado | Ninguna; se informa que no admite transiciones. |
| `suspendido` | Suspendido | Reactivar |

Las acciones se derivan del `estado` de la fila, no de la pestana, para que un dato desactualizado
no ofrezca una transicion invalida. Mientras la transicion de una fila esta en curso, sus acciones
se deshabilitan; las demas filas siguen usables. No hay dos transiciones simultaneas sobre la misma fila.

### Filtro y busqueda

- El filtro se aplica a la lista ya recibida de la pestana activa. No genera peticiones ni cambia la clave.
- La busqueda es por inclusion y no distingue mayusculas; telefono y placa ignoran espacios y guiones.
- Un termino compuesto solo de espacios equivale a busqueda vacia.
- El texto de busqueda no se persiste: recargar la pantalla lo vacia (T9).
- Limpiar la busqueda no cambia la pestana ni dispara peticiones.

### Carga, error y vacio

| Situacion | Comportamiento |
|---|---|
| Carga inicial de la pestana | Estado de carga con el titulo de la pantalla conservado; no se muestran filas inventadas. |
| Refresco manual con datos en pantalla | Las filas permanecen visibles y la region de resultados queda `aria-busy="true"`. |
| Polling silencioso | Conserva las filas sin activar `aria-busy` ni anunciar cada ciclo de recarga. |
| Lista vacia sin busqueda | `No hay conductores <estado>`. Sin accion para crearlos: el registro es publico y ajeno al panel. |
| Lista vacia con busqueda | `Sin resultados para «<texto>»` y un boton `Limpiar busqueda`. |
| Fila sin vehiculo | `Sin vehiculo` en la celda o tarjeta. No hay enlace a crear ni a editar. |
| Nombre vacio o en blanco | `(sin nombre)` en tabla, tarjeta, confirmaciones y nombres accesibles de acciones. |
| `403` | Permiso denegado con el mensaje del servidor; sin reintento automatico y sin cerrar sesion. |
| `400` | Se muestra `ApiError.message`; indica un filtro invalido, que esta pantalla no produce. |
| `401` | Cierre de sesion y redireccion existentes, sin CSS propio que los impida. |
| `5xx` o red | Aviso recuperable y boton `Reintentar`; como maximo un reintento automatico. |
| Respuesta tardia de otra sesion | No afecta cache, avisos ni la sesion vigente, por las protecciones de `src/api/client.ts:48-52`. |

Un error de lectura conserva visible la lista previa de la misma pestana y sesion, con un aviso
de que puede estar desactualizada. Si no hay datos previos, se muestra el error, no un vacio exitoso.

El boton `Reintentar` y el boton `Actualizar` ejecutan el mismo refresco; `Reintentar` aparece solo
cuando hay error. Ambos se deshabilitan mientras hay una peticion en curso.

### Refresco

- `refetchInterval` de 15 s, en pausa cuando `document.visibilityState !== 'visible'`, al ocultarse
  por bloqueo del movil o mientras haya al menos una mutacion en curso. Aplicar T12 al volver.
- Tras un `200`, cancelar o descartar lecturas anteriores y retirar la fila por id de la cache de
  origen con `setQueryData`, sin esperar al refetch. Si se cambio de pestana, no retirar otras filas.
- Se invalida `['conductores']` tras cada transicion, con exito o con error.
- Los refrescos de conciliacion son distintos del polling; no reanudan el intervalo mientras
  queden mutaciones pendientes. Una lectura anterior no puede revertir una transicion confirmada.
- El boton `Actualizar` invalida `['conductores']` sin cambiar de pestana.
- Cambiar de pestana monta la clave correspondiente y realiza su propia lectura.
- No hay dos peticiones simultaneas para la misma clave: React Query deduplica las que esten en curso.
- Las opciones globales de `QueryClient` no se modifican.

### Ejecucion de una transicion

1. El administrador pulsa la accion de la fila.
2. Se muestra la confirmacion nativa con la accion y el nombre; si se cancela, no hay peticion.
3. Se deshabilitan las acciones de esa fila y se anuncia el inicio con `aria-busy`.
4. Se ejecuta el `PATCH` de la ruta correspondiente, sin body.
5. En exito y solo para la sesion vigente, descartar lecturas anteriores y retirar la fila por id
   con `setQueryData` de la clave de origen capturada al iniciar la accion.
6. Anunciar la confirmacion con `role="status"` e invalidar `['conductores']`. La fila ya no aparece
   mientras se espera la conciliacion; no se inserta artificialmente en otra pestana.
7. Si el elemento que tenia el foco desaparece, el foco pasa a la region de resultados con `tabIndex={-1}`.
8. En error, se muestra `ApiError.message` con `role="alert"`, se refresca la lista y la fila
   conserva sus acciones si el estado mostrado sigue siendo valido. No se retira de cache por error.

Un 409 puede contener el estado actual ya interpolado en el mensaje del servidor; se muestra tal cual,
sin reescribirlo ni deducir el estado desde el texto.

Suspender cambia solo `estado`. No finaliza servicios, no cambia jornada ni disponibilidad, y la
pantalla no insinua lo contrario (Regla 12).

### Diseno responsive

- Escritorio (`>= 1024 px`): tabla con las columnas nombre, telefono, estado, jornada, disponibilidad,
  vehiculo y acciones. `useIsMobile()` de `src/hooks/use-mobile.ts` decide el modo.
- Movil (`< 1024 px`): una tarjeta por conductor con nombre, telefono, badges de estado, jornada y
  disponibilidad, placa o `Sin vehiculo`, y las mismas acciones en botonera al pie, no en menu.
- Nombre y `Sin vehiculo` son texto plano. No hay navegacion desde la fila hasta el modulo 6;
  cuando se habilite el detalle, el enlace sera solo el nombre, no la fila completa.
- Ninguna variante agrega ni oculta un campo respecto de la otra, salvo el orden de lectura.
- A 320 px no hay scroll horizontal; los botones mantienen su altura minima de 44 px de `Button`.
- Un nombre de 100 caracteres o una placa larga no desbordan su celda ni la tarjeta.
- Se conservan la paleta TaxiSur, el azul oscuro y Segoe UI de `src/index.css:3-26`.

### Accesibilidad

- Las pestañas son un grupo de botones con `aria-pressed`; la activa se distingue tambien por estilo,
  no solo por color.
- El campo de busqueda tiene `Label` asociado por `id`; el valor anunciado es el texto mecanico.
- La tabla declara su encabezado con `<th scope="col">` y la region de resultados con un nombre accesible.
- La cantidad de resultados se anuncia con `role="status"` al cambiar de pestana o de filtro.
- Los errores usan `role="alert"`; las confirmaciones de transicion, `role="status"`.
- Solo durante una transicion o refresco manual la region queda `aria-busy="true"`.
  El polling silencioso no activa este atributo ni anuncia actividad repetitiva.
- Todos los controles son alcanzables y operables por teclado, incluido Tab dentro de las acciones de fila.
- El nombre es texto plano, sin enlace ni foco interactivo simulado hasta el modulo 6.
- Si el elemento con el foco se desmonta tras un refresco, el foco se traslada a la region de resultados.

## Archivos previstos

| Archivo | Cambio |
|---|---|
| `specs/05-conductores-listado-estados.md` | Esta especificacion; decisiones, criterios y evidencia futura. |
| `src/pages/Conductores/Lista.tsx` | Sustituye el stub: pestanas, busqueda, tabla/tarjetas, transiciones, estados y accesibilidad. |
| `src/lib/conductores.ts` | Funciones puras de clave, ruta, reintento, error, filtro, acciones, confirmacion y etiquetas. |
| `src/lib/conductores.test.ts` | Pruebas unitarias de esas reglas. |
| `src/components/EstadoBadge.tsx` | Anade `no_iniciada`, `activa`, `no_disponible` y `solicitud_pendiente`; no elimina claves. |
| `../docs/ROADMAP_FRONTEND.md` | Actualiza el estado del modulo 5 solo cuando exista evidencia, y registra INT05. |

No se modifican `src/router.tsx`, `src/api/types.ts`, `src/api/client.ts`, `src/App.tsx`,
`src/pages/Conductores/Detalle.tsx` ni `.spec-config.yml`, que ya existe.
No se agregan dependencias ni componentes de UI nuevos.

## Plan de implementacion

1. Comprobar el estado del workspace y los contratos existentes antes de aplicar esta spec.
2. Crear `src/lib/conductores.ts` con las funciones puras y su archivo de pruebas: filtro por los tres
   criterios, normalizacion, matriz de acciones, textos de confirmacion, etiqueta de vehiculo, clave,
   ruta y reintento. El stub sigue montado y la pantalla no cambia todavia.
3. Ampliar `EstadoBadge` con las cuatro claves faltantes, sin tocar las existentes; comprobar que una
   jornada `no_iniciada` y una disponibilidad `solicitud_pendiente` dejan de mostrar el enum crudo.
4. Reemplazar el stub por la lectura con clave por pestana, las cuatro pestañas y los estados de
   carga, error con `Reintentar` y vacio, incluido el vacio por busqueda. Verificar que cambiar de
   pestana produce una sola peticion por pestana y que el filtro local no genera peticiones.
5. Conectar las cuatro transiciones con confirmacion nativa, bloqueo por fila, retirada confirmada
   con `setQueryData` solo en exito, invalidacion de `['conductores']` en exito y en error,
   y presentacion de `ApiError.message` incluido el 409.
   Verificar por mocks el metodo, la ruta, la ausencia de body y el refresco posterior.
6. Anadir el refresco de 15 s con pausa por visibilidad, bloqueo del movil y mutaciones, y el boton `Actualizar`; comprobar que no hay
   peticiones simultaneas para la misma clave ni cambios en las opciones globales de `QueryClient`.
7. Cerrar la vista responsive con botonera, nombre sin enlace, contador local, anuncios accesibles, traslado de foco y
   el comportamiento con sesion A/B; registrar evidencia por criterio y actualizar el roadmap sin
   presentar mocks como integracion real.

Las pruebas acompanian cada incremento. El primer incremento agrega logica validada sin romper la
pantalla existente; el ultimo cierra presentacion y evidencia del alcance autorizado.

## Criterios de aceptacion

Casillas acreditadas por unitarios, inspeccion de implementacion y navegador con mocks segun la
matriz de evidencia al final. No acreditan integracion real, lector de pantalla ni bloqueo fisico.

- [x] La pestana `Pendientes` es la vista inicial y las cuatro pestañas estan siempre presentes.
- [x] Cada lectura usa `GET /api/conductores?estado=<valor>` con uno de los cuatro valores validos,
      sin paginacion, sin claves adicionales y con `Authorization: Bearer`; no hay lecturas duplicadas
      simultaneas de la misma clave. Se permiten polling, reintentos y refrescos previstos.
- [x] No existe pestana, filtro ni consulta que omita `estado`; ninguna consulta pide la lista de los
      cuatro estados a la vez.
- [x] Cambiar de pestana cambia la clave de la consulta y muestra la lista de ese estado.
- [x] El listado se muestra en el orden recibido, sin reordenar ni deduplicar en el frontend.
- [x] La busqueda filtra por nombre, telefono y placa sin generar peticiones; texto compuesto solo de
      espacios equivale a busqueda vacia.
- [x] Un resultado sin coincidencia muestra el mensaje de vacio con el boton `Limpiar busqueda`.
- [x] No hay paginacion, contadores por estado ni totales globales en pantalla.
- [x] El pie muestra `Mostrando X de Y` con los datos de la pestana activa, incluido cero resultados.
- [x] Telefono y placa se buscan ignorando espacios y guiones; la busqueda no se persiste al recargar.
- [x] Una fila `pendiente` ofrece Aprobar y Rechazar; `aprobado` ofrece Suspender; `suspendido` ofrece
      Reactivar; `rechazado` no ofrece ninguna accion.
- [x] Cada transicion pide confirmacion nativa con la accion y el nombre; al cancelar no hay peticion.
- [x] Cada transicion se envia como `PATCH` a `/api/conductores/:id/<accion>` sin body y responde `200`.
- [x] Tras cada transicion, con exito o con error, la lista se refresca.
- [x] Solo tras un `200`, `setQueryData` retira la fila por id de su clave de origen antes del refetch,
      sin insertar el detalle en otras pestanas ni crear cache ausente; en error no la retira.
- [x] Una lectura iniciada antes del `200` no repone la fila retirada; cambiar de pestana o sesion
      durante la accion no provoca escrituras en una clave o sesion incorrecta.
- [x] Durante una transicion en curso sus acciones se deshabilitan y no hay dos sobre la misma fila.
- [x] Un 409 muestra el `message` del servidor y refresca la lista; no queda la UI desincronizada.
- [x] Un 404 y un 403 muestran el mensaje del servidor; el 403 no cierra sesion y ninguno se reintenta solo.
- [x] Un 401 mantiene el cierre de sesion y la redireccion a `/login`.
- [x] Un error de red o `5xx` en la lectura muestra aviso recuperable y `Reintentar`, con un maximo de
      un reintento automatico.
- [x] Las mutaciones no se reintentan automaticamente.
- [x] Un fallo de lectura con datos previos mantiene la lista con aviso de posible desactualizacion;
      sin datos previos muestra error sin afirmar que la lista esta vacia.
- [x] Una respuesta tardia de otra sesion no altera la cache, los avisos ni la sesion vigente.
- [x] La pantalla refresca cada 15 s mientras la pestana del navegador este visible y se detiene al ocultarse.
- [x] El polling permanece pausado mientras haya alguna mutacion pendiente y al ocultarse por bloqueo
      del movil. Reanuda solo con pagina visible y sin mutaciones pendientes.
- [x] `aria-busy` se activa solo para refresco manual o transicion, no para polling silencioso.
- [x] `Reintentar` y `Actualizar` ejecutan el mismo refresco y se deshabilitan con una peticion en curso.
- [x] `estadoJornada` y `estadoDisponibilidad` se muestran con etiqueta en espanol, sin enums crudos.
- [x] Un conductor con `vehiculo: null` muestra `Sin vehiculo` y no ofrece crear ni editar vehiculo.
- [x] `nombreCompleto` vacio o en blanco muestra `(sin nombre)` en tabla, tarjeta y confirmaciones.
- [x] `cedulaIdentidad`, `creadoEn` y la ubicacion no se muestran; `Usuario` eliminado logicamente no oculta
      el telefono.
- [x] Suspender no finaliza servicios ni modifica jornada o disponibilidad, y la pantalla no lo insinua.
- [x] Nombre y `Sin vehiculo` son texto plano sin enlaces; la fila no navega. El detalle sigue fuera
      de alcance hasta el modulo 6, cuando se enlazara solo el nombre.
- [x] Escritorio desde 1024 px muestra tabla; por debajo, tarjetas con botonera al pie, no menu,
      conservando los mismos datos y acciones.
- [x] A 320 px, 640 px y 1280 px no hay scroll horizontal y todas las acciones son alcanzables.
- [x] Un nombre de 100 caracteres y una placa larga no desbordan su celda ni su tarjeta.
- [x] Las cuatro transiciones, los avisos y el resultado se anuncian con `role="status"` o `role="alert"`.
- [x] Si la accion que tenia el foco desaparece tras el refresco, el foco pasa a la region de resultados.
- [x] `npm run test:unit` y `npm run build` terminan correctamente y se registra evidencia nueva.
- [x] La verificacion de navegador con mocks cubre carga, vacio, vacio por busqueda, las cuatro
      transiciones, cancelacion de la confirmacion, 403, 404, 409, 5xx, red, polling, Actualizar,
      refresco posterior y sesion A/B.
- [x] El roadmap refleja solo el progreso acreditado y registra INT05 como pendiente.
- [ ] INT05, pendiente fuera de esta ejecucion: verificar `GET /api/conductores?estado=` y las cuatro
      transiciones autenticadas, la autorizacion real de administrador y la persistencia del estado
      contra el backend, antes de declarar cierre de integracion.

## Estrategia de verificacion

Reutilizar Vitest existente sin instalar infraestructura adicional por defecto.
Los unitarios deben ejecutar la logica real de `src/lib/conductores.ts`.
Los tests de helpers no acreditan por si solos el comportamiento de React, foco o navegacion.
Esos casos se verifican en navegador con todas las llamadas API interceptadas antes de navegar,
incluidas las de Login, configuracion e indicadores si se visita Inicio.

| ID | Caso | Resultado esperado |
|---|---|---|
| Q01 | GET inicial en `Pendientes`. | Una peticion con `?estado=pendiente`; la tabla muestra los conductores recibidos. |
| Q02 | Cambio de pestana a cada estado. | Cuatro peticiones, una por estado, sin repetir la anterior; la tabla se reemplaza. |
| Q03 | Filtro por nombre, telefono y placa, con y sin espacios y guiones. | Solo las filas que coinciden; ninguna peticion adicional. |
| Q04 | Texto sin coincidencias y busqueda vacia. | Mensaje de vacio por busqueda con `Limpiar busqueda`; sin busqueda, mensaje de pestana vacia. |
| Q05 | Cada transicion valida. | `PATCH` a la ruta correcta, sin body, `200`, confirmacion visible y refresco de la pestana. |
| Q06 | Cancelacion de la confirmacion. | Cero peticiones y la fila sin cambios. |
| Q07 | Doble clic y repeticion de la accion. | Una sola peticion por fila; la fila queda deshabilitada mientras dura. |
| Q08 | 409 en cada transicion. | `message` del servidor visible con `role="alert"` y lista refrescada. |
| Q09 | 404, 403, 500 y red en transicion. | Mensaje del servidor o aviso recuperable; refresco; sin reintento automatico de la escritura. |
| Q10 | 403 y 5xx en la lectura inicial. | Permiso denegado sin cierre de sesion; aviso con `Reintentar` y un solo reintento automatico. |
| Q11 | 401 en lectura y en transicion. | Cierre de sesion y redireccion a `/login`. |
| Q12 | Polling con la pestana visible y con la pestana oculta. | Peticiones cada 15 s mientras se ve; ninguna adicional con la pestana oculta. |
| Q13 | `Actualizar` y `Reintentar`. | Mismo refresco, un solo vuelo y boton deshabilitado durante la peticion. |
| Q14 | Sesion A con lectura diferida, logout y login B. | La sesion B no muestra datos, errores ni acciones de A. |
| Q15 | `200` con GET anterior y refetch posterior diferidos; cambio de pestana durante PATCH. | Retirada inmediata solo en cache de origen; el GET anterior no repone la fila; conciliacion posterior sin insertar DTO de detalle. |
| Q16 | Mutaciones pendientes y ciclo ocultar/mostrar o `pagehide`/`pageshow`. | Sin polling mientras haya mutaciones o pagina oculta; reanuda visible y sin mutaciones. Simular bloqueo no acredita prueba en dispositivo fisico. |
| Q17 | Fallo de lectura despues de una lectura correcta. | Conserva filas y muestra aviso; un fallo inicial no se presenta como lista vacia. |
| Q18 | Filtro con coincidencias, sin coincidencias y lista vacia. | Pie `Mostrando X de Y` correcto, sin totales inventados al cargar o fallar sin datos. |
| V01 | 1280 px, 640 px y 320 px. | Tabla en escritorio, tarjetas en movil, sin scroll horizontal y con acciones alcanzables. |
| V02 | Nombre de 100 caracteres y placa larga. | Sin desborde de celda ni de tarjeta. |
| V03 | 1023 px y 1024 px, nombre vacio o en blanco. | Cambio de tarjeta con botonera a tabla en el breakpoint; `(sin nombre)` visible sin desbordes. |
| A01 | Teclado y tecnologia asistiva. | Pestanas, busqueda y acciones operables; anuncios presentes y foco recuperado al desaparecer la accion. |
| A02 | Nombre, fila y `Sin vehiculo`. | Sin navegacion ni enlaces al stub del modulo 6. |
| A03 | Polling silencioso, refresco manual y transicion. | `aria-busy` solo durante las dos acciones deliberadas, no en cada ciclo de polling. |
| U01 | Suite existente y build. | Los casos existentes de cliente, sesion y configuracion siguen en verde. |
| INT05 | Entorno y cuenta autorizados. | Lectura filtrada y las cuatro transiciones con Bearer de administrador, con persistencia real. |

Para los mocks, interceptar todas las llamadas API antes de navegar y devolver datos ficticios.
No dejar mocks en codigo de produccion ni permitir peticiones reales accidentales.
Restaurar interceptores, zoom y sesion al terminar, incluso si falla un caso.
Registrar fecha, resultado y evidencia saneada; no guardar contrasenas, tokens ni datos personales.
Mantener las convenciones de SPEC 04: capturas, evidencia por criterio y fecha, sin marcar como
verificado lo que solo este planeado. No se acredita ningun criterio con esta revision documental.

No ejecutar peticiones reales, seeds, migraciones ni crear usuarios para desbloquear integracion.
Mocks no demuestran autorizacion real, orden del servidor ni persistencia.
INT01, INT03 e INT04 conservan su estado pendiente; INT05 registra especificamente la futura
integracion de lectura y transiciones de este modulo.

## Decisiones descartadas

| Descartada | Motivo |
|---|---|
| Pestana `Todos` | Es opcional y el usuario decidio excluirla. El contrato permite obtener todos los estados sin filtro, pero esta pantalla no lo solicita. |
| Paginacion y paginador de 7 filas del prototipo | El backend no pagina; un paginador local seria una falsa limitacion. |
| Contadores por pestana del prototipo | Exigen conocer el total de cada estado, que no se obtiene con un listado filtrado. |
| Columna `Unidad` del prototipo | `ConductorListado` no expone ese dato. |
| Columna de ubicacion | El listado no incluye `ubicacion`; pertenece al mapa y al reporte de ubicaciones. |
| Busqueda y paginacion contra el servidor | El contrato no ofrece esos parametros. |
| Modal propio de confirmacion | El roadmap exige confirmacion nativa y el prototipo no es el contrato. |
| Suspender con efectos sobre jornada, disponibilidad o servicios | El servicio solo actualiza `estado`; el resto es modulo futuro. |
| Invalidar solo la pestana activa | La transicion afecta a otras pestanas; invalidar el prefijo completo mantiene la cache coherente. |
| Insertar el DTO completo de detalle en caches de listado | T2 solo retira por id tras un `200`; no fabrica la presencia en otra pestana. El refetch reconcilia los listados. |
| Snackbar o toast propio | No hay biblioteca de notificaciones instalada; `role="status"` y `role="alert"` cubren el anuncio. |
| Filtrar conductores con `Usuario` eliminado logicamente | El backend sigue devolviendo su telefono y no expone ese dato. |
| Sort por columnas o por otra clave | El orden por `creadoEn` es del servidor y no tiene desempate garantizado. |
| `Cache-Control: no-store` en el cliente | El backend no envia esa cabecera en esta ruta y no se puede forzar desde el navegador. |
| Componente `table` compartido | Solo esta pantalla necesita tabla; T10 lo evita hasta que un modulo mas lo exija. |
| Migrar el router, proteger rutas o cambiar el `QueryClient` | Fuera del alcance; la pantalla vive en el area protegida existente. |

## Riesgos

| Riesgo | Mitigacion |
|---|---|
| Vista desincronizada por un cambio externo de estado | Refresco de 15 s, refresco tras cada transicion y tambien tras un 409. |
| Un 409 interpretarse como fallo transitorio y reintentarse | Las mutaciones no reintentan; el 409 muestra el estado actual del servidor. |
| Doble clic que dispare dos transiciones | Acciones deshabilitadas por fila durante la peticion y confirmacion previa. |
| Un polling continuo consume datos en mobil | Intervalo con pausa por visibilidad; el intervalo es configurable en un solo lugar. |
| El foco se pierde cuando la fila desaparece tras la transicion | Traslado explicito del foco a la region de resultados y anuncio del resultado. |
| Una respuesta de la sesion A repueble la cache de B | Protecciones existentes de `src/api/client.ts:48-52` y `AuthContext`; caso de prueba dedicado. |
| Ampliar `EstadoBadge` rompe pantallas futuras | No se elimina ninguna clave; solo se agregan cuatro. |
| Un conductor suspendido parece operativo | Suspender solo cambia `estado` y la pantalla no muestra acciones operativas. |
| El filtro local oculta filas que existen | El texto de resultados distingue la cantidad visible de la pestana, sin afirmar totales. |

## Respuestas de la revision del usuario

1. **D1:** Confirmado: busqueda local, sin paginacion ni contadores por estado o globales.
2. **D2:** Confirmado: sin `Todos`, vista inicial `Pendientes`.
3. **D3:** Confirmado: intervalo de 15 s.
4. **D4:** Confirmado: tabla en escritorio y tarjetas en movil, breakpoint 1024 px y botonera al pie, no menu.
5. **D5:** Confirmado: mocks e INT05 pendiente.
6. **Detalle:** Enlace desactivado hasta el modulo 6; nombre como texto plano.
7. **Navegacion:** Cuando exista detalle, solo el nombre sera enlace; nunca toda la fila.
8. **Busqueda:** Ignorar espacios y guiones en telefono y placa. Se mantiene sin persistencia.
9. **Contador local:** Mostrar `Mostrando X de Y` en el pie; no contradice la exclusion de contadores globales.
10. **Confirmaciones:** Un texto por accion con el nombre del conductor.
11. **Error con datos previos:** Mantener lista visible con aviso.
12. **Sin vehiculo:** Texto plano, sin enlace hasta el modulo 6.
13. **Evidencia:** Mantener las convenciones de SPEC 04.

### Mejoras de la revision

| Punto | Decision documentada |
|---|---|
| a | Retirar la fila con `setQueryData` solo tras exito, seguido de invalidacion; T2. |
| b | Pausar polling mientras haya alguna mutacion en curso; T12. |
| c | Mostrar `(sin nombre)` si el nombre esta vacio o en blanco; T11. |
| d | Omitido con autorizacion del usuario y documentado como bloqueo de contrato; T15. |
| e | Pausar al ocultarse por bloqueo de pantalla movil, mediante visibilidad/ciclo de vida; T12. |
| f | `aria-busy` solo para refresco manual o transicion, nunca polling silencioso; T13. |

Las 13 preguntas estan resueltas. El bloqueo (d) queda diferido y no autoriza cambios de backend.
La instruccion posterior del usuario fue recibida y ejecutada el 2026-09-30.

## Que NO forma parte de esta especificacion

- Modulo 6: detalle del conductor y edicion de vehiculo. `src/pages/Conductores/Detalle.tsx` sigue siendo un stub.
- Registro de conductores, alta de vehiculos y cualquier escritura de datos personales o de vehiculo.
- Notificaciones al conductor. El stub del backend no se toca ni se simula desde el frontend.
- Realtime, WebSocket y suscripcion a eventos. Corresponde al modulo 11 y exige los modulos 8 y 9.
- Paginacion, ordenamiento por columnas y contadores por estado.
- Jornada, disponibilidad, ubicaciones, mapa y solicitudes activas.
- Cambios en el backend, en el esquema, en seeds, en migraciones o en el entorno.
- Cerrar INT01, INT03 o INT04, y cerrar INT05 sin entorno y cuenta autorizados.

## Evidencia de implementacion y verificacion - 2026-09-30

Implementacion autorizada por instruccion posterior expresa. Rama local
`spec-05-conductores-listado-estados`, sin commits. Se conservo esta spec, inicialmente no seguida
por Git, y no se modificaron los archivos excluidos. `.spec-config.yml` indica rama automatica;
el enlace `.claude/skills/spec-impl` esta roto y su `SKILL.md` no esta disponible. Se siguieron
los incrementos de este documento: contratos, helpers/unitarios, badges, pantalla, navegador y evidencia.
Se consulto Context7 (TanStack Query v5) sobre cancelacion, invalidacion y updater `undefined`.

### Comandos y alcance

- `npm run test:unit`: **213 pruebas, 5 archivos, todos en verde**; 35 pruebas nuevas de helpers.
- `npm run build`: **correcto**, TypeScript y Vite; 178 modulos transformados.
- `git diff --check`: correcto; solo advertencias de conversion LF/CRLF del repositorio.
- Navegador Chromium/Playwright sobre build local en `http://localhost:4173`, con todas las
  rutas cuyo pathname empieza por `/api/` interceptadas antes de navegar. Incluye login,
  configuracion e indicadores. Datos y cuenta ficticios, sin llamadas reales ni usuarios creados.
- No se guardaron cuerpos de login, tokens ni credenciales en evidencia. Los registros comprobados
  contienen ruta, metodo, `body: null` de PATCH y booleano de presencia de Bearer, no su valor.
- Al terminar: logout, limpieza de storage/cookies, `about:blank`, retirada de interceptores y
  listeners, viewport 1280 x 900 y cierre de la pagina. No se modifico zoom ni entorno.

### Resultados por caso

| Caso | Evidencia observada y resultado |
|---|---|
| Q01-Q02 | Build: un GET inicial `?estado=pendiente`; un GET por cambio a aprobado, rechazado, suspendido y regreso a pendiente. Bearer presente. Cuatro botones siempre visibles, tambien ante errores iniciales. |
| Q03-Q04 | Busquedas `Ficticio`, `000100000`, `test0`: `Mostrando 1 de 2`, cero GET adicionales. Sin coincidencias: `0 de 2`, mensaje y Limpiar busqueda; limpieza: `2 de 2`. Espacios solos no filtran ni consultan. Lista realmente vacia: `No hay conductores pendientes`, `0 de 0`. |
| Q05-Q06 | Aprobar, rechazar, suspender y reactivar: confirmacion nativa especifica, un PATCH sin body con Bearer, 200 simulado y un GET posterior de la pestana. Exitos visibles con role=status. Cancelar Aprobar: ningun PATCH. Rechazar `(sin nombre)` confirma y anuncia ese mismo nombre. |
| Q07 | Dos clicks sincronicos en Aprobar con PATCH diferido: un PATCH de esa fila. Otra fila siguio habilitada y permitio Rechazar concurrentemente. Cada fila permanecio bloqueada durante su operacion. |
| Q08 | 409 en cada una de las cuatro acciones: mensaje literal `Transicion simulada 409` con role=alert, un PATCH y un GET posterior por intento, sin retirar la fila por error. |
| Q09 | 404, 403, 500 y aborto de red en Aprobar: un PATCH y un GET posterior en cada caso, sin retry de escritura. Mensajes visibles; el 403 mantiene `/conductores`. No se repitio esta matriz completa para las otras tres acciones (comparten ejecutor). |
| Q10 | Lectura inicial 403: un GET; 500 y red: dos GET (un retry). Cuatro pestanas, error y Reintentar, sin pie de resultados ni mensaje de lista vacia. Sesion conservada. |
| Q11 | 401 actual en GET y en PATCH: ambos redirigen a `/login`. |
| Q12 | Reloj Playwright tras recargar: un GET al avanzar 15,1 s, aria-busy=false. Visibilidad oculta durante 31 s: cero GET; visible otros 15,1 s: un GET. |
| Q13 | Actualizar con GET diferido 1,5 s: un GET, boton deshabilitado y aria-busy=true. Reintentar recupera la lista tras cada error de lectura; ambos usan el mismo handler y guarda sincrona. |
| Q14 | GET de A diferido, logout/login B y lista B vacia: respuestas A 200, 401 y 500 no agregan filas ni errores ni expulsan a B. Adicionalmente PATCH A tardio 200, 401 y 409: B mantiene sus dos filas, sin alertas/exitos de A ni logout. |
| Q15 | GET anterior diferido 2 s, PATCH 400 ms, cambio a Aprobados y regreso a Pendientes tras 200: `1 de 1` inmediatamente antes de resolver conciliacion; fila retirada ausente tambien despues de 2,3 s. Cancelacion usa AbortSignal, clave capturada de origen y comprobacion de revision despues del await. Ausencia de cache cubierta por helper (`undefined`) e inspeccion del updater; no se expuso QueryClient al navegador para forzar su eliminacion. |
| Q16 | Dos mutaciones pendientes: avanzar 31 s no genera polling. `pagehide` 31 s: cero GET; `pageshow` 15,1 s: un GET. Hide/show durante PATCH diferido: cero polling mientras sigue pendiente, un GET 15,1 s despues de terminar. Simulacion, no bloqueo fisico de telefono. |
| Q17 | Refresco con 403/500/red conserva `2 de 2` y aviso de datos posiblemente desactualizados; conteos de GET 1/2/2. Reintentar elimina el aviso al recuperar. |
| Q18 | Pies `2 de 2`, `1 de 2`, `0 de 2`, `1 de 1`, `0 de 0` observados; no hay totales durante carga inicial/error sin datos. Recarga borra la busqueda temporal. |
| V01-V03 | Viewports 1280, 1024, 1023, 640, 320: tabla solo >=1024, dos tarjetas debajo. `scrollWidth <= innerWidth` en todos; cero botones de acciones con altura <44 px. Nombre de 100 caracteres y placa de 100 caracteres sin desborde; `(sin nombre)` y Sin vehiculo en ambas variantes. |
| A01 | Enter ejecuta las cuatro acciones y foco vuelve a `Resultados: <pestana>` tras retirar fila. Tab desde Pendientes llega a Aprobados. Retirada externa por polling tambien recupera foco. Roles, Label, scope y aria-pressed inspeccionados; no se ejecuto lector de pantalla. |
| A02 | Cero enlaces dentro de resultados en los cinco viewports. Nombre, fila y Sin vehiculo no navegan; sin campos de detalle ni acciones operativas. |
| A03 | Polling diferido: aria-busy=false; Actualizar y mutacion: true hasta conciliacion. No hay etiqueta de recarga durante polling. |
| U01 | Suite completa y build en verde, como se detalla arriba. |
| INT05 | **Pendiente**: ninguna prueba contra backend real. INT01, INT03 e INT04 tambien pendientes. |

### Capturas y limitaciones

- Capturas locales saneadas: `.playwright-mcp/spec05-320.png` y
  `.playwright-mcp/spec05-1280.png` (directorio de artefactos ignorado por Git). Muestran datos
  ficticios largos y nombre vacio; los fixtures fueron restablecidos entre casos.
- La primera preparacion del harness en Vite intercepto por error el modulo estatico
  `/src/api/token.ts`; se corrigio el matcher antes de las pruebas. Ninguna API real paso.
  Vite/StrictMode inicia y aborta una lectura de ensayo; la secuencia Q01 de una unica lectura
  se comprobo sobre el build, no se conto ese intento abortado como duplicado de produccion.
- Un primer intento de instalar el reloj despues de crear timers no acredito polling; se repitio
  con recarga y timers creados bajo el reloj, obteniendo los conteos de la matriz.
- No se ejecutaron lector de pantalla, dispositivo movil fisico, otros motores de navegador ni
  una bateria exhaustiva de todas las permutaciones de carreras. Los unitarios no sustituyen esas pruebas.
- No se probaron autorizacion real, persistencia ni orden de servidor. El telefono se presenta
  literalmente: el bloqueo de usuario eliminado sigue abierto, sin heuristicas ni cambios de contrato.

### Ajuste visual posterior - 2026-09-30

- Comparados `conductores.html`, el markup generado por `app.js` y las reglas reales de
  `styles.css`. Verificacion visual del prototipo y de la pantalla ajustada en Chromium.
- `Lista.tsx` agrupa controles, busqueda, resultados y pie en un panel; `Lista.css` limita
  los estilos a esta pantalla. Pestanas con subrayado, cabecera ligera, iniciales decorativas,
  badges menos redondeados, acciones primaria/peligro y espaciados cercanos al prototipo.
- Se mantienen shell, Segoe UI, descripcion, etiqueta visible de busqueda, Actualizar en
  la fila de controles, siete columnas, badges operativos y botones de al menos 44 px.
  No se incorporan contadores, paginacion, detalle, Unidad, ubicacion ni modal propio.
- Navegador sobre Vite local (5173): tabla a 1440, 1280 y 1024 px; tarjetas a 1023 y
  320 px. Sin scroll horizontal; todos los botones del listado tienen altura >=44 px.
  Nombre de 100 caracteres y placa de 100 caracteres sin desbordes a 320, 1024 y 1280 px.
- Comprobados busqueda sin resultados y limpieza, cuatro pestanas, Actualizar, cancelacion
  nativa y aprobacion con retirada de la fila y pie actualizado. No se repitio la matriz
  completa previa de errores, polling, concurrencia, sesiones ni lector de pantalla.
- Todas las API interceptadas antes de navegar, respuestas y acceso ficticios; recursos
  externos bloqueados. Contexto de navegador separado, logout, limpieza de storage/cookies,
  about:blank, retirada de interceptores y cierre del contexto al finalizar. Sesion original intacta.
- Capturas locales en `C:/Users/HP/AppData/Local/Temp/opencode/`:
  `conductores-reference.png`, `conductores-1440.png` y `conductores-320.png`.
  Fuentes externas del prototipo bloqueadas: comparacion con su fuente de respaldo, no con
  las fuentes web DM Sans/Manrope. Se conserva la tipografia establecida por el proyecto.
- Unitarios: 213 pruebas en 5 archivos correctas. Build TypeScript/Vite correcto.
  `git diff --check` sin errores, solo advertencias LF/CRLF. INT05 permanece pendiente.
