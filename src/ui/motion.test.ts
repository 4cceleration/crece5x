import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

describe('movimiento (globals.css)', () => {
  it('define los tokens y las animaciones que documenta el comentario', () => {
    for (const token of [
      '--transition-duration-fast',
      '--transition-duration-base',
      '--transition-duration-slow',
      '--ease-out-soft',
      '--animate-enter',
      '--animate-fade',
      '--animate-spinner',
    ]) {
      expect(css, token).toContain(`${token}:`)
    }
    for (const name of ['fade-slide-up', 'fade-in', 'spin-round']) {
      expect(css, name).toContain(`@keyframes ${name}`)
    }
  })

  it('mantiene las duraciones de transición entre 150 y 250 ms', () => {
    const ms = [...css.matchAll(/--transition-duration-(?:fast|base|slow):\s*(\d+)ms/g)].map((m) => Number(m[1]))
    expect(ms).toHaveLength(3)
    for (const value of ms) {
      expect(value).toBeGreaterThanOrEqual(150)
      expect(value).toBeLessThanOrEqual(250)
    }
  })

  it('desactiva animaciones y transiciones con prefers-reduced-motion', () => {
    const block = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(block).toMatch(/animation-duration:\s*0?\.01ms\s*!important/)
    expect(block).toMatch(/transition-duration:\s*0?\.01ms\s*!important/)
  })
})
