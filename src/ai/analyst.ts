import type { Group } from '@/domain/types'
import type { AiFinding, Extracted } from './schemas'
import { gatewayAnalyst } from './gateway-analyst'
import { mockAnalyst } from './mock-analyst'
import { resolveModel } from './model'

export interface Analyst {
  extract(text: string): Promise<Extracted>
  judge(i: { text: string; extracted: Extracted; group: Group; alreadyFound?: string[] }): Promise<AiFinding[]>
}

export function isMockAnalyst(): boolean {
  return !process.env.AI_MODEL?.trim()
}

export function getAnalyst(): Analyst {
  const model = process.env.AI_MODEL?.trim()
  return model ? gatewayAnalyst(resolveModel(model)) : mockAnalyst
}
