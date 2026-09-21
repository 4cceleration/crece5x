'use client'
import { useState } from 'react'
import { Field } from './field'

// Contador con − y +: el spinner nativo es diminuto y feo, y aquí el número se toca mucho
export function CounterField({
  label,
  name,
  defaultValue,
  min = 0,
  max = 100_000,
  step = 1,
  onCount,
}: {
  label: string
  name: string
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onCount?: (count: number | null) => void
}) {
  const [value, setValue] = useState(defaultValue === undefined ? '' : String(defaultValue))

  function set(next: string) {
    setValue(next)
    onCount?.(next === '' ? null : Number(next))
  }

  const bump = (by: number) => set(String(Math.min(max, Math.max(min, (Number(value) || 0) + by))))
  const button =
    'flex size-9 items-center justify-center rounded-md text-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40'

  return (
    <Field
      label={label}
      name={name}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      required
      value={value}
      onChange={(e) => set(e.currentTarget.value.replace(/\D/g, ''))}
      className="pr-24 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      trailing={
        <span className="flex items-center gap-0.5">
          <button type="button" onClick={() => bump(-step)} aria-label={`Restar ${step}`} disabled={Number(value) <= min} className={button}>
            −
          </button>
          <button type="button" onClick={() => bump(step)} aria-label={`Sumar ${step}`} className={button}>
            +
          </button>
        </span>
      }
    />
  )
}
