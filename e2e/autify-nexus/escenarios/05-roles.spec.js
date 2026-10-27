// Autify Nexus — Control de roles.
const { test, expect } = require('@playwright/test')

test('Sin sesión, el panel de administración pide iniciar sesión', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
})

test('Un cliente no entra al panel de administración', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nombre completo').fill('Ana Pérez')
  await page.getByLabel('Email').fill(`nexus+${Date.now()}@gmail.com`)
  await page.getByLabel('Contraseña', { exact: true }).fill('Medellin2026')
  await page.getByLabel('Confirmar contraseña').fill('Medellin2026')
  await page.getByRole('button', { name: 'Crear cuenta gratis' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/unauthorized$/)
  await expect(page.getByRole('heading', { name: 'Acceso no autorizado' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Panel admin' })).toHaveCount(0)
})

test('El administrador entra al panel', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL ?? 'admin@celularpro.co')
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.ADMIN_PASSWORD ?? 'admin1234')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByRole('link', { name: 'Panel admin' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Panel' })).toBeVisible()
})
