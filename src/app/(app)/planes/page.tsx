import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getCompanyPlan } from '@/services/plans'
import { PLAN_ORDER, PLANS, type Plan } from '@/domain/plans'
import { formatCompactCOP } from '@/domain/format'
import { choosePlanAction } from './actions'
import { SubmitButton } from '@/ui/submit-button'
import { Icon } from '@/ui/icons'

function price(plan: Plan): string {
  if (plan.price === 0) return 'Gratis'
  return `${formatCompactCOP(plan.price)}${plan.period === 'mes' ? ' / mes' : ''}`
}

export default async function PlanesPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams
  const { companyId } = await requireCompany()
  const { plan: current, used, left } = await getCompanyPlan(db, companyId)

  return (
    <div className="animate-enter space-y-6 pt-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Planes</h1>
        <p className="text-muted">
          Estamos en pruebas: cámbiese de plan cuando quiera, sin pagar, y pruebe cada nivel. Su plan actual es{' '}
          <span className="text-ink">{PLANS[current].name}</span>.{' '}
          {left === null ? 'Tiene análisis sin límite.' : `Ha usado ${used} ${used === 1 ? 'análisis' : 'análisis'} y le ${left === 1 ? 'queda 1' : `quedan ${left}`}.`}
        </p>
      </header>

      {ok && (
        <p role="status" className="animate-fade flex items-center gap-2 rounded-md bg-brand-soft px-4 py-3 text-brand-strong">
          <Icon name="check" size={20} />
          Listo, está probando el plan {PLANS[current].name}.
        </p>
      )}

      <ul className="grid gap-6 lg:grid-cols-2">
        {PLAN_ORDER.map((key) => {
          const plan = PLANS[key]
          const active = key === current
          return (
            <li key={key} className={`glass flex flex-col gap-5 rounded-lg p-6 sm:p-8 ${active ? 'ring-2 ring-brand' : ''}`}>
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <span className="font-display text-xl font-semibold">{plan.name}</span>
                  {active && (
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-strong">
                      Su plan
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted">{plan.tagline}</p>
              </div>

              <p className="font-display text-3xl font-semibold tabular-nums">
                {price(plan)}
                {plan.period === 'unico' && <span className="text-base font-normal text-muted"> pago único</span>}
              </p>

              <ul className="space-y-2 text-sm">
                {plan.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Icon name="check" size={18} className="mt-0.5 text-brand-strong" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <form action={choosePlanAction} className="mt-auto">
                <input type="hidden" name="plan" value={key} />
                <SubmitButton
                  variant={active ? 'ghost' : 'primary'}
                  disabled={active}
                  className="w-full"
                  pendingLabel="Cambiando…"
                >
                  {active ? 'Es el que está usando' : `Probar ${plan.name}`}
                </SubmitButton>
              </form>
            </li>
          )
        })}
      </ul>

      <p className="text-sm text-muted">
        Todavía no cobramos nada: los precios son los de lanzamiento y el cambio de plan es inmediato.
      </p>
    </div>
  )
}
