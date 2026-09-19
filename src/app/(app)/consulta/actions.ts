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
