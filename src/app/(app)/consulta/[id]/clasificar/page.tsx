import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation } from '@/services/consultations'
import { GROUP_NAMES } from '@/domain/classify'
import { getSettings } from '@/services/settings'
import { classifyAction } from '../../actions'
import { ClassifyForm } from './classify-form'
import { ButtonLink, buttonClass } from '@/ui/button'
import { Icon } from '@/ui/icons'
import { StepCard } from '@/components/step-card'

const SHORT = { 1: 'NIIF Plenas', 2: 'NIIF para Pymes', 3: 'Microempresas' } as const

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
    const current = c.group
    return (
      <StepCard eyebrow="Su marco contable" title={`Grupo ${current}`} subtitle={GROUP_NAMES[current]}>
        <ol className="grid grid-cols-3 gap-1.5" aria-label="Grupos NIIF">
          {([1, 2, 3] as const).map((g) => (
            <li
              key={g}
              aria-current={g === current ? 'true' : undefined}
              className={`rounded-md px-2 py-3 ${g === current ? 'bg-brand-strong text-on-accent' : 'bg-ink/5 text-muted'}`}
            >
              <span className="block font-display text-lg font-semibold">Grupo {g}</span>
              <span className={`block text-xs ${g === current ? 'opacity-90' : ''}`}>{SHORT[g]}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-start justify-center gap-2 text-left text-sm text-ink">
          <Icon name="info" size={18} className="mt-0.5 text-brand-strong" />
          <span>{c.groupReason}</span>
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <ButtonLink href={`/consulta/${id}/revisar`} className="w-full max-w-sm gap-2">
            Continuar
            <Icon name="siguiente" size={18} />
          </ButtonLink>
          <Link href="?editar=1" className={buttonClass('link')}>
            Cambiar datos
          </Link>
        </div>
      </StepCard>
    )
  }

  const settings = await getSettings(db)

  return (
    <StepCard eyebrow="Clasificar" title="¿Qué tamaño tiene su empresa?">
      <ClassifyForm
        action={classifyAction.bind(null, id)}
        settings={{ smmlv: settings.smmlv, group1: settings.group1, group3: settings.group3 }}
        defaults={input}
      />
    </StepCard>
  )
}
