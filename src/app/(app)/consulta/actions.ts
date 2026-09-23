'use server'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import {
  completeReviewIfDone,
  getOwnedConsultation,
  saveAnswer,
  saveClassification,
  setAudience,
  setEeff,
  setFlag,
  startConsultation,
  stepPath,
  undoLast,
} from '@/services/consultations'
import { AUDIENCES, type Audience, type AnswerValue, type Flag } from '@/domain/types'
import { INVITE_DAYS, isEeff } from '@/domain/eeff'
import { accountantInviteEmail } from '@/mail/templates'
import { getCompany } from '@/services/companies'
import { createInvite, EMAIL_RE } from '@/services/invites'
import { getAnalyst } from '@/ai/analyst'
import { getStorage } from '@/storage/storage'
import { appUrl, getMailer } from '@/mail/mailer'
import { renderReportPdf } from '@/report/report-pdf'
import { removeUpload, saveUpload } from '@/services/uploads'
import { runAnalysis, saveFiguresAnalysis } from '@/services/analysis'
import { parseFigures } from '@/domain/figures'
import { finalizeConsultation, getResultData, sendReport } from '@/services/report'
import { buildChartData, chartFacts, CHART_TITLES, isChartKey } from '@/domain/charts'
import { planFor } from '@/domain/plans'
import { companyCan, getCompanyPlan } from '@/services/plans'
import { explainOnce } from '@/services/explanations'
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

// Primera pantalla de la consulta: quién va a responder. Después sigue donde iba (en una nueva, la contabilidad)
export async function audienceAction(id: string, fd: FormData) {
  const { c } = await owned(id)
  const value = fd.get('value') as Audience
  if (AUDIENCES.includes(value)) await setAudience(db, id, value)
  redirect(stepPath(id, c.status))
}

// Vuelve a preguntar quién responde; las respuestas se conservan porque las preguntas son las mismas
export async function changeAudienceAction(id: string) {
  const { c } = await owned(id)
  if (c.status === 'resultado') redirect(stepPath(id, c.status))
  await setAudience(db, id, null)
  redirect(`/consulta/${id}/clasificar`)
}

// Segunda pantalla: formal pregunta después qué tiene del último cierre; empírica queda lista
export async function accountingAction(id: string, fd: FormData) {
  await owned(id)
  if (fd.get('value') === 'empirica') {
    await setEeff(db, id, 'empirica')
    redirect(`/consulta/${id}/clasificar`)
  }
  redirect(`/consulta/${id}/clasificar?contabilidad=formal`)
}

export async function eeffAction(id: string, fd: FormData) {
  await owned(id)
  const value = String(fd.get('value') ?? '')
  if (!isEeff(value)) redirect(`/consulta/${id}/clasificar?contabilidad=formal`)
  await setEeff(db, id, value)
  redirect(`/consulta/${id}/clasificar`)
}

// Vuelve a preguntar cómo lleva la contabilidad; lo ya respondido del cuestionario se conserva
export async function changeAccountingAction(id: string) {
  const { c } = await owned(id)
  if (c.status === 'resultado') redirect(stepPath(id, c.status))
  await setEeff(db, id, null)
  redirect(`/consulta/${id}/clasificar`)
}

// Las cifras que tiene a la mano: arman un balance estimado y llevan directo al resultado
export async function figuresAction(id: string, fd: FormData) {
  const { c, user } = await owned(id)
  if (c.status !== 'examinar') redirect(stepPath(id, c.status))
  const figures = parseFigures((key) => money(fd.get(key)))
  if (figures.sales === 0 && figures.expenses === 0) redirect(`/consulta/${id}/examinar?cifras=1&error=cifras`)
  await saveFiguresAnalysis(db, id, figures)
  await audit(db, { userId: user.id, action: 'escribir_cifras', entity: 'consultation', entityId: id })
  await finish(id)
}

// El contador recibe un enlace para subir los estados financieros sin crear cuenta
export async function inviteAccountantAction(id: string, fd: FormData) {
  const { c, companyId, user } = await owned(id)
  if (c.status !== 'examinar') redirect(stepPath(id, c.status))
  const email = String(fd.get('email') ?? '').trim()
  if (!EMAIL_RE.test(email)) redirect(`/consulta/${id}/examinar?error=correo-contador`)

  const company = await getCompany(db, companyId)
  const { id: inviteId, token } = await createInvite(db, id, email)
  const mail = accountantInviteEmail({
    companyName: company?.name ?? 'Su cliente',
    inviterName: user.name,
    url: `${appUrl()}/contador/${token}`,
    days: INVITE_DAYS,
  })
  try {
    await getMailer().send({ to: [email], ...mail })
  } catch (e) {
    console.error('No se pudo enviar la invitación al contador', e)
    redirect(`/consulta/${id}/examinar?error=envio`)
  }
  await audit(db, { userId: user.id, action: 'invitar_contador', entity: 'accountant_invite', entityId: inviteId })
  redirect(`/consulta/${id}/examinar?invitado=1`)
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

// La explicación se pide al abrir el diálogo de una gráfica: el modelo solo ve los datos de esa gráfica,
// se escribe una sola vez y de ahí en adelante se relee (tocar "?" otra vez no gasta otro análisis)
export async function explainChartAction(id: string, key: string): Promise<string> {
  const { companyId } = await owned(id)
  if (!isChartKey(key)) throw new Error('Gráfica desconocida')
  if (!(await companyCan(db, companyId, 'explicacion-ia'))) {
    throw new Error(`Las explicaciones con IA están en el plan ${planFor('explicacion-ia').name}`)
  }
  const data = await getResultData(db, id)
  if (!data?.financials) throw new Error('Todavía no hay cifras para explicar')
  const charts = buildChartData(data.financials, data.ratios)
  if (!charts) throw new Error('Todavía no hay cifras para explicar')

  return explainOnce(db, id, key, () =>
    getAnalyst().explain({
      title: CHART_TITLES[key],
      facts: chartFacts(charts, key),
      group: data.group,
      companyName: data.companyName,
    }),
  )
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
  const { user, companyId } = await owned(id)
  // El cupo de análisis depende del plan: el gratis alcanza para uno
  const { canAnalyze } = await getCompanyPlan(db, companyId)
  if (!canAnalyze) redirect(`/consulta/${id}/examinar?error=cupo`)
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
