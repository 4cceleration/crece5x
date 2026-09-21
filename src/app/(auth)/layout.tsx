import { Backdrop } from '@/ui/backdrop'
import { ThemeToggle } from '@/ui/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Backdrop />
      <div className="absolute right-3 top-3">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">{children}</main>
    </>
  )
}
