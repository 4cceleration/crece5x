import { LIGHT_LABEL, trafficLight } from '@/domain/scoring'

const DOT = { verde: 'bg-ok', ambar: 'bg-warn', rojo: 'bg-bad' } as const

export function Score({ value, size = 'lg' }: { value: number; size?: 'lg' | 'md' }) {
  const light = trafficLight(value)
  return (
    <div>
      <p className={size === 'lg' ? 'text-8xl font-semibold tracking-tight' : 'text-5xl font-semibold tracking-tight'}>
        {value}
        <span className="text-2xl font-normal text-muted">/100</span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-muted">
        <span className={`size-2.5 rounded-full ${DOT[light]}`} aria-hidden />
        {LIGHT_LABEL[light]}
      </p>
    </div>
  )
}
