# TaxiSur — Prototipo visual del panel administrativo

Prototipo interactivo en español, basado en ESPECIFICACION_admin-web.md, con datos completamente ficticios. Permite revisar las pantallas y los flujos del MVP sin acceso al backend ni a datos reales.

## Recorrido

- Inicio: cuatro indicadores, mapa, registros pendientes y solicitudes recientes.
- Conductores: estados, búsqueda, paginación, detalle y gestión de cuentas con confirmación.
- Detalle: datos personales de solo lectura; edición de placa, marca, modelo y color.
- Mapa: ubicaciones de ejemplo en Tarija, filtros y marcadores verde, azul, gris y amarillo.
- Solicitudes: supervisión de solo lectura; búsqueda y filtro por estado.
- Tarifas: alta y edición de valores fijos con validación.
- Configuración: nombre de empresa, radio entero positivo y teléfono opcional.
- Login: flujo de demostración, contraseña visible/oculta y estado de error.

La vista inicial abre una sesión ficticia para revisar inmediatamente el panel. Cerrar sesión permite revisar el login. Credenciales ficticias: `admin@taxisur.demo` / `TaxiSur2026!`.

## Cómo abrir las pantallas

Abre primero `dist/ABRIR_AQUI.html`. Encontrarás accesos independientes a `inicio.html`, `login.html`, `conductores.html`, `conductor-detalle.html`, `mapa.html`, `solicitudes.html`, `tarifas.html` y `configuracion.html`. Todos comparten el mismo diseño e interacciones; también puedes navegar entre las pantallas mediante el menú lateral.

## Límites de esta entrega

Es una implementación visual estática con HTML, CSS y JavaScript, no el frontend de producción en React/TypeScript recomendado por la especificación. Los cambios se mantienen en memoria hasta recargar. No existe JWT, autenticación real, persistencia, llamadas API ni polling de datos reales. El mapa usa Leaflet 1.9.4 y teselas OpenStreetMap; requiere conexión de red. Tarija y los montos en bolivianos son decisiones ilustrativas del prototipo, no configuración confirmada de la empresa. La jornada mostrada es el 10 de septiembre de 2026.

## Dirección visual

Azul profundo #111E2F en la navegación, amarillo taxi #F6C343 para acciones principales, superficies blancas sobre #F5F7FA. Verde #168160, azul #3977CF, amarillo #A56E0B y gris #8691A0 para estados. Manrope en títulos y DM Sans en interfaz, con Segoe UI como alternativa sin red. Los estados incluyen texto y no dependen únicamente del color. Navegación responsive, tablas desplazables, formularios etiquetados, foco visible, diálogo nativo, confirmaciones y avisos de éxito/error.

## Integración posterior

Tras validar el diseño, trasladar sus componentes al stack React + TypeScript + Vite. Conectar a los endpoints de la especificación, proteger rutas con la sesión real y manejar HTTP 401. TanStack Query puede refrescar las solicitudes cada 10–15 segundos. La elegibilidad, suspensión y transiciones de solicitudes deben seguir siendo responsabilidad del backend. Confirmar con el contrato real los estados activos incluidos, las transiciones de suspensión durante un servicio y los nombres exactos de propiedades.

Recursos cartográficos: https://leafletjs.com/ y https://www.openstreetmap.org/copyright.

## Comprobación

Se validaron la sintaxis de JavaScript, las referencias de entrada y 11 comprobaciones de renderizado de plantillas y lógica: indicadores coherentes, filtros y estados vacíos, prioridad de ubicaciones desactualizadas, solicitudes sin controles de mutación, confirmación de aprobación, duplicidad de placas, creación y edición de tarifas, radio entero positivo y acceso de demostración. No se ejecutaron pruebas visuales en navegador ni integración con un backend real. Se incluye una mejora progresiva WebMCP para consultar indicadores y filtrar conductores; no se verificó contra un navegador con ese estándar habilitado.
