export type Group = 1 | 2 | 3
export type Dimension = 'D1' | 'D2' | 'D3' | 'D4' | 'D5'
export type Flag = 'tieneEEFF' | 'inventarios' | 'activosFijos' | 'arrendamientos' | 'financiamiento' | 'empleados'
export type Flags = Record<Flag, boolean>
export type AnswerValue = 'si' | 'parcial' | 'no' | 'nose'
export type Severity = 'critica' | 'alta' | 'media' | 'baja'
export type FindingSource = 'diagnostico' | 'chequeo' | 'ia'
export type Light = 'verde' | 'ambar' | 'rojo'
export type Role = 'empresa' | 'consultor' | 'admin'

export type Question = {
  id: string
  dimension: Dimension
  text: string
  help: string
  gap: string
  fix: string
  weight: number
  requiresFlag: Flag | null
  groups: Group[]
  niifSection: string
  lesson: string
  order: number
  active: boolean
}

export type NewFinding = {
  source: FindingSource
  title: string
  detail: string
  niifSection: string
  severity: Severity
  recommendation: string
  lesson: string | null
}

export const DIMENSIONS: { key: Dimension; name: string }[] = [
  { key: 'D1', name: 'Estados financieros' },
  { key: 'D2', name: 'Políticas contables' },
  { key: 'D3', name: 'Reconocimiento y medición' },
  { key: 'D4', name: 'Revelaciones' },
  { key: 'D5', name: 'Cierre contable' },
]

export const SEVERITY_ORDER: Severity[] = ['critica', 'alta', 'media', 'baja']

export const SEVERITY_LABEL: Record<Severity, string> = {
  critica: 'Crítico',
  alta: 'Alto',
  media: 'Medio',
  baja: 'Bajo',
}

export const ANSWER_LABEL: Record<AnswerValue, string> = {
  si: 'Sí',
  parcial: 'Parcial',
  no: 'No',
  nose: 'No sé',
}
