import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { listUploads } from '@/services/uploads'
import { getCompanyPlan } from '@/services/plans'
import { getInvite, isPending } from '@/services/invites'
import Link from 'next/link'
import { getAnalysis } from '@/services/analysis'
import { PLANS, planFor } from '@/domain/plans'
import { formatLongDate } from '@/domain/dates'
import { analyzeAction, figuresAction, finalizeAction, inviteAccountantAction, removeUploadAction, uploadAction } from '../../actions'
import { FiguresForm } from '@/components/figures-form'
import { UploadForm } from '@/components/upload-form'
import { ButtonLink, buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'
import { Field } from '@/ui/field'
import { Icon } from '@/ui/icons'
import { StepCard } from '@/components/step-card'

export const maxDuration = 60

const ERRORS: Record<string, string> = {
  cupo: 'Ya usó los análisis de su plan.',
  'correo-contador': 'Escriba un correo válido para su contador.',
  envio: 'No pudimos enviar la invitación. Intente de nuevo.',
  cifras: 'Escriba al menos sus ventas y sus gastos de los últimos 3 meses.',
}

export default async function ExaminarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; invitado?: string; cifras?: string }>
}) {
  const { id } = await params
  const { error, invitado, cifras } = await searchParams
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.status === 'clasificar' || c.status === 'revisar') redirect(stepPath(id, c.status))
  if (c.eeff === null) redirect(`/consulta/${id}/clasificar`)

  const finalize = finalizeAction.bind(null, id)

  // Sin archivos: contabilidad empírica, o formal que prefiere escribir sus cifras
  if (c.eeff === 'empirica' || cifras) {
    const a = await getAnalysis(db, id)
    const empirica = c.eeff === 'empirica'
    return (
      <StepCard
        title={empirica ? 'Cuéntenos las cifras que tiene a la mano' : 'Escriba sus cifras'}
        subtitle="No tienen que ser exactas: con valores aproximados le mostramos cómo está su empresa."
      >
        <FiguresForm action={figuresAction.bind(null, id)} defaults={a?.figures} />
        {error && <p className="mt-4 text-sm text-bad">{ERRORS[error] ?? error}</p>}
        <div className="mt-6 flex flex-col items-center gap-3">
          {!empirica && (
            <Link href="?" className={buttonClass('link')}>
              Mejor subo los archivos
            </Link>
          )}
          <form action={finalize}>
            <button className={buttonClass('link')}>Ver mi resultado sin cifras</button>
          </form>
        </div>
      </StepCard>
    )
  }

  const files = await listUploads(db, id)
  const { plan, left, canAnalyze } = await getCompanyPlan(db, companyId)
  const invite = c.eeff === 'contador' ? await getInvite(db, id) : undefined
  const fromAccountant = files.filter((f) => f.inviteId !== null).length
  // "Los tiene mi contador" y todavía no hay archivos: la acción principal es invitarlo
  const waiting = c.eeff === 'contador' && files.length === 0
  const parciales = c.eeff === 'parciales'

  const errorLine = error && <p className="text-sm text-bad">{ERRORS[error] ?? error}</p>

  const fileList = files.length > 0 && (
    <ul className="divide-y divide-border rounded-md bg-card/70 ring-1 ring-border">
      {files.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="flex min-w-0 items-center gap-2">
            <Icon name="documento" size={20} className="text-brand-strong" />
            <span className="truncate">{f.fileName}</span>
            {f.inviteId && <span className="shrink-0 text-xs text-muted">· de su contador</span>}
          </span>
          <form action={removeUploadAction.bind(null, id, f.id)}>
            <button className="text-sm text-muted hover:text-bad">Quitar</button>
          </form>
        </li>
      ))}
    </ul>
  )

  if (waiting) {
    const pending = invite && isPending(invite)
    return (
      <StepCard
        title="Su contador puede subirlos por usted"
        subtitle="Le enviamos un enlace seguro para subir los estados financieros, sin crear cuenta. Vence en 7 días."
      >
        <div className="space-y-5 text-left">
          {pending && (
            <p
              role="status"
              className={`flex items-start gap-2 rounded-md bg-brand-soft px-4 py-3 text-brand-strong ${invitado ? 'animate-fade' : ''}`}
            >
              <Icon name="check" size={20} className="mt-0.5 shrink-0" />
              <span>
                Invitación enviada a <span className="font-medium">{invite.email}</span>. El
                enlace sirve hasta el {formatLongDate(invite.expiresAt)}. Le avisamos por correo cuando suba los archivos.
              </span>
            </p>
          )}
          <form action={inviteAccountantAction.bind(null, id)} className="space-y-4">
            <Field
              label="Correo de su contador"
              name="email"
              type="email"
              icon="correo"
              required
              autoComplete="off"
              defaultValue={invite?.email}
            />
            <SubmitButton
              variant={pending ? 'ghost' : 'primary'}
              className="w-full gap-2"
              pendingLabel="Enviando…"
            >
              <Icon name="correo" size={20} />
              {pending ? 'Reenviar la invitación' : 'Enviar invitación'}
            </SubmitButton>
          </form>
          {errorLine}
          <div className="space-y-3 border-t border-border pt-5">
            <p className="text-center text-sm text-muted">¿Ya los tiene a la mano? Súbalos usted.</p>
            <UploadForm action={uploadAction.bind(null, id)} />
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="?cifras=1" className={buttonClass('link')}>
            Mientras tanto, escriba sus cifras
          </Link>
          <form action={finalize}>
            <button className={buttonClass('link')}>Ver mi resultado sin analizar</button>
          </form>
        </div>
      </StepCard>
    )
  }

  return (
    <StepCard
      title={parciales ? 'Con esto también podemos analizar' : 'Suba sus estados financieros'}
      subtitle={
        parciales
          ? 'Su declaración de renta (formulario 110), un balance de prueba o reportes de su software contable. Con eso armamos unos estados preliminares.'
          : 'Balance, estado de resultados y notas del último cierre.'
      }
    >
      <div className="space-y-5 text-left">
        {invite?.doneAt && fromAccountant > 0 && (
          <p role="status" className="flex items-center gap-2 rounded-md bg-brand-soft px-4 py-3 text-brand-strong">
            <Icon name="check" size={20} />
            Su contador subió {fromAccountant === 1 ? 'un archivo' : `${fromAccountant} archivos`}. Ya puede analizarlos.
          </p>
        )}
        <UploadForm action={uploadAction.bind(null, id)} />
        {errorLine}
        {fileList}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        {files.length > 0 &&
          (canAnalyze ? (
            <>
              <form action={analyzeAction.bind(null, id)} className="w-full max-w-sm">
                <SubmitButton className="w-full gap-2" pendingLabel="Analizando… puede tardar un minuto">
                  <Icon name="examinar" size={20} />
                  Analizar
                </SubmitButton>
              </form>
              {left !== null && (
                <p className="text-sm text-muted">
                  {left === 1 ? 'Le queda 1 análisis' : `Le quedan ${left} análisis`} en el plan {PLANS[plan].name}.
                </p>
              )}
            </>
          ) : (
            <div className="w-full max-w-sm space-y-4 rounded-md bg-ink/5 p-5 text-center">
              <p className="font-medium">Ya usó el análisis de su plan</p>
              <p className="text-sm text-muted">
                El plan {PLANS[plan].name} incluye {PLANS[plan].analyses === 1 ? 'un análisis' : `${PLANS[plan].analyses} análisis`}. Con{' '}
                {planFor('analitica').name} tiene más, y puede ver el resultado con lo que ya respondió.
              </p>
              <ButtonLink href="/planes" className="w-full gap-2">
                Ver los planes
                <Icon name="siguiente" size={18} />
              </ButtonLink>
            </div>
          ))}
        {files.length === 0 && (
          <Link href="?cifras=1" className={buttonClass('link')}>
            ¿No los tiene a la mano? Escriba sus cifras
          </Link>
        )}
        <form action={finalize}>
          <button className={buttonClass('link')}>
            {files.length > 0 ? 'Ver resultado sin analizar' : 'Continuar sin archivos'}
          </button>
        </form>
      </div>
    </StepCard>
  )
}
