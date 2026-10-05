# SPEC 09 - Solicitudes activas

> **Estado:** Implementada; verificaciones simuladas completadas el 2026-10-05. INT09 pendiente.
> **Revision BUILD:** La seccion "Estado de implementacion y evidencia" prevalece sobre las frases de este documento que condicionaban la implementacion a una entrega documental posterior. INT09 permanece abierta y no se marco.
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 02 (`02-autenticacion-admin.md`, INT01 pendiente), SPEC 03 (`03-shell-y-navegacion.md`, INT03 pendiente).
> **Patron de referencia:** SPEC 05 (`05-conductores-listado-estados.md`), SPEC 07 (`07-indicadores-inicio.md`) y SPEC 08 (`08-mapa-administrativo.md`).
> **Contrato externo:** `../backend/specs/11-tarifario-dashboard.md`, seccion 3.5, y `../docs/ROADMAP_FRONTEND.md:522-567`.
> **Fecha:** 2026-10-03
> **Revision:** 2026-10-05
> **Objetivo:** Construir la pantalla de solicitudes activas de solo lectura con los datos del backend, badges de estado y actualizacion periodica cada 15 segundos.

## Estado de la definicion

El usuario aprobo P1-P5 y autorizo actualizar exclusivamente esta especificacion, no implementar el modulo.
Las verificaciones previas a, b y c tienen evidencia estatica en la seccion correspondiente.
No quedan decisiones P1-P5 pendientes; el plan describe una implementacion futura.
Estar listo para implementar no acredita funcionamiento ni autoriza ejecutar el plan en esta entrega.

Las rutas de fuentes y codigo se expresan respecto de `frontEnd/`, salvo los nombres de specs locales del encabezado.
No se ejecutaron pruebas, build ni peticiones al backend en esta revision documental.
La evidencia de ejecucion de SPEC 08 se cita como antecedente, no como una ejecucion nueva ni como validacion de SPEC 09.

## Estado de implementacion y evidencia (2026-10-05)

El modulo quedo implementado en esta entrega. Los criterios marcados se verificaron con unitarios, build y escenarios de navegador con API interceptada; ninguno se declara integración real.

**Archivos modificados**
- `src/pages/Solicitudes.tsx`: lectura unica, polling 15 s con `refetchInterval` condicionado a visibilidad, filtros locales, tabla y tarjetas, fechas, avisos, reintentos y responsive sin CSS propio.
- `src/lib/solicitudes.ts`: clave de consulta, `ESTADOS_ACTIVOS`, formato de fechas `es-BO` / `America/La_Paz`, guardas de solapamiento y `puedeRefrescarSolicitudes(lecturaInicial)`.
- `src/components/EstadoBadge.tsx`: los seis estados activos con etiquetas y clases propias; `buscando` en ambar; estados de cuenta, jornada y disponibilidad y fallback sin cambios.
- `src/lib/solicitudes.test.ts`: unitarios de helpers, fechas, filtros, solapamiento y reintento.
- `tests/browser/spec09.browser.js`: 14 escenarios con toda API interceptada y datos ficticios.

**Correccion aplicada durante la verificacion**
La primera version dejaba activos los controles durante la carga inicial o con la consulta pausada. Se corrigio con `useIsFetching` y el parametro `lecturaInicial` de `puedeRefrescarSolicitudes`, de modo que Actualizar y Reintentar no pueden emitir lecturas superpuestas ni con la pestana oculta.

**Verificacion ejecutada**
- `npx tsc -b --force`: sin errores.
- `npm run test:unit`: 10 archivos, 430 pruebas correctas.
- `npm run build`: correcto, unica advertencia por tamano de chunk, ajena al modulo.
- Navegador, 14 de 14 escenarios PASS: lectura, orden y siete campos; filtros combinados sin peticiones; reemplazo de datos; responsive 320/768/1024/1280; zoom 200 por CSS; teclado y foco; polling 15 s, pausa con pestana oculta y reanudacion; tres clics en un tick equivalen a una lectura; refetch sin esqueleto; offline con y sin datos previos; red y 500 con y sin datos previos, con un unico retry automatico y recuperacion manual que conserva datos y filtros; 400, 403 y 404 sin retry y sin logout; 401 con logout; respuesta tardia de sesion A no pintada en B; badges compartidos intactos en Lista y Detalle.
- Regresion de SPEC 08 revalidada en 5 de 5 escenarios tras el cambio del componente compartido.

**Limites explicitos de esta evidencia**
- Sin backend real: toda peticion fue interceptada con fulfillment o abort ficticio. Los conteos son relativos porque `StrictMode` duplica el montaje en desarrollo.
- INT09 sigue sin marcar: faltan administrador autenticado real, permisos y `Cache-Control: no-store`.
- Sin lector de pantalla ni telefono fisico; el 200 por ciento se ejercito con `zoom` de CSS y no con el zoom nativo del navegador.
- Los errores usan el mensaje del backend cuando existe, con texto de respaldo propio cuando no.

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
- El prototipo colorea `buscando` en ambar; el componente actual lo colorea en azul. La implementacion alineara esa clave con el prototipo, con el alcance acotado por las verificaciones b y c, sin alterar los estados de conductor o jornada.
- El aviso del prototipo atribuye todos los cambios al sistema automatico. La Regla 10 reserva la finalizacion al conductor; se usara un texto neutral que solo aclare que el administrador no modifica solicitudes desde esta vista.
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
- Refrescar mediante polling de 15 segundos, valor aprobado en P4 dentro del intervalo del roadmap.
- Mantener el ciclo de vida exclusivamente en backend; no expirar, reasignar ni finalizar solicitudes desde esta pantalla.
- No agregar query string: filtros, orden y paginacion de servidor no estan admitidos por esta ruta.

### Decisiones de UX aprobadas

P1-P5 fueron aprobadas expresamente por el usuario en esta revision.
Sus criterios y pasos son obligatorios para la implementacion futura.

| ID | Tema | Decision aprobada | Alternativa descartada y motivo |
|---|---|---|---|
| P1 | Controles de consulta | Busqueda local por ID, pasajero o conductor y selector con Todos mas los seis estados activos. Sin peticiones adicionales ni parametros HTTP. | Listado sin controles: se elige facilitar la supervision local. |
| P2 | Identificador y movil | UUID completo, seleccionable y copiable como texto, con ajuste de linea; tabla desde 1024 px y tarjetas debajo, con los mismos siete campos. No requiere boton de portapapeles. | UUID abreviado o tabla con desplazamiento horizontal movil: se priorizan identidad completa y lectura sin desbordamiento. |
| P3 | Fechas y expiracion | Fecha y hora absolutas en `es-BO` / `America/La_Paz`, formato de 24 horas y segundos en expiracion; sin reloj, cuenta regresiva ni interpretacion local del estado. | Cuenta regresiva: agrega un reloj que no decide transiciones y no es necesario para supervision. |
| P4 | Refresco y errores | Polling de 15 s con pausa al ocultar la pestana, boton Actualizar y ultima lectura conservada con aviso ante fallo de red/servidor. Coherente con SPEC 05/07/08. | Polling de 10 s o solo manual: se conserva la cadencia y el control manual de las pantallas existentes. |
| P5 | Coordenadas | No presentarlas en esta pantalla. Permanecen en el DTO sin usarse. | Coordenadas como texto: no aportan al alcance aprobado de esta vista. |

Las siguientes concreciones de presentacion desarrollan las decisiones aprobadas, sin modificar el contrato:

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
| `id` | `string` UUID | UUID completo, seleccionable y copiable, con ajuste de linea (P2). Clave estable de fila/tarjeta. |
| `estado` | `EstadoSolicitud` | Badge textual. El tipo admite diez valores, pero este endpoint entrega seis activos. |
| `pasajero` | `{ id: string; nombre: string }` o `null` | Nombre o guion; no hay telefono ni WhatsApp. |
| `conductorAsignado` | `{ id: string; nombreCompleto: string }` o `null` | Nombre o guion; no hay vehiculo ni ID plano alternativo. |
| `latitudRecogida` | `number` | No se presenta (P5). |
| `longitudRecogida` | `number` | No se presenta (P5). |
| `destino` | `string` o `null` | Texto completo con ajuste de linea; guion si es nulo. |
| `expiraEn` | `string` ISO datetime o `null` | Fecha y hora absolutas es-BO / America/La_Paz, 24 h con segundos; guion si es nula (P3). |
| `creadoEn` | `string` ISO datetime | Fecha y hora absolutas es-BO / America/La_Paz, 24 h (P3). |

No se renombra ni restringe globalmente `EstadoSolicitud` a seis valores.
Los filtros de presentacion tendran su propia lista de seis estados.

### Invariantes de negocio

- Activos: `creada`, `buscando`, `conductor_seleccionado`, `esperando_respuesta`, `aceptada`, `en_servicio`.
- Terminales excluidos por servidor: `finalizada`, `rechazada`, `expirada`, `sin_conductor`.
- El servicio filtra `eliminadoEn: null` de la solicitud y ordena por `creadoEn DESC, id DESC`.
- Las relaciones eliminadas se proyectan como `null`; la solicitud permanece visible.
- Un conductor nulo no permite inferir que la solicitud esta buscando: tambien puede representar una relacion eliminada.
- Un `expiraEn` pasado no permite inferir `expirada`. Ni GET ni la UI ejecutan transiciones por leer ese dato.
- El backend obtiene una instantanea consistente por respuesta. No se exige igualdad con indicadores consultados en otro momento.
- La siguiente lectura correcta reemplaza el conjunto anterior; no se conservan filas ausentes como si siguieran activas.

### Presentacion de badges

| Estado activo | Etiqueta | Color desde tokens existentes |
|---|---|---|
| `creada` | Creada | Ambar |
| `buscando` | Buscando conductor | Ambar |
| `conductor_seleccionado` | Conductor seleccionado | Ambar |
| `esperando_respuesta` | Esperando respuesta | Ambar |
| `aceptada` | Aceptada | Verde |
| `en_servicio` | En servicio | Azul |

Completar los mapas de `EstadoBadge` sin cambiar su API ni los estados compartidos de conductor/jornada.
No es necesario ampliar los cuatro terminales para completar este modulo.
Las etiquetas y el punto de color deben seguir siendo legibles sin depender exclusivamente del color.

### Verificaciones estaticas previas (2026-10-05)

Estas comprobaciones permiten cerrar la definicion, no certificar cambios que aun no existen.

| Punto | Evidencia inspeccionada | Conclusion y limite |
|---|---|---|
| a. Tres TS6133 historicos | `src/pages/Conductores/Detalle.tsx:41-54` ya no declara `botonCancelar`, `botonDescartar` ni `botonCerrar`; la busqueda de esos nombres en el archivo no encuentra usos. `tsconfig.app.json:17-24` conserva `strict`, `noUnusedLocals`, `noUnusedParameters` e incluye `src`; `package.json:8` sigue ejecutando `tsc -b` antes de Vite. | La causa concreta fue retirada, no silenciada en configuracion. SPEC 08, "Correcciones de revision 2026-10-05", registra su eliminacion (linea 707) y dos builds Exit 0 (linea 712). Ese antecedente posterior reemplaza el bloqueo historico del 2026-10-03 para esta spec; no se ejecuto build nuevo aqui ni se garantiza el build futuro. |
| b. Usos de `buscando` | Busqueda en `src/`: solo aparece en `EstadoSolicitud` y en los mapas de estilos/etiquetas de `EstadoBadge`. El estilo actual es `bg-azul/10 text-azul` (linea 14) y la etiqueta `Buscando conductor` (linea 32). `references/pantallas/app.js:41-42` fija esa etiqueta y `amber`. | No se encontro consumidor de produccion que pase `buscando` al badge: Solicitudes sigue siendo stub. El cambio futuro se limita a esa clave, a `bg-ambar/10 text-ambar`, sin modificar el token azul ni su etiqueta. Repetir la busqueda antes de editar si aparecen consumidores nuevos. |
| c. Comparticion con Conductores | Los unicos consumidores actuales de `EstadoBadge` en `src/` son `Conductores/Lista.tsx:224-226,240-242` y `Conductores/Detalle.tsx:327,337,367-368`. Reciben `estado`, `estadoJornada` y `estadoDisponibilidad` tipados por `src/api/types.ts:1-3,31-45`. El componente indexa dos `Record<string, string>` por clave y usa fallback gris/texto original (`EstadoBadge.tsx:37-44`). | Agregar `creada`, `conductor_seleccionado` y `aceptada` no colisiona con esos tres enums. Compatibilidad estatica soportada si solo se agregan esas entradas y se cambia el color de `buscando`; falta verificar el render tras implementarlo. |

`en_servicio` si es compartido por solicitudes y disponibilidad: conservar `En servicio` y `bg-azul/10 text-azul`.
`finalizada` tambien es compartido por solicitudes y jornada: conservar `Finalizada` y `bg-verde/10 text-verde`, aunque sea terminal y no se liste aqui.
No confundir `aceptada` con `aprobado`, `creada` con `pendiente`, ni `esperando_respuesta` con `solicitud_pendiente`.
Preservar todas las entradas existentes de Conductores, el fallback, las clases estructurales y el punto decorativo; no copiar globalmente `statusColor` del prototipo, que tambien difiere para `suspendido` y `finalizada`.
Mapa no consume `EstadoBadge`: usa su propia derivacion y etiquetas en `src/lib/mapa.ts`; no se modifica esa logica.

La verificacion futura U05 debe comparar etiquetas y estilos de los 4 estados de cuenta, 3 de jornada y 4 de disponibilidad en Lista (tabla y tarjetas) y Detalle.
Debe incluir los seis badges de solicitudes, confirmar ambar para `buscando`, verde para `aceptada` y azul inalterado para `en_servicio`, y comprobar que un valor desconocido mantiene el fallback.
No se han agregado ni probado dinamicamente los tres estados nuevos en esta entrega.

## Puntos de integracion

| Pieza existente | Uso previsto en la implementacion |
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

## Lectura, errores y sesion

Esta seccion concreta P4, manteniendo los comportamientos de autenticacion ya existentes.

| Situacion | Comportamiento |
|---|---|
| Primera lectura pendiente | Mensaje de carga, sin filas ficticias ni contador cero antes de recibir datos. |
| Exito con `[]` | `No hay solicitudes activas`; total cero. No confundir con error. |
| Exito con datos | Mostrar filas en orden recibido. |
| Filtro sin coincidencias (P1) | Mensaje distinto al vacio global y boton Limpiar filtros. |
| Refetch en curso | Conservar datos anteriores; no volver al esqueleto. |
| Consulta pausada / navegador offline | Seguir la correccion de SPEC 08: aviso de conexion con `role="status"` y reanudacion automatica; conservar datos previos. Sin lectura confirmada, no inventar total cero ni mostrar carga perpetua. No anunciar `Actualizando...` mientras este pausada. |
| Red o `5xx` sin datos | Error con `role="alert"` y Reintentar. |
| Red o `5xx` con datos | Conservar ultima lectura y mostrar aviso `role="status"`: los datos pueden estar desactualizados. |
| `400`, `403` o `404` | Mostrar mensaje del backend, sin retry automatico ni boton Reintentar; no presentarlo como lista vacia. Con datos anteriores, indicar que no se pudieron actualizar. |
| `401` | Reutilizar cierre de sesion y redireccion globales; no duplicarlos ni impedirlos. |
| Cancelacion | No anunciar `AbortError` ni cancelaciones de consultas como error de usuario. |

Retry: como maximo un reintento automatico por fallo de red (`TypeError`) o `5xx`, nunca por `4xx`.
El polling periodico es distinto del retry de una peticion: se programa cada 15 s con la vista visible y sin lectura en curso; la pausa offline no se trata como actividad.
`Actualizar` y `Reintentar` comparten una guarda contra lecturas simultaneas y un bloqueo sincrono contra multiples clics en el mismo tick.
Usar las etiquetas `Actualizar` / `Actualizando...` y deshabilitar acciones mientras haya lectura real o consulta pausada, sin bloqueo permanente al reconectar.
Tomar como referencia local `Mapa.tsx:121-155`: estado de conexion, `fetchStatus`, guarda sincrona y `refetch({ cancelRefetch: false })`.
Esto aplica el tratamiento de P4 a la consulta de Solicitudes; no agrega almacenamiento offline, colas, endpoints ni refactorizaciones de SPEC 05/07/08.
Los errores se clasifican por `ApiError.status`, nunca analizando palabras del mensaje.
No se presupone que `ApiError` exponga `code`.

No hay actualizacion optimista ni escrituras manuales en otras claves de cache.
La lectura conserva la proteccion existente frente a respuestas tardias de otra sesion.
No se persisten solicitudes en almacenamiento del navegador.

## Accesibilidad y movil

- Un unico `h1` y controles nativos con nombres accesibles y foco visible.
- Tabla desde 1024 px con encabezados asociados; tarjetas debajo con etiquetas de todos los campos (P2).
- Representaciones responsivas sin contenido duplicado simultaneamente en el arbol accesible.
- UUID completo seleccionable y copiable como texto, nombres largos y destinos extensos no desbordan la pagina; los saltos visuales no alteran el UUID copiado.
- Guion de relacion nula con texto accesible neutral: `Pasajero no disponible` o `Conductor no disponible`, sin adivinar el motivo.
- Iconos y puntos decorativos con `aria-hidden`; estado siempre expresado en texto.
- No anunciar cada fila en cada polling ni mover el foco por actualizar datos.
- Anunciar acciones manuales, errores y avisos, no toda la tabla como region viva.
- Validar 320, 768, 1024 y 1280 px y zoom 200 %. No hay desplazamiento horizontal de pagina ni tabla.
- Si no se usa lector de pantalla o telefono fisico, registrar esa limitacion expresamente.

## Archivos previstos

Esta es una prevision de impacto, no una lista de archivos implementados.
El unico archivo modificado en esta revision documental es esta spec.

| Archivo | Cambio futuro previsto |
|---|---|
| `src/pages/Solicitudes.tsx` | Consulta, render, estados y controles aprobados en P1-P5. |
| `src/components/EstadoBadge.tsx` | Etiquetas y estilos de los seis estados activos, con cambio acotado. |
| `src/lib/solicitudes.ts` | Nuevo: clave, presentacion y helpers puros de lectura, filtros y fechas aprobados. |
| `src/lib/solicitudes.test.ts` | Nuevo: pruebas de los helpers aprobados. |
| `src/pages/Solicitudes.css` | Condicional: solo si el responsive aprobado necesita reglas que no convenga expresar con utilidades existentes. Justificar antes de agregarlo. |
| `specs/09-solicitudes-activas.md` | Decisiones cerradas en esta revision; en implementacion futura, registrar evidencia real por criterio. |

No se preven cambios en contratos, cliente HTTP, token, contexto, router, Layout, QueryClient, paquetes ni configuracion de specs.
No crear hooks o componentes genericos para logica de una sola pantalla.
La ubicacion de un eventual arnes persistido de navegador se definira antes de crearlo; las specs previas tambien admiten recorridos sin agregar dependencias de pruebas.
No se modifica el roadmap ni un indice en esta entrega.

## Plan de implementacion

P1-P5 estan aprobadas y las verificaciones estaticas a/b/c documentadas; la implementacion permanece pendiente.
No ejecutar estos pasos durante la entrega documental.
Cada incremento debe dejar el sistema funcional y llevar su verificacion asociada.
Si un incremento excede 30-50 lineas de cambio, dividirlo en pasos ejecutables mas pequenos durante la preparacion de la implementacion.

1. Registrar la linea base de tipos, pruebas y build antes de editar codigo. Revalidar los usos de `EstadoBadge`; no asumir que persisten los TS6133 historicos ya retirados ni atribuir un build nuevo al antecedente de SPEC 08. Distinguir fallos heredados y no corregir otros modulos de forma implicita.
2. Crear `src/lib/solicitudes.ts` con la clave exacta y constantes de estados, mas sus pruebas unitarias. No duplicar el DTO central.
3. Agregar las tres claves faltantes y cambiar solo el color de `buscando` a ambar. Verificar los seis badges activos, los 11 valores de enums de Conductores y el fallback descritos en b/c, sin cambiar `en_servicio` ni `finalizada`.
4. Incorporar los helpers de error/retry y formateo absoluto P3 con sus pruebas, sin reloj ni transiciones locales.
5. Conectar la consulta cancelable en `Solicitudes.tsx` y mostrar carga, error inicial y vacio correcto. Conservar autenticacion y ruta existentes.
6. Renderizar las filas con los campos del contrato y nulos seguros. Probar orden, identificadores, relaciones eliminadas y fecha vencida sin transicion local.
7. Incorporar polling de 15 s y conservacion de datos ante fallos. Probar pausa/reanudacion por visibilidad y el patron offline corregido de SPEC 08 con/sin datos: distinguir `paused` de actividad y ausencia de lectura de lista vacia.
8. Incorporar Actualizar/Reintentar con guardas sincronas y sin cancelar otra lectura en curso. Verificar clics repetidos, pausa offline, desbloqueo/reanudacion al reconectar, cancelacion y cambio de sesion.
9. Incorporar busqueda y selector locales P1 con sus pruebas. Mantener el orden del servidor y distinguir vacios, sin peticiones causadas por los controles.
10. Aplicar P2 y P5, junto con encabezado, aviso y accesibilidad. Verificar UUID completo copiable, contenido equivalente en tabla/tarjetas y ausencia de coordenadas.
11. Registrar evidencia por criterio y limitaciones. Mantener INT09 pendiente mientras no exista integracion real autorizada.

Las pruebas acompanian los incrementos; no se dejan todas para el ultimo paso.
El ultimo paso es documentar resultados, no agregar funcionalidad fuera del alcance.

## Criterios de aceptacion

Todas las casillas quedan sin marcar: la implementacion y sus pruebas estan pendientes.
La aprobacion de P1-P5 y la inspeccion estatica no acreditan estos criterios de funcionamiento.

### Confirmados por contrato y alcance

- [x] C01: `/solicitudes` usa `SolicitudActiva` central sin declarar un DTO de servidor duplicado.
- [x] C02: La pantalla consulta `GET /api/dashboard/solicitudes-activas` sin query string y con clave `['solicitudes-activas']`.
- [x] C03: Se muestran identificador, pasajero, conductor, estado, creacion, destino y expiracion cuando existe.
- [x] C04: Los seis estados activos tienen etiquetas legibles mediante `EstadoBadge`.
- [x] C05: Pasajero o conductor nulo se muestran con guion, sin excluir la solicitud ni inferir su estado.
- [x] C06: Las filas conservan el orden recibido y no se truncan por paginacion local.
- [x] C07: `expiraEn` pasado no cambia estado, oculta fila ni dispara escrituras.
- [x] C08: Una lectura posterior reemplaza la lista; una solicitud ausente deja de mostrarse.
- [x] C09: El listado se actualiza automaticamente cada 15 segundos mientras esta visible y disponible para lectura.
- [x] C10: No hay controles de mutacion, peticiones de escritura ni codigo Realtime.
- [x] C11: No se inventan numeros comerciales, telefonos, vehiculos ni datos de relaciones eliminadas.

### UX y robustez aprobados

- [x] P1-A: Busqueda y estado se combinan localmente sin peticiones adicionales ni parametros HTTP.
- [x] P1-B: El selector incluye Todos y exactamente los seis estados activos; los filtros sobreviven al refetch y se pueden limpiar.
- [x] P1-C: Ausencia de coincidencias se distingue de una respuesta `[]` del servidor; los conteos distinguen visibles y total.
- [x] P2-A: UUID completo sin truncamiento, seleccionable y copiable sin alterar su valor; tarjetas bajo 1024 px con los mismos siete campos que la tabla desde 1024 px.
- [x] P3-A: Fechas absolutas en `es-BO` / `America/La_Paz`, 24 h y segundos en expiracion; nulos y fechas invalidas tienen fallback definido. Sin reloj ni cuenta regresiva.
- [x] P4-A: Hay polling visible de 15 s y no hay lecturas periodicas con la pestana oculta; volver a visible reanuda el intervalo sin exigir lectura inmediata.
- [x] P4-B: Actualizar y Reintentar no solapan lecturas; tres clics en el mismo tick producen una sola lectura manual.
- [x] P4-C: Carga, lista vacia y error inicial son distinguibles; un refetch no vuelve al esqueleto.
- [x] P4-D: Red/5xx con datos previos conserva la ultima lectura y muestra aviso de desactualizacion con recuperacion manual.
- [x] P4-E: Retry automatico limitado a una vez para red/5xx; los 4xx no disparan ese retry.
- [x] P4-F: Offline/consulta pausada con y sin datos muestra aviso, conserva datos confirmados y no inventa ceros ni carga/actualizacion perpetua; clics repetidos no emiten peticiones offline ni dejan bloqueo permanente y reconectar permite reanudar.
- [x] P5-A: No se presentan coordenadas ni se integra un mapa; el DTO permanece intacto.
- [x] U01: Un 401 mantiene logout y redireccion existentes; un 403 muestra el mensaje sin cerrar sesion.
- [x] U02: Respuestas tardias de sesion A no se pintan en B; cancelaciones no se anuncian como errores.
- [x] U03: No se persisten solicitudes, filtros ni busqueda en almacenamiento local.
- [x] U04: Badges, teclado, foco, roles y responsive cumplen la seccion de accesibilidad aprobada.
- [x] U05: Lista (tabla/tarjetas) y Detalle conservan etiquetas y estilos de los 4 estados de cuenta, 3 de jornada y 4 de disponibilidad, especialmente `en_servicio` y `finalizada`; se conserva el fallback. Los seis badges de solicitudes cumplen su tabla, incluido `buscando` ambar. Navegacion y pantallas existentes sin regresiones atribuibles al modulo.

### Verificacion y cierre

- [x] V01: `npm run test:unit` termina correctamente, con evidencia y sin atribuir mocks a integracion.
- [x] V02: `npm run build` termina correctamente. Si falla por otro modulo, registrar el bloqueo y dejar esta casilla sin marcar.
- [x] V03: Los escenarios de navegador se ejecutan con API interceptada y datos ficticios, sin trafico real accidental.
- [ ] INT09: GET autenticado con administrador real verificado en entorno autorizado, incluyendo respuesta, permisos y `Cache-Control: no-store`.

## Estrategia de verificacion

Seguir las SPEC 07 y 08 con Vitest para helpers y navegador para render, interaccion y responsive.
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
| Navegador: errores | Red y 5xx con/sin datos, offline real simulado y consulta pausada con/sin cache, triple clic offline y reconexion sin bloqueo; recuperacion, 400/403/404, 401, cancelacion y respuesta tardia entre sesiones. |
| Visual y accesibilidad | 320/768/1024/1280 px, zoom 200 %, textos extensos, UUID completo seleccionado/copiado sin alteraciones en tabla y tarjetas, encabezados, badges, teclado, foco y roles de avisos. |
| Regresion | Menu, logout y polling de otras pantallas sin alteraciones. Comparar render, etiquetas y clases de los 11 valores de enums de Conductores en Lista/Detalle y fallback; probar por separado los seis estados activos de solicitudes segun b/c y U05. |
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
- Si: polling de 15 s aprobado en P4, dentro del intervalo del roadmap y coherente con SPEC 05/07/08.
- No: terminales en el selector de activos, transiciones por reloj o recuperacion de relaciones eliminadas desde otra cache.
- No: copiar IDs ficticios ni leer directamente tablas de base de datos.
- No: incluir Realtime, mutaciones, reportes o exportacion.

### Aprobadas en esta revision

- P1-P5 quedan cerradas segun su tabla; las alternativas se descartan para esta entrega.
- UUID completo copiable, fechas absolutas sin reloj y coordenadas omitidas no requieren endpoints ni dependencias nuevos.
- El cambio futuro de badges se acota a las tres adiciones y al color de `buscando`, preservando las claves compartidas existentes.
- El patron offline corregido de SPEC 08 concreta P4 sin trasladar funcionalidades del mapa ni refactorizar otras pantallas.
- La autorizacion actual cubre solo este documento; implementar y verificar siguen pendientes.

## Riesgos

| Riesgo | Mitigacion o limite |
|---|---|
| Interpretar un plazo vencido como estado terminal | Mostrar el dato sin transicion; prueba con `esperando_respuesta` y fecha pasada. |
| Datos anteriores parecen actuales tras un fallo | Aviso de desactualizacion P4 y lista vacia solo tras respuesta correcta. |
| El guion de conductor se interpreta como busqueda | Texto accesible neutral y badge del estado real sin inferencias. |
| La tabla crece por UUID y siete campos | Aplicar P2: ajuste de linea, tabla desde 1024 px, tarjetas debajo; probar copia y textos largos a 320 px. |
| El endpoint devuelve muchos registros | No truncar silenciosamente; paginacion futura requiere otro alcance y posiblemente contrato. |
| Cambiar estilos compartidos rompe Conductores | La inspeccion b/c soporta las tres adiciones; conservar `en_servicio`, `finalizada` y todas las otras claves existentes. Ejecutar U05 tras implementar; compatibilidad estatica no sustituye render. |
| Resultados de sesiones distintas se mezclan | Consumir signal y preservar las protecciones existentes de cliente y AuthContext. |
| Se atribuye al presente un bloqueo de build historico | Las tres refs fueron retiradas y SPEC 08 registra builds exitosos posteriores; punto a distingue ese antecedente de la inspeccion actual. Ejecutar nueva linea base al implementar, sin garantizarla aqui. |
| Offline deja carga o bloqueo manual perpetuo | Aplicar el patron corregido de SPEC 08 y verificar P4-F con/sin cache, clics repetidos y reconexion. |
| Se confunde aprobacion documental con implementacion | Estado listo para implementar, implementacion explicitamente pendiente y todas las casillas sin marcar. |

## Registro de esta entrega

**2026-10-05: implementacion y verificacion simulada.**
Se implemento el modulo en los archivos listados en la seccion de evidencia y se corrigio el solapamiento de lecturas detectado durante las pruebas.
`npx tsc -b --force`, `npm run test:unit` (430) y `npm run build` terminaron correctamente; los 14 escenarios de navegador y los 5 de regresion de SPEC 08 quedaron PASS con API interceptada y datos ficticios.
Se marcaron C01-C11, P1, P2, P3, P4, P5, U01-U05 y V01-V03 con esa evidencia.
INT09 permanece sin marcar: no hubo administrador autenticado real, verificacion de permisos ni `Cache-Control: no-store`.
No se modificaron backend, contratos, cliente HTTP, AuthContext, shell, router, `QueryClient` ni dependencias. No se hizo commit, rama ni push.

**2026-10-03: entrega documental para revision.**
Se investigaron fuentes, contratos, specs previos y codigo existente.
Se creo unicamente `specs/09-solicitudes-activas.md`.
No se implemento el modulo ni se ejecutaron pruebas funcionales, build o integracion.
No hay criterios de implementacion marcados ni resultados simulados presentados como reales.

**2026-10-05: revision documental con P1-P5 aprobadas.**
Se leyeron la skill `spec`, su plantilla, el README raiz, las specs de referencia y el codigo relevante.
Se inspeccionaron Detalle, configuracion de TypeScript/build, los usos de `EstadoBadge` en `src/`, los enums y los colores/etiquetas del prototipo.
Los resultados estaticos a/b/c quedan documentados arriba; los builds citados pertenecen a la evidencia previa de SPEC 08.
Se actualizo unicamente `specs/09-solicitudes-activas.md`, sin implementar el modulo, cambiar otros specs ni hacer commit.
No se ejecutaron build, pruebas dinamicas ni peticiones al backend; INT09 y todos los criterios de aceptacion siguen sin marcar.

## Que NO forma parte de esta especificacion

- Implementar el modulo durante esta entrega documental.
- Tratar la aprobacion explicita de P1-P5 como evidencia de implementacion o pruebas.
- Modificar solicitudes o decidir su expiracion desde el navegador.
- Agregar mapas, historico, exportacion, Realtime o consultas de datos no publicados.
- Modificar backend, esquema de datos, entorno, autenticacion, shell o dependencias.
- Reparar otros modulos, cambiar el roadmap o cerrar integraciones anteriores.

La definicion esta lista para implementar sobre la evidencia estatica registrada; la implementacion queda pendiente y no se ejecuta en esta entrega.

> Nota de revision: la frase anterior describe la entrega documental del 2026-10-03. La implementacion se ejecuto el 2026-10-05 y su evidencia consta en la seccion "Estado de implementacion y evidencia". INT09 continua pendiente.
