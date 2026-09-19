import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getAvailability } from '@/services/agenda'
import { saveAvailabilityAction } from '../actions'
import { Check } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

const DAYS = [
  { n: 1, label: 'Lunes' },
  { n: 2, label: 'Martes' },
  { n: 3, label: 'Miércoles' },
  { n: 4, label: 'Jueves' },
  { n: 5, label: 'Viernes' },
  { n: 6, label: 'Sábado' },
]
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6:00 a 19:00

const select =
  'h-11 rounded-md bg-white px-3 text-ink outline-none ring-1 ring-ink/15 transition-shadow duration-200 ease-out hover:ring-ink/30 focus:ring-brand focus-visible:outline-none'

export default async function DisponibilidadPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser(['consultor'])
  const { ok } = await searchParams
  const rules = await getAvailability(db, user.id)

  return (
    <form action={saveAvailabilityAction} className="space-y-8 pt-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Disponibilidad</h1>
      <ul className="space-y-4">
        {DAYS.map((d) => {
          // Un bloque continuo por día: si hay varios (p. ej. mañana y tarde), se muestran unidos y así se guardan
          const day = rules.filter((r) => r.weekday === d.n)
          const from = day.length ? Math.min(...day.map((r) => r.startMinute)) / 60 : 8
          const to = day.length ? Math.max(...day.map((r) => r.endMinute)) / 60 : 17
          return (
            <li key={d.n} className="flex flex-wrap items-center gap-4">
              <div className="w-36">
                <Check label={d.label} name={`d${d.n}`} defaultChecked={day.length > 0} />
              </div>
              <select name={`from${d.n}`} defaultValue={from} className={select} aria-label={`${d.label} desde`}>
                {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
              <span className="text-muted">a</span>
              <select name={`to${d.n}`} defaultValue={to} className={select} aria-label={`${d.label} hasta`}>
                {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
        {ok && <span role="status" className="text-sm text-muted">Guardado</span>}
      </div>
    </form>
  )
}
