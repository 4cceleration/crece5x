import Link from 'next/link'
import { signOutAction } from '@/app/(auth)/actions'
import type { Role } from '@/domain/types'
import { NavLink } from './nav-link'

const NAV: Record<Role, { href: string; label: string }[]> = {
  empresa: [
    { href: '/inicio', label: 'Inicio' },
    { href: '/academia', label: 'Academia' },
    { href: '/agenda', label: 'Agenda' },
  ],
  consultor: [
    { href: '/consultor', label: 'Agenda' },
    { href: '/consultor/disponibilidad', label: 'Disponibilidad' },
  ],
  admin: [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/preguntas', label: 'Preguntas' },
    { href: '/admin/ajustes', label: 'Ajustes' },
    { href: '/admin/usuarios', label: 'Usuarios' },
  ],
}

export function Nav({ role }: { role: Role }) {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
      <Link href="/" className="font-display text-xl font-semibold tracking-tight">
        crece<span className="text-brand">.</span>
      </Link>
      <nav aria-label="Principal" className="-mr-3 flex items-center overflow-x-auto text-sm">
        {NAV[role].map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
        <form action={signOutAction}>
          <button className="rounded-full px-3 py-2 text-muted hover:text-ink">Salir</button>
        </form>
      </nav>
    </header>
  )
}
