export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-surface">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
