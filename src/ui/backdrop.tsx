// Fondo decorativo: degradado verde grisáceo (sin blanco) con manchas verdes difuminadas que dan profundidad al vidrio
export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-linear-160 from-[#E3EEE7] via-[#EAF1EC] to-[#DCE9E1]"
    >
      <div className="absolute -left-32 -top-40 size-[32rem] rounded-full bg-brand/30 blur-3xl" />
      <div className="absolute -right-32 top-1/3 size-[28rem] rounded-full bg-[#9ED1B8]/45 blur-3xl" />
      <div className="absolute -bottom-48 left-1/4 size-[30rem] rounded-full bg-[#BFE0CE]/70 blur-3xl" />
    </div>
  )
}
