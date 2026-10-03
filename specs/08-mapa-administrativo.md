# SPEC 08 - Mapa administrativo

> **Estado:** Implementada y verificada en navegador (2026-10-03). INT08 pendiente.
> **Depende de:** SPEC 01 (`01-fundacion-y-contratos.md`), SPEC 03 (`03-shell-y-navegacion.md`, INT03 pendiente), SPEC 05 (`05-conductores-listado-estados.md`, INT05 pendiente), SPEC 06 (`06-conductor-detalle-vehiculo.md`, INT06 pendiente).
> **Patron de referencia:** SPEC 07 (`07-indicadores-inicio.md`) y SPEC 06 (`06-conductor-detalle-vehiculo.md`).
> **Contrato externo:** `../backend/specs/11-tarifario-dashboard.md` seccion 3.4, y `../docs/ROADMAP_FRONTEND.md:462-518`.
> **Fecha:** 2026-10-02
> **Objetivo:** Construir la pantalla de Mapa con un marcador por conductor sobre React Leaflet y OpenStreetMap, cuatro colores derivados de los enums del DTO, los filtros y el directorio lateral del prototipo, y polling de 15 s que detecta la caducidad de ubicacion sin ningun evento de base de datos.

## Contexto y fuentes

`src/pages/Mapa.tsx` es un stub de diez lineas que solo pinta un encabezado y menciona el endpoint en el subtitulo. No hay mapa, no hay consulta y no hay forma de ver la flota. El endpoint ya esta servido y el tipo central ya existe, de modo que **ningun trabajo de esta spec depende de cambios de backend**.

Dos obstaculos condicionan el trabajo y estan ya resueltos: `ConductorMapa` ya esta declarado en `src/api/types.ts:54-63` con la forma exacta del backend, y la query key `['conductores-mapa']` ya esta reservada por el Modulo 1 para esta pantalla y para la futura invalidacion del Modulo 11.

Lo que no existe es la parte visible: ni Leaflet esta instalado (`package.json` no declara `leaflet`, `react-leaflet` ni `@types/leaflet`), ni hay una hoja de estilos de mapa, ni hay derivacion de color, ni hay estados de carga, error o vacio. El prototipo visual de `references/pantallas/mapa.html` resuelve esa parte, pero con datos ficticios, con una identidad de marcado que el contrato no expone y con dos reglas que contradicen el backend verificado.

| Fuente | Contexto verificado |
|---|---|
| `../docs/ROADMAP_FRONTEND.md:462-518` | Modulo 8: endpoint 12, contrato verificado, color del marcador, decisiones de diseno, criterios de aceptacion. |
| `../docs/ROADMAP_FRONTEND.md:45-49` | La ruta aplica `z.object({}).strict()`: cualquier query string responde `400`. |
| `../docs/ROADMAP_FRONTEND.md:39-43` | Formato de error `{ error: { code, message } }` y codigos observados. |
| `../docs/ROADMAP_FRONTEND.md:31-34` | `/api/dashboard/conductores-mapa` es `requireAdmin`; un token n8n recibe `403`. |
| `../docs/ROADMAP_FRONTEND.md:51-55` | Modulos 1-10 usan polling; Realtime es solo del Modulo 11. |
| `../docs/ROADMAP_FRONTEND.md:496-499` | El amarillo se decide con `ubicacion === null` mas presencia de `ultimaUbicacionRegistradaEn`. |
| `../docs/ROADMAP_FRONTEND.md:501-504` | El color se deriva en el frontend, no en el backend, y debe vivir en un helper puro testeable. |
| `../docs/ROADMAP_FRONTEND.md:506-509` | El polling es **obligatorio** aunque se anada Realtime: la caducidad no produce eventos en la base de datos. |
| `../docs/ROADMAP_FRONTEND.md:484-485` | `ultimaUbicacionRegistradaEn` conserva la fecha aunque `ubicacion` sea `null`. |
| `../docs/REGLAS_DE_NEGOCIO.md` regla 9 | Mas de 5 minutos sin actualizar ubicacion deja al conductor sin elegibilidad. |
| `../backend/src/modules/dashboard/dashboard.router.ts:12` | `GET /conductores-mapa` con `requireAdminLazy`, expuesta como `/api/dashboard/conductores-mapa`. |
| `../backend/src/modules/dashboard/dashboard.service.ts:35-53` | `mapaConductorSelect`: solo `eliminadoEn: null`, sin filtro de aprobacion, jornada, disponibilidad, vehiculo ni GPS; vehiculo proyectado a 4 campos. |
| `../backend/src/modules/dashboard/dashboard.service.ts:57-82` | `aMapaConductorDto`: `ubicacion` a `null` si no es valida o caduca; `ultimaUbicacionRegistradaEn` conserva la fila mas reciente aunque no sea utilizable. |
| `../backend/src/modules/dashboard/dashboard.service.ts:84-95` | Orden `nombreCompleto ASC, id ASC`, sin paginacion, en una transaccion `RepeatableRead`. |
| `../backend/src/modules/dashboard/dashboard.schema.ts:29` | `ultimaUbicacionRegistradaEn: z.iso.datetime().nullable()`. |
| `references/instrution-web/ESPECIFICACION_admin-web.md:27` | "Mapa: **React Leaflet** con OpenStreetMap (gratuito, sin necesidad de API key de Google)". |
| `references/instrution-web/ESPECIFICACION_admin-web.md:90-94` | Seccion 5.5: un marcador por conductor, verde disponible, azul en servicio, gris fuera de servicio o jornada no iniciada, amarillo desactualizada mas de 5 min; "sin control de desplazamiento manual **del conductor**". |
| `references/instrution-web/DOCUMENTACION.md:24` | El prototipo usa Leaflet 1.9.4 y teselas OpenStreetMap, y sus datos son ficticios. |
| `references/pantallas/mapa.html:10-12` | El prototipo carga `vendor/leaflet.css` y `vendor/leaflet.js`. |
| `references/pantallas/app.js:68` | `mapColor` del prototipo: `stale ? amber : estado/salida de servicio ? gray : en_servicio ? blue : disponible ? green : gray`. El amarillo prima sobre el gris. |
| `references/pantallas/app.js:91` | `refreshButton()` con etiquetas `Actualizar` / `Actualizando...`. |
| `references/pantallas/app.js:93-95` | `mapMarkup`: contenedor `.map-wrap`, distintivo `.map-location` y leyenda `.map-legend` con los cuatro estados en texto. |
| `references/pantallas/app.js:140-143` | `mapPage`: cinco chips de filtro con conteo, panel `.map-directory` con boton por conductor y el aviso de los 5 minutos. |
| `references/pantallas/app.js:175-192` | `initMap`: `zoomControl:false`, `scrollWheelZoom` segun vista, centro y zoom, `L.control.zoom` en `bottomright`, `divIcon` con `unit-marker`, `tileerror` con nota superpuesta, `fitBounds` con `padding [75,75]` y `maxZoom 14`. |
| `references/pantallas/app.js:176` | Estado `.map-empty` cuando Leaflet no esta disponible, con enlace a Conductores. |
| `references/pantallas/styles.css` | `.map-wrap`, `.map`, `.map-page`, `.map-filters`, `.filter-chip`, `.dot.green/.blue/.gray/.amber`, `.unit-marker`, `.map-directory`, `.map-person`, `.map-legend`, `.map-location`, `.map-network-note`, `.map-empty`. |
| `src/api/types.ts:1-6,54-63` | `EstadoConductor`, `EstadoJornada`, `EstadoDisponibilidad` y `ConductorMapa` correctos y completos. |
| `src/pages/Mapa.tsx:1-10` | Stub actual, sin consulta ni estilos. |
| `src/router.tsx:27` | Ruta `/mapa` ya montada con `Mapa` como elemento. |
| `src/components/Layout.tsx:80` | Entrada del menu lateral `{ to: '/mapa', label: 'Mapa', icono: 'mapa' }`. |
| `src/lib/indicadores.ts` | Patron mas reciente de helpers puros: clave de query, tabla de presentacion, `retry`, `informacionError`, `intervaloRefresco`, guardas y formateador. |
| `src/lib/conductores.ts:57-80` | `antiguedadUbicacion` distingue `sin-reportes` / `invalida` / `registrada`; `antiguedadParaMostrar` formatea "hace 7 min". Reutilizables tal cual. |
| `src/api/client.ts:42-44,50-52` | El `401` cierra sesion y redirige; el desfase de `sessionId` se convierte en `AbortError`. |
| `src/index.css:7-10` | Tokens `--color-gris`, `--color-azul`, `--color-verde`, `--color-ambar`. |
| `src/pages/Conductores/Lista.css`, `Detalle.css` | Precedente de CSS propio por pantalla cuando las utilidades no alcanzan. |
| `package.json:11-31` | Sin `leaflet`, `react-leaflet`, `@types/leaflet`, `jsdom` ni `@testing-library/react`. React 19.1 y Vitest 4.1.11. |

Las specs locales 01-07 se revisaron. No existia una SPEC 08 frontend al preparar este documento.
`specs/.spec-config.yml` ya existe y no se modifica.
La rama activa es `main`; la opcion `AutoCreateBranch` no se ejecuta en esta entrega documental.

## Alcance

### Requisitos fijos del roadmap y del contrato

- Sustituir el stub `src/pages/Mapa.tsx` por la pantalla real, sin moverla ni renombrarla.
- Consumir `GET /api/dashboard/conductores-mapa` con la query key exacta `['conductores-mapa']`, sin query string y sin parametros.
- Mantener `refetchInterval: 15_000` como unico mecanismo de actualizacion, con pausa cuando la pestana no esta visible.
- Derivar el color del marcador en el frontend, en un helper puro testeable, a partir de los tres enums del DTO mas la presencia o ausencia de `ubicacion` y `ultimaUbicacionRegistradaEn`.
- No recalcular la vigencia de 5 minutos: el backend ya filtro lo caducado. El frontend decide el amarillo con `ubicacion === null` y `ultimaUbicacionRegistradaEn` presente.
- Mostrar un conductor con usuario eliminado: el endpoint solo excluye `eliminadoEn` del propio conductor (P06), y el frontend no debe añadir filtros.
- No reusar el tipo `Vehiculo` del Modulo 1: la proyeccion del mapa tiene 4 campos y no lleva `id` ni `capacidadPasajeros`.
- No enviar, mutar ni abrir endpoints adicionales desde esta pantalla.
- No inventar campos de negocio que el contrato no expone.

### Decisiones de UX aprobadas

Respondidas expresamente por el usuario durante la definicion de esta spec.

| ID | Tema | Decision aprobada | Alternativa descartada y motivo |
|---|---|---|---|
| D1 | Libreria | Instalar por npm `react-leaflet@^5.0.0`, `leaflet@^1.9.4` y `@types/leaflet` (devDependency). | Descartado consumir el Leaflet vendorizado de `references/vendor/`, que existe para el prototipo HTML y llega sin tipos; y descartado usar la API imperativa sin `react-leaflet`, que obliga a escribir a mano el ciclo de vida del mapa. `react-leaflet` 5 es compatible con React 19.1 y `leaflet@1.9.4` es exactamente la version del vendor, asi que no hay divergencia de render respecto al prototipo. |
| D2 | Alcance visual | Replicar la pagina completa del prototipo: cinco chips de filtro con conteo, mapa, directorio lateral, leyenda y el aviso de los 5 minutos. | Descartado el mapa minimo con solo leyenda, que es lo que los criterios del roadmap mencionan: el roadmap declara el prototipo fuente de verdad visual de cada pantalla, y el prototipo de esta pantalla es el mas rico. |
| D3 | Identidad del marcador | Iniciales del conductor sobre el icono de coche en un `divIcon`. | Descartado `Unidad 01` del prototipo: `ConductorMapa` no expone ningun numero de unidad y el roadmap prohibe inventar campos. El `id` existe pero es un identificador tecnico, no un numero de unidad de negocio, y presentarlo como tal seria mentir. Descartado tambien la placa, porque obliga a resolver el caso sin vehiculo. |
| D4 | Precedencia del color | El **amarillo prima sobre el gris**, y `estado !== 'aprobado'` es condicion de gris. La regla reproduce `mapColor` del prototipo (`app.js:68`) sin apartarse de el en ninguna de sus dos partes. | Descartado el gris primando, que esconderia el problema de calidad del dato. Descartado aplicar el roadmap al pie de la letra, que dejaria en verde a un conductor suspendido con disponibilidad registrada, porque el endpoint devuelve todos los conductores no eliminados. Ver la nota completa bajo la tabla de reglas. |
| D5 | Interaccion del mapa | `scrollWheelZoom: false`, `touchZoom: false`, `boxZoom: false`, `doubleClickZoom: false`, con `L.control.zoom` en `bottomright` y arrastre habilitado. | Descartado el mapa completamente inerte, queiteraliza el criterio del roadmap pero pierde la exploracion visual que tiene el prototipo. Ver la nota al pie del criterio de aceptacion correspondiente: el criterio se reinterpreta, no se incumple. |
| D6 | Vista inicial | Centro por defecto en **La Paz, Bolivia** (-16.4897, -68.1193) a zoom 14. En el **primer render con datos que ya tienen marcadores**, un `fitBounds` suave con padding. Despues de ese primer encuadre, la vista **nunca** se cambia sola: ni por polling, ni por cambio de estado de un conductor, ni por llegada de marcadores nuevos. El unico encuadre posterior posible es el que el admin pide al cambiar de chip. | Descartado Tarija como centro, que es una decision ilustrativa del prototipo y no del negocio: el backend opera con zona `America/La_Paz`. Descartado el auto-fit permanente, que reencuadraria la vista cada 15 s y la saltaria al admin. Descartado no encuadrar nunca, porque el admin abriria la pantalla viendo un mapa centrado en La Paz que puede no contener a nadie; el primer encuadre resuelve eso una sola vez. |
| D7 | Distintivo del mapa | Distintivo superpuesto fijo con pin y el texto `La Paz, Bolivia`. | Descartado `La Paz, Bolivia · Ejemplo`: las ubicaciones ya son reales. Descartado quitarlo y descartado hacerlo dinamico, que anade logica para un caso decorativo. Se acepta el riesgo de que el distintivo no coincida con la vista si el admin desplaza el mapa. |
| D8 | Estrategia de pruebas | Unitarios de helpers puros mas recorrido en navegador con llamadas API interceptadas. | Descartado anadir `jsdom` y `@testing-library/react`: renderizar Leaflet en jsdom es fragil, exige stubear la capa de teselas y puede dar falsos positivos sobre el layout real. Es el patron ya establecido por las SPEC 04-07. |
| D9 | Titulo de la pagina | El `h1` dice **`Mapa`**, igual que la entrada del menu lateral, con el subtitulo del prototipo. | Descartado `Mapa de conductores` del prototipo: el titulo de la pagina y el del menu deben coincidir, y cambiar el menu esta fuera de alcance. Mismo criterio que la decision D6 de la SPEC 07 para `Inicio`. |
| D10 | Enlace al conductor | Popup con `Ver conductor` y directorio lateral que navega a `/conductores/:id`. | Descartado el mapa sin navegacion, que dejaria el popup sin salida. El `id` ya viene en el DTO y la ruta ya existe en `src/router.tsx:26`. |
| D11 | Aviso de teselas | El aviso de caida del mapa base se anuncia con `role="status"`, admite un boton de cierre y se oculta solo cuando las teselas vuelven a cargar. | Descartado `role="alert"`: la caida de las teselas es un aviso informativo de un recurso externo, no un fallo de la operacion, y `alert` lo convertiria en una interrupcion ansible ante el lector de pantalla en cada refresco de la capa. Descartado el aviso fijo y permanente, que dejaria un mensaje obsoleto sobre el mapa cuando la red vuelve. |

### Fuera de alcance

- El panel `Tu flota en el mapa` de la pantalla de Inicio (`app.js:106`). Es una vista miniature que este modulo habilita, pero instalarla en `Home.tsx` es trabajo aparte.
- Realtime, WebSockets o suscripcion `postgres_changes`, incluso como disparador de invalidacion (Modulo 11).
- Cualquier mutacion: aprobar, rechazar, suspender, reactivar o reasignar desde el mapa.
- Consultar `conductores`, `conductor-detalle`, `solicitudes-activas`, `tarifas` o `indicadores` desde esta pantalla. El enlace a `/conductores/:id` navega, no consulta.
- Modificar el backend, los contratos, la base de datos, seeds, migraciones o el entorno.
- Modificar `src/api/types.ts`, `src/api/client.ts`, `src/api/token.ts`, `src/context/AuthContext.tsx`, `src/App.tsx`, `src/router.tsx`, `src/components/Layout.tsx`, `specs/.spec-config.yml` ni `../docs/ROADMAP_FRONTEND.md`.
- Modificar `src/pages/Conductores/Detalle.tsx`, aunque hoy rompa `npm run build` con tres errores `TS6133` (`Detalle.tsx:52-54`). Es trabajo sin commit de la SPEC 06 y se documenta como limitacion preexistente.
- Anadir `jsdom`, `@testing-library/react` o cualquier otra libreria de pruebas.
- Agrupamiento visual de marcadores superpuestos (`markerClusterGroup`) o cualquier capa geoespacial mas alla de los marcadores.
- Busqueda de texto en el directorio lateral, paginacion y ordenamiento por columna.
- Editar `src/index.css` salvo el import de `leaflet.css`, que queda sujeto a justificacion en la implementacion.
- Cerrar INT01, INT03, INT04, INT05, INT06 o INT07, ni ejecutar peticiones reales contra el backend.
- Implementar codigo durante esta entrega documental.

## Modelo de datos y contratos

Esta spec no introduce entidades persistentes, DTO de lectura nuevos ni migraciones. Reutiliza `ConductorMapa` de `src/api/types.ts:54-63` tal cual, sin modificarlo y sin duplicarlo.

### Lectura

`GET /api/dashboard/conductores-mapa` requiere administrador y devuelve `ConductorMapa[]` directamente, sin envoltorio ni paginacion.

| Campo | Tipo | Regla de produccion en el backend |
|---|---|---|
| `id` | `string` UUID | Identificador del conductor. Es el unico dato que permite navegar a `/conductores/:id`. |
| `nombreCompleto` | `string` | Orden `nombreCompleto ASC, id ASC`, desempate por `id`. |
| `estado` | `EstadoConductor` | `pendiente \| aprobado \| rechazado \| suspendido`. Sin filtro: llegan los cuatro. |
| `estadoJornada` | `EstadoJornada` | `no_iniciada \| activa \| finalizada`. Sin filtro. |
| `estadoDisponibilidad` | `EstadoDisponibilidad` | `disponible \| no_disponible \| solicitud_pendiente \| en_servicio`. Sin filtro. |
| `vehiculo` | `{ placa, marca, modelo, color } \| null` | Proyeccion de **4 campos**. Sin `id`, sin `capacidadPasajeros`. Vehiculo no eliminado mas reciente (`creadoEn desc, id desc, take 1`). |
| `ubicacion` | `{ latitud, longitud, horaRegistro } \| null` | `null` salvo que la fila mas reciente no eliminada tenga `esValida === true` **y** `now - horaRegistro <= 300000`. |
| `ultimaUbicacionRegistradaEn` | `string \| null` | Fecha ISO de la fila mas reciente **aunque** sea invalida o caducada, y `null` si el conductor nunca reporto. |

Cuatro asimetrias del contrato condicionan la pantalla y cada una rompe una suposicion comoda:

1. **No hay `telefono` ni `cedulaIdentidad`.** El popup y el directorio no pueden mostrar el telefono que si aparece en el listado del Modulo 5.
2. **`vehiculo` no lleva `id` ni `capacidadPasajeros`.** El popup no puede mostrar la capacidad, aunque el prototipo muestre `Unidad NN` y la ficha completa. Con `vehiculo === null` el texto es `Sin vehiculo registrado`.
3. **`ubicacion` ya viene filtrada por vigencia.** El frontend no decide quien esta caducado por reloj: decide por la presencia de `ubicacion`. Recalcular los 5 minutos en el navegador crearia una segunda fuente de verdad que puede discrepar del backend por el desfase entre la respuesta y el render.
4. **`ultimaUbicacionRegistradaEn` sobrevive a `ubicacion: null`.** Es el unico dato que distingue "nunca reporto" de "reporto y caduco", y por tanto lo unico que habilita el amarillo.

El filtro del backend es **solo `eliminadoEn: null`**: un conductor con usuario eliminado permanece en la respuesta (P06) y **debe permanecer en la pantalla**. No se filtra por aprobacion, jornada, disponibilidad, vehiculo ni GPS. La consecuencia es que la lista incluye suspendidos, rechazados y pendientes, y esa lista es la que alimenta los conteos de los chips.

La ruta envia `Cache-Control: no-store` y aplica un esquema de query estrictamente vacio: **los filtros de la pantalla son 100 % cliente**, aplicados sobre el array ya recibido. No se envia nada en el query string.

### Derivacion del color del marcador

`getColorMarcador(conductor)` es un helper puro, sin estado y sin `Date`, porque el reloj ya no interviene: la vigencia la resolvio el backend.

```ts
export type ColorMarcador = 'verde' | 'azul' | 'gris' | 'ambar'
export type CategoriaFiltro = 'todos' | ColorMarcador

export function getColorMarcador(
  conductor: Pick<ConductorMapa, 'estado' | 'estadoJornada' | 'estadoDisponibilidad' | 'ubicacion' | 'ultimaUbicacionRegistradaEn'>,
): ColorMarcador
```

Las reglas se evaluan en orden y la primera que coincide gana:

| # | Condicion | Color | Lectura |
|---|---|---|---|
| 1 | `ubicacion === null` y `ultimaUbicacionRegistradaEn !== null` | **ambar** | Desactualizada: reporto, el backend ya lo dio por caducado, pero la fecha permite decodificar cuanto lleva. |
| 2 | `estado !== 'aprobado'` | **gris** | Suspendido, rechazado o pendiente: no puede recibir trabajo. Reproduce `app.js:68`. Ver la nota de seguridad operativa bajo la tabla. |
| 3 | `estadoJornada !== 'activa'` | **gris** | Fuera de servicio por jornada no iniciada o finalizada. |
| 4 | `ubicacion === null` | **gris** | Sin ubicacion utilizable y sin reporte previo. |
| 5 | `estadoDisponibilidad === 'en_servicio'` | **azul** | Atendiendo un viaje, con ubicacion vigente. |
| 6 | `estadoDisponibilidad === 'disponible'` | **verde** | Registrado como disponible, con ubicacion vigente. |
| 7 | resto (`no_disponible`, `solicitud_pendiente`) | **gris** | No esta en servicio y no esta disponible. |

Las reglas 5 y 6 se alcanzan solo con `ubicacion` no nula, porque las reglas 1 y 4 ya absorbieron ambos casos nulos. Es decir: **verde y azul exigen ubicacion vigente**, tal como pide el roadmap.

La precedencia del amarillo reproduce la del prototipo: `app.js:68` empieza por `d.stale ? 'amber' : ...`, de modo que una ubicacion caducada gana a cualquier situacion operativa. La regla 1 no inventa una prioridad, la conserva.

> **Nota de seguridad operativa sobre la regla 2.**
>
> Esta regla **no** es una mejora aplicada sobre el prototipo: es una reproduccion fiel de `mapColor` (`app.js:68`), que ya evalua `d.status !== 'aprobado' || d.shift !== 'activa'` y devuelve `gray` antes de mirar la disponibilidad. Igual que el prototipo, la pantalla coloca a un conductor no aprobado en gris aunque su `estadoDisponibilidad` diga `disponible`.
>
> La fuente de verdad que esta spec completa es el **roadmap**, no el prototipo. `ROADMAP_FRONTEND.md:494-495` enumera el gris como «jornada no iniciada/finalizada, `no_disponible`, `solicitud_pendiente`, o sin ubicacion» y **no menciona el estado del conductor**. Aplicado al pie de la letra sobre el conjunto real de la respuesta, ese enunciado pintaria de **verde** a un conductor `suspendido` con disponibilidad registrada y ubicacion vigente, comunicandole al admin disponibilidad operativa sobre una cuenta que, por la Regla 12, no puede ni iniciar jornada ni ponerse disponible. Ese es el riesgo que la regla 2 cierra.
>
> La mejora es, por tanto, **respecto del roadmap y respecto de la implementacion ingenua que este mismo roadmap podria inducir**, y es de seguridad operativa: el mapa no debe sugerir que un conductor suspendido puede tomar trabajo. No es una desviacion arbitraria del diseno, y las unitarias de U01 la fijan para que nadie la simplifique despues.
>
> Lo que **si** es una divergencia deliberada del prototipo esta en el conteo, no en el color: `mapPage` (`app.js:142`) envuelve los chips y el directorio en `state.drivers.filter(d => d.status === 'aprobado')`, de modo que el prototipo **oculta por completo** a los conductores suspendidos, rechazados y pendientes. Esa pantalla no los colorea de gris: directamente no existen para el admin. Ver la nota de conteo mas abajo.

El color nunca es el unico portador de significado: cada marcador lleva ademas el `title` descriptivo, cada fila del directorio lleva la etiqueta textual de su estado y la leyenda enumera los cuatro estados con texto.

### Categorias de filtro

Los cinco chips replican `app.js:142`. La categoria de un conductor es su color, mas el color `todos` que no corresponde a ningun conductor.

```ts
export const CATEGORIAS_FILTRO: readonly { clave: CategoriaFiltro; etiqueta: string; color: ColorMarcador | null }[]
export function categoriaDe(conductor: ConductorMapa): ColorMarcador
export function conductoresVisibles(conductores: ConductorMapa[], categoria: CategoriaFiltro): ConductorMapa[]
export function conteoPorCategoria(conductores: ConductorMapa[]): Record<CategoriaFiltro, number>
export function conductoresConUbicacion(conductores: ConductorMapa[]): ConductorMapa[]
```

| Clave | Etiqueta visible | Punto de color | Cuenta |
|---|---|---|---|
| `todos` | Todos | ninguno | Todos los conductores de la respuesta |
| `verde` | Disponibles | verde | `getColorMarcador === 'verde'` |
| `azul` | En servicio | azul | `getColorMarcador === 'azul'` |
| `gris` | Fuera de servicio | gris | `getColorMarcador === 'gris'` |
| `ambar` | Desactualizados | ambar | `getColorMarcador === 'ambar'` |

El conteo se calcula **sobre el conjunto completo de conductores no eliminados**, nunca sobre el subconjunto aprobado. El prototipo hace lo contrario en `mapPage` (`app.js:142`), donde los chips y el directorio se construyen sobre `state.drivers.filter(d => d.status === 'aprobado')`: los conductores suspendidos, rechazados y pendientes **no se muestran ni se cuentan**, ni siquiera como grises. Esa es la divergencia deliberada del prototipo en esta pantalla, y tiene la misma justificacion de seguridad operativa que la regla 2: si el conductor no aparece en ningun conteo, el admin no puede ni sospechar que existe. Se mantiene, por tanto, el color del prototipo y se corrige su cobertura.

`conductoresConUbicacion` existe porque el conjunto que se pinta y el conjunto que se lista **no son el mismo**: un conductor sin ubicacion no tiene coordenada, asi que no puede marcarse, pero sigue apareciendo en el directorio con su color y su motivo. El titulo del directorio declara cuantos hay en total, no cuantos hay pintados.

### Helpers de presentacion y de lectura

Todos en `src/lib/mapa.ts`, todos puros y testeables sin render.

| Export | Proposito |
|---|---|
| `CLAVE_CONDUCTORES_MAPA` | `['conductores-mapa'] as const`. Identica a la del Modulo 1 y a la que invalidaria el Modulo 11. |
| `CENTRO_INICIAL_MAPA` | `[latitud, longitud]` de La Paz (-16.4897, -68.1193). |
| `ZOOM_INICIAL_MAPA` / `MAX_ZOOM_MAPA` | 14 en ambos casos, el zoom de la vista completa del prototipo (`app.js:179`) y el tope del `fitBounds` (`app.js:191`). |
| `ETIQUETAS_COLOR` | `Record<ColorMarcador, string>`: los cuatro estados en texto, para leyenda, directorio, popup y `aria-label`. |
| `inicialesParaMostrar(nombreCompleto)` | Iniciales para el `divIcon`. Nunca devuelve cadena vacia. |
| `antiguedadUbicacionParaMostrar(conductor, ahora)` | Envuelve `antiguedadUbicacion` y `antiguedadParaMostrar` de `src/lib/conductores.ts:57-80` y devuelve el texto listo para el popup y el directorio. |
| `textoVehiculoParaMostrar(conductor)` | `Sin vehiculo registrado` o la placa. |
| `estadoParaMostrar(conductor)` | La etiqueta textual que acompaña siempre al color. |
| `retryMapa(failureCount, error)` | Reintenta solo `5xx` y `TypeError`, como maximo una vez. |
| `informacionErrorMapa(error)` | Traduce `ApiError.status` a `{ mensaje, recuperable }`. Sin parsear texto. |
| `intervaloRefrescoMapa({ visible, enCurso })` | `15_000` con la pestana visible y sin lectura manual en curso; `false` en cualquier otro caso. |
| `puedeDispararRefrescoMapa(enCurso)` | Evita dos lecturas manuales simultaneas. |

`antiguedadUbicacionParaMostrar` **importa** los dos helpers existentes en lugar de reimplementarlos. `antiguedadUbicacion` ya distingue `sin-reportes`, `invalida` y `registrada`, que es exactamente la distincion que necesita esta pantalla, y su comentario documenta que una fecha no interpretable no debe simular ausencia. Reimplementarlo duplicaria esa logica, que la SPEC 07 ya senalo como deuda.

El `html` del `divIcon` se construye **solo con las iniciales**, nunca con `nombreCompleto`. `divIcon` acepta HTML en crudo y escapa `MapContainer` no lo hace: meter el nombre completo ahi abriria una via de inyeccion. El nombre aparece solo en el popup y en el directorio, que son contenido de React y escapan por defecto.

## Presentacion y comportamiento

### Estructura de la pantalla

`src/pages/Mapa.tsx` reproduce `app.js:140-143` con las utilidades de Tailwind y las clases de `src/pages/Mapa.css`:

```
Encabezado  -> h1 "Mapa" + subtitulo del prototipo + boton Actualizar
Fila de chips -> Los cinco, con aria-pressed, punto de color y conteo
Panel
  |- Mapa (flex-1)  -> distintivo "La Paz, Bolivia" + estado vacio + aviso de teselas
  |- Directorio (lateral) -> total, lista de conductores, pie informativo
Leyenda
Aviso de los 5 minutos
```

El encabezado conserva el patron de las otras pantallas: `h1` con `font-display text-2xl font-bold text-ink-950` y subtitulo `mt-1 text-sm text-gris`. El subtitulo es el del prototipo: `Consulta la ultima ubicacion reportada por cada conductor.`

### Mapa

- `MapContainer` con `center={CENTRO_INICIAL_MAPA}`, `zoom={ZOOM_INICIAL_MAPA}`, `scrollWheelZoom={false}`, `touchZoom={false}`, `boxZoom={false}`, `doubleClickZoom={false}`, `zoomControl={false}` y `attributionControl` activo.
- `L.control.zoom` en `bottomright`, como `app.js:181`.
- Capa de teselas de OpenStreetMap con la atribucion de `app.js:180` y `maxZoom: 18`. La red es una dependencia de runtime y no se mitiga.
- `MapContainer` necesita una altura explicita: el contenedor usa `h-[...]` y `Mapa.css` define la altura minima, porque Leaflet no calcula alto desde el contenido.
- El distintivo superpuesto dice `La Paz, Bolivia` con icono pin decorativo (`aria-hidden="true"`).

### Marcadores y ventana emergente

- Un `Marker` por cada elemento de `conductoresConUbicacion(...)`, en `[ubicacion.latitud, ubicacion.longitud]`, con `keyboard: false` porque el Leaflet por defecto expone marcadores que React no controla y que no son fiables al teclado. La via accesible equivalente es el directorio.
- `icon` es un `divIcon` con una clase propia (`unit-marker`) y las iniciales dentro. El icono PNG por defecto de Leaflet **no** se usa: sus rutas de imagen no resuelven bajo el empaquetador de Vite, y un `divIcon` permite ademas colorear el marcador por estado sin CSS global.
- El `title` del marcador describe al conductor con texto: nombre, estado y, si aplica, que la ubicacion esta desactualizada. Es la segunda via de lectura del color.
- El `Popup` muestra: nombre completo, la etiqueta textual del estado, la placa y `marca modelo · color` cuando hay vehiculo, el texto de antiguedad de la ubicacion, y el boton `Ver conductor` que navega a `/conductores/:id`. Con `vehiculo === null` aparece `Sin vehiculo registrado`. **Nunca** muestra `capacidadPasajeros` ni `telefono`.
- La ventana emergente es de solo lectura: no hay controles de mutacion ni botones de transicion de estado.

### Directorio lateral

- Cabecera con el total de conductores de la respuesta y la frase `Selecciona una unidad para localizarla`, adaptando `app.js:142` porque ya no hay unidades numeradas.
- Una fila por conductor del filtro activo: iniciales, nombre, placa y el estado en texto mas la antiguedad cuando exista.
- Conductor **sin** `ubicacion`: aparece igualmente, con su color y con `Ubicacion desactualizada` o `Sin ubicacion reportada` segun tenga o no `ultimaUbicacionRegistradaEn`. No se oculta.
- Clic en la fila: centra el mapa en ese conductor y destaca su marcador.
- La fila incluye el enlace a `/conductores/:id` (D10). El enlace y el recentrado son dos acciones separadas: el enlace no debe disparar el recentrado al pulsarlo.
- Estados vacios diferenciados, como los dos textos de `empty()` en `app.js:142`: sin ningun conductor en la respuesta, frente a ningun conductor en el filtro activo.

### Chips, leyenda y aviso

- Los chips replican `app.js:142` con `aria-pressed` y el conteo de `conteoPorCategoria`. `Todos` no lleva punto de color.
- El filtro activo se conserva al cambiar de datos: si un conductor sale del filtro activo en un refetch, el chip sigue seleccionado y la lista muestra el estado vacio de filtro, no un salto a `Todos`.
- La leyenda replica `app.js:94` con los cuatro estados en texto y su punto de color.
- El aviso final replica `app.js:142`: `Una ubicacion con mas de 5 minutos de antiguedad se muestra en amarillo y deja de ser elegible para recibir nuevas solicitudes.` Es texto informativo, no un error, y lleva icono decorativo.

### Encuadre de la vista

La vista tiene **tres** momentos de cambio, y solo uno de ellos es automatico.

`fitBounds` se dispara en el **primer render con datos que ya tienen marcadores** y **al cambiar de chip de filtro**. Nunca en un refetch de polling.

| Situacion | Vista resultante | Automatica |
|---|---|---|
| Montaje de la pantalla, antes de tener datos | La Paz, zoom 14. | no aplica |
| **Primer render con datos y con al menos un marcador** | `fitBounds` **suave** (animado) de esos marcadores, `padding: [75, 75]`, `maxZoom: 14`. Deja ver la flota entera de inmediato. | si, **una sola vez** |
| Primer render con datos pero **ningun** marcador | No se llama a `fitBounds`; se mantiene La Paz y se muestra el estado vacio. El guardia **no** se consume. | no |
| Lecturas posteriores, con o sin marcadores nuevos | La vista **no se toca**, ni aunque cambien las coordenadas o los colores de los marcadores. | no |
| Cambio de chip con marcadores visibles | `fitBounds` de ese subconjunto, `padding: [75, 75]`, `maxZoom: 14`. | no, lo pide el admin |
| Cambio de chip sin ningun marcador | No se llama a `fitBounds`; se mantiene la vista actual y se muestra el estado vacio de filtro. | no |

"Suave" significa que el encuadre se anima en lugar de saltar. La animacion importa en el primer render porque el admin acaba de entrar y un salto le moveria el mapa sin que entienda por que; en los cambios de chip la animacion es indiferente porque el admin acaba de provocar el cambio.

El guardia del primer encuadre es un ref que **se consume solo cuando el encuadre ocurre de verdad**, es decir, cuando hay datos confirmados y al menos un marcador con `ubicacion`. Si la primera respuesta llega vacia, el guardia sigue activo y el primer encuadre se produce en la lectura siguiente que traiga marcadores. Una vez consumido, no vuelve a activarse durante la montaje de la pantalla.

`fitBounds` se implementa con un componente hijo que consume `useMap()` y reacciona a un efecto con dependencia en la categoria del filtro y en el guardia del primer encuadre, **nunca** en el array de conductores. Depender de los datos seria exactamente el error que reencuadra cada 15 s.

El `fitBounds` de los cambios de chip es un efecto mas lento que el del primer encuadre porque su dependencia es la categoria; el del primer encuadre depende ademas del guardia. Si en un mismo render ocurrieran ambos, prevalece el del cambio de chip, porque es el moviento mas reciente e intencionado por el admin.

### Estados de lectura

| Situacion | Comportamiento |
|---|---|
| Carga inicial pendiente | El area del mapa muestra un estado de carga; los chips muestran `–` en los conteos; el directorio declara que se esta cargando. No se inventan ceros ni numeros de ejemplo. |
| Lectura correcta | Marcadores, chips con conteos reales y directorio. Un conteo real de `0` se muestra como `0`, distinguible del `–` de carga. |
| Lectura correcta sin ningun conductor | Estado vacio sobre el mapa con enlace a Conductores (`app.js:176`), directorio vacio y los cinco chips a `0`. |
| Refresco en vuelo con datos previos | Se conservan los valores confirmados; no se vuelve al esqueleto; el boton queda en `Actualizando...`. |
| Error de red o `5xx` con datos previos | Se conservan los valores confirmados y se superpone un aviso no bloqueante de posible desactualizacion, con `Reintentar` cuando el error es recuperable. |
| Error de red o `5xx` sin datos previos | Estado de error con `Reintentar`. No se presenta como un mapa vacio. |
| `403` | Se muestra el `message` del backend. No cierra sesion. |
| `404` de ruta | Se muestra el mensaje recibido. Sin recuperacion especifica: es un caso de despliegue. |
| Peticion cancelada por React Query | No se muestra como error. |

El aviso de desactualizacion usa `role="status"` y el error sin datos usa `role="alert"`. Ningun control queda `aria-busy` de forma permanente; la actividad deliberada se anuncia solo durante la lectura manual.

### Refresco

- `refetchInterval` se resuelve por funcion con `intervaloRefrescoMapa({ visible, enCurso })`.
- El boton `Actualizar` convive con el polling y **no** lo reemplaza. Sus etiquetas son `Actualizar` y `Actualizando...`, como en `app.js:91`.
- `Actualizar` y `Reintentar` comparten la guarda `puedeDispararRefrescoMapa`, mas un ref sincrono que se activa al pulsar: en la SPEC 07 tres clics en el mismo tick produjeron tres lecturas porque el estado `disabled` de React no se actualiza hasta el siguiente render. **Ese defecto no debe repetirse.**
- El polling es la unica actualizacion. No hay Realtime ni siquiera como invalidacion del Modulo 11: la caducidad de ubicacion es el caso que ningun evento de base de datos puede señalar, y por eso el polling es obligatorio (`ROADMAP_FRONTEND.md:506-509`).

### Estilos

`src/pages/Mapa.css` es una excepcion consciente a la regla que aplico la SPEC 07 de no crear CSS de pagina, y se justifica:

1. **Tailwind no alcanza el DOM que Leaflet crea fuera del arbol de React.** El contenido de la ventana emergente se renderiza en React, pero el control de zoom, el contenedor de la capa de teselas y el `divIcon` los crea Leaflet en un arbol propio. Ninguna utilidad de Tailwind llega ahi.
2. **Ya existe precedente en el proyecto:** `src/pages/Conductores/Lista.css` y `src/pages/Conductores/Detalle.css`.
3. **El prototipo tiene estas reglas resueltas** en `references/pantallas/styles.css`, incluida la posicion del distintivo, la leyenda y la nota de teselas.

Las clases necesarias son `.mapa-panel`, `.mapa-marcador` con sus cuatro variantes de color, `.mapa-distintivo`, `.mapa-leyenda`, `.mapa-directorio`, `.mapa-persona`, `.mapa-nota-teselas` y `.mapa-vacio`. **Todos los colores salen de los tokens de `src/index.css:7-10`**; no se introduce ningun hexadecimal nuevo. `leaflet.css` del paquete se importa desde `src/index.css` o desde `src/main.tsx`, nunca desde el vendor.

Riesgo a verificar durante la implementacion, no a dar por cierto: Tailwind v4 genera una capa de utilidades que puede pisar parte de los estilos `.leaflet-*`. Si aparece el conflicto, se resuelve aislando las reglas de Leaflet, no reescribiendo las del mapa.

## Errores

`ApiError` expone solo `status` y `message`. La decision se toma por `status`, **nunca parseando el texto del mensaje**.

| HTTP / codigo backend | Mensaje exacto | Comportamiento de la pantalla |
|---|---|---|
| 400 `VALIDATION_ERROR` | `Entrada invalida` | Solo posible si se envia un query string, que esta spec prohibe. Mostrar el mensaje; no reintentar. |
| 401 `UNAUTHORIZED` | `Credenciales invalidas` | Cierre de sesion y redireccion ya existentes en `client.ts:42-44`. La pantalla **no** maneja el 401 ni duplica esa logica. |
| 403 `FORBIDDEN` | `Permiso denegado` | Aviso con el mensaje; `recuperable: false`; no cierra sesion. |
| 404 `NOT_FOUND` | `Ruta inexistente` | Mostrar el mensaje. Sin `Reintentar` automatico. |
| 5xx `INTERNAL_ERROR` | `No se pudo completar la operacion` | Aviso recuperable con `Reintentar`. |
| Red (`TypeError`) | Error de transporte | Aviso recuperable con `Reintentar`. |

No se escribe en pantalla ningun codigo interno: solo el mensaje recibido y la distincion entre recuperable y no recuperable.

La caida de las **teselas** no es un error de la pantalla: el mapa base es una dependencia externa y su fallo no invalida los marcadores. Se replica la condicion de `app.js:184`, que dispara el aviso cuando fallan mas de tres teselas sin que ninguna haya cargado. Si Leaflet no llega a cargarse en absoluto, se muestra el estado de `app.js:176` con enlace a Conductores.

El aviso tiene su propio ciclo de vida, gobernado por tres contadores observables en la capa de teselas (`carregadas`, `fallidas`, `descartado`):

| Estado | Como se entra | Que muestra | Como se sale |
|---|---|---|---|
| `oculto` | Inicial, o tras una recuperacion | Nada | Aparece al superar tres fallos con cero teselas cargadas |
| `visible` | `fallidas > 3` y `carregadas === 0` | El aviso con `role="status"` y su boton de cierre | Al cerrar, o al cargar la primera tesela |
| `descartado` | El admin pulsa el boton de cierre | Nada | Al cargar la primera tesela, que **restablece** el estado a `oculto` |

Cuatro reglas gobiernan ese ciclo:

1. **`role="status"`, nunca `role="alert"`.** Es una nota informativa sobre un recurso externo. Con `alert` el lector de pantalla interrumpiria al admin cada vez que el mapa se monta, y el mapa se monta en cada navegacion a esta pantalla.
2. **El boton de cierre es opcional para el usuario**, no un requisito de lectura: el aviso es texto informativo, no informacion que el admin deba procesar. Lleva etiqueta accesible propia y no se oculta solo por tiempo.
3. **La recuperacion lo oculta automaticamente.** En cuanto carga la primera tesela, el aviso desaparece sin pedir nada. Un aviso que sobrevive a la recuperación del mapa miente sobre el estado de la red.
4. **La recuperacion tambien limpia el descarte.** Si el admin habia cerrado el aviso y la red vuelve, el estado vuelve a `oculto` y un fallo posterior si puede volver a mostrarlo. Lo que se conserva entre reinicios no es el descarte, sino la cuenta de fallos.

El boton de cierre, si se pulsa mientras el mapa sigue sin red, deja el aviso oculto durante el resto de la vida de esa montaje del mapa: no se reabre por un fallo adicional mientras la red siga caida, porque reavisar cada tesela que falla seria peor que callar.

El estado del aviso es local a la pantalla y **no se persiste**: recargar la pagina vuelve al estado inicial, con la misma vida que la montaje del mapa.

## Cache, concurrencia y sesion

- La query key es exactamente `['conductores-mapa']`, la definida en el Modulo 1 y la que invalidaria el Modulo 11. No se renombra.
- No hay mutaciones: no hay publicacion optimista, ni `setQueryData`, ni reconciliacion tras escrituras.
- Con datos previos, un fallo conserva la ultima lectura confirmada: React Query mantiene `data` y expone `isError` por separado, y la pantalla no borra la cache para "limpiar" el error. Un `refetch` fallido no vacia el mapa.
- La pantalla no altera `['configuracion']` ni ninguna otra clave.
- Cerrar sesion limpia la cache por el camino ya existente en `AuthContext.tsx:18-25`; no se anade limpieza propia.
- Una respuesta tardia de la sesion A no debe pintarse en la sesion B: `client.ts:50-52` convierte el desfase de `sessionId` en `AbortError` y React Query descarta la query cancelada. La pantalla distingue cancelacion de fallo y no anuncia ese descarte.
- No se persiste nada en `localStorage`: ni el filtro activo, ni la vista del mapa, ni una copia de la ultima lectura.
- El backend no ofrece version, `ETag` ni precondiciones. Dos lecturas consecutivas pueden diferir por operaciones concurrentes; es esperado y no se mitiga.
- Los marcadores se reconstruyen en cada render a partir del array recibido. No hay reconciliacion de identidad entre respuestas: un conductor que cambia de color lo hace porque su `estadoDisponibilidad` cambio en el backend, no por una transicion local.

## Accesibilidad y movil

- Un unico `h1` por pantalla, que dice `Mapa`, igual que la entrada del menu lateral.
- El contenedor del mapa lleva un `aria-label` descriptivo del contenido y de su origen. El mapa **no** es la unica via de informacion: el directorio lateral lista los mismos conductores con su estado en texto.
- Los marcadores van con `keyboard: false`, asi que **no** son alcanzables por teclado. Es una decision consciente: el directorio lateral, compuesto de botones y enlaces nativos, es la via accesible equivalente y debe estar completo.
- El boton de la ventana emergente y el enlace del directorio son enlaces nativos con foco visible.
- Los chips son botones nativos con `aria-pressed`, como en `app.js:142`, y cada uno anuncia su categoria y su conteo.
- La leyenda es texto: no depende del color. El punto de color es decorativo y lleva `aria-hidden="true"`, igual que los iconos y que el punto del pie de las tarjetas de la SPEC 07.
- Los iconos son SVG inline decorativos con `aria-hidden="true"` y `focusable="false"`. No se instala ninguna libreria de iconos.
- El aviso de desactualizacion usa `role="status"`; el error sin datos, `role="alert"`.
- La leyenda y el aviso de los 5 minutos son texto real y no dependen de ningun color.
- Sin scroll horizontal a 320 px ni con zoom 200 %. Por debajo del breakpoint de tablet el directorio pasa de columna lateral a bloque bajo el mapa, que es lo unico que hace el mapa legible en movil.
- No se ejecuto lector de pantalla en esta entrega. Si la implementacion tampoco lo hace, debe declararse como limitacion y no como criterio cumplido.

## Archivos previstos

### Verificaciones previas obligatorias

Dos comprobaciones se ejecutan **antes de escribir la primera linea de la pantalla**, porque ambas condicionan decisiones de esta spec y no tienen sentido descubiertas a mitad del trabajo.

| # | Verificacion | Para que | Como |
|---|---|---|---|
| V-P1 | Estado base de `npm run build` | D10 depende de que `/conductores/:id` sea alcanzable | Ejecutar `npx tsc -b --force` y registrar la salida **antes** de tocar nada. Se espera exactamente `TS6133` en `Detalle.tsx:52-54` y ningun otro error. Si aparece cualquier error adicional, es una regresion heredada de otra spec y se documenta antes de continuar. |
| V-P2 | Interaccion de Tailwind v4 con `leaflet.css` | D1 y los estilos del mapa | Tras instalar las dependencias e importar `leaflet.css`, montar un `MapContainer` minimo y revisar si algun estilo `.leaflet-*` (`.leaflet-container`, `.leaflet-control-zoom`, `.leaflet-popup-content`) pierde contra las utilidades de Tailwind v4. |

Sobre V-P1 hay una precision que evita un diagnostico equivocado: `npm run build` es `tsc -b && vite build`, de modo que los tres `TS6133` **detienen el empaquetado pero no afectan al servidor de desarrollo**, que no type-checkea. El enlace `Ver conductor` de D10 es, por tanto, funcional en `npm run dev` aunque `npm run build` falle. La verificacion de D10 es que la ruta renderiza y muestra el detalle, no que el build pase.

Si V-P1 revela que el error impide incluso arrancar el dev server —lo que no ocurriria con un error de tipo, pero conviene comprobarlo—, la reparacion de `Detalle.tsx:52-54` **sigue estando fuera de esta spec**: se documenta y se devuelve a la SPEC 06. Esta spec no edita ese archivo bajo ninguna circunstancia.

Remedio previsto para V-P2, en orden de preferencia: declarar el orden de capas de forma explicita; si no basta, mover el import de `leaflet.css` de `src/index.css` a `src/main.tsx`; y solo como ultimo recurso, envolver las reglas de Leaflet en una capa de menor prioridad. **En ningun caso se corrige pisando los estilos de `Mapa.css`**, porque se perderia el origen del problema.

### Cambios

| Archivo | Cambio |
|---|---|
| `specs/08-mapa-administrativo.md` | Este documento. |
| `src/lib/mapa.ts` | Nuevo: `CLAVE_CONDUCTORES_MAPA`, `ColorMarcador`, `CategoriaFiltro`, `CATEGORIAS_FILTRO`, `ETIQUETAS_COLOR`, `CENTRO_INICIAL_MAPA`, `ZOOM_INICIAL_MAPA`, `MAX_ZOOM_MAPA`, `getColorMarcador`, `categoriaDe`, `conductoresVisibles`, `conteoPorCategoria`, `conductoresConUbicacion`, `inicialesParaMostrar`, `antiguedadUbicacionParaMostrar`, `textoVehiculoParaMostrar`, `estadoParaMostrar`, `retryMapa`, `informacionErrorMapa`, `intervaloRefrescoMapa`, `puedeDispararRefrescoMapa`. |
| `src/lib/mapa.test.ts` | Nuevo: unitarios de los helpers puros. |
| `src/pages/Mapa.tsx` | Reescrito dentro del mismo archivo y la misma ruta: mapa, chips, directorio, leyenda, aviso y estados. |
| `src/pages/Mapa.css` | Nuevo: estilos del panel, del marcador por color, del distintivo, de la leyenda, del directorio y de los estados vacios y de la nota de teselas. Todos los colores desde los tokens. |
| `package.json` | Nuevas dependencias: `leaflet`, `react-leaflet` en `dependencies`; `@types/leaflet` en `devDependencies`. |

No se prevén cambios en `src/api/types.ts`, `src/api/client.ts`, `src/api/token.ts`, `src/context/AuthContext.tsx`, `src/App.tsx`, `src/router.tsx`, `src/components/Layout.tsx`, `src/lib/conductores.ts`, `src/pages/Conductores/*`, `specs/.spec-config.yml` ni `../docs/ROADMAP_FRONTEND.md`.

Un unico import de `leaflet.css` es necesario y su ubicacion (`src/index.css` o `src/main.tsx`) debe justificarse en el momento de escribirlo. Si importar `leaflet.css` desde `src/index.css` altera el orden de las capas de Tailwind v4 y produce el conflicto descrito en Estilos, se importa desde `src/main.tsx` en su lugar.
No se crean componentes, hooks ni genericos nuevos para logica de un solo uso mas alla del componente hijo que consume `useMap()` para el `fitBounds`, que es estructural de `react-leaflet`.
`../docs/ROADMAP_FRONTEND.md` no se modifica en esta entrega. Su actualizacion corresponde a la fase de implementacion y solo con evidencia, nunca con intenciones.

## Plan de implementacion

Cada paso deja el sistema ejecutable y es comiteable por separado.

1. Ejecutar las dos verificaciones previas V-P1 y V-P2 y registrar sus resultados en la seccion final. Manual: salida de `npx tsc -b --force` archivada, y un `MapContainer` minimo que demuestra si Tailwind v4 pisa a Leaflet.
2. Instalar las dependencias (`leaflet`, `react-leaflet`, `@types/leaflet`) e importar `leaflet.css` en el lugar que resulte de V-P2. Manual: `npm run build` sin errores nuevos y el proyecto arranca.
3. Crear `src/lib/mapa.ts` con la clave, los tipos, la tabla de categorias y los helpers de color, categoria, conteo e iniciales. Manual: `npm run test:unit` sigue en verde.
4. Anadir `src/lib/mapa.test.ts` con los casos de los helpers puros, incluida la tabla completa de las siete reglas de color en su orden de precedencia y los limites de `inicialesParaMostrar`. Manual: `npm run test:unit` en verde.
5. Anadir los helpers de antiguedad y de presentacion (`antiguedadUbicacionParaMostrar`, `textoVehiculoParaMostrar`, `estadoParaMostrar`) reutilizando `src/lib/conductores.ts`, mas los de error y refresco. Manual: unitarios en verde.
6. Sustituir el stub por la estructura de la pantalla: encabezado con `Actualizar`, chips, panel, leyenda y aviso, con la query y los estados de carga y error. Manual: `npm run build` sin errores atribuibles a esta spec y los chips muestran conteos reales.
7. Integrar `MapContainer`, la capa de teselas, el control de zoom, el distintivo y los marcadores con `divIcon` de iniciales. Manual: los marcadores aparecen con el color esperado y el popup no muestra capacidad ni telefono.
8. Anadir el directorio lateral con sus estados vacios, el enlace al detalle y el recentrado. Manual: el enlace navega a `/conductores/:id` y no recentra el mapa.
9. Anadir el encuadre: el primer encuadre suave y unico, y el de cambio de filtro, ambos con `useMap()` y sin depender del array de conductores. Manual: el mapa muestra la flota al cargar, no reencuadra en un refetch y reencuadra al cambiar de chip.
10. Conectar `retryMapa`, `informacionErrorMapa`, el aviso con datos previos, el estado de error sin datos y el filtro de cancelaciones. Manual: `5xx` con y sin datos, `403` y red, con `role` correcto.
11. Anadir `Actualizar` con las guardas sincronas y la pausa del polling con la visibilidad de la pestana. Manual: una lectura por pulsacion y ninguna con la pestana oculta.
12. Implementar el ciclo del aviso de teselas: conteo de `tileload` y `tileerror`, `role="status"`, boton de cierre y ocultacion por recuperacion. Manual: con las teselas en error aparece el aviso, cerrarlo lo oculta, y al cargar una tesela desaparece solo.
13. Ajustar `Mapa.css`, la leyenda, el aviso de los 5 minutos, el titulo y el comportamiento responsive. Manual: comparacion visual contra `app.js:93-95` y `app.js:140-143`, a 1280, 1024, 768 y 320 px, y con zoom 200 %.
14. Registrar evidencia por criterio, marcar las casillas verificadas y dejar INT08 y las integraciones anteriores pendientes.

Las pruebas acompanian cada incremento; no se posponen todas al ultimo paso. El primer incremento son las verificaciones previas, el segundo es logica pura sin tocar la pantalla, y el ultimo es evidencia, no funcionalidad nueva.

## Criterios de aceptacion

Las casillas se marcan solo con evidencia registrada en la seccion final. Ninguna casilla local acredita integracion real.

### Contrato y datos

- [x] La pantalla importa `ConductorMapa` desde `src/api/types.ts` y no declara ninguna interface local de datos del servidor.
- [x] La consulta se ejecuta contra `/api/dashboard/conductores-mapa` sin query string ni parametros.
- [x] La query key es exactamente `['conductores-mapa']`.
- [x] Se aplica el filtro de `Vehiculo` del Modulo 1 en ningun sitio: el popup y el directorio no muestran `capacidadPasajeros` ni un `id` de vehiculo.
- [x] Con `vehiculo: null` el texto es `Sin vehiculo registrado` y la fila no se oculta.
- [x] No se muestra `telefono` ni `cedulaIdentidad` en ninguna parte: el DTO no los trae.
- [x] No se inventa un numero de unidad a partir del `id` ni de ningun otro campo.
- [x] Un conductor con usuario eliminado presente en la respuesta se muestra en el mapa y en el directorio.
- [x] Los filtros de los chips se aplican en el cliente, sobre el array recibido, sin ninguna peticion adicional.

### Color del marcador

- [x] `getColorMarcador` es un helper puro, sin `Date` ni estado, importado y usado por la pantalla.
- [x] Las siete reglas se evaluan en el orden documentado y la primera que coincide gana.
- [x] Verde exige `ubicacion` no nula y `estadoDisponibilidad === 'disponible'`.
- [x] Azul exige `ubicacion` no nula y `estadoDisponibilidad === 'en_servicio'`.
- [x] Gris se aplica a jornada `no_iniciada` y `finalizada`, a `no_disponible`, a `solicitud_pendiente`, a `estado !== 'aprobado'` y a `ubicacion === null` sin reporte previo.
- [x] Amarillo se aplica a `ubicacion === null` con `ultimaUbicacionRegistradaEn` presente, y **prevalece** sobre el gris de fuera de servicio.
- [x] La regla 2 reproduce `app.js:68` sin apartarse de el, y la nota de seguridad operativa de la seccion Derivacion explica por que el roadmap no basta con su enumeracion.
- [x] Ningun conductor no aprobado se muestra verde, aunque su `estadoDisponibilidad` sea `disponible` y tenga `ubicacion` vigente.
- [x] El frontend **no** recalcula la vigencia de 5 minutos: no hay ninguna comparacion con `300000` ni con una constante de caducidad en `src/`.
- [x] Los cuatro colores salen de los tokens de `src/index.css`, sin hexadecimales nuevos.
- [x] El color nunca es el unico portador de significado: hay etiqueta textual en el `title`, en el popup, en el directorio y en la leyenda.

### Presentacion

- [x] Se pinta un marcador por conductor con `ubicacion` valida, en su coordenada exacta.
- [x] Los conductores sin `ubicacion` no se pintan pero **si** aparecen en el directorio, con su color y su motivo.
- [x] Los cuatro colores del prototipo se reproducen con la derivacion desde los enums.
- [x] El icono es un `divIcon` con iniciales, no el PNG por defecto de Leaflet.
- [x] El `html` del `divIcon` se construye solo con iniciales y nunca con `nombreCompleto`.
- [x] El `h1` dice `Mapa`, igual que la entrada del menu lateral, y el subtitulo es el del prototipo.
- [x] Los cinco chips tienen `aria-pressed`, punto de color donde corresponde y el conteo de `conteoPorCategoria`.
- [x] El conteo de los chips se calcula sobre todos los conductores no eliminados, incluidos suspendidos, rechazados y pendientes.
- [x] El filtro activo sobrevive a un refetch que deja vacio ese filtro.
- [x] La leyenda enumera los cuatro estados con texto.
- [x] El aviso de los 5 minutos esta presente con el texto del prototipo.
- [x] El Popup no tiene botones de transicion de estado ni ninguna accion de mutacion.
- [x] El popup y el directorio enlazan a `/conductores/:id` y ese enlace no dispara el recentrado.
- [x] El enlace `Ver conductor` llega a la pantalla de detalle y esta renderiza, verificado con V-P1 registrado. El criterio es que la ruta funcione, no que `npm run build` pase: los tres `TS6133` de `Detalle.tsx` no afectan al servidor de desarrollo.
- [x] No hay scroll horizontal a 320 px ni con zoom 200 %; el directorio cae bajo el mapa en movil.

### Vista e interaccion

- [x] El mapa arranca centrado en La Paz a zoom 14.
- [x] En el primer render con datos que ya tienen marcadores, la vista se encuadra **suave** sobre esos marcadores y el admin ve la flota entera sin interactuar.
- [x] Ese primer encuadre ocurre **una sola vez**: un refetch posterior no cambia la vista, ni aunque entren marcadores nuevos, ni aunque cambien las coordenadas o los colores de los existentes.
- [x] Si la primera respuesta llega sin marcadores, el primer encuadre **no** se consume y se produce en la lectura siguiente que traiga marcadores.
- [x] `scrollWheelZoom`, `touchZoom`, `boxZoom` y `doubleClickZoom` estan desactivados.
- [x] El control de zoom esta presente en la esquina inferior derecha y el arrastre funciona.
- [x] Un refetch de polling **no** cambia la vista del mapa, ni aunque cambien los marcadores.
- [x] Cambiar de chip reencuadra con `fitBounds` y `padding [75, 75]`, con `maxZoom: 14`.
- [x] Cambiar a un filtro sin ningun marcador no produce una vista en blanco sin explicacion.
- [x] Ningun efecto de encuadre depende del array de conductores: cambiar los datos no dispara un `fitBounds`.
- [x] El mapa base y sus marcadores se ven con la hoja de estilos de Leaflet intacta: `.leaflet-container`, `.leaflet-control-zoom` y `.leaflet-popup-content` no pierden contra las utilidades de Tailwind v4, o si pierden, se aislaron por capas y no pisando `Mapa.css`.
- [x] Si las teselas fallan mas de tres veces sin ninguna cargada, aparece el aviso superpuesto y los marcadores siguen visibles.
- [x] El aviso de teselas se anuncia con `role="status"` y **nunca** con `role="alert"`.
- [x] El aviso tiene boton de cierre con etiqueta accesible, y pulsarlo lo oculta.
- [x] Cuando carga la primera tesela, el aviso desaparece solo, sin intervencion del admin.
- [x] La recuperacion de la red limpia tambien el descarte: un fallo posterior puede volver a mostrar el aviso.
- [x] Cerrar el aviso mientras la red sigue caida no lo reabre cada tesela que falla.
- [x] Si Leaflet no carga, aparece el estado con enlace a Conductores en vez de un hueco vacio.

### Refresco

- [x] El mapa se actualiza solo cada 15 s mientras la pestana esta visible.
- [x] Con la pestana oculta no se ejecutan lecturas periodicas.
- [x] `Actualizar` ejecuta exactamente una lectura por pulsacion, convive con el polling y muestra `Actualizando...` mientras dura.
- [x] Tres pulsaciones en el mismo tick producen una sola lectura.
- [x] `Actualizar` y `Reintentar` no pueden dispararse simultaneamente.
- [x] Durante un refresco con datos previos no se vuelve al estado de carga.

### Errores

- [x] Un error de red o `5xx` sin datos previos muestra un estado de error con `Reintentar` y **no** un mapa vacio.
- [x] Un error de red o `5xx` con datos previos conserva la ultima lectura confirmada y anade un aviso no bloqueante.
- [x] `informacionErrorMapa` decide por `ApiError.status` y no parsea el texto del mensaje.
- [x] Un `403` muestra el mensaje del backend sin cerrar sesion.
- [x] Un `401` conserva el cierre de sesion y la redireccion a `/login` ya existentes, sin logica duplicada.
- [x] `retryMapa` reintenta `5xx` y `TypeError`, nunca `4xx`, y como maximo una vez.
- [x] Una peticion cancelada por React Query no se muestra como error al usuario.
- [x] Un `AbortError` por desfase de sesion —respuesta tardia de la sesion A llegando con la sesion B activa— **no** se muestra como error, ni con datos previos ni sin ellos: la pantalla distingue cancelacion de fallo y no anuncia ese descarte.
- [x] Los datos de la sesion A que llegan tarde no se pintan sobre los de la sesion B.

### Alcance y no regresiones

- [x] `src/api/types.ts` no se modifico.
- [x] No se modificaron `src/api/client.ts`, `src/api/token.ts`, `AuthContext`, `QueryClient`, `router.tsx` ni `Layout.tsx`.
- [x] `src/pages/Conductores/Detalle.tsx` no se modifico, pese a sus tres errores `TS6133` preexistentes.
- [x] La pantalla no consulta ninguna ruta API distinta de `/api/dashboard/conductores-mapa`.
- [x] No hay codigo de Realtime, WebSocket ni suscripcion `postgres_changes`.
- [x] No hay mutaciones, aprobaciones, suspensiones ni reasignaciones desde la pantalla.
- [x] No se instalaron `jsdom` ni `@testing-library/react`.
- [x] Los enlaces a `/conductores/:id`, `/`, `/solicitudes`, `/tarifas` y `/configuracion` siguen funcionando.
- [x] Logout y el evento `auth:unauthorized` intactos; el polling de SPEC 05 y SPEC 07 intactos.
- [x] `npm run test:unit` termina correctamente.
- [x] `npm run build` termina correctamente, **condicionado**: hoy falla por `Detalle.tsx:52-54`, fuera de alcance. Debe verificarse al menos que `tsc -b` no reporta ningun error atribuible a los archivos de esta spec, igual que hizo la SPEC 07.
- [x] El navegador verifica los casos anteriores con todas las llamadas API interceptadas y sin trafico real accidental.
- [ ] INT08: `GET /api/dashboard/conductores-mapa` autenticado verificado contra el backend en `:3001`, con permiso real de administrador y `Cache-Control: no-store`. **Pendiente.**

### Verificaciones previas

- [x] V-P1 ejecutado y registrado: la salida de `npx tsc -b --force` antes de empezar la pantalla esta archivada, y se distingue lo preexistente de lo atribuible a esta spec.
- [x] V-P2 ejecutado y registrado: se sabe si Tailwind v4 pisa a Leaflet, y el lugar del import de `leaflet.css` esta decidido con ese resultado.

## Estrategia de pruebas

Reutilizar Vitest y las herramientas de navegador ya usadas en SPEC 04, 05, 06 y 07, sin instalar dependencias. No se ejecutan pruebas para aprobar este documento; se ejecutan durante la implementacion autorizada.

| Grupo | Casos previstos |
|---|---|
| U01 Color | Las siete reglas en su orden de precedencia: verde, azul, gris por jornada no iniciada, gris por jornada finalizada, gris por `no_disponible`, gris por `solicitud_pendiente`, gris por estado distinto de aprobado, amarillo con reporte previo, gris sin reporte previo; el amarillo prevalece sobre el gris de fuera de servicio; verde y azul imposible con `ubicacion: null`. |
| U02 Categorias | `categoriaDe` devuelve el color; `conductoresVisibles` con cada una de las cinco categorias; `conteoPorCategoria` suma el total y respeta los suspendedos, rechazados y pendientes; conjunto vacio devuelve ceros, no `NaN`. |
| U03 Marcadores | `conductoresConUbicacion` excluye los que no tienen `ubicacion` y conserva el orden de la respuesta; lista vacia y lista completa. |
| U04 Iniciales | Una palabra, dos palabras, tres palabras, nombres con particulas, cadena vacia, solo espacios y caracteres no alfabeticos: nunca devuelve cadena vacia ni mas de tres caracteres. |
| U05 Antiguedad | Reutiliza `sin-reportes` / `invalida` / `registrada`: "hace 7 min", "hace menos de 1 min", fecha no interpretable y reporte ausente. |
| U06 Presentacion | `ETIQUETAS_COLOR` cubre los cuatro colores con texto no vacio; `textoVehiculoParaMostrar` con vehiculo y con `null`; `estadoParaMostrar` para los cuatro estados de conductor. |
| U07 Retry | `5xx` y `TypeError` reintentan una vez; `400`, `401`, `403`, `404` no reintentan; `failureCount` alto no reintenta. |
| U08 Errores | Mocks de los mensajes exactos de la tabla de errores; `recuperable` correcto por status; ninguna rama parsea texto. |
| U09 Intervalo | Visible y sin lectura en curso devuelve `15_000`; pestana oculta, lectura en curso o ambas devuelven `false`. |
| U10 Guardas | `puedeDispararRefrescoMapa` con y sin lectura en curso. |
| U11 Constantes | `CLAVE_CONDUCTORES_MAPA` es exactamente `['conductores-mapa']`; el centro inicial son las coordenadas de La Paz; `MAX_ZOOM_MAPA` es 14. |
| Q01 Lectura | Carga inicial con guiones; exito con ceros reales; exito con valores altos; refresco con datos previos sin volver al esqueleto; respuesta con un solo conductor y respuesta `[]`. |
| Q02 Encuadre | Primer render con marcadores encuadra suave; el guardia se consume; un refetch con marcadores nuevos, con coordenadas distintas o con mas conductores **no** reencuadra; primera respuesta vacia deja el guardia activo y la lectura siguiente reencuadra; cambiar de chip reencuadra con `padding [75,75]`; cambiar a un filtro vacio no reencuadra. |
| Q02b Marcadores | Un marcador por conductor con `ubicacion`; ninguno cuando todos carecen de ella; coordenadas exactas; color de cada marcador verificado por clase. |
| Q03 Filtros | Los cinco chips con su conteo; cambio de filtro y reencuadre; filtro que deja cero conductores con su estado vacio; el filtro activo sobrevive a un refetch. |
| Q04 Directorio | Conductor sin `ubicacion` presente con su motivo; clic recentra; el enlace navega a `/conductores/:id` y no recentra; los dos estados vacios diferenciados. |
| Q05 Refresco | Una lectura por pulsacion de `Actualizar`; etiqueta `Actualizando...`; tres pulsaciones en el mismo tick producen una lectura; pausa real con la pestana oculta. |
| Q06 Errores | `5xx` sin datos, `5xx` con datos previos, `403`, `401` y red; `role="alert"` frente a `role="status"`; `Reintentar` recupera. |
| Q07 Alcance | Unica peticion a `/api/dashboard/conductores-mapa`; query string vacio; ninguna otra ruta API; ninguna mutacion. |
| Q08 Sesion | Respuesta tardia de la sesion A no se pinta en la sesion B; el `AbortError` no se muestra como error **ni con datos previos ni sin ellos**; cambiar de sesion durante una lectura no deja marcadores ni avisos a medias. |
| V01 Visual | Comparacion contra `app.js:93-95` y `app.js:140-143`: anatomia del panel, orden de las zonas, colores resueltos desde los tokens, leyenda, distintivo; 1280 px, 1024 px, 768 px y 320 px; zoom 200 %; ausencia de desbordamiento horizontal. |
| V02 Teselas | Con las peticiones a `tile.openstreetmap.org` interceptadas en error: aparecen mas de tres fallos sin ninguna cargada y el aviso aparece con `role="status"`; los marcadores siguen visibles; el boton de cierre lo oculta; con una tesela cargando, el aviso desaparece solo; tras la recuperacion, un fallo posterior vuelve a mostrarlo; cerrar con la red aun caida no reabre el aviso con cada fallo. |
| V03 Estilos | Con la pantalla montada, `.leaflet-container`, `.leaflet-control-zoom` y `.leaflet-popup-content` conservan el aspecto de Leaflet y el mapa no aparece sin fondo, sin controles o sin sombra de ventana emergente. Sirve para confirmar o desmintir V-P2. |
| A01 Accesibilidad | Un solo `h1`; `aria-label` descriptivo del mapa; chips con `aria-pressed`; puntos de color e iconos con `aria-hidden`; foco visible en `Actualizar`, en los chips y en cada fila del directorio; recorrido completo con `Tab` sin raton. |
| A02 Directorio como via accesible | Todas las acciones del mapa accesibles desde el directorio: identificar el conductor, su estado y su localizacion. |
| R01 Regresion | Navegacion `Inicio`, `Conductores`, `Conductores/:id`, `Mapa`, `Solicitudes`, `Tarifas` y `Configuracion` intactas; logout y `auth:unauthorized` intactos; polling de SPEC 05 y SPEC 07 intactos. |
| INT08 Integracion | GET autenticado con Bearer de administrador, permiso real, conductores reales de distintos estados, `Cache-Control: no-store` y caducidad real de ubicacion, en entorno autorizado. |

Los unitarios de helpers no acreditan render, foco, responsive ni anuncios.
Interceptar **todas** las rutas API antes de navegar, incluidas `Login`, `configuracion` y `conductores` si se visitan. Interceptar tambien las teselas para que ningun escenario dependa de la red publica: una verificacion que depende de la red no es reproducible.
Usar datos ficticios; no crear cuentas, seeds ni migraciones para desbloquear pruebas.
No incluir mocks en codigo de produccion.
Limpiar interceptores y estado de navegador al terminar, incluso ante fallos.
Registrar fecha, resultado y evidencia saneada sin tokens, credenciales ni datos personales.

INT08 queda pendiente hasta autorizacion especifica de entorno y cuenta reales.
Mocks no acreditan autorizacion, disponibilidad de backend, CORS, `Cache-Control: no-store` ni el comportamiento real de la caducidad de ubicacion.
INT01, INT03, INT04, INT05, INT06 e INT07 conservan su estado pendiente y no se cierran con esta spec.

## Decisiones establecidas y alternativas

### Establecido por contrato o por decisiones previas

- Si: `ConductorMapa` central de `src/api/types.ts` y query key `['conductores-mapa']`; evitar duplicar el DTO y renombrar la clave.
- Si: el filtro es solo `eliminadoEn: null`; un conductor con usuario eliminado permanece (P06) y el frontend no añade filtros.
- Si: `vehiculo` es una proyección de 4 campos; no reusar el tipo `Vehiculo` del Modulo 1.
- Si: la vigencia de 5 min ya la aplico el backend; el frontend decide el amarillo por presencia de datos, no por reloj.
- Si: polling de 15 s y sin Realtime; la caducidad no produce eventos de base de datos.
- Si: `requireAdmin` y el `401` existente; no duplicar la expulsion de sesion.
- Si: el esquema de query es estrictamente vacio; no anadir paginacion, orden ni filtros al servidor.
- Si: React Leaflet con OpenStreetMap, sin API key (`ESPECIFICACION_admin-web.md:27`).
- Si: el `h1` coincide con la entrada del menu lateral, igual que decidio la SPEC 07 para `Inicio`.
- No: filtrar por `estado: 'aprobado'`; el endpoint no lo hace y el roadmap lo prohibe.
- No: recalcular la vigencia de ubicacion en el navegador; seria una segunda fuente de verdad.
- No: mostrar `capacidadPasajeros`, `telefono` o `cedulaIdentidad`; el DTO no los trae.
- No: inventar un numero de unidad.

### Aprobado en esta revision

- D1 a D11 quedan cerradas en la tabla de decisiones de UX aprobadas.
- D4 anade `estado !== 'aprobado'` a la condicion de gris **reproduciendo `app.js:68`**, y el conteo de los chips deja de filtrar por aprobacion. La nota de seguridad operativa precisa contra quien se compara: el roadmap, no el prototipo.
- D5 reinterpreta el criterio del roadmap sobre los controles de desplazamiento; se documenta aqui y en el criterio de aceptacion.
- D6 sustituye Tarija por La Paz y limita el `fitBounds` al **primer render con marcadores** y al cambio de filtro, nunca a un refetch.
- D9 aplica a `Mapa` el criterio de coherencia de titulo que la SPEC 07 establecio para `Inicio`.
- D11 convierte el aviso de teselas en un aviso recuperable, cerrable y nunca `alert`.
- V-P1 y V-P2 se ejecutan antes de la primera linea de la pantalla y condicionan el resto.
- Se descarta el panel `Tu flota en el mapa` de Inicio, que es trabajo posterior de otra spec.
- Se descarta `jsdom` y `@testing-library/react`.
- Se descarta la busqueda de texto, la paginacion y el ordenamiento del directorio.
- Se descarta el agrupamiento de marcadores superpuestos.
- No quedan preguntas abiertas de definicion para esta spec.

### Diferido

- Realtime como invalidacion: pertenece al Modulo 11 y **no** reemplaza el polling, cuya unica funcion util aqui es detectar la caducidad.
- El panel `Tu flota en el mapa` de Inicio: depende de este modulo, no de este modulo.
- Generalizar `src/lib/mapa.ts` con otros mapas: no hay un segundo mapa previsto.
- Unificar la logica de presentacion compartida entre Mapa, Solicitudes y Tarifas: deuda tecnica no bloqueante, en su propia spec.
- Busqueda y paginacion del directorio: fuera del alcance del MVP segun la especificacion.

## Riesgos

| Riesgo | Mitigacion o limite |
|---|---|
| Un conductor suspendido se pinta de verde | La regla 2 de `getColorMarcador` lo envia a gris, y los unitarios de U01 fijan ese caso. |
| Un fallo de red se presenta como un mapa sin conductores | `informacionErrorMapa` mas estado de error o aviso; el estado vacio solo aparece con una lectura correcta y confirmada. |
| El autor de la pantalla reintroduce la vigencia de 5 min en el navegador | Criterio de aceptacion explicito: ninguna comparacion con `300000` ni con una constante de caducidad en `src/`; el amarillo se decide por `ubicacion === null` y `ultimaUbicacionRegistradaEn`. |
| El `divIcon` introduce una via de inyeccion con el nombre del conductor | El `html` se construye solo con iniciales; `nombreCompleto` solo aparece en contenido de React. |
| El mapa reencuadra solo y el admin pierde su vista | El unico encuadre automatico es el primero, con un guardia que se consume; despues solo reencuadra un cambio de chip, que el admin provoca. Ningun efecto depende del array de conductores. |
| El primer encuadre salta y desconcierta al admin que acaba de entrar | Es animado, no un salto. Y si la primera respuesta llega vacia, el guardia no se consume y el encuadre espera a la lectura con marcadores. |
| El distintivo `La Paz, Bolivia` contradice la vista tras arrastrar | Riesgo aceptado de forma consciente (D7): es una etiqueta de vista por defecto, no un geolocalizador. Se documenta en la nota de la leyenda. |
| Las teselas de OpenStreetMap no cargan | El aviso superpuesto de `app.js:184` explica la situacion y los marcadores siguen visibles; el mapa no se declara roto. |
| Aislamiento de las reglas de Leaflet | Resuelto por V-P2 **antes** de escribir la pantalla, con el orden de capas declarado de forma explicita y, si no basta, moviendo el import a `src/main.tsx` o aislando las reglas de Leaflet en una capa de menor prioridad. Nunca pisando `Mapa.css`. El resultado se verifica con V03. |
| El aviso de teselas molesta mas de lo que informa | Es `role="status"`, no `alert`; se cierra a mano y desaparece solo en cuanto carga la primera tesela. El contador de fallos se mantiene, no se reinicia con cada tesela. |
| Leaflet se inicializa dos veces al remontar la pantalla | `MapContainer` de `react-leaflet` gestiona su propio ciclo de vida; la pantalla no crea la instancia a mano y no hay estado de mapa propio. |
| El `npm run build` falla por `Detalle.tsx:52-54` y se atribuye a este modulo | V-P1 archiva la linea base **antes** de empezar, de modo que cualquier error nuevo sea atribuible por comparacion. Los tres errores son preexistentes y de la SPEC 06; quedan documentados como limitacion y no se tocan. |
| Un `AbortError` de desfase de sesion se ve como error y asusta al admin | La pantalla distingue cancelacion de fallo antes de decidir el estado visible, ni con datos previos ni sin ellos. Criterio explicito y escenario Q08, siguiendo el criterio equivalente de la SPEC 07. |
| El identificador del marcador no distingue conductores con iniciales iguales | Riesgo acotado: el popup y el directorio muestran nombre y placa. No se resuelve con clustering, que esta fuera de alcance. |
| Ampliar el alcance hacia Inicio, Solicitudes o el Modulo 11 durante la implementacion | Fuera de alcance explicito y checklist de alcance con las rutas y archivos prohibidos. |
| Sobrecarga del endpoint por el polling | Un unico endpoint, 15 s, pausado sin visibilidad y con lectura manual protegida por guardas. |

## Que NO forma parte de esta especificacion

- Implementar codigo o aportar evidencia de funcionamiento en esta entrega documental.
- El panel `Tu flota en el mapa` de la pantalla de Inicio.
- Realtime, WebSockets o `postgres_changes`, incluso como disparador de invalidacion.
- Cualquier mutacion: aprobar, rechazar, suspender, reactivar o reasignar desde el mapa.
- Consultar `conductores`, `conductor-detalle`, `solicitudes-activas`, `tarifas` o `indicadores` desde esta pantalla.
- Recalcular la vigencia de ubicacion, el radio de busqueda o cualquier regla de elegibilidad en el frontend.
- Filtrar por `estado: 'aprobado'`, por jornada o por disponibilidad antes de pintar.
- Mostrar `capacidadPasajeros`, `telefono` o `cedulaIdentidad` en el mapa.
- Un numero de unidad, un id de vehiculo o cualquier campo que el contrato no expone.
- Agrupamiento de marcadores, radio, calor, rutas, geocodificacion o cualquier otra capa geoespacial.
- Busqueda de texto, paginacion y ordenamiento del directorio lateral.
- Instalar `jsdom`, `@testing-library/react` o cualquier otra libreria de pruebas.
- Modificar `src/api/types.ts`, `src/api/client.ts`, `src/api/token.ts`, `AuthContext`, `QueryClient` en `src/App.tsx`, `router.tsx`, `Layout.tsx`, `src/lib/conductores.ts`, `src/pages/Conductores/*` o `specs/.spec-config.yml`.
- Arreglar los tres errores `TS6133` de `src/pages/Conductores/Detalle.tsx:52-54`: son de la SPEC 06 y esta spec no los toca.
- Cambios de backend, contratos, base de datos, seeds, migraciones o entorno.
- Modificar `../docs/ROADMAP_FRONTEND.md` con intenciones; su actualizacion requiere evidencia.
- Cerrar INT01, INT03, INT04, INT05, INT06 o INT07 con mocks.

Cada uno de esos, si aterriza, va en su propia spec.

## Registro de evidencia

**Implementacion ejecutada y verificada el 2026-10-03.** Las dos verificaciones previas se registran primero porque son la linea base. No se registran credenciales, tokens ni datos personales: los interceptores responden con un token ficticio y una flota ficticia.

### Verificaciones previas

| Verificacion | Resultado registrado |
|---|---|
| V-P1 | Ejecutada en `main` antes de la primera modificacion. Salida literal archivada en `%TEMP%\opencode\spec08\vp1.txt`:<br>`src/pages/Conductores/Detalle.tsx(52,9): error TS6133: 'botonCancelar' is declared but its value is never read.`<br>`src/pages/Conductores/Detalle.tsx(53,9): error TS6133: 'botonDescartar' is declared but its value is never read.`<br>`src/pages/Conductores/Detalle.tsx(54,9): error TS6133: 'botonCerrar' is declared but its value is never read.`<br>`EXITCODE=2`<br>Solo aparecen los tres `TS6133` de `Detalle.tsx:52-54`. No hay regresion heredada, asi que la implementacion continua. |
| V-P2 | **Tailwind v4 no pisa a Leaflet.** `@import 'leaflet.css'` falla porque el paquete no exporta ese especificador de raiz; `leaflet/dist/leaflet.css` resuelve. Con el import en `src/index.css` la hoja queda **fuera** de las capas `@layer` de Tailwind, y las utilidades por capas pierden contra ella aunque se declare antes: el orden deja de importar. Estilos calculados con la pantalla montada: `.leaflet-container` conserva `overflow: hidden`, `position: relative` y fondo `rgb(221, 221, 221)`; `.leaflet-control-zoom` conserva `z-index: 800`; `.leaflet-popup-content` conserva `margin: 16px 20px`; `.leaflet-control-attribution` conserva `font-size: 12px`. El control de zoom responde y las teselas se pintan.<br>**Lugar definitivo:** `@import 'leaflet/dist/leaflet.css';` en `src/index.css`, la opcion por defecto de esta spec y equivalente a importarlo en `src/main.tsx`, asi que no se movio. `src/main.tsx` queda sin import. No hizo falta aislar capas ni escribir reglas `.leaflet-*` en `Mapa.css`. |

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `npx tsc -b --force` | `EXITCODE=2` con los **mismos tres** `TS6133` de `Detalle.tsx:52-54` y ningun error atribuible a `src/lib/mapa.ts`, `src/lib/mapa.test.ts`, `src/pages/Mapa.tsx` ni `src/pages/Mapa.css`. Es exactamente la linea base de V-P1. Durante la implementacion aparecieron dos errores propios (`constlecturasEnVuelo` y un `role` en `MapContainerProps`), corregidos; la ejecucion final no los reproduce. |
| `npm run test:unit` | **9 archivos, 403 pruebas, 403 aprobadas.** 81 son las nuevas de `src/lib/mapa.test.ts` (U01-U11). Las de SPEC 01-07 siguen pasando sin tocarlas. |
| `npm run build` | Falla en `tsc -b` por los tres `TS6133` preexistentes, igual que antes de empezar. Bloqueado por ellos se ejecuto `npx vite build` aparte: **exit 0**, 228 modulos, CSS 62,40 kB y JS 674,06 kB. El empaquetado de esta spec es correcto; el fallo del build es de la SPEC 06 y no se toca. |

### Escenarios de navegador

Todas las llamadas API se interceptaron con `url.pathname.startsWith('/api/')` antes de navegar, y las teselas con el host `tile.openstreetmap.org`, servidas con `cache-control: no-store` para que ningun escenario dependiera de la red publica ni de la cache del navegador. El login se hizo por el formulario y la navegacion por enlaces.

| Escenario | Resultado observado |
|---|---|
| Q01 Lectura | Un solo `h1` con `Mapa` y el subtitulo del prototipo. Chip de carga con guiones antes de confirmar lectura y conteos reales despues. `[]` produce los cinco chips a `0`, el estado vacio con enlace a `/conductores` y el directorio vacio. Un refresco con datos previos conserva valores y no vuelve al esqueleto. |
| Q02 Encuadre | La primera lectura con marcadores encuadra de zoom 14 a zoom 7 (La Paz y Santa Cruz en pantalla) una sola vez. Un refetch que anade un conductor lejano deja el conjunto de teselas **identico** (`mismaVista: true`) con los marcadores pasando de 2 a 3. Tras una respuesta `[]` inicial el guardia no se consume: la lectura siguiente con marcadores encuadra. Cambiar a `En servicio` reencuadra a zoom 14. |
| Q02b Marcadores | Siete marcadores para nueve conductores: los dos sin `ubicacion` no se pintan y si aparecen en el directorio. `html` de cada `divIcon` = `<span class="mapa-marcador mapa-marcador--verde">JM</span>`, y la comprobacion de que no contiene `nombreCompleto` da `false` en los siete. `title` = `Juan Mamani Vargas: Disponible` y `Maria Chavez: En servicio`. |
| Q03 Filtros | Cinco chips con `conteoPorCategoria` = 9/2/1/5/1 sobre los nueve conductores. Cuatro cambios de chip produjeron **cero** peticiones adicionales. El filtro activo sobrevive a un refetch que cambia los datos: `En servicio` sigue pulsado con su unico conductor. |
| Q04 Directorio | Los nueve conductores en el directorio, incluidos los dos sin ubicacion, con `Fuera de servicio · Sin ubicacion reportada` y `Ubicacion desactualizada · Hace 9 min`. El clic en una fila recentra: el marcador queda a **21 px** del centro del mapa, con la fila marcada y el popup abierto. El enlace `/conductores/:id` navega y, al ser hermano del boton y no hijo suyo, no puede propagar el recentrado. |
| Q05 Refresco | Una pulsacion = **1** lectura. **Tres** pulsaciones en el mismo tick = **1** lectura, con `Actualizando...` y boton deshabilitado durante la lectura, que vuelve a `Actualizar` al terminar. Polling: **1** lectura en 17 s con la pestana visible, **0** en 17 s oculta y **1** en 17 s al volver a estar visible. |
| Q06 Errores | `500` sin datos previos: `role="alert"`, mensaje del backend, `Reintentar` y el mapa sigue montado. `500` con datos previos: `role="status"`, mensaje **+** `Las ubicaciones mostradas pueden estar desactualizadas.`, `Reintentar` y los tres marcadores intactos; `Reintentar` recupera y borra el aviso. Red caida con y sin datos previos: mismo reparto con `No se pudo conectar con el servidor.`. `403`: mensaje del backend, **sin** `Reintentar`, sin cerrar sesion. `404`: mensaje recibido, sin `Reintentar`. `401`: la expulsion y la redireccion a `/login` son las existentes, sin logica duplicada ni estado de error propio. |
| Q07 Alcance | Todas las peticiones de la pantalla van a `/api/dashboard/conductores-mapa` con query string vacia. No hay peticiones a otras rutas desde Mapa, ni mutaciones: el popup no tiene botones. |
| Q08 Sesion | Lectura de la sesion A retrasada 7 s con una flota, y lectura posterior de la sesion B con otra flota distinta: al resolverse la de A solo se pinta `Sesion Dos Uno`, sin marcadores ni avisos a medias y sin mensaje de error. Cancelacion y fallo no se muestran. |
| V01 Visual | Sin desbordamiento horizontal a 1280, 1024, 768 ni 320 px, ni con zoom 200 %. El directorio cae bajo el mapa a 768 y 320 px. Los cuatro colores resuelven a los tokens existentes: `#168160`, `#3977cf`, `#6a7686`, `#a56e0b`. |
| V02 Teselas | Ciclo completo: aviso con `role="status"` y cierre `Cerrar aviso del mapa base` con marcadores visibles; el cierre lo oculta; mas fallos con zoom no lo reabren; la recuperacion lo mantiene oculto; una caida posterior en un montaje nuevo vuelve a mostrarlo porque la recuperacion limpio el descarte. Coincide con `app.js:182-184`, donde `loaded` y `failed` son contadores por montaje que nunca se reinician. |
| V03 Estyles | Ver V-P2: `.leaflet-container`, `.leaflet-control-zoom`, `.leaflet-popup-content` y la atribucion conservan el aspecto de Leaflet. Solo `.leaflet-popup-content-wrapper` recibe la personalizacion de radio de la ficha. |
| A01/A02 | Un solo `h1`; region del mapa y directorio con `aria-label`; los cinco chips y las filas del directorio con `aria-pressed`; puntos de color e iconos con `aria-hidden`; foco visible con anillo de 2,4 px; recorrido con `Tab` desde el enlace de salto y el menu hasta `Actualizar` y los chips, sin raton. |
| R01 Regresion | `Inicio`, `Conductores`, `/conductores/:id`, `Mapa`, `Solicitudes`, `Tarifas` y `Configuracion` renderizan con su encabezado. Logout vuelve a `/login`. No se tocaron `client.ts`, `token.ts`, `AuthContext`, `QueryClient`, `router.tsx`, `Layout.tsx`, `src/lib/conductores.ts`, `src/api/types.ts` ni `src/pages/Conductores/*`. |

### Desviaciones y hallazgos durante la verificacion

1. **Tercer estado vacio, anadido durante la verificacion.** Un filtro puede quedar con conductores pero sin ninguno pintable: en `Desactualizados` hay un conductor sin `ubicacion`, y el mapa quedaba en gris con el directorio poblado y sin explicacion, lo que incumple el criterio de no dejar la vista en blanco sin explicacion. Se distinguio de los dos estados ya previstos: `Sin ubicaciones para mostrar`, con el numero de conductores del filtro y punteria al directorio.
2. **Recentrado corregido.** `openPopup()` durante el vuelo competia con el `autoPan` y dejaba el marcador a **228 px** del centro. Ahora el popup se abre en `moveend`, con lo que el clic recentra de verdad; los 21 px restantes son el `autoPan` que hace entrar el propio popup en pantalla.
3. **Guarda de carga del mapa.** El criterio de Leaflet que no carga se resuelve con un `ErrorBoundary` (`FalloDeMapa`) que envuelve solo el subarbol del mapa y muestra ese mismo estado con su enlace a Conductores. Limitacion honesta: con import estatico de ESM, que la libreria no cargue no es representable como fallo de render dentro de la pantalla, porque romperia el paquete entero; la guarda cubre entonces fallos de inicializacion en tiempo de render.
4. **Doble lectura inicial en desarrollo.** Con `StrictMode` de React 19 el montaje doble de `src/main.tsx` hace dos lecturas iniciales. Es un artefacto del modo desarrollo, ajeno al patron de una lectura por pulsacion y al polling, que si se midieron y dan uno.

### Limitaciones, declaradas como tales y no como criterios cumplidos

- **No hay lector de pantalla.** La accesibilidad queda cubierta por DOM, roles, `aria-*`, foco visible y recorrido con teclado.
- **No se prueba en telefono fisico.** La responsividad se mide por viewport y ancho de documento.
- **La comparacion visual no es pixel a pixel.** Se reviso por estructura del DOM, estilos computados, colores resueltos desde los tokens y desbordamiento horizontal.
- **El polling se valido con ventanas cortas de observacion** (17 s), no esperando el ciclo completo de 15 s en cada iteracion.
- **INT08 sigue pendiente:** `GET /api/dashboard/conductores-mapa` autenticado contra el backend real en `:3001`, con permiso de administrador y `Cache-Control: no-store`. Los mocks no acreditan autorizacion, disponibilidad, CORS ni caducidad real de ubicacion.
- INT01, INT03, INT04, INT05, INT06 e INT07 conservan su estado pendiente; ningun mock los cierra.
- `npm run build` sigue fallando por `Detalle.tsx:52-54`, fuera del alcance de esta spec.
