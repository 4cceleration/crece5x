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
  'h-10 w-full min-w-24 rounded-md px-3 text-ink bg-card ring-1 ring-border outline-hidden transition-shadow duration-base hover:ring-ink/30 focus:ring-brand'

export default async function DisponibilidadPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser(['consultor'])
  const { ok } = await searchParams
  const rules = await getAvailability(db, user.id)

  return (
    <form action={saveAvailabilityAction} className="space-y-8 pt-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Disponibilidad</h1>
      <div className="glass overflow-hidden rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-5 py-3 font-medium">Día</th>
              <th scope="col" className="px-3 py-3 font-medium">Desde</th>
              <th scope="col" className="px-5 py-3 font-medium">Hasta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {DAYS.map((d) => {
              // Un bloque continuo por día: si hay varios (p. ej. mañana y tarde), se muestran unidos y así se guardan
              const day = rules.filter((r) => r.weekday === d.n)
              const from = day.length ? Math.min(...day.map((r) => r.startMinute)) / 60 : 8
              const to = day.length ? Math.max(...day.map((r) => r.endMinute)) / 60 : 17
              // Día sin marcar: sus horas se atenúan (sin JS, con :has)
              const dim = 'transition-opacity group-has-[input[type=checkbox]:not(:checked)]:opacity-40'
              return (
                <tr key={d.n} className="group">
                  <td className="px-5 py-3">
                    <Check label={d.label} name={`d${d.n}`} defaultChecked={day.length > 0} />
                  </td>
                  <td className={`px-3 py-3 ${dim}`}>
                    <select name={`from${d.n}`} defaultValue={from} className={select} aria-label={`${d.label} desde`}>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h}:00
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`px-5 py-3 ${dim}`}>
                    <select name={`to${d.n}`} defaultValue={to} className={select} aria-label={`${d.label} hasta`}>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h}:00
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
        {ok && <span role="status" className="text-sm text-muted">Guardado</span>}
      </div>
    </form>
  )
}
