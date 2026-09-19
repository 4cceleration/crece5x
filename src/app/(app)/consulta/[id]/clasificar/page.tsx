import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation } from '@/services/consultations'
import { GROUP_NAMES } from '@/domain/classify'
import { classifyAction } from '../../actions'
import { Steps } from '@/ui/steps'
import { Check, Field } from '@/ui/field'
import { ButtonLink, buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

export default async function ClasificarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ editar?: string }>
}) {
  const { id } = await params
  const { editar } = await searchParams
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()

  const input = c.classificationInput
  if (c.group !== null && editar === undefined) {
    return (
      <>
        <Steps current={0} />
        <section className="space-y-5">
          <p className="text-sm text-muted">Su marco contable</p>
          <h1 className="text-5xl font-semibold tracking-tight">Grupo {c.group}</h1>
          <p className="text-xl">{GROUP_NAMES[c.group]}</p>
          <p className="max-w-prose text-muted">{c.groupReason}</p>
          <div className="flex items-center gap-6 pt-6">
            <ButtonLink href={`/consulta/${id}/revisar`}>Continuar</ButtonLink>
            <Link href="?editar=1" className={buttonClass('link')}>Cambiar datos</Link>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <Steps current={0} />
      <form action={classifyAction.bind(null, id)} className="space-y-6">
        <h1 className="text-3xl font-semibold">¿Qué tamaño tiene su empresa?</h1>
        <Field label="Activos totales (COP)" name="assets" inputMode="numeric" required defaultValue={input?.assets} />
        <Field label="Ingresos del último año (COP)" name="revenue" inputMode="numeric" required defaultValue={input?.revenue} />
        <Field label="Número de empleados" name="employees" type="number" min={0} required defaultValue={input?.employees} />
        <div className="space-y-3 pt-2">
          <Check name="issuesSecurities" label="Emite acciones o bonos en la bolsa de valores" defaultChecked={input?.issuesSecurities} />
          <Check name="publicInterest" label="Es entidad de interés público (banca, seguros, fondos)" defaultChecked={input?.publicInterest} />
        </div>
        <SubmitButton pendingLabel="Clasificando…">Clasificar</SubmitButton>
      </form>
    </>
  )
}
