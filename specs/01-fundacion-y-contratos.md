# SPEC 01 - Fundacion y contratos

> **Estado:** Implementada y verificada en el alcance reducido (2026-09-22)
> **Depende de:** Ninguna spec local previa; contratos backend verificados en las fuentes externas citadas.
> **Fecha:** 2026-09-22
> **Objetivo:** Crear los tipos centrales del dashboard y corregir la lectura de errores HTTP sin migrar paginas ni modificar su diseno.

## Contexto y fuentes

**Actualizacion de implementacion, 2026-09-22:** el usuario solicito expresamente implementar esta spec despues de la revision documental y confirmo la ejecucion directa. Las restricciones de "solo este documento" que siguen son historial de esa revision, no la solicitud vigente. No se reabrieron P1-P4 ni se declaro una aprobacion automatica. La evidencia actual esta en "Ejecucion y evidencia"; las observaciones y pendientes historicos se interpretan con esa actualizacion.

El borrador inicial se guardo mediante definicion rapida solicitada por el usuario: "crea el archivo ahi lo reviso".
Esta revision incorpora las decisiones posteriores confirmadas P1, P2-B, P3-A y P4-A (Vitest mas comprobaciones manuales), que sustituye P4-B por autorizacion del usuario.
La solicitud actual es actualizar solo este documento, no implementar ni aprobar automaticamente la spec.
Estado de preparacion: contratos y alcance delimitados; pendiente de revision/aprobacion y de ejecutar las verificaciones durante la futura implementacion.

Las rutas de las referencias siguientes parten de la raiz de `frontEnd/`.
Los numeros de linea corresponden a la inspeccion realizada para este borrador.

| Fuente verificada | Evidencia relevante |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:27-53` | Modulo 1 real: Fundacion y contratos; infraestructura, nueve DTO y criterios de aceptacion. |
| `../docs/ROADMAP_FRONTEND.md:10-23` | Fuentes de verdad, Bearer, sesion en memoria y formato de errores. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:19-64,118-139` | Stack, autenticacion, endpoints y estructura sugerida. |
| `../docs/REGLAS_DE_NEGOCIO.md:3-4,23-33,44-50` | Estados operativos y responsabilidad del backend sobre las reglas. |
| `../docs/ARQUITECTURA.md:19-26` | API como fuente de verdad y dashboard como consumidor. |
| `../docs/MODELO_DE_DATOS.md:3-9,60-92,127-166` | Esquema de persistencia; no equivale al contrato JSON de la API. |
| `../docs/ROADMAP_ENDPOINTS.md:6-9,16-22,173-181` | Resumen de endpoints que remite a specs detalladas. |
| `references/pantallas/index.html:10-19` | Prototipo que carga `styles.css` y `app.js`. |

En la investigacion inicial no se encontraron archivos de memoria `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` o `README.md` de proyecto ni specs previas en el frontend.
Se leyo la plantilla del skill spec y se conserva la convencion de este documento.
El usuario autorizo lectura de `../backend/` y `../specs/`; ambos directorios existen y fueron inspeccionados sin escrituras.
No se leyeron archivos de entorno ni secretos.

**Trazabilidad backend:** HEAD `5a8ecb5c459793e5301077f3d8d2053163ff350e`; `git status --short` sin cambios al inspeccionar.
La evidencia es lectura de routers montados, controladores, serializadores, schemas y pruebas existentes.
No se ejecutaron pruebas, migraciones, build ni peticiones contra una instancia del backend.

**Referencias documentales externas confirmadas:**

- `../backend/specs/04-configuracion.md:3-14,56-102` corresponde al contrato implementado; descarta expresamente la spec antigua.
- `../specs/backend/01-configuracion.md:19-22,46-49,118-121` existe, pero no rige el backend actual: permitia GET sin autenticacion y PUT vacio.
- `../backend/specs/11-tarifario-dashboard.md:3-6,128-146,201-231` figura Implementado y documenta el montaje y evidencia historica de sus pruebas.
- Las frases historicas de SPEC 11 que aun dicen que no se montan rutas (`:36`) no describen el codigo actual de `../backend/src/app.ts:30-31`.

Estas referencias son externas, no specs locales `SPEC 04` o `SPEC 11` del frontend.

## Estado observado

- `src/api/token.ts:1-9` ya almacena el token en memoria.
- `src/context/AuthContext.tsx:18-34` ya limpia la sesion y escucha `auth:unauthorized`.
- `src/router.tsx:13-32` ya protege el dashboard y declara las rutas existentes.
- `src/App.tsx:6-20` ya configura QueryClient con `retry: 1` y `refetchOnWindowFocus: false`.
- `src/api/client.ts:15-44` ya adjunta Bearer y contempla `204` sin parsear JSON.
- `src/api/client.ts:23-40` descarta el mensaje del backend en `401` y no extrae `error.message` anidado en otros errores.
- No existe `src/api/types.ts`.
- `src/pages/Login.tsx:16-20,34-40` declara `LoginResponse` local y prueba `token`, `accessToken` y `jwt`.
- `src/pages/Home.tsx:4-23` declara `Indicadores` local y consume el nombre incorrecto `solicitudesCompletadas`.
- Configuracion, listado y detalle de conductores, Mapa, Solicitudes y Tarifas son pantallas provisionales en las rutas ya declaradas.
- `src/components/Layout.tsx:5-90` contiene navegacion, cierre de sesion y menu movil; el nombre TaxiSur es fijo.
- `src/index.css:3-13` conserva la paleta del prototipo, pero usa Segoe UI en lugar de DM Sans/Manrope de `references/pantallas/styles.css:1-4`.
- `package.json:6-9` no declara un script de pruebas; tampoco se encontraron archivos de pruebas del proyecto.

Estas observaciones proceden de lectura estatica, no de pruebas de ejecucion.

## Alcance

**Incluido, con alcance reducido confirmado por el usuario:**

- Crear `src/api/types.ts` con los nueve contratos camelCase verificados y las uniones de estados necesarias.
- Corregir en `src/api/client.ts` la extraccion de `error.message` para errores distintos de `401`, conservando los formatos alternativos ya soportados.
- Verificar el comportamiento existente de respuestas `204` y del cierre de sesion por `401`.
- Conservar token en memoria, AuthContext, rutas protegidas y opciones de QueryClient.
- Respetar las Query Keys documentadas sin incorporar un gestor global nuevo.
- Incorporar Vitest para pruebas unitarias focalizadas del cliente HTTP, build y comprobaciones manuales de regresion de interfaz.

Solo esos dos archivos de aplicacion podran aparecer o cambiar en la futura implementacion.
Se permiten adicionalmente el archivo de pruebas y los cambios minimos de dependencias, lockfile y configuracion de Vitest enumerados en el plan; no amplian el alcance funcional de P2-B.
No se migran consumidores: crear contratos y adoptar contratos son entregas separadas.
Se permiten transitoriamente `LoginResponse` en Login y `Indicadores` local en Home por decision P2-B.
La eliminacion de esas declaraciones corresponde a los modulos 2 y 7, respectivamente.
No se agregan campos de compatibilidad a los nuevos DTO para reproducir errores de las paginas actuales.

**Fuera del alcance tecnico documentado:**

- Implementar las pantallas provisionales o nuevas operaciones de negocio.
- Modificar `src/pages/Login.tsx` o `src/pages/Home.tsx`, incluidos sus imports, alternativas del token y nombre del indicador.
- Completar los modulos 2 a 10.
- Incorporar configuracion dinamica al Layout, prevista en el modulo 3.
- Implementar endpoints, modificar base de datos o aplicar reglas operativas en el frontend.
- Persistir la sesion en almacenamiento del navegador o cambiar la estrategia de autenticacion.
- Redisenar Login, Home o el shell dentro de este modulo.
- Integrar mapas, polling nuevo, formularios de gestion o datos ficticios como contratos definitivos.
- Instalar Testing Library, jsdom u otras herramientas ajenas a las pruebas unitarias focalizadas; cambiar configuracion fuera de lo necesario para Vitest.
- Cambiar el mensaje especial del `401`, ampliar `ApiError` con un campo `code` o introducir validacion runtime de DTO.

El diseno se tratara en los modulos de pantalla conforme a P3-A.
El criterio del roadmap sobre ausencia de duplicados se difiere; su sincronizacion documental queda registrada mas adelante, sin editar el roadmap en esta tarea.

## Modelo de datos y contratos

Este modulo introduce declaraciones de tipos de transporte, no nuevas entidades persistidas.
La ubicacion prevista por el roadmap es un unico archivo `src/api/types.ts`.
No se deben copiar todas las columnas del modelo de base de datos ni traducirlas mecanicamente a DTO.

### Disponibilidad y fuentes HTTP

Los nueve DTO tienen respaldo implementado en el codigo backend inspeccionado.
Ninguno queda en categoria "solo especificado" o "ausente" en este inventario.
Esto acredita contratos y montaje en codigo, no el despliegue ni disponibilidad de una instancia en ejecucion.

En las tablas siguientes, el prefijo `B/` significa `../backend/src/` y `T/` significa `../backend/tests/`.
Los nombres frontend siguen el roadmap; no exigen que la interfaz backend tenga el mismo nombre.

| DTO frontend | Contrato backend / operacion implementada | Fuentes de schema, serializacion y HTTP |
|---|---|---|
| `TokenAdmin` | Objeto de `POST /api/auth/admin/login`, 200. | `B/modules/auth/auth.service.ts:9-30`, `auth.controller.ts:4-14`, `auth.router.ts:9-10` en el mismo modulo. |
| `Configuracion` | `ConfiguracionDto`, GET y PUT `/api/configuracion`, 200. | `B/modules/configuracion/configuracion.schema.ts:17-25`, `configuracion.controller.ts:5-37`, `configuracion.router.ts:13-15` en el mismo modulo. |
| `ConductorListado` | `ListadoConductorDto[]`, GET `/api/conductores`, 200. | `B/modules/conductores/conductores.schema.ts:29-58`, `conductores.service.ts:15-31`, `conductores.controller.ts:9-13` en el mismo modulo. |
| `ConductorDetalle` | `ConductorDetalleDto`, GET `/api/conductores/:id`, 200. | `B/modules/conductores/conductores.schema.ts:38-58`, `conductores.service.ts:34-52`, `conductores.controller.ts:15-40` en el mismo modulo. |
| `Vehiculo` | `VehiculoDto`, objeto anidado en listado/detalle. No se define un endpoint independiente para este DTO. | `B/modules/conductores/conductores.schema.ts:29-36`, `conductores.service.ts:23-30,41-51` en el mismo modulo. |
| `Indicadores` | `IndicadoresDto`, GET `/api/dashboard/indicadores`, 200. | `B/modules/dashboard/dashboard.schema.ts:54-59`, `dashboard.service.ts:164-200`, `dashboard.controller.ts:20-25` en el mismo modulo. |
| `ConductorMapa` | `MapaConductorDto[]`, GET `/api/dashboard/conductores-mapa`, 200. | `B/modules/dashboard/dashboard.schema.ts:8-30`, `dashboard.service.ts:35-96`, `dashboard.controller.ts:6-11` en el mismo modulo. |
| `SolicitudActiva` | `SolicitudActivaDto[]`, GET `/api/dashboard/solicitudes-activas`, 200. | `B/modules/dashboard/dashboard.schema.ts:32-52`, `dashboard.service.ts:103-157`, `dashboard.controller.ts:13-18` en el mismo modulo. |
| `Tarifa` | `TarifaDto[]` en GET `/api/tarifas` (200); `TarifaDto` en POST `/api/tarifas` (201) y PATCH `/api/tarifas/:id` (200). | `B/modules/tarifario/tarifario.schema.ts:12-34`, `tarifario.service.ts:28-60,74-90`, `tarifario.controller.ts:8-35`, `tarifario.router.ts:13-16` en el mismo modulo. |

Montaje verificado en `B/app.ts:23-31`; rutas de conductores en `B/modules/conductores/conductores.router.ts:16-24` y dashboard en `B/modules/dashboard/dashboard.router.ts:11-14`.
Los arrays se devuelven directamente, sin envoltorio `data` ni paginacion.
Los resultados internos `{ ok, conductor }` o `{ ok, tarifa }` del servicio no son el body de exito HTTP.
PATCH de estado y vehiculo devuelve `ConductorDetalle`, no un `Vehiculo` aislado (`B/modules/conductores/conductores.controller.ts:43-89`).

### Formas de transporte

Todos los campos descritos son obligatorios en la respuesta; `null` no significa propiedad opcional.
UUID y fechas serializadas se representan como `string`, no `Date` ni tipos Prisma importados al frontend.
Los tipos TypeScript no sustituyen las validaciones del backend ni verifican JSON en ejecucion.

**Enums auxiliares en `src/api/types.ts`:**

```ts
type EstadoConductor = 'pendiente' | 'aprobado' | 'rechazado' | 'suspendido'
type EstadoJornada = 'no_iniciada' | 'activa' | 'finalizada'
type EstadoDisponibilidad = 'disponible' | 'no_disponible' | 'solicitud_pendiente' | 'en_servicio'
type EstadoSolicitud = 'creada' | 'buscando' | 'conductor_seleccionado'
  | 'esperando_respuesta' | 'aceptada' | 'rechazada' | 'expirada'
  | 'en_servicio' | 'finalizada' | 'sin_conductor'
```

Fuentes: `../backend/prisma/schema.prisma:55-73,150-161`, `B/modules/conductores/conductores.schema.ts:44-46`, `B/modules/solicitudes/solicitudes.schema.ts:6-17` y `B/modules/dashboard/dashboard.schema.ts:24-26,44`.
`SolicitudActiva.estado` conserva el enum completo del schema compartido del backend.
El servicio filtra solo seis estados: `creada`, `buscando`, `conductor_seleccionado`, `esperando_respuesta`, `aceptada` y `en_servicio` (`B/modules/solicitudes/solicitudes.service.ts:14-20`).
Los otros cuatro son terminales y no deben aparecer en el listado activo de ese endpoint.
`fuera_de_servicio` y `desactualizado` son etiquetas visuales, no valores de estos enums.

**TokenAdmin y Configuracion:**

```ts
interface TokenAdmin {
  token: string
  tokenType: 'Bearer'
  expiresIn: number
}
interface Configuracion {
  id: number
  nombreEmpresa: string
  radioMaximoBusquedaKm: number
  telefonoCentroAtencion: string | null
  actualizadoEn: string
}
```

`expiresIn` se emite como 28800 segundos; no existen `accessToken` ni `jwt` alternativos en la respuesta.
El body de login utiliza `correo` y la clave JSON `"contrase\u00f1a"` (`B/modules/auth/auth.schema.ts:3-6`); no se modifica el formulario en este modulo.
`Configuracion.id` es numerico y el servicio opera sobre la fila 1.
`radioMaximoBusquedaKm` es entero; `actualizadoEn` es un instante UTC emitido con `toISOString()`.
El DTO no expone `creadoEn` ni `eliminadoEn` aunque Prisma los tenga.

**Vehiculo, ConductorListado y ConductorDetalle:**

```ts
interface Vehiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  color: string
  capacidadPasajeros: number
}
interface ConductorListado {
  id: string
  telefono: string
  nombreCompleto: string
  cedulaIdentidad: string
  estado: EstadoConductor
  estadoJornada: EstadoJornada
  estadoDisponibilidad: EstadoDisponibilidad
  creadoEn: string
  vehiculo: Vehiculo | null
}
interface ConductorDetalle extends ConductorListado {
  usuarioId: string
}
```

Los ids son UUID; `creadoEn` se serializa a ISO UTC.
`capacidadPasajeros` es entero en el DTO; las entradas de registro/edicion se restringen a 1-100 (`B/modules/conductores/conductores.schema.ts:6-12,29-36`).
El vehiculo es el no eliminado mas reciente por `creadoEn`; si no existe, es `null`.
El listado no expone `usuarioId`, `usuario`, `vehiculos[]`, datos de autenticacion ni columnas internas.

**Indicadores:**

```ts
interface Indicadores {
  conductoresDisponibles: number
  conductoresEnServicio: number
  solicitudesActivas: number
  solicitudesCompletadasHoy: number
}
```

Los cuatro campos son enteros no negativos y son conteos, no strings ni decimales.
Disponibles y en servicio cuentan disponibilidad registrada, no elegibilidad para recibir solicitudes.
Completadas cuenta `finalizada` con `finalizadaEn` dentro del dia de negocio `America/La_Paz`, inicio inclusivo y siguiente inicio exclusivo (`B/modules/dashboard/dashboard.service.ts:164-200`).
No se introduce la clave incorrecta `solicitudesCompletadas` para acomodar Home.

**ConductorMapa:**

```ts
interface ConductorMapa {
  id: string
  nombreCompleto: string
  estado: EstadoConductor
  estadoJornada: EstadoJornada
  estadoDisponibilidad: EstadoDisponibilidad
  vehiculo: { placa: string; marca: string; modelo: string; color: string } | null
  ubicacion: { latitud: number; longitud: number; horaRegistro: string } | null
  ultimaUbicacionRegistradaEn: string | null
}
```

El vehiculo del mapa no es `Vehiculo`: no tiene `id` ni `capacidadPasajeros`.
La ubicacion no expone `id`, `esValida` ni el modelo Prisma completo.
Latitud y longitud son numeros en los rangos [-90, 90] y [-180, 180]; `horaRegistro` y la fecha separada son ISO UTC.
Se selecciona la ultima ubicacion no eliminada por `horaRegistro DESC, id DESC`.
`ubicacion` es `null` si falta, esta invalidada o supera 300000 ms de antiguedad; a 300000 ms sigue vigente si `esValida` es true.
`ultimaUbicacionRegistradaEn` conserva la fecha del ultimo registro no eliminado aunque sea invalido/caducado; es `null` si no hay registro.
Por tanto, fecha presente mas ubicacion nula no demuestra por si sola caducidad.
Fuentes: `B/modules/dashboard/dashboard.service.ts:35-81` y `B/modules/ubicaciones/ubicaciones.service.ts:6-10`.
El mapa incluye todos los conductores no eliminados, sin filtros de jornada o aprobacion; no hay `estadoVisual` en el DTO.

**SolicitudActiva:**

```ts
interface SolicitudActiva {
  id: string
  estado: EstadoSolicitud
  pasajero: { id: string; nombre: string } | null
  conductorAsignado: { id: string; nombreCompleto: string } | null
  latitudRecogida: number
  longitudRecogida: number
  destino: string | null
  expiraEn: string | null
  creadoEn: string
}
```

Ids UUID; coordenadas con los mismos rangos que el mapa; fechas no nulas como instantes ISO UTC.
Una relacion eliminada se publica como `null` sin ocultar la solicitud.
El conductor asignado puede ser `null` tambien por ausencia de asignacion.
No confundir con el detalle de solicitudes: aqui no hay `pasajeroId`, `conductorAsignadoId`, `aceptadaEn`, `finalizadaEn` ni vehiculo anidado.
Fuente de la proyeccion y nulabilidad efectiva: `B/modules/dashboard/dashboard.service.ts:103-157`.

**Tarifa:**

```ts
interface Tarifa {
  id: string
  descripcion: string
  monto: string
  vigenciaDesde: string
}
```

Id UUID; descripcion de 1-255 caracteres; monto string canonico de dos decimales entre `0.01` y `99999999.99` segun schema.
El serializador usa `Decimal.toFixed(2)`, no `Number`; `vigenciaDesde` usa `toISOString().slice(0, 10)` y representa `YYYY-MM-DD`.
No hay propiedad `moneda`, objeto Decimal, fecha `Date` ni campo `vigencia_desde` en el JSON.
POST acepta `descripcion`, `monto`, `vigenciaDesde`; PATCH `/:id` acepta solo `descripcion` y/o `monto`, con al menos un campo.
PATCH rechaza `vigenciaDesde` y campos desconocidos; el nombre snake_case no es una alternativa aceptada.
GET devuelve tarifas no eliminadas cuya fecha ya llego en `America/La_Paz`, ordenadas por `descripcion ASC, id ASC`.
Fuentes: `B/modules/tarifario/tarifario.schema.ts:6-30`, `tarifario.service.ts:15-48,51-90`, `tarifario.controller.ts:15-35` en el mismo modulo.

Los bloques anteriores describen tipos para la futura implementacion, no codigo agregado a la aplicacion en esta revision.
No se importaran tipos de `@prisma/client` al frontend ni se agregaran wrappers o campos opcionales para contratos inexistentes.
Los tipos locales de formulario y contexto no son DTO por el solo hecho de ser tipos.

### Errores, autenticacion y evidencia de pruebas

El backend usa `{ error: { code: string, message: string } }`, sin envoltorio de exito.
El manejador global emite 404 `NOT_FOUND`, 400 `VALIDATION_ERROR` por JSON/validacion invalida y 500 `INTERNAL_ERROR` seguro (`B/middlewares/error-handler.ts:4-25`).
Auth emite 401 `UNAUTHORIZED` y 403 `FORBIDDEN`; Bearer es requerido para admin (`B/middlewares/auth.ts:20-34,127-148`).
Login es publico; configuracion GET requiere autenticacion y PUT admin; listado y mutaciones administrativas de conductores y todo dashboard requieren admin.
Tarifas GET admite admin o n8n; POST y PATCH requieren Bearer admin. El frontend no agrega credenciales n8n.
Los tres GET de dashboard emiten `Cache-Control: no-store` y rechazan query no vacia.

`ApiError` frontend conserva `status` y `message`; no se amplia para publicar `error.code` en esta entrega.
Para errores no 401 se propone prioridad `error.message` anidado, luego `message` raiz, luego `error` string y finalmente `Error <status>`.
Los formatos raiz/string se conservan porque ya estan soportados por `src/api/client.ts:28-40`, no porque el backend actual los emita.
Se comprueba el tipo de cada nivel antes de leerlo; JSON nulo, arrays u objetos con campos no string no deben producir errores de acceso.
La rama `401` mantiene el evento y el mensaje especial existentes; no se promete presentar su `error.message` hasta abordar autenticacion en el modulo 2.
`204` retorna `undefined` sin parsear JSON; los endpoints del inventario usan 200/201, no se inventa un endpoint 204 para probarlo.

Pruebas existentes leidas como evidencia del contrato, no ejecutadas en esta tarea:

- `T/auth.test.ts:52-72`: claves exactas, Bearer y 28800 segundos.
- `T/configuracion.test.ts:246-265`: cinco campos HTTP e instante ISO frente a la fila Prisma.
- `T/conductores.test.ts:131-160` y `T/conductores.schema.test.ts:132-141`: listado, detalle, nulabilidad y ausencia de `usuarioId` en listado.
- `T/dashboard.schema.test.ts:33-177`: enums, campos exigidos y proyecciones anidadas estrictas.
- `T/dashboard.service.test.ts:174-213`: ubicacion ausente, invalidada y frontera de 300000/300001 ms.
- `T/dashboard.http.test.ts:28-56,77-91,146-161`: formas HTTP, rutas montadas, errores y no-store con servicios simulados.
- `T/tarifario.service.test.ts:120-130` y `T/tarifario.http.test.ts:127-134,187-245`: serializacion, POST/PATCH y fecha inmutable.

**Convenciones ya fijadas por el roadmap:**

- Error de API: `{ "error": { "code": "...", "message": "..." } }`.
- Query Keys: `['configuracion']`, `['conductores', { estado }]`, `['conductor-detalle', id]`, `['indicadores']`, `['conductores-mapa']`, `['solicitudes-activas']`, `['tarifas']`.
- No se requiere crear consultas nuevas ni una fabrica de Query Keys en este modulo.
- No se introduce persistencia, migracion ni versionado de datos locales.

## Plan de implementacion

Plan futuro, condicionado exclusivamente a revision/aprobacion de esta spec y autorizacion de implementacion.
P1 a P4 estan resueltos y no requieren una nueva ronda de preguntas.
Antes de ejecutar, comprobar que los contratos no cambiaron respecto del commit backend citado.
El primer cambio ejecutable es crear el archivo de tipos; el ultimo paso es ejecutar y documentar build, pruebas unitarias y regresion manual.

| Archivo de aplicacion | Cambio permitido |
|---|---|
| `src/api/types.ts` | Crear declaraciones exportadas de los nueve DTO y enums auxiliares, sin dependencias runtime. |
| `src/api/client.ts` | Ampliar extraccion segura de mensajes no 401 preservando sus comportamientos restantes. |
| `src/api/client.test.ts` | Crear pruebas unitarias de la matriz automatizada con Vitest. |
| `package.json` | Agregar Vitest como dependencia de desarrollo y `test:unit` con `vitest run`. |
| Lockfile del gestor existente | Actualizarlo con la dependencia de pruebas, sin introducir otro gestor. |
| `vitest.config.ts` | Configuracion minima en entorno Node, aislada de la configuracion de produccion. |

1. Crear `src/api/types.ts` con `TokenAdmin`, `Configuracion` y los enums auxiliares documentados; verificar compilacion sin migrar consumidores.
2. Agregar `Vehiculo`, `ConductorListado` y `ConductorDetalle` al mismo archivo; revisar campos y nulabilidad contra sus fuentes y compilar.
3. Agregar `Indicadores` y `ConductorMapa`; revisar que el vehiculo resumido y la ubicacion no hereden campos privados del modelo y compilar.
4. Agregar `SolicitudActiva` y `Tarifa`; revisar enums, objetos nullable, monto string y fechas serializadas y compilar.
5. Comprobar compatibilidad de Vitest con Node/Vite existentes antes de elegir version; agregar dependencia, script y configuracion minima sin actualizar el stack innecesariamente.
6. Escribir las pruebas unitarias del cliente, comprobar que el caso anidado detecta el defecto actual y corregir el parseo de errores no 401 con la precedencia descrita.
7. Ejecutar `npm run test:unit`, `npm run build` y la regresion manual; registrar resultados sin marcar casos no ejecutados como superados.

Cada paso debe quedar compilable y ejecutable sin importar los nuevos tipos desde las paginas.
Si un incremento excede 30-50 lineas, dividirlo por declaraciones completas sin romper referencias de tipos.
No crear hooks, servicios ni infraestructura de pruebas de componentes. No exigir un porcentaje de cobertura.
Las matrices se documentan en esta spec y sus resultados se registraran aqui durante la futura verificacion, sin secretos.

## Criterios de aceptacion

Los criterios corresponden al alcance reducido confirmado, no al criterio antiguo de migracion global del roadmap.
La lectura documental no marca como superadas pruebas de implementacion.

- [x] `npm run build` termina sin errores tras los cambios.
- [x] `src/api/types.ts` exporta los nueve DTO con las formas y nulabilidades de esta spec y sin contratos alternativos inventados.
- [x] Enums, ids, fechas y monto coinciden con sus fuentes; no hay imports de Prisma ni conversiones runtime nuevas.
- [x] `npm run test:unit` termina sin errores y cubre los casos automatizados M01-M09 y M11, conservando `ApiError.status`, la rama 401 y Bearer.
- [x] Las comprobaciones manuales M10 y UI01-UI03 se ejecutan y documentan.
- [x] Los cambios funcionales se limitan a `src/api/types.ts` y `src/api/client.ts`; los adicionales se limitan a pruebas y configuracion enumeradas en el plan.
- [x] Login y Home permanecen sin cambios; sus tipos locales se permiten transitoriamente por P2-B.
- [x] Token en memoria, AuthContext, rutas protegidas, QueryClient, Query Keys y diseno permanecen sin cambios.
- [x] Solo se incorpora la infraestructura minima de Vitest; no se instala Testing Library ni jsdom ni se modifica backend.
- [x] Se registra resultado de build, pruebas unitarias y cada caso manual con fecha y evidencia saneada.

**Criterio diferido, no exigible para cerrar este modulo reducido:** eliminar los tipos locales de Login/Home y hacer que las paginas consuman los contratos centrales.
Su verificacion corresponde a modulos 2/7 y a la adopcion de tipos en las demas pantallas futuras.
No declarar cumplida la centralizacion de consumidores al completar solo la creacion de tipos.

### Estrategia y matriz de pruebas

M01-M09 y M11 son pruebas automatizadas en `src/api/client.test.ts`, con Vitest en entorno Node. M10 se reserva a la comprobacion manual de sesion.
Importar el cliente y el modulo de token reales; simular `fetch` y los globales de navegador necesarios para observar `auth:unauthorized`, sin montar React ni usar jsdom.
Usar respuestas controladas y tokens ficticios sin llamadas de red. Restaurar mocks/globales y limpiar el token entre pruebas, incluso ante fallos.
El test unitario de 401 verifica emision del evento y rechazo, no la ejecucion de AuthContext ni la redireccion: esas responsabilidades se comprueban en UI02.
Las simulaciones no demuestran disponibilidad, persistencia ni integracion real con backend; esta ultima sigue pendiente por pantalla conforme a R4.

| ID | Entrada/accion controlada | Resultado observable esperado | Estado |
|---|---|---|---|
| M01 | 400 con `{ "error": { "code": "VALIDATION_ERROR", "message": "Entrada invalida" } }`. | `ApiError`, status 400 y mensaje `Entrada invalida`. | Pasado 2026-09-22; fallo previo demostrado |
| M02 | 409 con `{ "message": "Mensaje raiz" }`. | `ApiError`, status 409 y mensaje `Mensaje raiz`. | Pasado 2026-09-22 |
| M03 | 500 con `{ "error": "Error textual" }`. | `ApiError`, status 500 y mensaje `Error textual`. | Pasado 2026-09-22 |
| M04 | 400 con `error.message` y `message` raiz distintos; repetir con `error.message` no string y raiz valida. | Primero prevalece el anidado; con anidado invalido se usa la raiz. | Pasado 2026-09-22; tambien raiz antes de error string |
| M05 | 502 con HTML/no JSON; repetir 400 con JSON `null`, `[]` y `{ "error": { "message": 7 } }`. | Mensaje `Error 502` o `Error 400`, conservando status y sin error de parseo/acceso. | Pasado 2026-09-22; tambien error array y raiz no string |
| M06 | 401 anidado con mensaje propio; repetir 401 no JSON y observar emision del evento. | Un `auth:unauthorized` por respuesta y `ApiError.status` 401. Se mantiene exactamente el mensaje especial existente en `src/api/client.ts:25`; no se exige el mensaje del backend. | Pasado 2026-09-22; JSON no invocado |
| M07 | Respuesta 204 sin cuerpo; observar que no se invoque su metodo `json` (instrumentarlo para fallar si se llama). | Promesa resuelta con `undefined`, sin error ni evento de desautorizacion. | Pasado 2026-09-22 |
| M08 | Token ficticio en memoria y peticion interceptada; repetir sin token y sin Authorization manual. | Con token, header `Authorization: Bearer <token ficticio>`; sin token, no se agrega Authorization. | Pasado 2026-09-22 |
| M09 | 200 objeto JSON y 200 array JSON vacio. | Se resuelven el objeto y `[]` sin envoltorios nuevos ni transformaciones. | Pasado 2026-09-22 |
| M10 | Sesion simulada activa; abrir ruta protegida y recargar sin volver a simular login. | Tras recarga, `/login` y token ausente; no se persiste sesion. | Pasado 2026-09-22; token null, ambos storages vacios |
| M11 | Fetch interceptado rechaza por fallo de red. | La promesa rechaza; no se fabrica exito, DTO ni evento 401. | Pasado 2026-09-22; mismo TypeError rechazado |

### Regresion manual de interfaz

Ejecutar M10 y UI01-UI03 en el navegador con el frontend de desarrollo. Para una comprobacion reproducible sin backend, interceptar temporalmente fetch con respuestas de login/Home y tokens ficticios, manteniendo interceptadas todas las peticiones posteriores; restaurar fetch, limpiar sesion y recargar al terminar. No cambiar paginas ni endpoints para preparar estos casos.

| ID | Accion | Resultado observable esperado | Estado |
|---|---|---|---|
| UI01 | Abrir Login, iniciar una sesion controlada y navegar a Home. | Login y Home conservan su comportamiento previo, sin errores nuevos atribuibles al cliente. No exigir corregir el indicador pendiente del modulo 7. | Pasado con observaciones 2026-09-22; escritorio y movil |
| UI02 | Con sesion activa, provocar una respuesta 401 interceptada. | AuthContext limpia token y sesion; se muestra Login y una ruta protegida no vuelve a ser accesible sin autenticacion. | Pasado 2026-09-22 |
| UI03 | Sin sesion, acceder directamente a una ruta protegida; repetir con sesion activa. | Sin sesion redirige a Login; con sesion permite acceso. | Pasado 2026-09-22; navegacion autenticada tambien movil |

Al ejecutar, registrar por ID: fecha, resultado pasado/fallido y observacion saneada; para build y Vitest, comando y codigo de salida.
No registrar JWT reales, credenciales, URLs privadas ni datos personales.
No se requieren peticiones mutadoras reales ni pruebas de integracion backend para esta matriz.

## Decisiones y pendientes

### Confirmado por el usuario

| Decision | Resolucion confirmada | Consecuencia |
|---|---|---|
| P1 | Lectura autorizada de `../backend/` y `../specs/`; directorios confirmados existentes. | Contratos contrastados sin acceder a secretos ni modificar backend. No queda pendiente de acceso. |
| P2-B | Cambios funcionales limitados a crear `src/api/types.ts` y corregir `src/api/client.ts`; P4-A permite pruebas y configuracion de soporte. | No migrar Login/Home; diferir no duplicacion y separar creacion de adopcion en el roadmap. |
| P3-A | Diseno en los modulos de pantalla. | Ningun rediseno en fundacion. |
| P4-A | Build, Vitest para cliente HTTP y regresion manual de interfaz. Sustituye la decision anterior P4-B por confirmacion posterior del usuario. | Agregar solo infraestructura unitaria minima, sin Testing Library ni jsdom; no implementar durante esta actualizacion documental. |

- El borrador inicial se guardo por definicion rapida; esta revision sustituye las opciones sin confirmar por las resoluciones anteriores.
- Actualizar solo esta spec; no implementar, no cambiar config, no instalar dependencias, no editar roadmaps ni hacer commits.
- La confirmacion de estas decisiones no cambia el estado de la spec a Aprobado ni autoriza implementar.

### Establecido por los documentos

- Modulo 1 tecnico y contratos centralizados en `src/api/types.ts`.
- Token en memoria y sin cambios en AuthContext, proteccion de rutas y opciones de QueryClient.
- Sin Redux ni otro gestor global complejo.
- Reglas operativas ejecutadas por el backend, no por la UI ni por la IA.
- No construir pantallas contra contratos inexistentes.

### Pendientes reales y preparacion

| ID | Pendiente | Impacto y momento |
|---|---|---|
| R1 | Resuelto para ejecutar por solicitud expresa posterior del usuario, reiterada para implementacion directa el 2026-09-22. | No se autoaprobo el borrador ni se reabrieron P1-P4. |
| R2 | Sincronizar roadmaps y referencias documentales enumeradas en la seccion siguiente. | Entrega documental separada; no se modifican aqui. No bloquea definir los nueve DTO ya verificados. |
| R3 | Ejecutado el 2026-09-22: build, 20 pruebas Vitest y M10/UI01-UI03 en navegador. | Resuelto en el alcance reducido; evidencia debajo. |
| R4 | Verificar disponibilidad e integracion contra el entorno backend al construir cada pantalla. | Lectura de codigo no demuestra despliegue. No hay bloqueo por ausencia de contrato o router en los nueve DTO inspeccionados. |

Los contratos tienen evidencia suficiente para la futura declaracion de tipos; no quedan campos pendientes de inventar.
La precedencia de mensajes y el detalle tecnico de los tipos estan sujetos a la revision de este borrador, no se presentan como implementados.

### Alternativas descartadas por el alcance documental

- Usar las tablas de `MODELO_DE_DATOS.md` como DTO completos: describen persistencia, no la respuesta HTTP.
- Persistir el token para evitar el retorno a Login: contradice la decision explicita del roadmap frontend.
- Implementar reglas de elegibilidad, estados o calculo de tarifas en esta fundacion: son responsabilidad del backend.
- Migrar Login/Home ahora: descartado por P2-B para conservar el orden de los modulos.
- Mantener solo build y matriz manual: sustituido por P4-A para proteger el cliente compartido con pruebas repetibles.
- Agregar Testing Library, jsdom o pruebas de componentes en este modulo: fuera del alcance de la automatizacion focalizada aprobada.
- Incluir rediseno o una spec visual adicional en esta entrega: descartado por P3-A.

## Riesgos y dependencias documentales

| Riesgo o inconsistencia | Tratamiento previsto |
|---|---|
| El roadmap afirma que el cliente ya convierte `error.message`, pero el codigo no lo hace. | Tomar la lectura de `src/api/client.ts:23-40` como evidencia del trabajo pendiente. |
| El roadmap de endpoints cita una spec de Configuracion descartada por la implementada. | Usar `../backend/specs/04-configuracion.md:13` y el controlador real; sincronizacion pendiente R2. |
| Los modulos 7 a 10 figuran bloqueados, pero dashboard/tarifas ya estan montados. | Retirar esa premisa de esta spec y registrar actualizacion del roadmap; no confundir montaje con despliegue. |
| Crear tipos centrales sin migrar paginas deja contratos locales incorrectos temporalmente. | Excepcion aceptada P2-B; Login sigue con alternativas de token y Home con nombre incorrecto hasta modulos 2/7. |
| Inferir caducidad solo de ubicacion nula y fecha presente confunde GPS invalidado con caducado. | Conservar ambos campos sin estado visual inventado; resolver representacion en modulo 8. |
| Interpretar un HTTP 204 como objeto puede ocultar usos incorrectos del generico. | Revisar su uso sin fabricar contenido para respuestas vacias. |
| Cambios ajenos en el worktree. | Preservar `opencode.json`, `.agents/`, `.claude/` y cualquier otro cambio no perteneciente a esta tarea. |

### Sincronizacion documental pendiente (R2)

No se editan los archivos siguientes en esta tarea.

- `../docs/ROADMAP_FRONTEND.md:39,50-53,374`: separar creacion de los nueve contratos de migracion de consumidores; registrar que no duplicacion queda diferida por P2-B.
- `../docs/ROADMAP_FRONTEND.md:65-67,241-243,375,380`: mantener correccion/adopcion de TokenAdmin en modulo 2 y de Indicadores en modulo 7, sin darlas por terminadas por fundacion.
- `../docs/ROADMAP_FRONTEND.md:22-23,35`: distinguir soporte actual del cliente y la correccion futura de errores; no afirmar que ya lee `error.message`.
- `../docs/ROADMAP_FRONTEND.md:234-235,266,306,338-339,380-397`: actualizar los bloqueos por endpoints no montados con evidencia de `../backend/src/app.ts:30-31` y sus routers; conservar verificacion de integracion por entorno.
- `../docs/ROADMAP_ENDPOINTS.md:16-17`: sustituir la referencia de Configuracion por `backend/specs/04-configuracion.md`, sin heredar GET publico ni PUT vacio de la spec antigua.
- `../docs/ROADMAP_ENDPOINTS.md:178`: precisar `POST /api/tarifas`, `PATCH /api/tarifas/:id`, `vigenciaDesde` camelCase solo en alta y fecha inmutable en PATCH.
- `../docs/ROADMAP_FRONTEND.md:215-218`: corregir la afirmacion de crear vehiculo mediante PATCH si es `null`; el servicio actual responde 404 `Vehiculo no encontrado` y no crea uno (`../backend/src/modules/conductores/conductores.service.ts:92-106`). Es un pendiente del modulo 6, no trabajo de fundacion.
- `../docs/ROADMAP_FRONTEND.md:279-282`: precisar que fecha presente con ubicacion nula no identifica exclusivamente caducidad; tambien ocurre con `esValida: false`, segun el serializador verificado.

Las discrepancias anteriores no dejan ningun DTO de este inventario sin fuente implementada.
La disponibilidad de una instancia y la ejecucion de pruebas siguen sin comprobarse en esta tarea.

## Que no incluye esta spec

- Implementacion de codigo como parte de su creacion.
- Aprobacion automatica ni inicio de una rama de implementacion.
- Contratos backend inventados o acceso a directorios no autorizados.
- Nuevas pantallas, rediseno visual, integracion de mapas o gestion de solicitudes y tarifas.
- Modificaciones de backend, base de datos, reglas de negocio o persistencia de sesion.
- Migracion de Login/Home, eliminacion global de duplicados o afirmacion de que todas las paginas ya consumen los tipos centrales.
- Cambios a roadmaps; instalacion de dependencias, configuracion o implementacion de pruebas durante esta actualizacion documental. La futura implementacion si incluye el soporte minimo de Vitest definido por P4-A.
- Declarar aprobado o implementado el modulo antes de la revision y de las verificaciones correspondientes.

## Ejecucion y evidencia

Fecha real de ejecucion: **2026-09-22**, comprobada con `Get-Date -Format yyyy-MM-dd` (salida 0).
Esta seccion actualiza las afirmaciones historicas de trabajo futuro/no ejecutado de la revision documental.

### Contratos y alcance

- Backend: `git rev-parse HEAD` (salida 0) devolvio `5a8ecb5c459793e5301077f3d8d2053163ff350e`.
- `git status --short` en backend, antes y despues (salida 0), sin cambios; `git diff --stat 5a8ecb5c459793e5301077f3d8d2053163ff350e -- src prisma tests` (salida 0), sin diferencias.
- Relectura de auth.service, schemas de configuracion, conductores, dashboard, solicitudes y tarifario y enums Prisma: coinciden con las nueve declaraciones implementadas. No hay deriva respecto de las fuentes de esta spec.
- `types.ts`: exactamente nueve interfaces DTO exportadas y cuatro uniones auxiliares, todos los campos requeridos, nulabilidad explicita, sin imports ni codigo runtime.
- Solo cambios funcionales en `types.ts` y extraccion no 401 de `client.ts`; soporte en `client.test.ts`, `package.json`, `package-lock.json` y `vitest.config.ts`. Este documento registra la evidencia autorizada.
- `git diff --exit-code -- src/pages src/context src/router.tsx src/App.tsx src/components src/index.css src/api/token.ts vite.config.ts` (salida 0), sin diferencias. `git diff --check` (salida 0), sin errores de espacios; solo avisos de conversion LF/CRLF.
- Cambios ajenos iniciales en `opencode.json`, `.agents/`, `.claude/` y demas specs preservados. Sin commits, cambios backend ni roadmaps; sin lectura de secretos o archivos de entorno.

### Comandos y resultados

| Comando / etapa | Salida | Evidencia |
|---|---|---|
| `node --version` | 0 | v24.20.0 |
| `npm ls vite typescript --depth=0` | 0 | Vite 6.4.3, TypeScript 5.9.3 |
| `npx tsc -b`, tras cada uno de los cuatro incrementos DTO | 0 en las cuatro ejecuciones | Compilacion sin migrar consumidores |
| `npm view vitest@4.1.6 engines dependencies.vite` | 0 | Node ^20 / ^22 / >=24; Vite ^6 / ^7 / ^8 |
| `npm install --save-dev --save-exact vitest@4.1.6` | 0 | Instalacion inicial para demostrar regresion |
| `npm run test:unit -- -t M01`, antes del cambio de cliente | 1 esperado | M01 fallo: `ApiError: Error 400`, se esperaba `Entrada invalida`; 19 casos omitidos por el filtro, no superados en esa ejecucion |
| `npm run test:unit`, despues del cambio, Vitest 4.1.6 | 0 | 20/20 pruebas pasadas |
| `npm run build`, primera ejecucion | 0 | TypeScript y Vite, 112 modulos |
| `npm audit --omit=optional`, version inicial | 1 | Aviso moderado GHSA-82fw-gwwq-j7x9 en mocker/Vitest; resuelto con parche |
| `npm view vitest@4.1.11 engines dependencies.vite` | 0 | Mismos rangos compatibles |
| `npm install --save-dev --save-exact vitest@4.1.11` | 0 | Parche de seguridad, sin actualizar Vite/TypeScript ni el resto del stack |
| `npm run test:unit`, version final 4.1.11 | 0 | 1 archivo, 20/20 pruebas pasadas, M01-M09 y M11 |
| `npm run build`, version final | 0 | 112 modulos; JS 401.40 kB, CSS 18.88 kB |
| `npm audit`, version final | 0 | 0 vulnerabilidades informadas |
| `npm ls vite typescript vitest --depth=0` | 0 | Vite 6.4.3, TypeScript 5.9.3, Vitest 4.1.11 |

Se cargo el skill `context7-mcp` y se consulto Context7 `/vitest-dev/vitest/v4.1.6`: requisitos Node >=20/Vite >=6, configuracion separada en Node y restauracion `vi.unstubAllGlobals`. La version final parcheada se contrasto ademas con metadatos npm. No se instalaron Testing Library ni jsdom. npm aviso del script de instalacion de esbuild no aprobado; no se cambio esa politica y build/pruebas funcionaron.

Las 20 pruebas importan cliente/token reales y sustituyen fetch/window. Usan Response/CustomEvent disponibles en Node 24; no realizan red. `afterEach` limpia token, globales, spies y mocks incluso al fallar. Los IDs y variantes efectivamente comprobados estan en la matriz actualizada y en `src/api/client.test.ts`.

### Navegador

Frontend de desarrollo iniciado localmente mediante `Start-Process -FilePath 'node' -ArgumentList 'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort' -PassThru` (salida 0). Se uso Playwright con interceptacion antes de navegar: todos los fetch/XHR y rutas API respondidos en memoria; recursos externos bloqueados. Solo recursos frontend locales fueron permitidos. Ninguna autenticacion real ni mutacion backend.

| Caso / fecha | Resultado observado |
|---|---|
| UI01 / 2026-09-22 | Login con datos ficticios permitio Home. Indicadores visibles 3, 2, 1, 0 ante respuesta 3, 2, 1, `solicitudesCompletadasHoy: 4`; el ultimo 0 es el defecto conocido de Home diferido. Sin desbordamiento horizontal a 1365x900 y 390x844; Login movil tambien sin desbordamiento. |
| UI03 / 2026-09-22 | Entrada directa a `/conductores` sin sesion redirigio a `/login`; tras login, navegacion a `/conductores` mostro su encabezado. Repetido acceso autenticado mediante menu movil. |
| M10 / 2026-09-22 | Desde `/conductores` autenticado, recarga sin nuevo login redirigio a `/login`; `getToken()` real devolvio null y localStorage/sessionStorage tenian longitud 0. |
| UI02 / 2026-09-22 | Cliente real recibio 401 interceptado desde ruta ficticia de prueba: status 401 y mensaje especial intactos. AuthContext redirigio a Login, token null; intento de volver a ruta protegida mediante navegacion SPA fue rechazado. |

Ejecucion consolidada: siete peticiones simuladas (tres login POST, tres indicadores GET y un GET 401 ficticio); Bearer ficticio presente en los cuatro GET y ausente en login. Cero excepciones `pageerror`. La primera preparacion del harness encontro `URL is not defined` en el contexto de la herramienta; se corrigio el interceptor sin modificar la aplicacion y se repitio la matriz completa.

Observacion no atribuible al cambio: durante login se registro el aviso React `Cannot update a component (BrowserRouter) while rendering a different component (Login)`, consistente con el `navigate` durante render ya presente en `Login.tsx:47-49`. Login se mantuvo intacto. UI01 pasa en su criterio de no introducir errores del cliente, no afirma una consola global libre de defectos previos ni una comparacion visual pixel a pixel.

Limpieza comprobada en `finally`: cierre de sesion, token null, storages vacios, recarga a Login y retirada de todos los interceptores. Se cerro el navegador y se detuvo solo el proceso Vite creado para esta verificacion (`Stop-Process -Id 13812`, salida 0).

### Cierre

Los diez criterios de aceptacion del alcance reducido estan comprobados. No quedan bloqueos de implementacion ni verificaciones de esta matriz pendientes. R2 (sincronizacion documental), R4 (integracion real backend por pantalla) y adopcion de contratos/eliminacion de tipos locales en modulos 2/7 siguen pendientes y no se declaran superados. Esta verificacion simulada no acredita despliegue, disponibilidad ni integracion real del backend.
