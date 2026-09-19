import { googleSignInAction } from './actions'

// Botón "Continuar con Google" + separador. Va fuera del formulario de correo (no se anidan formularios)
export function GoogleButton() {
  return (
    <>
      <form action={googleSignInAction}>
        <button className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-white font-medium text-ink ring-1 ring-ink/15 transition-shadow hover:ring-ink/30">
          <svg viewBox="0 0 24 24" aria-hidden className="size-5">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
            />
            <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"
            />
          </svg>
          Continuar con Google
        </button>
      </form>
      <p className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-ink/10" />o con su correo
        <span className="h-px flex-1 bg-ink/10" />
      </p>
    </>
  )
}
