'use server'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import {
  completeReviewIfDone,
  getOwnedConsultation,
  saveAnswer,
  saveClassification,
  setFlag,
  startConsultation,
  stepPath,
  undoLast,
} from '@/services/consultations'
import type { AnswerValue, Flag } from '@/domain/types'
import { getAnalyst } from '@/ai/analyst'
import { getStorage } from '@/storage/storage'
import { appUrl, getMailer } from '@/mail/mailer'
import { renderReportPdf } from '@/report/report-pdf'
import { removeUpload, saveUpload } from '@/services/uploads'
import { runAnalysis } from '@/services/analysis'
import { finalizeConsultation, getResultData, sendReport } from '@/services/report'
import { buildChartData, chartFacts, CHART_TITLES, isChartKey } from '@/domain/charts'
import { audit } from '@/services/audit'

async function owned(id: string) {
  const { companyId, user } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  return { c, companyId, user }
}

const money = (v: FormDataEntryValue | null) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0

export async function startConsultationAction() {
  const { companyId } = await requireCompany()
  const id = await startConsultation(db, companyId)
  const c = await getOwnedConsultation(db, id, companyId)
  redirect(stepPath(id, c!.status))
}

export async function classifyAction(id: string, fd: FormData) {
  await owned(id)
  await saveClassification(db, id, {
    assets: money(fd.get('assets')),
    revenue: money(fd.get('revenue')),
    employees: money(fd.get('employees')),
    issuesSecurities: fd.get('issuesSecurities') === 'on',
    publicInterest: fd.get('publicInterest') === 'on',
  })
  redirect(`/consulta/${id}/clasificar`)
}

async function goNext(id: string) {
  const done = await completeReviewIfDone(db, id)
  redirect(done ? `/consulta/${id}/examinar` : `/consulta/${id}/revisar`)
}

export async function flagAction(id: string, flag: Flag, fd: FormData) {
  await owned(id)
  await setFlag(db, id, flag, fd.get('value') === 'si')
  await goNext(id)
}

const ANSWERS: AnswerValue[] = ['si', 'parcial', 'no', 'nose']

export async function answerAction(id: string, questionId: string, fd: FormData) {
  await owned(id)
  const value = fd.get('value') as AnswerValue
  if (!ANSWERS.includes(value)) redirect(`/consulta/${id}/revisar`)
  await saveAnswer(db, id, questionId, value)
  await goNext(id)
}

export async function undoAction(id: string) {
  await owned(id)
  await undoLast(db, id)
  redirect(`/consulta/${id}/revisar`)
}

export async function uploadAction(id: string, fd: FormData) {
  const { user } = await owned(id)
  const storage = getStorage()
  for (const file of fd.getAll('files')) {
    if (!(file instanceof File) || file.size === 0) continue
    const r = await saveUpload(db, storage, {
      consultationId: id,
      name: file.name,
      size: file.size,
      bytes: Buffer.from(await file.arrayBuffer()),
      // Texto que el navegador ya reconoció si el PDF venía escaneado
      text: (fd.get(`texto:${file.name}`) as string | null)?.trim() || null,
    })
    if (!r.ok) redirect(`/consulta/${id}/examinar?error=${encodeURIComponent(`${file.name}: ${r.error}`)}`)
    await audit(db, { userId: user.id, action: 'subir_archivo', entity: 'upload', entityId: r.id })
  }
  redirect(`/consulta/${id}/examinar`)
}

// La explicación se pide al abrir el diálogo de una gráfica: el modelo solo ve los datos de esa gráfica
export async function explainChartAction(id: string, key: string): Promise<string> {
  await owned(id)
  if (!isChartKey(key)) throw new Error('Gráfica desconocida')
  const data = await getResultData(db, id)
  if (!data?.financials) throw new Error('Todavía no hay cifras para explicar')
  const charts = buildChartData(data.financials, data.ratios)
  if (!charts) throw new Error('Todavía no hay cifras para explicar')
  return getAnalyst().explain({
    title: CHART_TITLES[key],
    facts: chartFacts(charts, key),
    group: data.group,
    companyName: data.companyName,
  })
}

export async function removeUploadAction(id: string, uploadId: string) {
  await owned(id)
  await removeUpload(db, id, uploadId)
  redirect(`/consulta/${id}/examinar`)
}

async function finish(id: string) {
  await finalizeConsultation(db, id)
  redirect(`/consulta/${id}/resultado`)
}

export async function analyzeAction(id: string) {
  const { user } = await owned(id)
  await runAnalysis(db, id, { analyst: getAnalyst(), storage: getStorage() })
  await audit(db, { userId: user.id, action: 'analizar', entity: 'consultation', entityId: id })
  await finish(id)
}

export async function finalizeAction(id: string) {
  await owned(id)
  await finish(id)
}

// El plan de acción completo (hallazgos + PDF) se entrega solo por correo, a pedido
export async function sendReportAction(id: string) {
  const { user } = await owned(id)
  let sent = false
  try {
    sent = (await sendReport(db, id, { mailer: getMailer(), renderPdf: renderReportPdf, baseUrl: appUrl() })).length > 0
  } catch (e) {
    console.error('No se pudo enviar el reporte', e)
  }
  if (sent) await audit(db, { userId: user.id, action: 'enviar_reporte', entity: 'consultation', entityId: id })
  redirect(`/consulta/${id}/resultado?${sent ? 'enviado=1' : 'error=correo'}`)
}
