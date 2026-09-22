export default function Detalle() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">Detalle de conductor</h1>
      <p className="mt-1 text-sm text-gris">
        Datos personales y vehículo. Fuente: <code>GET /api/conductores/:id</code>.
      </p>
    </div>
  )
}