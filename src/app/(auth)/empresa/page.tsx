import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getCompanyIdForUser } from '@/services/companies'
import { AuthCard } from '@/ui/auth-card'
import { CompanyForm } from './company-form'

// Paso único para quien entró con Google y aún no tiene empresa
export default async function EmpresaPage() {
  const user = await requireUser(['empresa'])
  if (await getCompanyIdForUser(db, user.id)) redirect('/inicio')
  return (
    <AuthCard title="Su empresa">
      <CompanyForm />
    </AuthCard>
  )
}
