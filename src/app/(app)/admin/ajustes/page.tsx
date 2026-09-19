import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getSettings } from '@/services/settings'
import { DIMENSIONS, SEVERITY_LABEL, SEVERITY_ORDER } from '@/domain/types'
import { saveSettingsAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireUser(['admin'])
  const { ok } = await searchParams
  const s = await getSettings(db)
  return (
    <form action={saveSettingsAction} className="max-w-xl space-y-12 pt-6">
      <h1 className="text-4xl font-semibold tracking-tight">Ajustes</h1>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Clasificación</h2>
        <Field label="SMMLV (COP)" name="smmlv" defaultValue={s.smmlv} inputMode="numeric" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grupo 1 · activos (SMMLV)" name="group1.assetsSmmlv" defaultValue={s.group1.assetsSmmlv} />
          <Field label="Grupo 1 · empleados" name="group1.employees" defaultValue={s.group1.employees} />
          <Field label="Grupo 3 · activos (SMMLV)" name="group3.assetsSmmlv" defaultValue={s.group3.assetsSmmlv} />
          <Field label="Grupo 3 · ingresos (SMMLV)" name="group3.revenueSmmlv" defaultValue={s.group3.revenueSmmlv} />
          <Field label="Grupo 3 · empleados" name="group3.employees" defaultValue={s.group3.employees} />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Índice</h2>
        <div className="grid grid-cols-2 gap-4">
          {DIMENSIONS.map((d) => (
            <Field key={d.key} label={`Peso · ${d.name}`} name={`dimensionWeights.${d.key}`} defaultValue={s.dimensionWeights[d.key]} />
          ))}
          {SEVERITY_ORDER.map((sev) => (
            <Field key={sev} label={`Penalización · ${SEVERITY_LABEL[sev]}`} name={`severityPenalty.${sev}`} defaultValue={s.severityPenalty[sev]} />
          ))}
          <Field label="Peso del diagnóstico (0 a 1)" name="blend.diagnostic" defaultValue={s.blend.diagnostic} hint={`El análisis pesa ${s.blend.analysis}`} />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Derivación y agenda</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Umbral para consultor" name="consultantThreshold" defaultValue={s.consultantThreshold} />
          <Field label="Duración de la cita (min)" name="appointmentMinutes" defaultValue={s.appointmentMinutes} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
        {ok && <span className="text-sm text-muted">Guardado</span>}
      </div>
    </form>
  )
}
