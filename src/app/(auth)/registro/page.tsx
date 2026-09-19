import { GOOGLE_ENABLED } from '@/lib/auth'
import { AuthCard } from '@/ui/auth-card'
import { GoogleButton } from '../google-button'
import { RegisterForm } from './register-form'

export default function RegistroPage() {
  return (
    <AuthCard title="Crear cuenta">
      {GOOGLE_ENABLED && <GoogleButton />}
      <RegisterForm />
    </AuthCard>
  )
}
