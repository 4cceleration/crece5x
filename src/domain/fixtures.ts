import type { Extracted } from '@/ai/schemas'

const M = 1_000_000

export const healthyExtracted: Extracted = {
  statements: { esf: true, eri: true, flujo: true, patrimonio: true, notas: true },
  periods: [
    { label: '2025', totalAssets: 1000 * M, currentAssets: 600 * M, nonCurrentAssets: 400 * M, totalLiabilities: 450 * M, currentLiabilities: 300 * M, nonCurrentLiabilities: 150 * M, equity: 550 * M, cash: 120 * M, inventories: 200 * M, revenue: 1500 * M, netIncome: 90 * M },
    { label: '2024', totalAssets: 900 * M, currentAssets: 550 * M, nonCurrentAssets: 350 * M, totalLiabilities: 420 * M, currentLiabilities: 280 * M, nonCurrentLiabilities: 140 * M, equity: 480 * M, cash: 100 * M, inventories: 180 * M, revenue: 1300 * M, netIncome: 70 * M },
  ],
  cashFlow: { openingCash: 100 * M, operating: 60 * M, investing: -30 * M, financing: -10 * M, closingCash: 120 * M },
  currency: 'COP',
}
