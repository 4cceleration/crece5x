'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { auth } from '@/lib/auth'
import { requireUser } from '@/lib/session'
import { getMailer } from '@/mail/mailer'
import { emailChangeCodeEmail } from '@/mail/templates'
import { OTP_MINUTES } from '@/domain/otp'
import { audit } from '@/services/audit'
import { cancelEmailChange, confirmEmailChange, requestEmailChange, setEmailPreferences } from '@/services/profile'

// Los formularios del perfil funcionan sin JavaScript: cada acción vuelve a /perfil con el aviso
function back(params: Record<string, string>): never {
  redirect(`/perfil?${new URLSearchParams(params)}`)
}

const REQUEST_ERRORS = {
  invalido: 'Escriba un correo válido.',
  igual: 'Ese ya es su correo.',
  ocupado: 'Ese correo ya está registrado en otra cuenta.',
} as const

const CONFIRM_ERRORS = {
  'sin-solicitud': 'No hay ningún cambio de correo pendiente.',
  vencido: 'El código venció. Pida uno nuevo.',
  agotado: 'Demasiados intentos. Pida un código nuevo.',
  incorrecto: 'El código no coincide. Revíselo e intente otra vez.',
  ocupado: 'Ese correo ya está registrado en otra cuenta.',
} as const

export async function requestEmailChangeAction(formData: FormData) {
  const user = await requireUser()
  const result = await requestEmailChange(db, user.id, String(formData.get('email') ?? ''))
  if (!result.ok) back({ error: REQUEST_ERRORS[result.error] })

  const { subject, html } = emailChangeCodeEmail({ name: user.name, code: result.code, minutes: OTP_MINUTES })
  try {
    // El código va a la dirección nueva: así se prueba que es suya
    await getMailer().send({ to: [result.newEmail], subject, html })
  } catch {
    await cancelEmailChange(db, user.id)
    back({ error: 'No pudimos enviar el código. Intente de nuevo.' })
  }
  await audit(db, { userId: user.id, action: 'pedir_cambio_correo', entity: 'user', entityId: user.id })
  back({ ok: 'codigo' })
}

export async function confirmEmailChangeAction(formData: FormData) {
  const user = await requireUser()
  const result = await confirmEmailChange(db, user.id, String(formData.get('code') ?? ''))
  if (!result.ok) back({ error: CONFIRM_ERRORS[result.error] })

  await audit(db, { userId: user.id, action: 'cambiar_correo', entity: 'user', entityId: user.id })
  back({ ok: 'correo' })
}

export async function cancelEmailChangeAction() {
  const user = await requireUser()
  await cancelEmailChange(db, user.id)
  back({})
}

export async function changePasswordAction(formData: FormData) {
  await requireUser()
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  if (newPassword.length < 8) back({ error: 'La contraseña nueva necesita al menos 8 caracteres.' })
  if (newPassword !== String(formData.get('repeatPassword') ?? '')) back({ error: 'Las dos contraseñas no coinciden.' })

  try {
    // Se cierran las demás sesiones: si alguien más tenía la clave vieja, queda fuera
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    })
  } catch {
    back({ error: 'La contraseña actual no es correcta.' })
  }
  back({ ok: 'clave' })
}

export async function savePreferencesAction(formData: FormData) {
  const user = await requireUser()
  await setEmailPreferences(db, user.id, {
    notifyByEmail: formData.get('notifyByEmail') === 'on',
    marketingEmails: formData.get('marketingEmails') === 'on',
  })
  back({ ok: 'preferencias' })
}
