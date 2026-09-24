import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getLesson, LESSONS } from '@/academia/lessons'
import { LESSON_CONTENT } from '@/academia/content'
import { getCompanyIdForUser } from '@/services/companies'
import { completedLessons, learningPathForCompany } from '@/services/academia'
import { markDoneAction } from '../actions'
import { SubmitButton } from '@/ui/submit-button'
import { buttonClass } from '@/ui/button'

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }))
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = getLesson(slug)
  const content = LESSON_CONTENT[slug]
  if (!lesson || !content) notFound()

  const user = await requireUser()
  const companyId = user.role === 'empresa' ? await getCompanyIdForUser(db, user.id) : null
  const path = companyId ? await learningPathForCompany(db, companyId) : []
  const done = await completedLessons(db, user.id)
  const nextInPath = path.find((l) => l.slug !== slug && !done.has(l.slug))
  const nextHref = nextInPath ? `/academia/${nextInPath.slug}` : '/academia'

  return (
    <article className="max-w-prose space-y-8 pt-6">
      <div className="space-y-2">
        <p className="text-sm text-muted">
          {lesson.sections.length > 0 ? `Sección ${lesson.sections.join(', ')} · ` : ''}
          {lesson.minutes} min
        </p>
        <h1 className="text-4xl font-bold tracking-tight">{lesson.title}</h1>
      </div>
      <div className="space-y-4 text-lg leading-relaxed">
        <ReactMarkdown
          components={{
            // Solo children: react-markdown 10 también pasa `node` y no debe llegar al DOM
            h2: ({ children }) => <h2 className="pt-6 text-xl font-semibold">{children}</h2>,
            ul: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      <div className="flex flex-wrap items-center gap-6 pt-6">
        {done.has(slug) ? (
          <Link href={nextHref} className={buttonClass('primary')}>{nextInPath ? `Siguiente: ${nextInPath.title}` : 'Volver a la Academia'}</Link>
        ) : (
          <form action={markDoneAction.bind(null, slug, nextHref)}>
            <SubmitButton>Marcar como leída</SubmitButton>
          </form>
        )}
        <Link href="/academia" className={buttonClass('link')}>Todas las guías</Link>
      </div>
    </article>
  )
}
