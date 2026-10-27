// Autify Nexus — Inicio de sesión.
const { test, expect } = require('@playwright/test')

test('Inicio de sesión correcto del administrador', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL ?? 'admin@celularpro.co')
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.ADMIN_PASSWORD ?? 'admin1234')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('link', { name: 'Mi cuenta' })).toBeVisible()
})

test('Inicio de sesión con contraseña incorrecta muestra el error y no entra', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL ?? 'admin@celularpro.co')
  await page.getByLabel('Contraseña', { exact: true }).fill('NoEsLaClave1')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('alert')).toContainText('Credenciales inválidas')
  await expect(page).toHaveURL(/\/login$/)
})

test('Inicio de sesión acepta el correo en mayúsculas', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill((process.env.ADMIN_EMAIL ?? 'admin@celularpro.co').toUpperCase())
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.ADMIN_PASSWORD ?? 'admin1234')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('Cerrar sesión vuelve a Ingresar y protege Mi cuenta', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL ?? 'admin@celularpro.co')
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.ADMIN_PASSWORD ?? 'admin1234')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})
