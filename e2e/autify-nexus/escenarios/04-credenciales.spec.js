// Autify Nexus — Validación de credenciales.
const { test, expect } = require('@playwright/test')

test('Los requisitos de la contraseña se marcan mientras se escribe', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Contraseña', { exact: true }).fill('medellin2026')
  await expect(page.locator('[data-regla="minuscula"]')).toHaveAttribute('data-cumple', 'true')
  await expect(page.locator('[data-regla="numero"]')).toHaveAttribute('data-cumple', 'true')
  await expect(page.locator('[data-regla="mayuscula"]')).toHaveAttribute('data-cumple', 'false')
  await page.getByLabel('Contraseña', { exact: true }).fill('Medellin2026')
  await expect(page.locator('[data-regla="mayuscula"]')).toHaveAttribute('data-cumple', 'true')
})

test('Contraseña sin mayúscula no se envía', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nombre completo').fill('Ana Pérez')
  await page.getByLabel('Email').fill(`nexus+${Date.now()}@gmail.com`)
  await page.getByLabel('Contraseña', { exact: true }).fill('medellin2026')
  await page.getByLabel('Confirmar contraseña').fill('medellin2026')
  await page.getByRole('button', { name: 'Crear cuenta gratis' }).click()
  await expect(page.getByText('La contraseña debe incluir al menos una letra mayúscula')).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})

test('Una sesión corrupta se explica en Ingresar', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.setItem('cp_token', 'token.falso.invalido')
    localStorage.setItem('cp_user', JSON.stringify({ id: 'x', name: 'Ana', email: 'a@gmail.com', role: 'USER' }))
  })
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('status')).toContainText('Tu sesión ya no es válida')
})
