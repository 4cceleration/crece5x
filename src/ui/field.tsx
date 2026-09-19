import type { ComponentProps } from 'react'

export function Field({ label, hint, className = '', ...props }: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      <input
        className={`h-12 w-full rounded-xl bg-surface px-4 text-ink outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-brand ${className}`}
        {...props}
      />
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Check({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="flex items-start gap-3 text-ink">
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-brand-strong" {...props} />
      <span>{label}</span>
    </label>
  )
}
