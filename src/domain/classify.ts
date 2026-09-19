import type { Group } from './types'
import type { Settings } from './settings'

export type ClassificationInput = {
  assets: number
  revenue: number
  employees: number
  issuesSecurities: boolean
  publicInterest: boolean
}

export const GROUP_NAMES: Record<Group, string> = {
  1: 'NIIF Plenas',
  2: 'NIIF para Pymes',
  3: 'Contabilidad simplificada para microempresas',
}

const n = (v: number) => v.toLocaleString('es-CO')

export function classify(
  input: ClassificationInput,
  s: Pick<Settings, 'smmlv' | 'group1' | 'group3'>,
): { group: Group; reason: string } {
  if (input.issuesSecurities) return { group: 1, reason: 'Emite valores en el mercado público.' }
  if (input.publicInterest) return { group: 1, reason: 'Es una entidad de interés público.' }

  const assets = input.assets / s.smmlv
  const revenue = input.revenue / s.smmlv

  if (assets > s.group1.assetsSmmlv) {
    return { group: 1, reason: `Sus activos superan ${n(s.group1.assetsSmmlv)} salarios mínimos.` }
  }
  if (input.employees > s.group1.employees) {
    return { group: 1, reason: `Tiene más de ${n(s.group1.employees)} empleados.` }
  }
  if (
    input.employees <= s.group3.employees &&
    assets < s.group3.assetsSmmlv &&
    revenue < s.group3.revenueSmmlv
  ) {
    return {
      group: 3,
      reason: `Tiene hasta ${s.group3.employees} empleados, activos menores a ${n(s.group3.assetsSmmlv)} e ingresos menores a ${n(s.group3.revenueSmmlv)} salarios mínimos.`,
    }
  }
  return { group: 2, reason: 'No cumple las condiciones del Grupo 1 ni las de microempresa.' }
}
