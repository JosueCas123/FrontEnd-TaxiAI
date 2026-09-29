import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { http } from '../api/client'
import type { Configuracion } from '../api/types'
import { useAuth } from '../context/AuthContext'
import {
  CLAVE_CONFIGURACION,
  esEnlaceActivo,
  esNombreValido,
  informacionErrorConfiguracion,
  inicialEmpresa,
  nombresEmpresa,
  puedeDispararReintento,
  retryConfiguracion,
  type InformacionErrorConfiguracion,
} from '../lib/configuracion'
import { cn } from '../lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar'

const ICONOS = {
  inicio: 'M3 11 12 4l9 7M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  conductores:
    'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  mapa: 'M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3ZM9 3v15M15 6v15',
  solicitudes: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 3',
  tarifas: 'M3 3h8l10 10a2 2 0 0 1 0 3l-5 5a2 2 0 0 1-3 0L3 11V3ZM8 8h.01',
  configuracion:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1',
  salir: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  cerrar: 'M6 6l12 12M18 6 6 18',
  panel: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
} as const

type NombreIcono = keyof typeof ICONOS

// El texto visible se recorta, pero el nombre completo sigue expuesto a la
// tecnologia asistiva sin depender de `title` ni de hover.
function NombreRecortado({ texto, className }: { texto: string; className: string }) {
  return (
    <p className={cn('relative truncate', className)} title={texto}>
      <span aria-hidden="true">{texto}</span>
      <span className="sr-only">{texto}</span>
    </p>
  )
}

function Icono({ nombre, className = 'h-5 w-5' }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={className}
    >
      <path d={ICONOS[nombre]} />
    </svg>
  )
}

const NAV_ITEMS: { to: string; label: string; end?: boolean; icono: NombreIcono }[] = [
  { to: '/', label: 'Inicio', end: true, icono: 'inicio' },
  { to: '/conductores', label: 'Conductores', icono: 'conductores' },
  { to: '/mapa', label: 'Mapa', icono: 'mapa' },
  { to: '/solicitudes', label: 'Solicitudes', icono: 'solicitudes' },
  { to: '/tarifas', label: 'Tarifas', icono: 'tarifas' },
  { to: '/configuracion', label: 'Configuración', icono: 'configuracion' },
]

interface ShellNavegacionProps {
  nombreLateral: string
  nombreHeader: string
  aviso: InformacionErrorConfiguracion | null
  reintentando: boolean
  onReintentar: () => void
  onCerrarSesion: () => void
}

function ShellNavegacion({
  nombreLateral,
  nombreHeader,
  aviso,
  reintentando,
  onReintentar,
  onCerrarSesion,
}: ShellNavegacionProps) {
  const { openMobile, setOpenMobile, triggerRef } = useSidebar()
  const { pathname } = useLocation()
  const principalRef = useRef<HTMLElement | null>(null)
  const panelAbiertoRef = useRef(openMobile)
  const navegarDesdePanelRef = useRef(false)
  const inicial = inicialEmpresa(nombreLateral)

  useEffect(() => {
    panelAbiertoRef.current = openMobile
  }, [openMobile])

  // Atras/adelante no pasan por un enlace del panel: se detectan por pathname.
  useEffect(() => {
    if (!panelAbiertoRef.current || navegarDesdePanelRef.current) return
    navegarDesdePanelRef.current = true
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  const cerrarPanelAlNavegar = () => {
    if (!panelAbiertoRef.current) return
    navegarDesdePanelRef.current = true
    setOpenMobile(false)
  }

  // Solo se intercepta el retorno de foco de Radix cuando hubo navegacion.
  const manejarCierreAutoFoco = (evento: Event) => {
    if (!navegarDesdePanelRef.current) {
      // Red de seguridad: si el navegador no dejo enfocado el activador al
      // pulsar (por ejemplo Safari), el foco vuelve a el tras cerrar.
      requestAnimationFrame(() => {
        const activo = document.activeElement
        if (activo === null || activo === document.body) triggerRef.current?.focus()
      })
      return
    }
    evento.preventDefault()
    navegarDesdePanelRef.current = false
    principalRef.current?.focus()
  }

  return (
    <div className="flex min-h-svh w-full">
      <Sidebar onCloseAutoFocus={manejarCierreAutoFoco}>
        <SidebarHeader className="px-4 pb-2 pt-5">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary font-display text-lg font-extrabold text-primary-foreground"
            >
              {inicial ?? <Icono nombre="panel" className="h-4 w-4" />}
            </div>
            <NombreRecortado
              texto={nombreLateral}
              className="min-w-0 flex-1 font-display text-base font-bold leading-tight"
            />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpenMobile(false)}
              className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sidebar-foreground/80 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar lg:hidden"
            >
              <Icono nombre="cerrar" />
            </button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Principal">
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={esEnlaceActivo(pathname, item.to, item.end)}>
                    <NavLink to={item.to} end={item.end} onClick={cerrarPanelAlNavegar}>
                      <Icono nombre={item.icono} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <button
            type="button"
            onClick={onCerrarSesion}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground/80 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <Icono nombre="salir" />
            Cerrar sesión
          </button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950 focus:shadow"
        >
          Saltar al contenido
        </a>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <SidebarTrigger />
          <NombreRecortado
            texto={nombreHeader}
            className="min-w-0 flex-1 font-display text-sm font-bold text-ink-950"
          />
        </header>
        {aviso && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6"
          >
            <p className="min-w-0 flex-1">{aviso.mensaje}</p>
            {aviso.recuperable && (
              <button
                type="button"
                onClick={onReintentar}
                disabled={reintentando}
                className="min-h-11 shrink-0 rounded-lg border border-amber-300 px-3 py-1.5 font-semibold text-amber-900 outline-none transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
              >
                {reintentando ? 'Cargando…' : 'Reintentar'}
              </button>
            )}
          </div>
        )}
        <main
          id="contenido-principal"
          ref={principalRef}
          tabIndex={-1}
          aria-label="Contenido principal"
          className="flex-1 p-4 outline-none sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function Layout() {
  const { estaAutenticado, cerrarSesion } = useAuth()

  const {
    data: configuracion,
    error: errorConfiguracion,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: CLAVE_CONFIGURACION,
    queryFn: () => http.get<Configuracion>('/api/configuracion'),
    retry: retryConfiguracion,
    enabled: estaAutenticado,
  })

  const [ultimoNombreValido, setUltimoNombreValido] = useState<string | null>(null)
  useEffect(() => {
    if (configuracion && esNombreValido(configuracion.nombreEmpresa)) {
      setUltimoNombreValido(configuracion.nombreEmpresa.trim())
    }
  }, [configuracion])

  if (!estaAutenticado) return <Navigate to="/login" replace />

  const { lateral: nombreLateral, header: nombreHeader } = nombresEmpresa({
    nombreServidor: configuracion?.nombreEmpresa,
    ultimoNombreValido,
  })
  const aviso = errorConfiguracion ? informacionErrorConfiguracion(errorConfiguracion) : null

  return (
    <SidebarProvider>
      <ShellNavegacion
        nombreLateral={nombreLateral}
        nombreHeader={nombreHeader}
        aviso={aviso}
        reintentando={isFetching}
        onReintentar={() => {
          if (puedeDispararReintento(isFetching)) void refetch()
        }}
        onCerrarSesion={cerrarSesion}
      />
    </SidebarProvider>
  )
}
