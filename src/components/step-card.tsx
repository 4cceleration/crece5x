// Marco de los pasos de la consulta: tarjeta de vidrio centrada en la pantalla, con "volver" arriba y encabezado uniforme
export function StepCard({
  title,
  subtitle,
  back,
  progress,
  corner,
  children,
  wide = false,
}: {
  title: string
  subtitle?: React.ReactNode
  back?: React.ReactNode
  /** Progreso 0–1 que se muestra como barra fina arriba de la tarjeta */
  progress?: number
  /** Elemento en la esquina superior derecha de la tarjeta (p. ej. la ayuda de una pregunta) */
  corner?: React.ReactNode
  children?: React.ReactNode
  wide?: boolean
}) {
  return (
    <section
      className={`animate-enter mx-auto flex min-h-[calc(100dvh-14rem)] flex-col justify-center gap-4 ${wide ? 'max-w-2xl' : 'max-w-xl'}`}
    >
      {back && <div className="text-sm">{back}</div>}
      <div className="glass relative rounded-lg">
        {progress !== undefined && (
          <div className="h-1 overflow-hidden rounded-t-lg bg-ink/8" aria-hidden>
            <div
              className="glow h-1 bg-linear-to-r from-brand to-neon-2 transition-[width] duration-slow"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}
        {corner && <div className="absolute right-3 top-4 z-10">{corner}</div>}
        <div className="p-6 text-center sm:p-8">
          <div className={`space-y-2 ${children ? 'mb-8' : ''} ${corner ? 'px-8' : ''}`}>
            <h1 className="font-display text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{title}</h1>
            {subtitle && <div className="text-muted">{subtitle}</div>}
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}

export const backLinkClass = 'inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink'

// Opción grande de una sola pulsación (respuestas del cuestionario y preguntas de inicio)
export const choiceClass =
  'flex items-center justify-center rounded-md bg-card/80 text-lg font-medium text-ink ring-1 ring-border transition-[background-color,box-shadow,translate,scale] duration-base ease-spring hover:-translate-y-0.5 hover:bg-brand-soft hover:ring-brand hover:glow active:translate-y-0 active:scale-97 focus-visible:bg-brand-soft'
