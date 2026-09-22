export default function Configuracion() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">Configuración</h1>
      <p className="mt-1 text-sm text-gris">
        Parámetros de la empresa. Fuente: <code>GET /api/configuracion</code> y{' '}
        <code>PUT /api/configuracion</code>.
      </p>
    </div>
  )
}