'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '../actions'
import { Check, Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export default function RegistroPage() {
  const [state, action] = useActionState(registerAction, null)

  return (
    <form action={action} className="space-y-5">
      <h1 className="text-3xl font-semibold">Crear cuenta</h1>
      <Field label="Tu nombre" name="name" autoComplete="name" required />
      <Field label="Empresa" name="company" autoComplete="organization" required />
      <Field label="NIT" name="nit" inputMode="numeric" required />
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Check
        name="consent"
        label="Autorizo el tratamiento de mis datos según la Ley 1581 de 2012."
        required
      />
      {state?.error && (
        <p role="alert" className="text-sm text-bad">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="Creando…">
        Crear cuenta
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿Ya tiene cuenta?{' '}
        <Link href="/entrar" className="text-ink underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  )
}
