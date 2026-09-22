# Especificación de Frontend — Dashboard Administrativo

> Contexto completo para generar este frontend con ayuda de IA. Pega este archivo entero
> como contexto inicial, junto con `docs/REGLAS_DE_NEGOCIO.md`, `docs/MODELO_DE_DATOS.md`
> y `specs/backend/ROADMAP_ENDPOINTS.md` del backend.

## 1. Objetivo del proyecto (contexto general)

Este dashboard es uno de los tres componentes del sistema **"Agente Inteligente para la
Atención de Consultas y Solicitudes de Clientes sobre la Disponibilidad de Radio Taxis"**
(MVP). Los otros dos son: el agente conversacional en n8n (WhatsApp) y la app móvil del
conductor. Este documento cubre **solo el dashboard administrativo**.

El dashboard es la herramienta del **administrador de la empresa de radio taxi** para
supervisar la operación y gestionar conductores. En el MVP tiene rol de **supervisión, no
de intervención manual** — el administrador no reasigna solicitudes ni cambia estados
manualmente; eso lo controla el backend automáticamente.

## 2. Stack recomendado

- **React** + **TypeScript** + **Vite**
- **React Router** para navegación
- **TanStack Query (React Query)** para fetch/cache de datos del backend
- **Tailwind CSS** para estilos (usar solo clases utilitarias base, sin compilador custom)
- **React Hook Form + Zod** para formularios y validación
- **Recharts** (opcional) para los indicadores del dashboard si se quiere graficar
- Mapa: **React Leaflet** con OpenStreetMap (gratuito, sin necesidad de API key de Google)

No usar Redux ni gestores de estado globales complejos — el MVP no lo necesita; React
Query ya maneja el cache de servidor, y el estado de UI local se resuelve con `useState`.

## 3. Autenticación

- Login con **correo + contraseña** (`POST /api/auth/admin/login` → devuelve JWT).
- Guardar el JWT en memoria (React state / contexto) — **no usar localStorage ni
  sessionStorage** si este frontend se genera como artifact; en un proyecto real fuera de
  Claude.ai, `httpOnly cookie` es preferible a `localStorage` por seguridad, pero para el
  MVP `localStorage` es aceptable si se documenta como deuda técnica.
- Todas las rutas del dashboard excepto `/login` deben estar protegidas — si no hay token
  válido, redirigir a `/login`.
- Interceptor HTTP: si cualquier request devuelve 401, limpiar sesión y redirigir a login.

## 4. Endpoints que consume este frontend

Todos con header `Authorization: Bearer <token>`. Ver detalle de cada uno en
`specs/backend/ROADMAP_ENDPOINTS.md`.

| Endpoint | Uso en el dashboard |
|---|---|
| `POST /api/auth/admin/login` | Pantalla de login |
| `GET /api/configuracion` | Pantalla de configuración |
| `PUT /api/configuracion` | Guardar cambios de configuración |
| `GET /api/conductores?estado=` | Listado de conductores, con tabs/filtro por estado |
| `GET /api/conductores/:id` | Detalle de conductor |
| `PATCH /api/conductores/:id/aprobar` | Botón "Aprobar" en conductores pendientes |
| `PATCH /api/conductores/:id/rechazar` | Botón "Rechazar" |
| `PATCH /api/conductores/:id/suspender` | Botón "Suspender" |
| `PATCH /api/conductores/:id/reactivar` | Botón "Reactivar" |
| `PATCH /api/conductores/:id/vehiculo` | Formulario de edición de datos del vehículo |
| `GET /api/dashboard/conductores-mapa` | Mapa administrativo |
| `GET /api/dashboard/solicitudes-activas` | Tabla de solicitudes activas |
| `GET /api/dashboard/indicadores` | Tarjetas de indicadores en el home |
| `GET /api/tarifas` | Pantalla de tarifario |
| `POST /api/tarifas` / `PATCH /api/tarifas/:id` | Crear/editar tarifa |

## 5. Pantallas (en orden de implementación sugerido)

### 5.1. Login
Formulario simple: correo, contraseña, botón "Ingresar". Mostrar error si las credenciales
son inválidas. Sin "recordar sesión" ni "olvidé mi contraseña" en el MVP.

### 5.2. Layout general
Barra lateral de navegación con: Inicio, Conductores, Mapa, Solicitudes, Tarifas,
Configuración, y botón de cerrar sesión. Header con el nombre de la empresa (de
`GET /api/configuracion`).

### 5.3. Inicio (Indicadores)
4 tarjetas con: conductores disponibles, conductores en servicio, solicitudes activas,
solicitudes completadas (del día). Fuente: `GET /api/dashboard/indicadores`. Sin gráficos
complejos ni analítica histórica — el MVP no lo requiere.

### 5.4. Conductores
- Tabla con columnas: nombre, teléfono, estado, jornada, disponibilidad, acciones.
- Tabs o filtro por estado: Pendientes / Aprobados / Rechazados / Suspendidos.
- En "Pendientes": botones Aprobar / Rechazar visibles directamente en la fila.
- En "Aprobados": botón Suspender. En "Suspendidos": botón Reactivar.
- Click en una fila → vista de detalle con datos personales + datos del vehículo, editable
  solo el vehículo (Regla 13: el conductor no edita esto, solo el admin).

### 5.5. Mapa administrativo
Mapa con un marcador por conductor, color según estado: verde (disponible), azul (en
servicio), gris (fuera de servicio/jornada no iniciada), amarillo (ubicación
desactualizada — más de 5 min, Regla 9). Sin control de desplazamiento manual del
conductor (solo visualización).

### 5.6. Solicitudes activas
Tabla: id, pasajero, conductor asignado (o "—" si aún busca), estado, hora de creación.
Sin botones de acción — es de solo lectura en el MVP (el admin no reasigna manualmente).
Actualización recomendada: polling cada 10-15s con React Query (`refetchInterval`), no
WebSockets — mantiene el MVP simple.

### 5.7. Tarifas
Tabla de tarifas vigentes (descripción, monto, vigencia desde) + formulario para agregar
una nueva. No hay cálculo automático por kilómetros — son valores fijos que el admin carga.

### 5.8. Configuración
Formulario con: nombre de la empresa, radio máximo de búsqueda (km), teléfono del centro
de atención. Guardar con `PUT /api/configuracion`.

## 6. Fuera de alcance de este frontend

- Reasignación manual de solicitudes.
- Roles administrativos múltiples (un solo tipo de usuario admin).
- Reportes históricos, exportación, analítica avanzada.
- Edición de datos personales del conductor (nombre, CI) — solo el vehículo es editable
  desde acá; si se necesita corregir un dato personal, es un caso de soporte fuera del MVP.

## 7. Estructura de carpetas sugerida

```
admin-web/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Home.tsx
│   │   ├── Conductores/ (Lista.tsx, Detalle.tsx)
│   │   ├── Mapa.tsx
│   │   ├── Solicitudes.tsx
│   │   ├── Tarifas.tsx
│   │   └── Configuracion.tsx
│   ├── components/       # componentes reutilizables (Tabla, Tarjeta, Badge de estado...)
│   ├── api/               # funciones de fetch por recurso (conductores.ts, tarifas.ts...)
│   ├── hooks/             # hooks de React Query por recurso
│   ├── context/           # AuthContext (token, usuario admin)
│   ├── router.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## 8. Cómo pedirle esto a la IA

Un módulo/pantalla a la vez, en el orden de la sección 5. Ejemplo de prompt:

> "Implementa la pantalla de Login del dashboard según la sección 5.1 de este documento,
> usando el endpoint `POST /api/auth/admin/login` descrito en la sección 4."

No pidas "todo el dashboard" de una vez — el resultado será genérico y no respetará el
detalle de cada pantalla (ej. los estados de color del mapa, o que Solicitudes es de solo
lectura).
