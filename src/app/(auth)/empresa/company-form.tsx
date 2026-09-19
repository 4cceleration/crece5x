'use client'
import { useActionState } from 'react'
import { completeCompanyAction } from '../actions'
import { Check, Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export function CompanyForm() {
  const [state, action] = useActionState(completeCompanyAction, null)
  return (
    <form action={action} className="space-y-5">
      <Field label="Empresa" name="company" autoComplete="organization" required />
      <Field label="NIT" name="nit" inputMode="numeric" required />
      <Check name="consent" label="Autorizo el tratamiento de mis datos según la Ley 1581 de 2012." required />
      {state?.error && (
        <p role="alert" className="text-sm text-bad">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="Guardando…">
        Continuar
      </SubmitButton>
    </form>
  )
}
