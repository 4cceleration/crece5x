import { z } from 'zod'

const money = z.number().nullable()

export const periodSchema = z.object({
  label: z.string().describe('Año o fecha de corte, p. ej. "2025"'),
  totalAssets: money,
  currentAssets: money,
  nonCurrentAssets: money,
  totalLiabilities: money,
  currentLiabilities: money,
  nonCurrentLiabilities: money,
  equity: money,
  cash: money.describe('Efectivo y equivalentes al cierre'),
  inventories: money,
  revenue: money.describe('Ingresos de actividades ordinarias'),
  netIncome: money.describe('Resultado del ejercicio'),
})

export const extractedSchema = z.object({
  statements: z.object({
    esf: z.boolean().describe('Estado de situación financiera / balance general'),
    eri: z.boolean().describe('Estado de resultados (integral)'),
    flujo: z.boolean().describe('Estado de flujos de efectivo'),
    patrimonio: z.boolean().describe('Estado de cambios en el patrimonio'),
    notas: z.boolean().describe('Notas a los estados financieros'),
  }),
  periods: z.array(periodSchema).min(1).describe('Del más reciente al más antiguo'),
  cashFlow: z
    .object({
      openingCash: money,
      operating: money,
      investing: money,
      financing: money,
      closingCash: money,
    })
    .nullable()
    .describe('Del período más reciente; null si no hay flujo de efectivo'),
  currency: z.string().nullable(),
})

export const judgeSchema = z.object({
  findings: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        niifSection: z.string().describe('p. ej. "Sección 13"'),
        severity: z.enum(['critica', 'alta', 'media', 'baja']),
        recommendation: z.string(),
      }),
    )
    .max(8),
})

export type Extracted = z.infer<typeof extractedSchema>
export type Period = z.infer<typeof periodSchema>
export type AiFinding = z.infer<typeof judgeSchema>['findings'][number]
