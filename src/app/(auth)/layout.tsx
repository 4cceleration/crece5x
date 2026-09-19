export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <p className="mb-12 font-display text-xl font-semibold tracking-tight">
        crece<span className="text-brand">.</span>
      </p>
      {children}
    </main>
  )
}
