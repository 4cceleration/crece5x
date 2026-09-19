import type { Period } from '@/ai/schemas'

export type Ratios = {
  currentRatio: number | null
  quickRatio: number | null
  debtRatio: number | null
  netMargin: number | null
  roa: number | null
}

export const RATIO_LABELS: { key: keyof Ratios; label: string; percent: boolean }[] = [
  { key: 'currentRatio', label: 'Razón corriente', percent: false },
  { key: 'quickRatio', label: 'Prueba ácida', percent: false },
  { key: 'debtRatio', label: 'Endeudamiento', percent: true },
  { key: 'netMargin', label: 'Margen neto', percent: true },
  { key: 'roa', label: 'Rentabilidad del activo', percent: true },
]

function div(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null
  return Math.round((a / b) * 100) / 100
}

export function computeRatios(p: Period): Ratios {
  return {
    currentRatio: div(p.currentAssets, p.currentLiabilities),
    quickRatio: p.inventories === null || p.currentAssets === null ? null : div(p.currentAssets - p.inventories, p.currentLiabilities),
    debtRatio: div(p.totalLiabilities, p.totalAssets),
    netMargin: div(p.netIncome, p.revenue),
    roa: div(p.netIncome, p.totalAssets),
  }
}
