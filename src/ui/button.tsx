import Link from 'next/link'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'ghost' | 'link'

const styles: Record<Variant, string> = {
  primary:
    'inline-flex h-12 items-center justify-center rounded-md bg-brand-strong px-7 text-base font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50',
  ghost:
    'inline-flex h-12 items-center justify-center rounded-md px-5 text-base font-medium text-ink transition-colors hover:bg-surface disabled:opacity-50',
  link: 'text-sm text-muted underline underline-offset-4 hover:text-ink',
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
