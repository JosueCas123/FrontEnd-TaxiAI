# SPEC 03 - Shell y navegacion

> **Estado:** Aprobado
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`) y SPEC 02 (`02-autenticacion-admin.md`, INT01 pendiente).
> **Fecha:** 2026-09-28
> **Objetivo:** Completar el shell administrativo responsive con shadcn/ui, nombre de empresa desde configuracion y navegacion protegida reutilizando la sesion existente.

## Contexto y fuentes

El borrador inicial se creo para revision directa con aclaraciones pendientes.
Esta actualizacion incorpora shadcn/ui y P1-P3 confirmadas, incluida la ultima correccion de P1: nombreEmpresa dinamico tambien en la barra lateral.
La solicitud inicial autorizaba solo documentacion. La solicitud vigente de la entrega minima autorizaba ajustes sobre la implementacion existente sin marcar casillas ni ejecutar spec-verify; despues de esa entrega se ejecuto spec-verify el 2026-09-29 y su evidencia esta registrada al final. INT03 e INT01 siguen pendientes.
La fecha del encabezado se comprobo al crear el borrador con `Get-Date -Format yyyy-MM-dd`.
En la investigacion documental se cargaron spec y context7-mcp y se reviso la plantilla; esta actualizacion vuelve a cargar spec.
Se incorpora la lectura estatica autorizada del backend realizada por el agente explore, diferenciandola de pruebas ejecutadas.

Las rutas parten de `frontEnd/`.
Las fuentes de la investigacion anterior se complementaron con relectura del roadmap, Layout, router, AuthContext, package.json, components.json y componentes UI actuales.

| Fuente | Alcance o evidencia |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:98-123` | Modulo 3 exacto: GET configuracion, nombre dinamico, navegacion responsive y logout existente. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:72-75,110-116` | Header con empresa; seis secciones; sin roles administrativos multiples. |
| `references/pantallas/index.html:10-19` y `references/pantallas/app.js:74-88` | Prototipo efectivo del shell; no copiar sus datos, contadores ni mensajes demo. |
| `src/index.css:3-19` | Paleta TaxiSur y tipografia Segoe UI existentes. |
| `specs/01-fundacion-y-contratos.md:40-45,156-177,297-303` | DTO Configuracion y evidencia historica del contrato backend autenticado. |
| `specs/02-autenticacion-admin.md:231-265,566-571` | Router declarativo, aislamiento de sesiones y pendiente INT01. |
| `../docs/ARQUITECTURA.md:19-26,58-69` | Backend como fuente de verdad; single-tenant; sin roles avanzados. |
| `../docs/REGLAS_DE_NEGOCIO.md:3-4,44-50` | Reglas operativas ejecutadas en backend; ninguna regla directa nueva en este modulo. |
| `../docs/MODELO_DE_DATOS.md:26-56` | Configuracion unica y usuarios admin/conductor; persistencia no equivalente al DTO. |

La lectura backend fue autorizada y realizada solo de forma estatica.
El backend vive en el directorio hermano `../backend/` del frontend (`frontEnd/`), no en el placeholder del mensaje inicial.
Las referencias siguientes documentan codigo y aserciones inspeccionados, no resultados de ejecucion.

| Fuente backend actual, relativa a `../backend/` | Hallazgo estatico |
|---|---|
| `src/app.ts:24`, `src/modules/configuracion/configuracion.router.ts:5-15` | Montaje `/api/configuracion`; GET usa requireAuthLazy/requireAuth y PUT requireAdminLazy. |
| `src/middlewares/auth.ts:30-96,127-147` | requireAuth admite JWT de usuario existente no eliminado, sin filtro de rol, o X-N8N-Token; requireAdmin exige JWT admin. |
| `src/modules/configuracion/configuracion.schema.ts:17-25` | DTO strict con cinco campos obligatorios; telefono nullable, radio entero y fecha declarada string. |
| `src/modules/configuracion/configuracion.controller.ts:5-38` | DTO directo, fecha mediante toISOString; ausencia produce 404 NOT_FOUND y fila eliminada 409 CONFIGURATION_DELETED. |
| `src/modules/configuracion/configuracion.service.ts:13-26` | GET solo ejecuta findUnique de id 1; no crea defaults ni maneja P2002. Ausencia y eliminacion se devuelven como errores. |
| `prisma/schema.prisma:18-27` | id Int y actualizadoEn DateTime con @updatedAt. |
| `tests/configuracion.test.ts:135-164,222-289,354-367,430-498,537-550` | Referencia historica de la investigacion inicial, con aserciones de creacion/idempotencia del contrato anterior; no acredita el contrato actual ni pruebas ejecutadas. |
| `tests/auth-middleware.test.ts:104-123` | Aserciones que distinguen requireAuth y requireAdmin; no ejecutadas. |

No se ejecuto GET. La investigacion inicial lo evito por la creacion implicita entonces descrita; la relectura actual confirma que GET no crea la fila.
Tampoco se ejecutaron las suites backend; su preparacion/limpieza en `tests/configuracion.test.ts:183-220` escribe datos.
La inspeccion no acredita estado de base de datos, despliegue, CORS ni INT01/INT03.
No se leyeron secretos ni archivos de entorno.

## Estado observado en la investigacion inicial

Este inventario es historico, anterior al shell existente. Los ajustes actuales y dependencias se registran al final, sin acreditar comportamiento en ejecucion.

- `src/api/types.ts:14-20` ya exporta Configuracion; no se requiere otro DTO.
- `src/components/Layout.tsx:32,85` contiene TaxiSur fijo; el header de escritorio no muestra empresa.
- `Layout.tsx:36-50` ya usa NavLink y coincidencia exacta para Inicio.
- El menu movil tiene overlay, pero no cierre al navegar, Escape ni gestion explicita del foco.
- `src/router.tsx:13-30` ya agrupa todas las rutas privadas bajo ProtectedLayout.
- Layout conserva un guard adicional; no eliminarlo como refactor incidental.
- AuthContext ya cancela consultas, limpia cache y solo consume 401 de la sesion vigente.
- El cliente HTTP ya adjunta Bearer y rechaza exitos tardios de sesiones retiradas.
- `src/App.tsx` ya contiene un QueryClient compartido con retry 1 y refetchOnWindowFocus false.
- `components.json` usa new-york, slate, cssVariables false y alias relativos.
- Solo existen `ui/button.tsx`, `input.tsx`, `label.tsx` y `alert.tsx`; no existen Sidebar ni Sheet locales.
- Button es una adaptacion nativa sin Slot/asChild ni size; no equivale a la API completa del registro shadcn/ui.
- La utilidad cn existente es reducida; no asumir compatibilidad con argumentos de clsx ni fusion de clases.
- Home conserva un contrato local incorrecto y las pantallas de negocio siguen provisionales; no se corrigen aqui.

Versiones instaladas comprobadas en la investigacion previa: React/React DOM 19.3.0, React Router DOM 7.18.4 y TanStack Query 5.102.8.
package.json conserva los rangos declarados y Vitest 4.1.11; no se actualizaron dependencias.

## Alcance

**Incluido:**

- Consumir GET `/api/configuracion` desde Layout con el cliente y DTO existentes.
- Mostrar el mismo nombreEmpresa recibido en barra lateral y header de escritorio/movil, sin marca textual TaxiSur fija en el shell.
- Sin ultimo nombre valido de la sesion, usar `TaxiSurRioAbajo` en barra lateral y `Panel administrativo` en header, sin bloquear Outlet ni navegacion.
- Mantener una consulta compartida con key `['configuracion']`.
- Adaptar exclusivamente el shell a shadcn/ui, conservando identidad visual y rutas actuales.
- Mantener Inicio, Conductores, Mapa, Solicitudes, Tarifas y Configuracion, con logout disponible.
- Completar estados activos, menu movil, teclado, foco y lectura accesible del shell.
- Reutilizar ProtectedLayout, AuthContext y manejo de errores/sesion, verificando su regresion.
- Conservar el ultimo nombre valido de la sesion ante fallos; mostrar aviso discreto y Reintentar para red/5xx conforme a P2.
- Configurar retry local de esta consulta para no reintentar errores no recuperables, sin alterar retry global ni autenticacion.

**Fuera del alcance:**

- Formulario o PUT de configuracion; corresponden al modulo 4.
- Funcionalidades, rediseno o correcciones de Home y modulos 5-10.
- Contadores nuevos, consultas adicionales por seccion, perfiles ficticios o datos demo.
- RBAC frontend, nuevos roles, `/me`, guards por pagina o decodificacion JWT para autorizar.
- Migrar React Router a Data/Framework Mode, agregar middleware o sustituir autenticacion.
- Persistir sesion, refresh tokens, temporizadores de expiracion, revocacion o recuperacion de clave.
- Realtime, polling de configuracion, multiempresa, modo oscuro, fuentes externas y plantillas completas.
- Modificar backend, base de datos, entorno, roadmaps o infraestructura de agentes.

## Modelo de datos y consulta compartida

No se introducen entidades ni estructuras persistidas; se reutiliza Configuracion de SPEC 01.

| Campo | Tipo de transporte |
|---|---|
| id | number; Prisma Int, servicio opera con 1, DTO no exige el literal 1 |
| nombreEmpresa | string |
| radioMaximoBusquedaKm | number entero |
| telefonoCentroAtencion | string o null; propiedad obligatoria, no opcional |
| actualizadoEn | string; controlador serializa UTC ISO 8601 mediante toISOString |

GET `/api/configuracion` devuelve el objeto directo, no un envoltorio data.
El backend consulta la fila id 1 sin inicializarla: si no existe responde 404 NOT_FOUND. El frontend no envia una mutacion para crearla.
Usar la ruta completa con `/api` segun la convencion actual del cliente; no duplicar el prefijo al configurar la base URL.
Los cinco campos son obligatorios en el schema strict inspeccionado; actualizadoEn se valida alli como z.string, no como formato ISO.
La serializacion ISO esta acreditada por el controlador, no por esa validacion de string.
`nombreEmpresa` no tiene garantia de contenido en la lectura: el schema de escritura aplica `z.string().trim().min(1).max(100)` (`configuracion.schema.ts:5`), mientras el DTO de salida solo valida `z.string()` (`configuracion.schema.ts:19`). `ROADMAP_FRONTEND.md:139` confirma el recorte 1-100 como regla de guardado.
Por esa asimetria, el shell debe tratar defensivamente un nombre vacio o compuesto solo por espacios, aunque el PUT no pueda producirlo: una fila escrita por seed, migracion o SQL directo si podria entregarla.
El contrato y autenticacion tienen evidencia estatica actual, ademas de la historica de SPEC 01; no se han verificado contra una instancia real.
`ROADMAP_ENDPOINTS.md:17-22` remite a una spec antigua; no inferir que GET sea publico.

La investigacion inicial describia defaults (id 1, nombreEmpresa `TaxiSur - Pruebas`, radio 5 y telefono `+59100000000`) y create con recuperacion P2002. Esa descripcion es historica y ya no corresponde al servicio actual.
El GET actual solo usa findUnique; no siembra valores, restaura filas ni resuelve carreras de creacion.
Los fallbacks de interfaz no representan datos persistidos ni inicializan la base.
Si la respuesta real contiene `TaxiSur - Pruebas`, mostrar ese texto tal cual en ambos lugares, no sustituirlo por TaxiSurRioAbajo ni Panel administrativo.

Nota sobre el fallback lateral `TaxiSurRioAbajo`: corresponde al cliente actual del MVP (Radio Taxi Sur Rio Abajo) y se usa unicamente como marcador visual mientras no exista un nombre previo valido en la sesion. En un escenario multiempresa futuro deberia ser configurable o eliminarse en favor de un marcador generico como el del header (`Panel administrativo`). Mientras el MVP sea single-tenant, el valor fijo es aceptable. El nombre del cliente consta por confirmacion del responsable del proyecto, no en `../docs/`.
Una fila eliminada produce 409 con `{ error: { code: 'CONFIGURATION_DELETED', message: 'Configuracion eliminada' } }`.
Una fila ausente produce 404 con `{ error: { code: 'NOT_FOUND', message: 'Configuracion no encontrada' } }`; el shell avisa que la configuracion no fue cargada, sin retry ni logout.
No crear, restaurar ni editar configuracion desde el shell para resolver ese error.

Un nombre se considera valido solo si, tras recortar espacios en sus extremos, no queda vacio.
Si existe un nombre previo valido de la sesion, un nombre vacio o solo espacios se trata igual que un fallo de red: se conserva el previo y no se degrada la presentacion.
Si no existe nombre previo valido, se aplican los fallbacks diferenciados, igual que en carga inicial.
El recorte no altera el DTO almacenado en cache; el shell guarda el valor completo del servidor.
La consulta usa la sintaxis de objeto de TanStack Query v5: queryKey y queryFn.
La funcion consulta mediante `http.get<Configuracion>`; no crear otro fetch, QueryClient, contexto o store para estos datos.
Almacenar el DTO completo en cache, no solo nombreEmpresa, para permitir reutilizacion en el modulo 4.
No copiar los datos a useState ni fabricar un DTO con valores de placeholder.
No colocar useQuery despues del retorno condicional actual de Layout; respetar el orden de hooks y evitar peticiones sin sesion.

Una misma key comparte cache, pero no garantiza una unica peticion durante toda la sesion.
Mantener Layout montado al cambiar sus rutas hijas evita consultas independientes por pagina.
Conservar las opciones existentes salvo el override local de retry; sin polling ni cambios globales de staleTime/retry.
El retry global 1 no debe aplicarse indiscriminadamente a esta consulta.
La politica local permite como maximo un reintento automatico para fallo de red o HTTP 5xx; para 401, 403, 409 y otros errores no recuperables devuelve false.
Errores de parseo/contrato y AbortError de una sesion retirada no disparan reintentos automaticos.
No agregar efectos o temporizadores que vuelvan a consultar en bucle ante 403/409.
El boton Reintentar solo se ofrece para red/5xx, ejecuta refetch y queda deshabilitado mientras hay peticion en curso.
Usar ApiError.status y message existentes; no ampliar el cliente para exponer code solo por el 409 de este GET.
Reconexion, reintento e invalidacion pueden producir nuevas peticiones legitimas.
El modulo 4 podra invalidar `['configuracion']` al guardar; no implementar ahora ese formulario.

| Estado | Presentacion prevista |
|---|---|
| Carga inicial sin nombre previo | Lateral TaxiSurRioAbajo y header Panel administrativo; enlaces y contenido disponibles. |
| Exito | Mismo nombreEmpresa en lateral y header, como texto sin HTML interpretado; respetar tambien TaxiSur - Pruebas. |
| Nombre vacio o solo espacios, con nombre previo valido | Conservar el nombre previo; no degradar la presentacion ni mostrar un vacio. |
| Nombre vacio o solo espacios, sin nombre previo | Lateral TaxiSurRioAbajo y header Panel administrativo, sin romper el layout. |
| Refetch con datos previos | Mantener el ultimo nombre valido de la sesion en ambos lugares. |
| Red/5xx | Mantener nombre previo o fallbacks diferenciados si no hay datos; aviso discreto y Reintentar, sin bloquear navegacion. |
| 403 | Mostrar permiso denegado y conservar nombre previo o fallbacks; sin logout, reintento automatico ni boton de recuperacion red/5xx. |
| 404 NOT_FOUND | Avisar que la configuracion no fue cargada; conservar nombre previo o fallbacks, sin retry, mutacion ni logout. |
| 409 CONFIGURATION_DELETED | Mostrar Configuracion eliminada; conservar nombre previo o fallbacks, sin retry automatico, mutacion de recuperacion ni logout. |
| Otros fallos no recuperables | Aviso seguro y nombre previo o fallbacks; sin bucle de retry ni cambios de autenticacion. |
| 401 de sesion vigente | Dejar actuar al cliente/AuthContext; volver a login y limpiar cache. |
| Respuesta tardia de sesion anterior | No restituir nombre anterior ni invalidar una sesion nueva. |

## Diseno responsive y accesibilidad

shadcn/ui esta confirmado como base visual; la composicion siguiente concreta el plan de implementacion futura.
Preservar amarillo TaxiSur, azul oscuro, superficies actuales y Segoe UI.
Tomar la organizacion del prototipo sin exigir replica pixel a pixel ni importar su CSS global.
Propuesta: iconos discretos, separacion visual de secciones y encabezado empresa/seccion, sin contadores ni identidad personal inventada.
P1 elimina la propuesta anterior de marca textual TaxiSur fija en el shell.
Barra lateral y header consumen el mismo nombreEmpresa; solo difieren sus fallbacks sin nombre valido de la sesion.
Mantener la identidad cromatica e iconografica no autoriza sustituir un nombre real del servidor.

### Adaptacion shadcn/ui propuesta

- Incorporar una composicion local minima de SidebarProvider, Sidebar, SidebarTrigger y elementos de menu necesarios.
- Usar la familia Radix documentada para asChild; no mezclar ejemplos de Base UI o React Aria con esa API.
- Componer SidebarMenuButton con enlaces reales de React Router mediante asChild, sin anidar botones y enlaces interactivos.
- Derivar isActive de la coincidencia de ruta, no de un segundo estado de seleccion; conservar aria-current de NavLink.
- Usar useSidebar dentro de su provider y setOpenMobile(false) al navegar; contemplar tambien atras/adelante.
- No mantener menuAbierto como segundo estado independiente del estado movil del Sidebar.
- Mantener sidebar visible en escritorio y panel modal en movil; no agregar modo compacto de iconos ni control de colapso de escritorio.
- Alinear el breakpoint CSS y el detector movil con el lg actual; no copiar md del registro sin adaptacion.
- No usar collapsible="none" como atajo sin revisar su efecto: la implementacion consultada evita con ello la rama movil Sheet.
- Retirar la escritura de cookie sidebar_state y el atajo global del ejemplo; no se solicita persistencia ni un atajo nuevo.
- Adaptar SidebarTrigger al Button reducido o ampliar solo lo necesario, con regresion de Login; no asumir que size="icon" funciona hoy.
- Incorporar Sheet y primitivas indispensables solo si la composicion las necesita; no instalar todo el catalogo.
- Registrar dependencias y versiones realmente agregadas durante la futura implementacion; no inventarlas en este borrador.

Conservar components.json y sus alias relativos salvo necesidad concreta documentada.
No ejecutar init para sobrescribir el tema ni cambiar cssVariables false por conveniencia.
Mapear los tokens de sidebar necesarios al tema TaxiSur, preferiblemente acotados al shell.
Si se ajustan Button, cn o CSS compartidos, verificar que Login conserve apariencia y comportamiento.
La compatibilidad exacta de los archivos del registro requiere revision al implementarlos; la consulta documental no equivale a compilacion.

### Comportamiento verificable

- Desde lg: sidebar visible, navegacion y logout alcanzables incluso con viewport bajo.
- Debajo de lg: activador con nombre en espanol, aria-expanded y referencia al panel cuando corresponda.
- Panel abierto: foco dentro del menu y fondo no interactuable; Escape, overlay y control de cierre lo cierran.
- Al cerrar sin navegar: devolver foco al activador; al navegar: cerrar panel y llevar foco a un destino visible coherente con el contenido.
- Panel cerrado: sus controles no permanecen en el recorrido de Tab ni expuestos como contenido visible al lector.
- Incluir titulo accesible para el panel, nav identificado y un unico main con opcion de saltar al contenido.
- No crear main anidados al usar SidebarInset, cuyo elemento por defecto es main.
- Estado activo con semantica y contraste, no solo color; Inicio exacto y Conductores activo en `/conductores/:id`.
- Foco visible, botones operables con Enter/Space y enlaces con Enter; areas tactiles de al menos 44 px para controles principales.
- Nombre de hasta 100 caracteres, con y sin espacios, no desborda ni desplaza controles fuera del viewport.
- Si se trunca el nombre, su contenido completo sigue siendo accesible sin depender solo de hover.
- Respetar movimiento reducido y permitir scroll vertical; no superponer logout sobre enlaces.

Matriz visual propuesta: 1365x900, 768x1024, 390x844 y 320x844; zoom nativo 200% y vista de poca altura.
Comprobar tambien ambos lados del breakpoint lg y cambio de tamano con menu abierto.

## Proteccion de rutas y sesion

Reutilizar BrowserRouter, Routes, ProtectedLayout y Outlet sin migracion.
Permanecen privadas `/`, `/conductores`, `/conductores/:id`, `/mapa`, `/solicitudes`, `/tarifas` y `/configuracion`.
Sin sesion, ProtectedLayout devuelve Navigate a `/login` con replace antes de montar Layout y sus consultas.
El guard adicional de Layout se conserva sin agregar nuevos guards.
Login sigue redirigiendo a `/` con sesion; no agregar retorno a la ruta originalmente solicitada.
La ruta desconocida conserva su redireccion actual a `/` y el guard correspondiente.

Cerrar sesion invoca cerrarSesion existente; no duplicar limpieza ni agregar un endpoint de logout.
Se conservan cancelacion de consultas, clear de cache y correlacion por identidad de sesion.
No introducir una limpieza asincrona tardia que borre datos del siguiente acceso.
El token sigue solo en memoria; recargar una ruta protegida lleva a login.
Expiracion sigue detectandose por 401; sin peticiones una vista puede permanecer abierta, como ya acepta SPEC 02.
Logout local no revoca un JWT emitido; cancelar queries no garantiza abortar el transporte.

**La proteccion React controla la interfaz, no autoriza acceso a los datos.**
La presencia de token no demuestra firma valida, vigencia ni rol administrativo.
El backend debe validar autenticacion y permisos en cada endpoint que corresponda.
GET configuracion exitoso no demuestra permiso admin sobre los demas recursos.
El GET inspeccionado requiere autenticacion, no rol admin: tambien admite un conductor con JWT valido o la credencial interna X-N8N-Token.
Este frontend usa exclusivamente su Bearer existente; no introducir ni solicitar una credencial n8n.
Credenciales ausentes/invalidas producen 401; requireAdmin en PUT produce 403 para un usuario sin rol admin.
El caso 403 del shell es tratamiento defensivo de errores, no una afirmacion de que GET rechace normalmente al conductor.
TokenAdmin no contiene un perfil ni permisos; no inventar RBAC ni tratar un JWT decodificado como autoridad.
401 de la sesion vigente termina sesion; 403 conserva sesion y expresa permiso denegado.
La autorizacion real se valida en backend, no mediante mocks ni manipulacion del estado React.

### Deuda tecnica registrada

El GET inspeccionado admite cualquier JWT de usuario existente y no eliminado, sin exigir rol admin, y tambien la credencial interna `X-N8N-Token`. Por tanto, un conductor con JWT valido puede leer la configuracion de la empresa: nombre, radio y telefono.
No es un problema critico para el MVP, pero se recomienda restringir el endpoint a rol admin en una iteracion posterior, en coherencia con el `PUT`, que ya exige `requireAdmin`.
Este modulo no modifica el backend; el hallazgo queda aqui documentado y no altera el alcance del frontend.
El shell no puede corregirlo desde la interfaz: tratar el 403 de forma defensiva no reduce la exposicion descrita.

## Plan de implementacion original

P1-P3 quedaron resueltas en el plan original, condicionado entonces a una orden posterior de implementacion.
La orden vigente permite completar ajustes minimos del shell existente. Se conserva el plan como referencia, no como evidencia de ejecucion; no se ejecutan suites ni se sustituyen pruebas reales con mocks.

| Archivo o area | Cambio previsto y limite |
|---|---|
| `src/components/Layout.tsx` | Consulta compartida, nombre dinamico lateral/header, fallbacks diferenciados, retry local, errores y composicion accesible shadcn/ui. |
| `src/components/ui/sidebar.tsx` | Nueva adaptacion minima del sidebar; sin cookies ni atajos ajenos al alcance. |
| `src/components/ui/sheet.tsx` y primitivas necesarias | Solo soporte requerido para el menu movil; inventario definitivo tras revisar imports reales. |
| `src/hooks/use-mobile.ts`, si la adaptacion lo requiere | Detector alineado con lg; no crear hooks de negocio anticipados. |
| `src/components/ui/button.tsx`, `src/lib/utils.ts`, `src/index.css` | Ajustes minimos solo si la composicion lo exige; preservar Login y tema global. |
| `package.json` y `package-lock.json` | Solo dependencias imprescindibles de UI; sin actualizaciones generales ni nuevo runner de pruebas. |
| Este documento | Mantener decisiones confirmadas y registrar evidencia futura sin declarar resultados no ejecutados. |
| Router, AuthContext, cliente, token, DTO, App y paginas | Reutilizar sin cambios funcionales previstos; cualquier correccion adicional requiere justificar alcance. |

El inventario directo de UI existente se registra al final; no crear archivos vacios ni servicios anticipados.
No se preve cambiar components.json, Vite o TypeScript para introducir aliases innecesarios.

1. Tras recibir autorizacion de implementacion, integrar Configuracion en Layout con nombre dinamico lateral/header, fallbacks diferenciados y retry local seguro; verificar carga, exito y ausencia de fetch en login con mocks.
2. Incorporar la base Sidebar/Sheet minima con tema TaxiSur; sustituir la estructura lateral manteniendo enlaces y logout funcionales. Dividir en incrementos compilables si la adaptacion excede 30-50 lineas por cambio.
3. Integrar NavLink y estados activos en los controles shadcn/ui; conservar nombreEmpresa en ambos lugares al sustituir la estructura, sin cambiar paginas.
4. Completar P2: aviso/Reintentar para red/5xx y estados 403/409 sin recuperacion automatica, preservando ultimo nombre valido y efectos de autenticacion existentes.
5. Completar cierre movil, foco, teclado, scroll, nombres largos y adaptacion de breakpoints; verificar regresion de Login y rutas durante el incremento.

Primer cambio funcional previsto: consulta compartida, retry local y nombre dinamico lateral/header con sus fallbacks.
Ultimo cambio funcional previsto: comportamiento responsive/accesible del menu.
La revision de dependencias y contrato precede a los cambios que las consuman; las verificaciones acompanian cada incremento.

## Criterios de aceptacion

Estado tras spec-verify del 2026-09-29. La evidencia de cada marca esta en "Evidencia de spec-verify (2026-09-29)"; se apoya en `npm run test:unit`, `npm run build` y comprobaciones de navegador con respuestas simuladas. INT03 permanece pendiente y el criterio de Login no se cumple.

- [x] Barra lateral y header de escritorio/movil muestran el mismo nombreEmpresa recibido por GET, sin TaxiSur fijo ni sustitucion de TaxiSur - Pruebas por un fallback.
- [x] Sin nombre previo, lateral muestra exactamente TaxiSurRioAbajo y header Panel administrativo; se permite navegar durante carga y fallo.
- [x] Con nombre previo valido de la sesion, un refetch fallido lo conserva en ambos lugares, sin datos de sesiones anteriores.
- [x] Si el backend devuelve nombreEmpresa como string vacio o solo espacios, el shell lo trata como "sin nombre valido": conserva el nombre previo si existia y, si no, usa los fallbacks diferenciados (lateral TaxiSurRioAbajo, header Panel administrativo) sin romper el layout ni mostrar un nombre vacio.
- [x] Un nombre con espacios sobrantes se muestra recortado y el DTO almacenado en cache conserva el valor original del servidor.
- [x] Layout usa Configuracion central y `['configuracion']`; no duplica consultas por pagina ni guarda un DTO ficticio.
- [x] Navegar entre rutas hijas no crea una consulta de configuracion independiente por pantalla.
- [x] Una invalidacion controlada de `['configuracion']` actualiza el header sin recargar ni implementar el modulo 4.
- [x] shadcn/ui esta integrado como codigo local adaptado; dependencias agregadas y cambios compartidos quedan documentados.
- [ ] Paleta y Segoe UI se conservan; Login y contenidos de paginas no se redisenan. La paleta y Segoe UI si se conservan, pero `src/pages/Login.tsx` e `index.html` fueron modificados respecto a SPEC 02; ver discrepancia D1.
- [x] Los seis enlaces funcionan; Inicio solo esta activo en `/` y Conductores permanece activo en su detalle.
- [x] Sin sesion ninguna ruta privada monta el shell o su consulta; se muestra login.
- [x] Logout y 401 vigente limpian token/cache y redirigen a login; atras no restituye acceso.
- [x] Recarga pierde sesion; no se agrega persistencia de token ni cookie del sidebar.
- [x] 403 no cierra sesion; 401/exito tardios de A no cierran B ni muestran configuracion de A.
- [x] Menu movil cumple apertura/cierre, Escape, overlay, cierre al navegar y gestion de foco descritos.
- [x] Controles del panel cerrado no son enfocables; el panel abierto tiene nombre accesible y el fondo no recibe interaccion.
- [x] Matriz visual, zoom 200%, baja altura y nombres de 100 caracteres no producen scroll horizontal ni controles inaccesibles. Solo tras corregir el defecto D2 descrito en la evidencia.
- [x] Red/5xx muestran aviso discreto y Reintentar; el boton recupera el nombre sin recargar y no permite solicitudes simultaneas por clicks repetidos.
- [x] Retry local permite como maximo un reintento automatico para red/5xx y ninguno para 401/403/409, otros fallos no recuperables o respuestas obsoletas; retry global permanece intacto.
- [x] 403 muestra permiso denegado sin logout ni boton recuperable; 409 muestra Configuracion eliminada sin retry automatico, mutacion ni logout.
- [x] `npm run test:unit` y `npm run build` terminan correctamente; se registra evidencia por caso sin trasladar resultados historicos.
- [ ] INT03 confirma login/Bearer y GET configuracion en entorno autorizado antes de declarar el modulo completo/verificado; INT01 de SPEC 02 sigue pendiente hasta su evidencia real correspondiente. Sin entorno ni cuenta autorizados no se ejecuto ninguna peticion real.

## Estrategia de verificacion

Propuesta: reutilizar Vitest existente y comprobaciones de navegador sin instalar un nuevo runner ni dependencias de montaje.
Las pruebas del cliente no acreditan que React redirige o gestiona foco; esos comportamientos requieren navegador.
P3 autorizo mocks como estrategia del plan original; INT01 e INT03 permanecen pendientes hasta integracion real.
La solicitud vigente conserva la infraestructura de pruebas existente, pero no autoriza ejecutar suites ni presentar simulaciones como conexion real.

| ID | Caso y resultado esperado | Estado |
|---|---|---|
| Q01 | GET lento/sin datos: lateral TaxiSurRioAbajo y header Panel administrativo; navegacion/logout disponibles. | Ejecutado: lateral TaxiSurRioAbajo, header Panel administrativo, 6 enlaces y logout disponibles con la peticion colgada. |
| Q02 | DTO valido, incluido TaxiSur - Pruebas y telefono null: nombre exacto en lateral/header y cache con cinco campos. | Ejecutado: `TaxiSur - Pruebas` literal en ambos lugares; cinco campos en cache (unitario). |
| Q03 | Navegacion SPA por siete rutas: consulta compartida; invalidacion controlada cambia ambos nombres. | Ejecutado: una sola peticion de configuracion al recorrer seis rutas; invalidacion con dos observadores cubierta en unitario. |
| Q04 | Red/500, tambien error no JSON: aviso/Reintentar y maximo un retry automatico; clicks repetidos no duplican peticiones pendientes. | Ejecutado: red, 500 JSON y 500 sin JSON con aviso y Reintentar; doble clic real produjo una peticion mas un reintento, nunca dos simultaneas; recuperacion sin recarga. |
| Q05 | 403 y 409 CONFIGURATION_DELETED: mensajes especificos, cero retry automatico, sin boton recuperable, mutacion ni logout; medir peticiones tras esperar ventana de retry global. | Ejecutado: 1 llamada tras 4 s, sin boton, sesion viva; 409 muestra `Configuracion eliminada`; 404 tambien con 1 llamada y sin boton. |
| Q06 | Exito seguido de red/5xx/403/409: conservar ultimo nombre; repetir sin datos para comprobar ambos fallbacks y recuperacion red/5xx. | Ejecutado: tras exito, el fallo de red conservo `Radio Central` con aviso; sin datos previos se muestran ambos fallbacks. |
| Q07 | nombreEmpresa vacio o solo espacios, con y sin nombre previo, y nombre con espacios sobrantes: fallback o nombre previo segun corresponda, sin vacio visible y con el DTO original en cache. | Ejecutado en navegador (solo espacios con y sin previo) y en unitario (recorte y cache intacta). |
| A01 | Acceso directo sin sesion a cada ruta privada: login y cero peticiones de configuracion. | Ejecutado en `/configuracion`: redireccion a `/login`, formulario presente y 0 peticiones de configuracion. |
| A02 | Logout, atras, recarga y 401 vigente: token/cache retirados, sin acceso privado. | Ejecutado: logout, atras, recarga de ruta privada y 401 con shell montado terminan todos en login sin shell. |
| A03 | Consulta pendiente A, logout, login B, respuesta tardia 200/401 de A: nombre/cache/sesion B intactos. | Ejecutado solo en unitario (cliente y `configuracion.test.ts`); no reproducido en navegador. |
| N01 | Inicio y detalle de conductor: enlace activo correcto y semantica aria-current. | Ejecutado: en `/` solo Inicio con `aria-current="page"` y `data-active`; en `/conductores/12` solo Conductores. |
| N02 | Menu movil: Tab, Shift+Tab, Enter, Space, Escape, overlay, enlace y atras/adelante; foco visible/coherente. | Ejecutado: ciclo de Tab atrapado en el panel, Shift+Tab, Escape, overlay, cierre al navegar y atras/adelante; Enter verificado por navegacion real de enlaces. |
| V01 | Matriz visual, zoom, baja altura, cambio de breakpoint y nombre largo con/sin espacios: sin desbordamiento. | Ejecutado tras corregir D2: sin scroll horizontal en 1365x900, 1365x500, 683x450 (zoom 200%), 768x1024, 390x844 y 320x844 con nombre de 100 caracteres. |
| V02 | Comparacion Login antes/despues y contenido de paginas preservado; shell cambia solo segun alcance. | Parcial: paginas sin cambios en esta rama, pero Login e index.html si fueron modificados; discrepancia D1. |
| U01 | Suite existente de cliente/sesion y build; preservar casos 204, Bearer, 401/403 y respuestas obsoletas. | Ejecutado: 112 pruebas en 3 archivos y build correctos el 2026-09-29. |
| INT03 | Entorno y cuenta autorizados: login real y GET configuracion con Bearer; cinco campos reales y nombre visible tal cual en lateral/header. | Pendiente de integracion real |

Para mocks, interceptar todas las llamadas API antes de navegar, incluidas las peticiones existentes de Home.
Usar datos/tokens ficticios y controlar el orden de respuestas en las carreras.
No dejar mocks en codigo de produccion ni permitir peticiones reales accidentales.
Restaurar interceptores, zoom y sesion al terminar, incluso si falla un caso.
Registrar fecha, resultado y evidencia saneada; no guardar contrasenas, JWT, headers sensibles ni datos personales.
Documentar limites de lector de pantalla y dispositivo movil si solo se verifica con navegador de escritorio.

INT03 necesita entorno accesible y cuenta autorizada; no buscar secretos ni crear usuarios para desbloquearlo.
Confirmar base URL, CORS y contrato sin modificar entorno por iniciativa propia.
El GET actual no crea filas; aun asi, la solicitud vigente prohibe peticiones, servidores, seeds y migraciones. No ejecutar GET en esta entrega.
Mocks no demuestran firma JWT, autorizacion efectiva, disponibilidad ni persistencia real.

## Decisiones y pendientes

### Confirmado

- shadcn/ui sera la base del diseno de este modulo, adaptada a la identidad actual.
- La entrega documental original solo actualizaba esta spec; la orden vigente autoriza ajustes minimos, sin marcar casillas ni ejecutar spec-verify.
- Reutilizar el alcance del modulo 3; no ampliar a formularios ni funcionalidades de otras pantallas.

### Establecido por las fuentes

- Configuracion central, key estable, fallback del header Panel administrativo y navegacion no bloqueante; P1 fija ademas el fallback lateral TaxiSurRioAbajo.
- Sesion en memoria y logout existente; backend como autoridad de autorizacion.
- Seis secciones y rutas privadas existentes; no RBAC ni migracion de router.

### Decisiones aprobadas

| ID | Resolucion confirmada | Alternativa descartada e impacto |
|---|---|---|
| P1 | Ultima indicacion prevalece: lateral usa nombreEmpresa de DB o TaxiSurRioAbajo sin nombre previo; header escritorio/movil usa el mismo nombre real o Panel administrativo. Conservar ultimo nombre valido de sesion y mostrar TaxiSur - Pruebas real tal cual. | Marca lateral TaxiSur fija descartada; no cambiar default backend ni sobrescribir nombres reales con fallbacks. |
| P2 | Aviso discreto/Reintentar para red/5xx. Override retry local excluye errores no recuperables. 403 muestra permiso denegado sin logout ni recuperacion automatica; 401 conserva cliente/AuthContext; 409 eliminada no se recupera mediante mutacion o retry automatico. | Fallback silencioso y retry global indiscriminado descartados; no ampliar autenticacion ni modificar configuracion global. |
| P3 | Mocks autorizados para implementar posteriormente; INT01 de SPEC 02 e INT03 de SPEC 03 pendientes hasta integracion real. Sin INT03 no se declara modulo completo/verificado. | No se exige integracion antes de comenzar con mocks; tampoco se acepta que mocks o lectura estatica acrediten cierre real. |

La lectura estatica backend esta autorizada y realizada; no queda un bloqueo de acceso documental.
No quedan decisiones P1-P3 pendientes ni se requiere reabrirlas para implementar posteriormente.
La orden de ajustes minimos ya fue recibida y spec-verify se ejecuto el 2026-09-29 con respuestas simuladas; queda pendiente la integracion real con entorno y cuenta autorizados.
El inventario minimo de dependencias UI existentes se registra a partir de imports, package.json y lockfile, sin nuevas instalaciones.

### Alternativas descartadas por alcance

- Copiar un dashboard completo shadcn/ui: introduce pantallas y comportamientos ajenos al modulo.
- Instalar todo el registro o sobrescribir Button/tema/configuracion: arriesga regresiones y dependencias innecesarias.
- Persistir cookie de sidebar o agregar atajos del ejemplo: no solicitado.
- Crear un guard por pantalla o validar permisos con JWT decodificado: duplica logica y no aporta autorizacion real.
- Duplicar configuracion en otro store o consultar por cada pagina: contradice la query compartida.
- Corregir Home o implementar PUT configuracion: pertenecen a modulos posteriores.

## Referencias Context7

IDs resueltos antes de consultar en la investigacion y creacion del borrador: `/remix-run/react-router`, `/reactjs/react.dev`, `/tanstack/query` y `/shadcn-ui/ui`.
Las fuentes son documentacion oficial actual, no documentacion fijada a los parches instalados ni una comprobacion de compatibilidad ejecutada.

| Fuente | Consecuencia |
|---|---|
| [React Router: modos](https://github.com/remix-run/react-router/blob/main/docs/start/modes.md) | BrowserRouter corresponde al modo declarativo; conservar arquitectura. |
| [React Router: rutas declarativas](https://github.com/remix-run/react-router/blob/main/docs/start/declarative/routing.md) | Layout padre y Outlet para rutas hijas sin nuevos guards. |
| [React Router: navegacion](https://github.com/remix-run/react-router/blob/main/docs/start/declarative/navigating.md) | NavLink y coincidencia end para el estado activo. |
| [React: reglas de hooks](https://react.dev/reference/rules/rules-of-hooks) | Hooks antes de retornos condicionales; no colocar useQuery tras el guard de Layout. |
| [Query: inicio rapido](https://github.com/tanstack/query/blob/main/docs/framework/react/quick-start.md) | useQuery con objeto e invalidacion mediante QueryClient compartido. |
| [Query: cache](https://github.com/tanstack/query/blob/main/docs/framework/react/guides/caching.md) | Misma key comparte datos; staleTime por defecto no impide refetch al montar otro observador. |
| [shadcn/ui: Sidebar Radix](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/radix/sidebar.mdx) | SidebarProvider y useSidebar controlan openMobile/setOpenMobile. |
| [shadcn/ui: codigo Sidebar new-york-v4](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx) | SidebarMenuButton asChild/isActive, rama movil Sheet, imports transitivos, cookie, atajo y breakpoint que requieren adaptacion. |

No se ejecutaron CLI shadcn, instalaciones ni generadores.

## Riesgos y dependencias

| Riesgo | Tratamiento |
|---|---|
| SPEC 02 tiene INT01 pendiente. | P3 permite comenzar con mocks, pero conserva INT01/INT03 como integracion pendiente. |
| Codigo y tests inspeccionados se confunden con pruebas pasando o servicio disponible. | Evidencia solo estatica; entorno/cuenta y ejecucion real siguen pendientes para INT03. |
| Confundir ajustes implementados con verificacion completa. | spec-verify del 2026-09-29 cubrio casos con respuestas simuladas; INT01/INT03 siguen pendientes y ningun resultado con mocks acredita cierre real. |
| Fallback lateral reemplaza el default real o modifica DB. | Mostrar TaxiSur - Pruebas recibido tal cual; TaxiSurRioAbajo solo es fallback visual sin nombre previo. |
| La fila id 1 puede estar ausente o eliminada. | GET solo consulta: 404 NOT_FOUND o 409 CONFIGURATION_DELETED. Mantener nombre previo o fallbacks y aviso sin retry ni mutaciones. La antigua descripcion create/P2002 no aplica al contrato actual; no se conoce el estado de DB. |
| retry global 1 vuelve a consultar 403/409. | Override local por error, medicion de peticiones en Q05 y sin efectos de refetch en bucle. |
| Shadcn cambia componentes compartidos o mezcla APIs de familias distintas. | Revisar imports y adaptar variante Radix minima; regresion de Login y build. |
| Sidebar agrega cookies, atajos o breakpoint md sin querer. | Retirar efectos no solicitados y alinear detector/CSS con lg; probar cambio de viewport. |
| Menu oculto sigue accesible al teclado o pierde foco. | Panel modal con gestion de foco comprobada, no solo transformacion visual. |
| Cache de configuracion cruza sesiones. | Mantener identidad, cancelacion y limpieza existentes; probar respuesta tardia A/B. |
| Exigir literalmente un solo GET impide recuperacion o invalidacion. | Medir consulta compartida y navegacion sin remonte, permitiendo refetch legitimo. |
| Nombre largo o logout absoluto recorta controles. | Pruebas de 100 caracteres, zoom y poca altura; contenido lateral desplazable. |
| Cambios ajenos en el repositorio. | Preservar cualquier archivo no perteneciente al spec; .env estaba modificado y no se leyo. |

## Evidencia de la entrega documental original

El borrador inicial registro investigacion frontend/Context7 y creacion documental con decisiones abiertas.
Esta actualizacion sustituye esas decisiones por P1-P3 confirmadas e incorpora la inspeccion backend estatica autorizada del agente explore.
Se aplico ademas un pulido documental de cinco ajustes: ruta del backend en forma relativa, caracterizacion del fallback del cliente, deuda tecnica de autorizacion, criterio y prueba de nombre vacio, y riesgo de creacion de la fila por defecto.
Se actualizan integralmente contrato, estados UI, retry local, diseno, plan, criterios, pruebas y riesgos; no solo un apendice.
No se ejecutaron build, suites, pruebas de navegador ni peticiones al backend para esta spec.
Los archivos de tests citados se leyeron, no se ejecutaron; no se afirma que sus aserciones pasen ni se conoce el estado actual de DB.
INT01 e INT03 siguen pendientes; no hay evidencia nueva de despliegue, CORS o autorizacion real en ejecucion.
No se marca ningun criterio como cumplido ni se heredan resultados de SPEC 01/02.
`specs/.spec-config.yml` ya existe y se conserva sin cambios.
No se modifican configuraciones, dependencias, codigo de aplicacion ni roadmaps; no se crean commits.

## Ajustes minimos actuales (2026-09-29)

- Lectura completa de esta spec y lectura estatica del shell, helpers, pruebas existentes y servicio/controlador backend. No se modifico backend ni DB.
- `src/lib/configuracion.ts`: nombresEmpresa usa FALLBACK_LATERAL y FALLBACK_HEADER en lugar del identificador inexistente MARCADOR_EMPRESA.
- `src/lib/configuracion.test.ts`: expectativas existentes alineadas con los dos fallbacks. Son pruebas con simulaciones existentes, no evidencia de integracion real; no se ejecutaron ni se agregaron mocks productivos.
- `src/components/Layout.tsx`: Reintentar incorpora min-h-11 para el minimo tactil de 44 px. Login, estilos y componentes compartidos preexistentes se preservan sin ediciones en esta entrega.
- Dependencias directas ya presentes: `@radix-ui/react-dialog` declarado ^1.1.23, resuelto 1.1.23 (Sheet), y `@radix-ui/react-slot` declarado ^1.3.3, resuelto 1.3.3 (SidebarMenuButton asChild). Button sigue siendo nativo, sin Slot. No se modificaron package.json ni package-lock.json ni se instalaron paquetes en esta entrega.
- Contrato reconciliado con el codigo actual: findUnique id 1, 404 ausente, 409 eliminada; sin inicializacion por GET. Las menciones de defaults/create/P2002 quedan identificadas como historicas.
- Comprobacion estatica: `npx tsc --noEmit -p tsconfig.app.json` y `npx tsc --noEmit -p tsconfig.node.json` finalizaron sin errores ni emision. Se usan los proyectos por separado para evitar metadatos de build incremental. Esto no acredita pruebas ejecutadas, build de Vite ni integracion real.
- Casillas y estados de la matriz intactos en aquella entrega. Con posterioridad se ejecuto spec-verify el 2026-09-29: ver "Evidencia de spec-verify (2026-09-29)". INT01/INT03 y la regresion visual completa de Login siguen pendientes; el modulo no se declara completo.

## Evidencia de spec-verify (2026-09-29)

Verificacion ejecutada el 2026-09-29 en `frontEnd/` con Node/npm del proyecto, Vitest 4.1.11, Vite 6.4.3 y Chromium de escritorio mediante Playwright, usando `http://localhost:5231` (servidor de desarrollo local) con todas las rutas `/api/**` interceptadas. No se realizo ninguna peticion al backend, no se leyeron secretos ni `.env`, no se modifico el backend ni la base de datos y no se crearon commits.

### Comandos ejecutados

| Comando | Resultado |
|---|---|
| `npm run test:unit` | 3 archivos y 112 pruebas correctas (ejecutado antes y despues de la correccion D2). |
| `npm run build` | `tsc -b` y `vite build` correctos; 175 modulos; salida en `dist/` ignorada por git. |
| `npx tsc --noEmit -p tsconfig.app.json` / `tsconfig.node.json` | Sin errores, segun la entrega del 2026-09-29; el build cubre ademas la comprobacion de tipos. |

### Navegador: como se comprobo

Se inicio sesion simulada (`/api/auth/admin/login` con token ficticio y respuestas interceptadas) y se observo el shell real montado. Todas las llamadas a `/api/configuracion` se contaron para medir reintentos y evitar duplicados.

- Nombres: `TaxiSur - Pruebas` literal en lateral y header; sin datos, `TaxiSurRioAbajo` en lateral y `Panel administrativo` en header, con seis enlaces y logout disponibles durante la carga y el fallo.
- Consulta compartida: una sola peticion al recorrer `/conductores`, `/mapa`, `/solicitudes`, `/tarifas`, `/configuracion` y `/`; el cache conserva el DTO original mientras la vista muestra el nombre recortado.
- Errores: 403, 409 y 404 cerraron en una peticion tras cuatro segundos, sin boton recuperable y con la sesion viva; red, 500 con JSON y 500 sin JSON cerraron en dos peticiones, con aviso y `Reintentar`.
- Reintento: doble clic real del usuario produjo una peticion mas su reintento automatico, con una sola peticion en vuelo; el boton quedo en `Cargando...` deshabilitado y la recuperacion actualizo lateral y header sin recarga.
- Sesion: acceso directo sin sesion a `/configuracion` llevo a login con cero peticiones de configuracion; logout, atras, recarga y 401 con el shell montado terminaron en login sin shell.
- Menu movil: activador con nombre en espanol, `aria-expanded` y `aria-controls="menu-panel"`; `#root` queda con `aria-hidden="true"` mientras el panel esta abierto; el foco entra en el panel, Tab cicla dentro, Escape y el overlay cierran devolviendo el foco al activador, y cerrar al navegar o con atras/adelante lleva el foco a `#contenido-principal`.
- Responsivo: sin scroll horizontal en 1365x900, 1365x500, 683x450 (equivalente a zoom 200%), 768x1024, 390x844 y 320x844 con nombre de 100 caracteres; el nombre completo sigue disponible por tecnologia asistiva y el logout permanece en pantalla con 44 px de alto.

### Defecto encontrado y corregido (D2)

`NombreRecortado` duplicaba el nombre completo en un `span.sr-only` con `position: absolute` sin ancestro posicionado. Con un nombre largo el texto accesible se colocaba fuera del viewport y generaba scroll horizontal en anchos menores a `lg` (390 px: `scrollWidth` 735 frente a 375; 320 px: 734 frente a 305; 683 px: 742 frente a 668).

Correccion minima en `src/components/Layout.tsx:52`: el parrafo del nombre pasa a `relative truncate` para que la copia accesible quede contenida. Tras el cambio las seis medidas de la matriz dan `scrollWidth` igual a `clientWidth`. El recorte visual y la semantica no cambian.

### Discrepancias entre spec y codigo

- **D1 (criterio no cumplido):** `src/pages/Login.tsx` e `index.html` fueron modificados en esta rama respecto al commit de SPEC 02: la marca `TaxiSur` se sustituyo por `PanelAdmin` en titulo, panel lateral, encabezado y pie, y el `title` paso de `TaxiSur · Panel administrativo` a `Panel administrativo`. Esto contradice el criterio "Login y contenidos de paginas no se redisenan" y la seccion "Ajustes minimos actuales", que afirma que Login se preservo sin ediciones. La paleta, los tokens y Segoe UI si se conservan.
- **D2 (corregido):** ver seccion anterior.
- **D3 (redaccion obsoleta):** la seccion "Ajustes minimos actuales" afirma que `package.json` y `package-lock.json` no se modificaron ni se instalaron paquetes, pero el arbol de trabajo si los contiene modificados con `@radix-ui/react-dialog` y `@radix-ui/react-slot` anadidos. La afirmacion debe leerse como "no se instalaron paquetes adicionales durante esa entrega minima", no como estado del repositorio.
- **D4 (observacion menor):** el enlace "Saltar al contenido" existe y funciona, pero en el orden de tabulacion de escritorio aparece despues de los siete controles de la barra lateral, porque el `<aside>` precede en el DOM a la columna de contenido. No impide saltar al contenido, aunque no es el primer elemento enfocable de la pagina.
- **D5 (limites):** A03 (carrera entre sesiones) solo quedo cubierto por pruebas unitarias, no por navegador. No se uso lector de pantalla ni dispositivo fisico: los gestos tactiles y el movimiento reducido no se comprobaron en hardware real.

### Lo que sigue pendiente

INT03 requiere entorno y cuenta autorizados; INT01 de SPEC 02 sigue igual. Hasta entonces el modulo no puede declararse verificado contra integracion real y ningun resultado con respuestas simuladas acredita firma de JWT, autorizacion efectiva, disponibilidad, CORS ni estado de la base de datos.


- Verificacion completa de la implementacion; la orden vigente solo autoriza ajustes minimos y comprobacion TypeScript sin emision.
- Modulos posteriores, datos demo, nuevos contratos, RBAC o migracion del router.
- Persistencia de sesion, cambios de backend, creacion de cuentas o acceso a secretos.
- Redisenar Login o modificar su comportamiento por incorporar shadcn/ui al shell.
- Declarar integracion o seguridad backend verificadas mediante mocks.
