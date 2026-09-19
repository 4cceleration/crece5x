// Fondo de la app: gris azulado liso (sin degradados ni manchas); las tarjetas de vidrio se leen por su tono y sombra
export function Backdrop() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-canvas" />
}
