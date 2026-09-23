import Link from 'next/link'
import { db } from '@/db'
import { findOpenInvite, listInviteUploads } from '@/services/invites'
import { formatLongDate } from '@/domain/dates'
import { accountantDoneAction, accountantRemoveAction, accountantUploadAction } from '../actions'
import { UploadForm } from '@/components/upload-form'
import { StepCard } from '@/components/step-card'
import { SubmitButton } from '@/ui/submit-button'
import { buttonClass } from '@/ui/button'
import { Icon } from '@/ui/icons'

export const maxDuration = 60

export default async function ContadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string; listo?: string }>
}) {
  const { token } = await params
  const { error, listo } = await searchParams
  const invite = await findOpenInvite(db, token)

  if (!invite) {
    return (
      <StepCard
        title="Este enlace ya no sirve"
        subtitle="Puede que haya vencido, que la empresa haya enviado uno nuevo o que ya tenga su resultado. Pídale a la empresa que le envíe otro desde crece5x."
      />
    )
  }

  const files = await listInviteUploads(db, invite.id)

  return (
    <StepCard
      eyebrow="Para el contador"
      title={`Suba los estados financieros de ${invite.companyName}`}
      subtitle={`Balance, estado de resultados y notas del último cierre, en PDF o Excel. No necesita crear cuenta; el enlace sirve hasta el ${formatLongDate(invite.expiresAt)}.`}
    >
      <div className="space-y-5 text-left">
        {(listo || invite.doneAt) && (
          <p role="status" className="animate-fade flex items-start gap-2 rounded-md bg-brand-soft px-4 py-3 text-brand-strong">
            <Icon name="check" size={20} className="mt-0.5 shrink-0" />
            <span>Le avisamos a {invite.companyName}. Si le falta algo, puede subirlo aquí mismo.</span>
          </p>
        )}
        <UploadForm action={accountantUploadAction.bind(null, token)} />
        {error && <p className="text-sm text-bad">{error}</p>}
        {files.length > 0 && (
          <ul className="divide-y divide-ink/10 rounded-md bg-card/70 ring-1 ring-ink/10">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon name="documento" size={20} className="text-brand-strong" />
                  <span className="truncate">{f.fileName}</span>
                </span>
                <form action={accountantRemoveAction.bind(null, token, f.id)}>
                  <button className="text-sm text-muted hover:text-bad">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
      {files.length > 0 && (
        <form action={accountantDoneAction.bind(null, token)} className="mx-auto mt-8 w-full max-w-sm">
          <SubmitButton className="w-full gap-2" pendingLabel="Avisando…">
            <Icon name="correo" size={20} />
            {invite.doneAt ? 'Avisar otra vez' : `Listo, avisar a ${invite.companyName}`}
          </SubmitButton>
        </form>
      )}
      <p className="mt-10 text-sm text-muted">
        ¿Atiende más empresas?{' '}
        <Link href="/registro" className={buttonClass('link')}>
          Conozca crece5x
        </Link>{' '}
        y haga el diagnóstico NIIF de sus clientes.
      </p>
    </StepCard>
  )
}
