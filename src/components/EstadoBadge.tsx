const ESTILOS: Record<string, string> = {
  no_iniciada: 'bg-gris/15 text-gris',
  activa: 'bg-[#eaf7f1] text-[#198363]',
  no_disponible: 'bg-gris/15 text-gris',
  solicitud_pendiente: 'bg-ambar/10 text-ambar',
  pendiente: 'bg-[#fff5db] text-[#a17614]',
  aprobado: 'bg-[#eaf7f1] text-[#198363]',
  rechazado: 'bg-red-50 text-red-700',
  suspendido: 'bg-gris/15 text-gris',
  disponible: 'bg-verde/10 text-verde',
  en_servicio: 'bg-azul/10 text-azul',
  fuera_de_servicio: 'bg-gris/15 text-gris',
  desactualizado: 'bg-ambar/10 text-ambar',
  creada: 'bg-ambar/10 text-ambar',
  conductor_seleccionado: 'bg-ambar/10 text-ambar',
  aceptada: 'bg-verde/10 text-verde',
  buscando: 'bg-ambar/10 text-ambar',
  esperando_respuesta: 'bg-ambar/10 text-ambar',
  finalizada: 'bg-verde/10 text-verde',
}

const ETIQUETAS: Record<string, string> = {
  no_iniciada: 'No iniciada',
  activa: 'En jornada',
  no_disponible: 'No disponible',
  solicitud_pendiente: 'Solicitud pendiente',
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
  disponible: 'Disponible',
  en_servicio: 'En servicio',
  fuera_de_servicio: 'Fuera de servicio',
  desactualizado: 'Ubicación desactualizada',
  buscando: 'Buscando conductor',
  creada: 'Creada',
  conductor_seleccionado: 'Conductor seleccionado',
  aceptada: 'Aceptada',
  esperando_respuesta: 'Esperando respuesta',
  finalizada: 'Finalizada',
}

export default function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] px-[9px] py-[5px] text-xs leading-[1.35] font-[550] ${ESTILOS[estado] ?? 'bg-gris/15 text-gris'}`}
    >
      <i aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />
      {ETIQUETAS[estado] ?? estado}
    </span>
  )
}
