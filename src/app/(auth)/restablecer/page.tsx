import Link from 'next/link'
import { AuthCard } from '@/ui/auth-card'
import { ResetForm } from './reset-form'

export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams
  if (!token || error) {
    return (
      <AuthCard title="Enlace no válido">
        <div className="space-y-5 text-center">
          <p className="text-muted">El enlace venció o no es válido.</p>
          <Link href="/recuperar" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
            Solicitar otro enlace
          </Link>
        </div>
      </AuthCard>
    )
  }
  return (
    <AuthCard title="Nueva contraseña">
      <ResetForm token={token} />
    </AuthCard>
  )
}
