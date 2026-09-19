import { requireCompany } from '@/lib/session'

export default async function InicioPage() {
  const { user } = await requireCompany()
  return <h1 className="text-3xl font-semibold">Hola, {user.name.split(' ')[0]}</h1>
}
