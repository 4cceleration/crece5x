import { expect, test } from '@playwright/test'

test('academia: cada guía trae su estructura y el glosario enlaza a las guías', async ({ page }) => {
  await page.goto('/registro')
  await page.getByLabel('Tu nombre').fill('Ana Lectora')
  await page.getByLabel('Empresa').fill('Ferretería El Tornillo SAS')
  await page.getByLabel('NIT').fill('900654321')
  await page.getByLabel('Correo', { exact: true }).fill(`e2e+academia${Date.now()}@crece.test`)
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave12345!')
  await page.getByLabel(/Autorizo el tratamiento/).check()
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/consulta\/.+\/clasificar$/)

  // Una guía: título, resumen y las siete secciones, con el ejemplo en cifras
  await page.goto('/academia/inventarios')
  await expect(page.getByRole('heading', { level: 1, name: 'Inventarios' })).toBeVisible()
  await expect(page.getByText('La mercancía se registra por lo que costó')).toBeVisible()
  for (const section of [
    'Por qué le importa',
    'Lo que pide la norma',
    'Un ejemplo',
    'Paso a paso',
    'Error frecuente',
    'Revise antes del cierre',
    'Para su contador',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible()
  }
  await expect(page.getByText('Lo que realmente vale')).toBeVisible()

  await page.getByRole('button', { name: 'Marcar como leída' }).click()
  await expect(page).toHaveURL(/\/academia$/)
  await expect(page.getByRole('link', { name: /Inventarios/ })).toContainText('Leída')

  // El glosario: agrupado por tema y cada término lleva a su guía
  await page.goto('/academia/glosario')
  for (const group of ['Lo básico', 'Medición', 'Cierre y reportes', 'Impuestos', 'Colombia']) {
    await expect(page.getByRole('heading', { level: 2, name: group })).toBeVisible()
  }
  await page.getByRole('link', { name: /Ver la guía: Inventarios/ }).click()
  await expect(page).toHaveURL(/\/academia\/inventarios$/)
})
