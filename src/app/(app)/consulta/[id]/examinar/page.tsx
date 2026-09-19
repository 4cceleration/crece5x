import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { listUploads } from '@/services/uploads'
import { analyzeAction, finalizeAction, removeUploadAction, uploadAction } from '../../actions'
import { UploadForm } from '@/components/upload-form'
import { buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

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
      <>
        <section className="space-y-6">
          <h1 className="text-3xl font-semibold">Sin estados financieros no hay nada que examinar</h1>
          <p className="max-w-prose text-muted">Le mostramos su resultado con lo que respondió. Un consultor puede ayudarle a prepararlos.</p>
          <form action={finalizeAction.bind(null, id)}>
            <SubmitButton pendingLabel="Calculando…">Ver resultado</SubmitButton>
          </form>
        </section>
      </>
    )
  }

  const files = await listUploads(db, id)
  return (
    <>
      <section className="space-y-8">
        <h1 className="text-3xl font-semibold">Suba sus estados financieros</h1>
        <UploadForm action={uploadAction.bind(null, id)} />
        {error && <p className="text-sm text-bad">{error}</p>}
        {files.length > 0 && (
          <ul className="divide-y divide-surface">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-3">
                <span className="truncate">{f.fileName}</span>
                <form action={removeUploadAction.bind(null, id, f.id)}>
                  <button className={buttonClass('link')}>Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-6">
          {files.length > 0 && (
            <form action={analyzeAction.bind(null, id)}>
              <SubmitButton pendingLabel="Analizando… puede tardar un minuto">Analizar</SubmitButton>
            </form>
          )}
          <form action={finalizeAction.bind(null, id)}>
            <button className={buttonClass('link')}>{files.length > 0 ? 'Ver resultado sin analizar' : 'Continuar sin archivos'}</button>
          </form>
        </div>
      </section>
    </>
  )
}
