import type { Extracted } from '@/ai/schemas'
import type { Group, NewFinding, Severity } from './types'

const TOLERANCE = 0.005

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > TOLERANCE * Math.max(Math.abs(a), Math.abs(b), 1)
}

const fmt = (v: number) => v.toLocaleString('es-CO', { maximumFractionDigits: 0 })

function f(
  severity: Severity,
  title: string,
  detail: string,
  niifSection: string,
  recommendation: string,
  lesson: string,
): NewFinding {
  return { source: 'chequeo', severity, title, detail, niifSection, recommendation, lesson }
}

const REQUIRED: { key: keyof Extracted['statements']; groups: Group[]; finding: NewFinding }[] = [
  { key: 'esf', groups: [1, 2, 3], finding: f('critica', 'Falta el estado de situación financiera', 'No se encontró en los archivos cargados.', 'Sección 4', 'Incluya el estado de situación financiera del cierre.', 'presentacion') },
  { key: 'eri', groups: [1, 2, 3], finding: f('critica', 'Falta el estado de resultados', 'No se encontró en los archivos cargados.', 'Sección 5', 'Incluya el estado de resultados del período.', 'presentacion') },
  { key: 'flujo', groups: [1, 2], finding: f('alta', 'Falta el estado de flujos de efectivo', 'Es obligatorio para su grupo.', 'Sección 7', 'Prepare el estado de flujos de efectivo por actividades.', 'flujo-efectivo') },
  { key: 'patrimonio', groups: [1, 2], finding: f('alta', 'Falta el estado de cambios en el patrimonio', 'Es obligatorio para su grupo.', 'Sección 6', 'Prepare el estado de cambios en el patrimonio.', 'presentacion') },
  { key: 'notas', groups: [1, 2, 3], finding: f('alta', 'Faltan las notas a los estados financieros', 'No se encontraron notas explicativas.', 'Sección 8', 'Redacte notas con políticas, juicios y detalle de partidas.', 'notas') },
]

export function runChecks(e: Extracted, group: Group): NewFinding[] {
  const out: NewFinding[] = []

  for (const r of REQUIRED) {
    if (r.groups.includes(group) && !e.statements[r.key]) out.push(r.finding)
  }

  const p = e.periods[0]
  if (p) {
    if (p.totalAssets !== null && p.totalLiabilities !== null && p.equity !== null) {
      const right = p.totalLiabilities + p.equity
      if (differs(p.totalAssets, right)) {
        out.push(f('critica', 'El estado de situación financiera no cuadra', `Activo ${fmt(p.totalAssets)} frente a pasivo más patrimonio ${fmt(right)}.`, 'Sección 4', 'Revise saldos y reclasificaciones hasta que activo = pasivo + patrimonio.', 'presentacion'))
      }
    }
    if (p.totalAssets !== null && p.currentAssets !== null && p.nonCurrentAssets !== null && differs(p.totalAssets, p.currentAssets + p.nonCurrentAssets)) {
      out.push(f('media', 'Los subtotales del activo no suman el total', 'Corriente más no corriente difiere del total del activo.', 'Sección 4', 'Revise la clasificación corriente y no corriente.', 'presentacion'))
    }
    if (p.totalLiabilities !== null && p.currentLiabilities !== null && p.nonCurrentLiabilities !== null && differs(p.totalLiabilities, p.currentLiabilities + p.nonCurrentLiabilities)) {
      out.push(f('media', 'Los subtotales del pasivo no suman el total', 'Corriente más no corriente difiere del total del pasivo.', 'Sección 4', 'Revise la clasificación corriente y no corriente.', 'presentacion'))
    }
  }

  if (e.periods.length < 2) {
    out.push(f('media', 'No presenta información comparativa', 'Solo se encontró un período.', 'Sección 3', 'Presente las cifras del año anterior junto a las del año actual.', 'presentacion'))
  }

  const cf = e.cashFlow
  if (cf && p) {
    if (cf.closingCash !== null && p.cash !== null && differs(cf.closingCash, p.cash)) {
      out.push(f('alta', 'El efectivo del flujo no coincide con el del balance', `Flujo ${fmt(cf.closingCash)} frente a balance ${fmt(p.cash)}.`, 'Sección 7', 'Concilie el efectivo final del flujo con el estado de situación financiera.', 'flujo-efectivo'))
    }
    if (cf.openingCash !== null && cf.operating !== null && cf.investing !== null && cf.financing !== null && cf.closingCash !== null) {
      const computed = cf.openingCash + cf.operating + cf.investing + cf.financing
      if (differs(computed, cf.closingCash)) {
        out.push(f('alta', 'El flujo de efectivo no cuadra', `Efectivo inicial más flujos da ${fmt(computed)}, pero el final reportado es ${fmt(cf.closingCash)}.`, 'Sección 7', 'Revise la suma de actividades de operación, inversión y financiación.', 'flujo-efectivo'))
      }
    }
  }

  return out
}
