import { and, eq, inArray } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { consultation, finding, type AnalysisStatus } from '@/db/schema'
import { GROUP_NAMES } from '@/domain/classify'
import { needsConsultant } from '@/domain/derivation'
import { diagnosticFindings } from '@/domain/findings'
import { learningPath } from '@/domain/learning-path'
import type { Ratios } from '@/domain/ratios'
import { finalIndex, LIGHT_LABEL, scoreAnalysis, scoreDiagnostic, trafficLight } from '@/domain/scoring'
import { DIMENSIONS, SEVERITY_ORDER, type Dimension, type Group, type Light, type NewFinding } from '@/domain/types'
import { LESSONS, type LessonMeta } from '@/academia/lessons'
import type { Mailer } from '@/mail/mailer'
import { reportEmail } from '@/mail/templates'
import { getAnalysis } from './analysis'
import { companyEmails, getCompany } from './companies'
import { loadDiagnosticState } from './consultations'
import { getSettings } from './settings'

export type ResultData = {
  consultationId: string
  companyId: string
  companyName: string
  group: Group
  groupName: string
  finalScore: number
  light: Light
  diagnosticScore: number
  analysisScore: number | null
  dimensions: { key: Dimension; name: string; score: number | null }[]
  findings: (NewFinding & { id: string })[]
  ratios: Ratios | null
  analysisStatus: AnalysisStatus | null
  analysisError: string | null
  needsConsultant: boolean
  completedAt: Date
  path: LessonMeta[]
}

type Deps = { mailer: Mailer; renderPdf: (d: ResultData) => Promise<Buffer>; baseUrl: string }

export async function finalizeConsultation(db: Db, id: string): Promise<void> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  const settings = await getSettings(db)
  const s = await loadDiagnosticState(db, id)

  const diag = scoreDiagnostic(s.questions, s.answers, s.flags, s.group, settings.dimensionWeights)
  const diagFindings = diagnosticFindings(s.questions, s.answers, s.flags, s.group)
  await db.delete(finding).where(and(eq(finding.consultationId, id), eq(finding.source, 'diagnostico')))
  if (diagFindings.length > 0) await db.insert(finding).values(diagFindings.map((f) => ({ ...f, consultationId: id })))

  const a = await getAnalysis(db, id)
  const analysisFindings =
    a?.status === 'listo'
      ? await db.select().from(finding).where(and(eq(finding.consultationId, id), inArray(finding.source, ['chequeo', 'ia'])))
      : []
  const analysisScore = a?.status === 'listo' ? scoreAnalysis(analysisFindings, settings.severityPenalty) : null
  const finalScore = finalIndex(diag.total, analysisScore, settings.blend)
  const needs = needsConsultant({
    hasFinancialStatements: s.flags.tieneEEFF === true,
    finalScore,
    findings: [...diagFindings, ...analysisFindings],
    threshold: settings.consultantThreshold,
  })

  await db
    .update(consultation)
    .set({
      status: 'resultado',
      diagnosticScore: diag.total,
      analysisScore,
      finalScore,
      needsConsultant: needs,
      completedAt: c.completedAt ?? new Date(),
    })
    .where(eq(consultation.id, id))
}

// El plan de acción completo solo se entrega por correo, cuando la empresa lo pide desde el resultado.
// Devuelve los destinatarios.
export async function sendReport(db: Db, id: string, deps: Deps): Promise<string[]> {
  const data = await getResultData(db, id)
  if (!data) return []
  const to = await companyEmails(db, data.companyId)
  if (to.length === 0) return []
  const { subject, html } = reportEmail({
    companyName: data.companyName,
    score: data.finalScore,
    lightLabel: LIGHT_LABEL[data.light],
    findings: data.findings,
    url: `${deps.baseUrl}/consulta/${id}/resultado`,
    needsConsultant: data.needsConsultant,
  })
  const pdf = await deps.renderPdf(data)
  await deps.mailer.send({ to, subject, html, attachments: [{ filename: 'reporte-crece5x.pdf', content: pdf }] })
  return to
}

export async function getResultData(db: Db, id: string): Promise<ResultData | null> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c || c.status !== 'resultado' || c.finalScore === null || c.completedAt === null) return null
  const settings = await getSettings(db)
  const s = await loadDiagnosticState(db, id)
  const company = await getCompany(db, c.companyId)
  const a = await getAnalysis(db, id)
  const diag = scoreDiagnostic(s.questions, s.answers, s.flags, s.group, settings.dimensionWeights)

  const rows = await db.select().from(finding).where(eq(finding.consultationId, id))
  const findings = rows
    .filter((f) => f.source === 'diagnostico' || a?.status === 'listo')
    .sort((x, y) => SEVERITY_ORDER.indexOf(x.severity) - SEVERITY_ORDER.indexOf(y.severity))

  return {
    consultationId: id,
    companyId: c.companyId,
    companyName: company?.name ?? '',
    group: s.group,
    groupName: GROUP_NAMES[s.group],
    finalScore: c.finalScore,
    light: trafficLight(c.finalScore),
    diagnosticScore: c.diagnosticScore ?? diag.total,
    analysisScore: c.analysisScore,
    dimensions: DIMENSIONS.map((d) => ({ key: d.key, name: d.name, score: diag.dimensions[d.key] })),
    findings,
    ratios: a?.status === 'listo' ? (a.ratios ?? null) : null,
    analysisStatus: a?.status ?? null,
    analysisError: a?.status === 'error' ? a.error : null,
    needsConsultant: c.needsConsultant ?? false,
    completedAt: c.completedAt,
    path: learningPath(findings, LESSONS),
  }
}
