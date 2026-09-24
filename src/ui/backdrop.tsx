// Fondo de la app: lienzo oscuro con una aurora difusa en los tonos de la marca y grano encima.
// Las tarjetas de vidrio desenfocan la aurora; el grano les da textura (ver `glass` en globals.css)
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas">
      <div className="absolute -left-[20%] -top-[25%] size-[70vmax] rounded-full bg-[radial-gradient(closest-side,var(--aurora-1),transparent)]" />
      <div className="absolute -right-[25%] top-[20%] size-[60vmax] rounded-full bg-[radial-gradient(closest-side,var(--aurora-2),transparent)]" />
      <div className="absolute -bottom-[35%] left-[15%] size-[65vmax] rounded-full bg-[radial-gradient(closest-side,var(--aurora-3),transparent)]" />
      <div className="grain absolute inset-0" />
    </div>
  )
}
