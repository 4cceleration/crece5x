'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { auth } from '@/lib/auth'
import { homeFor } from '@/lib/session'
import { createCompanyForUser } from '@/services/companies'
import { getUserRole } from '@/services/users'

export type FormState = { error: string } | null

const registerSchema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  nit: z.string().trim().min(5),
  email: z.email(),
  password: z.string().min(8),
  consent: z.literal('on'),
})

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      error: 'Revise los datos. La contraseña necesita 8 caracteres y debe autorizar el tratamiento de datos.',
    }
  }

  const { name, company, nit, email, password } = parsed.data
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email: email.toLowerCase(), password },
      headers: await headers(),
    })
    await createCompanyForUser(db, { userId: result.user.id, name: company, nit })
  } catch {
    return { error: 'No pudimos crear la cuenta. Puede que el correo ya esté registrado.' }
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

  redirect(homeFor(await getUserRole(db, userId)))
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/entrar')
}
