'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { isPlanKey, PLANS } from '@/domain/plans'
import { audit } from '@/services/audit'
import { setCompanyPlan } from '@/services/plans'

// Maqueta: la empresa se cambia de plan sin pagar, para que los primeros usuarios prueben cada nivel.
// Cuando entre el cobro, esto pasa a ser la vuelta desde la pasarela.
export async function choosePlanAction(formData: FormData) {
  const { companyId, user } = await requireCompany()
  const plan = String(formData.get('plan') ?? '')
  if (!isPlanKey(plan)) redirect('/planes')

  await setCompanyPlan(db, companyId, plan)
  await audit(db, { userId: user.id, action: 'cambiar_plan', entity: 'company', entityId: companyId })
  redirect(`/planes?ok=${PLANS[plan].key}`)
}
