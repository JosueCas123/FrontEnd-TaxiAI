# SPEC 06 - Conductor: detalle y edicion de vehiculo

> **Estado:** Implementado en frontend; verificacion local parcial, INT06 con persistencia real verificada y matriz de errores/permisos pendiente
> **Revision:** Continuacion autorizada el 2026-10-01. P1-P5 y mejoras a-d implementadas; evidencia local y limites en el registro al final. Las referencias a una entrega exclusivamente documental describen la revision anterior, no restringen esta autorizacion posterior.
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 02 (`02-autenticacion-admin.md`, INT01 pendiente), SPEC 03 (`03-shell-y-navegacion.md`, INT03 pendiente) y SPEC 05 (`05-conductores-listado-estados.md`, INT05 pendiente).
> **Patron de referencia:** SPEC 04 (`04-configuracion-empresa.md`, INT04 pendiente).
> **Contrato externo:** `../backend/specs/06-conductores-vehiculos.md`.
> **Fecha:** 2026-09-30
> **Objetivo:** Permitir al administrador consultar el perfil de un conductor y editar parcialmente su vehiculo existente sin perder borradores ni desincronizar el detalle y el listado.

> **Ampliacion vigente (2026-10-01):** El usuario autoriza expresamente reproducir las secciones de ubicacion y Gestion de la cuenta del prototipo. Sustituye P3 y las exclusiones originales de estas dos secciones. El texto sobre entrega exclusivamente documental y los planes futuros se conserva como historia de la primera revision, no como restriccion vigente. Ver registro de ampliacion al final; INT01/03/04/05/06 siguen pendientes.

## Contexto y fuentes

El documento se creo inicialmente como borrador para revision en archivo.
El usuario aprobo P1-P5 y solicito incorporar las mejoras a-d exclusivamente en esta especificacion.
Esta revision registra esas decisiones y deja el documento listo para implementar, pero no autoriza ejecutar codigo ahora.
No se ejecutaron pruebas ni peticiones API para acreditar este modulo.

Las rutas de este documento son relativas a `frontEnd/`, salvo prefijo expreso.
El contrato backend determina datos y operaciones; el prototipo orienta la presentacion.

| Fuente | Contexto verificado |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:356-410` | Modulo 6: GET detalle, PATCH parcial, datos personales de lectura, vehiculo ausente y errores. |
| `../docs/ROADMAP_FRONTEND.md:338-352` | SPEC05 verificada con mocks; integraciones pendientes y bloqueo de privacidad. |
| `../docs/REGLAS_DE_NEGOCIO.md:19-20` | Reglas 12 y 13; los datos son administrados por la empresa. |
| `../docs/MODELO_DE_DATOS.md:60-92` | Relacion 1:N conductor/vehiculos, placa unica y baja logica. No equivale al DTO HTTP. |
| `../docs/ARQUITECTURA.md:19-26` | Backend como fuente de verdad; dashboard consumidor de la API. |
| `../docs/ROADMAP_ENDPOINTS.md:43-96` | Operaciones de conductores y cinco campos opcionales del PATCH. |
| `../backend/specs/06-conductores-vehiculos.md:36-57,94-139` | Identificador, DTO, permisos, parcialidad y errores. |
| `../backend/src/modules/conductores/conductores.schema.ts:4-23,29-51` | Limites de escritura y DTO de lectura. |
| `../backend/src/modules/conductores/conductores.service.ts:34-52,92-115` | Lectura, seleccion del vehiculo activo mas reciente y actualizacion sin alta. |
| `../backend/src/modules/conductores/conductores.controller.ts:15-40,72-89` | Autorizacion por objeto, ID invalido como 404 y respuestas del PATCH. |
| `../backend/src/middlewares/error-handler.ts:14-20`, `../backend/src/middlewares/auth.ts:20-21,127-147` | Mensajes exactos de validacion 400 y permiso 403; distincion respecto a 401. |
| `../backend/src/modules/conductores/conductores.router.ts:19-24`, `../backend/src/app.ts:25` | Rutas montadas; GET autenticado y PATCH administrativo. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:82-88,110-116` | Detalle y exclusion expresa de edicion de datos personales. |
| `references/pantallas/conductor-detalle.html:13-20`, `references/pantallas/app.js:129,134-138,206-216` | Contenedor del prototipo, ficha, enlaces, modal y comportamiento de fila. |
| `references/pantallas/styles.css:5-10`, `src/pages/Conductores/Lista.css:1-49` | Composicion visual y ajustes locales existentes. |
| `src/pages/Conductores/Detalle.tsx:1-10`, `src/router.tsx:23-26` | Stub y ruta protegida existentes. |
| `src/api/types.ts:22-45`, `src/api/client.ts:5-63` | DTO reutilizable, errores, Bearer y transporte. |
| `src/api/token.ts:1-15`, `src/context/AuthContext.tsx:18-33` | Revision de sesion, limpieza de cache y correlacion de 401. |
| `src/lib/conductores.ts:15-17,49-76`, `src/components/EstadoBadge.tsx:1-45` | Reintentos, nombres, acciones y badges reutilizables. |
| `src/pages/Conductores/Lista.tsx:89-112,208-231` | Mutaciones actuales solo concilian listado; nombres aun sin enlace. |
| `src/pages/Configuracion.tsx:123-245`, `specs/04-configuracion-empresa.md:202-235` | Base estable, formulario y precedente N1-B de proteccion reducida. |
| `specs/05-conductores-listado-estados.md:114-146,558-571` | Enlace futuro solo por nombre, nunca fila completa; privacidad pendiente. |

Se revisaron las specs locales 01-05 y la configuracion existente.
No existia una SPEC06 frontend al preparar este documento.
`specs/.spec-config.yml` ya existe y no se modifica.
Su opcion `AutoCreateBranch: true` no se ejecuta en esta entrega documental.
Al revisar la aprobacion, Git mostraba este documento como no seguido; se conserva y solo se actualiza su contenido.
Git advirtio del enlace inexistente `.claude/skills/spec-impl/`; no se repara aqui.

## Alcance

### Requisitos fijos del roadmap y contrato

- Reemplazar el stub de `/conductores/:id` por una ficha alimentada por GET.
- Presentar nombre, CI, telefono, estado de cuenta, jornada, disponibilidad y fecha de registro como solo lectura.
- Editar exclusivamente placa, marca, modelo, color y capacidad del vehiculo existente.
- Enviar solo diferencias efectivas mediante PATCH y adoptar la respuesta completa confirmada.
- Usar `['conductor-detalle', id]` e invalidar tambien `['conductores']` despues de guardar.
- Mostrar carga, errores y conductor no encontrado, con vuelta al listado.
- Mostrar `Sin vehiculo registrado` sin formulario ni alta cuando `vehiculo` sea `null`.
- Mantener las protecciones de sesion existentes y no fabricar datos ausentes.
- Respetar la identidad visual actual y adaptar la ficha a escritorio y movil.

### Decisiones de UX aprobadas

P1-P5 fueron aprobadas expresamente y forman parte del alcance de implementacion futuro.
Su aprobacion documental no acredita que estos comportamientos existan todavia.

- P1: acceso desde nombre y flecha en tabla y tarjetas, sin fila clicable.
- P2: edicion mediante modal abierto desde `Editar vehiculo`.
- P3 original (sustituida): transiciones exclusivamente en listado. P3 vigente: tambien en el perfil, reutilizando la maquina de estados y protegiendo la edicion de vehiculo.
- P4: carga al entrar, refresco manual y conciliacion, sin polling nuevo en detalle.
- P5: aviso de borrador y `beforeunload`, sin bloqueo global de navegacion interna; confirmacion local de descarte del modal.

### Fuera de alcance

- Registro de conductores, alta, baja o restauracion de vehiculos y seleccion de varios vehiculos.
- Edicion de datos personales, PIN, rol, jornada o disponibilidad.
- Mapas, historial, solicitudes, notificaciones, WhatsApp y funciones operativas. La fila textual de ultima ubicacion queda incluida por la ampliacion vigente.
- Realtime, persistencia de borradores o tokens y nuevos gestores globales de estado.
- Cambios de backend, contratos, base de datos, seeds, migraciones o entorno.
- Migracion del router, redisenos del shell o instalacion de dependencias por defecto.
- Duplicacion de la maquina de estados. La exclusion original de acciones de cuenta y sus pruebas de coordinacion con vehiculo queda sustituida por la ampliacion vigente.
- Cierre de INT01, INT03, INT04, INT05 o INT06 mediante mocks o inspeccion estatica.
- Implementacion de cualquier codigo durante esta entrega documental.

## Decisiones aprobadas por el usuario

Las cinco preguntas quedan cerradas por la revision del usuario.
La aprobacion comprende las limitaciones de N1-B y la deuda tecnica no bloqueante de privacidad y versionado.

| ID | Tema | Decision aprobada | Alternativa descartada y motivo |
|---|---|---|---|
| P1 | Acceso al perfil | Nombre y flecha con etiqueta accesible en tabla y tarjetas; el resto de la fila no navega. | Solo nombre se sustituye por la ampliacion aprobada de SPEC05 para mantener fidelidad al prototipo. Fila completa clicable sigue excluida. |
| P2 | Edicion de vehiculo | Modal desde `Editar vehiculo`, ficha de lectura y cinco campos editables; foco aislado y scroll de fondo bloqueado tambien en movil. | Formulario en tarjeta descartado en favor de la interaccion del prototipo. |
| P3 | Acciones de cuenta | Ampliacion vigente: transiciones en listado y perfil con helpers compartidos, confirmacion y bloqueo mutuo con edicion. | La decision original de limitar al listado queda sustituida por peticion explicita del usuario. |
| P4 | Refresco del detalle | GET al entrar, `Actualizar`, `Reintentar` y conciliacion tras guardar; sin polling nuevo. | Polling de 15 s en detalle descartado; permanece solo donde ya existe en SPEC05. |
| P5 | Proteccion del borrador | N1-B de SPEC04: aviso visible y `beforeunload`, sin bloqueo de navegacion interna; confirmacion local al cerrar modal editado y cierre local bloqueado durante PATCH. | Bloqueo global de navegacion y migracion de router descartados para el MVP. |

### Mejoras incorporadas en la revision

| ID | Requisito o verificacion documental |
|---|---|
| a | Nombre vacio o solo espacios muestra `(sin nombre)` reutilizando `nombreParaMostrar` de `src/lib/conductores.ts:56`, tambien en nombres accesibles. |
| b | Fecha no formateable muestra exactamente `Fecha no disponible`, sin inventar fecha ni emitir un `datetime` invalido. |
| c | Se verifico el paso de `options.signal` a fetch en `src/api/client.ts:15-24`; distinguir aborto del transporte de cancelacion logica y descarte por sesion. No modificar el cliente. |
| d | Se verificaron controller, schema y middlewares para registrar mensajes exactos de PATCH 400/403/409 y sus contextos, sin parsear texto para control de flujo. |

`Volver a conductores` usa `/conductores` como destino seguro.
No se promete restaurar pestana o busqueda del listado, que hoy viven en estado local de `Lista.tsx`.
Al volver mediante ese enlace se conserva el comportamiento de montaje de SPEC05: Pendientes y busqueda vacia.
Persistir contexto de retorno queda fuera de este alcance, sin ampliar el estado local de SPEC05.

## Modelo de datos y contratos

No se introducen entidades persistentes ni DTO de lectura nuevos.
Se reutilizan `ConductorDetalle`, `Vehiculo` y los enums de `src/api/types.ts`.
No trasladar nombres snake_case del prototipo a la API camelCase.

### Lectura

`GET /api/conductores/:id` devuelve directamente un `ConductorDetalle`, sin envoltorio `data`.
`:id` es `Conductor.id`; `usuarioId` no se usa para formar esta ruta.
La respuesta contiene los datos del listado mas `usuarioId`.
`creadoEn` es una fecha ISO serializada en UTC.
`vehiculo` es el no eliminado mas reciente por `creadoEn desc`, o `null`.
La relacion de base es 1:N, pero este endpoint no expone una coleccion ni permite elegir vehiculo.

El GET usa autenticacion con autorizacion por objeto.
Admin y n8n pueden consultar cualquier conductor; un conductor solo puede consultar su perfil.
El dashboard sigue usando exclusivamente su Bearer de administrador, nunca credenciales internas n8n.
ID invalido, conductor inexistente o eliminado producen 404.
No agregar consultas a otros endpoints para completar datos que esta ficha no necesita.

### Escritura

`PATCH /api/conductores/:id/vehiculo` requiere administrador.
Actualiza exclusivamente los campos enviados sobre el vehiculo activo mas reciente.
No crea vehiculo ni condiciona la edicion a un estado de aprobacion del conductor.
No imponer en el frontend una restriccion de estado que este contrato no exige.
Devuelve `200` con `ConductorDetalle`, no un vehiculo aislado ni `204`.

| Campo | Regla del contrato |
|---|---|
| `placa` | String, trim, 1-30 caracteres. Sin regex de matricula ni conversion obligatoria a mayusculas. |
| `marca` | String, trim, 1-30 caracteres. |
| `modelo` | String, trim, 1-30 caracteres. |
| `color` | String, trim, 1-30 caracteres. |
| `capacidadPasajeros` | Numero JSON entero entre 1 y 100, sin coercion de strings en backend. |

Todos los campos son opcionales en PATCH, pero debe enviarse al menos uno.
Claves desconocidas, cuerpo vacio, null, tipos invalidos y valores fuera de rango son rechazados con 400.
Los campos internos de `Vehiculo` no son nullable; la nulidad corresponde al objeto completo.
Una placa duplicada produce `409 CONFLICT`, con mensaje `La placa ya esta registrada`.

### Estado de formulario previsto

Estos tipos describen UI/escritura, no contratos persistentes nuevos:

```ts
type ValoresVehiculo = {
  placa: string
  marca: string
  modelo: string
  color: string
  capacidadPasajeros: string
}

type PayloadVehiculo = Partial<Pick<Vehiculo,
  'placa' | 'marca' | 'modelo' | 'color' | 'capacidadPasajeros'
>>
```

Mantener capacidad como texto durante la edicion permite representar vacio sin convertirlo en cero.
Convertirla a numero solo tras validar que representa un entero finito entre 1 y 100.
El formulario debe rechazar vacio, texto no numerico, negativos, cero, fracciones y valores fuera de rango.
No agregar restricciones de notacion numerica ajenas al contrato sin una justificacion explicita.

La base de comparacion pertenece al conductor y al vehiculo sobre los que se abrio la edicion.
Comparar valores normalizados contra esa base, no contra una cache que cambia durante el borrador.
Enviar exclusivamente claves permitidas cuyos valores efectivos cambiaron.
Nunca enviar `id`, `usuarioId`, `vehiculo`, fechas ni estados.
Cambios solo de espacios exteriores no generan PATCH.
Una capacidad equivalente como texto al numero original tampoco genera diferencias efectivas.

Ejemplo: base con placa `123-ABC`, color `Blanco` y capacidad 4; editar placa a ` 123-ABC ` y color a `Azul` produce solo `{ color: 'Azul' }`.
No permitir enviar `{}` mediante clic, Enter o submit programatico.
Separar borrador modificado de payload valido: vaciar un campo requerido sigue siendo una edicion que no debe perderse por refetch.
No reutilizar sin adaptacion el constructor de payload de Configuracion, que tiene campos y nulidad diferentes.

## Presentacion y comportamiento

### Fidelidad visual

Mantener tarjetas, espacios, bordes, avatar de iniciales, encabezado y jerarquia de `detailPage` del prototipo.
Usar la paleta y Segoe UI existentes, con estilos locales para no alterar otras pantallas.
Conservar el shell y su breakpoint de 1024 px.
Usar dos columnas en escritorio y una columna por debajo, evitando copiar los breakpoints historicos del prototipo que contradigan el shell.

| Elemento visual | Adaptacion requerida |
|---|---|
| Encabezado | Nombre real con `nombreParaMostrar`, iniciales decorativas y badge de cuenta. |
| Registro | Usar `creadoEn`, nunca la fecha fija del prototipo. Formato `es-BO` en `America/La_Paz`, con fecha ISO valida en elemento `time`; si no se puede formatear, `Fecha no disponible`. |
| Unidad | Omitirla: no existe en `ConductorDetalle`. |
| Datos personales | Nombre, CI y telefono de lectura; no ofrecer soporte automatizado ni edicion. |
| Vehiculo asignado | Marca, modelo, placa, color y capacidad reales; icono decorativo sin foto ficticia. |
| Estado operativo | Jornada y disponibilidad con `EstadoBadge`, solo lectura; ultima ubicacion desde el endpoint contratado de mapa. |
| Datos ausentes del DTO | No inventar unidad, direccion, servicios ni historial. Antiguedad solo desde `ultimaUbicacionRegistradaEn`. |
| Modal del prototipo | Conservar su composicion segun P2, pero corregir limites y hacer editable capacidad. |

Reutilizar `nombreParaMostrar`: nombreCompleto vacio o solo espacios muestra `(sin nombre)` en encabezado, datos personales, enlaces y etiquetas accesibles.
El helper tambien tolera null o undefined de forma defensiva, sin convertirlos en valores admitidos por el contrato.
Si `creadoEn` no representa una fecha valida o no puede formatearse, mostrar exactamente `Fecha no disponible` en lugar del texto de registro.
No sustituirla por la fecha actual ni por una fecha ficticia, y no emitir un atributo `datetime` invalido.
No confundir jornada/disponibilidad registradas con elegibilidad real para recibir solicitudes.

### Navegacion aprobada (P1)

Nombre y flecha son enlaces independientes a `/conductores/:id` usando el ID de conductor.
La flecha lleva un nombre accesible como `Ver detalle de <nombre>` y su icono es decorativo.
No anidar enlaces ni meter botones de transicion dentro de un enlace.
No agregar manejador de clic al `tr` ni a la tarjeta completa.
Mantener `Sin vehiculo` como texto, no como acceso a un alta inexistente.
El acceso al perfil sigue disponible si no hay vehiculo o si el conductor no admite transiciones.
No desactivar las acciones existentes del listado para simular navegacion.

### Edicion aprobada (P2/P5)

La ficha muestra datos confirmados; el borrador solo aparece en el formulario.
Abrir `Editar vehiculo` inicializa valores y base desde el ultimo detalle confirmado disponible.
Ofrecer Guardar y Cancelar; no incorporar un tercer boton Restablecer por defecto.
Guardar no envia sin diferencias y bloquea envios simultaneos, incluidos doble clic y Enter repetido.
Mientras PATCH esta pendiente, bloquear campos, envio y cierre local del modal.
Esto no bloquea logout, expulsion por 401 ni navegacion global.

En exito vigente, adoptar el DTO devuelto, limpiar el borrador y cerrar el modal.
Anunciar la confirmacion en la ficha y devolver foco a `Editar vehiculo` si sigue existiendo.
En error recuperable o placa duplicada, mantener el modal y todo lo escrito.
Cancelar, Escape, boton de cierre y clic exterior deben pasar por la misma politica de descarte.
P5: con cambios, pedir confirmacion nativa; cancelar la confirmacion conserva el modal.
Sin cambios, cerrar directamente; durante guardado, impedir esas vias locales de cierre.

Mostrar `Tienes cambios sin guardar` mientras exista un borrador modificado, incluso invalido.
P5: registrar `beforeunload` solo durante ese estado y retirarlo al limpiar o desmontar.
El navegador decide el texto y disponibilidad del aviso nativo.
La navegacion interna puede perder el borrador sin confirmacion bajo N1-B; esta limitacion queda aceptada para SPEC06, en coherencia con SPEC04.
No parchear historial ni interceptar globalmente enlaces para simular un bloqueo de rutas.

### Lectura y refresco aprobados (P4)

Consultar mediante `['conductor-detalle', id]`, habilitada solo con sesion y recurso identificado.
Pasar el `signal` de la query a `apiFetch(ruta, { signal })` para que la lectura participe en el aborto del transporte.
No usar una fila del listado como detalle completo: le falta `usuarioId` y puede estar desactualizada.
Reutilizar `retryConductores`: como maximo un reintento para red/5xx, ninguno para 4xx.
No modificar las opciones globales del QueryClient.

P4 establece ausencia de `refetchInterval` nuevo en detalle.
El listado conserva su polling de 15 s y sus pausas existentes.
Actualizar y Reintentar comparten guardas para no disparar lecturas manuales simultaneas.
Bloquear refresco manual durante PATCH, no durante toda la edicion.
Una lectura nueva puede actualizar la ficha sin borrar ni rebasar silenciosamente el borrador.
Sin borrador modificado, se pueden adoptar nuevos datos confirmados.
Con borrador, conservar sus valores y la base original.

### Cancelacion verificada en el cliente

`apiFetch` acepta `RequestInit` y ejecuta `fetch(url, { ...options, headers })` en `src/api/client.ts:15-24`.
Por tanto, conserva `options.signal` cuando el llamador lo proporciona; fetch es quien consume esa senal.
`apiFetch` no crea un AbortController ni suministra una senal automaticamente.
`http.get` solo recibe path y no reenvia opciones (`src/api/client.ts:57`); usar apiFetch directamente para el GET del detalle, sin modificar el cliente.
Abortar una senal permite interrumpir fetch o la lectura de su cuerpo mientras sigan pendientes; no garantiza deshacer trabajo ya ejecutado en el servidor.
La cancelacion logica de una query y las guardas de vigencia siguen siendo necesarias para impedir efectos de respuestas obsoletas.
Sin pasar signal, cancelar la query no implica por si solo aborto fisico del transporte.
El `AbortError` creado despues de leer una respuesta exitosa de otra sesion (`src/api/client.ts:48-52`) es descarte logico, no evidencia de aborto de red.
La rama de errores HTTP lanza `ApiError` y requiere las guardas de sesion existentes en los consumidores; no asumir que descarta automaticamente todos los errores tardios.
Estas conclusiones provienen de inspeccion estatica; el paso efectivo de signal y las carreras se verificaran con mocks durante implementacion.

### Vehiculo o recurso desaparecido

Con `vehiculo: null` inicial no hay boton Editar, formulario ni PATCH.
Si una lectura durante edicion devuelve vehiculo null o un ID de vehiculo diferente, impedir guardar ese borrador sobre el nuevo objetivo.
Conservar el texto ya escrito en estado no guardable y explicar el cambio; no mostrarlo como formulario editable de un vehiculo ausente.
Ofrecer descartar y volver a consultar; para editar otro vehiculo debe abrirse una nueva edicion desde su DTO confirmado.
Un 404 de conductor sustituye la ficha operativa por no encontrado y vuelta al listado.
No mantener un formulario guardable por tener cache anterior a un 403 o 404.
La deteccion local de cambio de ID no evita una sustitucion que ocurra despues del ultimo GET.

## Errores

`ApiError` expone solo `status` y `message`.
Los codigos estables del backend se documentan como contrato, pero no se asume una propiedad `error.code` en el cliente.
No deducir estados o entidades a partir de analizar texto de mensajes.

### Mensajes exactos del PATCH verificados en codigo

| HTTP / codigo backend | Mensaje exacto | Contexto y fuente |
|---|---|---|
| 400 `VALIDATION_ERROR` | `Entrada invalida` | ZodError por cuerpo vacio, claves desconocidas, tipos o limites invalidos en `conductores.schema.ts:4-23`, lanzado por `.parse(req.body)` en `conductores.controller.ts:78`. `middlewares/error-handler.ts:14-20` tambien usa este mensaje para JSON mal formado. |
| 403 `FORBIDDEN` | `Permiso denegado` | JWT valido de usuario activo cuyo rol actual no es admin; `middlewares/auth.ts:21,127-147`. El PATCH monta requireAdmin antes del controlador (`conductores.router.ts:24`). |
| 409 `CONFLICT` | `La placa ya esta registrada` | Conflicto de placa al actualizar vehiculo; respuesta de `conductores.controller.ts:82-84`. No es `INVALID_STATE_TRANSITION`, que pertenece a las acciones del listado. |

El 400 es generico: no expone `issues`, nombres de campos ni el detalle de Zod.
Las ayudas por campo deben proceder de validacion local; no atribuir al backend mensajes detallados que no devuelve.
Credenciales ausentes, invalidas o de usuario eliminado producen 401 `Credenciales invalidas`, no ese 403 (`middlewares/auth.ts:20,127-145`).
Un token n8n por si solo no satisface requireAdmin: sin Bearer responde 401; no documentarlo como 403 de rol.
El JSON se procesa antes de las rutas (`../backend/src/app.ts:17`), por lo que JSON mal formado puede producir 400 antes de comprobar permisos.
Dentro del controlador, un ID invalido produce 404 antes de validar el body (`conductores.controller.ts:72-78`).
Mostrar `ApiError.message` recibido y decidir comportamiento por status/contexto de operacion, nunca mediante comparacion o parseo del texto.
La verificacion de estos mensajes es documental, no una prueba de integracion real.

| Caso | Comportamiento requerido |
|---|---|
| GET inicial pendiente | Estado de carga, sin formulario ni valores ficticios. |
| GET 404 | Conductor no encontrado; vuelta al listado, sin retry automatico ni alta. |
| GET 403 | Permiso denegado, sin logout automatico ni edicion. |
| GET red/5xx sin datos | Error recuperable y Reintentar; no presentarlo como ficha vacia exitosa. |
| GET red/5xx con datos previos | Conservar ultima ficha confirmada con aviso de posible desactualizacion; no borrar borrador. |
| PATCH 400 | Mostrar `Entrada invalida` recibido y conservar formulario; no inventar detalles por campo desde esa respuesta. |
| PATCH 409 | Mostrar `La placa ya esta registrada` o mensaje recibido; conservar borrador y permitir corregir, sin retry automatico. |
| PATCH 403 | Mostrar `Permiso denegado`, conservar borrador y bloquear nuevos guardados hasta una recuperacion explicita; no cerrar sesion por 403. Un GET exitoso no acredita permiso PATCH porque GET tiene autorizacion mas amplia. |
| PATCH 404 | Mostrar mensaje recibido, conservar borrador no guardable y reconciliar GET para conocer si falta conductor o vehiculo. No inferirlo solo por el codigo. |
| PATCH red/5xx | Conservar borrador y comunicar que no se pudo confirmar el resultado. No afirmar que no persistio ni repetir la escritura automaticamente. |
| GET posterior a PATCH 200 falla | Conservar DTO confirmado y anuncio de guardado; mostrar fallo de actualizacion por separado. |
| 401 de sesion vigente | Mantener cierre y redireccion existentes; no bloquearlos por un borrador. |
| Respuesta tardia de otra sesion | No publicar cache, exito, error ni limpieza en la sesion nueva. |

No reutilizar literalmente `fallaDeGuardado` de Configuracion: su 409 es una eliminacion, no una placa duplicada.
Los errores del backend son genericos para validacion; no hay un array de issues utilizable para mapear campos.

## Cache, concurrencia y sesion

### Tras un guardado confirmado

1. Capturar conductor, vehiculo base y revision de sesion al iniciar la mutacion.
2. Ejecutar PATCH sin retry ni actualizacion optimista.
3. Verificar que la sesion de origen sigue vigente antes de producir efectos.
4. Cancelar lecturas anteriores del detalle afectado y de `['conductores']`; revalidar sesion despues de cada espera.
5. Publicar el DTO completo en `['conductor-detalle', idDeOrigen]` solo tras el 200.
6. Actualizar formulario y avisos solo si la vista corresponde aun al mismo recurso y edicion.
7. Invalidar detalle y prefijo del listado para reconciliar contra servidor.

No insertar `ConductorDetalle` directamente en arrays `ConductorListado` ni fabricar caches de pestanas ausentes.
La placa mostrada al regresar al listado debe reconciliarse sin recargar toda la aplicacion.
Un fallo de refresco no revierte el DTO confirmado ni transforma el PATCH exitoso en fallido.
Si se navega a otro perfil mientras se guarda, una respuesta no cambia el formulario ni los avisos del perfil nuevo.
La conciliacion de cache del recurso de origen puede continuar en la misma sesion aunque la vista se haya desmontado.
No ejecutar efectos de UI en un componente desmontado.

### Decision original respecto a SPEC05 (P3, sustituida)

Los parrafos siguientes conservan la decision historica. La ampliacion vigente permite acciones en perfil, conciliacion cruzada y pruebas de coordinacion, segun el registro final.

Las transiciones y su maquina de estados permanecen exclusivamente en el listado, sin cambios funcionales en esta spec.
Lista.tsx se modifica solo para habilitar los enlaces de P1, conservando confirmaciones, polling y conciliacion existentes.
Se retira del borrador la ampliacion de conciliacion cruzada desde las transiciones y su prueba de concurrencia con edicion de vehiculo.
El detalle obtiene el estado mediante GET al entrar, Actualizar, Reintentar y conciliacion tras su propio PATCH; no promete sincronizacion instantanea con una transicion externa o aun pendiente.
No reutilizar respuestas de transiciones para repoblar el formulario de vehiculo ni duplicar su logica en el perfil.
Mantener las protecciones generales de esta seccion para GET/PATCH de vehiculo, cambios de recurso y sesiones.

### Cambio de sesion y de parametro

Reutilizar `getSessionRevision`, cliente HTTP y limpieza de AuthContext, sin un segundo sistema de sesion.
Las guardas deben cubrir tanto exito como error y reevaluarse despues de operaciones asincronas.
Cambiar de `:id` debe aislar formulario, base, errores y bloqueo de envio del recurso anterior.
No mostrar datos del conductor A como placeholder del conductor B.
Cerrar sesion o recibir 401 vigente retira datos y borradores, sin persistencia local.
Cancelar una consulta no revierte una escritura que ya haya llegado al servidor.

### Limite del backend

El PATCH no recibe version, ETag, precondicion ni ID del vehiculo esperado.
Dos administradores pueden sobrescribir el mismo campo; prevalece la escritura que se aplique despues.
Enviar diferencias preserva campos omitidos, pero no resuelve conflictos sobre el mismo campo.
El backend selecciona el vehiculo activo mas reciente en el momento de la operacion.
Un cambio externo de vehiculo entre GET y PATCH puede cambiar el objetivo sin que el cliente lo detecte previamente.
No prometer control de concurrencia que el contrato no ofrece.
El usuario acepta esta limitacion como deuda tecnica no bloqueante del MVP; mitigarla plenamente requiere otra spec de backend.
En la defensa ante tribunal debe declararse expresamente que el PATCH parcial reduce sobrescrituras de campos omitidos, pero no aporta ETag/versionado ni deteccion atomica de conflictos.

## Accesibilidad y movil

- Mantener estructura semantica con un titulo principal y encabezados de tarjetas.
- Asociar labels, ayudas y errores a cada input; usar `aria-invalid` y `aria-describedby` cuando corresponda.
- Anunciar errores con `role="alert"` y confirmaciones con `role="status"`.
- Marcar actividad deliberada de guardado/refresco sin ocultar datos confirmados durante conciliacion.
- Ofrecer foco visible y controles alcanzables con teclado; no depender exclusivamente de color o hover.
- El modal debe tener nombre accesible, foco inicial, foco contenido y restauracion de foco al cerrar (P2).
- Asegurar que Escape y clic exterior respetan P5, sin bloquear el cierre de sesion.
- Bloquear scroll de la pagina de fondo mientras el modal este abierto, tambien en movil, y restaurarlo al cerrar o desmontar.
- Evitar scroll horizontal; permitir solo el desplazamiento vertical interno necesario en pantallas bajas para no recortar campos o acciones.
- Mantener controles de al menos 44 px y evitar scroll horizontal a 320 px y con zoom 200%.
- Probar nombres de 100 caracteres, textos de vehiculo de 30 y mensajes largos sin desbordamiento.
- Mantener la informacion y acceso al perfil en tabla >=1024 px y tarjetas por debajo.
- No modificar el comportamiento movil del shell para construir el modal.

`Button` es nativo y no dispone de `asChild`; no anidar un enlace dentro de un boton para navegar.
Existe `@radix-ui/react-dialog`, pero `Sheet` esta adaptado al panel lateral del shell.
Usar la dependencia instalada para el modal sin convertir Sheet en un formulario ni instalar otra biblioteca.
Los detalles de API de las librerias se contrastaran con documentacion vigente antes de escribir codigo.

## Bloqueo de privacidad

El GET del detalle selecciona `usuario.id` y `usuario.telefono`, no su baja logica.
El DTO no incluye `usuarioEliminado` ni otro indicador equivalente.
No se puede distinguir una cuenta dada de baja de una activa a partir de un telefono vacio.
La ficha mostrara el telefono recibido conforme al contrato, igual que SPEC05; esto no resuelve el requisito de privacidad pendiente.
No inventar etiquetas de usuario eliminado ni filtrar perfiles por heuristicas.
Una mitigacion efectiva exige que el backend suprima el dato y exponga una senal acordada.
Ese cambio queda fuera de SPEC06 y no se considera cerrado por este documento.
El usuario registra este bloqueo del contrato como deuda tecnica no bloqueante del MVP, no como requisito satisfecho.
En la defensa ante tribunal debe explicarse que un Usuario eliminado puede seguir exponiendo su telefono en esta API y que la mitigacion efectiva exige cambiar el backend.

## Archivos previstos

Solo esta especificacion se actualiza en la entrega documental. Los demas archivos quedan previstos para una autorizacion posterior de implementacion.

| Archivo | Cambio futuro previsto |
|---|---|
| `specs/06-conductor-detalle-vehiculo.md` | Spec aprobada, decisiones cerradas y futura evidencia aun pendiente. |
| `src/pages/Conductores/Detalle.tsx` | Ficha, GET, formulario segun P2, PATCH, estados y aislamiento por recurso. |
| `src/pages/Conductores/Detalle.css` | Estilos locales de ficha/modal y responsive, si son necesarios siguiendo Lista.css. |
| `src/lib/vehiculoForm.ts` | Esquema de formulario, conversiones y diferencias testeables del vehiculo. |
| `src/lib/vehiculoForm.test.ts` | Validacion, normalizacion y payload exacto. |
| `src/lib/conductores.ts` | Solo extensiones realmente compartidas para detalle, rutas o conciliacion; reutilizar helpers existentes. |
| `src/lib/conductores.test.ts` | Pruebas de cualquier extension real, sin duplicar escenarios ya cubiertos. |
| `src/pages/Conductores/Lista.tsx` | Solo enlaces de nombre y flecha segun P1; no cambiar la logica de transiciones. |
| `src/pages/Conductores/Lista.css` | Estilo acotado de enlaces/flecha y espacio de acciones de P1. |

El modal puede permanecer en Detalle.tsx mientras no haya necesidad concreta de reutilizacion.
No crear hooks, componentes genericos o archivos nuevos para helpers triviales de un solo uso.
No se preven cambios en DTO, cliente, AuthContext, QueryClient, router, package.json ni configuracion spec.
Si una decision del usuario altera esa prevision, revisar el inventario antes de implementar.
El roadmap no se modifica en esta entrega; cualquier actualizacion futura debe reflejar evidencia, nunca intenciones.

## Plan de implementacion futuro

Este plan esta listo para una autorizacion posterior de implementacion; no se ejecuta en esta revision documental.
P1-P5 estan resueltas y las deudas tecnicas indicadas no bloquean el MVP.
Cada incremento mantiene el sistema ejecutable; dividir pasos extensos en cambios pequenos verificables.

1. Verificar estado del workspace y contratos antes de ejecutar la spec aprobada, conservando cambios ajenos.
2. Incorporar validacion y conversiones puras del formulario con unitarios de limites, manteniendo el stub funcional.
3. Incorporar diferencias contra base estable y sus pruebas de payload, sin conectar escrituras aun.
4. Sustituir el stub por GET y ficha de lectura, con carga, errores, 404, vehiculo null y vuelta al listado.
5. Incorporar presentacion responsive del detalle y estados accesibles, sin inventar datos del prototipo.
6. Conectar navegacion desde el listado segun P1 sin alterar las acciones ni hacer clicable la fila.
7. Incorporar los fallbacks `(sin nombre)` y `Fecha no disponible`, con pruebas de lectura y etiquetas accesibles sin datos inventados.
8. Incorporar la superficie de edicion aprobada en P2, base por recurso y proteccion de borrador de P5.
9. Conectar PATCH parcial, bloqueo de duplicados y errores con preservacion de valores; verificar metodo, ruta y cuerpo por mocks.
10. Incorporar publicacion confirmada, cancelacion de GET anteriores e invalidacion de detalle/listado con guardas de sesion y recurso.
11. Cerrar refresco segun P4 y casos de vehiculo cambiado/ausente durante edicion; verificar resultado incierto y fallo de conciliacion.
12. Ajustar foco, cierre y responsive contra la referencia; registrar evidencia saneada por criterio dejando INT06 y las integraciones anteriores pendientes.

Las pruebas acompanian cada incremento; no se posponen todas al ultimo paso.
El primer paso ejecutable sobre codigo agrega logica pura y pruebas sin alterar la pantalla.
El ultimo incremento cierra presentacion, accesibilidad y evidencia del alcance autorizado.
El plan original no incluia acciones en perfil; la ampliacion vigente las incorpora y verifica su bloqueo mutuo con edicion.

## Criterios de aceptacion

Las casillas marcadas cuentan con evidencia local descrita al final; las restantes no se consideran verificadas completamente. Ninguna casilla local acredita integracion real.
Los criterios P1-P5 reflejan decisiones ya aprobadas y deben verificarse durante implementacion.

### Registro de aprobacion documental

P1-P5 y mejoras a-d aprobadas por instruccion expresa del usuario.
N1-B aceptada en coherencia con SPEC04; privacidad y concurrencia sin versionado registradas como deuda tecnica no bloqueante.
Estado Aprobado significa listo para implementar, no implementado ni verificado.

### Contrato y ficha

- [x] GET usa Conductor.id y `['conductor-detalle', id]`, sin DTO duplicado ni datos ficticios.
- [x] Nombre, CI, telefono, estados y fecha real son solo lectura.
- [x] NombreCompleto vacio o solo espacios muestra `(sin nombre)` reutilizando nombreParaMostrar en ficha, enlaces y etiquetas accesibles, sin helper duplicado.
- [x] CreadoEn no formateable muestra exactamente `Fecha no disponible`, sin fecha inventada ni atributo datetime invalido.
- [x] Los badges muestran etiquetas de los enums existentes, no estados operativos inventados.
- [ ] ID invalido o inexistente devuelve una vista no encontrado con vuelta al listado.
- [x] `vehiculo: null` no ofrece formulario, Editar ni alta y no permite PATCH.
- [x] Textos de escritura aceptan 1 y 30 caracteres tras trim y rechazan vacio, espacios y 31 caracteres.
- [x] Capacidad acepta 1 y 100, rechaza vacio, texto, cero, negativos, fracciones y fuera de rango; viaja como numero JSON.
- [x] PATCH contiene solo diferencias efectivas y claves permitidas; nunca `{}`, IDs, fechas, null ni envoltorio vehiculo.
- [ ] Guardar bloquea doble clic y Enter repetido; una accion produce como maximo un PATCH sin retry automatico.
- [x] El 409 de placa duplicada conserva todo lo escrito y permite corregirlo.
- [x] 400, 403, 404, red y 5xx se tratan segun la matriz sin inventar causas ni prometer ausencia de persistencia.
- [x] PATCH 400/403/409 muestra respectivamente los mensajes recibidos `Entrada invalida`, `Permiso denegado` y `La placa ya esta registrada`; no parsea su texto ni presupone issues de validacion.

### Cache y seguridad

- [ ] Tras 200 se adopta el detalle completo y se invalidan detalle y listado sin insertar DTO de detalle en arrays de listado.
- [x] GET anterior al guardado no revierte el DTO confirmado al llegar tarde.
- [x] GET del detalle reenvia signal a apiFetch/fetch; se verifica aborto de lectura pendiente y descarte logico de respuestas obsoletas por separado, sin modificar el cliente ni prometer rollback servidor.
- [x] Fallo de GET posterior conserva el guardado confirmado y muestra un aviso de refresco separado.
- [ ] Refetch no borra un borrador valido ni invalido y no convierte cambios externos en diferencias artificiales.
- [ ] Vehiculo null, ID de vehiculo cambiado o recurso no autorizado/ausente durante edicion impiden guardar el borrador anterior.
- [ ] Cambiar de conductor durante GET/PATCH no muestra formulario, errores o exito del recurso anterior en el nuevo.
- [ ] 401 vigente conserva logout; exito/error tardio de sesion A no altera cache, avisos ni acceso de sesion B.
- [x] No se persisten tokens ni borradores ni se deduce baja de Usuario a partir del telefono.
- [x] No se presenta control de versiones o proteccion de concurrencia que el backend no implementa.

### UX aprobada, pendiente de verificar

- [ ] P1: nombre y flecha abren el perfil en tabla y tarjetas; la fila completa y Sin vehiculo no navegan.
- [ ] P1: flecha tiene nombre accesible y no interfiere con transiciones o enlaces por teclado.
- [ ] P2: modal edita los cinco campos, con foco contenido, scroll del fondo bloqueado en movil/escritorio y restauracion de foco/scroll al cerrar o desmontar.
- [x] P3 ampliada: el perfil agrega acciones permitidas por los helpers del listado, con confirmacion y bloqueo mutuo con edicion.
- [x] P4: no hay polling nuevo en detalle; carga, Actualizar, Reintentar y conciliacion preservan el borrador.
- [ ] P5: aviso de cambios y beforeunload cubren borradores validos e invalidos y se limpian al descartar, guardar o desmontar.
- [ ] P5: Cancelar, Escape, cierre y clic exterior piden descarte con cambios y no cierran durante PATCH.
- [ ] P5: navegacion interna puede descartar el borrador sin confirmacion; logout y 401 nunca quedan bloqueados.

### Presentacion y verificacion

- [ ] La comparacion con el prototipo acredita tarjetas, encabezado, jerarquia y paleta sin Unidad, fecha fija ni datos ajenos al DTO.
- [x] Tabla/tarjetas y ficha mantienen acceso e informacion a 1023/1024 px, 1280 px y 320 px, sin scroll horizontal.
- [ ] Zoom 200%, modal de altura reducida y textos largos mantienen todas las acciones alcanzables.
- [ ] Labels, errores, avisos, foco y navegacion funcionan con teclado; se registra por separado si hubo prueba con lector de pantalla.
- [x] La suite unitaria existente y ampliada, y el build, terminan correctamente en la ejecucion futura autorizada.
- [ ] El navegador verifica los casos de la matriz con todas las llamadas API interceptadas y sin trafico real accidental.
- [x] La evidencia distingue inspeccion, unitarios, navegador con mocks e integracion real.
- [x] INT06 (criterio de persistencia): GET/PATCH autenticados y persistencia verificados en entorno y cuenta autorizados, fuera de la ejecucion con mocks. Evidencia real del 2026-10-02 al final; esto no cierra la matriz completa de INT06 (409 y permiso de rol pendientes).

## Estrategia de pruebas futura

Reutilizar Vitest y herramientas de navegador existentes, sin instalar dependencias por defecto.
Ejecutar en el futuro `npm run test:unit` y `npm run build` solo bajo autorizacion de implementacion/verificacion.
No se ejecutan para actualizar este documento.

| Grupo | Casos previstos |
|---|---|
| U01 Validacion | Textos 0/1/30/31, espacios exteriores, capacidad 1/100 y clases invalidas, sin mayusculas forzadas. |
| U02 Diferencias | Cada campo aislado, combinaciones, sin cambios, equivalencias normalizadas, claves permitidas y exclusion de IDs/null. |
| U03 Borrador | Base estable ante cambio externo, borrador invalido no tratado como limpio, vehiculo cambiado y recurso distinto. |
| U04 Cache | Paso de signal a fetch mediante apiFetch, aborto de lectura pendiente frente a descarte logico, invalidacion por ID correcto, sesion vigente y no fabricacion de caches de lista. Probar logica real, no una reimplementacion en tests. |
| Q01 Lectura | Carga, detalle con vehiculo, null, nombre vacio/en blanco, fecha no formateable, 404, 403, red y 5xx con y sin datos anteriores. Fallbacks exactos y etiquetas accesibles consistentes. |
| Q02 Guardado | Metodo/ruta/cuerpo exactos, cinco campos, diferencias parciales, 200 completo, doble envio y ausencia de retry. |
| Q03 Errores | Mocks de los mensajes exactos 400/403/409 documentados, sin issues ni parseo de texto; 400/409 conservan borrador; 403/404 bloquean guardado segun matriz; red/5xx no afirman ausencia de persistencia. |
| Q04 Conciliacion | Placa actualizada al volver al listado, GET tardio antes del PATCH y fallo de GET despues del 200. |
| Q05 Borrador | Refetch durante borrador y vehiculo desaparecido/cambiado; ampliacion: impedir transicion durante edicion y edicion durante transicion. |
| Q06 Recurso | Navegar A -> B durante GET/PATCH; no mostrar datos ni avisos de A en B. |
| Q07 Sesion | GET/PATCH diferido de A, logout y login B; probar exito, error y 401 tardios sin afectar B. |
| N01 Navegacion | Enlaces de P1, acciones independientes, acceso directo con sesion y retorno al listado segun comportamiento aprobado. |
| N02 Descarte | P5 con Cancelar/Escape/cierre/exterior, confirmacion cancelada/aceptada, beforeunload y navegacion interna; cierre bloqueado durante PATCH. |
| V01 Visual | Comparacion con app.js/styles.css, escritorio/movil, textos largos, zoom 200% y altura reducida. |
| A01 Accesibilidad | Orden de foco, etiquetas, anuncios, modal, bloqueo/restauracion de scroll del fondo en movil y escritorio, desplazamiento interno necesario, retorno de foco y teclado sin raton. |
| R01 Regresion | Cuatro pestanas, filtro local, confirmaciones nativas, transiciones estrictas, cache reconciliada, polling de lista y sesiones de SPEC05 intactos. |
| INT06 Integracion | GET detalle y PATCH parcial con Bearer admin, permisos reales, persistencia de omitidos y cambios, 404/409 en entorno autorizado. |

Los unitarios de helpers no acreditan comportamiento de React, foco, modal ni navegacion.
Interceptar todas las rutas API antes de navegar, incluidas Login, configuracion e indicadores si se visitan.
Usar datos ficticios y no crear cuentas, seeds o migraciones para desbloquear pruebas.
No incluir mocks en codigo de produccion.
Limpiar interceptores y estado de navegador al terminar, incluso ante fallos.
Registrar fecha, resultado y evidencia saneada sin tokens, credenciales ni datos personales.

INT06 queda pendiente hasta autorizacion especifica de entorno y cuenta reales.
Mocks no acreditan autorizacion, disponibilidad de backend, CORS ni persistencia.
INT01, INT03, INT04 e INT05 conservan su estado pendiente y no se cierran con esta spec.

## Decisiones establecidas y alternativas

### Establecido por contrato o decisiones previas

- Si: tipos centrales, sesion en memoria, cliente y ruta protegida existentes; evitar duplicacion.
- Si: PATCH parcial de cinco campos y GET como fuente de detalle; el backend es la autoridad.
- Si: datos personales de lectura y vehiculo ausente sin alta; lo exige el roadmap.
- Si: nunca fila completa clicable; decision previa explicita de SPEC05.
- Si: privacidad no resuelta, sin heuristicas; mantener el bloqueo documentado.
- No: limites 16/40/50/40 del prototipo, capacidad solo informativa o placa forzada a mayusculas; no corresponden al contrato.
- No: copiar DTO de detalle al listado, actualizar optimistamente o reintentar PATCH; evitar datos inventados y duplicacion de escrituras.
- No: cambiar backend, entorno, dependencias o router para cerrar esta entrega.

### Aprobado y diferido

P1-P5 quedan cerradas en la tabla de decisiones aprobadas.
Se descartan nombre como unico enlace, formulario en tarjeta y polling nuevo en detalle. Las acciones de cuenta en perfil originalmente descartadas quedan incluidas por la ampliacion vigente.
Las mejoras a-d quedan incorporadas con criterios funcionales aun sin verificar.
La proteccion completa de navegacion interna, la privacidad del telefono y el versionado del PATCH se difieren como deuda tecnica explicita del MVP.
No quedan preguntas P1-P5 pendientes ni su aprobacion autoriza implementar durante esta revision.

## Riesgos

| Riesgo | Mitigacion o limite |
|---|---|
| Aprobacion confundida con implementacion | Estado Aprobado, criterios funcionales sin marcar y ninguna evidencia de ejecucion. |
| Refetch borra datos escritos | Base estable por recurso y deteccion de borrador incluso invalido. |
| Navegacion interna pierde ediciones | P5 aprobada: aviso y beforeunload; limitacion aceptada, no cobertura total. |
| GET viejo revierte guardado | Cancelar lecturas, publicar solo 200 e invalidar con guardas de sesion. |
| Cambio externo de estado deja perfil obsoleto | GET al entrar, refresco explicito y conciliacion de transiciones locales; no prometer sincronizacion instantanea externa. |
| Cambio de ID o sesion mezcla formularios | Aislar recurso y revision; comprobar vigencia antes de efectos tardios. |
| Edicion concurrente del mismo campo | Deuda tecnica no bloqueante del MVP, explicable ante tribunal: PATCH parcial sin ETag/versionado; requiere backend para solucion completa. |
| Vehiculo activo sustituido entre GET/PATCH | Detectar cambios observables de ID y bloquear borrador; no garantiza precondicion atomica. |
| Usuario eliminado sigue exponiendo telefono | Deuda tecnica no bloqueante del MVP, explicita ante tribunal; no inferir baja ni presentar privacidad como resuelta. |
| Red falla despues de persistir | Resultado incierto, borrador conservado y ninguna repeticion automatica. |
| Modal inaccesible en movil | Verificar foco, bloqueo de scroll de fondo, desplazamiento interno, cierre y acciones segun P2 aprobada. |

## Que NO forma parte de esta especificacion

- Esta revision aprobada no implementa codigo ni aporta evidencia de funcionamiento.
- No crea conductores o vehiculos, ni edita datos personales, PIN o estados operativos.
- No incorpora extras del prototipo sin contrato, mapas, historial o notificaciones.
- No resuelve privacidad ni concurrencia mediante cambios de backend.
- No autoriza peticiones reales, cuentas nuevas, cambios de entorno, instalaciones, commits o ramas.
- No modifica la configuracion spec ni marca el roadmap como implementado.
- No cierra INT01, INT03, INT04, INT05 o INT06; la aprobacion de P1-P5 es exclusivamente documental.

## Registro de continuacion autorizada - 2026-10-01

La instruccion posterior del usuario autoriza implementacion y verificacion local, no API real.
Se leyo esta spec completa, package.json, configuracion spec, estado/diffs git y codigo existente antes de editar.
El workspace ya contenia helpers, unitarios, ficha/modal y enlaces del intento anterior; se conservaron y verificaron, sin atribuir su autoria a esta continuacion ni reconstruir artificialmente el orden de sus ediciones.
Se comenzo por revisar helpers puros y ejecutar sus unitarios junto a la suite existente antes de verificar ficha, enlaces y escrituras.
No existe herramienta Task en esta sesion: no se invoco el subagente spec-impl. La ejecucion se realizo directamente.
AutoCreateBranch no se ejecuto por prohibicion expresa del usuario. El aviso git sobre el enlace inexistente .claude/skills/spec-impl se dejo intacto.

### Implementacion e inspeccion

- `src/lib/vehiculoForm.ts` y su test: normalizacion, limites contractuales, capacidad numerica, diferencias contra base y suciedad independiente de validez.
- `src/pages/Conductores/Detalle.tsx` y `.css`: ficha, GET con signal, Radix Dialog, borrador estable, PATCH parcial, errores por status, conciliacion y guardas de sesion/recurso. Se agregaron guardas antes de iniciar GET/refresco y foco alternativo en Volver si desaparece Editar.
- `src/pages/Conductores/Lista.tsx` y `.css`: enlaces separados de nombre/flecha; diff sin cambios a transiciones, polling ni confirmaciones existentes.
- `src/api/client.test.ts`: prueba preexistente del intento anterior conservada para reenvio de signal y aborto; `client.ts` no se modifico.
- No se modificaron AuthContext, router, DTO, configuracion global, backend, dependencias ni entorno. No ramas, commits o instalaciones.
- Documentacion Context7 consultada antes de editar: TanStack Query (`cancelQueries`, signal, `setQueryData`, `invalidateQueries`) y Radix Dialog (control de apertura, foco y eventos de cierre).
- Comparacion de estructura con `references/pantallas/app.js:134-138`: tarjetas, avatar, jerarquia, vehiculo y estado operativo; no se afirma comparacion visual pixel a pixel.
- Cache: inspeccion confirma cancelacion de detalle/listado, revalidacion de sesion despues de esperas, publicacion del DTO y posterior invalidacion de ambos prefijos, sin insertar detalle en arrays de listado.
- La base de edicion y el componente quedan aislados por revision de sesion e ID. GET exitoso no desbloquea PATCH403; se exige nueva autenticacion administrativa, sin afirmar que el GET pruebe permisos de escritura.

### Unitarios y build

`npm run test:unit`: **6 archivos, 261 pruebas aprobadas**, tanto al inicio como despues de los ajustes (ultima ejecucion 10:33 local).
`npm run build`: **correcto**, TypeScript y Vite, 181 modulos transformados.
`git diff --check`: correcto; avisos de conversion LF/CRLF del workspace, no errores de whitespace.
U01/U02 cubren limites, trim, equivalencias numericas, payload exacto y exclusion de claves internas; U03 cubre borrador invalido/base pura, no toda la conducta React.
U04 de cliente diferencia signal/aborto simulado de transporte y pruebas existentes de descarte por sesion. No acredita rollback del servidor.

### Navegador con mocks

Se usaron contextos aislados de Playwright con service workers bloqueados. Antes de navegar se instalo interceptacion `**/*`: todas las rutas `/api/` respondieron con datos ficticios o aborto simulado; fetch/XHR no previsto y origen ajeno se bloquearon. Solo se permitieron recursos locales de Vite. No se usaron credenciales ni API reales.
Cada bloque finalizo cerrando su contexto en `finally`, retirando rutas, sesion y estado. El contexto inicial de exploracion tambien se cerro.

| Grupo | Evidencia local observada |
|---|---|
| Lectura | Nombre y flecha abren detalle; datos personales/estados de lectura y fecha La Paz. Nombre en blanco -> `(sin nombre)`; fecha invalida -> `Fecha no disponible`, sin elemento time. GET500 inicial sin formulario ficticio; GET de red recuperable con exactamente un retry al refrescar manualmente. GET403/404 ocultan ficha operativa. |
| Payload | PATCH solo `{color: 'Azul'}` al cambiar color y espacios exteriores en placa. Otro escenario verifico los cinco campos normalizados y capacidad JSON numerica. Enter repetido durante PATCH diferido produjo una sola escritura. |
| Errores | PATCH400/409 conservan borrador y muestran mensaje recibido. Red/500 conservan borrador y avisan resultado incierto. Cuatro intentos explicitos generaron cuatro PATCH, sin retries. PATCH403 permanece bloqueado tras GET200; PATCH404 conserva borrador bloqueado y reconcilia GET. |
| Borrador | Campo requerido vacio sobrevive Actualizar; beforeunload sintetico se cancela mientras esta sucio y deja de cancelarse tras descartar. Cambio observado de ID bloquea y preserva texto; vehiculo null elimina Editar y permite restaurar foco a Volver. |
| Modal | Foco inicial en placa, Tab contenido (15 pulsaciones), restauracion al guardar. Cancelar, X y exterior con confirmacion rechazada conservan modal; Escape rechazado conserva y aceptado descarta. Escape durante PATCH no cierra. Scroll body bloqueado en escritorio/movil y restaurado al cerrar. |
| Conciliacion | GET pendiente anterior al PATCH produce requestfailed al cancelarse; su respuesta liberada despues no revierte el color confirmado. GET500 posterior al 200 conserva DTO y anuncio de guardado con aviso de desactualizacion separado. |
| Recursos | PATCH A diferido, navegacion interna simulada a B mediante History/PopState: no modal ni exito de A en B; al volver A muestra dato conciliado. La simulacion pertenece solo al test, no al codigo productivo. |
| Sesiones | PATCH diferido de sesion A, logout desde modal, login ficticio B y liberacion de 200/403/401 de A: B mantiene acceso y no recibe modal/exito de A. GET401 vigente retorna a login. |
| Responsive | Listado (tabla/tarjetas) y detalle a 1280/1024/1023/320 px sin overflow horizontal medido, con nombre de 100 caracteres y vehiculo de 30. Flecha disponible en cada ancho. Modal 320x480 sin overflow horizontal, acciones alcanzables mediante scroll interno. |

### Incidencias de verificacion y pendientes

- Un intento de reutilizar estado global entre invocaciones Playwright fallo porque ese estado no persiste; se cerro el contexto y se repitieron los escenarios en invocaciones autocontenidas.
- Un escenario termino en timeout esperando GET500 despues de un GET404. La aplicacion conserva deliberadamente el bloqueo previo hasta GET exitoso; era una expectativa incorrecta del escenario. Las aserciones anteriores (incluidos 403/404) habian terminado; GET500 se verifico independientemente, al inicio y tras PATCH200.
- Un conteo inicial de GET esperaba dos solicitudes e incluyo tambien las del ciclo de montaje/cancelacion de desarrollo. No se acredita ese conteo inicial; el retry manual de red se repitio y verifico con dos solicitudes. Los unitarios existentes prueban la politica retryConductores.
- Pendientes locales: zoom real del navegador al 200%, lector de pantalla, comparacion visual completa con capturas del prototipo, matriz completa de cierres durante PATCH (se verifico Escape), doble clic dedicado, GET diferido entre sesiones/recursos con todas las variantes y regresion completa de las cuatro transiciones del listado. Las guardas despues de cada espera se inspeccionaron, pero no se forzo cada posible intercalado.
- No se acredita la apariencia/disponibilidad del dialogo nativo beforeunload en todos los navegadores: se verifico su listener mediante evento cancelable. No se acredita restablecimiento exacto de posicion de scroll en todos los dispositivos.
- La casilla global de matriz de navegador permanece sin marcar: los escenarios anteriores son evidencia parcial, no cobertura exhaustiva. Los criterios compuestos sin evidencia completa permanecen pendientes aunque su implementacion exista.
- **INT01, INT03, INT04, INT05 e INT06 siguen pendientes de integracion autorizada**. Mocks no prueban permisos reales, persistencia, CORS ni disponibilidad del backend.
- Siguen vigentes N1-B, privacidad del telefono no resuelta y ausencia de ETag/versionado o precondicion atomica de vehiculo. No se presentan como requisitos satisfechos.

## Ampliacion de perfil autorizada - 2026-10-01

Peticion explicita: reproducir `references/pantallas/conductor-detalle.html`, incluyendo puntos en badges, ultima ubicacion y Gestion de la cuenta. Esta autorizacion sustituye la exclusion original de ubicacion textual y acciones de P3, sin incorporar mapa ni modificar shell/backend.

### Cambios implementados

- `Detalle.tsx` / `Detalle.css`: columnas 1.35fr / 1fr y gap 22px, pilas de tarjetas con alturas distribuidas como el prototipo, avatar, flecha de regreso, jerarquia, placa, colores, notas y gestion. Se conserva Actualizar, controles de 44px, shell vigente y datos reales sin Unidad/fecha fija/direccion.
- `EstadoBadge.tsx`: punto decorativo currentColor de 7px, radio 6px, padding 5px/9px, peso 550 y etiqueta `En jornada` para `activa`. Cambio compartido intencional con listado; cuenta sigue usando `aprobado`, no un enum `activo` inventado.
- Ubicacion: una consulta cancelable y autenticada a `GET /api/dashboard/conductores-mapa`, contrato de SPEC01, seleccion por `Conductor.id`. Se conserva solo la fila seleccionada en cache. Sin polling, mapas ni consultas de direcciones. Carga/error propios; error nunca equivale a Sin reportes.
- Antiguedad desde `ultimaUbicacionRegistradaEn`, nullable: Sin reportes cuando no existe fecha, Hace N min cuando existe. `ubicacion: null` no determina caducidad ni ausencia de reporte. Mas de 300000ms muestra aviso; igualdad vigente. Se recalcula al renderizar/refrescar, sin reloj ni polling nuevo.
- Gestion: helpers de `conductores.ts`, confirmacion nativa coherente con Lista, PATCH sin body ni retry, DTO completo confirmado. Aprobar/rechazar pendiente, suspender aprobado, reactivar suspendido, ninguna accion rechazado.
- Cancelacion de lecturas anteriores, conciliacion detalle/listado/ubicacion y revision de sesion despues de esperas. Un bloqueo sincrono impide duplicados y comparte exclusividad con PATCH de vehiculo. No se permite transicion mientras hay modal/borrador ni abrir edicion durante transicion. Se conservan base estable, payload parcial, errores, 403/404, beforeunload y modal previos.

### Evidencia local de esta ampliacion

- Context7: documentacion de TanStack Query consultada sobre consumo de signal, cancelQueries y setQueryData antes de implementar.
- `npm run test:unit`: 6 archivos, 261 pruebas aprobadas. Suite existente, no se atribuyen tests unitarios nuevos a esta ampliacion.
- `npm run build`: correcto, TypeScript y Vite, 181 modulos.
- Playwright: todas las APIs interceptadas antes de navegar en contexto aislado; datos ficticios, sin backend real. Tambien bloqueadas solicitudes externas del prototipo (fuentes remotas), por lo que la comparacion usa fuentes de fallback disponibles.
- Capturas de prototipo y ficha a 1440px y 320px, leidas y comparadas visualmente. Se ajustaron alturas, grillas, paleta, placa y botones a partir de la comparacion. No se afirma igualdad pixel a pixel: shell actual, datos, refresco manual y objetivos tactiles se conservan deliberadamente.
- Medicion desktop: columnas 630.763px / 467.237px (ratio 1.35), gap 22px; cuatro puntos visibles de 7x7px. Sin overflow a 1024/1023/320, dos columnas a 1024 y una por debajo.
- Ubicacion reciente (incluso cuenta pendiente y coordenadas null), caducada, fecha null y error503 verificados; error no muestra Sin reportes. Reloj fijo: 300000ms vigente, 300001ms desactualizada.
- Gestion: cancelacion sin PATCH; aprobar sin body; suspender, reactivar y rechazar; rechazado sin botones. Error409 muestra mensaje recibido y conserva estado. Listado conciliado al regresar y puntos presentes.
- Coordinacion: Editar deshabilitado durante transicion; acciones de cuenta bloqueadas con modal/borrador. Guardado de color envia solo `{"color":"Azul"}`. Foco inicial en placa, restauracion al guardar, cancelacion de descarte conserva modal, validacion de vacio y Escape con descarte aceptado. Scroll del fondo bloqueado en movil.
- Doble clic programatico durante PATCH diferido produce una escritura. Respuesta tardia de A tras navegar mediante History/PopState de prueba a B no publica mensaje ni cambia perfil B.
- Capturas saneadas en el directorio temporal aprobado `C:/Users/HP/AppData/Local/Temp/opencode/spec06-*.png`, no incorporadas al repositorio.

### Incidencias y limites

- Primer chequeo a 1023 encontro una fraccion de pixel del viewport que no coincidia con max-width:1023. Se cambio solo el breakpoint local a `width < 1024px` y se repitieron satisfactoriamente los tres anchos.
- Estado global no persistente entre invocaciones Playwright: se recupero el contexto por browser.contexts. Un escenario adicional encontro login y se autentico de nuevo con mock. Un patron de interceptacion con `*` no capturaba el sufijo PATCH: se corrigio a `**` y se repitio la prueba de doble envio/respuesta tardia. No se acredita el intento fallido.
- La matriz nueva no repite todos los intercalados de sesiones, 401/403/404 y cierres del modal ya registrados en la continuacion anterior. Guardas revisadas por inspeccion; no afirmar cobertura exhaustiva. Zoom200% real y lector de pantalla pendientes.
- INT01, INT03, INT04, INT05 e INT06 siguen pendientes. No se modifican backend, dependencias, contratos ni permisos reales; no commits, ramas o instalaciones. Cambios previos conservados.
- Cierre: suite y build repetidos satisfactoriamente tras los ultimos cambios. `git diff --check` sin errores, solo avisos LF/CRLF existentes. Contexto aislado cerrado, interceptores retirados y servidor Vite propio detenido (arbol del proceso 12400). Rama original conservada.

## Integracion local autorizada - 2026-10-02

Este registro complementa los registros historicos anteriores: ya hay evidencia de persistencia real, pero no se declara cerrada toda INT06.

### Autorizacion y alcance

- El usuario selecciono backend local, inicio sesion administrativa en el navegador de pruebas y eligio expresamente un perfil existente.
- Autorizo cambiar temporalmente el color del vehiculo y restaurarlo. No se autorizaron transiciones de cuenta ni cambios de placa en esta ejecucion.
- Frontend `http://localhost:5173`; backend `http://localhost:3001`. Se usaron los procesos existentes y peticiones reales, sin mocks ni interceptores.
- No se guardan aqui nombre, identificador, telefono, CI, placa, credenciales, tokens ni cuerpos completos del perfil. Los valores originales se mantuvieron solo en memoria durante la comprobacion.

### Evidencia real

| Comprobacion | Resultado |
|---|---|
| GET del perfil con sesion administrativa | 200 y vehiculo presente. |
| Guardado desde modal | PATCH 200; cuerpo con una unica clave, `color`; respuesta con el color temporal confirmado. |
| Campos omitidos | Placa, marca, modelo y capacidad iguales a la base original en la respuesta y en GET posterior. |
| Persistencia observable por API | GET independiente mediante Actualizar devuelve el color temporal; no se acredita solo el estado local del formulario. |
| Restauracion | PATCH 200 con solo color original; GET posterior confirma restauracion y campos omitidos intactos. |
| Confirmacion adicional de restauracion | Otro GET independiente devuelve 200 y color original; modal cerrado. |
| Recurso inexistente | GET autenticado a un UUID inexistente devuelve 404. |
| Ausencia de credenciales | GET directo sin Bearer ni cookies devuelve 401; no altera la sesion administrativa de la aplicacion. |

Las lecturas y escrituras funcionaron desde el origen del frontend hacia el backend local. No se inspecciono directamente la base de datos ni se reinicio el backend: persistencia se acredita mediante GET posteriores independientes al PATCH.

### Incidencias del procedimiento

- Un intento de reutilizar estado global entre llamadas de la herramienta fallo antes de escribir. Se sustituyo por una unica ejecucion con valores en memoria y restauracion en `finally`.
- Un selector inicial buscaba Guardar en vez de Guardar vehiculo y produjo esperas agotadas sin enviar el cambio. Se corrigio el selector.
- La ejecucion corregida devolvio los cuatro resultados satisfactorios (guardado, GET, restauracion, GET); la herramienta tambien mostro una espera agotada residual. Por eso se realizo otro GET separado que confirmo 200 y restauracion antes de dar la prueba por terminada.

### Pendientes que no se cierran con esta evidencia

- INT06 completa: conflicto real de placa 409 y rechazo por rol no administrativo 403. Requieren recursos/cuentas de prueba y autorizacion adicional; no se usan datos ajenos ni se cambia una placa para forzar el caso sin permiso.
- No se probaron transiciones reales de cuenta ni se atribuye cobertura real a la ampliacion completa de Gestion de la cuenta.
- Esta ejecucion no resuelve los pendientes locales de concurrencia, foco, zoom o lector de pantalla registrados en la revision; no se ejecutaron nuevamente build ni unitarios porque solo se actualizo este documento.
- INT01, INT03, INT04 e INT05 mantienen su estado. Privacidad y ausencia de versionado backend siguen siendo deudas aceptadas.
- Se dejo el perfil con el color original, sin cerrar la sesion del usuario ni detener sus servidores. No se crearon datos, cuentas, ramas o commits.
