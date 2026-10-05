# SPEC 09 - Solicitudes activas

> **Estado:** Borrador
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 02 (`02-autenticacion-admin.md`, INT01 pendiente), SPEC 03 (`03-shell-y-navegacion.md`, INT03 pendiente).
> **Patron de referencia:** SPEC 05 (`05-conductores-listado-estados.md`), SPEC 07 (`07-indicadores-inicio.md`) y SPEC 08 (`08-mapa-administrativo.md`).
> **Contrato externo:** `../backend/specs/11-tarifario-dashboard.md`, seccion 3.5, y `../docs/ROADMAP_FRONTEND.md:522-567`.
> **Fecha:** 2026-10-03
> **Objetivo:** Construir la pantalla de solicitudes activas de solo lectura con los datos del backend, badges de estado y actualizacion periodica cada 10-15 segundos.

## Estado de la definicion

El usuario autorizo crear este archivo para revisarlo, no implementar el modulo.
Las cinco recomendaciones planteadas durante la investigacion no recibieron confirmacion explicita.
Se conservan como P1-P5 pendientes de aprobacion, no como decisiones tomadas.
El plan describe una implementacion futura y queda condicionado a cerrar esas propuestas y aprobar la spec.

Las rutas de fuentes y codigo se expresan respecto de `frontEnd/`, salvo los nombres de specs locales del encabezado.
No se ejecutaron pruebas, build ni peticiones al backend para preparar este borrador.

## Contexto y fuentes

`src/pages/Solicitudes.tsx` es un stub sin consulta de datos.
La ruta protegida y el contrato central ya existen.
El modulo no necesita nuevas entidades, endpoints ni cambios de base de datos.

| Fuente | Referencia relevante |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:522-567` | Alcance del modulo 9, seis estados activos, columnas, polling y solo lectura. |
| `../docs/ROADMAP_FRONTEND.md:45-55,80-87` | Query estrictamente vacia, polling y clave estable `['solicitudes-activas']`. |
| `../docs/ARQUITECTURA.md:19-26,64-70` | Backend como fuente de verdad y asignacion manual fuera del MVP. |
| `../docs/MODELO_DE_DATOS.md:127-151` | Entidad Solicitud, fechas, destino opcional y enum completo. No sustituye el DTO HTTP. |
| `../docs/REGLAS_DE_NEGOCIO.md:8-17,44-50` | Reglas 1, 5, 6 y 10 observadas por esta pantalla; estados y tiempos controlados por backend. |
| `../docs/ROADMAP_ENDPOINTS.md:173-181` | Resumen del endpoint de supervision; su lista de terminales esta incompleta. |
| `../backend/specs/11-tarifario-dashboard.md:397-428` | Contrato especifico, nulabilidad y prohibicion de inferir transiciones por fecha vencida. |
| `../backend/src/modules/dashboard/dashboard.service.ts:103-157` | Proyeccion real, relaciones eliminadas como `null`, filtro y orden estable. |
| `../backend/src/modules/dashboard/dashboard.router.ts:7-13` | Ruta protegida por administrador. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:96-100` | Tabla con identificador, pasajero, conductor, estado y creacion; polling sin mutaciones. |
| `references/pantallas/solicitudes.html:13-18` | Entrada HTML del prototipo; el contenido se genera desde `app.js`. |
| `references/pantallas/app.js:96-99,144-146` | Tabla, busqueda, filtro de estados, aviso de supervision y pie del prototipo. |
| `src/api/types.ts:4-6,65-75` | `EstadoSolicitud` y `SolicitudActiva` centrales. |
| `src/components/EstadoBadge.tsx:1-35` | Mapas compartidos de etiquetas y estilos; cobertura incompleta de solicitudes. |
| `src/router.tsx:13-16,28` y `src/components/Layout.tsx:81` | Ruta protegida `/solicitudes` y entrada existente del menu. |
| `src/pages/Home.tsx:55-105` | Referencia de lectura cancelable, pausa por visibilidad y bloqueo sincrono del refresco manual. |
| `src/lib/indicadores.ts:44-83` | Referencia de retry por status, errores y formateo con zona explicita. |
| `src/api/client.ts:15-53` | Bearer, signal, `ApiError`, evento 401 y descarte de respuestas de otra sesion. |
| `src/context/AuthContext.tsx:18-34` | Cancelacion y limpieza de cache al cerrar sesion. |
| `specs/07-indicadores-inicio.md` y `specs/08-mapa-administrativo.md` | Convenciones de criterios, pruebas simuladas e integracion real separada. |

### Discrepancias que no deben copiarse

- El filtro del prototipo incluye `sin_conductor` y omite `conductor_seleccionado`. El contrato incluye el segundo y excluye el primero.
- Los IDs `#TS-0849` del prototipo son ficticios. El servidor entrega UUID y no publica un numero comercial de solicitud.
- El prototipo no muestra `destino` ni `expiraEn`; el roadmap si los requiere. La especificacion base tambien requiere el identificador.
- `ROADMAP_ENDPOINTS.md:180` omite `sin_conductor` entre los terminales excluidos. Prevalecen el contrato especifico y el servicio real.
- `EstadoBadge` no tiene etiquetas ni estilos explicitos para `creada`, `conductor_seleccionado` y `aceptada`. Su fallback no basta para una presentacion terminada.
- El prototipo colorea `buscando` en ambar; el componente actual lo colorea en azul. Se propone alinear la presentacion de solicitudes con el prototipo sin alterar los estados de conductor o jornada.
- El aviso del prototipo atribuye todos los cambios al sistema automatico. La Regla 10 reserva la finalizacion al conductor; se propone un texto neutral que solo aclare que el administrador no modifica solicitudes desde esta vista.
- El roadmap aun describe Inicio y Mapa como pendientes, aunque sus implementaciones y registros de evidencia ya existen. Estos registros no acreditan integracion real.

## Alcance

### Requisitos confirmados por roadmap y contrato

- Sustituir el stub dentro de `src/pages/Solicitudes.tsx`, conservando `/solicitudes`.
- Consumir exclusivamente `GET /api/dashboard/solicitudes-activas` para los datos de esta pantalla.
- Mantener la query key exacta `['solicitudes-activas']`.
- Importar `SolicitudActiva` desde `src/api/types.ts`, sin duplicar el DTO.
- Mostrar identificador, pasajero, conductor asignado, estado, creacion, destino y expiracion cuando exista.
- Representar pasajero o conductor nulos con un guion largo, sin retirar la fila ni recuperar datos de otra fuente.
- Conservar el orden de la respuesta del backend.
- Mostrar los seis estados activos con `EstadoBadge`.
- Refrescar mediante polling en el intervalo de 10-15 segundos.
- Mantener el ciclo de vida exclusivamente en backend; no expirar, reasignar ni finalizar solicitudes desde esta pantalla.
- No agregar query string: filtros, orden y paginacion de servidor no estan admitidos por esta ruta.

### Propuestas de trabajo pendientes de aprobacion

Ninguna opcion recomendada de esta tabla se considera aprobada por la peticion de crear el archivo.
Los criterios y pasos identificados con P1-P5 solo aplicaran si se acepta su propuesta correspondiente.

| ID | Decision pendiente | Propuesta recomendada | Alternativa para revision |
|---|---|---|---|
| P1 | Controles de consulta | Busqueda local por ID, pasajero o conductor y selector con Todos mas los seis estados activos. Sin peticiones adicionales ni parametros HTTP. | Listado sin busqueda ni selector. |
| P2 | Identificador y movil | UUID completo con ajuste de linea; tabla desde 1024 px y tarjetas debajo, con los mismos siete campos. | UUID abreviado con acceso accesible al completo; o tabla con desplazamiento horizontal interno en movil. |
| P3 | Fechas y expiracion | Fecha y hora absolutas en `es-BO` / `America/La_Paz`, formato de 24 horas y segundos en expiracion; sin cuenta regresiva ni interpretacion local del estado. | Cuenta regresiva informativa adicional, que requeriria definir reloj, actualizacion y texto al vencer sin mutar el estado. |
| P4 | Refresco y errores | Polling de 15 s con pausa al ocultar la pestana, boton Actualizar y ultima lectura conservada con aviso ante fallo de red/servidor. | Polling de 10 s con el mismo tratamiento de visibilidad y errores. |
| P5 | Coordenadas | No presentarlas en esta pantalla. Permanecen en el DTO sin usarse. | Mostrar latitud y longitud como texto, sin mapa, enlaces geograficos ni geocodificacion. |

Las siguientes concreciones son tambien propuestas de este borrador, no requisitos impuestos por el contrato:

- Conservar el titulo actual `Solicitudes activas`, coincidente con el prototipo y el roadmap, sin modificar el menu `Solicitudes`.
- Subtitulo del prototipo: `Supervisa la atencion de pasajeros y el estado de cada solicitud.`
- Aviso: `Vista de supervision. Desde esta pantalla no se reasignan solicitudes ni se modifican sus estados.`
- Sin enlaces al detalle del conductor ni al detalle de solicitud en esta entrega; los nombres son texto.
- Filtros y busqueda en memoria del componente, sin persistencia ni sincronizacion con la URL.
- Para P1: busqueda por coincidencia parcial, recortando espacios externos e ignorando mayusculas; sin normalizacion adicional de acentos.
- Para P1: conservar filtro y busqueda durante refetch, distinguir respuesta vacia de ausencia de coincidencias y ofrecer Limpiar filtros solo en el segundo caso.
- Para P3: destino y expiracion nulos usan el mismo guion visual; una fecha no interpretable muestra `Fecha no disponible`.
- Para P4: volver a una pestana visible reanuda el polling, sin exigir una lectura inmediata adicional.
- Mostrar el total recibido y, con filtros, el numero visible sobre ese total; no consultar indicadores para obtenerlo.
- No mostrar un timestamp ficticio ni afirmar que existe actualizacion en vivo por socket.

### Fuera de alcance

- Mutaciones de solicitudes, asignacion manual, finalizacion, busqueda de candidatos o reparacion de estados.
- Historico, exportacion, paginacion, ordenamiento por columna, analitica o panel de solicitudes dentro de Inicio.
- Mapas de recogida, rutas, ETA, geocodificacion, telefonos, WhatsApp, vehiculos o datos que no publica el DTO.
- Realtime, WebSockets y cambios del modulo 11.
- Nuevos contratos, endpoints, migraciones, seeds, cuentas, dependencias o configuracion de entorno.
- Refactorizar el shell, autenticacion, QueryClient o los patrones de todas las pantallas.
- Resolver errores preexistentes de otros modulos o cerrar sus integraciones pendientes.
- Implementar codigo en la entrega de este documento.

## Modelo de datos y contratos

No se introducen entidades persistentes ni DTO nuevos.
Se reutiliza `SolicitudActiva` de SPEC 01 tal como existe en `src/api/types.ts:65-75`.

### Lectura

`GET /api/dashboard/solicitudes-activas` devuelve `SolicitudActiva[]` directamente, sin envoltorio.
Una respuesta correcta sin solicitudes es `200 []`.
Requiere Bearer de administrador y el exito lleva `Cache-Control: no-store`.

| Campo | Tipo publicado | Presentacion prevista |
|---|---|---|
| `id` | `string` UUID | Identificador real; formato pendiente P2. Clave estable de fila/tarjeta. |
| `estado` | `EstadoSolicitud` | Badge textual. El tipo admite diez valores, pero este endpoint entrega seis activos. |
| `pasajero` | `{ id: string; nombre: string }` o `null` | Nombre o guion; no hay telefono ni WhatsApp. |
| `conductorAsignado` | `{ id: string; nombreCompleto: string }` o `null` | Nombre o guion; no hay vehiculo ni ID plano alternativo. |
| `latitudRecogida` | `number` | Visibilidad pendiente P5. |
| `longitudRecogida` | `number` | Visibilidad pendiente P5. |
| `destino` | `string` o `null` | Texto completo con ajuste de linea; fallback nulo propuesto arriba. |
| `expiraEn` | `string` ISO datetime o `null` | Solo informacion temporal; formato pendiente P3. |
| `creadoEn` | `string` ISO datetime | Creacion, con formato pendiente P3. |

No se renombra ni restringe globalmente `EstadoSolicitud` a seis valores.
Los filtros de presentacion, si se aprueban, tendran su propia lista de seis estados.

### Invariantes de negocio

- Activos: `creada`, `buscando`, `conductor_seleccionado`, `esperando_respuesta`, `aceptada`, `en_servicio`.
- Terminales excluidos por servidor: `finalizada`, `rechazada`, `expirada`, `sin_conductor`.
- El servicio filtra `eliminadoEn: null` de la solicitud y ordena por `creadoEn DESC, id DESC`.
- Las relaciones eliminadas se proyectan como `null`; la solicitud permanece visible.
- Un conductor nulo no permite inferir que la solicitud esta buscando: tambien puede representar una relacion eliminada.
- Un `expiraEn` pasado no permite inferir `expirada`. Ni GET ni la UI ejecutan transiciones por leer ese dato.
- El backend obtiene una instantanea consistente por respuesta. No se exige igualdad con indicadores consultados en otro momento.
- La siguiente lectura correcta reemplaza el conjunto anterior; no se conservan filas ausentes como si siguieran activas.

### Presentacion propuesta de badges

| Estado activo | Etiqueta | Color propuesto desde tokens existentes |
|---|---|---|
| `creada` | Creada | Ambar |
| `buscando` | Buscando conductor | Ambar |
| `conductor_seleccionado` | Conductor seleccionado | Ambar |
| `esperando_respuesta` | Esperando respuesta | Ambar |
| `aceptada` | Aceptada | Verde |
| `en_servicio` | En servicio | Azul |

Se propone completar los mapas de `EstadoBadge` sin cambiar su API ni los estados compartidos de conductor/jornada.
No es necesario ampliar los cuatro terminales para completar este modulo.
Las etiquetas y el punto de color deben seguir siendo legibles sin depender exclusivamente del color.

## Puntos de integracion

| Pieza existente | Uso previsto, sujeto a aprobacion del diseno |
|---|---|
| `src/pages/Solicitudes.tsx` | Unica pantalla a sustituir; no mover ni renombrar. |
| `src/api/types.ts` | Importar `SolicitudActiva`; sin cambios de contrato. |
| `src/api/client.ts` | Usar `apiFetch` con el signal de la consulta, como Inicio. `http.get` actual no admite opciones. |
| `src/context/AuthContext.tsx` | Habilitar lectura con sesion activa; reutilizar logout y descarte de sesion, sin logica duplicada. |
| `src/App.tsx` | Reutilizar QueryClient. Definir retry local sin alterar las opciones globales. |
| `src/components/EstadoBadge.tsx` | Completar presentacion de estados activos y verificar regresiones en otras pantallas. |
| `src/components/ui/button.tsx` y `alert.tsx` | Reutilizar controles y avisos del sistema visual. |
| `src/index.css` | Consumir tokens existentes; no cambiar estilos globales como parte de esta spec. |
| `src/router.tsx` y `src/components/Layout.tsx` | Conservar ruta y navegacion; el shell sigue haciendo su propia consulta de configuracion. |

La restriccion de una unica ruta API se refiere a las consultas iniciadas por Solicitudes.
No prohibe el GET de configuracion que ya realiza el shell.
SPEC 07 y SPEC 08 son referencias, no dependencias funcionales del listado.
No se importa logica de mapas o indicadores solo para reutilizar nombres de helpers de otro dominio.

## Lectura, errores y sesion propuestos

Esta seccion concreta P4 para revision, manteniendo los comportamientos de autenticacion ya existentes.

| Situacion | Comportamiento propuesto |
|---|---|
| Primera lectura pendiente | Mensaje de carga, sin filas ficticias ni contador cero antes de recibir datos. |
| Exito con `[]` | `No hay solicitudes activas`; total cero. No confundir con error. |
| Exito con datos | Mostrar filas en orden recibido. |
| Filtro sin coincidencias, si P1 | Mensaje distinto al vacio global y boton Limpiar filtros. |
| Refetch en curso | Conservar datos anteriores; no volver al esqueleto. |
| Red o `5xx` sin datos | Error con `role="alert"` y Reintentar. |
| Red o `5xx` con datos | Conservar ultima lectura y mostrar aviso `role="status"`: los datos pueden estar desactualizados. |
| `400`, `403` o `404` | Mostrar mensaje del backend, sin retry automatico ni boton Reintentar; no presentarlo como lista vacia. Con datos anteriores, indicar que no se pudieron actualizar. |
| `401` | Reutilizar cierre de sesion y redireccion globales; no duplicarlos ni impedirlos. |
| Cancelacion | No anunciar `AbortError` ni cancelaciones de consultas como error de usuario. |

Propuesta de retry: como maximo un reintento automatico por fallo de red (`TypeError`) o `5xx`, nunca por `4xx`.
El polling periodico es distinto del retry de una peticion: segun esta propuesta permanece programado mientras la vista este visible.
`Actualizar` y `Reintentar` comparten una guarda contra lecturas simultaneas y un bloqueo sincrono contra multiples clics en el mismo tick.
Los errores se clasifican por `ApiError.status`, nunca analizando palabras del mensaje.
No se presupone que `ApiError` exponga `code`.

No se propone actualizacion optimista ni escrituras manuales en otras claves de cache.
La lectura conserva la proteccion existente frente a respuestas tardias de otra sesion.
No se persisten solicitudes en almacenamiento del navegador.

## Accesibilidad y movil propuestos

- Un unico `h1` y controles nativos con nombres accesibles y foco visible.
- Tabla con encabezados asociados; tarjetas con etiquetas de todos los campos si se aprueba P2.
- Representaciones responsivas sin contenido duplicado simultaneamente en el arbol accesible.
- UUID, nombres largos y destinos extensos no desbordan la pagina.
- Guion de relacion nula con texto accesible neutral: `Pasajero no disponible` o `Conductor no disponible`, sin adivinar el motivo.
- Iconos y puntos decorativos con `aria-hidden`; estado siempre expresado en texto.
- No anunciar cada fila en cada polling ni mover el foco por actualizar datos.
- Anunciar acciones manuales, errores y avisos, no toda la tabla como region viva.
- Validar 320, 768, 1024 y 1280 px y zoom 200 %. Con P2 recomendado no hay desplazamiento horizontal de pagina ni tabla.
- Si no se usa lector de pantalla o telefono fisico, registrar esa limitacion expresamente.

## Archivos previstos

Esta es una propuesta de impacto, no una lista de archivos implementados.
El unico archivo creado en la entrega documental es esta spec.

| Archivo | Cambio futuro previsto |
|---|---|
| `src/pages/Solicitudes.tsx` | Consulta, render y estados; controles opcionales segun P1-P5. |
| `src/components/EstadoBadge.tsx` | Etiquetas y estilos de los seis estados activos, con cambio acotado. |
| `src/lib/solicitudes.ts` | Nuevo: clave, presentacion y helpers puros de lectura; filtros y fechas solo segun decisiones aprobadas. |
| `src/lib/solicitudes.test.ts` | Nuevo: pruebas de los helpers aprobados. |
| `src/pages/Solicitudes.css` | Condicional: solo si el responsive aprobado necesita reglas que no convenga expresar con utilidades existentes. Justificar antes de agregarlo. |
| `specs/09-solicitudes-activas.md` | Cerrar decisiones y, en una fase posterior, registrar evidencia real por criterio. |

No se preven cambios en contratos, cliente HTTP, token, contexto, router, Layout, QueryClient, paquetes ni configuracion de specs.
No crear hooks o componentes genericos para logica de una sola pantalla.
La ubicacion de un eventual arnes persistido de navegador se definira antes de crearlo; las specs previas tambien admiten recorridos sin agregar dependencias de pruebas.
No se modifica el roadmap ni un indice en esta entrega.

## Plan de implementacion propuesto

Prerequisito: resolver P1-P5 y revisar las concreciones propuestas antes de marcar la spec como Aprobado.
No ejecutar estos pasos durante la entrega documental.
Cada incremento debe dejar el sistema funcional y llevar su verificacion asociada.
Si un incremento excede 30-50 lineas de cambio, dividirlo en pasos ejecutables mas pequenos durante la preparacion de la implementacion.

1. Registrar la linea base de tipos, pruebas y build antes de editar codigo. Distinguir fallos heredados y no corregir otros modulos de forma implicita.
2. Crear `src/lib/solicitudes.ts` con la clave exacta y constantes de estados, mas sus pruebas unitarias. No duplicar el DTO central.
3. Completar los badges activos y verificar su render sin alterar los badges de Conductores.
4. Incorporar los helpers de error/retry acordados y sus pruebas. Agregar el formateo temporal solo tras cerrar P3.
5. Conectar la consulta cancelable en `Solicitudes.tsx` y mostrar carga, error inicial y vacio correcto. Conservar autenticacion y ruta existentes.
6. Renderizar las filas con los campos del contrato y nulos seguros. Probar orden, identificadores, relaciones eliminadas y fecha vencida sin transicion local.
7. Incorporar el polling aprobado en P4 y la conservacion de datos anteriores ante fallos. Probar pausa y reanudacion por visibilidad.
8. Incorporar Actualizar/Reintentar con guardas sincronas. Verificar clics repetidos, cancelacion y cambio de sesion.
9. Si se aprueba P1, incorporar busqueda y selector locales con sus pruebas. Mantener el orden del servidor y distinguir vacios.
10. Aplicar P2 y P5, junto con encabezado, aviso y accesibilidad revisados. Verificar contenido equivalente en escritorio y movil.
11. Registrar evidencia por criterio y limitaciones. Mantener INT09 pendiente mientras no exista integracion real autorizada.

Las pruebas acompanian los incrementos; no se dejan todas para el ultimo paso.
El ultimo paso es documentar resultados, no agregar funcionalidad fuera del alcance.

## Criterios de aceptacion

Todas las casillas quedan sin marcar en este borrador.
Los criterios propuestos no acreditan aprobacion ni ejecucion.

### Confirmados por contrato y alcance

- [ ] C01: `/solicitudes` usa `SolicitudActiva` central sin declarar un DTO de servidor duplicado.
- [ ] C02: La pantalla consulta `GET /api/dashboard/solicitudes-activas` sin query string y con clave `['solicitudes-activas']`.
- [ ] C03: Se muestran identificador, pasajero, conductor, estado, creacion, destino y expiracion cuando existe.
- [ ] C04: Los seis estados activos tienen etiquetas legibles mediante `EstadoBadge`.
- [ ] C05: Pasajero o conductor nulo se muestran con guion, sin excluir la solicitud ni inferir su estado.
- [ ] C06: Las filas conservan el orden recibido y no se truncan por paginacion local.
- [ ] C07: `expiraEn` pasado no cambia estado, oculta fila ni dispara escrituras.
- [ ] C08: Una lectura posterior reemplaza la lista; una solicitud ausente deja de mostrarse.
- [ ] C09: El listado se actualiza automaticamente en el intervalo aprobado de 10-15 segundos.
- [ ] C10: No hay controles de mutacion, peticiones de escritura ni codigo Realtime.
- [ ] C11: No se inventan numeros comerciales, telefonos, vehiculos ni datos de relaciones eliminadas.

### Propuestos de UX y robustez

- [ ] P1-A: Si se aprueba P1, busqueda y estado se combinan localmente sin peticiones adicionales ni parametros HTTP.
- [ ] P1-B: El selector incluye Todos y exactamente los seis estados activos; los filtros sobreviven al refetch y se pueden limpiar.
- [ ] P1-C: Ausencia de coincidencias se distingue de una respuesta `[]` del servidor; los conteos distinguen visibles y total.
- [ ] P2-A: Si se aprueba P2 recomendado, el UUID completo esta disponible sin truncamiento y las tarjetas bajo 1024 px contienen los mismos campos que la tabla.
- [ ] P3-A: Si se aprueba P3 recomendado, fechas usan `America/La_Paz` y expiracion incluye segundos; nulos y fechas invalidas tienen fallback definido.
- [ ] P4-A: Si se aprueba P4 recomendado, hay polling visible de 15 s y no hay lecturas periodicas con la pestana oculta.
- [ ] P4-B: Actualizar y Reintentar no solapan lecturas; tres clics en el mismo tick producen una sola lectura manual.
- [ ] P4-C: Carga, lista vacia y error inicial son distinguibles; un refetch no vuelve al esqueleto.
- [ ] P4-D: Red/5xx con datos previos conserva la ultima lectura y muestra aviso de desactualizacion con recuperacion manual.
- [ ] P4-E: Retry automatico limitado a una vez para red/5xx; los 4xx no disparan ese retry.
- [ ] P5-A: Si se aprueba P5 recomendado, no se presentan coordenadas ni se integra un mapa; si se elige texto, el criterio se reemplaza antes de aprobar.
- [ ] U01: Un 401 mantiene logout y redireccion existentes; un 403 muestra el mensaje sin cerrar sesion.
- [ ] U02: Respuestas tardias de sesion A no se pintan en B; cancelaciones no se anuncian como errores.
- [ ] U03: No se persisten solicitudes, filtros ni busqueda en almacenamiento local.
- [ ] U04: Badges, teclado, foco, roles y responsive cumplen la seccion de accesibilidad aprobada.
- [ ] U05: Los badges de conductor y jornada, la navegacion y las pantallas existentes no presentan regresiones atribuibles al modulo.

### Verificacion y cierre

- [ ] V01: `npm run test:unit` termina correctamente, con evidencia y sin atribuir mocks a integracion.
- [ ] V02: `npm run build` termina correctamente. Si falla por otro modulo, registrar el bloqueo y dejar esta casilla sin marcar.
- [ ] V03: Los escenarios de navegador se ejecutan con API interceptada y datos ficticios, sin trafico real accidental.
- [ ] INT09: GET autenticado con administrador real verificado en entorno autorizado, incluyendo respuesta, permisos y `Cache-Control: no-store`.

## Estrategia de verificacion

Propuesta: seguir las SPEC 07 y 08 con Vitest para helpers y navegador para render, interaccion y responsive.
No instalar dependencias solo para esta entrega.

| Grupo | Casos a verificar en la implementacion futura |
|---|---|
| Unitarios: contrato de UI | Clave exacta, lista de seis activos, exclusion de terminales del selector y orden estable tras filtrado. |
| Unitarios: P1 | Combinacion de filtros, espacios externos, mayusculas, UUID, relaciones nulas, respuesta vacia y cero coincidencias. |
| Unitarios: P3 | ISO valido, zona de La Paz independientemente del equipo, cruce de medianoche, `null`, fecha invalida y expiracion pasada sin derivar estado. |
| Unitarios: P4 | Retry por status, maximo de reintentos, error recuperable, intervalo visible/oculto y guarda manual. |
| Navegador: lectura | Los seis estados, nulos independientes y simultaneos, destino largo, UUID completos, `[]`, mas de 25 filas y orden de empates entregado por servidor. |
| Navegador: refresco | Cambio de estado, desaparicion de fila en siguiente respuesta, filtros conservados, ausencia de esqueleto en refetch y doble clic. |
| Navegador: temporizacion | Observar ciclos completos del intervalo aprobado, pausa al ocultar y reanudacion. Una peticion ya en vuelo no cuenta como nuevo polling oculto. |
| Navegador: errores | Red y 5xx con/sin datos, recuperacion, 400/403/404, 401, cancelacion y respuesta tardia entre sesiones. |
| Visual y accesibilidad | 320/768/1024/1280 px, zoom 200 %, textos extensos, encabezados, badges, teclado, foco y roles de avisos. |
| Regresion | Menu, logout, badges compartidos y polling de otras pantallas sin alteraciones. |
| Integracion INT09 | Backend real autorizado: Bearer admin, permiso efectivo, DTO, query vacia, estados activos y cabecera no-store. No acreditar reglas del servidor solo con mocks. |

Interceptar todas las rutas API antes de navegar, incluidas login y configuracion del shell.
Utilizar datos ficticios y no agregar mocks al codigo de produccion.
Cerrar contextos e interceptores al terminar.
No crear cuentas, seeds ni migraciones para desbloquear las pruebas.
Registrar evidencia saneada sin tokens, credenciales ni informacion personal.

INT09 requiere autorizacion especifica de entorno y cuenta antes de hacer peticiones reales.
INT01, INT03, INT04, INT05, INT06, INT07 e INT08 conservan su estado documental; esta spec no los cierra.

## Decisiones establecidas y alternativas

### Confirmadas por fuentes existentes

- Si: backend como unica autoridad del estado y del conjunto activo.
- Si: reutilizar DTO central, query key reservada, endpoint sin parametros y `EstadoBadge`.
- Si: polling de 10-15 s; su valor exacto sigue pendiente P4.
- No: terminales en el selector de activos, transiciones por reloj o recuperacion de relaciones eliminadas desde otra cache.
- No: copiar IDs ficticios ni leer directamente tablas de base de datos.
- No: incluir Realtime, mutaciones, reportes o exportacion.

### Pendientes de aprobacion

- P1-P5 y sus concreciones de UX permanecen propuestas.
- Las alternativas de su tabla no estan descartadas por el usuario.
- Solicitar revision en archivo no equivale a aprobarlas ni a autorizar implementacion.
- Tras la revision, actualizar plan, archivos y criterios para reflejar la opcion elegida antes de cambiar el estado a Aprobado.

## Riesgos

| Riesgo | Mitigacion o limite |
|---|---|
| Interpretar un plazo vencido como estado terminal | Mostrar el dato sin transicion; prueba con `esperando_respuesta` y fecha pasada. |
| Datos anteriores parecen actuales tras un fallo | Aviso de desactualizacion propuesto en P4 y lista vacia solo tras respuesta correcta. |
| El guion de conductor se interpreta como busqueda | Texto accesible neutral y badge del estado real sin inferencias. |
| La tabla crece por UUID y siete campos | Resolver P2 y probar textos largos y 320 px antes de cerrar responsive. |
| El endpoint devuelve muchos registros | No truncar silenciosamente; paginacion futura requiere otro alcance y posiblemente contrato. |
| Cambiar estilos compartidos rompe Conductores | Acotar el cambio a estados de solicitud y verificar badges existentes. |
| Resultados de sesiones distintas se mezclan | Consumir signal y preservar las protecciones existentes de cliente y AuthContext. |
| Build heredado bloquea el cierre | SPEC 08 registra tres TS6133 en `Detalle.tsx:52-54`; reconfirmar linea base en implementacion, sin dar por ejecutado el build aqui. |
| Se implementan recomendaciones como si estuvieran aprobadas | Estado Borrador y dependencias P1-P5 explicitas en plan y criterios. |

## Registro de esta entrega

**2026-10-03: entrega documental para revision.**
Se investigaron fuentes, contratos, specs previos y codigo existente.
Se creo unicamente `specs/09-solicitudes-activas.md`.
No se implemento el modulo ni se ejecutaron pruebas funcionales, build o integracion.
No hay criterios de implementacion marcados ni resultados simulados presentados como reales.

## Que NO forma parte de esta especificacion

- Implementar el modulo durante esta entrega documental.
- Aprobar implicitamente P1-P5 o sus alternativas.
- Modificar solicitudes o decidir su expiracion desde el navegador.
- Agregar mapas, historico, exportacion, Realtime o consultas de datos no publicados.
- Modificar backend, esquema de datos, entorno, autenticacion, shell o dependencias.
- Reparar otros modulos, cambiar el roadmap o cerrar integraciones anteriores.

La implementacion requiere primero resolver las decisiones pendientes y aprobar esta spec.
