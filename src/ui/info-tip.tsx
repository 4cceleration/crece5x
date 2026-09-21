import { Icon } from './icons'

// Ayuda contextual: icono que muestra un globo al pasar el mouse o al hacer clic / tocar (foco), sin JavaScript
export function InfoTip({ text, label = '¿Qué significa?' }: { text: string; label?: string }) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand-soft hover:text-brand-strong focus-visible:bg-brand-soft focus-visible:text-brand-strong"
      >
        <Icon name="info" size={20} />
      </button>
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute right-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md bg-ink px-4 py-3 text-left text-sm leading-relaxed text-canvas opacity-0 shadow-lg transition-[opacity,translate,visibility] duration-base group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <p className="mb-1 font-semibold">{label}</p>
        {text}
      </div>
    </div>
  )
}
