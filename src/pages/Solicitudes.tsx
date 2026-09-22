export default function Solicitudes() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">Solicitudes activas</h1>
      <p className="mt-1 text-sm text-gris">
        Supervisión de solo lectura. Fuente: <code>GET /api/dashboard/solicitudes-activas</code>.
      </p>
    </div>
  )
}