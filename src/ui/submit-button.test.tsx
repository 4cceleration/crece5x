import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const form = vi.hoisted(() => ({ pending: false }))
vi.mock('react-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-dom')>()),
  useFormStatus: () => ({ pending: form.pending }),
}))

import { SubmitButton } from './submit-button'

function render(pending: boolean, pendingLabel?: string) {
  form.pending = pending
  return renderToStaticMarkup(<SubmitButton pendingLabel={pendingLabel}>Entrar</SubmitButton>)
}

describe('SubmitButton', () => {
  it('en reposo muestra su texto y deja el spinner colapsado', () => {
    const html = render(false, 'Entrando…')
    expect(html).toContain('aria-busy="false"')
    expect(html).not.toContain('disabled=""')
    expect(html).toContain('max-w-0 opacity-0')
    expect(html).toContain('<span class="col-start-1 row-start-1">Entrar</span>')
    expect(html).toContain('<span class="col-start-1 row-start-1 invisible">Entrando…</span>')
  })

  it('al enviar se deshabilita, abre el spinner y cambia al texto pendiente', () => {
    const html = render(true, 'Entrando…')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('disabled=""')
    expect(html).toContain('max-w-6 opacity-100')
    expect(html).toContain('<span class="col-start-1 row-start-1 invisible">Entrar</span>')
    expect(html).toContain('<span class="col-start-1 row-start-1">Entrando…</span>')
  })

  it('sin pendingLabel mantiene el texto visible mientras envía', () => {
    const html = render(true)
    expect(html).toContain('<span class="col-start-1 row-start-1">Entrar</span>')
    expect(html).toContain('max-w-6 opacity-100')
  })
})
