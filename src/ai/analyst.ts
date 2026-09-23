import type { Group } from '@/domain/types'
import type { AiFinding, Extracted } from './schemas'
import { gatewayAnalyst } from './gateway-analyst'
import { mockAnalyst } from './mock-analyst'
import { resolveModel } from './model'

export type AnalysisInput = {
  /** Los archivos son declaración de renta, balance de prueba o reportes del software, no estados financieros */
  preliminary?: boolean
}

export interface Analyst {
  extract(text: string, opts?: AnalysisInput): Promise<Extracted>
  judge(i: { text: string; extracted: Extracted; group: Group; alreadyFound?: string[] } & AnalysisInput): Promise<AiFinding[]>
  /** Explica en lenguaje llano la gráfica que la empresa tiene en pantalla */
  explain(i: { title: string; facts: unknown; group: Group; companyName: string }): Promise<string>
}

export function isMockAnalyst(): boolean {
  return !process.env.AI_MODEL?.trim()
}

export function getAnalyst(): Analyst {
  const model = process.env.AI_MODEL?.trim()
  return model ? gatewayAnalyst(resolveModel(model)) : mockAnalyst
}
