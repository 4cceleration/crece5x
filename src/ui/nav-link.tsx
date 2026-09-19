'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active =
    pathname === href ||
    (href !== '/admin' && href !== '/consultor' && pathname.startsWith(`${href}/`))

  // El foco va hacia adentro (offset negativo): la barra de navegación hace scroll y recortaría un anillo exterior
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative rounded-md px-3 py-2 transition-[color] focus-visible:-outline-offset-2 ${
        active ? 'text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
      <span
        aria-hidden
        className={`absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-brand transition-[scale,opacity] duration-base ${
          active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
        }`}
      />
    </Link>
  )
}
