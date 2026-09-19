// Marco de las pantallas de acceso: título de la pantalla sobre una tarjeta blanca
export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="mb-6 text-center font-display text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <div className="rounded-lg bg-white p-6 ring-1 ring-ink/5 sm:p-8">
        {children}
      </div>
    </>
  );
}
