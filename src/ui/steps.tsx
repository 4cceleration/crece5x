const STEPS = ['Clasificar', 'Revisar', 'Examinar', 'Comunicar', 'Escalar']

export function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-12 flex gap-2" aria-label="Progreso de la consulta">
      {STEPS.map((label, i) => (
        <li key={label} className="flex-1" aria-current={i === current ? 'step' : undefined}>
          <div className={`h-1 rounded-full ${i <= current ? 'bg-brand' : 'bg-surface'}`} />
          <span className={`mt-2 block text-xs ${i === current ? 'font-medium text-ink' : 'text-muted max-sm:sr-only'}`}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
