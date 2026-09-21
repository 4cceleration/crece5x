'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { auth } from '@/lib/auth'
import { homeFor } from '@/lib/session'
import { WEB_ROLES } from '@/domain/types'
import { createCompanyForUser, getCompanyIdForUser } from '@/services/companies'
import { setEmailPreferences } from '@/services/profile'
import { getUserRole } from '@/services/users'

export type FormState = { error: string } | null

const registerSchema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  nit: z.string().trim().min(5),
  email: z.email(),
  password: z.string().min(8),
  consent: z.literal('on'),
  // Casillas opcionales: llegan solo si quedaron marcadas
  notifications: z.literal('on').optional(),
  marketing: z.literal('on').optional(),
})

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      error: 'Revise los datos. La contraseña necesita 8 caracteres y debe autorizar el tratamiento de datos.',
    }
  }

  const { name, company, nit, email, password, notifications, marketing } = parsed.data
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email: email.toLowerCase(), password },
      headers: await headers(),
    })
    await createCompanyForUser(db, {
      userId: result.user.id,
      name: company,
      nit,
    })
    await setEmailPreferences(db, result.user.id, {
      notifyByEmail: notifications === 'on',
      marketingEmails: marketing === 'on',
    })
  } catch {
    return {
      error: 'No pudimos crear la cuenta. Puede que el correo ya esté registrado.',
    }
  }

  redirect('/inicio')
}

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')

  let userId: string
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    })
    userId = result.user.id
  } catch {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  const role = await getUserRole(db, userId)
  if (!WEB_ROLES.includes(role)) {
    await auth.api.signOut({ headers: await headers() })
    return { error: 'Esta cuenta no tiene acceso web.' }
  }
  redirect(homeFor(role))
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/entrar')
}

export type ResetState = { error?: string; sent?: boolean } | null

export async function requestResetAction(_: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  if (!z.email().safeParse(email).success) return { error: 'Escriba un correo válido.' }
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/restablecer' },
      headers: await headers(),
    })
  } catch (e) {
    console.error('No se pudo solicitar el restablecimiento', e)
  }
  // Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados
  return { sent: true }
}

export async function resetPasswordAction(_: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get('token') ?? '')
  const newPassword = String(formData.get('password') ?? '')
  if (!token) return { error: 'El enlace no es válido. Solicite uno nuevo.' }
  if (newPassword.length < 8) return { error: 'La contraseña necesita al menos 8 caracteres.' }
  try {
    await auth.api.resetPassword({
      body: { token, newPassword },
      headers: await headers(),
    })
  } catch {
    return { error: 'El enlace venció o ya se usó. Solicite uno nuevo.' }
  }
  redirect('/entrar?restablecida=1')
}

export async function googleSignInAction() {
  const result = await auth.api.signInSocial({
    body: {
      provider: 'google',
      callbackURL: '/inicio',
      newUserCallbackURL: '/empresa',
      errorCallbackURL: '/entrar?error=google',
    },
    headers: await headers(),
  })
  redirect(result.url ?? '/entrar?error=google')
}

const companySchema = z.object({
  company: z.string().trim().min(2),
  nit: z.string().trim().min(5),
  consent: z.literal('on'),
})

// Completa la empresa de quien entró con Google (el registro por correo ya la pide)
export async function completeCompanyAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/entrar')
  const parsed = companySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Revise los datos y autorice el tratamiento de datos.' }
  if (!(await getCompanyIdForUser(db, session.user.id))) {
    await createCompanyForUser(db, { userId: session.user.id, name: parsed.data.company, nit: parsed.data.nit })
  }
  redirect('/inicio')
}
