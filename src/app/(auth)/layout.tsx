import { Backdrop } from '@/ui/backdrop'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Backdrop />
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">{children}</main>
    </>
  )
}
