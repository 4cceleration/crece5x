import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getLesson, LESSONS } from '@/academia/lessons'
import { GUIDES } from '@/academia/guides'
import { lessonMinutes } from '@/academia/reading'
import { getCompanyIdForUser } from '@/services/companies'
import { completedLessons, learningPathForCompany } from '@/services/academia'
import { markDoneAction } from '../actions'
import { GlossaryView, GuideView } from '@/components/guide-view'
import { SubmitButton } from '@/ui/submit-button'
import { buttonClass } from '@/ui/button'

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }))
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = getLesson(slug)
  const guide = GUIDES[slug]
  if (!lesson || (!guide && slug !== 'glosario')) notFound()

  const user = await requireUser()
  const companyId = user.role === 'empresa' ? await getCompanyIdForUser(db, user.id) : null
  const path = companyId ? await learningPathForCompany(db, companyId) : []
  const done = await completedLessons(db, user.id)
  const nextInPath = path.find((l) => l.slug !== slug && !done.has(l.slug))
  const nextHref = nextInPath ? `/academia/${nextInPath.slug}` : '/academia'
  const view = { lesson, minutes: lessonMinutes(slug), done: done.has(slug) }

  return (
    <article className="animate-enter max-w-prose space-y-12 pt-6">
      {guide ? <GuideView {...view} guide={guide} /> : <GlossaryView {...view} />}
      <div className="flex flex-wrap items-center gap-6 border-t border-border pt-8">
        {done.has(slug) ? (
          <Link href={nextHref} className={buttonClass('primary')}>
            {nextInPath ? `Siguiente: ${nextInPath.title}` : 'Volver a la Academia'}
          </Link>
        ) : (
          <form action={markDoneAction.bind(null, slug, nextHref)}>
            <SubmitButton>Marcar como leída</SubmitButton>
          </form>
        )}
        <Link href="/academia" className={buttonClass('link')}>
          Todas las guías
        </Link>
      </div>
    </article>
  )
}
