import { Icon, type IconName } from './icons'

const STEPS: { label: string; icon: IconName }[] = [
  { label: 'Clasificar', icon: 'clasificar' },
  { label: 'Revisar', icon: 'revisar' },
  { label: 'Examinar', icon: 'examinar' },
  { label: 'Comunicar', icon: 'comunicar' },
  { label: 'Escalar', icon: 'escalar' },
]

export function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-12 flex gap-2" aria-label="Progreso de la consulta">
      {STEPS.map(({ label, icon }, i) => (
        <li key={label} className="flex-1" aria-current={i === current ? 'step' : undefined}>
          <div className={`h-1 rounded-full ${i <= current ? 'bg-brand' : 'bg-surface'}`} />
          <span className={`mt-2 flex items-center gap-1.5 text-xs ${i === current ? 'font-medium text-ink' : 'text-muted'}`}>
            <Icon name={icon} size={16} className={i <= current ? 'text-brand-strong' : ''} />
            <span className={i === current ? '' : 'max-sm:sr-only'}>{label}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
