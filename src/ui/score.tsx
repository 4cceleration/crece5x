import { LIGHT_LABEL, trafficLight } from '@/domain/scoring'

const RING = { verde: 'text-ok', ambar: 'text-warn', rojo: 'text-bad' } as const
const PILL = { verde: 'bg-ok/10 text-ok', ambar: 'bg-warn/15 text-[#8A6400]', rojo: 'bg-bad/10 text-bad' } as const

// Índice como anillo: el arco muestra el puntaje (0–100) con el color del semáforo
export function Score({ value, size = 'lg' }: { value: number; size?: 'lg' | 'md' }) {
  const light = trafficLight(value)
  const px = size === 'lg' ? 168 : 112
  const stroke = size === 'lg' ? 12 : 9
  const r = (px - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100)
  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: px, height: px }}>
        <svg viewBox={`0 0 ${px} ${px}`} className="-rotate-90" aria-hidden>
          <circle cx={px / 2} cy={px / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-ink/8" />
          <circle
            cx={px / 2}
            cy={px / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`stroke-current ${RING[light]} transition-[stroke-dashoffset] duration-slow`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-semibold leading-none tracking-tight ${size === 'lg' ? 'text-5xl' : 'text-3xl'}`}>
            {value}
          </span>
          <span className="mt-1 text-xs text-muted">de 100</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted">Índice de salud NIIF</p>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${PILL[light]}`}>
          <span className="size-2 rounded-full bg-current" aria-hidden />
          {LIGHT_LABEL[light]}
        </span>
      </div>
    </div>
  )
}
