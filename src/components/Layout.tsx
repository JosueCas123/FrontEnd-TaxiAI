import { useState } from 'react'
import { Navigate, NavLink, Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio' },
  { to: '/conductores', label: 'Conductores' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/solicitudes', label: 'Solicitudes' },
  { to: '/tarifas', label: 'Tarifas' },
  { to: '/configuracion', label: 'Configuración' },
]

export default function Layout() {
  const { estaAutenticado, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)

  if (!estaAutenticado) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-ink-950 text-white transition-transform lg:static lg:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-taxi font-display text-lg font-extrabold text-ink-950">
            T
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">TaxiSur</p>
            <p className="text-xs text-white/60">Panel administrativo</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 pt-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-taxi text-ink-950' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <button
            type="button"
            onClick={cerrarSesion}
            className="w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-10 bg-black/40 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-0 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            aria-label="Abrir menú"
            className="rounded-lg border border-slate-200 p-2 lg:hidden"
            onClick={() => setMenuAbierto(true)}
          >
            <span className="block h-0.5 w-4 bg-ink-950" />
            <span className="mt-1 block h-0.5 w-4 bg-ink-950" />
            <span className="mt-1 block h-0.5 w-4 bg-ink-950" />
          </button>
          <Link to="/" className="font-display text-sm font-bold text-ink-950 lg:hidden">
            TaxiSur
          </Link>
          <span className="ml-auto" />
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}