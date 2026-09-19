'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestResetAction } from '../actions'
import { AuthCard } from '@/ui/auth-card'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export default function RecuperarPage() {
  const [state, action] = useActionState(requestResetAction, null)

  if (state?.sent) {
    return (
      <AuthCard title="Revise su correo">
        <div className="space-y-5 text-center">
          <p className="text-muted">
            Si hay una cuenta con ese correo, le enviamos un enlace para crear una nueva contraseña.
          </p>
          <Link href="/entrar" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
            Iniciar sesión
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Recuperar contraseña">
      <form action={action} className="space-y-5">
        <p className="text-muted">Escriba su correo y le enviamos un enlace para crear una nueva contraseña.</p>
        <Field label="Correo" name="email" type="email" autoComplete="email" required />
        {state?.error && (
          <p role="alert" className="text-sm text-bad">
            {state.error}
          </p>
        )}
        <SubmitButton className="w-full" pendingLabel="Enviando…">
          Enviar enlace
        </SubmitButton>
        <p className="text-center text-sm">
          <Link href="/entrar" className="text-muted underline underline-offset-4 hover:text-ink">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
