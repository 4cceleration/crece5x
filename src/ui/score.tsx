import { LIGHT_LABEL, trafficLight } from '@/domain/scoring'
import type { Light } from '@/domain/types'

const RING = { verde: 'text-ok', ambar: 'text-warn', rojo: 'text-bad' } as const
const ACTIVE = { verde: 'bg-ok text-white', ambar: 'bg-warn text-ink', rojo: 'bg-bad text-white' } as const

// Escala del semáforo, de peor a mejor, con sus rangos
const SCALE: { light: Light; range: string }[] = [
  { light: 'rojo', range: '0–59' },
  { light: 'ambar', range: '60–79' },
  { light: 'verde', range: '80–100' },
]

// Índice centrado: título, anillo con el puntaje y escala de tres tramos con el actual resaltado
export function Score({ value, size = 'lg' }: { value: number; size?: 'lg' | 'md' }) {
  const light = trafficLight(value)
  const px = size === 'lg' ? 184 : 128
  const stroke = size === 'lg' ? 12 : 9
  const r = (px - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100)
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Índice de salud NIIF</p>

      <div className="relative mt-5" style={{ width: px, height: px }}>
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
          <span className={`font-display font-semibold leading-none tracking-tight ${size === 'lg' ? 'text-6xl' : 'text-4xl'}`}>
            {value}
          </span>
          <span className="mt-1 text-xs text-muted">de 100</span>
        </div>
      </div>

      <ol className="mt-6 grid w-full max-w-sm grid-cols-3 gap-1.5" aria-label="Escala del índice">
        {SCALE.map((s) => {
          const current = s.light === light
          return (
            <li
              key={s.light}
              aria-current={current ? 'true' : undefined}
              className={`rounded-md px-2 py-2 transition-colors ${current ? ACTIVE[s.light] : 'bg-ink/5 text-muted'}`}
            >
              <span className={`block text-xs ${current ? 'font-semibold' : ''}`}>{LIGHT_LABEL[s.light]}</span>
              <span className={`block text-[11px] tabular-nums ${current ? 'opacity-90' : 'opacity-70'}`}>{s.range}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
