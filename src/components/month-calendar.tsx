import Link from 'next/link'
import { monthGrid, monthTitle } from '@/domain/calendar'
import { Icon } from '@/ui/icons'

const WEEKDAYS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

// Calendario mensual: solo los días con horario disponible se pueden elegir
export function MonthCalendar({
  month,
  available,
  todayKey,
  hrefFor,
  prevHref,
  nextHref,
}: {
  month: string
  available: Set<string>
  todayKey: string
  hrefFor: (dayKey: string) => string
  prevHref?: string
  nextHref?: string
}) {
  const nav = 'flex size-9 items-center justify-center rounded-md transition-colors'
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg font-semibold first-letter:uppercase">{monthTitle(month)}</p>
        <div className="flex gap-1">
          {prevHref ? (
            <Link href={prevHref} aria-label="Mes anterior" className={`${nav} text-ink hover:bg-brand-soft`}>
              <Icon name="atras" size={18} />
            </Link>
          ) : (
            <span aria-hidden className={`${nav} text-ink/20`}>
              <Icon name="atras" size={18} />
            </span>
          )}
          {nextHref ? (
            <Link href={nextHref} aria-label="Mes siguiente" className={`${nav} text-ink hover:bg-brand-soft`}>
              <Icon name="siguiente" size={18} />
            </Link>
          ) : (
            <span aria-hidden className={`${nav} text-ink/20`}>
              <Icon name="siguiente" size={18} />
            </span>
          )}
        </div>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col" className="pb-1 text-xs font-medium uppercase tracking-wide text-muted">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week) => (
            <tr key={week[0].key}>
              {week.map((c) => {
                const isAvailable = c.inMonth && available.has(c.key)
                const isToday = c.key === todayKey
                return (
                  <td key={c.key} className="p-0">
                    {isAvailable ? (
                      <Link
                        href={hrefFor(c.key)}
                        className="flex aspect-square items-center justify-center rounded-md bg-brand-soft font-semibold text-brand-deep ring-1 ring-brand/30 transition-[background-color,color,scale] duration-base ease-spring hover:scale-105 hover:bg-brand-strong hover:text-white active:scale-95"
                      >
                        {c.day}
                      </Link>
                    ) : (
                      <span
                        className={`flex aspect-square items-center justify-center rounded-md text-sm ${
                          c.inMonth ? 'text-ink/30' : 'text-transparent'
                        } ${isToday ? 'ring-1 ring-ink/20' : ''}`}
                      >
                        {c.day}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="size-3 rounded-sm bg-brand-soft ring-1 ring-brand/30" aria-hidden />
        Días con horario disponible
      </p>
    </div>
  )
}
