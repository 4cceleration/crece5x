import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, loadDiagnosticState } from '@/services/consultations'
import { nextStep, previousTarget } from '@/domain/flow'
import { ANSWER_LABEL, DIMENSIONS, type AnswerValue } from '@/domain/types'
import { answerAction, flagAction, undoAction } from '../../actions'
import { Steps } from '@/ui/steps'
import { buttonClass } from '@/ui/button'

const option =
  'h-14 rounded-2xl bg-surface text-lg font-medium text-ink transition-colors hover:bg-brand-soft focus-visible:bg-brand-soft'

export default async function RevisarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.group === null) redirect(`/consulta/${id}/clasificar`)

  const s = await loadDiagnosticState(db, id)
  const step = nextStep(s.questions, s.flags, s.answers, s.group)
  if (step.kind === 'done') redirect(`/consulta/${id}/examinar`)
  const canGoBack = previousTarget(s.questions, s.flags, s.answers, s.group) !== null

  const isFlag = step.kind === 'flag'
  const key = isFlag ? step.flag : step.question.id
  const title = isFlag ? step.text : step.question.text
  const help = isFlag ? null : step.question.help
  const context = isFlag
    ? `Antes de empezar · ${step.position} de ${step.total}`
    : `${DIMENSIONS.find((d) => d.key === step.question.dimension)?.name} · ${step.position} de ${step.total}`

  return (
    <>
      <Steps current={1} />
      <div data-step={key} className="space-y-10">
        <div className="space-y-4">
          <p className="text-sm text-muted">{context}</p>
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{title}</h1>
          {help && (
            <details className="text-muted">
              <summary className="cursor-pointer text-sm">¿Qué significa?</summary>
              <p className="mt-2 max-w-prose">{help}</p>
            </details>
          )}
        </div>

        {isFlag ? (
          <form action={flagAction.bind(null, id, step.flag)} className="grid grid-cols-2 gap-3">
            <button name="value" value="si" className={option}>Sí</button>
            <button name="value" value="no" className={option}>No</button>
          </form>
        ) : (
          <form action={answerAction.bind(null, id, step.question.id)} className="grid grid-cols-2 gap-3">
            {(['si', 'parcial', 'no', 'nose'] as AnswerValue[]).map((v) => (
              <button key={v} name="value" value={v} className={option}>{ANSWER_LABEL[v]}</button>
            ))}
          </form>
        )}

        {canGoBack && (
          <form action={undoAction.bind(null, id)}>
            <button className={buttonClass('link')}>Atrás</button>
          </form>
        )}
      </div>
    </>
  )
}
