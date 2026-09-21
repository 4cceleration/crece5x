import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

const MAILS = '.data/e2e-emails'

// Lee el código del correo que acaba de llegar a esa dirección
function codeSentTo(address: string): string {
  const files = readdirSync(MAILS)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ f, html: readFileSync(join(MAILS, f), 'utf8') }))
    .filter((m) => m.html.includes(`<!-- Para: ${address}`) && m.html.includes('Confirme su correo nuevo'))
  const last = files.at(-1)
  if (!last) throw new Error(`No llegó el código a ${address}`)
  const code = last.html.match(/letter-spacing:8px[^>]*>(\d{6})</)
  if (!code) throw new Error('El correo no trae el código')
  return code[1]
}

test('perfil: cambio de correo con código, contraseña y preferencias', async ({ page }) => {
  const email = `perfil+${Date.now()}@crece.test`
  const nuevo = `perfil-nuevo+${Date.now()}@crece.test`

  await page.goto('/registro')
  await page.getByLabel('Tu nombre').fill('Ana Contadora')
  await page.getByLabel('Empresa').fill('Panadería La Espiga SAS')
  await page.getByLabel('NIT').fill('900') // corto a propósito
  await page.getByLabel('Correo', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave12345!')
  await page.getByLabel(/Autorizo el tratamiento/).check()
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  // El error dice qué revisar y no borra lo demás: solo la contraseña se pide otra vez
  await expect(page.getByText('El NIT debe tener al menos 5 dígitos.')).toBeVisible()
  await expect(page.getByLabel('Tu nombre')).toHaveValue('Ana Contadora')
  await expect(page.getByLabel('Empresa')).toHaveValue('Panadería La Espiga SAS')
  await expect(page.getByLabel('Correo', { exact: true })).toHaveValue(email)
  await expect(page.getByLabel(/Autorizo el tratamiento/)).toBeChecked()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('')

  // El ojo muestra la contraseña
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave12345!')
  await page.getByRole('button', { name: 'Mostrar la contraseña' }).click()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar la contraseña' }).click()

  await page.getByLabel('NIT').fill('900123456')
  // Los avisos vienen aceptados y el marketing no
  await expect(page.getByLabel(/Quiero recibir avisos de mi consulta/)).toBeChecked()
  await expect(page.getByLabel(/Quiero recibir novedades/)).not.toBeChecked()
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/clasificar$/)

  await page.goto('/perfil')
  await expect(page.getByText(email)).toBeVisible()

  // Correo: el código va a la dirección nueva
  await page.getByLabel('Correo nuevo').fill(nuevo)
  await page.getByRole('button', { name: 'Enviarme el código' }).click()
  await expect(page.getByText('Le enviamos un código al correo nuevo.')).toBeVisible()

  await page.getByLabel('Código').fill('000000')
  await page.getByRole('button', { name: 'Confirmar correo' }).click()
  await expect(page.getByText(/El código no coincide/)).toBeVisible()

  await page.getByLabel('Código').fill(codeSentTo(nuevo))
  await page.getByRole('button', { name: 'Confirmar correo' }).click()
  await expect(page.getByText('Listo, su correo quedó cambiado.')).toBeVisible()
  await expect(page.getByText(nuevo)).toBeVisible()

  // Contraseña: primero con la actual equivocada
  await page.getByLabel('Contraseña actual').fill('NoEsLaMia123!')
  await page.getByLabel(/^Contraseña nueva/).fill('ClaveNueva123!')
  await page.getByLabel('Repita la contraseña nueva').fill('ClaveNueva123!')
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await expect(page.getByText('La contraseña actual no es correcta.')).toBeVisible()

  await page.getByLabel('Contraseña actual').fill('Clave12345!')
  await page.getByLabel(/^Contraseña nueva/).fill('ClaveNueva123!')
  await page.getByLabel('Repita la contraseña nueva').fill('ClaveNueva123!')
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await expect(page.getByText(/su contraseña quedó cambiada/)).toBeVisible()

  // Preferencias de correo
  await page.getByLabel(/Novedades, contenidos y ofertas/).check()
  await page.getByLabel(/Avisos sobre mi consulta/).uncheck()
  await page.getByRole('button', { name: 'Guardar preferencias' }).click()
  await expect(page.getByText('Guardamos sus preferencias de correo.')).toBeVisible()
  await expect(page.getByLabel(/Novedades, contenidos y ofertas/)).toBeChecked()
  await expect(page.getByLabel(/Avisos sobre mi consulta/)).not.toBeChecked()

  // La contraseña nueva es la que sirve para entrar
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL(/\/entrar$/)
  await page.getByLabel('Correo', { exact: true }).fill(nuevo)
  await page.getByLabel('Contraseña', { exact: true }).fill('ClaveNueva123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).not.toHaveURL(/\/entrar$/)
})
