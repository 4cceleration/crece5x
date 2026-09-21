import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { listUploads } from '@/services/uploads'
import { analyzeAction, finalizeAction, removeUploadAction, uploadAction } from '../../actions'
import { UploadForm } from '@/components/upload-form'
import { buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'
import { Icon } from '@/ui/icons'
import { StepCard } from '@/components/step-card'

export const maxDuration = 60

export default async function ExaminarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.status === 'clasificar' || c.status === 'revisar') redirect(stepPath(id, c.status))

  if (c.flags.tieneEEFF !== true) {
    return (
      <StepCard
        eyebrow="Examinar"
        title="Sin estados financieros no hay nada que examinar"
        subtitle="Le mostramos su resultado con lo que respondió. Un consultor puede ayudarle a prepararlos."
      >
        <form action={finalizeAction.bind(null, id)} className="flex justify-center">
          <SubmitButton className="w-full max-w-sm gap-2" pendingLabel="Calculando…">
            Ver resultado
            <Icon name="siguiente" size={18} />
          </SubmitButton>
        </form>
      </StepCard>
    )
  }

  const files = await listUploads(db, id)
  return (
    <StepCard
      eyebrow="Examinar"
      title="Suba sus estados financieros"
      subtitle="Balance, estado de resultados y notas del último cierre."
    >
      <div className="space-y-5 text-left">
        <UploadForm action={uploadAction.bind(null, id)} />
        {error && <p className="text-sm text-bad">{error}</p>}
        {files.length > 0 && (
          <ul className="divide-y divide-ink/10 rounded-md bg-card/70 ring-1 ring-ink/10">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon name="documento" size={20} className="text-brand-strong" />
                  <span className="truncate">{f.fileName}</span>
                </span>
                <form action={removeUploadAction.bind(null, id, f.id)}>
                  <button className="text-sm text-muted hover:text-bad">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        {files.length > 0 && (
          <form action={analyzeAction.bind(null, id)} className="w-full max-w-sm">
            <SubmitButton className="w-full gap-2" pendingLabel="Analizando… puede tardar un minuto">
              <Icon name="examinar" size={20} />
              Analizar
            </SubmitButton>
          </form>
        )}
        <form action={finalizeAction.bind(null, id)}>
          <button className={buttonClass('link')}>
            {files.length > 0 ? 'Ver resultado sin analizar' : 'Continuar sin archivos'}
          </button>
        </form>
      </div>
    </StepCard>
  )
}
