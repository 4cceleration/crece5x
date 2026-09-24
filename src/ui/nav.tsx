import Link from 'next/link'
import { signOutAction } from '@/app/(auth)/actions'
import type { Role } from '@/domain/types'
import { Icon, type IconName } from './icons'
import { NavLink } from './nav-link'

const NAV: Record<Role, { href: string; label: string; icon: IconName }[]> = {
  empresa: [
    { href: '/inicio', label: 'Inicio', icon: 'inicio' },
    { href: '/analitica', label: 'Analítica', icon: 'analitica' },
    { href: '/academia', label: 'Academia', icon: 'academia' },
    { href: '/agenda', label: 'Agenda', icon: 'agenda' },
    { href: '/perfil', label: 'Perfil', icon: 'persona' },
  ],
  consultor: [
    { href: '/consultor', label: 'Agenda', icon: 'agenda' },
    { href: '/consultor/disponibilidad', label: 'Disponibilidad', icon: 'disponibilidad' },
    { href: '/perfil', label: 'Perfil', icon: 'persona' },
  ],
}

export function Nav({ role }: { role: Role }) {
  return (
    <header className="glass sticky top-0 z-20">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          crece<span className="text-brand">5x</span>
        </Link>
        <nav aria-label="Principal" className="-mr-3 flex items-center overflow-x-auto text-sm">
          {NAV[role].map((item) => (
            <NavLink key={item.href} href={item.href}>
              <Icon name={item.icon} size={18} />
              <span className="max-sm:sr-only">{item.label}</span>
            </NavLink>
          ))}
          <form action={signOutAction}>
            <button className="flex items-center gap-1.5 rounded-md px-3 py-2 text-muted transition-[color] hover:text-ink focus-visible:-outline-offset-2">
              <Icon name="salir" size={18} />
              <span className="max-sm:sr-only">Salir</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
