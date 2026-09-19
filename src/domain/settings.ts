import type { Dimension, Severity } from './types'

export type Settings = {
  smmlv: number
  group1: { assetsSmmlv: number; employees: number }
  group3: { assetsSmmlv: number; revenueSmmlv: number; employees: number }
  dimensionWeights: Record<Dimension, number>
  severityPenalty: Record<Severity, number>
  blend: { diagnostic: number; analysis: number }
  consultantThreshold: number
  appointmentMinutes: number
}

export const DEFAULT_SETTINGS: Settings = {
  // Valor 2025. Actualizarlo cada año desde /admin/ajustes.
  smmlv: 1_423_500,
  group1: { assetsSmmlv: 30_000, employees: 200 },
  group3: { assetsSmmlv: 500, revenueSmmlv: 6_000, employees: 10 },
  dimensionWeights: { D1: 25, D2: 20, D3: 25, D4: 15, D5: 15 },
  severityPenalty: { critica: 20, alta: 10, media: 5, baja: 2 },
  blend: { diagnostic: 0.6, analysis: 0.4 },
  consultantThreshold: 60,
  appointmentMinutes: 60,
}

export function mergeSettings(stored?: Partial<Settings>): Settings {
  const s = stored ?? {}
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    group1: { ...DEFAULT_SETTINGS.group1, ...s.group1 },
    group3: { ...DEFAULT_SETTINGS.group3, ...s.group3 },
    dimensionWeights: { ...DEFAULT_SETTINGS.dimensionWeights, ...s.dimensionWeights },
    severityPenalty: { ...DEFAULT_SETTINGS.severityPenalty, ...s.severityPenalty },
    blend: { ...DEFAULT_SETTINGS.blend, ...s.blend },
  }
}
