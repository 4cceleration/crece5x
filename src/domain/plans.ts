// Planes y qué habilita cada uno. Por ahora es maqueta: la empresa se cambia de plan
// desde /planes sin pagar, para que los primeros usuarios prueben cada nivel.

export type PlanKey = 'gratis' | 'reporte' | 'monitoreo' | 'acompanamiento'

export type Scope =
  /** Ver el plan de acción en pantalla; sin esto se entrega por correo */
  | 'plan-accion'
  /** Todas las gráficas de la analítica; sin esto solo se ven las cifras del último cierre */
  | 'analitica'
  /** El botón "?" que le pide al modelo explicar una gráfica */
  | 'explicacion-ia'
  /** Comparar el índice entre cierres */
  | 'historico'
  /** Consultor asignado y horas incluidas (agendar sigue abierto para todos) */
  | 'consultor'

export type Plan = {
  key: PlanKey
  name: string
  /** Precio en pesos; 0 es gratis */
  price: number
  period: 'unico' | 'mes' | null
  tagline: string
  includes: string[]
  scopes: Scope[]
  /** Cuántos análisis con IA puede hacer; null es sin límite */
  analyses: number | null
}

export const PLANS: Record<PlanKey, Plan> = {
  gratis: {
    key: 'gratis',
    name: 'Diagnóstico',
    price: 0,
    period: null,
    tagline: 'Sepa cómo está, sin pagar nada.',
    includes: [
      'Índice de salud NIIF y puntaje por dimensión',
      'Un análisis de sus estados financieros con IA',
      'Las cifras de su último cierre',
      'Plan de acción por correo',
    ],
    scopes: [],
    analyses: 1,
  },
  reporte: {
    key: 'reporte',
    name: 'Reporte NIIF',
    price: 890_000,
    period: 'unico',
    tagline: 'El diagnóstico completo, para trabajarlo con su contador.',
    includes: [
      'Todo lo del Diagnóstico',
      'Plan de acción en pantalla, con la sección NIIF de cada hallazgo',
      'Analítica financiera completa',
      'Hasta 3 análisis con IA',
    ],
    scopes: ['plan-accion', 'analitica'],
    analyses: 3,
  },
  monitoreo: {
    key: 'monitoreo',
    name: 'Monitoreo',
    price: 390_000,
    period: 'mes',
    tagline: 'Su contabilidad vigilada cierre a cierre.',
    includes: [
      'Todo lo del Reporte',
      'Explicación de cada gráfica con IA (el botón “?”)',
      'Comparación del índice entre cierres',
      'Hasta 12 análisis al año',
    ],
    scopes: ['plan-accion', 'analitica', 'explicacion-ia', 'historico'],
    analyses: 12,
  },
  acompanamiento: {
    key: 'acompanamiento',
    name: 'Acompañamiento',
    price: 1_490_000,
    period: 'mes',
    tagline: 'Un consultor encima de sus números.',
    includes: [
      'Todo lo del Monitoreo',
      'Consultor asignado y 2 horas al mes',
      'Academia completa',
      'Análisis sin límite',
    ],
    scopes: ['plan-accion', 'analitica', 'explicacion-ia', 'historico', 'consultor'],
    analyses: null,
  },
}

// Servicio de única vez para quien no lleva contabilidad formal: no es un plan, lo hace un consultor.
// Al terminar, la empresa ya tiene estados financieros y puede seguirlos con Monitoreo
export const PRIMER_CIERRE = {
  name: 'Primer cierre NIIF',
  price: 1_900_000,
  tagline: 'Para empresas sin contabilidad formal: salga con sus primeros estados financieros.',
  includes: [
    'Estado de situación financiera de apertura',
    'Estado de resultados del último período',
    'Manual de políticas contables mínimas',
    'Acompañamiento de un consultor hasta el cierre',
  ],
}

export const PLAN_ORDER: PlanKey[] = ['gratis', 'reporte', 'monitoreo', 'acompanamiento']

export const DEFAULT_PLAN: PlanKey = 'gratis'

export function isPlanKey(value: string): value is PlanKey {
  return value in PLANS
}

export function can(plan: PlanKey, scope: Scope): boolean {
  return PLANS[plan].scopes.includes(scope)
}

/** El plan más barato que incluye eso: sirve para decir en pantalla a dónde hay que subir */
export function planFor(scope: Scope): Plan {
  return PLANS[PLAN_ORDER.find((k) => can(k, scope))!]
}

export function analysesLeft(plan: PlanKey, used: number): number | null {
  const limit = PLANS[plan].analyses
  return limit === null ? null : Math.max(0, limit - used)
}

export function canAnalyze(plan: PlanKey, used: number): boolean {
  const left = analysesLeft(plan, used)
  return left === null || left > 0
}
