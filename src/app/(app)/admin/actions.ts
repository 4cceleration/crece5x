'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { audit } from '@/services/audit'
import { getSettings, saveSettings } from '@/services/settings'
import { setUserRole, settingsFromForm, updateQuestion } from '@/services/admin'
import { createUserWithPassword } from '@/services/users'
import type { Role } from '@/domain/types'

const ROLES: Role[] = ['empresa', 'consultor', 'admin']

export async function updateQuestionAction(id: string, fd: FormData) {
  const admin = await requireUser(['admin'])
  await updateQuestion(db, id, { weight: Number(fd.get('weight')), active: fd.get('active') === 'on' })
  await audit(db, { userId: admin.id, action: 'editar_pregunta', entity: 'question', entityId: id })
  redirect(`/admin/preguntas#${id}`)
}

export async function saveSettingsAction(fd: FormData) {
  const admin = await requireUser(['admin'])
  await saveSettings(db, settingsFromForm(fd, await getSettings(db)))
  await audit(db, { userId: admin.id, action: 'editar_ajustes', entity: 'setting', entityId: 'app' })
  redirect('/admin/ajustes?ok=1')
}

export async function setRoleAction(userId: string, fd: FormData) {
  const admin = await requireUser(['admin'])
  const role = fd.get('role') as Role
  if (!ROLES.includes(role) || userId === admin.id) redirect('/admin/usuarios')
  await setUserRole(db, userId, role)
  await audit(db, { userId: admin.id, action: `rol_${role}`, entity: 'user', entityId: userId })
  redirect('/admin/usuarios')
}

export async function createConsultantAction(fd: FormData) {
  const admin = await requireUser(['admin'])
  const name = String(fd.get('name') ?? '').trim()
  const email = String(fd.get('email') ?? '').trim()
  const password = String(fd.get('password') ?? '')
  if (name.length < 2 || !email.includes('@') || password.length < 8) redirect('/admin/usuarios?error=1')
  const id = await createUserWithPassword(db, { name, email, password, role: 'consultor' })
  await audit(db, { userId: admin.id, action: 'crear_consultor', entity: 'user', entityId: id })
  redirect('/admin/usuarios')
}
