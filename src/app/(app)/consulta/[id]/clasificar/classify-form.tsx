'use client'
import { useState } from 'react'
import { classify, GROUP_NAMES, type ClassificationInput } from '@/domain/classify'
import type { Settings } from '@/domain/settings'
import type { Group } from '@/domain/types'
import { formatCompactCOP } from '@/domain/format'
import { Check } from '@/ui/field'
import { MoneyField } from '@/ui/money-field'
import { CounterField } from '@/ui/counter-field'
import { SubmitButton } from '@/ui/submit-button'
import { Icon } from '@/ui/icons'

const SHORT: Record<Group, string> = { 1: 'NIIF Plenas', 2: 'NIIF para Pymes', 3: 'Microempresas' }

export type ClassifySettings = Pick<Settings, 'smmlv' | 'group1' | 'group3'>

// El grupo se calcula mientras escribe, con las mismas reglas del servidor:
// ver el resultado moverse es lo que hace que valga la pena llenar el formulario.
export function ClassifyForm({
  action,
  settings,
  defaults,
}: {
  action: (formData: FormData) => void
  settings: ClassifySettings
  defaults?: ClassificationInput | null
}) {
  const [assets, setAssets] = useState(defaults?.assets ?? 0)
  const [revenue, setRevenue] = useState(defaults?.revenue ?? 0)
  const [employees, setEmployees] = useState<number | null>(defaults?.employees ?? null)
  const [issuesSecurities, setIssues] = useState(defaults?.issuesSecurities ?? false)
  const [publicInterest, setPublic] = useState(defaults?.publicInterest ?? false)

  const forzado = issuesSecurities || publicInterest
  const completo = assets > 0 && revenue > 0 && employees !== null
  const preview =
    completo || forzado
      ? classify({ assets, revenue, employees: employees ?? 0, issuesSecurities, publicInterest }, settings)
      : null

  // Cuántos salarios mínimos: es la unidad con la que la norma mide el tamaño
  const enSmmlv = (value: number) => Math.round(value / settings.smmlv).toLocaleString('es-CO')

  return (
    <form action={action} className="space-y-6 text-left">
      <div className="space-y-5">
        <div>
          <MoneyField label="Activos totales" suffix="COP" name="assets" required defaultValue={defaults?.assets} onAmount={setAssets} />
          <Hint value={assets} enSmmlv={enSmmlv} />
        </div>
        <div>
          <MoneyField
            label="Ingresos del último año"
            suffix="COP"
            name="revenue"
            required
            defaultValue={defaults?.revenue}
            onAmount={setRevenue}
          />
          <Hint value={revenue} enSmmlv={enSmmlv} />
        </div>
        <CounterField label="Número de empleados" name="employees" defaultValue={defaults?.employees} onCount={setEmployees} />
      </div>

      <div className="space-y-3">
        <Check
          name="issuesSecurities"
          label="Emite acciones o bonos en la bolsa de valores"
          defaultChecked={defaults?.issuesSecurities}
          onChange={(e) => setIssues(e.currentTarget.checked)}
        />
        <Check
          name="publicInterest"
          label="Es entidad de interés público (banca, seguros, fondos)"
          defaultChecked={defaults?.publicInterest}
          onChange={(e) => setPublic(e.currentTarget.checked)}
        />
      </div>

      <div aria-live="polite" className="rounded-md bg-ink/5 p-4">
        <ol className="grid grid-cols-3 gap-1.5" aria-label="Grupos NIIF">
          {([1, 2, 3] as const).map((g) => {
            const activo = preview?.group === g
            return (
              <li
                key={g}
                aria-current={activo ? 'true' : undefined}
                className={`rounded-md px-2 py-2.5 text-center transition-colors duration-base ${
                  activo ? 'bg-brand-strong text-on-accent' : 'bg-card/60 text-muted'
                }`}
              >
                <span className="block font-display font-semibold">Grupo {g}</span>
                <span className="block text-xs">{SHORT[g]}</span>
              </li>
            )
          })}
        </ol>
        <p className="mt-3 text-sm text-muted">
          {preview ? (
            <>
              <span className="font-medium text-ink">{GROUP_NAMES[preview.group]}.</span> {preview.reason}
            </>
          ) : (
            'Llene las tres cifras y le mostramos aquí, en vivo, el marco que le aplica.'
          )}
        </p>
      </div>

      <SubmitButton className="w-full gap-2" pendingLabel="Clasificando…">
        {preview ? `Confirmar Grupo ${preview.group}` : 'Clasificar'}
        <Icon name="siguiente" size={18} />
      </SubmitButton>
    </form>
  )
}

// Lo que acaba de escribir, en plata y en salarios mínimos
function Hint({ value, enSmmlv }: { value: number; enSmmlv: (v: number) => string }) {
  if (value <= 0) return null
  return (
    <p className="animate-fade mt-2 pl-1 text-xs text-muted">
      {formatCompactCOP(value)} · equivale a {enSmmlv(value)} salarios mínimos
    </p>
  )
}
