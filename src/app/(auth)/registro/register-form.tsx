'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '../actions'
import { Check, Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, null)

  return (
      <form action={action} className="space-y-5">
        <Field label="Tu nombre" name="name" autoComplete="name" required />
        <Field label="Empresa" name="company" autoComplete="organization" required />
        <Field label="NIT" name="nit" inputMode="numeric" required />
        <Field label="Correo" name="email" type="email" autoComplete="email" required />
        <Field label="Contraseña" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <Check name="consent" label="Autorizo el tratamiento de mis datos según la Ley 1581 de 2012." required />
        {state?.error && (
          <p role="alert" className="animate-fade text-sm text-bad">
            {state.error}
          </p>
        )}
        <SubmitButton className="w-full" pendingLabel="Creando…">
          Crear cuenta
        </SubmitButton>
        <p className="text-center text-sm text-muted">
          <Link href="/entrar" className="text-muted underline underline-offset-4 hover:text-ink">
            Iniciar sesión
          </Link>
        </p>
      </form>
  )
}
