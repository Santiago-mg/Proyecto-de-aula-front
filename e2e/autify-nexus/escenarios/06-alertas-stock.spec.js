// Autify Nexus — Alertas de stock bajo.
const { test, expect } = require('@playwright/test')

test('El administrador ve la página de alertas de stock', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL ?? 'admin@celularpro.co')
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.ADMIN_PASSWORD ?? 'admin1234')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto('/admin/alerts')
  // Hay alertas abiertas o el aviso de que no hay ninguna: uno de los dos debe estar
  await expect(page.locator('#alertas-lista, #alertas-vacio')).toBeVisible()
  await expect(page).toHaveTitle('Alertas — Administración · CelularPro')
})

test('Un cliente no puede ver las alertas de stock', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nombre completo').fill('Ana Pérez')
  await page.getByLabel('Email').fill(`nexus+${Date.now()}@gmail.com`)
  await page.getByLabel('Contraseña', { exact: true }).fill('Medellin2026')
  await page.getByLabel('Confirmar contraseña').fill('Medellin2026')
  await page.getByRole('button', { name: 'Crear cuenta gratis' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto('/admin/alerts')
  await expect(page).toHaveURL(/\/unauthorized$/)
})
