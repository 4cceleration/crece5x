'use client'
import { useRef, useState, type ComponentProps } from 'react'
import { Field } from './field'
import { caretAfterFormat, formatThousands } from './money'

// Campo de dinero con separador de miles mientras se escribe (100.000.000)
export function MoneyField({
  defaultValue,
  onAmount,
  ...props
}: Omit<ComponentProps<typeof Field>, 'defaultValue' | 'value' | 'onChange'> & {
  defaultValue?: number | string
  /** Avisa el monto en número mientras se escribe */
  onAmount?: (amount: number) => void
}) {
  const [value, setValue] = useState(defaultValue === undefined ? '' : formatThousands(String(defaultValue)))
  const ref = useRef<HTMLInputElement>(null)
  return (
    <Field
      {...props}
      ref={ref}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(e) => {
        const input = e.currentTarget
        const caret = input.selectionStart ?? input.value.length
        const digitsBefore = input.value.slice(0, caret).replace(/\D/g, '').length
        const next = formatThousands(input.value)
        setValue(next)
        onAmount?.(Number(next.replace(/\D/g, '')) || 0)
        requestAnimationFrame(() => {
          const pos = caretAfterFormat(next, digitsBefore)
          ref.current?.setSelectionRange(pos, pos)
        })
      }}
    />
  )
}
