// Marco de los pasos de la consulta: tarjeta de vidrio centrada en la pantalla, con "volver" arriba y encabezado uniforme
export function StepCard({
  eyebrow,
  title,
  subtitle,
  back,
  progress,
  children,
  wide = false,
}: {
  eyebrow?: string
  title: string
  subtitle?: React.ReactNode
  back?: React.ReactNode
  /** Progreso 0–1 que se muestra como barra fina arriba de la tarjeta */
  progress?: number
  children?: React.ReactNode
  wide?: boolean
}) {
  return (
    <section
      className={`animate-enter mx-auto flex min-h-[calc(100dvh-14rem)] flex-col justify-center gap-4 ${wide ? 'max-w-2xl' : 'max-w-xl'}`}
    >
      {back && <div className="text-sm">{back}</div>}
      <div className="glass overflow-hidden rounded-lg">
        {progress !== undefined && (
          <div className="h-1 bg-ink/8" aria-hidden>
            <div
              className="h-1 bg-brand transition-[width] duration-slow"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}
        <div className="p-6 text-center sm:p-8">
          <div className={`space-y-2 ${children ? 'mb-8' : ''}`}>
            {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{eyebrow}</p>}
            <h1 className="font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{title}</h1>
            {subtitle && <div className="text-muted">{subtitle}</div>}
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}

export const backLinkClass = 'inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink'
