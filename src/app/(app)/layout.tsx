import { requireUser } from '@/lib/session'
import { Backdrop } from '@/ui/backdrop'
import { Nav } from '@/ui/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <>
      <Backdrop />
      <Nav role={user.role} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">{children}</main>
    </>
  )
}
