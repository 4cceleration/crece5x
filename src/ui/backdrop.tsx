// Fondo decorativo con manchas verdes difuminadas; da profundidad al efecto vidrio
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface">
      <div className="absolute -left-32 -top-40 size-[30rem] rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -right-32 top-1/3 size-[26rem] rounded-full bg-[#A7D7C0]/35 blur-3xl" />
      <div className="absolute -bottom-48 left-1/4 size-[28rem] rounded-full bg-[#D9EFE3] blur-3xl" />
    </div>
  )
}
