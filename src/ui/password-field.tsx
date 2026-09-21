'use client'
import { useState, type ComponentProps } from 'react'
import { Field } from './field'
import { Icon } from './icons'

// Campo de contraseña con el ojo para verla: escribir a ciegas es la causa número uno
// de que el formulario rebote
export function PasswordField(props: Omit<ComponentProps<typeof Field>, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'

  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={label}
          aria-pressed={visible}
          title={label}
          className="flex size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <Icon name={visible ? 'ocultar' : 'ver'} size={20} />
        </button>
      }
    />
  )
}
