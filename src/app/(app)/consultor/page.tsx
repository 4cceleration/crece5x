import Link from 'next/link'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { consultantAgenda } from '@/services/agenda'
import { formatDateTime } from '@/domain/dates'

export default async function ConsultorPage() {
  const user = await requireUser(['consultor'])
  const items = await consultantAgenda(db, user.id)
  return (
    <section className="space-y-8 pt-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Próximas citas</h1>
      {items.length === 0 ? (
        <p className="text-muted">No tiene citas agendadas.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/consultor/casos/${a.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-brand-strong">
                <span>
                  <span className="block font-medium">{a.companyName}</span>
                  <span className="block text-sm text-muted first-letter:uppercase">{formatDateTime(a.startsAt)}</span>
                </span>
                <span className="text-2xl font-semibold tabular-nums">
                  <span className="sr-only">Índice </span>
                  {a.finalScore ?? '—'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
