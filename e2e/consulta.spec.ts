import { existsSync, readdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('consulta completa: registro → clasificar → revisar → examinar → resultado → agenda', async ({ page }) => {
  const email = `e2e+${Date.now()}@crece.test`

  await page.goto('/registro')
  await page.getByLabel('Tu nombre').fill('Ana Contadora')
  await page.getByLabel('Empresa').fill('Panadería La Espiga SAS')
  await page.getByLabel('NIT').fill('900123456')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña').fill('Clave12345!')
  await page.getByLabel(/Autorizo el tratamiento/).check()
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  // Tras registrarse entra directo al formulario de la consulta
  await expect(page).toHaveURL(/\/consulta\/.+\/clasificar$/)
  await page.getByLabel('Activos totales').fill('800000000')
  await page.getByLabel('Ingresos del último año').fill('1500000000')
  await page.getByLabel('Número de empleados').fill('25')
  await page.getByRole('button', { name: 'Clasificar' }).click()
  await expect(page.getByRole('heading', { name: 'Grupo 2' })).toBeVisible()
  await page.getByRole('link', { name: 'Continuar' }).click()

  // Banderas y preguntas: "Sí" a todo, una por pantalla
  for (let i = 0; i < 60 && !page.url().includes('/examinar'); i++) {
    const before = await page.locator('[data-step]').getAttribute('data-step')
    await page.getByRole('button', { name: 'Sí', exact: true }).click()
    await page.waitForFunction(
      (prev) => location.pathname.endsWith('/examinar') || document.querySelector('[data-step]')?.getAttribute('data-step') !== prev,
      before,
    )
  }
  await expect(page).toHaveURL(/\/examinar$/)

  await page.locator('input[type=file]').setInputFiles('.data/e2e-fixture.xlsx')
  await expect(page.getByText('e2e-fixture.xlsx')).toBeVisible()
  // exact: también existe "Ver resultado sin analizar", que contiene la misma palabra
  await page.getByRole('button', { name: 'Analizar', exact: true }).click()

  await expect(page).toHaveURL(/\/resultado$/)
  await expect(page.locator('main')).toContainText('94')
  await expect(page.locator('main')).toContainText('de 100')
  await expect(page.getByText('Saludable')).toBeVisible()
  // El plan de acción está bloqueado en pantalla: se envía al correo a pedido
  await expect(page.getByText('No se evidencia el cálculo del impuesto diferido')).toHaveCount(0)
  await page.getByRole('button', { name: 'Enviármelo al correo' }).click()
  await expect(page.getByText('Enviado. Revise su correo.')).toBeVisible()

  await page.getByRole('link', { name: 'Hablar con un consultor' }).click()
  await page.locator('main table a').first().click() // día en el calendario
  await page.locator('main ul a').first().click() // hora
  await page.getByRole('button', { name: 'Confirmar cita' }).click()
  await expect(page.getByRole('link', { name: 'Agregar a mi calendario' })).toBeVisible()
  await expect(page.getByText('Laura Consultora', { exact: false })).toBeVisible()

  expect(existsSync('.data/e2e-emails')).toBe(true)
  const emails = readdirSync('.data/e2e-emails')
  expect(emails.filter((f) => f.endsWith('.html')).length).toBeGreaterThanOrEqual(3) // reporte + cita empresa + cita consultor
  expect(emails.some((f) => f.endsWith('reporte-crece.pdf'))).toBe(true)
})
