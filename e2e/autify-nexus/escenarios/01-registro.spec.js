// Autify Nexus — Registro de usuario.
// Cada test() se importa en Nexus como un escenario independiente.
const { test, expect } = require('@playwright/test')

test('Registro correcto con correo de Gmail lleva a Mi cuenta', async ({ page }) => {
  const correo = `nexus+${Date.now()}@gmail.com`
  await page.goto('/register')
  await page.getByLabel('Nombre completo').fill('Ana Pérez')
  await page.getByLabel('Email').fill(correo)
  await page.getByLabel('Contraseña', { exact: true }).fill('Medellin2026')
  await page.getByLabel('Confirmar contraseña').fill('Medellin2026')
  await page.getByRole('button', { name: 'Crear cuenta gratis' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hola, Ana')
  await expect(page.getByText(correo)).toBeVisible()
})

test('Registro rechaza un correo de dominio no permitido sin enviar', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nombre completo').fill('Ana Pérez')
  await page.getByLabel('Email').fill(`nexus+${Date.now()}@empresa.com`)
  await page.getByLabel('Contraseña', { exact: true }).fill('Medellin2026')
  await page.getByLabel('Confirmar contraseña').fill('Medellin2026')
  await page.getByRole('button', { name: 'Crear cuenta gratis' }).click()
  await expect(page.getByText('Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud.')).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})

test('Registro rechaza confirmación distinta', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nombre completo').fill('Ana Pérez')
  await page.getByLabel('Email').fill(`nexus+${Date.now()}@gmail.com`)
  await page.getByLabel('Contraseña', { exact: true }).fill('Medellin2026')
  await page.getByLabel('Confirmar contraseña').fill('Medellin2027')
  await page.getByRole('button', { name: 'Crear cuenta gratis' }).click()
  await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})
