import { planFor } from '@/domain/plans'
import { ButtonLink } from '@/ui/button'
import { Icon } from '@/ui/icons'

// Aviso al pie de la vista recortada: qué falta y en qué plan está
export function AnalyticsUpsell() {
  return (
    <div className="glass space-y-4 rounded-lg p-6 text-center sm:p-8">
      <p className="font-medium">El resto de su analítica está en {planFor('analitica').name}</p>
      <p className="text-sm text-muted">
        Comparativo por año, estructura financiera, flujo de efectivo e indicadores con su referencia.
      </p>
      <ButtonLink href="/planes" className="gap-2">
        Ver los planes
        <Icon name="siguiente" size={18} />
      </ButtonLink>
    </div>
  )
}

export const explainUpgrade = {
  href: '/planes',
  label: `Las explicaciones con IA están en el plan ${planFor('explicacion-ia').name}`,
}
