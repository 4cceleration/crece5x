import Link from 'next/link'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getCompanyIdForUser } from '@/services/companies'
import { completedLessons, learningPathForCompany } from '@/services/academia'
import { LESSONS, type LessonMeta } from '@/academia/lessons'
import { ButtonLink } from '@/ui/button'

function LessonList({ items, done }: { items: LessonMeta[]; done: Set<string> }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((l) => (
        <li key={l.slug}>
          <Link href={`/academia/${l.slug}`} className="flex items-center justify-between gap-4 py-4 hover:text-brand-strong">
            <span className={done.has(l.slug) ? 'text-muted line-through decoration-muted/40' : ''}>{l.title}</span>
            <span className="shrink-0 text-sm text-muted">{done.has(l.slug) ? 'Leída' : `${l.minutes} min`}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function AcademiaPage() {
  const user = await requireUser()
  const companyId = user.role === 'empresa' ? await getCompanyIdForUser(db, user.id) : null
  const path = companyId ? await learningPathForCompany(db, companyId) : []
  const done = await completedLessons(db, user.id)
  const next = path.find((l) => !done.has(l.slug))
  const others = LESSONS.filter((l) => !path.some((p) => p.slug === l.slug))

  return (
    <div className="space-y-14 pt-6">
      <section className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Academia NIIF</h1>
        {path.length > 0 ? (
          <>
            <p className="text-muted">
              Su ruta según su diagnóstico · {path.filter((l) => done.has(l.slug)).length} de {path.length} leídas
            </p>
            {next && <ButtonLink href={`/academia/${next.slug}`}>Seguir con: {next.title}</ButtonLink>}
            <LessonList items={path} done={done} />
          </>
        ) : (
          <p className="max-w-prose text-muted">Termine una consulta y armaremos una ruta con lo que más necesita. Mientras tanto, puede leer cualquier guía.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{path.length > 0 ? 'Otras guías' : 'Guías'}</h2>
        <LessonList items={others} done={done} />
      </section>
      <p className="text-sm text-muted">Las guías siguen la NIIF para Pymes vigente en Colombia.</p>
    </div>
  )
}
