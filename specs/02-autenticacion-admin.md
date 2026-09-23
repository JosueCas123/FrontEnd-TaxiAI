# SPEC 02 - Autenticacion de administrador

> **Estado:** Implementada con mocks; UI08/UI10 verificadas; cierre de integracion (INT01) pendiente
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`); contrato externo `../backend/specs/03-base-auth-admin.md`.
> **Fecha:** 2026-09-23
> **Implementacion:** P1-P4 implementadas el 2026-09-23; UI08 y UI10 verificadas al cierre del dia (zoom nativo 200%, comparacion historica 14/14 y barrido de foco del shell); INT01 pendiente.
> **Objetivo:** Completar el login administrativo con el contrato real, diseno responsive y proteccion de navegacion compatible con la sesion en memoria.

## Contexto y fuentes

**Actualizacion de ejecucion, 2026-09-23:** el usuario autorizo expresamente implementar P1-P4 con mocks. Las frases siguientes de entrega exclusivamente documental, no implementacion y pruebas no ejecutadas son contexto historico, no restricciones de esta ejecucion. La seccion final "Ejecucion y evidencia" y las casillas/matriz actualizadas expresan el estado vigente. No se declara el modulo completo ni verificado: INT01 sigue bloqueada y se explicitan los limites de verificacion visual.

El borrador original se guardo para revision el 2026-09-22, sin autorizacion de implementacion en esa entrega.
El usuario resolvio y aprobo P1-P4; esta revision incorpora esas decisiones sin reabrir preguntas.
Tambien aprobo shadcn/ui como base visual adaptada a TaxiSur, con adopcion inicial exclusivamente en login y la excepcion acotada de dependencias/configuracion descrita aqui.
La implementacion futura puede comenzar con mocks, pero en esta tarea solo se autoriza actualizar este documento.
INT01 no bloquea comenzar; si bloquea declarar el modulo completo o verificado.
La implementacion no ha comenzado y todos los criterios y resultados funcionales permanecen pendientes.

Las rutas parten de `frontEnd/`; las referencias de linea corresponden a la investigacion original, no a una nueva inspeccion del codigo.
La fecha de esta revision procede del contexto de la sesion.
Se releyeron la plantilla del skill spec, el listado de specs, SPEC 01, Login y el cliente HTTP antes de crear el documento.
Solo existe una spec local previa; su encabezado declara implementacion verificada con alcance reducido.
Las observaciones historicas de SPEC 01 deben interpretarse junto con su seccion final de ejecucion.

| Fuente | Uso |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:57-86` | Alcance real del modulo 2, contrato, sesion en memoria y criterios de login. |
| `specs/01-fundacion-y-contratos.md:67-99,499-557` | Contratos creados; adopcion en Login y mensaje 401 diferidos; evidencia historica, no pruebas de este modulo. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:32-41,68-70,110-116` | Autenticacion, formulario y exclusion de roles administrativos multiples. |
| `references/pantallas/login.html:10-14` | Entrada al prototipo; carga estilos y JavaScript compartidos. |
| `references/pantallas/app.js:157-158` | Estructura visual efectiva del login. |
| `references/pantallas/styles.css:1-3,6,9-10` | Paleta, tipografias, composicion y adaptacion responsive. |
| `../docs/ROADMAP_ENDPOINTS.md:26-39` | Login admin separado de autenticacion de conductores. |
| `../docs/REGLAS_DE_NEGOCIO.md:3-4,44-50` | Las reglas operativas corresponden al backend. |
| `../docs/ARQUITECTURA.md:19-26` | Backend como fuente de verdad; dashboard consumidor. |
| `../docs/MODELO_DE_DATOS.md:42-56` | Usuarios admin/conductor; persistencia no equivalente a DTO de login. |
| `../backend/specs/03-base-auth-admin.md:36-59,72-80` | Contratos de autenticacion, permisos y errores. |
| `../backend/src/modules/auth/auth.service.ts:9-30` | Elegibilidad admin, emision del JWT y respuesta exacta. |
| `../backend/src/modules/auth/auth.controller.ts:4-13` | 401 generico y `Cache-Control: no-store` en exito. |
| `../backend/src/middlewares/auth.ts:37-61,127-148` | Verificacion del token y autorizacion por rol consultado en base. |

La spec backend citada es externa: no es una dependencia local llamada SPEC 03 del frontend.
La investigacion no incluyo lectura de secretos ni autenticacion contra una instancia real.

## Estado observado en la investigacion previa

| Pieza | Estado y trabajo identificado |
|---|---|
| `src/api/types.ts:8-12` | Existe `TokenAdmin`; reutilizar sin duplicar el DTO. |
| `src/pages/Login.tsx:9-32,64-117` | Existen validacion RHF/Zod, mostrar/ocultar clave y estado de envio. |
| `src/pages/Login.tsx:16-20,37-40` | Usa `LoginResponse` local y alternativas `accessToken`/`jwt`; no valida `tokenType`. |
| `src/pages/Login.tsx:47-49` | Ejecuta `navigate` durante render; SPEC 01 registra un aviso de React por este comportamiento. |
| `src/router.tsx:13-30` | `ProtectedLayout` protege todas las rutas del dashboard; `/login` es publica. |
| `src/components/Layout.tsx:18,89-90` | Existe un guard adicional y un `Outlet`; no se requiere redisenar el shell. |
| `src/context/AuthContext.tsx:18-38` | Guarda/limpia token y escucha `auth:unauthorized`; autentica la UI por presencia de token. |
| `src/api/token.ts:1-9` | Token solo en memoria, sin almacenamiento persistente. |
| `src/api/client.ts:23-44` | 401 descarta el cuerpo; otros errores ya extraen `error.message` de forma segura. |
| `src/api/client.test.ts:48-59` | M06 exige el mensaje fijo de 401 y que no se lea JSON; debera cambiar con el nuevo requisito. |
| `src/App.tsx:6-20` | QueryClient compartido persiste entre sesiones; logout no limpia su cache. |
| `src/index.css:3-13` | Paleta compatible con el prototipo, tipografia Segoe UI. |
| `vitest.config.ts:1-5` | Pruebas en Node, sin infraestructura de montaje de componentes. |

Versiones instaladas observadas mediante `npm ls` en la investigacion: React y React DOM 19.3.0, React Router DOM 7.18.4, TanStack Query 5.102.8, React Hook Form 7.88.0 y Zod 3.25.76.
`package.json` declara Vitest 4.1.11 y `test:unit`.
Estas observaciones no acreditan pruebas funcionales del modulo 2.

Contexto confirmado en la lectura previa para la adopcion visual: `package.json` declara React `^19.1.0`, Vite `^6.3.5`, Tailwind `^4.3.3`, React Hook Form `^7.88.0` y Zod `^3.25.76`.
Estos rangos declarados no sustituyen las versiones instaladas historicas ni acreditan compatibilidad probada.
`src/index.css` usa `@import "tailwindcss"` y `@theme`, con TaxiSur `#f6c343`, ink-950 `#111e2f`, surface `#f5f7fa`, gris `#6a7686`, azul `#3977cf` y tokens verde/ambar; las familias display/sans usan Segoe UI.
`vite.config.ts` contiene los plugins React/Tailwind sin alias; `tsconfig.app.json` no declara paths.
El stack es compatible segun la documentacion consultada de shadcn/ui; la configuracion concreta, compilacion y comportamiento se verificaran al implementar.

## Alcance

**Incluido por los documentos de referencia:**

- Adoptar `TokenAdmin` en Login y eliminar nombres alternativos del token.
- Comprobar una respuesta utilizable antes de crear sesion, incluido `tokenType === 'Bearer'`.
- Mantener correo y clave obligatorios, validacion de correo y clave sin transformaciones.
- Mostrar el mensaje seguro del backend ante credenciales invalidas.
- Conservar mostrar/ocultar clave y bloqueo del boton mientras se envia el formulario.
- Redirigir al inicio tras login y al visitar `/login` con sesion activa.
- Conservar guard de las rutas del dashboard, token en memoria y cierre por 401 atribuible a la sesion vigente.
- Correlacionar respuestas y efectos con su sesion de origen para impedir que una peticion anterior invalide una sesion posterior.
- Corregir la navegacion imperativa durante render.
- Distinguir autenticacion rechazada (401), permiso denegado (403) y fallos de red/servidor.

**Decisiones aprobadas P1-P4, incluidas en el alcance:**

- P1: adaptar el login a dos columnas del prototipo, con tipografia actual y version movil de una columna.
- P2: cancelar consultas y limpiar cache al terminar sesion para separar datos de distintos accesos.
- P3: detectar expiracion por 401, sin temporizador local ni renovacion automatica.
- P4: reutilizar Vitest para cliente HTTP y verificaciones de navegador sin instalar nuevas dependencias de pruebas.

**Adopcion visual aprobada:**

- Usar shadcn/ui como base de componentes locales solo para login; comenzar con Button, Input, Label y Alert, incorporando solo los necesarios.
- Conservar React Hook Form/Zod, React Router y los contratos de autenticacion/cache; la biblioteca visual no sustituye su logica.
- Permitir unicamente las dependencias minimas de esos componentes/utilidades y los cambios de configuracion/CSS detallados mas abajo, sin actualizar el stack por conveniencia.

**Fuera del alcance:**

- Registro o gestion de usuarios, login de conductores y reseteo de PIN.
- Roles administrativos multiples, RBAC frontend, `/me` o contratos nuevos de permisos.
- Recuperacion de clave, recordar sesion, refresh tokens, cookies o persistencia en storage.
- Migrar React Router a Data/Framework Mode, incorporar middleware de router o un proveedor de autenticacion.
- Implementar modulos 3-10, corregir Home o cambiar el nombre de empresa del shell.
- Redisenar otras pantallas, actualizar tipografias globales o copiar funcionalidad demo.
- Adoptar bloques/plantillas de login, modo oscuro, animaciones adicionales o migrar otras pantallas a shadcn/ui.
- Modificar backend, base de datos, entorno, configuraciones, dependencias o roadmaps durante esta entrega documental.

## Modelo de datos y contratos

No se introducen entidades persistidas ni un nuevo DTO de respuesta.
Se reutiliza `TokenAdmin` de SPEC 01:

```ts
interface TokenAdmin {
  token: string
  tokenType: 'Bearer'
  expiresIn: number
}
```

`POST /api/auth/admin/login` recibe `correo` y la clave JSON `"contrase\u00f1a"`.
La grafia escapada representa la clave real con ene acentuada, no una clave alternativa.
El endpoint es publico y no necesita un token previo.
La respuesta 200 contiene `token`, `tokenType: "Bearer"` y `expiresIn: 28800`, en segundos.
No contiene perfil ni rol; no hay envoltorio `data`, `accessToken` o `jwt`.

Validacion defensiva local: rechazar JSON nulo/no objeto, token no string o vacio, tipo distinto de Bearer y vigencia no numerica, no finita o no positiva.
La comparacion `tokenType === 'Bearer'` es estricta, sin normalizacion de mayusculas, espacios ni otros valores.
Verificar el valor contractual 28800 en las pruebas; no crear una segunda politica de expiracion basada en un numero fijo del frontend.
El tipo TypeScript no valida JSON en ejecucion.
No convertir esta comprobacion puntual en una infraestructura generica de validacion de todos los DTO.

Ante respuesta invalida, no almacenar token ni navegar al dashboard; mostrar un error local seguro de respuesta de autenticacion invalida.
No mostrar el cuerpo completo recibido ni registrar tokens o claves.
Mantener esta validacion acotada al contrato de login.

Estado local reutilizado: error de formulario/API, visibilidad de clave y envio pendiente.
Estado de sesion reutilizado: token en contexto y modulo de memoria; mantenerlos sincronizados al iniciar y cerrar sesion.
La correlacion de sesion es metadato local en memoria, no un nuevo DTO ni un cambio del contrato backend.
Cada peticion debe conservar su origen desde el envio, incluida la ausencia de sesion para el login publico.
El evento `auth:unauthorized` debe permitir al consumidor reconocer ese origen y compararlo con la sesion vigente al procesarlo.
La identidad debe distinguir accesos sucesivos incluso si se recibe el mismo token; no basta leer el token vigente al llegar la respuesta ni comparar solo su texto.
Elegir el mecanismo minimo robusto en los modulos existentes, sin imponer un store, servicio o infraestructura generica nuevos ni exponer credenciales en el evento.
No se persisten correo, clave, sesion o datos nuevos entre recargas.

### Errores y ciclo de sesion

| Caso | Comportamiento previsto |
|---|---|
| Correo invalido o campos vacios | Error local asociado al campo; no enviar peticion. |
| Login 200 valido | Guardar token y navegar a `/` con reemplazo de historial. |
| Login 401 | Mostrar `error.message` del backend, actualmente `Credenciales invalidas`; conservar ApiError 401 y emitir el evento una vez, sin borrar el mensaje ni cerrar una sesion posterior. |
| 401 de cualquier peticion | Conservar ApiError 401 y mensaje o fallback; emitir `auth:unauthorized` una vez por respuesta con correlacion de origen, incluso con cuerpo invalido. Notificar no equivale a invalidar. |
| 401 de la sesion vigente | El consumidor invalida solo esa sesion, limpia sus datos y redirige a `/login`. |
| 401 tardio de sesion A con B vigente | Mantener error y evento de A, sin invalidar B, redirigirla ni borrar su cache. |
| 403 | Conservar status y mensaje; no emitir evento 401 ni tratarlo automaticamente como sesion expirada. |
| 400/500 con mensaje seguro | Mostrar el mensaje recibido cuando exista un consumidor visible del error. |
| Respuesta no JSON | Mantener un fallback seguro; no mostrar errores de parseo ni contenido HTML. |
| Fallo de red | Mostrar error comprensible y permitir reintento manual; no fabricar 401 ni sesion. |
| Logout manual | Retirar token/contexto, navegar a `/login` y aplicar cancelacion y limpieza P2 sin afectar accesos posteriores. |
| Recarga | Perder la sesion en memoria y volver a `/login` desde cualquier ruta protegida. |

El cliente debera preservar `ApiError.status` y la precedencia de mensajes ya soportados: anidado, raiz y error string.
Para 401 sin mensaje utilizable conservar el fallback actual de sesion expirada/no autorizada.
El fallo de parseo no debe impedir la notificacion ni la invalidacion cuando el origen corresponde a la sesion vigente.
El consumidor no debe cerrar una sesion distinta por un evento de origen anterior o sin sesion.
El 401 de un intento de login conserva el evento existente; no debe provocar una redireccion o limpieza que borre el mensaje del formulario ni cerrar una sesion iniciada despues.
No agregar reintentos automaticos de credenciales.

M06 evoluciona deliberadamente: antes exigia no leer JSON del 401 y usar el mensaje fijo; ahora debe extraer `error.message`, conservar `ApiError.status === 401` y comprobar un evento por respuesta.
No eliminar M06 para hacer pasar la suite; ampliar cobertura de cuerpo invalido/fallback y separacion entre sesiones en las pruebas correspondientes.
Registrar esta evolucion respecto de SPEC 01 en la futura descripcion del commit de implementacion; esta entrega no crea commits.
El caso 204 no cambia: sigue sin parsear el cuerpo.

Esta spec no promete incorporar estados visuales 403 a todas las pantallas provisionales.
Verifica el comportamiento del cliente compartido y del login; las pantallas de negocio presentaran sus propios errores al implementarse.
No se propone una ruta global `/403` ni un cierre de sesion por 403 sin decision adicional.

## Diseno responsive y accesibilidad

Esta seccion desarrolla el diseno aprobado P1.

- Escritorio: panel institucional azul oscuro a la izquierda y formulario blanco a la derecha, tomando la composicion de `loginPage()` del prototipo.
- Mantener amarillo TaxiSur, colores actuales y Segoe UI; permitir solo el mapeo de tema acotado en `src/index.css`, sin sobrescribir estilos globales ni cargar fuentes externas.
- Movil: una columna con marca compacta y formulario prioritario; sin panel lateral que obligue a desplazamiento horizontal.
- Breakpoint de referencia: dos columnas desde `lg` del proyecto; debajo, una columna. No se exige replica pixel a pixel del prototipo.
- Mantener textos institucionales del prototipo cuando describan el producto real; excluir toda credencial precargada, ayuda demo y aviso de autenticacion ficticia.
- Campos vacios inicialmente, etiquetas visibles, autocomplete apropiado y clave oculta por defecto.
- Mostrar/ocultar clave mediante boton de tipo `button` con nombre accesible actualizado; no enviar el formulario al usarlo.
- Asociar errores locales con `aria-describedby` y marcar campos invalidos con `aria-invalid`.
- Anunciar el error general mediante `role="alert"`; indicar envio pendiente sin depender solo del color.
- Conservar foco visible, orden de tabulacion natural y envio por Enter; impedir envios duplicados mientras la solicitud esta pendiente.
- No imponer altura fija que recorte el formulario con teclado movil o zoom; permitir scroll vertical.

Matriz visual de verificacion: 1365x900, 768x1024 y 390x844, mas una comprobacion a 320 px de ancho y zoom al 200%.
En todos los casos se debe poder leer, completar y enviar el formulario sin desplazamiento horizontal.
Los ajustes de detalle deben respetar las dos columnas de escritorio, una en movil y la tipografia Segoe UI aprobadas.

### Base visual shadcn/ui y tema TaxiSur

El layout sera propio, no un bloque o plantilla de shadcn/ui; Button, Input, Label y Alert aportan la base de controles, no un rediseno.
El codigo de los componentes se agrega localmente en `src/components/ui/` y queda mantenido por el proyecto, incluidas futuras correcciones y actualizaciones.
Su adopcion no garantiza automaticamente accesibilidad: verificar etiquetas, errores, anuncios, teclado, foco y contraste tras la adaptacion.
Mantener la integracion existente de React Hook Form/Zod; no incorporar una capa Form adicional por seguir un ejemplo de la biblioteca.

Preservar los tokens existentes y mapear el tema semantico a ellos sin reemplazar la hoja global por la salida del CLI.

| Token/uso semantico | Mapeo previsto |
|---|---|
| `primary` / `primary-foreground` | Amarillo TaxiSur `#f6c343` con texto oscuro ink-950 `#111e2f`. |
| `background` / superficie general | Surface existente `#f5f7fa`, sin cambiar fondos de otras paginas. |
| `foreground` | Oscuro ink-950 existente. |
| Superficie del formulario | Blanco con texto oscuro; panel institucional azul oscuro existente. |
| Foco / `ring` y estados | Foco visible contrastado sobre amarillo, blanco y azul oscuro; verificar contraste y reutilizar colores existentes para errores/estados. |
| Tipografia | Segoe UI en display/sans; sin fuentes externas. |

Revisar antes de aplicar cualquier regla global de base, bordes, fondos o foco que proponga el CLI: puede afectar pantallas aunque no importen componentes nuevos.
No agregar modo oscuro, animaciones extra ni dependencias para capacidades no utilizadas.
Comparar antes/despues el login y las paginas existentes mediante UI08/UI10; el mapeo no autoriza cambiar su apariencia.

La excepcion futura permite `components.json`, componentes locales, utilidad de clases como `cn` solo si hace falta, tema en `src/index.css`, `package.json` y su lockfile.
Permite aliases sincronizados en Vite y TypeScript solo si los imports elegidos los requieren; no imponerlos ni crear infraestructura innecesaria.
Al implementar, revisar los componentes seleccionados y documentar la lista exacta de dependencias directas agregadas, su finalidad y versiones realmente resueltas en el lockfile.
Esta spec no inventa versiones resueltas ni obliga a instalar todos los paquetes que sugiera un init generico.

## Proteccion de rutas y seguridad

Conservar `BrowserRouter`, `Routes`, `ProtectedLayout` y `Outlet` en modo declarativo.
No crear una nueva capa de guards por cada pagina.
Las rutas `/`, `/conductores`, `/conductores/:id`, `/mapa`, `/solicitudes`, `/tarifas` y `/configuracion` permanecen bajo el guard existente.
Sin sesion se devuelve `Navigate` a `/login` con `replace`; no renderizar el dashboard antes de esa decision.
En Login, sustituir la llamada a `navigate()` durante render por una redireccion declarativa equivalente.
La navegacion tras el envio exitoso puede permanecer en el manejador de evento.
No introducir retorno automatico a la ruta originalmente solicitada: el roadmap fija `/` tras login.

La presencia de token sirve para controlar la UI, no acredita autenticacion ante la API.
El frontend no puede validar la firma HS256 sin exponer un secreto que nunca debe recibir.
No decodificar el JWT para inventar un rol ni confiar en roles enviados por el navegador.
El backend valida firma, algoritmo, expiracion y usuario activo; consulta el rol efectivo en cada peticion protegida.
Un usuario activo sin permiso admin recibe 403; tokens invalidos o usuarios eliminados reciben 401.
Los guards del navegador no sustituyen estos controles aunque oculten las pantallas.

P3 establece no interpretar `expiresIn` como temporizador local: sin nueva peticion, una vista puede permanecer abierta despues de la expiracion hasta recibir un 401 atribuible a la sesion vigente.
Esta limitacion de UX no concede permisos en backend.
El logout elimina credenciales locales, pero no revoca un JWT ya emitido; el backend no tiene lista de revocacion en este contrato.

### Cache entre sesiones (P2)

Reutilizar el QueryClient existente desde AuthContext, sin otro store ni otro cliente.
Retirar las credenciales locales y denegar navegacion de inmediato, sin esperar una cancelacion de red.
Cancelar consultas pendientes y retirar datos cacheados al cerrar sesion manualmente o por un 401 de la sesion vigente.
`queryClient.cancelQueries(filters?, cancelOptions?)` devuelve `Promise<void>`; `queryClient.clear()` devuelve `void` y limpia las caches de consultas y mutaciones.
La cancelacion logica de consultas no garantiza abortar el transporte si la funcion de consulta no consume `AbortSignal`.
No ampliar automaticamente todos los consumidores para incorporar ese soporte.
Verificar que una respuesta tardia no vuelva a mostrar datos de la sesion anterior y que el cierre repetido sea seguro.
No permitir que una limpieza asincrona pendiente elimine datos de una nueva sesion ya iniciada.
La secuencia de cancelacion/limpieza debe respetar la identidad de origen; no ejecutar un `clear()` global tardio sobre B al terminar una espera iniciada por A.
`clear()` no garantiza cancelar mutaciones ni sus efectos de red; P2 sola no neutraliza efectos secundarios de un fetch pendiente.
La correlacion debe proteger tambien eventos, callbacks y escrituras tardias: un exito de A no repuebla datos visibles y un 401 de A no invalida B.
La documentacion de las APIs ya se contrasto; verificar la secuencia concreta con las carreras descritas, sin prometer aborto universal del transporte.

## Referencias Context7

Durante la investigacion previa se cargaron los skills `spec` y `context7-mcp`.
Se resolvieron los IDs antes de consultar: `/remix-run/react-router` y `/reactjs/react.dev`.
En la revision posterior se resolvio `/tanstack/query`; la version instalada `@tanstack/react-query` 5.102.8 se leyo de `node_modules`.
La documentacion actual de TanStack Query v5 consultada no esta fijada al parche exacto 5.102.8.
Context7 no ofrecio una edicion fijada exactamente a React Router 7.18.4 o React 19.3.0; se consultaron fuentes oficiales actuales.
No presentar esos resultados como verificacion exhaustiva de las versiones instaladas.

| Referencia consultada | Consecuencia para esta especificacion |
|---|---|
| [React Router: modos](https://github.com/remix-run/react-router/blob/main/docs/start/modes.md) | `BrowserRouter` corresponde al modo declarativo; no se requiere migrar arquitectura. |
| [React Router: Navigate](https://github.com/remix-run/react-router/blob/main/docs/api/components/Navigate.md) | Redireccion por componente con `replace`; opcion minima coherente con el guard existente. |
| [React Router: middleware](https://github.com/remix-run/react-router/blob/main/docs/how-to/middleware.md) | Los ejemplos Data/Framework no se trasladan directamente al router actual. |
| [React: pureza](https://react.dev/reference/rules/components-and-hooks-must-be-pure) | Navegacion imperativa fuera de render, en manejadores o efectos segun corresponda. |
| [React: useContext](https://react.dev/reference/react/useContext) | Estado/contexto propagan la sesion sin un nuevo gestor global. |
| [TanStack Query v5: QueryClient](https://tanstack.com/query/v5/docs/reference/QueryClient) | `cancelQueries(filters?, cancelOptions?)` devuelve `Promise<void>`; `clear()` devuelve `void` y limpia caches de consultas y mutaciones, sin garantizar cancelacion de efectos de red. |
| [TanStack Query v5: cancelacion](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation) | Abortar transporte requiere consumir `AbortSignal`; distinguir cancelacion de consultas de efectos secundarios de solicitudes pendientes. |
| [shadcn/ui: Vite](https://ui.shadcn.com/docs/installation/vite) | Base para el stack React/Vite/Tailwind; si se usan aliases, sincronizarlos entre Vite y TypeScript. El CLI init puede instalar dependencias y configurar CSS/utilidad `cn`; revisar sus efectos antes de adoptarlos. |
| [shadcn/ui: theming](https://ui.shadcn.com/docs/theming) | Mapear variables semanticas a TaxiSur preservando tokens y estilos existentes, sin copiar un tema global por defecto. |
| [shadcn/ui: components.json](https://ui.shadcn.com/docs/components-json) | Configurar rutas, CSS y aliases coherentes para componentes agregados como codigo local mantenido por el proyecto. |

Las referencias shadcn/ui proceden de la consulta Context7 previa con ID `/shadcn-ui/ui`.
Son documentacion oficial actual, no evidencia de una version del CLI instalada o probada; no se ejecuta el CLI en esta entrega.

La referencia de Navigate recomienda preferir `useNavigate` en general; no se interpreta como prohibicion del componente ni como permiso para invocar el hook imperativamente durante render.
Usar Navigate en el guard es una decision de cambio minimo, no un requisito universal de React.
Estos hallazgos se incorporan de la consulta ya realizada; no constituyen pruebas funcionales ni exigen repetirla sin dudas nuevas.

## Cambios minimos previstos

La tabla describe la implementacion futura autorizada con mocks, no archivos modificados en esta tarea exclusivamente documental.

| Archivo | Cambio futuro |
|---|---|
| `src/pages/Login.tsx` | Adoptar TokenAdmin, validar Bearer estricto, corregir redireccion, completar estados accesibles y aplicar P1; proteger el mensaje de login fallido. |
| `components.json` | Configuracion minima shadcn/ui para las rutas y tema elegidos. |
| `src/components/ui/` | Codigo local de Button, Input, Label y Alert solo segun necesidad del login; adaptar a TaxiSur. |
| Utilidad de clases, si necesaria | Reutilizar una existente o agregar la minima `cn`; fijar su ruta tras revisar componentes, sin crear helpers anticipados. |
| `src/index.css` | Preservar import Tailwind, tokens, Segoe UI y estilos globales; agregar solo mapeo semantico necesario, revisando impacto fuera del login. |
| `package.json` y lockfile existente | Registrar exclusivamente dependencias minimas de componentes/utilidades UI; documentar lista exacta y versiones resueltas al implementar, sin dependencias de pruebas. |
| `vite.config.ts` y configuracion TypeScript aplicable (`tsconfig.app.json` y raiz si necesaria) | Solo aliases si hacen falta; resolucion sincronizada para imports reales, sin otros cambios de infraestructura. |
| `src/api/client.ts` | Extraer mensaje de 401, conservar status y emitir un evento por respuesta con origen correlacionable; preservar resto del contrato y 204. |
| `src/api/client.test.ts` | Evolucionar M06 y cubrir fallback 401, evento unico, correlacion de origen y ausencia de evento en 403. |
| `src/context/AuthContext.tsx` | Invalidar solo la sesion de origen vigente; integrar P2 y proteger B de eventos y limpiezas tardias de A. |
| `src/api/token.ts` | Puede requerir ajuste minimo de identidad de sesion en memoria para capturar el origen de solicitudes y distinguir accesos incluso con token igual; no persistir ni cambiar DTO. |
| Pruebas unitarias focalizadas de sesion, si son necesarias | Cubrir correlacion y carreras con Vitest existente en el archivo adecuado, sin infraestructura de montaje nueva; complementar con UI06 en navegador. |
| `src/api/types.ts`, `src/router.tsx`, `src/App.tsx`, `src/components/Layout.tsx` y demas paginas | Preservados sin cambios previstos; no migrar otras pantallas a la nueva base visual. |

La excepcion UI no autoriza cambios de logica auth/cache por necesidades de la biblioteca ni cambios globales fuera del mapeo aprobado.
No eliminar el guard redundante de Layout como refactor incidental.
No crear servicios, hooks, guards o archivos de pruebas vacios por anticipado.
Si la verificacion descubre una correccion necesaria fuera de esta tabla, registrar el motivo y ajustar el alcance antes de aplicarla.

## Plan de implementacion futuro

P1-P4 estan resueltas y se autoriza comenzar la implementacion futura con mocks sin esperar INT01.
No ejecutar este plan en esta tarea: solo se actualiza el spec y la implementacion permanece no iniciada.
Cada incremento debe dejar compilacion y comportamiento existente utilizables; dividir cambios mayores en incrementos completos de aproximadamente 30-50 lineas cuando sea viable.

1. Evolucionar M06 y pruebas focalizadas de 401/403; actualizar conjuntamente cliente, correlacion de origen y consumidor para conservar mensaje/status/evento sin invalidar otra sesion. Verificar regresiones de 204, Bearer y errores no 401.
2. Adoptar TokenAdmin en Login, retirar alternativas y comprobar respuesta antes de iniciar sesion; verificar exito y respuestas invalidas con red interceptada.
3. Corregir la redireccion de sesion activa sin efectos durante render; comprobar rutas protegidas, recarga y navegacion atras.
4. Incorporar P2 con cancelacion/limpieza segura frente a cambios de sesion; verificar A pendiente, logout, login B y respuestas tardias de A, sin borrar cache B ni restituir datos A.
5. Preparar la base UI minima antes de adaptar el login: registrar referencia visual de pantallas existentes, revisar componentes necesarios y documentar dependencias exactas; incorporar componentes locales/configuracion, utilidad y aliases solo si necesarios, y mapear el tema sin sobrescribir CSS global. Verificar compilacion y ausencia de impacto global.
6. Adaptar controles de login a Button, Input, Label y Alert necesarios, conservando RHF/Zod y logica auth; completar semantica accesible y estados del formulario, teclado, errores y envio pendiente.
7. Aplicar P1 con layout propio institucional de escritorio, conservando tokens visuales y Segoe UI, sin bloques de plantilla.
8. Completar la adaptacion movil y verificar anchos/zoom, tema/contraste y regresion visual UI10 sin alterar otras pantallas.

Primer cambio ejecutable previsto: evolucion de M06 y tratamiento seguro del 401 con correlacion entre cliente y consumidor.
Ultimo cambio funcional previsto: adaptacion responsive del login.
Las verificaciones transversales se ejecutan durante los incrementos y al evaluar los criterios siguientes.

## Criterios de aceptacion

Las casillas reflejan la ejecucion con mocks del 2026-09-23, no integracion real. En la entrega documental original todas permanecian sin marcar. UI08 y UI10 se completaron el mismo dia; INT01 no se ha ejecutado.

- [x] Login consume TokenAdmin y no declara alternativas `accessToken` o `jwt`.
- [x] Login envia las claves exactas del contrato y no transforma la contrasena.
- [x] Respuesta valida crea sesion y navega a `/` con reemplazo de historial.
- [x] Respuesta malformada, token vacio o `tokenType !== 'Bearer'` no crea sesion y muestra error seguro; no se normaliza tokenType.
- [x] Credenciales invalidas muestran el mensaje del backend sin revelar que campo o condicion fallo.
- [x] Todo 401 conserva ApiError 401 y mensaje o fallback, y emite `auth:unauthorized` una vez por respuesta con origen reconocible, incluso con cuerpo invalido.
- [x] Solo el 401 atribuible a la sesion vigente la invalida; un 401 tardio de A conserva error/evento sin cerrar B ni borrar su cache.
- [x] Un 401 de login fallido mantiene visible su error sin borrar el mensaje ni cerrar una sesion posterior.
- [x] M06 evoluciona para leer el mensaje 401 sin eliminarse; cuerpo invalido sigue notificando y 204 permanece sin parseo.
- [x] Un 403 conserva status y mensaje sin emitir `auth:unauthorized` ni cerrar sesion automaticamente.
- [x] Errores de red/servidor dejan el formulario recuperable y no conceden acceso.
- [x] Sin sesion, ninguna ruta del dashboard renderiza su contenido; se redirige a `/login`.
- [x] Con sesion, visitar `/login` redirige a `/` sin aviso React por actualizar el router durante render.
- [x] Recargar una ruta protegida elimina la sesion; no se escribe token en localStorage ni sessionStorage.
- [x] Logout manual y navegacion atras no restituyen acceso al dashboard.
- [x] P2: al cerrar sesion manualmente o por 401 de la sesion vigente se cancelan consultas y se limpia cache; ningun exito tardio de A repuebla datos ni una limpieza asincrona de A elimina datos B.
- [x] P3: no existe temporizador ni refresh; un 401 por expiracion de la sesion vigente la cierra y se documenta que una vista sin nuevas peticiones puede seguir abierta.
- [x] El formulario se opera por teclado, anuncia errores y conserva foco visible; el control de clave no envia el formulario.
- [x] Durante envio no se generan peticiones duplicadas y se muestra estado pendiente.
- [x] P1: escritorio muestra dos columnas y movil una, sin credenciales demo ni cambios de tipografia global.
- [x] P1: los tamanos y zoom de la matriz visual no recortan controles ni producen scroll horizontal.
- [x] La adopcion inicial de shadcn/ui queda limitada al login, con componentes locales necesarios de Button, Input, Label y Alert y layout propio; RHF/Zod, Router y logica auth/cache no se sustituyen por la biblioteca.
- [x] El tema conserva tokens TaxiSur y Segoe UI, primary amarillo con foreground oscuro, surface existente y formulario blanco; foco y contraste se verifican sin fuentes externas, modo oscuro ni animaciones extra.
- [x] UI10 confirma que el CSS/configuracion compartidos no alteran visualmente las paginas existentes ni el shell; no se sobrescriben estilos globales.
- [x] Se documentan dependencias UI exactas y versiones realmente resueltas; configuracion, utilidad y aliases se limitan a lo necesario y estos ultimos se sincronizan si se usan.
- [x] P4: `npm run test:unit` y `npm run build` finalizan correctamente; se documenta cada resultado de navegador.
- [x] No se agregan dependencias fuera de la excepcion minima shadcn/ui ni dependencias de pruebas; no se implementan otras pantallas y se preservan cambios ajenos.
- [x] Se distingue evidencia simulada de integracion real y se registran limitaciones sin declarar pruebas no ejecutadas.
- [ ] INT01 confirma contrato real y acceso con Bearer en entorno autorizado antes de declarar el modulo completo o verificado.

## Estrategia de verificacion

P4 establece Vitest existente para logica HTTP/sesion y comprobaciones reproducibles en navegador para React/rutas.
No instalar Testing Library, jsdom ni un runner E2E ni otras dependencias nuevas de pruebas; la excepcion UI no modifica P4.
Los mocks del cliente no acreditan redireccion de AuthContext: esa parte requiere navegador.

| ID | Caso futuro | Evidencia esperada | Estado |
|---|---|---|---|
| U01 | Evolucion M06: 401 JSON con mensaje anidado | Lectura del mensaje; ApiError 401 con mensaje exacto y un evento con origen. | Pasado 2026-09-23, Vitest |
| U02 | 401 HTML, null o mensaje no string | ApiError 401 con fallback seguro y un evento pese al cuerpo invalido; invalidacion solo si corresponde a sesion vigente. | Pasado 2026-09-23, Vitest + UI05 |
| U03 | 403 JSON | Mensaje/status conservados; ningun evento 401. | Pasado 2026-09-23, Vitest + navegador |
| U04 | Suite cliente restante | 204 sin parseo, Bearer, precedencia no 401 y fallo de red sin regresion. | Pasado 2026-09-23, Vitest |
| U05 | Peticion A, cambio a B y 401 tardio; repetir accesos con token igual y login sin sesion de origen | ApiError 401 y mensaje preservados; un evento identifica origen capturado, no B. Logica de consumidor ignora invalidacion ajena; complementar con UI06. | Pasado 2026-09-23, Vitest + UI06/UI09 |
| UI01 | Login simulado correcto y retorno a `/login` | Inicio visible, sesion en memoria y redireccion sin aviso de render. | Pasado con mocks 2026-09-23 |
| UI02 | Credenciales invalidas y respuesta 200 malformada, incluido tokenType con espacios o distinta capitalizacion | Error visible sin borrarse por evento; sin crear sesion ni acceso al dashboard. | Pasado con mocks 2026-09-23, 15 variantes JSON |
| UI03 | Acceso directo a cada ruta protegida sin sesion | Login visible y ningun contenido privado montado. | Pasado con mocks 2026-09-23, siete rutas |
| UI04 | Recarga, logout y atras | Token ausente y acceso denegado. | Pasado con mocks 2026-09-23 |
| UI05 | 401 de la sesion vigente desde una ruta autenticada; repetir cuerpo invalido | Sesion terminada, login visible y nuevos accesos denegados. | Pasado con mocks 2026-09-23, JSON y HTML |
| UI06 | A con peticion pendiente -> logout -> login B -> 401 de A; repetir con exito tardio de A y limpieza asincrona pendiente | ApiError 401 de A conserva mensaje y un evento; B sigue activa sin redireccion ni borrado de su cache. Exito tardio de A no reaparece ni repuebla datos visibles; limpieza vieja no borra B. | Pasado con mocks 2026-09-23, mismo token y cancelacion retrasada |
| UI07 | Validacion, teclado, visibilidad de clave y envio lento | Errores asociados/anunciados y una sola peticion pendiente. | Pasado con mocks 2026-09-23; no prueba de lector de pantalla |
| UI08 | P1 y tema shadcn/ui: matriz visual y zoom | Dos columnas escritorio/una movil; controles sin desbordamiento, Segoe UI, paleta TaxiSur, formulario blanco y foco/contraste comprobados en estados normal, error y envio. | Pasado 2026-09-23: matriz completa, zoom CSS y zoom nativo del navegador al 200% en 5 viewports x 3 estados sin scroll horizontal |
| UI09 | Login fallido con 401; variante con respuesta fallida tardia tras iniciar sesion B | Error del formulario permanece visible mientras siga en login; el evento tardio no cierra B ni borra su cache. | Pasado con mocks 2026-09-23 |
| UI10 | Regresion visual antes/despues de CSS/tema compartidos en `/`, `/conductores`, `/conductores/:id`, `/mapa`, `/solicitudes`, `/tarifas` y `/configuracion` | Comparacion con mismos datos simulados y viewport escritorio/movil; shell, fuentes, fondos, bordes, foco y controles existentes sin cambios atribuibles a shadcn/ui. Registrar limitaciones previas por separado. | Pasado 2026-09-23: 14/14 PNG historicos identicos byte a byte en ambos viewports; barrido de foco del shell completo en 1365x900 y 390x844 (7 rutas, 7 controles desktop, 10 moviles) con focus-visible y ring presentes, sin controles recortados |
| INT01 | Login contra entorno backend autorizado | Contrato real y acceso con Bearer confirmados sin registrar secretos. | No ejecutado; entorno pendiente |

Para UI01-UI10 interceptar solicitudes con datos y tokens ficticios; no dejar peticiones posteriores sin interceptar.
En las carreras controlar el orden de respuestas; no asumir que cancelar consultas aborte el fetch ni omitir la entrega tardia del 401.
Las respuestas simuladas no demuestran disponibilidad ni integracion del backend.
Restaurar interceptores y limpiar sesion al terminar, tambien si una comprobacion falla.
Registrar por caso fecha, resultado y observacion; para comandos, codigo de salida.
No registrar cuerpos de login reales, contrasenas, JWT ni headers de autenticacion.

INT01 requiere un entorno accesible y una cuenta de pruebas autorizada; no crear usuarios ni modificar bases para desbloquearlo sin permiso.
INT01 permanece pendiente: permite empezar con mocks, pero impide declarar el modulo completo o verificado hasta obtener evidencia real.
No se leyeron `.env` ni secretos para esta especificacion.
`vite.config.ts` no declara proxy; confirmar base API y conectividad/CORS antes de afirmar integracion.
Las pruebas reales de permisos del backend son responsabilidad de sus suites; no se sustituyen por manipular estado React.

## Decisiones y pendientes

### Establecido por documentos o solicitud

- Modulo 2 limitado al login administrativo y su navegacion protegida.
- Sesion en memoria y destino `/` tras login conforme al roadmap frontend.
- Backend responsable de permisos y reglas operativas.
- SPEC 01 reutilizable; el cambio de mensaje 401 es trabajo diferido, no regresion accidental de su alcance anterior.
- Actualizar solo este archivo en esta tarea; P1-P4 aprobadas y ejecucion futura con mocks autorizada, sin iniciar implementacion ahora.
- Correlacion robusta de sesion en memoria: notificacion 401 no equivale a invalidacion incondicional.
- `tokenType === 'Bearer'` estricto, sin normalizacion.

### Decisiones aprobadas

| ID | Decision aprobada | Alternativa descartada y motivo |
|---|---|---|
| P1 | Dos columnas del prototipo con Segoe UI actual; movil de una columna. | Mantener tarjeta actual o introducir fuentes externas no satisface el diseno aprobado o amplia el alcance. |
| P2 | Cancelar consultas y limpiar cache al salir manualmente o por 401 de la sesion vigente, con aislamiento de efectos tardios. | Diferir aislamiento deja riesgo de datos entre sesiones; cancelacion sola no protege de eventos de red tardios. |
| P3 | Expiracion detectada por 401, sin temporizador ni refresh. | Cierre local por `expiresIn` agrega estado temporal no aprobado; se acepta la limitacion de vista abierta sin peticiones. |
| P4 | Vitest existente mas navegador sin nuevas dependencias de pruebas. | Infraestructura nueva de testing de componentes/E2E excede el alcance aprobado; la excepcion UI no habilita dependencias de testing adicionales. |
| UI | shadcn/ui adaptado a TaxiSur solo en login, con componentes locales minimos y excepcion acotada de dependencias/configuracion/tema. | Tema por defecto, bloques de plantilla o migracion global contradicen P1 y amplian el alcance. |

Las preguntas P1-P4 quedaron resueltas por aprobacion explicita, no por el mero guardado del borrador.
La disponibilidad del entorno real es una dependencia de cierre y verificacion mediante INT01, no un bloqueo al inicio con mocks.
Los detalles de implementacion deben satisfacer los contratos y carreras definidos sin imponer infraestructura innecesaria.

### Alternativas no incluidas

- Persistencia local o cookies: cambia la estrategia documentada y excede el modulo.
- Middleware de router o proveedor externo: innecesario para la arquitectura declarativa actual.
- Decodificar rol del JWT: el contrato no lo emite y los permisos efectivos se consultan en backend.
- Redireccion automatica por 403: confunde permiso denegado con autenticacion invalida.
- Rediseno global, fuentes externas y datos demo: amplian el alcance o contradicen un login real.
- Modo oscuro, animaciones extra y paquetes/componentes no utilizados: no necesarios para la adopcion inicial aprobada.

## Riesgos y dependencias

| Riesgo | Tratamiento acordado |
|---|---|
| Leer el body del 401 impide notificacion si falla el parseo. | Mantener evento una vez por respuesta, independiente del exito del parseo; invalidar solo la sesion de origen vigente. |
| Redireccion del 401 de login borra el error del formulario. | Verificar mensaje visible tras permanecer en `/login`; no darlo por resuelto con una prueba HTTP. |
| Cache, callbacks o respuestas tardias cruzan sesiones. | P2 mas correlacion de origen y UI06; no prometer aborto sin consumir AbortSignal ni cancelacion universal de mutaciones por clear. |
| 401 tardio de una sesion previa cierra una sesion nueva. | Evento con origen capturado y consumidor que solo invalida la sesion coincidente; U05/UI06/UI09, incluso ante token repetido. |
| Limpieza asincrona de A borra cache de B. | No ejecutar limpieza global vieja tras una espera sin proteger la identidad de sesion; comprobar en UI06. |
| Token presente pero invalido o rol cambiado. | Backend controla permisos; UI reacciona a 401/403 sin fingir validacion criptografica. |
| Expiracion sin actividad mantiene una pantalla visible. | Limitacion aceptada de P3; no hay temporizador y backend sigue rechazando acceso expirado. |
| Cambiar M06 parece romper SPEC 01. | Documentar evolucion deliberada en futura descripcion de commit: leer mensaje 401, conservar status/evento unico y fallback; no eliminar prueba ni alterar 204. |
| Endpoints disponibles en codigo pero no en el entorno. | Separar mocks de INT01 y registrar bloqueo de integracion si corresponde. |
| Documentacion Context7 no fijada al parche instalado. | Confirmar APIs usadas al implementar; no actualizar el stack para acomodar ejemplos. |
| CSS base o tema generado modifica otras pantallas. | No sobrescribir `src/index.css`; preservar tokens, revisar reglas globales y comparar antes/despues con UI10 ademas del login UI08. |
| Componentes locales y dependencias aumentan mantenimiento. | Incorporar solo componentes/utilidades necesarios, registrar dependencias y versiones reales; el proyecto mantiene el codigo agregado y revisa futuras actualizaciones. |
| Confundir componentes accesibles de base con accesibilidad garantizada. | Verificar semantica, teclado, anuncios, foco y contraste tras adaptar estilos e integrar RHF; UI07/UI08. |

## Evidencia de esta entrega

El borrador original registro investigacion y creacion documental sin aprobar P1-P4; esa restriccion historica fue reemplazada por las decisiones explicitas de esta revision.
Esta entrega actualiza solo `specs/02-autenticacion-admin.md`, incorpora las consultas Context7 previas de TanStack Query y shadcn/ui y mantiene la implementacion no iniciada.
Registra la aprobacion de la base visual y su excepcion futura de dependencias/configuracion/CSS; no instala paquetes, ejecuta CLI ni modifica componentes, configuracion, estilos, package.json o lockfile.
No se ejecutaron build, suites, pruebas de navegador ni login real para verificar los criterios de esta spec.
Los resultados historicos de SPEC 01 no se trasladan como criterios superados de SPEC 02.
La relectura y revision documental solo acreditan la actualizacion del spec, no resultados funcionales.
Todas las casillas permanecen sin marcar; U01-U05, UI01-UI10 e INT01 no ejecutados, con entorno real de INT01 pendiente.
No se realizan commits ni se modifican otros archivos en esta tarea.

## Que no incluye esta spec

- Ejecucion del plan en esta tarea documental, aunque el inicio futuro con mocks esta autorizado y P1-P4 aprobadas.
- Codigo de aplicacion, dependencias nuevas o cambios de configuracion durante esta actualizacion.
- Backend, migraciones, creacion de cuentas, secretos o despliegue.
- Persistencia de sesion, recuperacion de clave, roles multiples o autenticacion de conductores.
- Implementacion de otros modulos, rediseno del shell o edicion de roadmaps.
- Declarar completado el modulo o presentar verificaciones no ejecutadas como exitosas.

## Ejecucion y evidencia

### Autorizacion y plan ejecutado

Fecha: **2026-09-23**, confirmada con `Get-Date -Format yyyy-MM-dd` (salida 0).
Esta seccion sustituye el estado historico de no implementacion, sin borrar la investigacion ni atribuirle resultados nuevos.

Se invoco expresamente `skill("spec-impl")`: devolvio `Skill "spec-impl" not found`. La herramienta solo ofrece context7-mcp, customize-opencode y spec; Git tambien avisa del enlace ausente `.claude/skills/spec-impl/`. No se reparo ni creo infraestructura de agentes. Se ejecuto directamente la spec aprobada por solicitud del usuario y se cargo `context7-mcp` correctamente.

1. Completado: lectura integral de SPEC 02 y SPEC 01, inspeccion de Git/codigo, referencia del prototipo, contrato backend SPEC 03 y reglas de negocio. No se encontraron AGENTS.md en el repositorio.
2. Completado: M06/401, identidad de sesion, consumidor y aislamiento de cache.
3. Completado: validacion runtime de TokenAdmin, navegacion declarativa y login responsive/accesible.
4. Ejecutado con limites: comandos y navegador con mocks; UI08 y UI10 completados al cierre; INT01 pendiente.

No fueron necesarias correcciones funcionales fuera de la tabla de alcance. La utilidad opcional se concreta en `src/lib/utils.ts`. `src/api/types.ts`, router, App, Layout y demas paginas se conservaron. El unico cambio ajeno inicial era esta spec sin seguimiento; durante la ejecucion aparecio un cambio en `.gitignore`, preservado sin editarlo. Sin commits, secretos, lectura de `.env`, cuentas, base de datos, backend o roadmaps.

### Implementacion y dependencias

| Archivos | Resultado |
|---|---|
| `src/api/token.ts` | Revision monotona local; identidad nula sin sesion, distinta en accesos sucesivos aunque el token se repita. No expone credenciales en eventos ni persiste datos. |
| `src/api/client.ts` | Captura origen al enviar. Login publico sin Authorization incluso si existe sesion. 401 parsea mensajes con precedencia existente y fallback, conserva ApiError y emite un solo evento con `detail.sessionId`. Exitos de una sesion retirada rechazan con AbortError, tambien tras esperar el parseo. 204 no parsea JSON. |
| `src/context/AuthContext.tsx` | Solo consume eventos de la identidad vigente. Retira credenciales antes de cancelar; `cancelQueries()` inicia cancelacion y `clear()` ocurre inmediatamente, nunca en una continuacion asincrona. Cierre repetido sin sesion no altera cache nueva. Guards existentes redirigen declarativamente. |
| `src/pages/Login.tsx` | Schema Zod tipado contra TokenAdmin, Bearer literal y vigencia finita positiva; sin numero fijo de expiracion. Payload exacto sin transformacion de clave. Respuestas antiguas/desmontadas no crean sesion ni escriben errores sobre B. Bloqueo de envios, Navigate con replace, errores seguros y semantica accesible. Marca con `brand-mark` amarillo e icono `car`, `shield` en la caracteristica de acceso, `eye` en el control de contrasena y `arrow` en el boton Ingresar: iconos SVG inline (paths del prototipo `references/pantallas/app.js`), sin dependencias nuevas, con `aria-hidden`, `focusable=false` y botones con `aria-label`/`aria-pressed` intactos. |
| `src/components/ui/{button,input,label,alert}.tsx`, `src/lib/utils.ts`, `components.json` | Adaptaciones locales reducidas de shadcn/ui, solo consumidas por Login. Label nativo asociado, Button sin Slot/asChild ni variantes innecesarias, Alert sin iconos/capas no usadas. `cn` concatena solo strings, sin requerir merge/objetos condicionales. Imports relativos; aliases de components.json son rutas del registro, no aliases nuevos de Vite/TS. |
| `src/index.css` | Solo seis tokens semanticos en @theme; no altera tokens originales, fuentes, body ni reglas globales. |
| `src/api/client.test.ts` | M06 evolucionado, no eliminado; ampliado de 20 a 28 pruebas, incluyendo origen publico, mismo token, 403 y exito obsoleto. |

**Dependencias directas agregadas: ninguna.** No hay version resuelta nueva que informar; package.json y package-lock.json no cambiaron. No se ejecuto CLI shadcn ni se instalaron dependencias de pruebas. Codigo fuente shadcn consultado en `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/` (los cuatro archivos homonimos); es una adaptacion local de fuentes actuales, no una version de paquete instalada. `components.json` contrastado con `https://ui.shadcn.com/schema.json` (incluye el campo requerido aliases.utils).

Versiones realmente instaladas, `npm ls --depth=0` (salida 0): React/React DOM 19.3.0, React Router DOM 7.18.4, TanStack React Query 5.102.8, RHF 7.88.0, resolvers 5.9.1, Zod 3.25.76, Tailwind y plugin 4.3.3, Vite 6.4.3, plugin React 4.7.0, TypeScript 5.9.3, Vitest 4.1.11 y tipos React/React DOM 19.3.0.

Context7 consultado en esta ejecucion tras resolver IDs: `/tanstack/query` (cancelQueries inicia cancelacion sincrona, Promise de finalizacion, clear de caches), `/remix-run/react-router` (Navigate/replace), `/shadcn-ui/ui` (componentes/configuracion Tailwind v4). Fuentes actuales no fijadas al parche instalado; la compatibilidad concreta se comprobo con build/navegador. No se actualizaron bibliotecas para seguir los ejemplos.

### Comandos

| Comando | Salida | Resultado real |
|---|---|---|
| `npm run test:unit` tras cliente/sesion | 0 | 1 archivo, 28/28; M06 lee JSON y comprueba evento; M07 conserva 204 sin parseo. |
| `npm run build` tras Login/UI | 0 | TypeScript + Vite, 116 modulos. |
| `npm run test:unit` en revision final | 0 | 28/28. M01-M09, M11, U01-U05 y exito tardio. |
| `npm run build` en revision final | 0 | 117 modulos; CSS 21.54 kB, JS aproximadamente 404.5 kB antes de gzip. |
| `git diff --check` | 0 | Sin errores de espacios; avisos habituales LF/CRLF. |
| `git diff --exit-code -- package.json package-lock.json src/api/types.ts src/App.tsx src/router.tsx src/components/Layout.tsx vite.config.ts tsconfig.app.json` | 0 | Archivos preservados, sin diferencias. |
| `Stop-Process -Id 13668 -ErrorAction Stop` | 0 | Detenido exclusivamente el Vite iniciado para esta verificacion. |

M06 cambia deliberadamente el contrato historico verificado por SPEC 01: ahora SI lee el mensaje del 401, conserva status y evento unico con origen, y usa fallback para cuerpo invalido. No es eliminacion de cobertura ni cambio del 204. No se crea commit; este registro conserva la explicacion solicitada para una futura descripcion de commit.

### Navegador y evidencia por caso

Todas las filas siguientes se ejecutaron el **2026-09-23**, con Playwright disponible y datos ficticios. Vite local se inicio en 127.0.0.1:5173 (PID 13668). Interceptores antes de navegar: todas las rutas API resueltas/rechazadas en memoria, recursos externos bloqueados y solo recursos frontend locales permitidos. Ninguna llamada de integracion backend ni cuenta real.

| Caso | Evidencia observada y limites |
|---|---|
| U01/U02 | Vitest: mensaje anidado exacto, HTML/null/mensaje numerico/vacio con fallback, ApiError 401 y un CustomEvent por respuesta. El consumidor React no se infiere de Vitest: se comprobo en UI05/UI06/UI09. |
| U03/U04 | 403 status/mensaje sin evento; navegador mantuvo sesion. 204 con spy JSON nunca invocado, Bearer, precedencia y errores de red sin regresion en la suite. |
| U05 | Promesas diferidas A->B: tokens distintos, mismo token y origen publico. El evento conserva el id original, no el vigente. Exito tardio con mismo token rechaza AbortError. |
| UI01 | Respuesta simulada Bearer/28800 permitio `/`; visita SPA a `/login` regreso a `/`. No pageerror ni aviso de actualizar router durante render en la ejecucion funcional corregida. Payload comprobado con dos claves exactas, clave ficticia con espacios extremos y ene acentuada sin cambios; Authorization ausente en login. |
| UI02 | 401 mostro `Credenciales invalidas` sin abandonar formulario. 15 JSON invalidos: null, array, objeto vacio, accessToken solo, jwt solo, token vacio/espacios/numerico, tres variantes Bearer con espacios/capitalizacion y expiresIn 0/-1/string/null. Ninguno creo sesion. 200 HTML dio error local seguro, no el contenido. 500 mostro mensaje seguro; fallo de red permitio reintento y posterior exito. NaN/Infinity rechazados por `.finite()` en codigo, no transportados como JSON en navegador. |
| UI03 | Navegacion directa sin sesion a las siete rutas del guard (detalle con id ficticio): redireccion a login, cero botones del shell privado montados. |
| UI04 | Recarga desde sesion activa volvio a login; logout desde Conductores y atras no restituyeron dashboard. localStorage y sessionStorage vacios. Limpieza final comprobo getToken() null del modulo real. |
| UI05 | Cliente real desde sesion autenticada: 401 JSON `Expirada` y 401 HTML. En ambos: un evento, ApiError 401, cache vacia y login. Nuevo login permitido entre variantes. 403 dio `Sin permiso`, cero eventos y sesion activa. |
| UI06 | QueryClient real obtenido del arbol React solo en el arnes, sin export de pruebas en produccion. fetchQuery pendiente A, logout mediante boton, login B con el MISMO token ficticio, respuesta A entregada despues. 401: ApiError `Anterior`, un evento id A, B activa. 200: AbortError, A no repoblo cache. Datos B siguieron en cache y ruta `/`. Se envolvio temporalmente cancelQueries para retrasar la resolucion de su promesa, sin retrasar su cancelacion interna: cache vacia mientras seguia pendiente; al liberar despues de B, B permanecio intacta. Metodo original restaurado. |
| UI07 | Campos vacios: aria-invalid true, descripciones asociadas a `Ingresa tu correo`/`Ingresa tu contrasena`, foco devuelto a correo. Correo mal formado: `Correo no valido`. Tab al boton de clave, Space cambio password->text sin submit, nombre accesible actualizado y anillo de foco medido. Enter envio; tres Enter con red retenida produjeron una sola solicitud, boton disabled y form aria-busy=true. Alert general con role=alert. No se ejecuto lector de pantalla real. |
| UI08 | 1365x900, 768x1024, 390x844, 320x844 y 640x1688 con CSS zoom=2. En cada tamano se midieron normal/error/envio y se capturo pantalla: 15 combinaciones sin overflow horizontal y con controles dentro del viewport. Dos columnas a 1365, una debajo de lg. Complemento con zoom NATIVO del navegador al 200% (ajustes de Chrome, pagina completa): se verificaron 5 viewports efectivos (1365, 768, 390, 320 y 683) x normal/error/envio, con dpr=2, 16 PNG `spec02-zoomnat-*.png`, cero scroll horizontal y sin controles recortados ni desbordados; se restauro el zoom a 100% al terminar. Revision de iconos (2026-09-23): brand-mark amarillo con `car`, `shield`, `eye` y `arrow` verificados en 1365 y 390 (SVG presentes, color taxi computado rgb(246,195,67), sin recorte), boton ojo con aria-label/aria-pressed/type=button intactos y foco por Tab conservado; capturas `spec02-icons-login-1365.png` y `spec02-icons-login-390.png`. No se evaluo teclado de dispositivo movil real. |
| UI09 | Error 401 normal permanecio visible. Variante tardia: retener POST del formulario publico, iniciar B mediante contexto real del arnes, agregar dato B, liberar 401 antiguo; evento sessionId=null, sesion B y cache B intactas, sin redireccion. No se usaron credenciales reales ni un proveedor alternativo. |
| UI10 | Antes de cambios compartidos: 15 capturas, login y siete rutas a 1365x900/390x844. Despues: 14 capturas con los mismos indicadores ficticios y rutas. Comparacion adicional A/B dentro de cada ruta desactivando SOLO los seis tokens nuevos mediante estilo temporal: 14/14 PNG identicos byte a byte. Se retiro el estilo tras cada caso. Comparacion historica completada: 14/14 PNG binarios de antes/despues identicos byte a byte en ambos viewports, y 14/14 de la sesion actual contra las de despues. Barrido de foco del shell completado: en las siete rutas autenticadas (navegacion SPA conservando sesion, con Interceptores de dashboard) se presiono Tab consecutivamente sin mouse; en 1365x900 los 7 controles (6 enlaces de navegacion + Cerrar sesion) y en 390x844 los 10 controles (taxiSur, 6 enlaces, Cerrar sesion, Abrir menú/Cerrar menú) presentaron `:focus-visible` true, ring visible (outline auto 0.8px ubicado/taxicolor y box-shadow en inputs) y ningun control recortado; prueba de foco capturada en `spec02-shell-focus-1365-conductores.png` y `spec02-shell-focus-390-conductores.png`. |
| INT01 | No ejecutada. No se suministro entorno y cuenta autorizados en esta solicitud. No se buscaron secretos ni se crearon usuarios para desbloquearla. Mocks no acreditan CORS, disponibilidad del servicio, firma JWT ni autorizacion real. |

Artefactos de navegador en el directorio de salida de la herramienta, no agregados como infraestructura de pruebas al repo: `.playwright-mcp/spec02-before-login.png`, `spec02-before-{1365,390}-{0..6}.png`, `spec02-after-{1365,390}-{0..6}.png`, `spec02-login-{ancho}-{zoom}-{normal,error,pending}.png`, `spec02-zoomnat-{320,390,768}-CSS{320,390,768}-{normal,error,pending}.png`, `spec02-zoomnat-935-CSS1365-{normal,error,pending}.png`, `spec02-zoomnat-monitor-CSS683-{normal,error,pending}.png`, `spec02-zoomnat-desktop1365-normal.png` y `spec02-shell-focus-1365-conductores.png`/`spec02-shell-focus-390-conductores.png`. Revision de iconos: `spec02-icons-login-1365.png` y `spec02-icons-login-390.png`. Indices 0..6 corresponden a `/`, Conductores, detalle, Mapa, Solicitudes, Tarifas y Configuracion. Los resultados tabulados son evidencia textual duradera; las capturas dependen de la retencion de artefactos de la herramienta.

Colores computados: Segoe UI/system-ui, blanco de formulario, primary rgb(246,195,67), foreground rgb(17,30,47). Contraste calculado con luminancia WCAG: ink/TaxiSur 10.24:1, ink/blanco 16.79:1, slate-600/blanco 7.58:1, error/red-50 5.91:1, slate-300/ink 11.31:1. Foco por teclado: anillo ink de 2px con separacion blanca de 2px. No hay fuentes externas ni animaciones nuevas.

Limitaciones previas conservadas: Home sigue consumiendo `solicitudesCompletadas` en lugar de `solicitudesCompletadasHoy`; con mock contractual 4 muestra 0. Las otras pantallas siguen siendo provisionales. No se corrigieron por estar expresamente fuera de alcance.

Incidencias del arnes, no falsos positivos: un interceptor inicial confundio `/src/api/` con llamadas API y produjo un error MIME; se corrigio y se repitio la matriz funcional. Otra preparacion intento compartir estado entre invocaciones de herramienta, sin persistencia; se sustituyo por ejecuciones autocontenidas. La comparacion historica de PNG no pudo reutilizar buffers entre invocaciones; se resolvio comparando byte a byte los archivos persistidos en el arnes (14/14 identicos en ambos viewports y la sesion actual). El barrido de foco inicial fallo porque `page.goto`/recarga pierde la sesion en memoria (esperado) y barrio el login: se repitio con navegacion SPA conservando sesion e interceptores activos, y un barrido movil se dividio en dos pasos para evitar el timeout del MCP. Una lectura demasiado temprana de validacion dio false y se repitio vaciando ambos campos y esperando errores visibles. Los errores HTTP/red esperados aparecen en consola y no se confunden con errores React. Sin evidencia de integracion real.

Limpieza final comprobada: logout, recarga a login, token null, ambos storages longitud 0, zoom temporal retirado, metodo cancelQueries restaurado e interceptores retirados con `unrouteAll`. Navegador cerrado y proceso Vite propio detenido. No quedan mocks en codigo de aplicacion. Tras el ajuste final de formato/concatenacion de clases se repitieron unitarias (28/28) y build (117 modulos), ambos con salida 0; sin cambios en las clases visuales verificadas.

Complemento de UI08/UI10 (2026-09-23, segunda sesion): reutilice el Vite previo que seguia activo en 127.0.0.1:5173 (PID 22052, iniciado el 2026-09-22) tras confirmar que sirve este proyecto; no inicio otro. El zoom nativo se aplico via ajustes de Chrome (pagina completa, 200%) y se restauro a 100% al terminar. El barrido de foco uso navegacion SPA (pushState/popstate) sobre una sesion en memoria para evitar recargas que la invalidan, comparable a una navegacion por enlaces del shell. Al cierre quedo la pestana del navegador en `/login` sin sesion y la pestana de ajustes de Chrome cerrada; los interceptores del ultimo barrido se retiraron con `unrouteAll`.

### Pendientes y limites de seguridad

- INT01 bloquea declarar modulo completo/verificado. Requiere entorno y cuenta de pruebas autorizados, sin crear usuarios ni buscar credenciales por iniciativa propia.
- Toque real movil/lector de pantalla no evaluados: UI08 y barrido de foco cubren zoom nativo, teclado y orden de tabulacion en navegador de escritorio simulando movil; no sustituyen un dispositivo movil con teclado de software ni un lector de pantalla con verbosidad real.
- P3 conserva la limitacion aprobada: sin nueva peticion una vista puede seguir abierta tras expiracion; no hay temporizador ni refresh, y logout no revoca JWT backend.
- P2 cancela consultas logicamente, no promete aborto del transporte ni cancelacion de efectos de red de mutaciones. No existen mutaciones de negocio en las pantallas actuales. El unico callback de login se protege por revision/montaje; futuros consumidores con escrituras asincronas deben mantener correlacion, no confiar solo en clear().
