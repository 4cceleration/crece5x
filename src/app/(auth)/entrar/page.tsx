import { GOOGLE_ENABLED } from '@/lib/auth'
import { AuthCard } from '@/ui/auth-card'
import { GoogleButton } from '../google-button'
import { SignInForm } from './sign-in-form'

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ restablecida?: string; error?: string }>
}) {
  const { restablecida, error } = await searchParams
  return (
    <AuthCard title="Iniciar sesión">
      {GOOGLE_ENABLED && <GoogleButton />}
      {error === 'google' && (
        <p className="mb-5 text-sm text-bad">No pudimos iniciar sesión con Google. Intente de nuevo.</p>
      )}
      <SignInForm reset={restablecida === '1'} />
    </AuthCard>
  )
}
