import Link from 'next/link'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'ghost' | 'link'

// Transición por propiedad (no `transition-colors`): así el anillo de foco aparece sin fundido de color
const solid =
  'inline-flex h-12 items-center justify-center rounded-md text-base transition-[color,background-color,box-shadow,opacity,scale] not-disabled:active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50'

const styles: Record<Variant, string> = {
  primary: `${solid} glow bg-brand-strong px-7 font-semibold text-on-accent hover:glow-strong hover:bg-brand-deep`,
  ghost: `${solid} px-5 font-medium text-ink hover:bg-surface`,
  link: 'text-sm text-muted underline underline-offset-4 transition-[color] hover:text-ink',
}

export function buttonClass(variant: Variant = 'primary', extra = '') {
  return `${styles[variant]} ${extra}`.trim()
}

export function Button({ variant = 'primary', className = '', ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />
}
