# SPEC 04 - Configuracion de la empresa

> **Estado:** Aprobado
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 02 (`02-autenticacion-admin.md`) y SPEC 03 (`03-shell-y-navegacion.md`).
> **Contrato externo:** `../backend/specs/04-configuracion.md`.
> **Fecha:** 2026-09-29
> **Objetivo:** Permitir al administrador consultar y actualizar parcialmente la configuracion de la empresa sin perder ediciones locales ni desincronizar el nombre mostrado en el shell.

## Contexto y fuentes

Esta revision documental incorpora la aprobacion del usuario y sus observaciones; no implementa codigo.
La especificacion queda lista para implementar con mocks, sin migraciones de router ni peticiones al backend real.
Las decisiones P1-P5 fueron confirmadas durante la conversacion; N1-B ajusta expresamente el alcance original de P4.

| Fuente | Uso |
|---|---|
| `../docs/ROADMAP_FRONTEND.md`, modulo 4 | Alcance, GET/PUT, campos, errores y criterios del formulario. |
| `../docs/ROADMAP_ENDPOINTS.md` | Contexto de operaciones; su afirmacion de inicializacion automatica es historica y no se aplica. |
| `../docs/REGLAS_DE_NEGOCIO.md`, regla 3 | Radio maximo configurable; la seleccion de conductores corresponde al backend. |
| `../docs/MODELO_DE_DATOS.md`, Configuracion | Una empresa y fila global `id = 1`; no equivale al DTO de escritura. |
| `../docs/ARQUITECTURA.md` | Backend como fuente de verdad y frontend como consumidor. |
| `../backend/specs/04-configuracion.md`, contratos y decisiones | Lectura sin inicializacion, PUT parcial, limites, nulidad y concurrencia. |
| `references/instrution-web/ESPECIFICACION_admin-web.md`, seccion 5.8 | Pantalla administrativa de configuracion. |
| `references/pantallas/configuracion.html`, `app.js` y `styles.css` | Composicion visual y significado de Restablecer. |
| `src/api/types.ts`, `src/api/client.ts` | DTO central, Bearer, errores y aislamiento de respuestas entre sesiones. |
| `src/components/Layout.tsx`, `src/lib/configuracion.ts` | Cache compartida, errores y reintentos de lectura existentes. |
| `specs/02-autenticacion-admin.md`, `specs/03-shell-y-navegacion.md` | Convenciones, verificacion simulada e integraciones pendientes. |

El prototipo orienta la presentacion, no el contrato.
Sus limites de nombre 2-70 y telefono 24 no se trasladan a esta implementacion.
GET y PUT no crean la configuracion cuando falta; tampoco la restauran si esta eliminada.
Las referencias historicas a inicializacion en documentos del backend no prevalecen sobre sus contratos y decisiones corregidos.

## Alcance

**Incluye:**

- Reemplazar el stub de `/configuracion` por un formulario responsive con React Hook Form y Zod.
- Consultar el DTO central `Configuracion` mediante la key compartida `['configuracion']`.
- Editar nombre, radio y telefono opcional.
- Enviar exclusivamente diferencias efectivas mediante PUT.
- Actualizar la cache con la respuesta confirmada y despues invalidarla.
- Restablecer las ediciones al ultimo DTO confirmado disponible en cache.
- Presentar carga, validacion, guardado, exito y errores sin inventar datos.
- Conservar las ediciones frente a errores o refetches durante una edicion.
- Deshabilitar Guardar cuando no existen diferencias o hay un envio en curso.
- Mostrar aviso permanente mientras haya cambios sin guardar y usar `beforeunload` para recarga/cierre, segun N1-B.
- Mostrar una nota no bloqueante para el telefono ficticio `+59100000000`.
- Pruebas unitarias y comprobaciones de navegador con respuestas simuladas.

**Fuera de alcance:**

- Corregir Home, redisenar Login o resolver la discrepancia D1 de SPEC 03.
- Crear, eliminar o restaurar la fila de configuracion.
- Cambiar backend, esquema de base, seeds, migraciones o archivos de entorno.
- Multiples empresas, roles nuevos, tarifas o asignacion de conductores.
- Llamadas, SMS, WhatsApp o validacion obligatoria de formato telefonico.
- Persistir borradores o tokens en localStorage, cookies o almacenamiento externo.
- Realtime, polling nuevo para esta pantalla o dependencias nuevas por defecto.
- Ejecutar pruebas contra el backend real o declarar cerradas INT01 e INT03.
- Migrar el router o bloquear la navegacion interna.

## Modelo de datos y contratos

No se agregan estructuras persistentes.
Se reutiliza `Configuracion` de `src/api/types.ts` sin duplicar su interfaz.

### Lectura

`GET /api/configuracion` devuelve los cinco campos del DTO: `id`, `nombreEmpresa`, `radioMaximoBusquedaKm`, `telefonoCentroAtencion` y `actualizadoEn`.
La fila consultada es siempre `id = 1`.
Un telefono `null` se presenta como input vacio.
Los placeholders del shell no son valores del formulario.
No rellenar un formulario inexistente con nombre ficticio o radio 5.

### Valores del formulario

```ts
type ValoresFormulario = {
  nombreEmpresa: string
  radioMaximoBusquedaKm: string
  telefonoCentroAtencion: string
}

type PayloadConfiguracion = Partial<Pick<Configuracion,
  'nombreEmpresa' | 'radioMaximoBusquedaKm' | 'telefonoCentroAtencion'
>>
```

El radio se mantiene como texto durante la edicion y se convierte a numero despues de validar.
Esto permite representar un input vacio sin convertirlo silenciosamente en cero.
Los tipos anteriores describen estado de UI y escritura; no son DTO de lectura duplicados.

### Escritura y validacion

`PUT /api/configuracion` requiere administrador y devuelve `200` con el DTO completo.
No usar PATCH ni esperar `204`.

| Campo | Validacion y normalizacion |
|---|---|
| `nombreEmpresa` | String recortado, entre 1 y 100 caracteres. Solo espacios es invalido. |
| `radioMaximoBusquedaKm` | Numero JSON entero entre 1 y 2147483647. Rechazar vacio, texto no numerico, cero, negativos, fracciones y valores fuera de rango. |
| `telefonoCentroAtencion` | String recortado de hasta 30 caracteres; vacio o solo espacios se convierte en `null`. No exigir E.164. |

La validacion de radio comprueba el valor numerico entero y finito; no agrega una restriccion de notacion no exigida por el contrato.
Nunca enviar `id`, `actualizadoEn`, claves desconocidas, strings como radio ni un cuerpo `{}`.
Omitir el telefono conserva su valor; enviarlo como `null` lo limpia.

Las diferencias se calculan despues de normalizar los valores editados.
La comparacion usa la base confirmada sobre la que se inicio la edicion, no una cache que pueda cambiar mientras el usuario escribe.
Si otro refetch cambia un campo que el usuario no edito, ese campo no debe incluirse accidentalmente en el PUT.
Cambios que solo agregan espacios exteriores no generan un envio cuando el valor efectivo ya coincide.

### Ejemplo de diferencias

Documentar este ejemplo con un comentario breve junto al constructor del payload en `src/lib/configuracionForm.ts`, al implementarlo:

```ts
// Base: nombre "Taxi Sur", radio 5, telefono "+59112345678".
// Edicion: nombre " Taxi Sur ", radio "8", telefono " ".
// Payload: { radioMaximoBusquedaKm: 8, telefonoCentroAtencion: null }.
// nombreEmpresa se omite: su valor normalizado no cambio.
```

Si un refetch cambia el nombre en cache mientras se edita el radio, comparar contra la base original evita enviar el nombre antiguo como si fuera una edicion del usuario.

## Comportamiento de la pantalla

### Presentacion

- Mantener paleta, tipografia y componentes locales `Button`, `Input`, `Label` y `Alert`.
- Mostrar titulo Configuracion y descripcion de los parametros de empresa y busqueda.
- Agrupar nombre y telefono en Informacion de la empresa.
- Mostrar radio en Busqueda de conductores, con unidad visual `km`.
- Incorporar el panel informativo del prototipo en escritorio sin introducir un mapa real.
- El panel informa sobre el radio guardado, no presenta una edicion pendiente como aplicada.
- Adaptar el formulario a una columna en movil y evitar desbordamientos con valores largos.
- Conservar Restablecer y Guardar cambios como acciones principales del formulario.
- Asociar labels, ayuda y errores mediante ids, `aria-describedby` y `aria-invalid`.
- Anunciar exito con `role="status"` y errores con `role="alert"`.
- Advertir que `+59100000000` es un contacto ficticio no operativo; comparar tras recortar espacios y no impedir guardar.

### Consulta compartida

Reutilizar `CLAVE_CONFIGURACION`, `retryConfiguracion` e `informacionErrorConfiguracion`.
Layout y pagina observan la misma entrada de cache; no crear otra key ni un DTO ficticio.
La pagina no debe provocar un GET adicional solo por montarse si el shell ya dispone de datos.
Una invalidacion explicita si debe reconciliar la consulta compartida.
No cambiar las opciones globales del QueryClient.

### Edicion y sincronizacion

1. Al recibir los primeros datos validos, inicializar el formulario y su base de comparacion.
2. Sin ediciones locales, incorporar nuevas lecturas confirmadas.
3. Con ediciones locales, no ejecutar un reset automatico por un refetch, aunque cambie el DTO.
4. Un refetch distinto puede actualizar la cache y el shell, pero conserva el borrador y su base original.
5. Restablecer descarta el borrador y adopta el ultimo DTO confirmado disponible en cache; no hace GET ni restaura valores de fabrica.
6. Tras un PUT exitoso, adoptar el DTO devuelto como nueva base y como valores del formulario.

El estado de cambios efectivos no depende exclusivamente de `isDirty`: debe considerar la normalizacion y el payload resultante.
Mientras se guarda, bloquear campos y acciones de envio/restablecimiento para no borrar ediciones hechas durante la peticion.
Un error de guardado conserva el borrador.

### Guardado y cache

1. Validar, construir el payload y comprobar nuevamente que no esta vacio.
2. Bloquear envios simultaneos, incluidos doble clic y Enter repetido.
3. Ejecutar la mutacion sin reintento automatico de escritura.
4. En exito vigente, impedir que un GET anterior al guardado sobrescriba el resultado confirmado.
5. Escribir el DTO de respuesta en `['configuracion']` mediante `setQueryData`.
6. Actualizar formulario/base y mostrar confirmacion del PUT.
7. Invalidar la query para reconciliar con el servidor.

La escritura de cache no es optimista: sucede despues del `200`.
Si el GET posterior falla, conservar el DTO confirmado y distinguir fallo de refresco de fallo de guardado.
`setQueryData` no garantiza que el refetch vaya a funcionar ni resuelve por si solo carreras con lecturas anteriores.
Una respuesta de una sesion anterior no puede repoblar la cache ni mostrar exito en otra sesion.
Reutilizar las protecciones del cliente y comprobar vigencia antes de efectos de mutacion cuando corresponda.

### Errores

| Caso | Comportamiento |
|---|---|
| Carga inicial pendiente | Estado de carga; sin formulario editable ni defaults inventados. |
| GET 404 | Explicar que la configuracion no fue cargada en la base; no ofrecer crearla. |
| GET 409 | Mostrar configuracion eliminada; no ofrecer restaurarla. |
| GET red/5xx | Aviso recuperable y reintento conforme al helper existente, sin peticiones simultaneas. |
| PUT 400/403 | Mostrar `ApiError.message` y conservar lo escrito. |
| PUT 404/409 | Mostrar mensaje del backend con contexto de ausencia/eliminacion; conservar borrador sin permitir insistir como si fuera un fallo transitorio. |
| PUT red/5xx | Conservar borrador y mostrar error; no reintentar la escritura automaticamente ni afirmar que no pudo persistirse si se perdio la respuesta. |
| 401 vigente | Mantener cierre de sesion y redireccion existentes; no impedirlos con la proteccion de cambios. |
| Error tardio de otra sesion | No afectar la sesion vigente ni sus avisos/cache. |

Si una lectura devuelve 404/409 aun existiendo cache anterior, no mantener un formulario guardable sobre esa configuracion invalidada.
Conservar cualquier borrador ya escrito para no perderlo silenciosamente.
No modificar los mensajes actuales del shell solo para presentar errores del PUT.

`409 CONFIGURATION_DELETED` es un escenario excepcional: la fila global fue eliminada logicamente fuera de este formulario.
No representa un conflicto de ediciones concurrentes ni un fallo transitorio.
Debe estar cubierto por mocks aunque no sea parte del flujo habitual del MVP; su recuperacion corresponde a una intervencion externa, no a este modulo.

## Decisiones confirmadas

| ID | Decision del usuario | Motivo |
|---|---|---|
| P1 | Enviar solo campos modificados. | Reducir sobrescrituras y evitar cuerpos vacios. |
| P2 | `setQueryData` con DTO devuelto y despues invalidar. | Actualizar el shell inmediatamente y reconciliar despues. |
| P3 | Restablecer vuelve a los ultimos valores guardados disponibles en cache. | Descarta borrador sin peticion adicional ni defaults de fabrica. |
| P4 | Aviso visible mientras haya cambios, `beforeunload` y Guardar deshabilitado sin cambios. | Alcance ajustado expresamente por N1-B; navegacion interna sin confirmacion. |
| P5 | Unitarios y navegador con mocks; sin backend real. | Mantener el alcance de verificacion autorizado y explicitar integraciones pendientes. |

No se elige envio del formulario completo, invalidacion como unico mecanismo de actualizacion ni persistencia de borradores.
El PUT parcial puede perder una escritura concurrente sobre el mismo campo: el backend acepta la ultima escritura y no ofrece versionado optimista.
El usuario acepta esta limitacion en el MVP como deuda tecnica post-MVP.
Actualizar campos distintos mediante PUT parcial conserva los omitidos; no afirmar que toda escritura concurrente se pierde.
Una futura proteccion por version o precondicion requeriria ampliar el contrato del backend y queda fuera de este modulo.

## Decision aprobada N1-B - Aviso de cambios

El router actual usa `BrowserRouter` y `Routes` declarativos.
La API `useBlocker` requiere un data router; no puede incorporarse directamente al arbol actual.
El usuario acepta expresamente reducir P4 a la opcion B para evitar el riesgo de migrar el router en el MVP.

| Alternativa | Resolucion |
|---|---|
| A. Migrar a data router para bloquear navegacion interna | Descartada para este MVP por riesgo de regresion en autenticacion y shell. |
| B. Aviso visible y `beforeunload`, sin migracion | Aprobada. La navegacion interna, incluido el menu lateral, pierde el borrador sin confirmacion. Limitacion aceptada como deuda tecnica post-MVP. |

Mostrar permanentemente "Tienes cambios sin guardar" mientras existan cambios efectivos; retirarlo al guardar correctamente o restablecer sin diferencias.
Registrar el listener `beforeunload` solo mientras haya cambios y retirarlo al limpiar el formulario o desmontar la pagina.
La proteccion completa de navegacion interna queda diferida al post-MVP, sin prometer cobertura porcentual de casos.
No interceptar enlaces globalmente ni parchear el historial como sustituto fragil de un bloqueo soportado.
Cerrar sesion y una expulsion por 401 no deben quedar bloqueados por conservar el formulario.
El navegador controla el texto y la disponibilidad del aviso nativo de `beforeunload`.
N1 queda resuelta; verificar el comportamiento reducido aprobado, no un bloqueo de navegacion interna inexistente.

## Archivos previstos

| Archivo | Cambio |
|---|---|
| `specs/04-configuracion-empresa.md` | Esta especificacion; decisiones, criterios y evidencia futura. |
| `src/pages/Configuracion.tsx` | Formulario, lectura, mutacion, estados y accesibilidad. |
| `src/lib/configuracionForm.ts` | Esquema Zod, conversion DTO/formulario y construccion de diferencias testeables. |
| `src/lib/configuracionForm.test.ts` | Pruebas unitarias de reglas, normalizacion y payload. |
| `src/lib/configuracion.test.ts` | Ampliar solo si hace falta cubrir cache compartida y carreras de lectura/escritura. |
| `../docs/ROADMAP_FRONTEND.md` | Actualizar exclusivamente el estado del modulo 4 cuando exista evidencia. |

Reutilizar contratos, cliente HTTP, helpers y UI sin modificaciones innecesarias.
No agregar helpers triviales de un solo uso si una expresion local es suficiente.
Los archivos de router/providers quedan fuera del alcance por N1-B.
No cambiar `.spec-config.yml`, que ya existe.

## Plan de implementacion

1. Comprobar el estado del workspace y los contratos existentes antes de aplicar la spec aprobada con N1-B.
2. Incorporar esquema y conversiones puras junto con pruebas de limites, recorte, nulidad y diferencias; mantener el stub funcionando mientras se agrega la logica.
3. Reemplazar el stub por lectura y formulario responsive usando la cache compartida, con carga/errores y Restablecer; verificar que refetch no destruya un borrador.
4. Conectar PUT parcial, bloqueo de duplicados y preservacion del borrador ante fallos; verificar cuerpo exacto mediante mocks.
5. Conectar respuesta confirmada, actualizacion de cache e invalidacion; verificar header y carreras con GET anteriores o cambio de sesion.
6. Implementar aviso permanente y `beforeunload` segun N1-B; comprobar descarte sin confirmacion al navegar internamente y ausencia de bloqueo de logout/401.
7. Incorporar nota de telefono ficticio, anuncios accesibles y ajustes responsive; registrar evidencia por criterio y actualizar el estado documental sin presentar mocks como integracion real.

Las pruebas acompanian cada incremento.
El primer incremento ejecutable agrega logica validada sin romper la pantalla existente; el ultimo cierra presentacion y evidencia del alcance autorizado.

## Criterios de aceptacion

- [x] N1-B expresamente aprobada por el usuario y alcance documental actualizado; no acredita implementacion.
- [x] La pagina carga los cinco campos del DTO compartido sin crear una consulta con otra key ni enviar un GET adicional solo por montar con cache disponible.
- [x] Nombre y telefono respetan limites despues de recortar espacios; un nombre de solo espacios no puede guardarse.
- [x] Radio vacio, no numerico, cero, negativo, fraccionario o mayor que 2147483647 se rechaza; 1 y 2147483647 se aceptan.
- [x] PUT envia el radio como numero JSON y solo campos efectivamente modificados.
- [x] Limpiar un telefono existente envia `null`; no editarlo omite la clave.
- [x] No se envia `{}`, `id`, fechas ni claves desconocidas, incluso mediante Enter o submit repetido.
- [x] Guardar esta deshabilitado sin cambios efectivos y durante envio; no se producen mutaciones simultaneas.
- [x] Restablecer descarta las ediciones y usa el ultimo DTO confirmado en cache sin peticion adicional ni defaults.
- [x] Un refetch con valores iguales o distintos no borra un borrador; un campo no editado no se envia por cambios externos de cache.
- [x] Un PUT exitoso actualiza nombre del shell y formulario con el DTO devuelto, e invalida la query compartida.
- [x] Un GET iniciado antes del PUT no revierte el resultado confirmado al completarse tarde.
- [x] Si falla la lectura posterior al guardado, se conserva el DTO confirmado y no se comunica falsamente un fallo del PUT.
- [x] Errores de escritura conservan el borrador y muestran los mensajes aplicables; no hay retry automatico del PUT.
- [x] 404/409 no inventan configuracion, no ofrecen crear/restaurar y no dejan guardar sobre una fila ausente/eliminada.
- [x] 401 vigente mantiene logout; respuestas tardias de otra sesion no afectan cache, avisos ni acceso de la nueva.
- [x] "Tienes cambios sin guardar" permanece visible mientras existan diferencias efectivas y desaparece al guardar/restablecer sin diferencias.
- [x] `beforeunload` se registra solo con cambios pendientes y se retira al limpiar el formulario o desmontar; se comprueba el aviso nativo donde el navegador lo permita.
- [x] La navegacion interna descarta el borrador sin confirmacion; logout y 401 no quedan bloqueados; no se modifica el router.
- [x] El constructor del payload incluye el ejemplo breve de diferencias documentado en esta spec.
- [x] Telefono ficticio muestra una nota no bloqueante; vacio sigue permitido.
- [x] Labels, ayuda, errores y confirmacion son accesibles por teclado y tecnologia asistiva.
- [x] Escritorio y movil, incluido ancho de 320 px y zoom 200%, no presentan scroll horizontal ni acciones inaccesibles.
- [x] `npm run test:unit` y `npm run build` terminan correctamente y se registra evidencia nueva.
- [x] La verificacion de navegador con mocks cubre carga, exito, errores, telefono null, Restablecer, doble envio y actualizacion del shell.
- [x] El roadmap refleja solo el progreso acreditado; no declara verificacion contra backend real.
- [ ] INT04, pendiente fuera de esta ejecucion: verificar GET/PUT autenticados y persistencia con una cuenta y un entorno autorizados antes de declarar cierre de integracion real.

### Evidencia de verificacion

Verificacion directa con Vite en `localhost:5174` y `VITE_API_BASE_URL=http://localhost:3001`. **Todas**
las llamadas (`POST /api/auth/admin/login`, `GET /api/dashboard/indicadores`, `GET|PUT /api/configuracion`)
se interceptaron con `page.route`; no hubo ninguna peticion real al backend. Criterio = numero de
lista del bloque anterior. Sin contrasenas, tokens ni datos personales.

| # | Evidencia |
|---|---|
| 2 | Codigo: `src/lib/configuracion.ts:9` (clave unica `['configuracion']`), `src/pages/Configuracion.tsx:116-120` (`refetchOnMount: false`). Navegador: login + Inicio + entrada a `/configuracion` generaron **un solo** `GET /api/configuracion`; los tres campos se llenaron con los valores del DTO y montar de nuevo la pantalla no produjo ningun `GET` adicional. |
| 3 | `src/lib/configuracionForm.ts:91` (comparacion contra la base tras `trim`). Navegador: `"   "` deja Guardar deshabilitado y 0 PUT; 101 caracteres tras recortar muestra `role="alert"` y 0 PUT. |
| 4 | `src/lib/configuracionForm.ts:33-75` (`NUMERO_JSON`, `RADIO_MIN`, `RADIO_MAX`). Navegador: `""`, `abc`, `0`, `-1`, `2.5`, `2147483648` → alerta, 0 PUT; `1` y `2147483647` → PUT valido. |
| 5 | `src/lib/configuracionForm.ts:91-110`. Navegador: cuerpos exactos `{"radioMaximoBusquedaKm":9}` (numero JSON, no string) y `{"nombreEmpresa":"Radio Central"}` en pruebas aisladas. |
| 6 | `src/lib/configuracionForm.ts:91-110`. Navegador: vaciar un telefono existente → `{"telefonoCentroAtencion":null}`; sin tocar el telefono la clave no aparece. |
| 7 | `src/pages/Configuracion.tsx:146` (`payload === null` sin diferencias), `:467`, `:474`. Navegador: doble clic seguido de Enter repetido → **un** PUT, con `Authorization: Bearer <token>`. Nunca aparecieron `id` ni fechas. |
| 8 | `src/pages/Configuracion.tsx:150,157,467,474,323`. Navegador: con `PUT` diferido 1.2 s → `Guardando…` deshabilitado, Restablecer deshabilitado, los tres campos `:disabled` y `aria-busy="true"`; al terminar, 1 solo PUT registrado. |
| 9 | `src/lib/configuracionForm.ts:77`. Navegador: tras editar dos campos, Restablecer restauró el DTO de cache y el contador de `GET` no cambio. |
| 10 | `src/pages/Configuracion.tsx:176-180` (`adoptar` solo si `!cambios`). Navegador: un `GET` con DTO externo (`Empresa Externa`, radio 12) mientras el borrador tenia radio 9 conservo el borrador y el `PUT` fue `{"radioMaximoBusquedaKm":9}`; tras confirmar, el formulario adopto el DTO completo. |
| 11 | `src/pages/Configuracion.tsx:231-236`. Navegador: tras cada `PUT` el shell adopto el nombre y hubo exactamente 1 `GET` de invalidacion. |
| 12 | `src/pages/Configuracion.tsx:231-232` (`cancelQueries` antes de publicar). Navegador: `PUT {"nombreEmpresa":"Nombre Uno"}` dejo un `GET` retenido con `radio=5`; un segundo `PUT {"radioMaximoBusquedaKm":44}` se confirmo y **despues** se libero ese `GET` antiguo → la vista siguio mostrando `radio=44`, sin revertir. |
| 13 | `src/pages/Configuracion.tsx:157-158`, `:161`. Navegador: con todos los `GET` posteriores al `PUT` en `500`, el shell y el formulario conservaron "Nombre Confirmado", se mostro "Cambios guardados." mas "Los cambios se guardaron; solo fallo la actualizacion de la informacion." y un boton Reintentar; la secuencia fue `PUT`, `GET`, `GET` (invalidacion + un reintento de `retryConfiguracion`). No aparecio ningun mensaje de fallo del `PUT`. |
| 14 | `src/pages/Configuracion.tsx:210-229`. Navegador: `PUT` en `400`, `403`, `500` y red → el borrador permanece editable, aparece el mensaje del backend y **un** unico `PUT` por intento, sin reintento. Con error de red el texto indica resultado incierto, no ausencia de persistencia. |
| 15 | `src/lib/configuracion.ts:56-79`, `src/pages/Configuracion.tsx:157` (`lecturaNoEditable`). Navegador: `GET` en `404` y `409` → sin formulario, sin opcion de crear/restaurar, Guardar y Restablecer deshabilitados. Con `404` y cache previa el formulario y el borrador se conservan pero Guardar queda deshabilitado con mensaje contextual. |
| 16 | `src/api/token.ts:2-14` (revision de sesion), `src/pages/Configuracion.tsx:205,229,238`. Navegador: `401` en `PUT` → logout a `/login`. Con un `PUT` de la sesion A diferido 1.5 s y logout + login B en medio, la sesion B mostro "Empresa B"/`radio 77` sin exito, sin alertas y sin datos de A. |
| 17 | `src/pages/Configuracion.tsx:29,150,273`. Navegador: el aviso "Tienes cambios sin guardar" aparecio al editar, desaparecio tras guardar y tras Restablecer. |
| 18 | `src/pages/Configuracion.tsx:186-195,208`. Navegador: `beforeunload` con `defaultPrevented === false` sin cambios, `true` con borrador, `false` tras Restablecer y `false` ya desmontada la pagina (navegacion a `/tarifas`). Con el aviso presente, la recarga quedo detenida por el dialogo nativo `beforeunload`. |
| 19 | `src/pages/Configuracion.tsx:187`, `src/router.tsx` sin cambios en `git status`. Navegador: menu lateral, atras/adelante y "Cerrar sesion" navegaron sin confirmacion y descartaron el borrador. |
| 20 | `src/lib/configuracionForm.ts:87-90` incluye el ejemplo de diferencias documentado. Unitario: `src/lib/configuracionForm.test.ts`. |
| 21 | `src/lib/configuracionForm.ts:23`, `src/pages/Configuracion.tsx:368-383`. Navegador: con `+59100000000` aparece "Contacto ficticio." como nota no bloqueante y el guardado funciona. |
| 22 | `src/pages/Configuracion.tsx:337-338,365-366,418-419` (`aria-invalid` + `aria-describedby`), `:348,390,435` (`role="alert"`), `:446` (`role="status"`), `src/components/ui/alert.tsx`. Navegador: los errores se anuncian, el foco recorre nombre → telefono → radio → Guardar → Restablecer y el exito aparece como `role="status"` "Cambios guardados.". |
| 23 | Navegador: sin scroll horizontal a 1280 px, 320 px ni 640 px (320 px = 200 % de zoom sobre el diseno de escritorio); los botones miden 44 px de alto y un nombre de 100 caracteres no desborda su contenedor. |
| 24 | `npm run test:unit` → `4 passed / 178 passed`. `npm run build` → `tsc -b && vite build` correcto, `176 modules transformed`. |
| 25 | Todas las filas anteriores: carga, exito, errores por codigo, `null` del telefono, Restablecer, doble envio, actualizacion del shell, carrera de `GET`, sesion A/B y navegacion N1-B. |
| 26 | `docs/ROADMAP_FRONTEND.md:252-268` describe el Módulo 4 como implementado y verificado **con mocks** y mantiene INT04 pendiente; `:730-732` mantiene `[~]`. |

**Estado:** los 25 criterios funcionales estan acreditar con mocks. INT04 sigue pendiente y
`[ ]`: no se ejecuto ninguna peticion real, seed, migracion ni usuario de prueba.

## Estrategia de verificacion

Reutilizar Vitest existente sin instalar infraestructura adicional por defecto.
Los unitarios deben ejecutar la logica real de esquema/payload y probar cache/cliente cuando corresponda.
Los tests de helpers no acreditan por si solos el comportamiento de React, foco o navegacion.
Esos casos se verifican en navegador con todas las llamadas API interceptadas antes de navegar, incluidas Login, configuracion e indicadores si se visita Inicio.

| Grupo | Casos |
|---|---|
| Validacion | Limites 1/100 del nombre, telefono vacio/30/31, radio valido y todas las clases invalidas, strings con espacios. |
| Payload | Cada campo aislado, varios campos, sin cambios, telefono null, normalizacion, omision de propiedades ajenas. |
| Formulario | Carga inicial, edicion, Restablecer, exito, error, refetch durante borrador, bloqueo mientras guarda. |
| Cache y sesion | Shell actualizado, invalidacion, fallo del GET posterior, GET tardio, logout y sesion A/B durante PUT. |
| Errores | GET/PUT 400, 401, 403, 404, 409, 500 y red segun aplique. |
| Navegacion | N1-B: aviso permanente, descarte por menu/atras/adelante sin confirmacion, beforeunload y limpieza de listener, recarga y salida de sesion. |
| Presentacion | Desktop/movil, zoom, longitudes maximas, ayudas, anuncios y telefono ficticio. |

No ejecutar peticiones reales, seeds, migraciones ni crear usuarios para desbloquear integracion.
No registrar contrasenas, tokens ni datos personales en evidencia.
INT01 e INT03 conservan su estado pendiente y no se cierran por ejecutar este modulo con mocks.
INT04 registra especificamente la futura integracion del formulario GET/PUT y su persistencia.

## Riesgos

| Riesgo | Mitigacion |
|---|---|
| Navegacion interna descarte ediciones sin confirmacion. | Aviso permanente; limitacion N1-B aceptada como deuda tecnica post-MVP, sin migracion de router. |
| Refetch borre ediciones o genere diferencias artificiales. | Base estable durante el borrador y reset solo en momentos definidos. |
| GET tardio revierta el DTO confirmado. | Cancelacion logica de lecturas previas y prueba de carrera antes de publicar cache. |
| Respuesta de PUT llegue tras logout. | Aislamiento por sesion y ausencia de efectos tardios sobre la nueva cache. |
| Otro administrador cambie el mismo campo. | PUT parcial reduce alcance; documentar ultima escritura sin prometer control de versiones inexistente. |
| Fallo de red deje resultado de escritura incierto. | No retry automatico ni mensaje que garantice ausencia de persistencia. |
| Fila ausente o eliminada impida guardar. | Estados explicitos, sin inicializacion ni restauracion desde el frontend. |

## Que NO forma parte de esta especificacion

No se implementan otros modulos, integraciones reales, cambios de backend, persistencia de sesion ni administracion de la fila inicial.
Esta revision solo marca resuelta la decision documental N1-B; no acredita criterios funcionales ni autoriza una migracion de router.
