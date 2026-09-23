import { readdirSync, readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

// Registro, cómo lleva la contabilidad, clasificación y "Sí" a todo el cuestionario, hasta Examinar
async function hastaExaminar(page: Page, email: string, contabilidad: RegExp[]) {
  await page.goto('/registro')
  await page.getByLabel('Tu nombre').fill('Ana Gerente')
  await page.getByLabel('Empresa').fill('Panadería La Espiga SAS')
  await page.getByLabel('NIT').fill('900123456')
  await page.getByLabel('Correo', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave12345!')
  await page.getByLabel(/Autorizo el tratamiento/).check()
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL(/\/consulta\/.+\/clasificar$/)
  for (const option of contabilidad) await page.getByRole('button', { name: option }).click()
  await page.getByLabel('Activos totales').fill('800000000')
  await page.getByLabel('Ingresos del último año').fill('1500000000')
  await page.getByLabel('Número de empleados').fill('25')
  await page.getByRole('button', { name: /Confirmar Grupo 2/ }).click()
  await page.getByRole('link', { name: 'Continuar' }).click()

  for (let i = 0; i < 60 && !page.url().includes('/examinar'); i++) {
    const before = await page.locator('[data-step]').getAttribute('data-step')
    await page.getByRole('button', { name: 'Sí', exact: true }).click()
    await page.waitForFunction(
      (prev) => location.pathname.endsWith('/examinar') || document.querySelector('[data-step]')?.getAttribute('data-step') !== prev,
      before,
    )
  }
  await expect(page).toHaveURL(/\/examinar$/)
}

test('contabilidad empírica: escribe sus cifras y recibe un resultado estimado', async ({ page }) => {
  await hastaExaminar(page, `e2e+empirica${Date.now()}@crece.test`, [/De forma empírica/])

  await expect(page.getByRole('heading', { name: 'Cuéntenos las cifras que tiene a la mano' })).toBeVisible()
  await page.getByLabel('Ventas de los últimos 3 meses').fill('300000000')
  await page.getByLabel('Gastos de los últimos 3 meses').fill('240000000')
  await page.getByLabel('Dinero disponible hoy').fill('120000000')
  await page.getByLabel('Préstamos con bancos o terceros').fill('100000000')
  await page.getByRole('button', { name: 'Analizar mis cifras' }).click()

  await expect(page).toHaveURL(/\/resultado$/)
  await expect(page.getByText('Su mayor riesgo es no tener estados financieros.')).toBeVisible()
  await expect(page.getByText(/Resultado estimado/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Armar mi primer cierre' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Sus cifras/ })).toBeVisible()
})

test('los tiene mi contador: lo invita, él los sube sin cuenta y la empresa analiza', async ({ page, browser }) => {
  const contador = `contador${Date.now()}@firma.test`
  await hastaExaminar(page, `e2e+contador${Date.now()}@crece.test`, [/Contabilidad formal/, /Los tiene mi contador/])

  await expect(page.getByRole('heading', { name: 'Su contador puede subirlos por usted' })).toBeVisible()
  await page.getByLabel('Correo de su contador').fill(contador)
  await page.getByRole('button', { name: 'Enviar invitación' }).click()
  await expect(page.getByText(`Invitación enviada a ${contador}`, { exact: false })).toBeVisible()

  const invitation = readdirSync('.data/e2e-emails').find((f) => f.endsWith('.html') && f.includes(contador.split('@')[0]))
  expect(invitation).toBeDefined()
  const link = readFileSync(`.data/e2e-emails/${invitation}`, 'utf8').match(/href="([^"]*\/contador\/[^"]+)"/)![1]

  // El contador entra sin sesión
  const ctx = await browser.newContext()
  const accountant = await ctx.newPage()
  await accountant.goto(link)
  await expect(accountant.getByRole('heading', { name: /Suba los estados financieros de Panadería La Espiga SAS/ })).toBeVisible()
  await accountant.locator('input[type=file]').setInputFiles('.data/e2e-fixture.xlsx')
  await expect(accountant.getByText('e2e-fixture.xlsx')).toBeVisible()
  await accountant.getByRole('button', { name: /Listo, avisar a/ }).click()
  await expect(accountant.getByText('Le avisamos a Panadería La Espiga SAS', { exact: false })).toBeVisible()
  await accountant.goto('/contador/token-que-no-existe')
  await expect(accountant.getByRole('heading', { name: 'Este enlace ya no sirve' })).toBeVisible()
  await ctx.close()

  expect(readdirSync('.data/e2e-emails').some((f) => f.includes('su-contador-ya-subio'))).toBe(true)

  await page.reload()
  await expect(page.getByText('Su contador subió un archivo', { exact: false })).toBeVisible()
  await expect(page.getByText('· de su contador')).toBeVisible()
  await page.getByRole('button', { name: 'Analizar', exact: true }).click()
  await expect(page).toHaveURL(/\/resultado$/)
  await expect(page.locator('main')).toContainText('de 100')
})
