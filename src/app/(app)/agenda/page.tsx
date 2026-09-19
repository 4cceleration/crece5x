import Link from 'next/link'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { openSlots, upcomingForCompany } from '@/services/agenda'
import { uniqueTimes } from '@/domain/slots'
import { formatDayParts, formatLongDate, formatTime, localDayKey, localHour } from '@/domain/dates'
import { bookAction, cancelAction } from './actions'
import { buttonClass } from '@/ui/button'
import { Icon } from '@/ui/icons'
import { SubmitButton } from '@/ui/submit-button'

const chip =
  'flex h-12 items-center justify-center rounded-md bg-white/80 font-medium tabular-nums ring-1 ring-ink/10 transition-[background-color,box-shadow] hover:bg-brand-soft hover:ring-brand'

const ERRORS: Record<string, string> = {
  ocupado: 'Ese horario acaba de ocuparse. Elija otro.',
  'ya-tiene-cita': 'Ya tiene una cita agendada.',
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; hora?: string; error?: string }>
}) {
  const { companyId } = await requireCompany()
  const { dia, hora, error } = await searchParams

  const upcoming = await upcomingForCompany(db, companyId)
  if (upcoming) {
    const minutes = Math.round((upcoming.endsAt.getTime() - upcoming.startsAt.getTime()) / 60_000)
    const initials = upcoming.consultantName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('')
    return (
      <section className="animate-enter flex min-h-[calc(100dvh-14rem)] items-center justify-center">
        <h1 className="sr-only">Su cita</h1>
        <div className="glass w-full max-w-xl rounded-lg p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-lg font-semibold text-brand-strong"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-semibold tracking-tight">{upcoming.consultantName}</p>
              <p className="text-sm text-muted">Consultor NIIF</p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-5 border-t border-ink/10 pt-6 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Icon name="agenda" size={22} className="mt-0.5 text-brand-strong" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Fecha</dt>
                <dd className="font-medium first-letter:uppercase">{formatLongDate(upcoming.startsAt)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="disponibilidad" size={22} className="mt-0.5 text-brand-strong" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Hora</dt>
                <dd className="font-medium">
                  {formatTime(upcoming.startsAt)} · {minutes} min
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a href={`/agenda/${upcoming.id}/ics`} className={buttonClass('primary', 'gap-2')}>
              <Icon name="agenda" size={18} />
              Agregar a mi calendario
            </a>
            <form action={cancelAction.bind(null, upcoming.id)}>
              <button className={buttonClass('link')}>Cancelar cita</button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  const times = uniqueTimes(await openSlots(db))
  const days = [...new Set(times.map((t) => localDayKey(t)))].slice(0, 6)
  const errorText = error ? ERRORS[error] : null

  if (times.length === 0) {
    return (
      <section className="space-y-4 pt-6">
        <h1 className="text-3xl font-semibold">No hay horarios disponibles</h1>
        <p className="text-muted">Vuelva a intentarlo en unos días.</p>
      </section>
    )
  }

  const chosen = hora ? times.find((t) => t.toISOString() === hora) : undefined
  if (dia && chosen) {
    return (
      <AgendaCard back={{ href: `/agenda?dia=${dia}`, label: 'Elegir otra hora' }} title="Confirme su cita">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Icon name="agenda" size={22} className="mt-0.5 text-brand-strong" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Fecha</dt>
              <dd className="font-medium first-letter:uppercase">{formatLongDate(chosen)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="disponibilidad" size={22} className="mt-0.5 text-brand-strong" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Hora</dt>
              <dd className="font-medium">{formatTime(chosen)} · 60 min</dd>
            </div>
          </div>
        </dl>
        <form action={bookAction} className="mt-8">
          <input type="hidden" name="startsAt" value={chosen.toISOString()} />
          <SubmitButton className="w-full gap-2" pendingLabel="Agendando…">
            <Icon name="check" size={20} />
            Confirmar cita
          </SubmitButton>
        </form>
      </AgendaCard>
    )
  }

  if (dia && days.includes(dia)) {
    const hours = times.filter((t) => localDayKey(t) === dia)
    const groups = [
      { label: 'Mañana', items: hours.filter((h) => localHour(h) < 12) },
      { label: 'Tarde', items: hours.filter((h) => localHour(h) >= 12) },
    ].filter((g) => g.items.length > 0)
    return (
      <AgendaCard back={{ href: '/agenda', label: 'Otro día' }} title="¿A qué hora?" subtitle={formatLongDate(hours[0])}>
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.label} className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted">{g.label}</p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {g.items.map((h) => (
                  <li key={h.toISOString()}>
                    <Link href={`/agenda?dia=${dia}&hora=${encodeURIComponent(h.toISOString())}`} className={chip}>
                      {formatTime(h)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AgendaCard>
    )
  }

  return (
    <AgendaCard title="¿Qué día le sirve?" subtitle="Consulta de 60 minutos con un consultor NIIF">
      {errorText && <p className="mb-4 text-sm text-bad">{errorText}</p>}
      <ul className="grid grid-cols-3 gap-2">
        {days.map((d) => {
          const p = formatDayParts(times.find((t) => localDayKey(t) === d)!)
          return (
            <li key={d}>
              <Link href={`/agenda?dia=${d}`} className={`${chip} h-auto flex-col gap-0.5 py-3`}>
                <span className="text-xs uppercase tracking-wide text-muted">{p.weekday}</span>
                <span className="font-display text-2xl font-semibold leading-none">{p.day}</span>
                <span className="text-xs text-muted">{p.month}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </AgendaCard>
  )
}

// Marco común de los pasos de la agenda: columna centrada con tarjeta de vidrio
function AgendaCard({
  title,
  subtitle,
  back,
  children,
}: {
  title: string
  subtitle?: string
  back?: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    <section className="animate-enter mx-auto max-w-xl space-y-4 pt-6">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <Icon name="atras" size={16} />
          {back.label}
        </Link>
      )}
      <div className="glass rounded-lg p-6 sm:p-8">
        <div className="mb-6 space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted first-letter:uppercase">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}
