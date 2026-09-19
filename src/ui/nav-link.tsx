'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active =
    pathname === href ||
    (href !== '/admin' && href !== '/consultor' && pathname.startsWith(`${href}/`))

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rounded-md px-3 py-2 transition-colors ${
        active ? 'font-medium text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}
