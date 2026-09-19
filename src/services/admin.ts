import { and, asc, avg, count, desc, eq, gt } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { appointment, auditLog, company, consultation, question, user } from '@/db/schema'
import type { Settings } from '@/domain/settings'
import type { Question, Role } from '@/domain/types'

export async function adminMetrics(db: Db, now = new Date()) {
  const [{ companies }] = await db.select({ companies: count() }).from(company)
  const [{ completed, avgScore }] = await db
    .select({ completed: count(), avgScore: avg(consultation.finalScore) })
    .from(consultation)
    .where(eq(consultation.status, 'resultado'))
  const [{ upcoming }] = await db
    .select({ upcoming: count() })
    .from(appointment)
    .where(and(eq(appointment.status, 'reservada'), gt(appointment.startsAt, now)))
  return { companies, completed, avgScore: avgScore === null ? null : Math.round(Number(avgScore)), upcoming }
}

export async function listQuestions(db: Db): Promise<Question[]> {
  return db.select().from(question).orderBy(asc(question.order))
}

export async function updateQuestion(db: Db, id: string, patch: { weight: number; active: boolean }): Promise<void> {
  const weight = Math.min(3, Math.max(1, Math.round(patch.weight)))
  await db.update(question).set({ weight, active: patch.active }).where(eq(question.id, id))
}

export async function listUsers(db: Db) {
  return db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
    .from(user)
    .orderBy(asc(user.role), asc(user.name))
}

export async function setUserRole(db: Db, userId: string, role: Role): Promise<void> {
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId))
}

// Números en formato colombiano: "1.750.905" (miles con punto) y "0,7" (decimal con coma)
export function parseNumber(raw: string): number {
  const s = raw.trim()
  const normalized = s.includes(',')
    ? s.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(s)
      ? s.replace(/\./g, '')
      : s
  const n = Number(normalized)
  if (s === '' || !Number.isFinite(n)) throw new Error(`"${raw}" no es un número válido`)
  return n
}

// Claves editables desde la CLI, con su rango permitido
export const SETTING_KEYS: Record<string, { min: number; max: number; help: string }> = {
  smmlv: { min: 1, max: 1e9, help: 'Salario mínimo mensual (COP)' },
  'group1.assetsSmmlv': { min: 1, max: 1e7, help: 'Grupo 1: activos mínimos en SMMLV' },
  'group1.employees': { min: 1, max: 1e6, help: 'Grupo 1: empleados mínimos' },
  'group3.assetsSmmlv': { min: 1, max: 1e7, help: 'Grupo 3: activos máximos en SMMLV' },
  'group3.revenueSmmlv': { min: 1, max: 1e7, help: 'Grupo 3: ingresos máximos en SMMLV' },
  'group3.employees': { min: 1, max: 1e6, help: 'Grupo 3: empleados máximos' },
  'dimensionWeights.D1': { min: 0, max: 100, help: 'Peso: estados financieros' },
  'dimensionWeights.D2': { min: 0, max: 100, help: 'Peso: políticas contables' },
  'dimensionWeights.D3': { min: 0, max: 100, help: 'Peso: reconocimiento y medición' },
  'dimensionWeights.D4': { min: 0, max: 100, help: 'Peso: revelaciones' },
  'dimensionWeights.D5': { min: 0, max: 100, help: 'Peso: cierre contable' },
  'severityPenalty.critica': { min: 0, max: 100, help: 'Penalización hallazgo crítico' },
  'severityPenalty.alta': { min: 0, max: 100, help: 'Penalización hallazgo alto' },
  'severityPenalty.media': { min: 0, max: 100, help: 'Penalización hallazgo medio' },
  'severityPenalty.baja': { min: 0, max: 100, help: 'Penalización hallazgo bajo' },
  'blend.diagnostic': { min: 0, max: 1, help: 'Peso del diagnóstico en el índice (el análisis es 1 − este valor)' },
  consultantThreshold: { min: 0, max: 100, help: 'Índice bajo el cual se deriva a consultor' },
  appointmentMinutes: { min: 15, max: 240, help: 'Duración de la cita (min)' },
}

export function setSetting(current: Settings, key: string, raw: string): Settings {
  const spec = SETTING_KEYS[key]
  if (!spec) throw new Error(`Clave desconocida: ${key}. Use "ajustes ver" para ver las claves.`)
  const value = parseNumber(raw)
  if (value < spec.min || value > spec.max) throw new Error(`${key} debe estar entre ${spec.min} y ${spec.max}`)
  const next = structuredClone(current)
  if (key === 'blend.diagnostic') {
    next.blend = { diagnostic: value, analysis: Math.round((1 - value) * 100) / 100 }
    return next
  }
  const [a, b] = key.split('.')
  if (b) (next as unknown as Record<string, Record<string, number>>)[a][b] = value
  else (next as unknown as Record<string, number>)[a] = value
  return next
}

export function flattenSettings(s: Settings): Record<string, number> {
  const out: Record<string, number> = {}
  for (const key of Object.keys(SETTING_KEYS)) {
    const [a, b] = key.split('.')
    const top = (s as unknown as Record<string, unknown>)[a]
    out[key] = b ? (top as Record<string, number>)[b] : (top as number)
  }
  return out
}

export async function getQuestion(db: Db, id: string) {
  return db.query.question.findFirst({ where: eq(question.id, id) })
}

export async function findUserByEmail(db: Db, email: string) {
  return db.query.user.findFirst({ where: eq(user.email, email.trim().toLowerCase()) })
}

export async function recentAudit(db: Db, limit = 20) {
  return db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(limit)
}
