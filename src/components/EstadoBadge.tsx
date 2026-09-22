const ESTILOS: Record<string, string> = {
  pendiente: 'bg-ambar/10 text-ambar',
  aprobado: 'bg-verde/10 text-verde',
  rechazado: 'bg-red-50 text-red-700',
  suspendido: 'bg-gris/15 text-gris',
  disponible: 'bg-verde/10 text-verde',
  en_servicio: 'bg-azul/10 text-azul',
  fuera_de_servicio: 'bg-gris/15 text-gris',
  desactualizado: 'bg-ambar/10 text-ambar',
  buscando: 'bg-azul/10 text-azul',
  esperando_respuesta: 'bg-ambar/10 text-ambar',
  finalizada: 'bg-verde/10 text-verde',
}

const ETIQUETAS: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
  disponible: 'Disponible',
  en_servicio: 'En servicio',
  fuera_de_servicio: 'Fuera de servicio',
  desactualizado: 'Ubicación desactualizada',
  buscando: 'Buscando conductor',
  esperando_respuesta: 'Esperando respuesta',
  finalizada: 'Finalizada',
}

export default function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILOS[estado] ?? 'bg-gris/15 text-gris'}`}
    >
      {ETIQUETAS[estado] ?? estado}
    </span>
  )
}