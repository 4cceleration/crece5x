export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
        <p className="mb-8 text-center font-display text-2xl font-semibold tracking-tight">
          crece<span className="text-brand">.</span>
        </p>
        <div className="rounded-lg bg-white p-6 ring-1 ring-ink/5 sm:p-8">{children}</div>
      </main>
    </div>
  )
}
