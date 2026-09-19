import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, loadDiagnosticState } from '@/services/consultations'
import { nextStep, previousTarget } from '@/domain/flow'
import { ANSWER_LABEL, type AnswerValue } from '@/domain/types'
import { answerAction, flagAction, undoAction } from '../../actions'
import { Icon } from '@/ui/icons'
import { InfoTip } from '@/ui/info-tip'
import { StepCard, backLinkClass } from '@/components/step-card'

const option =
  'flex h-16 items-center justify-center gap-2.5 rounded-md bg-white/80 text-lg font-medium text-ink ring-1 ring-ink/10 transition-[background-color,box-shadow] hover:bg-brand-soft hover:ring-brand focus-visible:bg-brand-soft'

const ICON_COLOR: Record<AnswerValue, string> = {
  si: 'text-ok',
  parcial: 'text-warn',
  no: 'text-bad',
  nose: 'text-muted',
}

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
  const options: AnswerValue[] = isFlag ? ['si', 'no'] : ['si', 'parcial', 'no', 'nose']

  return (
    <div data-step={key}>
      <StepCard
        title={title}
        progress={step.position / step.total}
        back={
          canGoBack ? (
            <form action={undoAction.bind(null, id)}>
              <button className={backLinkClass}>
                <Icon name="atras" size={16} />
                Atrás
              </button>
            </form>
          ) : undefined
        }
        corner={help ? <InfoTip text={help} /> : undefined}
      >
        <form
          action={isFlag ? flagAction.bind(null, id, step.flag) : answerAction.bind(null, id, step.question.id)}
          className="grid grid-cols-2 gap-3"
        >
          {options.map((v) => (
            <button key={v} name="value" value={v} className={option}>
              <Icon name={v} size={22} className={ICON_COLOR[v]} />
              {ANSWER_LABEL[v]}
            </button>
          ))}
        </form>
      </StepCard>
    </div>
  )
}
