import { and, asc, avg, count, eq, gt } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { appointment, company, consultation, question, user } from '@/db/schema'
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

const num = (v: FormDataEntryValue | null, fallback: number): number => {
  if (v === null || String(v).trim() === '') return fallback
  // Acepta "1.750.905" (miles con punto) y "0,7" (decimal con coma)
  const s = String(v).trim()
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s
  const n = Number(normalized)
  return Number.isFinite(n) ? n : fallback
}

export function settingsFromForm(fd: FormData, current: Settings): Settings {
  const diagnostic = Math.min(1, Math.max(0, num(fd.get('blend.diagnostic'), current.blend.diagnostic)))
  return {
    smmlv: num(fd.get('smmlv'), current.smmlv),
    group1: {
      assetsSmmlv: num(fd.get('group1.assetsSmmlv'), current.group1.assetsSmmlv),
      employees: num(fd.get('group1.employees'), current.group1.employees),
    },
    group3: {
      assetsSmmlv: num(fd.get('group3.assetsSmmlv'), current.group3.assetsSmmlv),
      revenueSmmlv: num(fd.get('group3.revenueSmmlv'), current.group3.revenueSmmlv),
      employees: num(fd.get('group3.employees'), current.group3.employees),
    },
    dimensionWeights: {
      D1: num(fd.get('dimensionWeights.D1'), current.dimensionWeights.D1),
      D2: num(fd.get('dimensionWeights.D2'), current.dimensionWeights.D2),
      D3: num(fd.get('dimensionWeights.D3'), current.dimensionWeights.D3),
      D4: num(fd.get('dimensionWeights.D4'), current.dimensionWeights.D4),
      D5: num(fd.get('dimensionWeights.D5'), current.dimensionWeights.D5),
    },
    severityPenalty: {
      critica: num(fd.get('severityPenalty.critica'), current.severityPenalty.critica),
      alta: num(fd.get('severityPenalty.alta'), current.severityPenalty.alta),
      media: num(fd.get('severityPenalty.media'), current.severityPenalty.media),
      baja: num(fd.get('severityPenalty.baja'), current.severityPenalty.baja),
    },
    blend: { diagnostic, analysis: Math.round((1 - diagnostic) * 100) / 100 },
    consultantThreshold: num(fd.get('consultantThreshold'), current.consultantThreshold),
    appointmentMinutes: num(fd.get('appointmentMinutes'), current.appointmentMinutes),
  }
}
