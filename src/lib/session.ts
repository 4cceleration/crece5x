import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db } from '@/db'
import type { Role } from '@/domain/types'
import { getCompanyIdForUser } from '@/services/companies'
import { auth } from './auth'

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: Role
}

export function homeFor(role: Role): string {
  if (role === 'consultor') return '/consultor'
  if (role === 'admin') return '/admin'
  return '/inicio'
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const currentSession = await auth.api.getSession({ headers: await headers() })
  if (!currentSession?.user) return null

  return {
    id: currentSession.user.id,
    name: currentSession.user.name,
    email: currentSession.user.email,
    role: currentSession.user.role as Role,
  }
})

export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/entrar')
  if (roles && !roles.includes(currentUser.role)) redirect(homeFor(currentUser.role))
  return currentUser
}

export async function requireCompany(): Promise<{ user: CurrentUser; companyId: string }> {
  const currentUser = await requireUser(['empresa'])
  const companyId = await getCompanyIdForUser(db, currentUser.id)
  if (!companyId) redirect('/entrar')
  return { user: currentUser, companyId }
}
