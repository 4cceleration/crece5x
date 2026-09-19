import Link from 'next/link'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { openSlots, upcomingForCompany } from '@/services/agenda'
import { uniqueTimes } from '@/domain/slots'
import { formatDateTime, formatDay, formatTime, localDayKey } from '@/domain/dates'
import { bookAction, cancelAction } from './actions'
import { buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

const option =
  'flex h-14 items-center justify-center rounded-md bg-white ring-1 ring-ink/15 font-medium capitalize transition-colors hover:bg-brand-soft hover:ring-brand'

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
    return (
      <section className="space-y-6 pt-6">
        <p className="text-muted">Su cita</p>
        <h1 className="text-3xl font-semibold first-letter:uppercase">{formatDateTime(upcoming.startsAt)}</h1>
        <p className="text-muted">Con {upcoming.consultantName}. Le enviamos la invitación a su correo.</p>
        <div className="flex flex-wrap items-center gap-6">
          <a href={`/agenda/${upcoming.id}/ics`} className={buttonClass('primary')}>Agregar a mi calendario</a>
          <form action={cancelAction.bind(null, upcoming.id)}>
            <button className={buttonClass('link')}>Cancelar cita</button>
          </form>
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
      <section className="space-y-6 pt-6">
        <p className="text-sm text-muted">Paso 3 de 3</p>
        <h1 className="text-3xl font-semibold first-letter:uppercase">{formatDateTime(chosen)}</h1>
        <p className="text-muted">Consulta de 60 minutos con un consultor NIIF.</p>
        <div className="flex flex-wrap items-center gap-6">
          <form action={bookAction}>
            <input type="hidden" name="startsAt" value={chosen.toISOString()} />
            <SubmitButton pendingLabel="Agendando…">Confirmar cita</SubmitButton>
          </form>
          <Link href={`/agenda?dia=${dia}`} className={buttonClass('link')}>Elegir otra hora</Link>
        </div>
      </section>
    )
  }

  if (dia && days.includes(dia)) {
    const hours = times.filter((t) => localDayKey(t) === dia)
    return (
      <section className="space-y-8 pt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted">Paso 2 de 3</p>
          <h1 className="text-3xl font-semibold">¿A qué hora?</h1>
          <p className="capitalize text-muted">{formatDay(hours[0])}</p>
        </div>
        <ul className="grid grid-cols-3 gap-3">
          {hours.map((h) => (
            <li key={h.toISOString()}>
              <Link href={`/agenda?dia=${dia}&hora=${encodeURIComponent(h.toISOString())}`} className={option}>
                {formatTime(h)}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/agenda" className={buttonClass('link')}>Otro día</Link>
      </section>
    )
  }

  return (
    <section className="space-y-8 pt-6">
      <div className="space-y-2">
        <p className="text-sm text-muted">Paso 1 de 3</p>
        <h1 className="text-3xl font-semibold">¿Qué día le sirve?</h1>
      </div>
      {errorText && <p className="text-sm text-bad">{errorText}</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {days.map((d) => (
          <li key={d}>
            <Link href={`/agenda?dia=${d}`} className={option}>
              {formatDay(times.find((t) => localDayKey(t) === d)!)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
